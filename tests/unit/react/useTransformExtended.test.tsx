import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import React from 'react'
import {
  useMotionValue,
  useMotionTemplate,
  useTime,
  useAnimationFrame,
  useWillChange,
  useSum,
  useProduct,
  useDifference,
  useClamp,
  useSnap,
  useSmooth,
  useDelay,
} from '@oxog/springkit/react'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

// Helper to run animation frames
function runAnimationFrames(count: number) {
  let timestamp = 0
  for (let i = 0; i < count; i++) {
    timestamp += 16
    vi.advanceTimersByTime(16)
  }
}

describe('useMotionTemplate', () => {
  it('should create a string MotionValue', () => {
    const { result } = renderHook(() => {
      const x = useMotionValue(100)
      const y = useMotionValue(50)
      return useMotionTemplate`translateX(${x}px) translateY(${y}px)`
    })

    expect(result.current.get()).toBe('translateX(100px) translateY(50px)')
  })

  it('should update when source values change', () => {
    const { result } = renderHook(() => {
      const x = useMotionValue(0)
      const template = useMotionTemplate`translate(${x}px)`
      return { x, template }
    })

    expect(result.current.template.get()).toBe('translate(0px)')

    act(() => {
      result.current.x.jump(100)
    })

    expect(result.current.template.get()).toBe('translate(100px)')
  })

  it('should work with multiple values', () => {
    const { result } = renderHook(() => {
      const r = useMotionValue(255)
      const g = useMotionValue(100)
      const b = useMotionValue(50)
      return useMotionTemplate`rgb(${r}, ${g}, ${b})`
    })

    expect(result.current.get()).toBe('rgb(255, 100, 50)')
  })

  it('should handle empty template', () => {
    const { result } = renderHook(() => {
      const x = useMotionValue(0)
      return useMotionTemplate`${x}`
    })

    expect(result.current.get()).toBe('0')
  })
})

describe('useTime', () => {
  it('should return a MotionValue', () => {
    const { result } = renderHook(() => useTime())

    expect(result.current).toBeDefined()
    expect(typeof result.current.get).toBe('function')
    expect(typeof result.current.subscribe).toBe('function')
  })

  it('should start at 0', () => {
    const { result } = renderHook(() => useTime())

    expect(result.current.get()).toBe(0)
  })

  it('should have isAnimating method', () => {
    const { result } = renderHook(() => useTime())

    expect(typeof result.current.isAnimating).toBe('function')
  })
})

describe('useAnimationFrame', () => {
  it('should call callback on animation frame', () => {
    const callback = vi.fn()
    renderHook(() => useAnimationFrame(callback))

    // Run a few animation frames
    runAnimationFrames(3)

    expect(callback).toHaveBeenCalled()
  })

  it('should pass time and delta to callback', () => {
    const callback = vi.fn()
    renderHook(() => useAnimationFrame(callback))

    runAnimationFrames(2)

    // Should be called with timestamp and delta
    expect(callback).toHaveBeenCalledWith(expect.any(Number), expect.any(Number))
  })

  it('should clean up on unmount', () => {
    const callback = vi.fn()
    const { unmount } = renderHook(() => useAnimationFrame(callback))

    unmount()

    const callCount = callback.mock.calls.length
    runAnimationFrames(5)

    // Should not have been called after unmount
    expect(callback.mock.calls.length).toBe(callCount)
  })
})

describe('useWillChange', () => {
  it('should return a string MotionValue', () => {
    const { result } = renderHook(() => {
      const x = useMotionValue(0)
      return useWillChange([x])
    })

    expect(result.current).toBeDefined()
    expect(typeof result.current.get).toBe('function')
  })

  it('should default to auto', () => {
    const { result } = renderHook(() => {
      const x = useMotionValue(0)
      return useWillChange([x])
    })

    expect(result.current.get()).toBe('auto')
  })

  it('should accept custom properties', () => {
    const { result } = renderHook(() => {
      const x = useMotionValue(0)
      return useWillChange([x], ['transform', 'filter'])
    })

    // Should be 'auto' when not animating
    expect(result.current.get()).toBe('auto')
  })
})

describe('useSum', () => {
  it('should sum motion values', () => {
    const { result } = renderHook(() => {
      const a = useMotionValue(10)
      const b = useMotionValue(20)
      const c = useMotionValue(30)
      return useSum(a, b, c)
    })

    expect(result.current.get()).toBe(60)
  })

  it('should update when sources change', () => {
    const { result } = renderHook(() => {
      const a = useMotionValue(10)
      const b = useMotionValue(20)
      const sum = useSum(a, b)
      return { a, b, sum }
    })

    expect(result.current.sum.get()).toBe(30)

    act(() => {
      result.current.a.jump(50)
    })

    expect(result.current.sum.get()).toBe(70)
  })

  it('should handle single value', () => {
    const { result } = renderHook(() => {
      const a = useMotionValue(100)
      return useSum(a)
    })

    expect(result.current.get()).toBe(100)
  })
})

describe('useProduct', () => {
  it('should multiply motion values', () => {
    const { result } = renderHook(() => {
      const a = useMotionValue(2)
      const b = useMotionValue(3)
      const c = useMotionValue(4)
      return useProduct(a, b, c)
    })

    expect(result.current.get()).toBe(24)
  })

  it('should update when sources change', () => {
    const { result } = renderHook(() => {
      const a = useMotionValue(5)
      const b = useMotionValue(10)
      const product = useProduct(a, b)
      return { a, b, product }
    })

    expect(result.current.product.get()).toBe(50)

    act(() => {
      result.current.b.jump(2)
    })

    expect(result.current.product.get()).toBe(10)
  })
})

describe('useDifference', () => {
  it('should calculate difference between two values', () => {
    const { result } = renderHook(() => {
      const a = useMotionValue(100)
      const b = useMotionValue(30)
      return useDifference(a, b)
    })

    expect(result.current.get()).toBe(70)
  })

  it('should handle negative result', () => {
    const { result } = renderHook(() => {
      const a = useMotionValue(20)
      const b = useMotionValue(50)
      return useDifference(a, b)
    })

    expect(result.current.get()).toBe(-30)
  })

  it('should update when sources change', () => {
    const { result } = renderHook(() => {
      const a = useMotionValue(100)
      const b = useMotionValue(25)
      const diff = useDifference(a, b)
      return { a, b, diff }
    })

    act(() => {
      result.current.a.jump(50)
    })

    expect(result.current.diff.get()).toBe(25)
  })
})

describe('useClamp', () => {
  it('should clamp value to range', () => {
    const { result } = renderHook(() => {
      const value = useMotionValue(150)
      return useClamp(value, 0, 100)
    })

    expect(result.current.get()).toBe(100)
  })

  it('should clamp at minimum', () => {
    const { result } = renderHook(() => {
      const value = useMotionValue(-50)
      return useClamp(value, 0, 100)
    })

    expect(result.current.get()).toBe(0)
  })

  it('should pass through values within range', () => {
    const { result } = renderHook(() => {
      const value = useMotionValue(50)
      return useClamp(value, 0, 100)
    })

    expect(result.current.get()).toBe(50)
  })

  it('should update when source changes', () => {
    const { result } = renderHook(() => {
      const value = useMotionValue(50)
      const clamped = useClamp(value, 0, 100)
      return { value, clamped }
    })

    act(() => {
      result.current.value.jump(200)
    })

    expect(result.current.clamped.get()).toBe(100)
  })
})

describe('useSnap', () => {
  it('should snap to nearest step', () => {
    const { result } = renderHook(() => {
      const value = useMotionValue(47)
      return useSnap(value, 10)
    })

    expect(result.current.get()).toBe(50)
  })

  it('should snap down when closer to lower step', () => {
    const { result } = renderHook(() => {
      const value = useMotionValue(42)
      return useSnap(value, 10)
    })

    expect(result.current.get()).toBe(40)
  })

  it('should work with decimal steps', () => {
    const { result } = renderHook(() => {
      const value = useMotionValue(0.35)
      return useSnap(value, 0.25)
    })

    expect(result.current.get()).toBeCloseTo(0.25)
  })

  it('should update when source changes', () => {
    const { result } = renderHook(() => {
      const value = useMotionValue(45)
      const snapped = useSnap(value, 10)
      return { value, snapped }
    })

    act(() => {
      result.current.value.jump(86)
    })

    expect(result.current.snapped.get()).toBe(90)
  })
})

describe('useSmooth', () => {
  it('should return a MotionValue', () => {
    const { result } = renderHook(() => {
      const value = useMotionValue(0)
      return useSmooth(value, 0.1)
    })

    expect(result.current).toBeDefined()
    expect(typeof result.current.get).toBe('function')
  })

  it('should start at source value', () => {
    const { result } = renderHook(() => {
      const value = useMotionValue(100)
      return useSmooth(value, 0.1)
    })

    expect(result.current.get()).toBe(100)
  })

  it('should approach target over time', () => {
    const { result } = renderHook(() => {
      const value = useMotionValue(0)
      const smoothed = useSmooth(value, 0.5)
      return { value, smoothed }
    })

    act(() => {
      result.current.value.jump(100)
    })

    // After one update, should be halfway
    expect(result.current.smoothed.get()).toBeCloseTo(50, 0)
  })
})

describe('useDelay', () => {
  it('should return a MotionValue', () => {
    const { result } = renderHook(() => {
      const value = useMotionValue(0)
      return useDelay(value, 5)
    })

    expect(result.current).toBeDefined()
    expect(typeof result.current.get).toBe('function')
  })

  it('should start at source value', () => {
    const { result } = renderHook(() => {
      const value = useMotionValue(100)
      return useDelay(value, 5)
    })

    expect(result.current.get()).toBe(100)
  })

  it('should delay updates by specified frames', () => {
    const { result } = renderHook(() => {
      const value = useMotionValue(0)
      const delayed = useDelay(value, 3)
      return { value, delayed }
    })

    // Initial buffer is [0, 0, 0] (filled with initial value)
    // After first update (10): buffer becomes [0, 0, 10], delayed gets 0
    act(() => {
      result.current.value.jump(10)
    })
    expect(result.current.delayed.get()).toBe(0)

    // After second update (20): buffer becomes [0, 10, 20], delayed gets 0
    act(() => {
      result.current.value.jump(20)
    })
    expect(result.current.delayed.get()).toBe(0)

    // After third update (30): buffer becomes [10, 20, 30], delayed gets 0
    act(() => {
      result.current.value.jump(30)
    })
    expect(result.current.delayed.get()).toBe(0)

    // After fourth update (40): buffer becomes [20, 30, 40], delayed gets 10
    act(() => {
      result.current.value.jump(40)
    })
    expect(result.current.delayed.get()).toBe(10)

    // After fifth update (50): buffer becomes [30, 40, 50], delayed gets 20
    act(() => {
      result.current.value.jump(50)
    })
    expect(result.current.delayed.get()).toBe(20)
  })
})
