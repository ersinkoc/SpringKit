import { globalLoop, type Animatable, AnimationState } from './loop.js'
import { clamp } from '../utils/math.js'
import { validateDecayConfig, validateAnimationValue } from '../utils/warnings.js'

/** Maximum simulated time per update (ms), mirrors the global loop clamp */
const MAX_DELTA_MS = 64
/** Default deceleration per millisecond (iOS UIScrollView "normal") */
const DEFAULT_DECELERATION = 0.998
/** The animation ends once the remaining travel is below this distance */
const DEFAULT_REST_DELTA = 0.5

/**
 * Decay animation configuration interface
 */
export interface DecayConfig {
  /** Initial velocity in units per second (e.g. px/s from a drag release) */
  velocity: number
  /** Starting value (default 0) */
  from?: number
  /**
   * Fraction of velocity kept per millisecond, in (0, 1). Same scale as iOS
   * scroll views: 0.998 is "normal" (default), 0.99 is "fast".
   * Higher = glides further.
   */
  deceleration?: number
  /**
   * Adjust where the motion comes to rest, e.g. to snap a fling to a grid or
   * page. Receives the natural resting value; the initial velocity is scaled
   * so the decay lands exactly on the returned value.
   */
  modifyTarget?: (target: number) => number
  /** Optional clamp range [min, max]; motion stops at a boundary */
  clamp?: [number, number]
  /** Distance from the resting value at which the animation ends (default 0.5) */
  restDelta?: number
  /** Callback called on each update */
  onUpdate?: (value: number) => void
  /** Callback called when complete */
  onComplete?: () => void
}

/**
 * Decay animation interface
 */
export interface DecayAnimation {
  /** Start the decay animation */
  start(): DecayAnimation
  /** Stop the decay animation (resolves the current `finished`) */
  stop(): void
  /** Destroy and cleanup */
  destroy(): void
  /** Current value */
  getValue(): number
  /** Current velocity in units per second */
  getVelocity(): number
  /** Value the motion will come to rest at (after modifyTarget, before clamp) */
  readonly target: number
  /**
   * Promise that resolves when the animation completes or is stopped.
   * A start() after it has settled creates a new pending promise.
   */
  finished: Promise<void>
}

/**
 * Exponential decay: v(t) = v0 * d^t, x(t) = from + v0 * (d^t - 1) / ln(d)
 * with t in milliseconds. Evaluated in closed form from the elapsed time, so
 * it is exact and independent of the display refresh rate.
 */
class DecayAnimationImpl implements Animatable, DecayAnimation {
  private value: number
  private readonly from: number
  /** Initial velocity in units per millisecond */
  private readonly velocityMs: number
  /** ln(deceleration), always negative */
  private readonly logDecel: number
  private readonly restDelta: number
  private readonly clampRange: [number, number] | undefined
  private elapsed = 0
  private lastUpdateTime = 0
  private state: AnimationState = AnimationState.Idle
  private resolveComplete: (() => void) | null = null
  private config: DecayConfig
  private destroyed = false

  readonly target: number
  finished!: Promise<void>

  constructor(config: DecayConfig) {
    validateDecayConfig(config)

    // Own copy: destroy() clears its callbacks, which must not reach the
    // caller's object (it may be reused for another decay)
    this.config = { ...config }
    this.from = config.from !== undefined && Number.isFinite(config.from) ? config.from : 0
    this.value = this.from
    this.clampRange = config.clamp
    this.restDelta =
      config.restDelta !== undefined && config.restDelta > 0
        ? config.restDelta
        : DEFAULT_REST_DELTA

    const rawDecel = validateAnimationValue(
      config.deceleration ?? DEFAULT_DECELERATION,
      'decay.deceleration'
    )
    const deceleration =
      rawDecel > 0 && rawDecel < 1 ? rawDecel : DEFAULT_DECELERATION
    this.logDecel = Math.log(deceleration)

    let velocityMs = validateAnimationValue(config.velocity, 'decay.velocity') / 1000
    // Natural resting point: from + v0 / -ln(d)
    let target = this.from - velocityMs / this.logDecel
    if (config.modifyTarget) {
      const modified = config.modifyTarget(target)
      if (Number.isFinite(modified)) {
        target = modified
        // Scale the velocity so the decay lands exactly on the new target
        velocityMs = (target - this.from) * -this.logDecel
      }
    }
    this.velocityMs = velocityMs
    this.target = target

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

  start(): DecayAnimation {
    if (this.state === AnimationState.Running) return this
    // The previous run already settled `finished` (completed or stopped)
    if (this.resolveComplete === null && !this.destroyed) {
      this.resetFinished()
    }
    this.state = AnimationState.Running
    this.lastUpdateTime = 0 // Reset timing on start
    globalLoop.add(this)
    return this
  }

  stop(): void {
    if (this.state === AnimationState.Running) {
      this.state = AnimationState.Idle
    }
    globalLoop.remove(this)
    // A stopped run never completes: settle its promise so awaiting it
    // doesn't hang forever
    this.settleFinished()
  }

  getValue(): number {
    return this.value
  }

  getVelocity(): number {
    if (this.state === AnimationState.Complete) return 0
    return this.velocityMs * Math.exp(this.logDecel * this.elapsed) * 1000
  }

  update(now: number, deltaTime?: number): void {
    if (this.state !== AnimationState.Running) return

    // First update since start: use the loop's frame delta (see spring.ts)
    const rawElapsed = this.lastUpdateTime === 0
      ? (deltaTime ?? 0)
      : now - this.lastUpdateTime
    this.lastUpdateTime = now
    this.elapsed += Math.min(Math.max(rawElapsed, 0), MAX_DELTA_MS)

    const decayFactor = Math.exp(this.logDecel * this.elapsed)
    const velocityMs = this.velocityMs * decayFactor
    // Remaining travel until rest = v(t) / -ln(d)
    const remaining = Math.abs(velocityMs / this.logDecel)
    let done = remaining < this.restDelta

    this.value = done
      ? this.target
      : this.from + (this.velocityMs * (decayFactor - 1)) / this.logDecel

    if (this.clampRange) {
      const [min, max] = this.clampRange
      const clamped = clamp(this.value, min, max)
      if (clamped !== this.value) {
        // Hit a boundary: stop there
        this.value = clamped
        done = true
      }
    }

    try {
      this.config.onUpdate?.(this.value)
    } catch (error) {
      console.error('[SpringKit] Error in decay onUpdate callback:', error)
    }

    // Complete (unless onUpdate stopped it)
    if (done && this.state === AnimationState.Running) {
      this.state = AnimationState.Complete
      globalLoop.remove(this)
      try {
        this.config.onComplete?.()
      } catch (error) {
        console.error('[SpringKit] Error in decay onComplete callback:', error)
      }
      this.settleFinished()
    }
  }

  isComplete(): boolean {
    return this.state === AnimationState.Complete
  }

  destroy(): void {
    this.destroyed = true
    // stop() also resolves `finished`, so pending handlers don't leak
    this.stop()
    this.config.onUpdate = undefined
    this.config.onComplete = undefined
  }
}

/**
 * Create a momentum (inertia) animation that starts at `velocity` and slows
 * down exponentially — like a flicked scroll view.
 *
 * @param config - Decay configuration
 * @returns Decay animation controller
 *
 * @example
 * ```ts
 * // Fling at 1200 px/s from the current position, snapping to 100px pages
 * const anim = decay({
 *   from: x,
 *   velocity: 1200,
 *   modifyTarget: (t) => Math.round(t / 100) * 100,
 *   onUpdate: (value) => {
 *     element.style.transform = `translateX(${value}px)`
 *   },
 * })
 *
 * anim.start()
 * ```
 */
export function decay(config: DecayConfig): DecayAnimation {
  return new DecayAnimationImpl(config)
}
