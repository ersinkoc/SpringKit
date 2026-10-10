/**
 * Regressions found by the useTransform audit (F1801-F1803).
 * Deterministic: no timers, only MotionValue.jump().
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import * as React from 'react'
import { renderHook, render, act, cleanup } from '@testing-library/react'
import { createMotionValue } from '@oxog/springkit'
import { useTransform, useCombinedTransform, useSum, useDelay } from '@oxog/springkit/react'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('derived values do not emit on re-render (F1801)', () => {
  it('inline ranges, inline functions and combined sources stay silent across re-renders', () => {
    const src = createMotionValue(50)
    const other = createMotionValue(1)
    const r = renderHook(() => ({
      a: useTransform<number>(src, [0, 100], [0, 1]),
      b: useTransform<number>(src, (v) => v * 2),
      c: useCombinedTransform<number[], number>([src, other], ([x, y]) => (x ?? 0) + (y ?? 0)),
      d: useSum(src, other),
    }))
    const counts = { a: 0, b: 0, c: 0, d: 0 }
    for (const k of Object.keys(counts) as Array<keyof typeof counts>) {
      r.result.current[k].on('change', () => {
        counts[k]++
      })
    }
    r.rerender()
    r.rerender()
    r.rerender()
    expect(counts).toEqual({ a: 0, b: 0, c: 0, d: 0 })
  })

  it('a change listener that re-renders its component does not loop', () => {
    const src = createMotionValue(50)
    function Probe() {
      const [ticks, setTicks] = React.useState(0)
      const opacity = useTransform<number>(src, [0, 100], [0, 1])
      React.useEffect(() => opacity.on('change', () => setTicks((t) => (t < 25 ? t + 1 : t))), [opacity])
      return <i data-ticks={ticks} />
    }
    const view = render(<Probe />)
    act(() => {
      view.rerender(<Probe />)
    })
    expect(view.container.querySelector('i')!.getAttribute('data-ticks')).toBe('0')
    act(() => src.jump(80))
    expect(view.container.querySelector('i')!.getAttribute('data-ticks')).toBe('1')
  })

  it('real changes still publish exactly once, including new ranges and functions', () => {
    const src = createMotionValue(50)
    const r = renderHook(
      ({ max, k }) => ({
        a: useTransform<number>(src, [0, 100], [0, max]),
        b: useTransform<number>(src, (v) => v * k),
      }),
      { initialProps: { max: 1, k: 2 } }
    )
    let a = 0
    let b = 0
    r.result.current.a.on('change', () => {
      a++
    })
    r.result.current.b.on('change', () => {
      b++
    })
    r.rerender({ max: 10, k: 3 })
    expect([r.result.current.a.get(), r.result.current.b.get()]).toEqual([5, 150])
    expect([a, b]).toEqual([1, 1])
    act(() => src.jump(100))
    expect([r.result.current.a.get(), r.result.current.b.get()]).toEqual([10, 300])
    expect([a, b]).toEqual([2, 2])
  })
})

describe('string outputs with CSS-variable colors (F1802)', () => {
  const at = (out: string[], v: number): string => {
    const x = createMotionValue(0)
    const { result } = renderHook(() => useTransform<string>(x, [0, 100], out))
    act(() => x.jump(v))
    return result.current.get()
  }

  it('keeps hsl(var(--x)) / rgb(var(--x) / a) as text instead of turning them into black', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(at(['hsl(var(--a))', 'hsl(var(--a))'], 50)).toBe('hsl(var(--a))')
    expect(at(['hsl(var(--a))', 'hsl(var(--b))'], 0)).toBe('hsl(var(--a))')
    expect(at(['hsl(var(--a))', 'hsl(var(--b))'], 100)).toBe('hsl(var(--b))')
    expect(at(['rgb(var(--c) / 0.5)', 'rgb(var(--c) / 0.5)'], 50)).toBe('rgb(var(--c) / 0.5)')
    expect(warn).not.toHaveBeenCalled()
  })

  it('still interpolates the numbers around a var() color and literal colors', () => {
    expect(at(['translateX(0px) hsl(var(--a) / 0.5)', 'translateX(100px) hsl(var(--a) / 0.5)'], 50)).toBe(
      'translateX(50px) hsl(var(--a) / 0.5)'
    )
    expect(at(['rgb(0, 0, 0)', 'rgb(100, 100, 100)'], 50)).toBe('rgb(50, 50, 50)')
    expect(at(['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 1)'], 50)).toBe('rgba(0, 0, 0, 0.5)')
  })
})

describe('useDelay frame count (F1803)', () => {
  const run = (frames: number, values: number[]): number[] => {
    const source = createMotionValue(0)
    const { result } = renderHook(() => useDelay(source, frames))
    return values.map((v) => {
      act(() => source.jump(v))
      return result.current.get()
    })
  }

  it('floors a fractional frame count instead of throwing', () => {
    expect(run(2.5, [1, 2, 3, 4])).toEqual([0, 0, 1, 2])
    expect(run(2, [1, 2, 3, 4])).toEqual([0, 0, 1, 2])
  })

  it('treats NaN, negative and infinite counts as no delay', () => {
    for (const frames of [Number.NaN, -1, Number.POSITIVE_INFINITY]) {
      expect(run(frames, [5, 6])).toEqual([5, 6])
    }
  })
})
