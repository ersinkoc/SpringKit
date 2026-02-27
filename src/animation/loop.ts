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
   */
  update(now: number): void

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

/**
 * Global animation loop manager
 * Uses requestAnimationFrame to drive all animations
 * Features:
 * - WeakRef-based animation tracking for memory safety
 * - FinalizationRegistry for cleanup callbacks
 * - Frame-drop resilience with delta time clamping
 * - Single-pass update + cleanup for O(n) performance
 * - Frame event listeners for external monitoring
 */
class AnimationLoop {
  private animations = new Set<WeakRef<Animatable>>()
  private animationMap = new WeakMap<Animatable, WeakRef<Animatable>>()
  private rafId: number | null = null
  private isRunning = false
  private lastTime: number = 0
  private nextId = 1
  private idMap = new WeakMap<Animatable, number>()
  private frameListeners = new Set<(deltaTime: number) => void>()

  // FinalizationRegistry for automatic cleanup notifications
  // Feature detection for older browsers (Safari < 14.1, IE11)
  private registry: FinalizationRegistry<number> | null =
    typeof FinalizationRegistry !== 'undefined'
      ? new FinalizationRegistry<number>((id) => {
          this.cleanupCallbacks.forEach((cb) => cb(id))
        })
      : null
  private cleanupCallbacks = new Set<CleanupCallback>()

  /**
   * Add an animation to the loop
   * Uses WeakRef to prevent memory leaks if animation is garbage collected
   * @returns Unique ID for this animation
   */
  add(animation: Animatable): number {
    // Check if already added
    const existingId = this.idMap.get(animation)
    if (existingId !== undefined) return existingId

    // Periodic cleanup of dead WeakRefs to prevent memory bloat
    // Every 100 additions, clean up dead refs
    if (this.animations.size > 0 && this.animations.size % 100 === 0) {
      this.cleanupDeadRefs()
    }

    const id = this.nextId++
    const ref = new WeakRef(animation)
    this.animations.add(ref)
    this.animationMap.set(animation, ref)
    this.idMap.set(animation, id)

    // Register for finalization callback
    // Register for finalization callback only if supported
    this.registry?.register(animation, id)

    this.start()
    return id
  }

  /**
   * Clean up dead WeakRefs from the animations set
   * Prevents memory bloat from accumulated dead references
   */
  private cleanupDeadRefs(): void {
    for (const ref of this.animations) {
      if (ref.deref() === undefined) {
        this.animations.delete(ref)
      }
    }
  }

  /**
   * Remove an animation from the loop
   */
  remove(animation: Animatable): void {
    const ref = this.animationMap.get(animation)
    if (ref) {
      this.animations.delete(ref)
      this.animationMap.delete(animation)
      this.idMap.delete(animation)
      // Note: unregister not strictly needed as registry uses weak refs
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
   * Start the animation loop
   */
  private start(): void {
    if (this.isRunning) return
    this.isRunning = true
    this.lastTime = performance.now()
    this.tick()
  }

  /**
   * Stop the animation loop
   */
  private stop(): void {
    this.isRunning = false
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  /**
   * Single animation frame - optimized single-pass update + cleanup
   * Features:
   * - WeakRef dereferencing with automatic cleanup of dead refs
   * - Delta time clamping for frame-drop resilience
   * - O(n) single-pass performance
   * - Frame listener notifications
   */
  private tick = (): void => {
    const now = performance.now()

    // Calculate and clamp delta time to prevent physics explosions
    // This handles tab suspension, debugger pauses, etc.
    const rawDelta = now - this.lastTime
    const clampedDelta = Math.min(rawDelta, MAX_DELTA_TIME)
    this.lastTime = now

    // Store frame duration for FPS calculation
    this.lastFrameDuration = clampedDelta

    // Notify frame listeners (with error isolation)
    for (const listener of this.frameListeners) {
      try {
        listener(clampedDelta)
      } catch (e) {
        console.error('[SpringKit] Frame listener error:', e)
      }
    }

    // Single pass: update all animations and collect refs to remove
    const toRemove: WeakRef<Animatable>[] = []

    for (const ref of this.animations) {
      const animation = ref.deref()

      // If WeakRef is dead (animation was garbage collected), mark for removal
      if (!animation) {
        toRemove.push(ref)
        continue
      }

      animation.update(now)

      if (animation.isComplete()) {
        toRemove.push(ref)
        this.animationMap.delete(animation)
        this.idMap.delete(animation)
      }
    }

    // Remove dead/completed refs
    for (let i = 0; i < toRemove.length; i++) {
      this.animations.delete(toRemove[i]!)
    }

    // Continue or stop loop
    if (this.animations.size > 0) {
      this.rafId = requestAnimationFrame(this.tick)
    } else {
      this.stop()
    }
  }

  /**
   * Get the number of active animations (including potentially dead refs)
   */
  get size(): number {
    return this.animations.size
  }

  /**
   * Get count of actually alive animations (for debugging/testing)
   */
  getAliveCount(): number {
    let count = 0
    for (const ref of this.animations) {
      if (ref.deref()) count++
    }
    return count
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
