import { globalLoop, type Animatable, AnimationState } from './loop.js'
import { clamp } from '../utils/math.js'

/**
 * Decay animation configuration interface
 */
export interface DecayConfig {
  /** Initial velocity */
  velocity: number
  /** Deceleration factor (0-1, higher = slower decay) */
  deceleration?: number
  /** Optional clamp range [min, max] */
  clamp?: [number, number]
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
  /** Stop the decay animation */
  stop(): void
  /** Promise that resolves when complete */
  finished: Promise<void>
}

/**
 * Decay animation implementation
 * Simulates natural momentum/deceleration
 */
class DecayAnimationImpl implements DecayAnimation, Animatable {
  private value: number
  private velocity: number
  private deceleration: number
  private clampRange: [number, number] | undefined
  private state: AnimationState = AnimationState.Idle
  private rafId: number | null = null
  private resolveComplete: (() => void) | null = null
  private config: DecayConfig

  finished: Promise<void>

  constructor(config: DecayConfig) {
    this.value = 0
    this.velocity = config.velocity
    this.deceleration = config.deceleration ?? 0.998
    this.clampRange = config.clamp
    this.state = AnimationState.Idle
    this.config = config

    this.finished = new Promise((resolve) => {
      this.resolveComplete = resolve
    })
  }

  start(): DecayAnimation {
    if (this.state === AnimationState.Running) return this
    this.state = AnimationState.Running
    globalLoop.add(this)
    return this
  }

  stop(): void {
    this.state = AnimationState.Idle
    globalLoop.remove(this)
  }

  update(_now: number): void {
    if (this.state !== AnimationState.Running) return

    // Apply deceleration
    this.velocity *= this.deceleration
    this.value += this.velocity

    // Apply clamp
    if (this.clampRange) {
      const [min, max] = this.clampRange
      this.value = clamp(this.value, min, max)

      // Stop if we hit a boundary with velocity in that direction
      if ((this.value <= min && this.velocity < 0) || (this.value >= max && this.velocity > 0)) {
        this.velocity = 0
      }
    }

    this.config.onUpdate?.(this.value)

    // Check if stopped
    if (Math.abs(this.velocity) < 0.01) {
      this.state = AnimationState.Complete
      globalLoop.remove(this)
      this.config.onComplete?.()
      this.resolveComplete?.()
    }
  }

  isComplete(): boolean {
    return this.state === AnimationState.Complete
  }

  destroy(): void {
    this.stop()
    this.config.onUpdate = undefined
    this.config.onComplete = undefined
  }
}

/**
 * Create a decay animation
 *
 * @param config - Decay configuration
 * @returns Decay animation controller
 *
 * @example
 * ```ts
 * const anim = decay({
 *   velocity: 1000,
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
