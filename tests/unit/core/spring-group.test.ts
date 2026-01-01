import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createSpringGroup } from '@oxog/springkit'

describe('createSpringGroup', () => {
  beforeEach(() => {
    // Use real timers for rAF-based animations
    vi.useRealTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('basic usage', () => {
    it('should create a spring group', () => {
      const group = createSpringGroup({ x: 0, y: 0 })
      expect(group.get()).toEqual({ x: 0, y: 0 })
    })

    it('should get single value', () => {
      const group = createSpringGroup({ x: 0, y: 100 })
      expect(group.getValue('x')).toBe(0)
      expect(group.getValue('y')).toBe(100)
    })

    it('should get all values', () => {
      const group = createSpringGroup({ x: 50, y: 100, scale: 1 })
      const values = group.get()

      expect(values).toEqual({ x: 50, y: 100, scale: 1 })
    })

    it('should check if animating', () => {
      const group = createSpringGroup({ x: 0, y: 0 })
      expect(group.isAnimating()).toBe(false)
    })
  })

  describe('set', () => {
    it('should animate all values', () => {
      const group = createSpringGroup({ x: 0, y: 0 })
      group.set({ x: 100, y: 50 })

      expect(group.isAnimating()).toBe(true)
    })

    it('should animate partial values', () => {
      const group = createSpringGroup({ x: 0, y: 0, scale: 1 })
      group.set({ x: 100 })

      expect(group.isAnimating()).toBe(true)
      expect(group.getValue('y')).toBe(0)
      expect(group.getValue('scale')).toBe(1)
    })

    it('should accept config override', () => {
      const group = createSpringGroup({ x: 0, y: 0 }, { stiffness: 100 })
      group.set({ x: 100 }, { stiffness: 200 })

      expect(group.isAnimating()).toBe(true)
    })
  })

  describe('jump', () => {
    it('should set values immediately', () => {
      const group = createSpringGroup({ x: 0, y: 0 })
      group.jump({ x: 100, y: 50 })

      expect(group.get()).toEqual({ x: 100, y: 50 })
      expect(group.isAnimating()).toBe(false)
    })

    it('should jump partial values', () => {
      const group = createSpringGroup({ x: 0, y: 0, scale: 1 })
      group.jump({ x: 100 })

      expect(group.get()).toEqual({ x: 100, y: 0, scale: 1 })
    })

    it('should cancel existing animations', () => {
      const group = createSpringGroup({ x: 0, y: 0 })
      group.set({ x: 100 })
      group.jump({ x: 50, y: 50 })

      expect(group.get()).toEqual({ x: 50, y: 50 })
      expect(group.isAnimating()).toBe(false)
    })
  })

  describe('subscribe', () => {
    it('should subscribe to value changes', () => {
      const group = createSpringGroup({ x: 0, y: 0 })
      const callback = vi.fn()
      const unsubscribe = group.subscribe(callback)

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith({ x: 0, y: 0 })

      unsubscribe()
    })

    it('should call callback on changes', async () => {
      const group = createSpringGroup({ x: 0, y: 0 })
      const callback = vi.fn()

      group.subscribe(callback)
      group.jump({ x: 100 })

      // Wait for the debounced notification via requestAnimationFrame
      await new Promise(resolve => requestAnimationFrame(resolve))

      expect(callback).toHaveBeenCalledTimes(2)
      expect(callback).toHaveBeenLastCalledWith({ x: 100, y: 0 })
    })

    it('should unsubscribe correctly', () => {
      const group = createSpringGroup({ x: 0, y: 0 })
      const callback = vi.fn()
      const unsubscribe = group.subscribe(callback)

      unsubscribe()
      group.jump({ x: 100 })

      expect(callback).toHaveBeenCalledTimes(1)
    })
  })

  describe('finished promise', () => {
    it('should resolve when all animations complete', async () => {
      const group = createSpringGroup({ x: 0, y: 0 }, {
        restSpeed: 10,
        restDelta: 10,
        stiffness: 1000,
        damping: 50,
      })

      group.set({ x: 100, y: 50 })

      // Wait for the finished promise to resolve
      await group.finished
    }, 2000)
  })

  describe('destroy', () => {
    it('should clean up resources', () => {
      const group = createSpringGroup({ x: 0, y: 0 })
      const callback = vi.fn()

      group.subscribe(callback)
      group.destroy()
      group.set({ x: 100 })

      // Wait a bit to ensure callback is not called
      return new Promise(resolve => {
        setTimeout(() => {
          // Callback should only be called once (initial call), not after destroy
          expect(callback).toHaveBeenCalledTimes(1)
          resolve(undefined)
        }, 50)
      })
    })
  })

  describe('config', () => {
    it('should use provided config', () => {
      const group = createSpringGroup(
        { x: 0, y: 0 },
        { stiffness: 200, damping: 20 }
      )

      expect(group).toBeDefined()
    })

    it('should handle empty initial values', () => {
      const group = createSpringGroup({} as Record<string, number>)
      expect(group.get()).toEqual({})
    })

    it('should handle single value', () => {
      const group = createSpringGroup({ x: 0 })
      expect(group.get()).toEqual({ x: 0 })
    })

    it('should return 0 for non-existent key', () => {
      const group = createSpringGroup({ x: 0, y: 0 })
      // Type cast to test defensive fallback
      expect(group.getValue('z' as any)).toBe(0)
    })
  })
})
