/**
 * Regressions found by the RAF-polling state hook audit (F3601).
 * Deterministic: everything runs on installTestClock().
 */
import { describe, it, expect, afterEach } from 'vitest'
import * as React from 'react'
import { renderHook, act, cleanup } from '@testing-library/react'
import { createTimeline, type Timeline } from '@oxog/springkit'
import { useTimelineState } from '@oxog/springkit/react'
import { installTestClock, type TestClock } from '@oxog/springkit/testing'

let clock: TestClock | null = null
afterEach(() => {
  cleanup()
  clock?.uninstall()
  clock = null
})
const adv = async (ms: number) => {
  for (let t = 0; t < ms; t += 16) await act(async () => { clock!.advance(16) })
}
// Durations are in seconds
const mk = () => {
  const tl = createTimeline()
  tl.to({ x: 0 } as never, { x: 100, duration: 1 } as never)
  return tl
}
const IDLE = { progress: 0, isPlaying: false, isPaused: true, isReversed: false }
type Props = { t: Timeline | null }

describe('F3601 useTimelineState(null) reports the idle state', () => {
  it('playing -> null resets to idle and the old timeline cannot leak back in', async () => {
    clock = installTestClock({ startTime: 0, timers: true })
    const tl = mk()
    const { result, rerender } = renderHook(({ t }: Props) => useTimelineState(t), {
      initialProps: { t: tl as Timeline | null },
    })
    act(() => { tl.play() })
    await adv(320)
    expect(result.current.isPlaying).toBe(true)
    rerender({ t: null })
    expect(result.current).toEqual(IDLE)
    // the old timeline keeps playing to completion after the switch
    await adv(1500)
    expect(tl.progress()).toBe(1)
    expect(result.current).toEqual(IDLE)
    tl.kill()
    expect(clock.pendingFrames).toBe(0)
  })

  it('null -> A -> null -> B follows the passed timeline each time', () => {
    clock = installTestClock({ startTime: 0, timers: true })
    const a = mk()
    const b = mk()
    act(() => { a.seek(0.5); b.seek(0.25) })
    const { result, rerender } = renderHook(({ t }: Props) => useTimelineState(t), {
      initialProps: { t: null as Timeline | null },
    })
    expect(result.current).toEqual(IDLE)
    rerender({ t: a })
    expect(result.current.progress).toBe(0.5)
    rerender({ t: null })
    expect(result.current).toEqual(IDLE)
    rerender({ t: b })
    expect(result.current.progress).toBe(0.25)
    a.kill()
    b.kill()
  })

  it('a null timeline from the start causes no extra render and no polling', async () => {
    clock = installTestClock({ startTime: 0, timers: true })
    let renders = 0
    const { result, rerender } = renderHook(({ t }: Props) => { renders++; return useTimelineState(t) }, {
      initialProps: { t: null as Timeline | null },
    })
    await adv(64)
    rerender({ t: null })
    expect(result.current).toEqual(IDLE)
    expect(renders).toBe(2) // mount + the explicit rerender
    cleanup()
    const strict = renderHook(() => useTimelineState(null), { wrapper: React.StrictMode })
    expect(strict.result.current).toEqual(IDLE)
    expect(clock.pendingFrames).toBe(0)
  })

  it('switching A -> B while A plays shows B, not A', async () => {
    clock = installTestClock({ startTime: 0, timers: true })
    const a = mk()
    const b = mk()
    const { result, rerender } = renderHook(({ t }: Props) => useTimelineState(t), {
      initialProps: { t: a as Timeline | null },
    })
    act(() => { a.play() })
    await adv(320)
    rerender({ t: b })
    expect(result.current).toEqual(IDLE)
    await adv(480)
    expect(a.progress()).toBeGreaterThan(0.7)
    expect(result.current).toEqual(IDLE)
    a.kill()
    b.kill()
  })
})
