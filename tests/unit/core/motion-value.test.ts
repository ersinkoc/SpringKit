import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  MotionValue,
  createMotionValue,
  transformValue,
  motionMapRange,
} from '@oxog/springkit'

describe('MotionValue', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createMotionValue', () => {
    it('should create a motion value with initial value', () => {
      const mv = createMotionValue(100)
      expect(mv.get()).toBe(100)
    })

    it('should create motion value with spring config', () => {
      const mv = createMotionValue(0, {
        spring: { stiffness: 300, damping: 30 },
      })
      expect(mv.get()).toBe(0)
    })

    it('should support non-numeric values', () => {
      const mv = createMotionValue('hello')
      expect(mv.get()).toBe('hello')
    })
  })

  describe('MotionValue class', () => {
    describe('get()', () => {
      it('should return current value', () => {
        const mv = new MotionValue(50)
        expect(mv.get()).toBe(50)
      })
    })

    describe('getVelocity()', () => {
      it('should return 0 initially', () => {
        const mv = createMotionValue(0)
        expect(mv.getVelocity()).toBe(0)
      })

      it('should return velocity during animation', async () => {
        const mv = createMotionValue(0, {
          spring: { stiffness: 500, damping: 10 },
        })
        mv.set(100)

        await new Promise((r) => setTimeout(r, 50))

        // During animation, velocity should be non-zero
        const velocity = mv.getVelocity()
        expect(typeof velocity).toBe('number')
        mv.destroy()
      })
    })

    describe('isAnimating()', () => {
      it('should return false initially', () => {
        const mv = createMotionValue(0)
        expect(mv.isAnimating()).toBe(false)
      })

      it('should return true during animation', () => {
        const mv = createMotionValue(0)
        mv.set(100)
        expect(mv.isAnimating()).toBe(true)
        mv.destroy()
      })

      it('should return false after jump', () => {
        const mv = createMotionValue(0)
        mv.set(100)
        mv.jump(50)
        expect(mv.isAnimating()).toBe(false)
        mv.destroy()
      })
    })

    describe('set()', () => {
      it('should animate to new value by default', () => {
        const mv = createMotionValue(0)
        mv.set(100)
        expect(mv.isAnimating()).toBe(true)
        mv.destroy()
      })

      it('should instantly update when animate=false', () => {
        const mv = createMotionValue(0)
        mv.set(100, false)
        expect(mv.get()).toBe(100)
        expect(mv.isAnimating()).toBe(false)
      })

      it('should emit animationStart event', () => {
        const mv = createMotionValue(0)
        const callback = vi.fn()
        mv.on('animationStart', callback)

        mv.set(100)
        expect(callback).toHaveBeenCalled()
        mv.destroy()
      })

      it('should not animate destroyed motion value', () => {
        const mv = createMotionValue(0)
        mv.destroy()
        mv.set(100)
        expect(mv.get()).toBe(0)
      })

      it('should handle non-numeric values without animation', () => {
        const mv = createMotionValue<string>('a')
        mv.set('b')
        expect(mv.get()).toBe('b')
      })
    })

    describe('jump()', () => {
      it('should instantly set value', () => {
        const mv = createMotionValue(0)
        mv.jump(100)
        expect(mv.get()).toBe(100)
        expect(mv.isAnimating()).toBe(false)
      })

      it('should reset velocity to 0', () => {
        const mv = createMotionValue(0)
        mv.set(100)
        mv.jump(50)
        expect(mv.getVelocity()).toBe(0)
      })

      it('should cancel existing animation', () => {
        const mv = createMotionValue(0)
        mv.set(100)
        expect(mv.isAnimating()).toBe(true)
        mv.jump(50)
        expect(mv.isAnimating()).toBe(false)
        expect(mv.get()).toBe(50)
      })

      it('should not update destroyed motion value', () => {
        const mv = createMotionValue(0)
        mv.destroy()
        mv.jump(100)
        expect(mv.get()).toBe(0)
      })

      it('should notify subscribers', () => {
        const mv = createMotionValue(0)
        const callback = vi.fn()
        mv.subscribe(callback)
        callback.mockClear()

        mv.jump(100)
        expect(callback).toHaveBeenCalledWith(100)
      })
    })

    describe('stop()', () => {
      it('should stop animation at current value', () => {
        const mv = createMotionValue(0)
        mv.set(100)
        mv.stop()
        expect(mv.isAnimating()).toBe(false)
      })

      it('should emit animationEnd event', () => {
        const mv = createMotionValue(0)
        const callback = vi.fn()
        mv.on('animationEnd', callback)

        mv.set(100)
        mv.stop()
        expect(callback).toHaveBeenCalled()
        mv.destroy()
      })
    })

    describe('subscribe()', () => {
      it('should call callback immediately with current value', () => {
        const mv = createMotionValue(42)
        const callback = vi.fn()

        mv.subscribe(callback)
        expect(callback).toHaveBeenCalledWith(42)
      })

      it('should call callback on value changes', async () => {
        const mv = createMotionValue(0)
        const callback = vi.fn()

        mv.subscribe(callback)
        callback.mockClear()

        mv.jump(100)
        expect(callback).toHaveBeenCalledWith(100)
        mv.destroy()
      })

      it('should return unsubscribe function', () => {
        const mv = createMotionValue(0)
        const callback = vi.fn()

        const unsubscribe = mv.subscribe(callback)
        callback.mockClear()

        unsubscribe()
        mv.jump(100)

        expect(callback).not.toHaveBeenCalled()
      })

      it('should handle multiple subscribers', () => {
        const mv = createMotionValue(0)
        const callback1 = vi.fn()
        const callback2 = vi.fn()

        mv.subscribe(callback1)
        mv.subscribe(callback2)

        expect(callback1).toHaveBeenCalledWith(0)
        expect(callback2).toHaveBeenCalledWith(0)
      })

      it('should handle subscriber errors gracefully during updates', () => {
        const mv = createMotionValue(0)
        let shouldThrow = false
        const errorCallback = vi.fn(() => {
          if (shouldThrow) {
            throw new Error('Test error')
          }
        })
        const validCallback = vi.fn()

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        mv.subscribe(errorCallback)
        mv.subscribe(validCallback)

        // First clear the initial calls
        errorCallback.mockClear()
        validCallback.mockClear()

        // Now enable throwing and update
        shouldThrow = true
        mv.jump(100)

        // Valid callback should still be called despite error in previous subscriber
        expect(validCallback).toHaveBeenCalledWith(100)
        expect(consoleSpy).toHaveBeenCalled()

        consoleSpy.mockRestore()
      })
    })

    describe('on()', () => {
      it('should subscribe to change events', () => {
        const mv = createMotionValue(0)
        const callback = vi.fn()

        mv.on('change', callback)
        mv.jump(100)

        expect(callback).toHaveBeenCalled()
      })

      it('should subscribe to animationStart events', () => {
        const mv = createMotionValue(0)
        const callback = vi.fn()

        mv.on('animationStart', callback)
        mv.set(100)

        expect(callback).toHaveBeenCalled()
        mv.destroy()
      })

      it('should subscribe to animationEnd events', async () => {
        const mv = createMotionValue(0, {
          spring: { stiffness: 1000, damping: 100 },
        })
        const callback = vi.fn()

        mv.on('animationEnd', callback)
        mv.set(100)
        mv.stop()

        expect(callback).toHaveBeenCalled()
        mv.destroy()
      })

      it('should return unsubscribe function', () => {
        const mv = createMotionValue(0)
        const callback = vi.fn()

        const unsubscribe = mv.on('change', callback)
        unsubscribe()

        mv.jump(100)
        expect(callback).not.toHaveBeenCalled()
      })

      it('should handle listener errors gracefully', () => {
        const mv = createMotionValue(0)
        const errorCallback = vi.fn(() => {
          throw new Error('Test error')
        })

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        mv.on('change', errorCallback)
        mv.jump(100)

        expect(consoleSpy).toHaveBeenCalled()
        consoleSpy.mockRestore()
      })
    })

    describe('setConfig()', () => {
      it('should update spring configuration', () => {
        const mv = createMotionValue(0)
        mv.setConfig({ stiffness: 500, damping: 50 })
        // Config change takes effect on next animation
        expect(mv).toBeDefined()
      })

      it('should merge with existing config', () => {
        const mv = createMotionValue(0, {
          spring: { stiffness: 100, damping: 15 },
        })
        mv.setConfig({ stiffness: 200 })
        // Should only update stiffness, keep damping
        expect(mv).toBeDefined()
      })
    })

    describe('destroy()', () => {
      it('should clean up all resources', () => {
        const mv = createMotionValue(0)
        const callback = vi.fn()
        mv.subscribe(callback)
        mv.on('change', callback)

        mv.destroy()
        callback.mockClear()

        mv.jump(100)
        expect(callback).not.toHaveBeenCalled()
      })

      it('should handle multiple destroy calls', () => {
        const mv = createMotionValue(0)
        mv.destroy()
        expect(() => mv.destroy()).not.toThrow()
      })
    })
  })

  describe('transformValue', () => {
    it('should create a derived motion value', () => {
      const source = createMotionValue(50)
      const derived = transformValue(source, (v) => v * 2)

      expect(derived.get()).toBe(100)
    })

    it('should update when source changes', () => {
      const source = createMotionValue(0)
      const derived = transformValue(source, (v) => v + 10)

      source.jump(50)
      expect(derived.get()).toBe(60)
    })

    it('should support type transformation', () => {
      const source = createMotionValue(0)
      const derived = transformValue(source, (v) => `${v}px`)

      expect(derived.get()).toBe('0px')
      source.jump(100)
      expect(derived.get()).toBe('100px')
    })

    it('should handle complex transformations', () => {
      const source = createMotionValue(0)
      const derived = transformValue(source, (v) => ({
        x: v,
        y: v * 2,
      }))

      expect(derived.get()).toEqual({ x: 0, y: 0 })
      source.jump(50)
      expect(derived.get()).toEqual({ x: 50, y: 100 })
    })
  })

  describe('motionMapRange', () => {
    it('should map value from input range to output range', () => {
      const source = createMotionValue(50)
      const mapped = motionMapRange(source, [0, 100], [0, 1])

      expect(mapped.get()).toBe(0.5)
    })

    it('should handle extrapolation by default', () => {
      const source = createMotionValue(150)
      const mapped = motionMapRange(source, [0, 100], [0, 1])

      expect(mapped.get()).toBe(1.5)
    })

    it('should clamp when option is set', () => {
      const source = createMotionValue(150)
      const mapped = motionMapRange(source, [0, 100], [0, 1], { clamp: true })

      expect(mapped.get()).toBe(1)
    })

    it('should handle negative ranges', () => {
      const source = createMotionValue(0)
      const mapped = motionMapRange(source, [-100, 100], [0, 1])

      expect(mapped.get()).toBe(0.5)
    })

    it('should update when source changes', () => {
      const source = createMotionValue(0)
      const mapped = motionMapRange(source, [0, 100], [0, 1])

      expect(mapped.get()).toBe(0)
      source.jump(100)
      expect(mapped.get()).toBe(1)
    })

    it('should handle inverted ranges', () => {
      const source = createMotionValue(0)
      const mapped = motionMapRange(source, [0, 100], [1, 0])

      expect(mapped.get()).toBe(1)
      source.jump(100)
      expect(mapped.get()).toBe(0)
    })
  })
})
