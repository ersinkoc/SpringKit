import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createSpringValue } from '@oxog/springkit'

describe('createSpringValue', () => {
  beforeEach(() => {
    // Use real timers for rAF-based animations
    vi.useRealTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('basic usage', () => {
    it('should create a spring value', () => {
      const value = createSpringValue(0)
      expect(value.get()).toBe(0)
    })

    it('should get velocity', () => {
      const value = createSpringValue(0)
      expect(value.getVelocity()).toBe(0)
    })

    it('should check if animating', () => {
      const value = createSpringValue(0)
      expect(value.isAnimating()).toBe(false)
    })
  })

  describe('set', () => {
    it('should animate to new value', () => {
      const value = createSpringValue(0)
      value.set(100)

      expect(value.get()).toBeGreaterThanOrEqual(0)
      expect(value.isAnimating()).toBe(true)
    })

    it('should accept config override', () => {
      const value = createSpringValue(0, { stiffness: 100 })
      value.set(100, { stiffness: 200 })

      expect(value.isAnimating()).toBe(true)
    })

    it('should interrupt existing animation', () => {
      const value = createSpringValue(0)
      value.set(100)
      value.set(50)

      expect(value.get()).toBeGreaterThanOrEqual(0)
    })
  })

  describe('jump', () => {
    it('should set value immediately', () => {
      const value = createSpringValue(0)
      value.jump(100)

      expect(value.get()).toBe(100)
      expect(value.isAnimating()).toBe(false)
    })

    it('should cancel existing animation', () => {
      const value = createSpringValue(0)
      value.set(100)
      value.jump(50)

      expect(value.get()).toBe(50)
      expect(value.isAnimating()).toBe(false)
    })
  })

  describe('subscribe', () => {
    it('should subscribe to value changes', () => {
      const value = createSpringValue(0)
      const callback = vi.fn()
      const unsubscribe = value.subscribe(callback)

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith(0)

      unsubscribe()
    })

    it('should unsubscribe correctly', () => {
      const value = createSpringValue(0)
      const callback = vi.fn()
      const unsubscribe = value.subscribe(callback)

      unsubscribe()
      value.set(100)

      // Should only have initial call
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should call all subscribers', async () => {
      const value = createSpringValue(0)
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      value.subscribe(callback1)
      value.subscribe(callback2)

      value.set(100)

      // Wait for animation to update
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(callback1).toHaveBeenCalled()
      expect(callback2).toHaveBeenCalled()
    })
  })

  describe('finished promise', () => {
    it('should resolve when animation completes', async () => {
      const value = createSpringValue(0, {
        restSpeed: 10,
        restDelta: 10,
        stiffness: 1000,
        damping: 50,
      })

      value.set(100)

      // Wait for the finished promise to resolve
      await value.finished
    }, 2000)
  })

  describe('destroy', () => {
    it('should clean up resources', () => {
      const value = createSpringValue(0)
      const callback = vi.fn()

      value.subscribe(callback)
      value.destroy()
      value.set(100)

      // Wait a bit to ensure callback is not called
      return new Promise(resolve => {
        setTimeout(() => {
          // Callback should not be called after destroy (only initial call)
          expect(callback).toHaveBeenCalledTimes(1)
          resolve(undefined)
        }, 50)
      })
    })
  })

  describe('config', () => {
    it('should use provided config', () => {
      const value = createSpringValue(0, {
        stiffness: 200,
        damping: 20,
      })

      expect(value).toBeDefined()
    })

    it('should use default config when none provided', () => {
      const value = createSpringValue(0)
      expect(value).toBeDefined()
    })
  })

  describe('null/undefined handling', () => {
    it('should return 0 for velocity when no animation is active', () => {
      // This tests line 52: return this.currentAnimation?.getVelocity() ?? 0
      const value = createSpringValue(0)

      // No animation has been started, so currentAnimation is null
      expect(value.getVelocity()).toBe(0)
    })

    it('should return velocity from active animation', async () => {
      // This tests the other branch of line 52: when currentAnimation exists
      const value = createSpringValue(0, { stiffness: 200, damping: 20 })
      value.set(100)

      // Animation is active, should get velocity from it
      const velocity = value.getVelocity()

      // Velocity should be a number (could be 0 or positive)
      expect(typeof velocity).toBe('number')

      // Clean up
      value.destroy()
    })

    it('should handle destroy when no animation is active', () => {
      // This tests line 120: this.currentAnimation?.destroy()
      const value = createSpringValue(0)

      // No animation has been started, so currentAnimation is null
      // Calling destroy should not throw
      expect(() => value.destroy()).not.toThrow()
    })

    it('should return false for isAnimating when no animation is active', () => {
      const value = createSpringValue(0)

      // No animation has been started
      expect(value.isAnimating()).toBe(false)
    })
  })

  describe('setConfig', () => {
    it('should update spring configuration', () => {
      const value = createSpringValue(0, { stiffness: 100, damping: 10 })

      value.setConfig({ stiffness: 200 })

      // Config should be updated (we can verify by animation behavior)
      value.set(100)
      expect(value.isAnimating()).toBe(true)
      value.destroy()
    })

    it('should merge with existing config', () => {
      const value = createSpringValue(0, { stiffness: 100, damping: 10, mass: 2 })

      // Only update stiffness, keep other values
      value.setConfig({ stiffness: 500 })

      value.set(100)
      expect(value.isAnimating()).toBe(true)
      value.destroy()
    })
  })

  describe('isDestroyed', () => {
    it('should return false before destroy', () => {
      const value = createSpringValue(0)
      expect(value.isDestroyed()).toBe(false)
    })

    it('should return true after destroy', () => {
      const value = createSpringValue(0)
      value.destroy()
      expect(value.isDestroyed()).toBe(true)
    })
  })

  describe('use after destroy protection', () => {
    it('should not animate after destroy', () => {
      const value = createSpringValue(0)
      value.destroy()
      value.set(100)

      // Value should remain 0 since set() is guarded
      expect(value.get()).toBe(0)
    })

    it('should not jump after destroy', () => {
      const value = createSpringValue(0)
      value.destroy()
      value.jump(100)

      // Value should remain 0 since jump() is guarded
      expect(value.get()).toBe(0)
    })

    it('should handle multiple destroy calls', () => {
      const value = createSpringValue(0)
      value.destroy()
      expect(() => value.destroy()).not.toThrow()
    })
  })

  describe('NaN/Infinity validation', () => {
    it('should handle NaN in set()', () => {
      const value = createSpringValue(50)
      value.set(NaN)

      // Should use fallback value (0) from validateAnimationValue
      expect(value.get()).toBe(50) // Stays at initial since animation starts from current
    })

    it('should handle Infinity in set()', () => {
      const value = createSpringValue(50)
      value.set(Infinity)

      // Should use fallback value (0) from validateAnimationValue
      expect(Number.isFinite(value.get())).toBe(true)
    })

    it('should handle NaN in jump()', () => {
      const value = createSpringValue(50)
      value.jump(NaN)

      // Should use fallback value (0) from validateAnimationValue
      expect(value.get()).toBe(0)
    })

    it('should handle Infinity in jump()', () => {
      const value = createSpringValue(50)
      value.jump(Infinity)

      // Should use fallback value (0) from validateAnimationValue
      expect(value.get()).toBe(0)
    })

    it('should handle NaN initial value', () => {
      const value = createSpringValue(NaN)

      // Should use fallback value (0)
      expect(value.get()).toBe(0)
    })
  })

  describe('subscriber error isolation', () => {
    it('should continue notifying other subscribers if one throws', async () => {
      const value = createSpringValue(0)
      const errorCallback = vi.fn(() => {
        throw new Error('Subscriber error')
      })
      const normalCallback = vi.fn()

      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      value.subscribe(errorCallback)
      value.subscribe(normalCallback)

      value.jump(100)

      // Both should have been called (initial + jump)
      expect(errorCallback).toHaveBeenCalledTimes(2)
      expect(normalCallback).toHaveBeenCalledTimes(2)
      expect(normalCallback).toHaveBeenLastCalledWith(100)

      consoleSpy.mockRestore()
      value.destroy()
    })
  })
})
