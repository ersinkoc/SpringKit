/**
 * MotionValue - High-performance animated value without React re-renders
 *
 * Unlike React state, MotionValue updates don't trigger component re-renders.
 * This makes it ideal for high-frequency animations like drag, scroll, and gestures.
 *
 * @example
 * ```ts
 * const x = createMotionValue(0)
 *
 * // Subscribe to changes (no React re-render)
 * x.subscribe((value) => {
 *   element.style.transform = `translateX(${value}px)`
 * })
 *
 * // Update value
 * x.set(100)  // Triggers spring animation
 * x.jump(100) // Instant update, no animation
 * ```
 */

import { createSpringValue } from './spring-value.js'
import type { SpringConfig } from '../types.js'
import { validateAnimationValue } from '../utils/warnings.js'

export type MotionValueSubscriber<T> = (value: T) => void

/**
 * Internal storage type for subscribers. Method syntax keeps the parameter
 * bivariant so this private field doesn't make MotionValue<T> invariant in T
 * (which made e.g. MotionValue<number> unassignable to MotionValue<unknown>).
 */
type StoredSubscriber<T> = { bivarianceHack(value: T): void }['bivarianceHack']
/**
 * MotionValue events:
 * - `change`: the value changed
 * - `animationStart`: an animated `set()` started (or retargeted) an animation
 * - `animationComplete`: the animation came to rest at its target
 * - `animationCancel`: the animation was interrupted by `stop()`, `jump()`,
 *   `set(value, false)` or `destroy()`
 * - `animationEnd`: the animation ended for any reason (fires right after
 *   `animationComplete` or `animationCancel`)
 */
export type MotionValueEvent = 'change' | 'animationStart' | 'animationEnd' | 'animationComplete' | 'animationCancel'

export interface MotionValueOptions {
  /** Spring configuration for animated transitions */
  spring?: SpringConfig
}

/**
 * MotionValue class - Performant animated values
 *
 * Key advantages over React state:
 * - No re-renders on value change
 * - Direct DOM manipulation for 60fps animations
 * - Chainable with useTransform
 * - Memory efficient with automatic cleanup
 */
export class MotionValue<T = number> {
  private _value: T
  private _velocity: number = 0
  private _subscribers: Set<StoredSubscriber<T>> = new Set()
  private _eventListeners: Map<MotionValueEvent, Set<() => void>> = new Map()
  private _springValue: ReturnType<typeof createSpringValue> | null = null
  private _springConfig: SpringConfig
  private _isAnimating: boolean = false
  private _destroyed: boolean = false
  private _runId = 0

  constructor(initialValue: T, options: MotionValueOptions = {}) {
    this._value = this._validate(initialValue)
    this._springConfig = options.spring ?? { stiffness: 100, damping: 15 }

    // Initialize spring for numeric values
    if (typeof initialValue === 'number') {
      this._springValue = createSpringValue(this._value as number, {
        ...this._springConfig,
        onUpdate: (v: number) => {
          if (this._destroyed) return
          this._value = v as T
          this._velocity = this._springValue?.getVelocity() ?? 0
          this._notify()
        },
        onComplete: () => {
          const run = this._runId
          try { this._springConfig.onComplete?.() }
          finally {
            if (!this._destroyed && this._isAnimating && run === this._runId) {
              this._isAnimating = false
              this._velocity = 0
              this._emitEnd('animationComplete')
            }
          }
        },
      })
    }
  }

  /**
   * Get current value synchronously
   */
  get(): T {
    return this._value
  }

  /**
   * Get current velocity (for numeric values)
   */
  getVelocity(): number {
    return this._velocity
  }

  /**
   * Check if currently animating
   */
  isAnimating(): boolean {
    return this._isAnimating
  }

  /**
   * Check if this MotionValue has been destroyed
   */
  isDestroyed(): boolean {
    return this._destroyed
  }

  /**
   * Set value with spring animation
   */
  set(newValue: T, animate: boolean = true): void {
    if (this._destroyed) return

    newValue = this._validate(newValue)
    const run = ++this._runId

    if (typeof newValue === 'number' && this._springValue && animate) {
      this._isAnimating = true
      this._emit('animationStart')

      // An animationStart listener may have destroyed, stopped or jumped this
      // value, or called set() itself (which owns the newer completion):
      // that call wins, don't start a second animation over it
      if (this._destroyed || !this._isAnimating || run !== this._runId) return

      this._springValue.set(newValue as number)

    } else {
      const wasAnimating = this._isAnimating
      // Keep the internal spring in sync (and stop any in-flight animation),
      // otherwise the next animated set() would start from a stale value and
      // the running spring would keep overwriting this value.
      if (typeof newValue === 'number' && this._springValue) {
        this._springValue.jump(newValue as number)
      } else {
        this._springValue?.stop()
      }
      this._isAnimating = false
      this._value = newValue
      this._velocity = 0
      this._notify()
      if (wasAnimating) {
        this._emitEnd('animationCancel')
      }
    }
  }

  /**
   * Instantly set value without animation
   */
  jump(newValue: T): void {
    if (this._destroyed) return

    newValue = this._validate(newValue)
    this._runId++
    const wasAnimating = this._isAnimating

    this._value = newValue
    this._velocity = 0

    if (typeof newValue === 'number' && this._springValue) {
      this._springValue.jump(newValue as number)
    } else {
      this._springValue?.stop()
    }

    this._isAnimating = false
    this._notify()
    if (wasAnimating) {
      this._emitEnd('animationCancel')
    }
  }

  /**
   * Stop any running animation at current position
   */
  stop(): void {
    this._runId++

    // Use stop() which halts at current position and resolves promise
    if (this._springValue) {
      this._springValue.stop()
    }
    const wasAnimating = this._isAnimating
    this._isAnimating = false
    // The value is halted: it no longer moves at its last in-flight speed
    this._velocity = 0
    // Only signal the end of an animation that was actually running
    if (wasAnimating) {
      this._emitEnd('animationCancel')
    }
  }

  /**
   * Subscribe to value changes
   * Returns unsubscribe function
   */
  subscribe(callback: MotionValueSubscriber<T>): () => void {
    const entry: StoredSubscriber<T> = value => callback(value)
    this._subscribers.add(entry)

    // Immediately call with current value
    try { callback(this._value) }
    catch (error) { console.error('MotionValue subscriber error:', error) }

    return () => {
      this._subscribers.delete(entry)
    }
  }

  /**
   * Add event listener
   */
  on(event: MotionValueEvent, callback: () => void): () => void {
    if (!this._eventListeners.has(event)) {
      this._eventListeners.set(event, new Set())
    }
    const entry = () => callback()
    this._eventListeners.get(event)!.add(entry)

    return () => {
      this._eventListeners.get(event)?.delete(entry)
    }
  }

  /**
   * Update spring configuration. Applies from the next animated `set()`
   * (which retargets an ongoing animation with the new physics, keeping its
   * velocity); an animation already in flight keeps its current target.
   */
  setConfig(config: Partial<SpringConfig>): void {
    this._springConfig = { ...this._springConfig, ...config }
    // Update existing spring if present
    if (this._springValue) {
      const physics = { ...config }
      delete physics.onComplete
      delete physics.onUpdate
      this._springValue.setConfig(physics)
    }
  }

  /**
   * Destroy and cleanup
   */
  destroy(): void {
    if (this._destroyed) return
    this._destroyed = true

    this._runId++

    // Let listeners know an in-flight animation will never complete
    if (this._isAnimating) {
      this._isAnimating = false
      this._emitEnd('animationCancel')
    }

    this._subscribers.clear()
    this._eventListeners.clear()

    if (this._springValue) {
      this._springValue.destroy()
      this._springValue = null
    }
  }

  /** Current numeric run; resolves on completion or interruption. */
  get finished(): Promise<void> {
    return this._springValue?.finished ?? Promise.resolve()
  }

  private _validate(value: T): T {
    return (typeof value === 'number' ? validateAnimationValue(value, 'MotionValue') : value) as T
  }

  private _notify(): void {
    // for...of instead of forEach: no closure allocated per notification
    for (const callback of this._subscribers) {
      try {
        callback(this._value)
      } catch (e) {
        console.error('MotionValue subscriber error:', e)
      }
    }
    if (this._eventListeners.size !== 0) this._emit('change')
  }

  /**
   * Signal the end of an animation: `reason` (animationComplete or
   * animationCancel) followed by `animationEnd` (kept for compatibility)
   */
  private _emitEnd(reason: 'animationComplete' | 'animationCancel'): void {
    this._emit(reason)
    this._emit('animationEnd')
  }

  private _emit(event: MotionValueEvent): void {
    const listeners = this._eventListeners.get(event)
    if (!listeners) return
    for (const callback of listeners) {
      try {
        callback()
      } catch (e) {
        console.error(`MotionValue ${event} listener error:`, e)
      }
    }
  }
}

/**
 * Create a new MotionValue
 *
 * @example
 * ```ts
 * const x = createMotionValue(0)
 * const opacity = createMotionValue(1)
 * const scale = createMotionValue(1, { spring: { stiffness: 300, damping: 30 } })
 * ```
 */
export function createMotionValue<T = number>(
  initialValue: T,
  options?: MotionValueOptions
): MotionValue<T> {
  return new MotionValue(initialValue, options)
}

/**
 * Transform a MotionValue using a mapping function
 *
 * Creates a derived MotionValue that automatically updates
 * when the source value changes.
 *
 * @example
 * ```ts
 * const x = createMotionValue(0)
 * const opacity = transformValue(x, (v) => 1 - v / 100)
 * const inverted = transformValue(x, (v) => -v)
 * ```
 */
export function transformValue<T, U>(
  source: MotionValue<T>,
  transform: (value: T) => U
): MotionValue<U> {
  const derived = new MotionValue<U>(transform(source.get()))

  // Store unsubscribe function for cleanup
  const unsubscribe = source.subscribe((value) => {
    derived.jump(transform(value))
  })

  // Override destroy to clean up subscription (prevents memory leak)
  const originalDestroy = derived.destroy.bind(derived)
  derived.destroy = () => {
    unsubscribe()
    originalDestroy()
  }

  return derived
}

/**
 * Map a MotionValue from one range to another
 *
 * @example
 * ```ts
 * const x = createMotionValue(0)
 * // Map 0-100 to 0-1
 * const progress = mapRange(x, [0, 100], [0, 1])
 * // Map with extrapolation clamped
 * const clamped = mapRange(x, [0, 100], [0, 1], { clamp: true })
 * ```
 */
export function mapRange(
  source: MotionValue<number>,
  inputRange: [number, number],
  outputRange: [number, number],
  options: { clamp?: boolean } = {}
): MotionValue<number> {
  const [inMin, inMax] = inputRange
  const [outMin, outMax] = outputRange
  const inputDelta = inMax - inMin

  return transformValue(source, (value) => {
    // Guard against division by zero
    if (inputDelta === 0) {
      return outMin
    }

    let normalized = (value - inMin) / inputDelta

    if (options.clamp) {
      normalized = Math.max(0, Math.min(1, normalized))
    }

    return outMin + normalized * (outMax - outMin)
  })
}
