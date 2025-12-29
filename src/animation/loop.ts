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
 * Global animation loop manager
 * Uses requestAnimationFrame to drive all animations
 */
class AnimationLoop {
  private animations = new Set<Animatable>()
  private rafId: number | null = null
  private isRunning = false

  /**
   * Add an animation to the loop
   */
  add(animation: Animatable): void {
    this.animations.add(animation)
    this.start()
  }

  /**
   * Remove an animation from the loop
   */
  remove(animation: Animatable): void {
    this.animations.delete(animation)
    if (this.animations.size === 0) {
      this.stop()
    }
  }

  /**
   * Start the animation loop
   */
  private start(): void {
    if (this.isRunning) return
    this.isRunning = true
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
   * Single animation frame
   */
  private tick = (): void => {
    const now = performance.now()

    // Update all animations
    for (const animation of this.animations) {
      animation.update(now)
    }

    // Remove completed animations
    const completed: Animatable[] = []
    for (const animation of this.animations) {
      if (animation.isComplete()) {
        completed.push(animation)
      }
    }
    for (const animation of completed) {
      this.animations.delete(animation)
    }

    // Continue or stop loop
    if (this.animations.size > 0) {
      this.rafId = requestAnimationFrame(this.tick)
    } else {
      this.stop()
    }
  }

  /**
   * Get the number of active animations
   */
  get size(): number {
    return this.animations.size
  }
}

/**
 * Global animation loop instance
 */
export const globalLoop = new AnimationLoop()
