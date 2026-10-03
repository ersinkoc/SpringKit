import type { SpringConfig } from './config.js'
import { defaultConfig } from './config.js'
import {
  springCoefficients,
  stepSpringInto,
  type SimulationResult,
  type SpringCoefficients,
} from './physics.js'
import { globalLoop, type Animatable, AnimationState } from '../animation/loop.js'
import { clamp } from '../utils/math.js'
import { validateSpringConfig, validateAnimationValue, warnOnce } from '../utils/warnings.js'

/**
 * Invoke a user callback with error isolation so a throwing callback can't
 * leave the spring stuck in the Running state (and never resolve `finished`).
 */
function safeCall<A extends unknown[]>(fn: ((...args: A) => void) | undefined, ...args: A): void {
  if (!fn) return
  try {
    fn(...args)
  } catch (e) {
    console.error('[SpringKit] Spring callback error:', e)
  }
}

/**
 * Step result shared by every spring so update() allocates nothing. Safe to
 * share: update() copies the result out before running any user callback.
 */
const stepScratch: SimulationResult = { position: 0, velocity: 0, isRest: false }

/**
 * Spring animation control interface
 */
export interface SpringAnimation {
  /** Start the animation */
  start(): SpringAnimation
  /** Stop the animation immediately (resolves the current `finished`) */
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
  /**
   * Promise that resolves when the current run completes or is stopped.
   * Each start() after it has settled creates a new pending promise.
   */
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
  private lastUpdateTime: number = 0
  private destroyed = false
  // Bumped by every retarget (set, setWithVelocity, reverse), so update()
  // can tell that its onUpdate callback retargeted the spring
  private retargets = 0
  // Per-frame constants derived once from the physics config (which never
  // changes after construction)
  private readonly coefficients: SpringCoefficients
  private readonly restSpeed: number
  private readonly restDelta: number

  finished!: Promise<void>

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
    // A NaN/Infinity initial velocity would make the spring never settle
    this.velocity = validateAnimationValue(config.velocity ?? 0, 'spring.velocity')
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
    this.coefficients = springCoefficients(this.config)
    this.restSpeed = this.config.restSpeed
    this.restDelta = this.config.restDelta

    this.resetFinished()
  }

  /** Create a new pending `finished` promise for the next run */
  private resetFinished(): void {
    this.finished = new Promise((resolve) => {
      this.resolveComplete = resolve
    })
  }

  /** Resolve the current `finished` promise (once) */
  private settleFinished(): void {
    const resolve = this.resolveComplete
    this.resolveComplete = null
    resolve?.()
  }

  start(): SpringAnimation {
    if (this.destroyed) {
      warnOnce('spring.start() called after destroy(); ignored')
      return this
    }
    if (this.state === AnimationState.Running) return this

    // The previous run already settled `finished` (completed or stopped):
    // this run gets its own pending promise
    if (this.resolveComplete === null && !this.destroyed) {
      this.resetFinished()
    }

    this.state = AnimationState.Running
    this.lastUpdateTime = 0 // Reset timing on start
    safeCall(this.config.onStart)
    globalLoop.add(this)
    return this
  }

  stop(): void {
    this.state = AnimationState.Idle
    globalLoop.remove(this)
    // A stopped run never completes: settle its promise so awaiting it
    // doesn't hang forever
    this.settleFinished()
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
      this.lastUpdateTime = 0 // Reset timing on resume
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
    this.retargets++

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
    this.retargets++
  }

  setWithVelocity(to: number, velocity?: number): void {
    const validTo = validateAnimationValue(to, 'spring.setWithVelocity')

    // Update from to current position for smooth continuation
    this.from = this.position
    this.clampedFrom = this.position
    this.to = validTo
    this.clampedTo = validTo
    this.target = validTo
    this.retargets++

    // Use provided velocity or preserve current velocity
    if (velocity !== undefined) {
      this.velocity = validateAnimationValue(velocity, 'spring.setWithVelocity.velocity')
    }

    // Reset state if complete to allow re-animation from current position
    if (this.state === AnimationState.Complete) {
      this.state = AnimationState.Idle
    }

    // If not running, start the animation
    if (this.state !== AnimationState.Running) {
      this.start()
    }
  }

  update(now: number, deltaTime?: number): void {
    if (this.state !== AnimationState.Running) return

    // Calculate elapsed time since last update. On the first update after
    // start/resume there is no previous timestamp: use the loop's frame
    // delta (0 for the synchronous tick that starts an idle loop) so an
    // animation started or retargeted while the loop runs doesn't lose a
    // frame (retargeting every frame would otherwise never make progress).
    const elapsedMs = this.lastUpdateTime === 0
      ? (deltaTime ?? 0)
      : now - this.lastUpdateTime
    const elapsed = elapsedMs / 1000 // Convert to seconds
    this.lastUpdateTime = now

    // Clamp elapsed time to prevent physics explosions after tab suspension
    // (and ignore negative deltas from out-of-order timestamps)
    const MAX_DELTA_TIME = 1 / 15 // Maximum 15fps worth of simulation per frame
    const safeElapsed = Math.min(Math.max(elapsed, 0), MAX_DELTA_TIME)

    // Advance with the exact closed-form solution of the spring equation:
    // frame-rate independent, no integration error, one evaluation per frame
    const result = stepSpringInto(
      stepScratch,
      this.position,
      this.velocity,
      this.target,
      this.coefficients,
      this.restSpeed,
      this.restDelta,
      safeElapsed
    )
    const isRest = result.isRest

    this.position = result.position
    this.velocity = result.velocity

    // Handle clamping
    if (this.config.clamp) {
      const min = Math.min(this.clampedFrom, this.clampedTo)
      const max = Math.max(this.clampedFrom, this.clampedTo)
      this.position = clamp(this.position, min, max)
    }

    // Emit update (safeCall inlined: no rest-args array per frame)
    const onUpdate = this.config.onUpdate
    const retargets = this.retargets
    if (onUpdate) {
      try {
        onUpdate(this.position)
      } catch (e) {
        console.error('[SpringKit] Spring callback error:', e)
      }
    }

    // Check rest state. onUpdate may have retargeted the spring (it then
    // keeps running toward its new target) or stopped / paused it.
    if (isRest && this.state === AnimationState.Running && this.retargets === retargets) {
      this.state = AnimationState.Complete
      globalLoop.remove(this)
      this.position = this.target // Ensure we end exactly at target
      this.velocity = 0
      safeCall(this.config.onUpdate, this.position)
      safeCall(this.config.onComplete)
      safeCall(this.config.onRest)
      this.settleFinished()
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
    this.destroyed = true
    // stop() also resolves `finished`, so pending handlers don't leak
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
