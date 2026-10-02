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
  // Track timeout IDs for cleanup to prevent memory leaks
  private pendingTimeouts: Set<ReturnType<typeof setTimeout>> = new Set()
  private destroyed = false

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

      const timeoutId = setTimeout(() => {
        // Remove from pending set
        this.pendingTimeouts.delete(timeoutId)

        // Skip if destroyed
        if (this.destroyed) return
        // Apply every delayed leader sample in order. (Only applying the
        // latest-scheduled one meant followers never moved while the leader
        // kept updating each frame, and only caught up after it stopped.)
        this.springs[index]!.set(targetValue)
      }, delayMs)

      // Track timeout for cleanup
      this.pendingTimeouts.add(timeoutId)
    }
  }

  set(value: number): void {
    this.leader.set(value)
  }

  jump(value: number): void {
    // Drop delayed follower updates scheduled before the jump, otherwise they
    // would pull followers back toward stale values afterwards
    this.clearPendingTimeouts()
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

    // Subscribe to each follower spring. Each subscription only notifies
    // THIS callback (notifying all subscribers here would multiply calls by
    // the number of subscribers), and the synchronous initial invocation
    // that SpringValue.subscribe performs is skipped.
    let initialized = false
    const handler = () => {
      if (initialized) this.safeNotify(callback)
    }
    const unsubscribers: (() => void)[] = []
    for (const spring of this.springs) {
      unsubscribers.push(spring.subscribe(handler))
    }
    initialized = true

    // Immediately call with current values (once)
    this.safeNotify(callback)

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback)
      for (const unsubscribe of unsubscribers) {
        unsubscribe()
      }
    }
  }

  private safeNotify(callback: (values: number[]) => void): void {
    try {
      callback(this.getValues())
    } catch (e) {
      console.error('[SpringKit] Trail subscriber error:', e)
    }
  }

  private clearPendingTimeouts(): void {
    for (const timeoutId of this.pendingTimeouts) {
      clearTimeout(timeoutId)
    }
    this.pendingTimeouts.clear()
  }

  destroy(): void {
    this.destroyed = true

    // Clear all pending timeouts to prevent memory leaks
    this.clearPendingTimeouts()

    this.leader.destroy()
    for (const spring of this.springs) {
      spring.destroy()
    }
    this.subscribers.clear()
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
