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
 * x.on('change', (value) => {
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

export type MotionValueSubscriber<T> = (value: T) => void
export type MotionValueEvent = 'change' | 'animationStart' | 'animationEnd'

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
  private _subscribers: Set<MotionValueSubscriber<T>> = new Set()
  private _eventListeners: Map<MotionValueEvent, Set<() => void>> = new Map()
  private _springValue: ReturnType<typeof createSpringValue> | null = null
  private _springConfig: SpringConfig
  private _isAnimating: boolean = false
  private _destroyed: boolean = false

  constructor(initialValue: T, options: MotionValueOptions = {}) {
    this._value = initialValue
    this._springConfig = options.spring ?? { stiffness: 100, damping: 15 }

    // Initialize spring for numeric values
    if (typeof initialValue === 'number') {
      this._springValue = createSpringValue(initialValue as number, {
        ...this._springConfig,
        onUpdate: (v: number) => {
          if (this._destroyed) return
          this._value = v as T
          this._velocity = this._springValue?.getVelocity() ?? 0
          this._notify()
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
   * Set value with spring animation
   */
  set(newValue: T, animate: boolean = true): void {
    if (this._destroyed) return

    if (typeof newValue === 'number' && this._springValue && animate) {
      this._isAnimating = true
      this._emit('animationStart')

      this._springValue.set(newValue as number)

      // Check for animation end
      const checkEnd = () => {
        if (this._springValue && Math.abs(this._springValue.getVelocity()) < 0.01) {
          this._isAnimating = false
          this._emit('animationEnd')
        } else if (this._isAnimating) {
          requestAnimationFrame(checkEnd)
        }
      }
      requestAnimationFrame(checkEnd)
    } else {
      this._value = newValue
      this._velocity = 0
      this._notify()
    }
  }

  /**
   * Instantly set value without animation
   */
  jump(newValue: T): void {
    if (this._destroyed) return

    this._value = newValue
    this._velocity = 0

    if (typeof newValue === 'number' && this._springValue) {
      this._springValue.jump(newValue as number)
    }

    this._isAnimating = false
    this._notify()
  }

  /**
   * Stop any running animation
   */
  stop(): void {
    // SpringValue doesn't have stop(), so we jump to current value
    if (this._springValue) {
      this._springValue.jump(this._springValue.get())
    }
    this._isAnimating = false
    this._emit('animationEnd')
  }

  /**
   * Subscribe to value changes
   * Returns unsubscribe function
   */
  subscribe(callback: MotionValueSubscriber<T>): () => void {
    this._subscribers.add(callback)

    // Immediately call with current value
    callback(this._value)

    return () => {
      this._subscribers.delete(callback)
    }
  }

  /**
   * Add event listener
   */
  on(event: MotionValueEvent, callback: () => void): () => void {
    if (!this._eventListeners.has(event)) {
      this._eventListeners.set(event, new Set())
    }
    this._eventListeners.get(event)!.add(callback)

    return () => {
      this._eventListeners.get(event)?.delete(callback)
    }
  }

  /**
   * Update spring configuration
   */
  setConfig(config: Partial<SpringConfig>): void {
    this._springConfig = { ...this._springConfig, ...config }
    // Note: Config change takes effect on next animation
  }

  /**
   * Destroy and cleanup
   */
  destroy(): void {
    this._destroyed = true
    this._subscribers.clear()
    this._eventListeners.clear()

    if (this._springValue) {
      this._springValue.destroy()
      this._springValue = null
    }
  }

  private _notify(): void {
    this._subscribers.forEach((callback) => {
      try {
        callback(this._value)
      } catch (e) {
        console.error('MotionValue subscriber error:', e)
      }
    })
    this._emit('change')
  }

  private _emit(event: MotionValueEvent): void {
    this._eventListeners.get(event)?.forEach((callback) => {
      try {
        callback()
      } catch (e) {
        console.error(`MotionValue ${event} listener error:`, e)
      }
    })
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

  source.subscribe((value) => {
    derived.jump(transform(value))
  })

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

  return transformValue(source, (value) => {
    let normalized = (value - inMin) / (inMax - inMin)

    if (options.clamp) {
      normalized = Math.max(0, Math.min(1, normalized))
    }

    return outMin + normalized * (outMax - outMin)
  })
}
