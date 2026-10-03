import type { SpringConfig } from './config.js'
import { defaultConfig } from './config.js'
import { spring, type SpringAnimation } from './spring.js'
import { validateAnimationValue } from '../utils/warnings.js'

/**
 * Spring value interface
 */
export interface SpringValue {
  /** Get current value */
  get(): number
  /** Get current velocity */
  getVelocity(): number
  /** Animate to a new value */
  set(to: number, config?: Partial<SpringConfig>): void
  /** Set value immediately without animation */
  jump(to: number): void
  /** Stop current animation at current position */
  stop(): void
  /** Update spring configuration */
  setConfig(config: Partial<SpringConfig>): void
  /** Subscribe to value changes */
  subscribe(callback: (value: number) => void): () => void
  /** Check if currently animating */
  isAnimating(): boolean
  /** Promise that resolves when current animation completes */
  finished: Promise<void>
  /** Clean up resources */
  destroy(): void
  /** Check if destroyed */
  isDestroyed(): boolean
}

/**
 * Spring value implementation
 */
class SpringValueImpl implements SpringValue {
  private value: number
  private config: SpringConfig
  private currentAnimation: SpringAnimation | null = null
  private subscribers = new Set<(value: number) => void>()
  private resolveComplete: (() => void) | null = null
  private finishedPromise: Promise<void>
  private destroyed: boolean = false
  private isNotifying: boolean = false
  // setConfig() was called since the running spring was created: the next
  // set() must create a spring with the new physics instead of retargeting
  private configChanged: boolean = false

  constructor(initial: number, config: SpringConfig = {}) {
    // Validate initial value
    this.value = validateAnimationValue(initial, 'createSpringValue.initial')
    this.config = { ...defaultConfig, ...config }

    // Nothing is animating yet: `finished` must not hang forever when
    // awaited before (or without) a set() call
    this.finishedPromise = Promise.resolve()
  }

  get(): number {
    return this.value
  }

  getVelocity(): number {
    return this.currentAnimation?.getVelocity() ?? 0
  }

  set(to: number, config: Partial<SpringConfig> = {}): void {
    // Guard against use after destroy
    if (this.destroyed) return

    // Validate target value
    const validTo = validateAnimationValue(to, 'SpringValue.set')

    // Retarget a running animation in place (same physics): it keeps its
    // velocity AND its slot in the animation loop. Replacing it with a new
    // spring would make a value that is retargeted on every frame (e.g. from
    // another animation's subscriber, as trails do) never advance, because a
    // spring created during a frame only starts on the next one.
    const running = this.currentAnimation
    if (
      running &&
      running.isAnimating() &&
      !running.isPaused() &&
      !this.configChanged &&
      Object.keys(config).length === 0
    ) {
      // Each set() still gets its own `finished`; the superseded one settles
      this.resolveComplete?.()
      this.finishedPromise = new Promise((resolve) => {
        this.resolveComplete = resolve
      })
      running.setWithVelocity(validTo)
      return
    }

    // Carry over the current velocity when interrupting a running animation
    // so retargeting mid-flight is smooth instead of stopping dead
    const carriedVelocity = this.currentAnimation?.isAnimating()
      ? this.currentAnimation.getVelocity()
      : undefined

    // Cancel existing animation and resolve previous promise
    if (this.currentAnimation) {
      this.currentAnimation.destroy()
      this.currentAnimation = null
      // Resolve previous animation's promise to prevent memory leak
      this.resolveComplete?.()
    }

    // Create new promise for this animation
    this.finishedPromise = new Promise((resolve) => {
      this.resolveComplete = resolve
    })

    // Create new animation
    this.configChanged = false
    const mergedConfig = { ...this.config, ...config }
    if (config.velocity === undefined && carriedVelocity !== undefined) {
      mergedConfig.velocity = carriedVelocity
    }
    const originalOnUpdate = mergedConfig.onUpdate
    const originalOnComplete = mergedConfig.onComplete

    // mergedConfig is a private copy: wire the callbacks into it directly
    // (spring() copies its config, so no further spread is needed here)
    mergedConfig.onUpdate = (value) => {
      if (this.destroyed) return
      this.value = value
      this.notify()
      // Also call original onUpdate if provided
      originalOnUpdate?.(value)
    }
    mergedConfig.onComplete = () => {
      originalOnComplete?.()
      // Resolve the promise of the latest set(): a running spring may have
      // been retargeted (see above) since it was created. Replaced springs
      // are destroyed and never complete, so this can't resolve early.
      this.resolveComplete?.()
    }
    this.currentAnimation = spring(this.value, validTo, mergedConfig)

    this.currentAnimation.start()
  }

  jump(to: number): void {
    // Guard against use after destroy
    if (this.destroyed) return

    // Prevent infinite loop if subscriber calls jump()
    if (this.isNotifying) return

    // Validate target value
    const validTo = validateAnimationValue(to, 'SpringValue.jump')

    if (this.currentAnimation) {
      this.currentAnimation.destroy()
      this.currentAnimation = null
      // The interrupted animation will never complete: settle its promise
      this.resolveComplete?.()
    }
    this.value = validTo
    this.notify()
  }

  stop(): void {
    if (this.currentAnimation) {
      this.currentAnimation.destroy()
      this.currentAnimation = null
    }
    if (this.resolveComplete) {
      this.resolveComplete()
    }
  }

  setConfig(config: Partial<SpringConfig>): void {
    this.config = { ...this.config, ...config }
    this.configChanged = true
  }

  subscribe(callback: (value: number) => void): () => void {
    this.subscribers.add(callback)

    // Immediately call with current value (with error isolation)
    try {
      callback(this.value)
    } catch (e) {
      console.error('[SpringKit] Subscriber error:', e)
    }

    return () => {
      this.subscribers.delete(callback)
    }
  }

  isAnimating(): boolean {
    return this.currentAnimation?.isAnimating() ?? false
  }

  get finished(): Promise<void> {
    return this.finishedPromise
  }

  private notify(): void {
    // Prevent re-entrant calls that could cause infinite loops
    if (this.isNotifying) return
    this.isNotifying = true

    for (const subscriber of this.subscribers) {
      try {
        subscriber(this.value)
      } catch (e) {
        console.error('[SpringKit] Subscriber error:', e)
      }
    }

    this.isNotifying = false
  }

  isDestroyed(): boolean {
    return this.destroyed
  }

  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true

    this.currentAnimation?.destroy()
    this.currentAnimation = null
    // Resolve pending promise to prevent memory leaks
    this.resolveComplete?.()
    this.resolveComplete = null
    this.subscribers.clear()
  }
}

/**
 * Create a spring value
 *
 * @param initial - Initial value
 * @param config - Spring configuration
 * @returns Spring value controller
 *
 * @example
 * ```ts
 * const x = createSpringValue(0, { stiffness: 100, damping: 10 })
 *
 * x.subscribe((value) => {
 *   element.style.transform = `translateX(${value}px)`
 * })
 *
 * x.set(100) // Animates to 100
 * x.jump(0)  // Jumps to 0 immediately
 * ```
 */
export function createSpringValue(
  initial: number,
  config?: SpringConfig
): SpringValue {
  return new SpringValueImpl(initial, config)
}

// Re-export for type usage
export { SpringValueImpl as SpringValueClass }
