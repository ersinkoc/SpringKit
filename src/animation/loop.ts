import { warnOnce } from '../utils/warnings.js'
/**
 * Animation state enum
 */
export enum AnimationState {
  Idle = 'idle',
  Running = 'running',
  Paused = 'paused',
  Complete = 'complete',
}

/**
 * Interface for objects that can be animated
 */
export interface Animatable {
  /**
   * Update the animation
   * @param now - Current timestamp from performance.now()
   * @param deltaTime - Clamped duration of the current loop frame (ms). Useful
   *   on an animation's first update, when it has no previous timestamp of its
   *   own (e.g. it was started or retargeted while the loop was running).
   */
  update(now: number, deltaTime?: number): void

  /**
   * Check if the animation is complete
   */
  isComplete(): boolean
}

/**
 * Callback type for cleanup notifications
 */
export type CleanupCallback = (id: number) => void

/**
 * Maximum allowed delta time (ms) to prevent physics explosions after tab suspension
 * If more time has passed, we clamp to this value for stable simulation
 *
 * Why 64ms?
 * - At 60fps, each frame is ~16.67ms
 * - At 30fps, each frame is ~33.33ms
 * - At 15fps, each frame is ~66.67ms
 * - 64ms represents slightly better than 15fps (15.6fps)
 * - This prevents huge physics jumps when tab is suspended or during debugger pauses
 * - Values larger than this would cause springs to overshoot dramatically
 */
const MAX_DELTA_TIME = 64 // ~15.6fps minimum, prevents huge jumps

/** Tolerance (ms) when comparing a delay's due time with the loop clock */
const DELAY_EPSILON = 1e-6

interface PendingDelay {
  /** Loop time when the delay was requested */
  start: number
  due: number
  callback: (() => void) | null
}

/**
 * Global animation loop manager
 * Uses requestAnimationFrame to drive all animations
 * Features:
 * - Strong references to RUNNING animations so fire-and-forget animations
 *   (whose controller is discarded) are not garbage collected mid-flight
 * - Animations are released as soon as they complete or are removed, so
 *   finished animations never leak through the loop
 * - FinalizationRegistry for cleanup callbacks
 * - Frame-drop resilience with delta time clamping
 * - Single-pass update + cleanup for O(n) performance
 * - Frame event listeners for external monitoring
 */
class AnimationLoop {
  // Strong set: an animation must stay alive while it is running, otherwise
  // `spring(...).start()` without keeping the return value could be GC'd.
  private animations = new Set<Animatable>()
  private rafId: number | null = null
  // The scheduler the pending frame was requested with. If the global
  // requestAnimationFrame is swapped (e.g. a test clock is installed or
  // removed) the pending frame is moved to the new scheduler, otherwise the
  // loop would wait on a clock that is no longer driven.
  private scheduledWith: {
    request: typeof requestAnimationFrame
    cancel: typeof cancelAnimationFrame
  } | null = null
  /**
   * Callback passed to requestAnimationFrame. It is replaced whenever a
   * pending frame is abandoned (loop stopped, or moved to another clock), so
   * a request that could not be cancelled - e.g. one a test clock handed
   * over to the real clock on uninstall - is recognized as stale and ignored
   * instead of starting a second RAF chain.
   */
  private frameCallback: FrameRequestCallback = this.createFrameCallback()
  private isRunning = false
  private isTicking = false
  private lastTime: number = 0
  private nextId = 1
  private idMap = new WeakMap<Animatable, number>()
  private frameListeners = new Set<(deltaTime: number) => void>()
  /** Reusable per-frame snapshot of `animations` (see tick) */
  private snapshot: (Animatable | undefined)[] = []
  private snapshotInUse = false
  /**
   * Animations removed from `animations` during the current tick and not
   * re-added since, so a snapshot entry is live iff it is not in here. While
   * it is empty (the common case) the tick skips a hash lookup per animation.
   */
  private removedDuringTick = new Set<Animatable>()
  private timeScale = 1
  private timeScaleListeners = new Set<(scale: number) => void>()
  /**
   * Clock that animations see. It advances by the real frame delta times
   * `timeScale`, so slow motion / pausing needs no support from animations.
   * Starts at a real timestamp so animations never see time 0.
   */
  private animationTime: number =
    typeof performance !== 'undefined' ? performance.now() : 0

  // FinalizationRegistry for automatic cleanup notifications
  // Feature detection for older browsers (Safari < 14.1, IE11)
  private registry: FinalizationRegistry<number> | null =
    typeof FinalizationRegistry !== 'undefined'
      ? new FinalizationRegistry<number>((id) => {
          this.cleanupCallbacks.forEach((cb) => cb(id))
        })
      : null
  private cleanupCallbacks = new Set<CleanupCallback>()
  private registered = new WeakSet<Animatable>()

  /**
   * Add an animation to the loop
   * The loop holds a strong reference while the animation is active and
   * releases it on completion or removal.
   * @returns Unique ID for this animation
   */
  add(animation: Animatable): number {
    // Check if already added
    const existingId = this.idMap.get(animation)
    if (existingId !== undefined && this.animations.has(animation)) {
      // Still move a frame pending on a replaced clock (e.g. a test clock
      // installed while this animation was already running)
      this.rescheduleIfClockChanged()
      return existingId
    }

    const id = existingId ?? this.nextId++
    this.animations.add(animation)
    this.idMap.set(animation, id)
    if (this.snapshotInUse) this.removedDuringTick.delete(animation)

    // Register for finalization callback only if supported (once per object)
    if (this.registry && !this.registered.has(animation)) {
      this.registered.add(animation)
      this.registry.register(animation, id)
    }

    this.start()
    this.rescheduleIfClockChanged()
    return id
  }

  /**
   * Remove an animation from the loop
   */
  remove(animation: Animatable): void {
    if (this.animations.delete(animation)) {
      this.idMap.delete(animation)
      if (this.snapshotInUse) this.removedDuringTick.add(animation)
    }
    if (this.animations.size === 0) {
      this.stop()
    }
  }

  /**
   * Register a callback for when animations are garbage collected
   * Useful for debugging memory leaks
   */
  onCleanup(callback: CleanupCallback): () => void {
    this.cleanupCallbacks.add(callback)
    return () => this.cleanupCallbacks.delete(callback)
  }

  /**
   * Register a callback for each frame
   * Receives delta time in milliseconds
   */
  onFrame(callback: (deltaTime: number) => void): () => void {
    this.frameListeners.add(callback)
    return () => this.frameListeners.delete(callback)
  }

  /**
   * Call `callback` once `ms` milliseconds of animation time have passed:
   * like `setTimeout`, but driven by the loop, so the delay follows
   * {@link setTimeScale} (slow motion stretches it, 0 freezes it) and the
   * test clock. The callback runs during the first frame at or after the
   * due time (never synchronously, even for `ms <= 0`).
   *
   * @returns A function that cancels the delay (no-op once it has fired)
   */
  delay(ms: number, callback: () => void): () => void {
    const start = this.animationTime
    const entry: PendingDelay = {
      start,
      due: start + (Number.isFinite(ms) && ms > 0 ? ms : 0),
      callback,
    }
    this.delays.push(entry)
    this.add(this.delayRunner)
    return () => {
      entry.callback = null
    }
  }

  /** Pending delays (cancelled ones have a null callback until swept) */
  private delays: PendingDelay[] = []
  /** Fires due delays; part of the loop while any delay is pending */
  private delayRunner: Animatable = {
    update: (now) => {
      const list = this.delays
      // Delays added by a callback below are only considered next frame
      const count = list.length
      let kept = 0
      for (let i = 0; i < count; i++) {
        const entry = list[i]!
        const callback = entry.callback
        if (callback === null) continue
        if (entry.due <= now + DELAY_EPSILON && now > entry.start) {
          entry.callback = null
          try {
            callback()
          } catch (e) {
            console.error('[SpringKit] Delay callback error:', e)
          }
        } else {
          list[kept++] = entry
        }
      }
      for (let i = count; i < list.length; i++) list[kept++] = list[i]!
      list.length = kept
    },
    isComplete: () => this.delays.length === 0,
  }

  /**
   * Start the animation loop
   */
  private start(): void {
    if (this.isRunning) return
    this.isRunning = true
    this.lastTime = performance.now()
    // If we're inside a tick (e.g. an onComplete callback started a new
    // animation after the last one was removed), don't tick re-entrantly:
    // the current tick schedules the next frame itself. Re-entering here
    // would process animations twice and spawn a second RAF chain.
    if (this.isTicking) return
    this.tick()
  }

  private createFrameCallback(): FrameRequestCallback {
    const callback: FrameRequestCallback = () => {
      if (callback === this.frameCallback) this.tick()
    }
    return callback
  }

  private scheduleFrame(): void {
    this.scheduledWith = {
      request: requestAnimationFrame,
      cancel: cancelAnimationFrame,
    }
    this.rafId = requestAnimationFrame(this.frameCallback)
  }

  private rescheduleIfClockChanged(): void {
    if (
      this.rafId === null ||
      this.isTicking ||
      this.scheduledWith === null ||
      this.scheduledWith.request === requestAnimationFrame
    ) {
      return
    }
    try {
      this.scheduledWith.cancel(this.rafId)
    } catch {
      // the previous clock may be gone; the stale callback is harmless
    }
    this.rafId = null
    // The old clock may still run the abandoned request (cancel() can't reach
    // a request that was handed over to yet another clock): invalidate it
    this.frameCallback = this.createFrameCallback()
    // Timestamps from the old clock are meaningless on the new one
    this.lastTime = performance.now()
    this.scheduleFrame()
  }

  /**
   * Stop the animation loop
   */
  private stop(): void {
    this.isRunning = false
    if (this.rafId !== null) {
      ;(this.scheduledWith?.cancel ?? cancelAnimationFrame)(this.rafId)
      this.rafId = null
      // In case the cancel didn't reach the request (see frameCallback)
      this.frameCallback = this.createFrameCallback()
    }
  }

  /**
   * Single animation frame - optimized single-pass update + cleanup
   * Features:
   * - Delta time clamping for frame-drop resilience
   * - O(n) single-pass performance
   * - Frame listener notifications
   */
  private tick = (): void => {
    const now = performance.now()
    this.rafId = null
    this.isTicking = true

    try {
      // Calculate and clamp delta time to prevent physics explosions
      // This handles tab suspension, debugger pauses, etc.
      const rawDelta = now - this.lastTime
      // (never negative: timestamps can go backwards, e.g. when a test clock
      // hands over to the real one)
      const clampedDelta = Math.min(Math.max(rawDelta, 0), MAX_DELTA_TIME)
      this.lastTime = now
      const scaledDelta = clampedDelta * this.timeScale
      this.animationTime += scaledDelta

      // Store frame duration for FPS calculation (skip the zero-length
      // synchronous tick on loop start, which would make getFPS() Infinity)
      if (clampedDelta > 0) {
        this.lastFrameDuration = clampedDelta
      }

      // Notify frame listeners (with error isolation)
      for (const listener of this.frameListeners) {
        try {
          listener(clampedDelta)
        } catch (e) {
          console.error('[SpringKit] Frame listener error:', e)
        }
      }

      // Snapshot so animations added during this frame start next frame.
      // The snapshot buffer is reused across frames instead of allocating a
      // new array per frame (a nested tick, which only a test clock driven
      // from inside a callback can produce, gets its own array).
      const reuse = !this.snapshotInUse
      const current = reuse ? this.snapshot : []
      let count = 0
      for (const animation of this.animations) current[count++] = animation
      this.snapshotInUse = true
      const removed = this.removedDuringTick

      try {
        for (let i = 0; i < count; i++) {
          const animation = current[i]!
          // Skip animations removed earlier in this frame (equivalent to
          // `!this.animations.has(animation)`, see removedDuringTick)
          if (removed.size !== 0 && removed.has(animation)) continue

          // Error isolation: one faulty animation must not kill the whole loop
          // (an uncaught throw here would leave isRunning=true with no RAF
          // scheduled, freezing every current and future animation)
          try {
            animation.update(this.animationTime, scaledDelta)
          } catch (e) {
            console.error('[SpringKit] Animation update error:', e)
          }

          if (animation.isComplete() && this.animations.delete(animation)) {
            this.idMap.delete(animation)
            // Matters for a nested tick whose outer snapshot holds it too
            removed.add(animation)
          }
        }
      } finally {
        if (reuse) {
          // Drop the references so finished animations can be collected
          current.fill(undefined, 0, count)
          removed.clear()
          this.snapshotInUse = false
        }
      }
    } finally {
      this.isTicking = false
    }

    // Continue or stop loop
    if (this.animations.size > 0) {
      this.isRunning = true
      this.scheduleFrame()
    } else {
      this.stop()
    }
  }

  /**
   * Slow down, speed up or freeze every loop-driven animation (springs,
   * spring values, decay, MotionValues...) and every animation started with
   * `animateNative()`. 1 = normal speed, 0.1 = 10x slow motion, 0 = frozen.
   * Handy for inspecting motion while developing.
   *
   * Timelines and keyframes follow it too, and so do delays scheduled with
   * {@link delay} (`animate`, `stagger`, trail and timeline repeat delays).
   * Code that runs its own requestAnimationFrame loop can read
   * `getTimeScale()` to do the same; use `delay()` instead of `setTimeout`.
   *
   * Non-finite values are ignored (with a development warning); negative
   * values freeze like 0.
   */
  setTimeScale(scale: number): void {
    if (!Number.isFinite(scale)) {
      warnOnce(`globalLoop.setTimeScale(${scale}) ignored: expected a finite number`)
      return
    }
    const next = scale > 0 ? scale : 0
    if (next === this.timeScale) return
    this.timeScale = next
    for (const listener of this.timeScaleListeners) {
      try {
        listener(next)
      } catch (e) {
        console.error('[SpringKit] Time scale listener error:', e)
      }
    }
  }

  /** Current time scale (see {@link setTimeScale}) */
  getTimeScale(): number {
    return this.timeScale
  }

  /** Subscribe to time scale changes; returns an unsubscribe function */
  onTimeScaleChange(callback: (scale: number) => void): () => void {
    this.timeScaleListeners.add(callback)
    return () => this.timeScaleListeners.delete(callback)
  }

  /**
   * Get the number of active animations
   */
  get size(): number {
    return this.animations.size
  }

  /**
   * Get count of alive (active) animations (for debugging/testing)
   */
  getAliveCount(): number {
    return this.animations.size
  }

  private lastFrameDuration: number = 16.67 // Default to ~60fps

  /**
   * Get current frame rate (based on actual frame duration)
   */
  getFPS(): number {
    return Math.round(1000 / this.lastFrameDuration)
  }
}

/**
 * Global animation loop instance
 */
export const globalLoop = new AnimationLoop()

/**
 * Loop-driven `setTimeout`: calls `callback` after `ms` milliseconds of
 * animation time, so the delay follows `globalLoop.setTimeScale()` and the
 * test clock. Shorthand for `globalLoop.delay(ms, callback)`.
 *
 * @returns A function that cancels the delay
 *
 * @example
 * const cancel = delay(300, () => spring(0, 1, { onUpdate }).start())
 */
export function delay(ms: number, callback: () => void): () => void {
  return globalLoop.delay(ms, callback)
}
