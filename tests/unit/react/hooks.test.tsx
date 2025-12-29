import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { useSpring, useSpringValue, useSprings, useTrail } from '../../../src/adapters/react'

describe('React hooks', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('useSpring', () => {
    it('should create spring values', () => {
      const { result } = renderHook(() =>
        useSpring({ x: 0, y: 0 }, { stiffness: 100, damping: 10 })
      )

      expect(result.current).toEqual({ x: 0, y: 0 })
    })

    it('should update values', async () => {
      const { result, rerender } = renderHook(
        ({ isOpen }) => useSpring({ x: isOpen ? 100 : 0 }),
        { initialProps: { isOpen: false } }
      )

      expect(result.current.x).toBe(0)

      rerender({ isOpen: true })

      await waitFor(() => {
        expect(result.current.x).toBeGreaterThanOrEqual(0)
      })
    })

    it('should handle single value', () => {
      const { result } = renderHook(() => useSpring({ x: 0 }))

      expect(result.current).toEqual({ x: 0 })
    })

    it('should handle empty values', () => {
      const { result } = renderHook(() => useSpring({} as Record<string, number>))

      expect(result.current).toEqual({})
    })

    it('should use default config', () => {
      const { result } = renderHook(() => useSpring({ x: 0 }))

      expect(result.current).toBeDefined()
    })
  })

  describe('useSpringValue', () => {
    it('should create a spring value', () => {
      const { result } = renderHook(() => useSpringValue(0, { stiffness: 100 }))

      expect(result.current.get()).toBe(0)
    })

    it('should allow setting values', () => {
      const { result } = renderHook(() => useSpringValue(0))

      result.current.set(100)

      expect(result.current.isAnimating()).toBe(true)
    })

    it('should allow jumping values', () => {
      const { result } = renderHook(() => useSpringValue(0))

      result.current.jump(100)

      expect(result.current.get()).toBe(100)
    })

    it('should get velocity', () => {
      const { result } = renderHook(() => useSpringValue(0))

      expect(result.current.getVelocity()).toBe(0)
    })

    it('should allow subscription', () => {
      const { result } = renderHook(() => useSpringValue(0))
      const callback = vi.fn()

      const unsubscribe = result.current.subscribe(callback)

      expect(callback).toHaveBeenCalledTimes(1)

      unsubscribe()
    })
  })

  describe('useSprings', () => {
    it('should create multiple springs', () => {
      const { result } = renderHook(() =>
        useSprings(3, (i) => ({
          values: { x: i * 10 },
          from: { x: 0 },
        }))
      )

      expect(result.current).toHaveLength(3)
    })

    it('should handle dynamic count', () => {
      const { result, rerender } = renderHook(
        ({ count }) =>
          useSprings(count, (i) => ({
            values: { x: i * 10 },
            from: { x: 0 },
          })),
        { initialProps: { count: 2 } }
      )

      expect(result.current).toHaveLength(2)

      rerender({ count: 5 })

      expect(result.current).toHaveLength(5)
    })

    it('should handle zero count', () => {
      const { result } = renderHook(() =>
        useSprings(0, (i) => ({
          values: { x: i * 10 },
          from: { x: 0 },
        }))
      )

      expect(result.current).toHaveLength(0)
    })
  })

  describe('useTrail', () => {
    it('should create trail values', () => {
      const { result } = renderHook(() =>
        useTrail(3, { opacity: 1, x: 0 }, { stiffness: 100 })
      )

      expect(result.current).toHaveLength(3)
    })

    it('should handle different counts', () => {
      const { result, rerender } = renderHook(
        ({ count }) => useTrail(count, { opacity: 1, x: 0 }),
        { initialProps: { count: 2 } }
      )

      expect(result.current).toHaveLength(2)

      rerender({ count: 5 })

      expect(result.current).toHaveLength(5)
    })

    it('should handle zero count', () => {
      const { result } = renderHook(() => useTrail(0, { opacity: 1, x: 0 }))

      expect(result.current).toHaveLength(0)
    })

    it('should handle single value', () => {
      const { result } = renderHook(() => useTrail(1, { opacity: 1 }))

      expect(result.current).toHaveLength(1)
      expect(result.current[0]).toEqual({ opacity: 1 })
    })
  })
})
