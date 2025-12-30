import type { SpringConfig } from './config.js'
import { defaultConfig } from './config.js'
import { spring, type SpringAnimation } from './spring.js'

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

  constructor(initial: number, config: SpringConfig = {}) {
    this.value = initial
    this.config = { ...defaultConfig, ...config }

    this.finishedPromise = new Promise((resolve) => {
      this.resolveComplete = resolve
    })
  }

  get(): number {
    return this.value
  }

  getVelocity(): number {
    return this.currentAnimation?.getVelocity() ?? 0
  }

  set(to: number, config: Partial<SpringConfig> = {}): void {
    // Cancel existing animation
    if (this.currentAnimation) {
      this.currentAnimation.destroy()
      this.currentAnimation = null
    }

    // Create new promise for this animation
    this.finishedPromise = new Promise((resolve) => {
      this.resolveComplete = resolve
    })

    // Create new animation
    const mergedConfig = { ...this.config, ...config }
    const originalOnUpdate = mergedConfig.onUpdate
    const originalOnComplete = mergedConfig.onComplete

    this.currentAnimation = spring(this.value, to, {
      ...mergedConfig,
      onUpdate: (value) => {
        this.value = value
        this.notify()
        // Also call original onUpdate if provided
        originalOnUpdate?.(value)
      },
      onComplete: () => {
        originalOnComplete?.()
        if (this.resolveComplete) {
          this.resolveComplete()
        }
      },
    })

    this.currentAnimation.start()
  }

  jump(to: number): void {
    if (this.currentAnimation) {
      this.currentAnimation.destroy()
      this.currentAnimation = null
    }
    this.value = to
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
  }

  subscribe(callback: (value: number) => void): () => void {
    this.subscribers.add(callback)

    // Immediately call with current value
    callback(this.value)

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
    for (const subscriber of this.subscribers) {
      subscriber(this.value)
    }
  }

  destroy(): void {
    this.currentAnimation?.destroy()
    this.currentAnimation = null
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
