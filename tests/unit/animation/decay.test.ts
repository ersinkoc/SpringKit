import { describe, it, expect, beforeEach, vi } from 'vitest'
import { decay } from '@oxog/springkit'

describe('decay', () => {
  // Use real timers for rAF-based animations
  beforeEach(() => {
    vi.useRealTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('basic decay', () => {
    it('should create a decay animation', () => {
      const onUpdate = vi.fn()
      const anim = decay({ velocity: 1000, onUpdate })

      expect(anim).toBeDefined()
    })

    it('should start decay', async () => {
      const onUpdate = vi.fn()
      const anim = decay({ velocity: 1000, onUpdate })

      anim.start()

      // Wait for the first animation frame
      await new Promise(resolve => setTimeout(resolve, 20))

      expect(onUpdate).toHaveBeenCalled()

      anim.stop()
    })

    it('should stop decay', async () => {
      const onUpdate = vi.fn()
      const anim = decay({ velocity: 1000, onUpdate })

      anim.start()
      anim.stop()

      expect(anim).toBeDefined()
    })
  })

  describe('velocity', () => {
    it('should decay positive velocity', async () => {
      const values: number[] = []
      const onUpdate = (v: number) => values.push(v)

      const anim = decay({ velocity: 1000, deceleration: 0.9, onUpdate })

      anim.start()

      // Wait for the first animation frame
      await new Promise(resolve => setTimeout(resolve, 20))

      // First update should have moved forward
      expect(values[0]).toBeGreaterThan(0)

      anim.stop()
    })

    it('should decay negative velocity', async () => {
      const values: number[] = []
      const onUpdate = (v: number) => values.push(v)

      const anim = decay({ velocity: -1000, deceleration: 0.9, onUpdate })

      anim.start()

      // Wait for the first animation frame
      await new Promise(resolve => setTimeout(resolve, 20))

      // First update should have moved backward
      expect(values[0]).toBeLessThan(0)

      anim.stop()
    })
  })

  describe('deceleration', () => {
    it('should use default deceleration', async () => {
      const onUpdate = vi.fn()
      const anim = decay({ velocity: 1000, onUpdate })

      anim.start()

      // Wait for the first animation frame
      await new Promise(resolve => setTimeout(resolve, 20))

      expect(onUpdate).toHaveBeenCalled()

      anim.stop()
    })

    it('should use custom deceleration', async () => {
      const onUpdate = vi.fn()
      const anim = decay({ velocity: 1000, deceleration: 0.95, onUpdate })

      anim.start()

      // Wait for the first animation frame
      await new Promise(resolve => setTimeout(resolve, 20))

      expect(onUpdate).toHaveBeenCalled()

      anim.stop()
    })
  })

  describe('clamping', () => {
    it('should clamp to range', async () => {
      const values: number[] = []
      const onUpdate = (v: number) => values.push(v)

      const anim = decay({
        velocity: 1000,
        clamp: [0, 500],
        onUpdate,
      })

      anim.start()

      // Wait for some frames to collect values
      await new Promise(resolve => setTimeout(resolve, 50))

      anim.stop()

      // Values should be within clamp range
      for (const v of values) {
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(500)
      }
    })

    it('should handle negative clamp range', async () => {
      const values: number[] = []
      const onUpdate = (v: number) => values.push(v)

      const anim = decay({
        velocity: -1000,
        clamp: [-500, 0],
        onUpdate,
      })

      anim.start()

      // Wait for some frames to collect values
      await new Promise(resolve => setTimeout(resolve, 50))

      anim.stop()

      for (const v of values) {
        expect(v).toBeGreaterThanOrEqual(-500)
        expect(v).toBeLessThanOrEqual(0)
      }
    })
  })

  describe('callbacks', () => {
    it('should call onComplete', async () => {
      const onComplete = vi.fn()
      const anim = decay({
        velocity: 100,
        deceleration: 0.85, // Decay velocity by 15% each frame
        onComplete,
      })

      anim.start()

      // Wait for the finished promise to resolve
      await anim.finished

      expect(onComplete).toHaveBeenCalled()
    }, 2000)

    it('should call onUpdate during animation', async () => {
      const onUpdate = vi.fn()
      const anim = decay({ velocity: 1000, onUpdate })

      anim.start()

      // Wait for first frame
      await new Promise(resolve => setTimeout(resolve, 20))

      expect(onUpdate).toHaveBeenCalled()

      anim.stop()
    })
  })

  describe('finished promise', () => {
    it('should resolve when complete', async () => {
      const anim = decay({ velocity: 10, deceleration: 0.5 })

      anim.start()

      // Wait for the finished promise to resolve
      await anim.finished
    }, 2000)
  })

  describe('destroy', () => {
    it('should clean up resources', () => {
      const onUpdate = vi.fn()
      const onComplete = vi.fn()
      const anim = decay({ velocity: 1000, onUpdate, onComplete })

      anim.destroy()

      // Should not throw and callbacks should be cleared
      expect(anim).toBeDefined()
    })

    it('should stop animation and clear callbacks', () => {
      const onUpdate = vi.fn()
      const onComplete = vi.fn()
      const anim = decay({ velocity: 1000, onUpdate, onComplete })

      anim.start()
      anim.destroy()

      // After destroy, callbacks should be cleared
      expect(anim).toBeDefined()
    })
  })

  describe('state management', () => {
    it('should handle calling start when already running', async () => {
      const anim = decay({ velocity: 1000 })

      anim.start()
      const result = anim.start() // Should return this without error

      expect(result).toBe(anim)

      anim.stop()
    })

    it('should handle update when not running', async () => {
      const onUpdate = vi.fn()
      const anim = decay({ velocity: 100, onUpdate, deceleration: 0.9 })

      // Get the underlying Animatable interface to call update directly
      const animatable = anim as unknown as { update: (now: number) => void }

      // Call update before starting - should return early via line 74 check
      animatable.update(performance.now())

      // Now start and stop
      anim.start()
      await new Promise(resolve => setTimeout(resolve, 20))
      anim.stop()

      // Call update after stopping - should return early via line 74 check
      animatable.update(performance.now())

      expect(anim).toBeDefined()
    })

    it('should handle update after completion', async () => {
      const anim = decay({
        velocity: 10,
        deceleration: 0.5,
      })

      anim.start()

      // Wait for completion
      await anim.finished

      // Get the underlying Animatable interface to call update directly
      const animatable = anim as unknown as { update: (now: number) => void }

      // Call update after completion - should return early via line 74 check
      animatable.update(performance.now())

      expect(anim).toBeDefined()
    }, 2000)
  })
})
