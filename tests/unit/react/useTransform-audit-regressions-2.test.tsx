/**
 * Regressions found by the second useTransform audit round (F3401-F3403).
 * Deterministic: virtual test clock, explicit advance()/rerender() ordering, no real timers.
 */
import { describe, it, expect, afterEach } from 'vitest'
import * as React from 'react'
import { renderHook, render, act, cleanup } from '@testing-library/react'
import { createMotionValue, type MotionValue } from '@oxog/springkit'
import { installTestClock, type TestClock } from '@oxog/springkit/testing'
import {
  useVelocity,
  useVelocityTransform,
  useSpringTransform,
  useMotionTemplate,
  useSmooth,
  useDelay,
} from '@oxog/springkit/react'

let clock: TestClock | null = null

afterEach(() => {
  cleanup()
  clock?.uninstall()
  clock = null
})

describe('velocity hooks resync on source / transform swap (F3401)', () => {
  const setup = () => {
    clock = installTestClock()
    const a = createMotionValue(0)
    const b = createMotionValue(0)
    const r = renderHook(
      ({ s, k }) => ({ v: useVelocity(s), t: useVelocityTransform(s, (x) => x * 2 + k) }),
      { initialProps: { s: a, k: 0 } }
    )
    act(() => {
      a.set(1000)
    })
    act(() => {
      clock!.advance(64)
    })
    return { a, b, r }
  }

  it('swapping an animating source for a resting one resets both values at once and ignores the old source', () => {
    const { a, b, r } = setup()
    expect(r.result.current.v.get()).toBeGreaterThan(100)
    r.rerender({ s: b, k: 0 })
    expect(r.result.current.v.get()).toBe(0)
    expect(r.result.current.t.get()).toBe(0)
    act(() => {
      clock!.advance(128)
    })
    expect(a.isAnimating()).toBe(true)
    expect(r.result.current.v.get()).toBe(0)
    expect(r.result.current.t.get()).toBe(0)
  })

  it('a new transform shows at rest; unchanged re-renders stay silent; an animating source is still tracked', () => {
    const { a, b, r } = setup()
    r.rerender({ s: b, k: 0 })
    let changes = 0
    r.result.current.v.on('change', () => {
      changes++
    })
    r.result.current.t.on('change', () => {
      changes++
    })
    r.rerender({ s: b, k: 0 })
    r.rerender({ s: b, k: 0 })
    expect(changes).toBe(0)
    r.rerender({ s: b, k: 7 })
    expect(r.result.current.t.get()).toBe(7)
    r.rerender({ s: a, k: 0 })
    act(() => {
      clock!.advance(32)
    })
    expect(r.result.current.v.get()).toBe(a.getVelocity())
    expect(r.result.current.t.get()).toBeCloseTo(a.getVelocity() * 2, 9)
  })

  it('after unmount the derived values no longer follow the source', () => {
    const { a, r } = setup()
    const { v, t } = r.result.current
    r.unmount()
    const before = [v.get(), t.get()]
    act(() => {
      clock!.advance(128)
    })
    expect(a.isAnimating()).toBe(true)
    expect([v.get(), t.get()]).toEqual(before)
  })
})

describe('useSpringTransform only animates when the target changes (F3402)', () => {
  it('stays at rest on mount and across inline-range re-renders, and a change listener cannot loop it', () => {
    clock = installTestClock()
    const src = createMotionValue(50)
    const r = renderHook(() => useSpringTransform(src, [0, 100], [0, 1]))
    expect(r.result.current.isAnimating()).toBe(false)
    let starts = 0
    let changes = 0
    r.result.current.on('animationStart', () => {
      starts++
    })
    r.result.current.on('change', () => {
      changes++
    })
    r.rerender()
    r.rerender()
    r.rerender()
    act(() => {
      clock!.advance(500)
    })
    expect([starts, changes, r.result.current.isAnimating()]).toEqual([0, 0, false])
    cleanup()

    function Loop() {
      const [ticks, setTicks] = React.useState(0)
      const y = useSpringTransform(src, [0, 100], [0, 1])
      React.useEffect(() => y.on('change', () => setTicks((t) => (t < 25 ? t + 1 : t))), [y])
      return <i data-ticks={ticks} />
    }
    const view = render(<Loop />)
    act(() => {
      view.rerender(<Loop />)
    })
    act(() => {
      clock!.advance(2000)
    })
    expect(view.container.querySelector('i')!.getAttribute('data-ticks')).toBe('0')
  })

  it('real changes still animate once (a re-render in flight does not restart), retarget and settle', () => {
    clock = installTestClock()
    const s1 = createMotionValue(0)
    const s2 = createMotionValue(100)
    const r = renderHook(({ s, max }) => useSpringTransform(s, [0, 100], [0, max]), {
      initialProps: { s: s1, max: 1 },
    })
    let starts = 0
    r.result.current.on('animationStart', () => {
      starts++
    })
    act(() => {
      s1.jump(100)
    })
    expect(starts).toBe(1)
    act(() => {
      clock!.advance(64)
    })
    r.rerender({ s: s1, max: 1 })
    expect(starts).toBe(1)
    act(() => {
      clock!.runAll()
    })
    expect(r.result.current.get()).toBeCloseTo(1, 3)
    r.rerender({ s: s1, max: 10 })
    act(() => {
      clock!.runAll()
    })
    expect(r.result.current.get()).toBeCloseTo(10, 3)
    r.rerender({ s: s2, max: 3 })
    act(() => {
      clock!.runAll()
    })
    expect(r.result.current.get()).toBeCloseTo(3, 3)
    expect(r.result.current.isAnimating()).toBe(false)
  })

  it('a value moved away from its target by hand is pulled back on the next re-render', () => {
    clock = installTestClock()
    const src = createMotionValue(50)
    const r = renderHook(() => useSpringTransform(src, [0, 100], [0, 1]))
    act(() => {
      r.result.current.jump(9)
    })
    r.rerender()
    expect(r.result.current.isAnimating()).toBe(true)
    act(() => {
      clock!.runAll()
    })
    expect(r.result.current.get()).toBeCloseTo(0.5, 3)
  })
})

describe('no change event without a changed value (F3403)', () => {
  it('useMotionTemplate / useSmooth / useDelay are silent on mount, and a same-string swap is silent', () => {
    const x = createMotionValue(1)
    const seen: Record<string, number> = { template: 0, smooth: 0, delay: 0 }
    function Child({ mv, k }: { mv: MotionValue<number> | MotionValue<string>; k: string }) {
      // child effects run before the parent's subscribe effects
      React.useEffect(
        () =>
          mv.on('change', () => {
            seen[k] = (seen[k] ?? 0) + 1
          }),
        [mv, k]
      )
      return null
    }
    function Parent() {
      const t = useMotionTemplate`a(${x})`
      const s = useSmooth(x, 0.5)
      const d = useDelay(x, 2)
      return (
        <>
          <Child mv={t} k="template" />
          <Child mv={s} k="smooth" />
          <Child mv={d} k="delay" />
        </>
      )
    }
    render(<Parent />)
    expect(seen).toEqual({ template: 0, smooth: 0, delay: 0 })

    const y = createMotionValue(1)
    const sw = renderHook(({ s }) => useMotionTemplate`a(${s})`, { initialProps: { s: x } })
    let swapped = 0
    sw.result.current.on('change', () => {
      swapped++
    })
    sw.rerender({ s: y })
    expect(swapped).toBe(0)
  })

  it('real changes still publish: template swap to a new string, smoothing steps and delayed values', () => {
    const x = createMotionValue(1)
    const y = createMotionValue(5)
    const sw = renderHook(({ s }) => useMotionTemplate`a(${s})`, { initialProps: { s: x } })
    let n = 0
    sw.result.current.on('change', () => {
      n++
    })
    sw.rerender({ s: y })
    expect([n, sw.result.current.get()]).toEqual([1, 'a(5)'])
    act(() => y.jump(6))
    expect([n, sw.result.current.get()]).toEqual([2, 'a(6)'])

    const src = createMotionValue(0)
    const r = renderHook(() => ({ s: useSmooth(src, 0.5), d: useDelay(src, 2) }))
    act(() => src.jump(10))
    expect(r.result.current.s.get()).toBe(5)
    act(() => src.jump(10))
    expect(r.result.current.s.get()).toBe(7.5)
    const d = r.result.current.d
    expect(d.get()).toBe(0)
    act(() => src.jump(1))
    expect(d.get()).toBe(10)
    act(() => src.jump(2))
    act(() => src.jump(3))
    expect(d.get()).toBe(1)
  })
})
