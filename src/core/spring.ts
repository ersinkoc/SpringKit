import type { SpringConfig } from './config.js'
import { defaultConfig } from './config.js'
import { simulateSpring } from './physics.js'
import { globalLoop, type Animatable, AnimationState } from '../animation/loop.js'
import { clamp } from '../utils/math.js'

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
    this.from = from
    this.to = to
    this.clampedFrom = from
    this.clampedTo = to
    this.position = from
    this.velocity = config.velocity ?? 0
    this.target = to
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
    const temp = this.from
    this.from = this.to
    this.to = temp
    this.clampedFrom = this.from
    this.clampedTo = this.to
    this.target = this.to
  }

  set(to: number): void {
    this.to = to
    this.clampedTo = to
    this.target = to
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
