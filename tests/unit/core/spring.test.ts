import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { spring } from '@oxog/springkit'

describe('spring', () => {
  let callbacks: {
    onUpdate?: (value: number) => void
    onStart?: () => void
    onComplete?: () => void
    onRest?: () => void
  }

  beforeEach(() => {
    callbacks = {
      onUpdate: vi.fn(),
      onStart: vi.fn(),
      onComplete: vi.fn(),
      onRest: vi.fn(),
    }
    // Use real timers for rAF-based animations
    vi.useRealTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('basic animation', () => {
    it('should create a spring animation', () => {
      const anim = spring(0, 100, callbacks)
      expect(anim).toBeDefined()
      expect(anim.getValue()).toBe(0)
    })

    it('should start animation', () => {
      const anim = spring(0, 100, callbacks)
      anim.start()

      expect(callbacks.onStart).toHaveBeenCalledOnce()
      expect(anim.isAnimating()).toBe(true)
    })

    it('should stop animation', () => {
      const anim = spring(0, 100, callbacks)
      anim.start()
      anim.stop()

      expect(anim.isAnimating()).toBe(false)
    })

    it('should pause and resume animation', () => {
      const anim = spring(0, 100, callbacks)
      anim.start()
      anim.pause()

      expect(anim.isPaused()).toBe(true)

      anim.resume()

      expect(anim.isAnimating()).toBe(true)
      expect(anim.isPaused()).toBe(false)
    })

    it('should reverse animation', () => {
      const anim = spring(0, 100, callbacks)
      anim.reverse()

      expect(anim.getValue()).toBe(0)
    })
  })

  describe('value updates', () => {
    it('should update target while animating', () => {
      const anim = spring(0, 100, callbacks)
      anim.start()
      anim.set(200)

      expect(anim.getValue()).toBeGreaterThanOrEqual(0)
    })

    it('should get velocity', () => {
      const anim = spring(0, 100, callbacks)
      anim.start()

      expect(anim.getVelocity()).toBeGreaterThanOrEqual(0)
    })
  })

  describe('state checks', () => {
    it('should check if animating', () => {
      const anim = spring(0, 100, callbacks)
      expect(anim.isAnimating()).toBe(false)

      anim.start()
      expect(anim.isAnimating()).toBe(true)
    })

    it('should check if paused', () => {
      const anim = spring(0, 100, callbacks)
      expect(anim.isPaused()).toBe(false)

      anim.start()
      anim.pause()
      expect(anim.isPaused()).toBe(true)
    })

    it('should check if complete', () => {
      const anim = spring(0, 100, callbacks)
      expect(anim.isComplete()).toBe(false)
    })
  })

  describe('cleanup', () => {
    it('should destroy animation', () => {
      const anim = spring(0, 100, callbacks)
      anim.start()
      anim.destroy()

      expect(anim.isAnimating()).toBe(false)
    })
  })

  describe('finished promise', () => {
    it('should resolve when animation completes', async () => {
      const anim = spring(0, 100, {
        onUpdate: vi.fn(),
        restSpeed: 10,
        restDelta: 10,
        stiffness: 1000,
        damping: 50,
      })

      anim.start()

      // Wait for the finished promise to resolve
      await anim.finished
    }, 2000)
  })

  describe('default config', () => {
    it('should use default config when none provided', () => {
      const anim = spring(0, 100)
      expect(anim).toBeDefined()
      expect(anim.getValue()).toBe(0)
    })
  })

  describe('chaining', () => {
    it('should return this from start', () => {
      const anim = spring(0, 100, callbacks)
      const result = anim.start()
      expect(result).toBe(anim)
    })
  })

  describe('clamp option', () => {
    it('should clamp values to the from-to range', async () => {
      const values: number[] = []
      const anim = spring(0, 100, {
        clamp: true,
        onUpdate: (value) => {
          values.push(value)
        },
        stiffness: 200,
        damping: 20,
      })

      anim.start()

      // Wait for some updates
      await new Promise(resolve => setTimeout(resolve, 100))

      // All values should be between 0 and 100
      for (const value of values) {
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThanOrEqual(100)
      }

      // Stop the animation
      anim.stop()
    })

    it('should clamp when reversing', async () => {
      const anim = spring(100, 0, {
        clamp: true,
        onUpdate: vi.fn(),
        stiffness: 200,
        damping: 20,
      })

      anim.start()

      // Wait for some updates
      await new Promise(resolve => setTimeout(resolve, 50))

      // Value should be between 0 and 100
      const value = anim.getValue()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThanOrEqual(100)

      anim.stop()
    })
  })

  describe('state management', () => {
    it('should handle calling start when already running', async () => {
      const anim = spring(0, 100, callbacks)

      anim.start()
      const result = anim.start() // Should return this without error

      expect(result).toBe(anim)
      expect(callbacks.onStart).toHaveBeenCalledOnce()

      anim.stop()
    })

    it('should handle update when not running', async () => {
      const onUpdate = vi.fn()
      const anim = spring(0, 100, { onUpdate, stiffness: 200, damping: 20 })

      // Get the underlying Animatable interface to call update directly
      const animatable = anim as unknown as { update: (now: number) => void }

      // Call update before starting - should return early via line 127 check
      animatable.update(performance.now())

      expect(anim.getValue()).toBe(0)

      // Now start and stop
      anim.start()
      await new Promise(resolve => setTimeout(resolve, 20))
      anim.stop()

      // Call update after stopping - should return early via line 127 check
      animatable.update(performance.now())

      expect(anim).toBeDefined()
    })

    it('should handle update after completion', async () => {
      const anim = spring(0, 100, {
        stiffness: 1000,
        damping: 50,
        restSpeed: 10,
        restDelta: 10,
      })

      anim.start()

      // Wait for completion
      await anim.finished

      // Get the underlying Animatable interface
      const animatable = anim as unknown as { update: (now: number) => void }

      // Call update after completion - should return early via line 127 check
      animatable.update(performance.now())

      expect(anim).toBeDefined()
    }, 2000)
  })

  describe('onRest callback', () => {
    it('should call onRest when animation completes', async () => {
      const onRest = vi.fn()
      const anim = spring(0, 100, {
        onRest,
        stiffness: 1000,
        damping: 50,
        restSpeed: 10,
        restDelta: 10,
      })

      anim.start()

      // Wait for the animation to complete
      await anim.finished

      expect(onRest).toHaveBeenCalled()
    }, 2000)
  })

  describe('setWithVelocity', () => {
    it('should update target while preserving velocity', async () => {
      const onUpdate = vi.fn()
      const anim = spring(0, 100, {
        onUpdate,
        stiffness: 200,
        damping: 20,
      })

      anim.start()

      // Wait for some animation to build velocity
      await new Promise(resolve => setTimeout(resolve, 50))

      const velocityBefore = anim.getVelocity()

      // Change target while preserving velocity
      anim.setWithVelocity(200)

      // Velocity should be preserved
      expect(anim.getVelocity()).toBe(velocityBefore)

      anim.stop()
    })

    it('should update target with explicit velocity', async () => {
      const anim = spring(0, 100, {
        stiffness: 200,
        damping: 20,
      })

      anim.start()
      await new Promise(resolve => setTimeout(resolve, 30))

      // Change target with explicit velocity
      anim.setWithVelocity(200, 500)

      expect(anim.getVelocity()).toBe(500)

      anim.stop()
    })

    it('should start animation if not running', () => {
      const anim = spring(0, 100, {
        stiffness: 200,
        damping: 20,
      })

      // Call setWithVelocity without starting first
      anim.setWithVelocity(200, 100)

      // Animation should now be running
      expect(anim.isAnimating()).toBe(true)

      anim.stop()
    })
  })
})
