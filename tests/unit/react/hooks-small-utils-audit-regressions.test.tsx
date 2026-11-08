/**
 * Regressions found by the small hooks / react utils audit (F3001-F3003).
 * Deterministic: animations run on installTestClock().
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { renderHook, act, cleanup } from '@testing-library/react'
import { useSpring, useMotionValueState } from '@oxog/springkit/react'
import { createMotionValue, type MotionValue, type SpringConfig } from '@oxog/springkit'
import { installTestClock, type TestClock } from '@oxog/springkit/testing'
import { useStableSpringConfig } from '../../../src/adapters/react/utils/config'

let clock: TestClock | null = null
afterEach(() => {
  cleanup()
  clock?.uninstall()
  clock = null
  vi.restoreAllMocks()
})

const frames = async (n: number) => {
  for (let i = 0; i < n; i++) await act(async () => { clock!.advance(16) })
}

describe('useStableSpringConfig: non-physics fields (F3001)', () => {
  type Cfg = SpringConfig & { followDelay?: number }
  const run = (c: Cfg | undefined) =>
    renderHook(({ c }: { c: Cfg | undefined }) => useStableSpringConfig(c, {}), { initialProps: { c } })

  it('a changed followDelay is reflected (it used to be ignored after the first render)', () => {
    const { result, rerender } = run({ stiffness: 100, followDelay: 2 })
    rerender({ c: { stiffness: 100, followDelay: 10 } })
    expect((result.current as Cfg).followDelay).toBe(10)
  })

  it('equal inline literals (including new callbacks and undefined fields) keep the same reference', () => {
    const { result, rerender } = run({ stiffness: 100, followDelay: 2, onRest: () => {} })
    const first = result.current
    rerender({ c: { stiffness: 100, followDelay: 2, onRest: () => {} } })
    expect(result.current).toBe(first)
    rerender({ c: { stiffness: 100, followDelay: 2, damping: undefined } })
    expect(result.current).toBe(first)
  })
})

describe('useSpring: keys added after mount (F3002)', () => {
  const cfg = { stiffness: 1000, damping: 100 }
  type V = Record<string, number>
  const mount = (v: V) => renderHook(({ v }: { v: V }) => useSpring(v, cfg), { initialProps: { v } })

  it('a key that first appears in a later render ends at its target', async () => {
    clock = installTestClock({ startTime: 0 })
    const { result, rerender } = mount({ a: 0 })
    rerender({ v: { a: 0, b: 100 } })
    await frames(60)
    expect(Math.round(result.current.b!)).toBe(100)
    expect(Math.round(result.current.a!)).toBe(0)
  })

  it('an existing key keeps animating from where it is when a key is added', async () => {
    clock = installTestClock({ startTime: 0 })
    const { result, rerender } = mount({ a: 0 })
    rerender({ v: { a: 100 } })
    await frames(2)
    const mid = result.current.a!
    expect(mid).toBeGreaterThan(0)
    expect(mid).toBeLessThan(100)
    rerender({ v: { a: 100, b: 5 } })
    await frames(60)
    expect(Math.round(result.current.a!)).toBe(100)
    expect(Math.round(result.current.b!)).toBe(5)
  })

  it('unmounting right after a key was added leaves no frames or errors', async () => {
    clock = installTestClock({ startTime: 0 })
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { rerender, unmount } = mount({ a: 0 })
    rerender({ v: { a: 0, b: 100 } })
    await frames(1)
    unmount()
    await act(async () => { await Promise.resolve() })
    clock.advance(10_000)
    expect(clock.pendingFrames).toBe(0)
    expect(err).not.toHaveBeenCalled()
  })
})

describe('useMotionValueState: source removed (F3003)', () => {
  type M = MotionValue<number> | null
  it('reports undefined after the source became null, and follows a new source', () => {
    const a = createMotionValue(7)
    const { result, rerender } = renderHook(({ m }: { m: M }) => useMotionValueState(m), {
      initialProps: { m: a as M },
    })
    expect(result.current).toBe(7)
    rerender({ m: null })
    expect(result.current).toBeUndefined()
    act(() => a.jump(99))
    expect(result.current).toBeUndefined()
    const b = createMotionValue(3)
    rerender({ m: b })
    expect(result.current).toBe(3)
  })
})
