import type { SpringConfig } from '../core/config.js'
import { createSpringValue, type SpringValue } from '../core/spring-value.js'

/**
 * Trail configuration interface
 */
export interface TrailConfig extends SpringConfig {
  /** Frames delay between items following each other */
  followDelay?: number
}

/**
 * Trail interface
 */
export interface Trail {
  /** Set the leader value (followers will follow with delay) */
  set(value: number): void
  /** Set all values immediately without animation */
  jump(value: number): void
  /** Get all current values */
  getValues(): number[]
  /** Subscribe to value changes */
  subscribe(callback: (values: number[]) => void): () => void
  /** Clean up resources */
  destroy(): void
}

/**
 * Trail implementation
 * Creates a chain of springs where each spring follows the previous one
 */
class TrailImpl implements Trail {
  private springs: SpringValue[]
  private leader: SpringValue
  private followDelay: number
  private subscribers = new Set<(values: number[]) => void>()
  private frameCount: number = 0
  private pendingUpdates: Map<number, number> = new Map()

  constructor(count: number, config: TrailConfig = {}) {
    const { followDelay = 2, ...springConfig } = config

    this.followDelay = followDelay

    // Create leader spring
    this.leader = createSpringValue(0, springConfig)

    // Create follower springs
    this.springs = []
    for (let i = 0; i < count; i++) {
      const spring = createSpringValue(0, springConfig)
      this.springs.push(spring)
    }

    // Connect leader to followers with delay
    this.leader.subscribe(() => {
      this.frameCount++
      this.scheduleFollowerUpdates()
    })
  }

  private scheduleFollowerUpdates(): void {
    const targetValue = this.leader.get()

    for (let i = 0; i < this.springs.length; i++) {
      const delayFrames = (i + 1) * this.followDelay
      const targetFrame = this.frameCount + delayFrames

      // Store the pending update
      this.pendingUpdates.set(i, targetFrame)

      // Schedule the update
      this.scheduleFollowerUpdate(i, targetValue, targetFrame, delayFrames)
    }
  }

  private scheduleFollowerUpdate(
    index: number,
    targetValue: number,
    targetFrame: number,
    _delayFrames: number
  ): void {
    const startFrame = this.frameCount
    const framesToWait = targetFrame - startFrame

    if (framesToWait <= 0) {
      // Update immediately if delay has passed
      this.springs[index]!.set(targetValue)
    } else {
      // Use setTimeout for delay (approximately 16ms per frame at 60fps)
      const delayMs = Math.max(framesToWait * 16, 0)

      setTimeout(() => {
        // Only update if this is still the current pending update
        const currentTarget = this.pendingUpdates.get(index)
        if (currentTarget === targetFrame) {
          this.springs[index]!.set(targetValue)
        }
      }, delayMs)
    }
  }

  set(value: number): void {
    this.leader.set(value)
  }

  jump(value: number): void {
    this.leader.jump(value)
    for (const spring of this.springs) {
      spring.jump(value)
    }
  }

  getValues(): number[] {
    return this.springs.map((s) => s.get())
  }

  subscribe(callback: (values: number[]) => void): () => void {
    this.subscribers.add(callback)

    // Subscribe to each follower spring
    const unsubscribers: (() => void)[] = []
    for (const spring of this.springs) {
      unsubscribers.push(
        spring.subscribe(() => {
          this.notify()
        })
      )
    }

    // Immediately call with current values
    callback(this.getValues())

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback)
      for (const unsubscribe of unsubscribers) {
        unsubscribe()
      }
    }
  }

  private notify(): void {
    const values = this.getValues()
    for (const subscriber of this.subscribers) {
      subscriber(values)
    }
  }

  destroy(): void {
    this.leader.destroy()
    for (const spring of this.springs) {
      spring.destroy()
    }
    this.subscribers.clear()
    this.pendingUpdates.clear()
  }
}

/**
 * Create a trail animation
 *
 * @param count - Number of items in the trail
 * @param config - Trail configuration
 * @returns Trail controller
 *
 * @example
 * ```ts
 * const trail = createTrail(5, {
 *   stiffness: 200,
 *   damping: 25,
 *   followDelay: 3,
 * })
 *
 * trail.subscribe((values) => {
 *   elements.forEach((el, i) => {
 *     el.style.transform = `translateX(${values[i]}px)`
 *   })
 * })
 *
 * trail.set(100) // First item moves immediately, others follow
 * ```
 */
export function createTrail(count: number, config?: TrailConfig): Trail {
  return new TrailImpl(count, config)
}
