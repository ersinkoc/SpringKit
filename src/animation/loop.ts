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
 */
const MAX_DELTA_TIME = 64 // ~15fps minimum, prevents huge jumps

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
  private registry = new FinalizationRegistry<number>((id) => {
    this.cleanupCallbacks.forEach((cb) => cb(id))
  })
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

    const id = this.nextId++
    const ref = new WeakRef(animation)
    this.animations.add(ref)
    this.animationMap.set(animation, ref)
    this.idMap.set(animation, id)

    // Register for finalization callback
    this.registry.register(animation, id)

    this.start()
    return id
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

    // Notify frame listeners
    for (const listener of this.frameListeners) {
      listener(clampedDelta)
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

  /**
   * Get current frame rate (based on last delta)
   */
  getFPS(): number {
    const delta = performance.now() - this.lastTime
    return delta > 0 ? Math.round(1000 / delta) : 60
  }
}

/**
 * Global animation loop instance
 */
export const globalLoop = new AnimationLoop()
