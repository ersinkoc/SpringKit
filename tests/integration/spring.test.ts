import { describe, it, expect, beforeEach } from 'vitest'
import { spring, createSpringValue, createSpringGroup } from '@oxog/springkit'

describe('spring integration tests', () => {
  beforeEach(() => {
    // Use real timers for rAF-based animations
    vi.useRealTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('spring animation lifecycle', () => {
    it('should complete full animation', async () => {
      const values: number[] = []
      const anim = spring(0, 100, {
        onUpdate: (v) => values.push(v),
        restSpeed: 10,
        restDelta: 10,
        stiffness: 1000,
        damping: 50,
      })

      anim.start()

      // Wait for animation to complete (real timers for rAF)
      await anim.finished

      expect(anim.isComplete()).toBe(true)
      expect(values.length).toBeGreaterThan(0)
      expect(values[values.length - 1]).toBeCloseTo(100, 0)
    }, 2000)

    it('should handle start-stop-start', () => {
      const values: number[] = []
      const anim = spring(0, 100, {
        onUpdate: (v) => values.push(v),
      })

      anim.start()
      anim.stop()
      anim.start()

      expect(anim.isAnimating()).toBe(true)
    })
  })

  describe('spring value updates', () => {
    it('should handle rapid updates', () => {
      const value = createSpringValue(0)

      value.set(100)
      value.set(50)
      value.set(75)

      expect(value.isAnimating()).toBe(true)
    })

    it('should handle jump during animation', () => {
      const value = createSpringValue(0)
      const values: number[] = []

      value.subscribe((v) => values.push(v))

      value.set(100)
      value.jump(50)

      expect(value.get()).toBe(50)
      expect(values).toContain(50)
    })
  })

  describe('spring group coordination', () => {
    it('should animate multiple values together', () => {
      const group = createSpringGroup(
        { x: 0, y: 0, scale: 1 },
        { stiffness: 100, damping: 10 }
      )

      group.set({ x: 100, y: 50, scale: 1.5 })

      expect(group.isAnimating()).toBe(true)
    })

    it('should notify subscribers on changes', () => {
      const group = createSpringGroup({ x: 0, y: 0 })
      const callback = vi.fn()

      group.subscribe(callback)

      group.jump({ x: 100 })

      expect(callback).toHaveBeenLastCalledWith({ x: 100, y: 0 })
    })

    it('should wait for all animations to complete', async () => {
      const group = createSpringGroup(
        { x: 0, y: 0 },
        {
          restSpeed: 10,
          restDelta: 10,
          stiffness: 1000,
          damping: 50,
        }
      )

      group.set({ x: 100, y: 50 })

      // Wait for the finished promise to resolve
      await group.finished
    }, 2000)
  })

  describe('edge cases', () => {
    it('should handle zero range animation', () => {
      const anim = spring(100, 100, {})

      anim.start()

      expect(anim.getValue()).toBe(100)
    })

    it('should handle negative values', () => {
      const anim = spring(0, -100, {})

      anim.start()

      expect(anim.getValue()).toBeLessThanOrEqual(0)
    })

    it('should handle very large values', () => {
      const anim = spring(0, 1000000, {})

      anim.start()

      expect(anim.getValue()).toBeGreaterThanOrEqual(0)
    })
  })

  describe('clamping', () => {
    it('should clamp values when enabled', () => {
      const values: number[] = []
      const anim = spring(0, 100, {
        clamp: true,
        onUpdate: (v) => values.push(v),
      })

      anim.start()

      // All values should be within [0, 100]
      for (const v of values) {
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(100)
      }
    })
  })

  describe('velocity', () => {
    it('should track velocity during animation', () => {
      const anim = spring(0, 100, {})

      anim.start()

      const velocity = anim.getVelocity()
      expect(typeof velocity).toBe('number')
    })
  })
})
