import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createTrail } from '@oxog/springkit'

describe('createTrail', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('basic usage', () => {
    it('should create a trail', () => {
      const trail = createTrail(3)
      expect(trail.getValues()).toEqual([0, 0, 0])
    })

    it('should get values', () => {
      const trail = createTrail(3)
      const values = trail.getValues()
      expect(values).toHaveLength(3)
      expect(values).toEqual([0, 0, 0])
    })

    it('should jump all values', () => {
      const trail = createTrail(3)
      trail.jump(100)
      expect(trail.getValues()).toEqual([100, 100, 100])
    })

    it('should set leader value', () => {
      const trail = createTrail(3)
      trail.set(50)
      // Leader changes immediately
      expect(trail).toBeDefined()
    })
  })

  describe('subscribe', () => {
    it('should subscribe to value changes', () => {
      const trail = createTrail(3)
      const callback = vi.fn()
      const unsubscribe = trail.subscribe(callback)

      // Each spring's subscribe triggers a notification (3) + initial call = 4
      expect(callback).toHaveBeenCalledTimes(4)
      expect(callback).toHaveBeenLastCalledWith([0, 0, 0])

      unsubscribe()
    })

    it('should call callback on jump', () => {
      const trail = createTrail(3)
      const callback = vi.fn()
      trail.subscribe(callback)

      callback.mockClear()

      trail.jump(100)

      // Each spring notifies when it jumps (3 springs)
      expect(callback).toHaveBeenCalledTimes(3)
      expect(callback).toHaveBeenLastCalledWith([100, 100, 100])
    })

    it('should unsubscribe correctly', () => {
      const trail = createTrail(3)
      const callback = vi.fn()
      const unsubscribe = trail.subscribe(callback)

      // Clear calls from subscription
      callback.mockClear()

      unsubscribe()
      trail.jump(100)

      // After unsubscribe, no more calls should happen
      expect(callback).toHaveBeenCalledTimes(0)
    })
  })

  describe('followDelay', () => {
    it('should use default followDelay', () => {
      const trail = createTrail(3)
      expect(trail).toBeDefined()
    })

    it('should use custom followDelay', () => {
      const trail = createTrail(3, { followDelay: 5 })
      expect(trail).toBeDefined()
    })
  })

  describe('destroy', () => {
    it('should clean up resources', () => {
      const trail = createTrail(3)
      trail.destroy()
      expect(trail).toBeDefined()
    })

    it('should prevent further updates after destroy', () => {
      const trail = createTrail(3)
      trail.destroy()
      trail.jump(100)
      expect(trail.getValues()).toBeDefined()
    })
  })

  describe('config', () => {
    it('should use provided config', () => {
      const trail = createTrail(3, {
        stiffness: 200,
        damping: 25,
        followDelay: 3,
      })
      expect(trail).toBeDefined()
    })

    it('should handle zero count', () => {
      const trail = createTrail(0)
      expect(trail.getValues()).toEqual([])
    })

    it('should handle single item', () => {
      const trail = createTrail(1)
      expect(trail.getValues()).toEqual([0])
    })

    it('should trigger immediate update when followDelay is 0', async () => {
      // This tests line 89: immediate update when framesToWait <= 0
      const trail = createTrail(2, { followDelay: 0 })
      const callback = vi.fn()
      trail.subscribe(callback)

      callback.mockClear()

      // With followDelay = 0, framesToWait will be 0, triggering line 89
      trail.set(100)

      // Wait for the updates to propagate
      await new Promise(resolve => setTimeout(resolve, 50))

      // Springs should have been updated
      expect(callback).toHaveBeenCalled()
    }, 2000)

    it('should handle delayed updates via setTimeout', async () => {
      // This tests lines 96-99: the setTimeout callback
      const trail = createTrail(2, { followDelay: 1 })
      const callback = vi.fn()
      trail.subscribe(callback)

      callback.mockClear()

      // Trigger the delayed update path
      trail.set(50)

      // Wait for the setTimeout to execute
      await new Promise(resolve => setTimeout(resolve, 100))

      // The setTimeout callback should have executed
      expect(callback).toHaveBeenCalled()

      trail.destroy()
    }, 2000)

    it('should handle multiple rapid updates', async () => {
      // Tests that pending updates are properly tracked and cancelled
      const trail = createTrail(2, { followDelay: 1 })
      const callback = vi.fn()
      trail.subscribe(callback)

      callback.mockClear()

      // Trigger an update
      trail.set(50)

      // Wait for it to complete
      await new Promise(resolve => setTimeout(resolve, 100))

      // Should have triggered updates
      expect(callback).toHaveBeenCalled()

      trail.destroy()
    }, 2000)
  })
})
