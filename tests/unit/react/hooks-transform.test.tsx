/**
 * Regression tests for useTransform.ts hooks
 */
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { createMotionValue } from '../../../src/core/MotionValue'
import { useMotionValue } from '../../../src/adapters/react/hooks/useMotionValue'
import {
  useTransform,
  useSpringTransform,
  useMotionValueEvent,
  useMotionTemplate,
  useDelay,
} from '../../../src/adapters/react/hooks/useTransform'

describe('useTransform range mapping', () => {
  it('extrapolates symmetrically above and below the input range (clamp: false)', () => {
    const { result } = renderHook(() => {
      const x = useMotionValue(0)
      const y = useTransform(x, [0, 100], [0, 1])
      return { x, y }
    })
    act(() => result.current.x.jump(-50))
    expect(result.current.y.get()).toBeCloseTo(-0.5)
    act(() => result.current.x.jump(150))
    expect(result.current.y.get()).toBeCloseTo(1.5)
  })

  it('clamps above and below the range with clamp: true', () => {
    const { result } = renderHook(() => {
      const x = useMotionValue(0)
      const y = useTransform(x, [0, 100], [0, 1], { clamp: true })
      return { x, y }
    })
    act(() => result.current.x.jump(150))
    expect(result.current.y.get()).toBe(1)
    act(() => result.current.x.jump(-50))
    expect(result.current.y.get()).toBe(0)
  })

  it('useSpringTransform maps values beyond the last input stop linearly', () => {
    const { result } = renderHook(() => {
      const x = useMotionValue(150)
      const y = useSpringTransform(x, [0, 100], [0, 10])
      return { x, y }
    })
    // initial value is computed synchronously from the source
    expect(result.current.y.get()).toBeCloseTo(15)
  })
})

describe('useMotionValueEvent', () => {
  it("fires 'animationComplete' when an animation finishes", async () => {
    const onComplete = vi.fn()
    const mv = createMotionValue(0, { spring: { stiffness: 1000, damping: 100 } })
    renderHook(() => useMotionValueEvent(mv, 'animationComplete', onComplete))
    act(() => mv.set(10))
    await act(async () => {
      const start = Date.now()
      while (!onComplete.mock.calls.length && Date.now() - start < 3000) {
        await new Promise((r) => setTimeout(r, 50))
      }
    })
    expect(onComplete).toHaveBeenCalled()
    mv.destroy()
  }, 10000)
})

describe('useMotionTemplate', () => {
  it('follows a MotionValue whose identity changes (same number of values)', () => {
    const a = createMotionValue(1)
    const b = createMotionValue(2)
    const { result, rerender } = renderHook(
      ({ v }) => useMotionTemplate`x(${v})`,
      { initialProps: { v: a } }
    )
    expect(result.current.get()).toBe('x(1)')
    rerender({ v: b })
    expect(result.current.get()).toBe('x(2)')
    act(() => b.jump(5))
    expect(result.current.get()).toBe('x(5)')
    // the old value must no longer drive the template
    act(() => a.jump(9))
    expect(result.current.get()).toBe('x(5)')
  })
})

describe('useDelay', () => {
  it('respects a changed frame count', () => {
    const source = createMotionValue(0)
    const { result, rerender } = renderHook(
      ({ frames }) => useDelay(source, frames),
      { initialProps: { frames: 3 } }
    )
    rerender({ frames: 0 })
    act(() => source.jump(42))
    expect(result.current.get()).toBe(42)
  })
})

describe('useTransform string outputs', () => {
  const setup = (
    outputRange: string[],
    options?: Parameters<typeof useTransform>[3],
    inputRange: number[] = [0, 100]
  ) =>
    renderHook(() => {
      const x = useMotionValue(0)
      const y = useTransform<string>(x, inputRange, outputRange, options)
      return { x, y }
    })

  it('interpolates colors (premultiplied alpha) instead of snapping to the nearest stop', () => {
    const { result } = setup(['#ff0000', 'rgba(0, 0, 255, 0.5)'])
    expect(result.current.y.get()).toBe('rgb(255, 0, 0)')
    act(() => result.current.x.jump(25))
    // alpha 0.875; premultiplied red 255*1*0.75 / 0.875, blue 255*0.5*0.25 / 0.875
    expect(result.current.y.get()).toBe('rgba(219, 0, 36, 0.875)')
    act(() => result.current.x.jump(100))
    expect(result.current.y.get()).toBe('rgba(0, 0, 255, 0.5)')
  })

  it('supports an optional color space', () => {
    const { result } = setup(['#0000ff', '#ffff00'], { space: 'oklab' })
    act(() => result.current.x.jump(50))
    expect(result.current.y.get()).not.toBe('rgb(128, 128, 128)')
    expect(result.current.y.get()).toMatch(/^rgb\(/)
  })

  it('interpolates numbers with a shared unit', () => {
    const { result } = setup(['10px', '100px'])
    act(() => result.current.x.jump(50))
    expect(result.current.y.get()).toBe('55px')
  })

  it('interpolates complex strings with several numbers and colors', () => {
    const { result } = setup(['translateX(0px) rotate(0deg)', 'translateX(100px) rotate(90deg)'])
    act(() => result.current.x.jump(50))
    expect(result.current.y.get()).toBe('translateX(50px) rotate(45deg)')

    const shadow = setup(['0px 0px 0px #000000', '10px 20px 30px rgba(255, 255, 255, 0)'])
    act(() => shadow.result.current.x.jump(50))
    expect(shadow.result.current.y.get()).toBe('5px 10px 15px rgba(0, 0, 0, 0.5)')
  })

  it('honors clamp and multi-stop ranges for strings', () => {
    const { result } = setup(['0%', '50%', '0%'], { clamp: true }, [0, 50, 100])
    act(() => result.current.x.jump(75))
    expect(result.current.y.get()).toBe('25%')
    act(() => result.current.x.jump(200))
    expect(result.current.y.get()).toBe('0%')
  })

  it('falls back to switching at the midpoint for incompatible strings', () => {
    const { result } = setup(['auto', '100px'])
    act(() => result.current.x.jump(40))
    expect(result.current.y.get()).toBe('auto')
    act(() => result.current.x.jump(60))
    expect(result.current.y.get()).toBe('100px')
  })
})
