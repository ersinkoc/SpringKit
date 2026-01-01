import type { SpringConfig } from './config.js'
import { defaultConfig } from './config.js'
import { createSpringValue, type SpringValue } from './spring-value.js'

/**
 * Spring group interface
 */
export interface SpringGroup<T extends Record<string, number>> {
  /** Get all current values */
  get(): T
  /** Get a single value by key */
  getValue(key: keyof T): number
  /** Animate to new values (partial update) */
  set(values: Partial<T>, config?: Partial<SpringConfig>): void
  /** Set values immediately without animation */
  jump(values: Partial<T>): void
  /** Stop all animations at current position */
  stop(): void
  /** Subscribe to value changes */
  subscribe(callback: (values: T) => void): () => void
  /** Check if any spring is animating */
  isAnimating(): boolean
  /** Promise that resolves when all animations complete */
  finished: Promise<void>
  /** Clean up resources */
  destroy(): void
}

/**
 * Spring group implementation
 */
class SpringGroupImpl<T extends Record<string, number>> implements SpringGroup<T> {
  private values: Map<keyof T, SpringValue>
  private config: SpringConfig
  private subscribers = new Set<(values: T) => void>()
  private resolveComplete: (() => void) | null = null
  private finishedPromise: Promise<void>
  private notifyRafId: number | null = null
  private destroyed = false

  constructor(initialValues: T, config: SpringConfig = {}) {
    this.config = { ...defaultConfig, ...config }

    // Create SpringValue for each key
    this.values = new Map()
    for (const [key, value] of Object.entries(initialValues)) {
      const springValue = createSpringValue(value, this.config)
      springValue.subscribe(() => this.scheduleNotify())
      this.values.set(key as keyof T, springValue)
    }

    this.finishedPromise = Promise.resolve()

    // Initialize promise handler
    this.resetPromise()
  }

  private resetPromise(): void {
    this.finishedPromise = new Promise((resolve) => {
      this.resolveComplete = resolve
    })
  }

  get(): T {
    const result = {} as T
    for (const [key, springValue] of this.values) {
      (result as Record<string, number>)[key as string] = springValue.get()
    }
    return result
  }

  getValue(key: keyof T): number {
    return this.values.get(key)?.get() ?? 0
  }

  set(values: Partial<T>, config: Partial<SpringConfig> = {}): void {
    // Guard against use after destroy
    if (this.destroyed) return

    // Reset promise for new batch of animations
    this.resetPromise()

    const promises: Promise<void>[] = []

    for (const [key, value] of Object.entries(values)) {
      const springValue = this.values.get(key as keyof T)
      if (springValue && typeof value === 'number') {
        springValue.set(value, config)
        promises.push(springValue.finished)
      }
    }

    // Resolve when all animations complete
    Promise.all(promises).then(() => {
      if (this.resolveComplete && !this.destroyed) {
        this.resolveComplete()
      }
    })
  }

  jump(values: Partial<T>): void {
    // Guard against use after destroy
    if (this.destroyed) return

    for (const [key, value] of Object.entries(values)) {
      const springValue = this.values.get(key as keyof T)
      if (springValue && typeof value === 'number') {
        springValue.jump(value)
      }
    }
    // Note: notify() is already called by the spring subscriptions, so we don't call it again
  }

  stop(): void {
    for (const springValue of this.values.values()) {
      springValue.stop()
    }
    // Resolve the promise since animations are stopped
    this.resolveComplete?.()
  }

  subscribe(callback: (values: T) => void): () => void {
    this.subscribers.add(callback)
    // Immediately call with current values (with error isolation)
    try {
      callback(this.get())
    } catch (e) {
      console.error('[SpringKit] SpringGroup subscriber error:', e)
    }
    return () => this.subscribers.delete(callback)
  }

  isAnimating(): boolean {
    for (const springValue of this.values.values()) {
      if (springValue.isAnimating()) return true
    }
    return false
  }

  get finished(): Promise<void> {
    return this.finishedPromise
  }

  /**
   * Schedule notification for next animation frame to prevent excessive updates.
   * When animating multiple properties, this debounces notifications to once per frame
   * instead of once per property update.
   */
  private scheduleNotify(): void {
    // Skip if destroyed or already scheduled
    if (this.destroyed || this.notifyRafId !== null) return

    this.notifyRafId = requestAnimationFrame(() => {
      this.notifyRafId = null
      // Double-check destroyed state after RAF
      if (!this.destroyed) {
        this.notify()
      }
    })
  }

  private notify(): void {
    const values = this.get()
    for (const subscriber of this.subscribers) {
      try {
        subscriber(values)
      } catch (e) {
        console.error('[SpringKit] SpringGroup subscriber error:', e)
      }
    }
  }

  destroy(): void {
    this.destroyed = true

    // Cancel pending RAF to prevent memory leak
    if (this.notifyRafId !== null) {
      cancelAnimationFrame(this.notifyRafId)
      this.notifyRafId = null
    }

    for (const springValue of this.values.values()) {
      springValue.destroy()
    }

    // Resolve pending promise to prevent memory leaks
    this.resolveComplete?.()
    this.resolveComplete = null

    this.subscribers.clear()
  }
}

/**
 * Create a spring group for animating multiple values together
 *
 * @param initialValues - Initial values object
 * @param config - Spring configuration
 * @returns Spring group controller
 *
 * @example
 * ```ts
 * const group = createSpringGroup(
 *   { x: 0, y: 0, scale: 1 },
 *   { stiffness: 100, damping: 10 }
 * )
 *
 * group.subscribe((values) => {
 *   element.style.transform = `
 *     translate(${values.x}px, ${values.y}px)
 *     scale(${values.scale})
 *   `
 * })
 *
 * group.set({ x: 100, scale: 1.5 })
 * ```
 */
export function createSpringGroup<T extends Record<string, number>>(
  initialValues: T,
  config?: SpringConfig
): SpringGroup<T> {
  return new SpringGroupImpl(initialValues, config)
}

// Re-export for type usage
export { SpringGroupImpl as SpringGroupClass }
