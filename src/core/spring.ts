import type { SpringConfig } from './config.js'
import { defaultConfig } from './config.js'
import { simulateSpring } from './physics.js'
import { globalLoop, type Animatable, AnimationState } from '../animation/loop.js'
import { clamp } from '../utils/math.js'
import { validateSpringConfig, validateAnimationValue } from '../utils/warnings.js'

/**
 * Spring animation control interface
 */
export interface SpringAnimation {
  /** Start the animation */
  start(): SpringAnimation
  /** Stop the animation immediately */
  stop(): void
  /** Pause the animation */
  pause(): void
  /** Resume the animation */
  resume(): void
  /** Reverse the animation direction */
  reverse(): void
  /** Update the target value */
  set(to: number): void
  /** Update target while preserving current velocity (for smooth interruptions) */
  setWithVelocity(to: number, velocity?: number): void
  /** Check if currently animating */
  isAnimating(): boolean
  /** Check if paused */
  isPaused(): boolean
  /** Check if complete */
  isComplete(): boolean
  /** Get current value */
  getValue(): number
  /** Get current velocity */
  getVelocity(): number
  /** Promise that resolves when complete */
  finished: Promise<void>
  /** Clean up resources */
  destroy(): void
}

/**
 * Spring animation implementation
 */
class SpringAnimationImpl implements SpringAnimation, Animatable {
  private position: number
  private velocity: number
  private target: number
  private config: SpringConfig & Required<Pick<SpringConfig, 'stiffness' | 'damping' | 'mass' | 'restSpeed' | 'restDelta'>>
  private state: AnimationState = AnimationState.Idle
  private resolveComplete: (() => void) | null = null
  private from: number
  private to: number
  private clampedFrom: number
  private clampedTo: number

  finished: Promise<void>

  constructor(
    from: number,
    to: number,
    config: SpringConfig = {}
  ) {
    // Validate config in development mode
    validateSpringConfig(config)

    // Validate input values
    this.from = validateAnimationValue(from, 'spring.from')
    this.to = validateAnimationValue(to, 'spring.to')
    this.clampedFrom = this.from
    this.clampedTo = this.to
    this.position = this.from
    this.velocity = config.velocity ?? 0
    this.target = this.to
    this.config = {
      ...defaultConfig,
      ...config,
      stiffness: config.stiffness ?? defaultConfig.stiffness!,
      damping: config.damping ?? defaultConfig.damping!,
      mass: config.mass ?? defaultConfig.mass!,
      restSpeed: config.restSpeed ?? defaultConfig.restSpeed!,
      restDelta: config.restDelta ?? defaultConfig.restDelta!,
    }

    this.finished = new Promise((resolve) => {
      this.resolveComplete = resolve
    })
  }

  start(): SpringAnimation {
    if (this.state === AnimationState.Running) return this

    this.state = AnimationState.Running
    this.config.onStart?.()
    globalLoop.add(this)
    return this
  }

  stop(): void {
    this.state = AnimationState.Idle
    globalLoop.remove(this)
  }

  pause(): void {
    if (this.state === AnimationState.Running) {
      this.state = AnimationState.Paused
      globalLoop.remove(this)
    }
  }

  resume(): void {
    if (this.state === AnimationState.Paused) {
      this.state = AnimationState.Running
      globalLoop.add(this)
    }
  }

  reverse(): void {
    // Swap from and to
    const temp = this.from
    this.from = this.to
    this.to = temp
    this.clampedFrom = this.from
    this.clampedTo = this.to
    this.target = this.to

    // Negate velocity for proper direction reversal during animation
    if (this.state === AnimationState.Running) {
      this.velocity = -this.velocity
    }
    // Position stays at current value - the animation will move toward the new target
    // This allows smooth reversal mid-animation and correct behavior when not running
  }

  set(to: number): void {
    const validTo = validateAnimationValue(to, 'spring.set')
    this.to = validTo
    this.clampedTo = validTo
    this.target = validTo
  }

  setWithVelocity(to: number, velocity?: number): void {
    const validTo = validateAnimationValue(to, 'spring.setWithVelocity')

    // Update from to current position for smooth continuation
    this.from = this.position
    this.clampedFrom = this.position
    this.to = validTo
    this.clampedTo = validTo
    this.target = validTo

    // Use provided velocity or preserve current velocity
    if (velocity !== undefined) {
      this.velocity = validateAnimationValue(velocity, 'spring.setWithVelocity.velocity')
    }
    // If not running, start the animation
    if (this.state !== AnimationState.Running) {
      this.start()
    }
  }

  update(_now: number): void {
    if (this.state !== AnimationState.Running) return

    const result = simulateSpring(
      this.position,
      this.velocity,
      this.target,
      this.config
    )

    this.position = result.position
    this.velocity = result.velocity

    // Handle clamping
    if (this.config.clamp) {
      const min = Math.min(this.clampedFrom, this.clampedTo)
      const max = Math.max(this.clampedFrom, this.clampedTo)
      this.position = clamp(this.position, min, max)
    }

    // Emit update
    this.config.onUpdate?.(this.position)

    // Check rest state
    if (result.isRest) {
      this.state = AnimationState.Complete
      globalLoop.remove(this)
      this.position = this.target // Ensure we end exactly at target
      this.config.onUpdate?.(this.position)
      this.config.onComplete?.()
      this.config.onRest?.()
      this.resolveComplete?.()
    }
  }

  isAnimating(): boolean {
    return this.state === AnimationState.Running
  }

  isPaused(): boolean {
    return this.state === AnimationState.Paused
  }

  isComplete(): boolean {
    return this.state === AnimationState.Complete
  }

  getValue(): number {
    return this.position
  }

  getVelocity(): number {
    return this.velocity
  }

  destroy(): void {
    this.stop()
    // Resolve the promise to prevent memory leaks from pending .finished handlers
    this.resolveComplete?.()
    this.resolveComplete = null
    this.config.onUpdate = undefined
    this.config.onStart = undefined
    this.config.onComplete = undefined
    this.config.onRest = undefined
  }
}

/**
 * Create a spring animation
 *
 * @param from - Starting value
 * @param to - Target value
 * @param config - Spring configuration
 * @returns Spring animation controller
 *
 * @example
 * ```ts
 * const anim = spring(0, 100, {
 *   onUpdate: (value) => {
 *     element.style.transform = `translateX(${value}px)`
 *   },
 * })
 *
 * anim.start()
 * ```
 */
export function spring(
  from: number,
  to: number,
  config?: SpringConfig
): SpringAnimation {
  return new SpringAnimationImpl(from, to, config)
}
