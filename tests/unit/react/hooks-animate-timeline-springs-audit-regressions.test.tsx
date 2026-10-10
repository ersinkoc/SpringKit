/**
 * Regressions found by the useAnimate / useTimeline audit (F2601-F2603).
 * Deterministic: everything runs on installTestClock().
 */
import { describe, it, expect, afterEach } from 'vitest'
import { renderHook, act, cleanup } from '@testing-library/react'
import { useAnimate, useTimeline, type UseTimelineOptions } from '@oxog/springkit/react'
import { installTestClock, type TestClock } from '@oxog/springkit/testing'

let clock: TestClock | null = null
afterEach(() => {
  cleanup()
  clock?.uninstall()
  clock = null
})
const STIFF = { stiffness: 1000, damping: 100 }
const FAST = STIFF
const SLOW = { stiffness: 20, damping: 3 }
const adv = async (ms: number) => {
  for (let t = 0; t < ms; t += 16) await act(async () => { clock!.advance(16) })
}

describe('F2601 stop() halts keyframe sequences', () => {
  it('remaining keyframes do not run after stop()', async () => {
    clock = installTestClock({ startTime: 0, timers: true })
    const { result } = renderHook(() => useAnimate())
    await act(async () => { void result.current[1]({ y: [100, 200, 300] }, { config: STIFF }) })
    await adv(48)
    const at = result.current[2].get('y')!
    result.current[2].stop()
    await adv(3000)
    expect(result.current[2].get('y')).toBe(at)
    expect(clock.pendingFrames).toBe(0)
  })
  it('stopped animate() settles and does not call onComplete; uninterrupted keyframes still complete once', async () => {
    clock = installTestClock({ startTime: 0, timers: true })
    const { result } = renderHook(() => useAnimate())
    let settledStopped = false, stoppedCompletes = 0, okCompletes = 0
    await act(async () => { void result.current[1]({ y: [100, 200] }, { config: STIFF, onComplete: () => { stoppedCompletes++ } }).then(() => { settledStopped = true }) })
    await adv(32)
    result.current[2].stop()
    await adv(500)
    expect(settledStopped).toBe(true)
    expect(stoppedCompletes).toBe(0)
    expect(result.current[2].isAnimating()).toBe(false)
    // control: a later uninterrupted keyframe animation completes at the last keyframe
    await act(async () => { void result.current[1]({ y: [10, 20] }, { config: STIFF, onComplete: () => { okCompletes++ } }) })
    await adv(3000)
    expect(Math.round(result.current[2].get('y')!)).toBe(20)
    expect(okCompletes).toBe(1)
  })
  it('gated: stop() then a new animate() before the stale chain resolves - new target wins, stale keyframes never applied', async () => {
    clock = installTestClock({ startTime: 0, timers: true })
    const { result } = renderHook(() => useAnimate())
    await act(async () => { void result.current[1]({ y: [500, 900] }, { config: STIFF }) })
    await adv(32)
    // stop and restart in the same tick: the stale chain's pending check resolves only on the next frame
    await act(async () => { result.current[2].stop(); void result.current[1]({ y: 50 }, { config: STIFF }) })
    let max = 0
    for (let i = 0; i < 100; i++) { await adv(16); max = Math.max(max, result.current[2].get('y')!) }
    expect(Math.round(result.current[2].get('y')!)).toBe(50)
    expect(max).toBeLessThan(500)
  })
  it('stop() with nothing running is a no-op', async () => {
    const { result } = renderHook(() => useAnimate())
    expect(() => result.current[2].stop()).not.toThrow()
    expect(result.current[2].isAnimating()).toBe(false)
  })
})

describe('F2602 isAnimating with concurrent animate() calls', () => {
  it('true until the slowest concurrent call finishes, then false', async () => {
    clock = installTestClock({ startTime: 0, timers: true })
    const { result } = renderHook(() => useAnimate())
    let fastDone = false, slowDone = false
    await act(async () => {
      void result.current[1]({ x: 1 }, { config: FAST }).then(() => { fastDone = true })
      void result.current[1]({ y: 100 }, { config: SLOW }).then(() => { slowDone = true })
    })
    for (let i = 0; i < 100 && !fastDone; i++) await adv(16)
    expect(fastDone).toBe(true)
    expect(slowDone).toBe(false)
    expect(result.current[2].isAnimating()).toBe(true)
    for (let i = 0; i < 1000 && !slowDone; i++) await adv(16)
    expect(slowDone).toBe(true)
    expect(result.current[2].isAnimating()).toBe(false)
  })
  it('control: a single call is true while running and false at completion (onComplete sees false)', async () => {
    clock = installTestClock({ startTime: 0, timers: true })
    const { result } = renderHook(() => useAnimate())
    let seen: boolean | null = null
    await act(async () => { void result.current[1]({ x: 100 }, { config: FAST, onComplete: () => { seen = result.current[2].isAnimating() } }) })
    expect(result.current[2].isAnimating()).toBe(true)
    await adv(2000)
    expect(seen).toBe(false)
    expect(result.current[2].isAnimating()).toBe(false)
  })
  it('gated: stale stopped run resolving after a new run started does not clear the new run flag', async () => {
    clock = installTestClock({ startTime: 0, timers: true })
    const { result } = renderHook(() => useAnimate())
    await act(async () => { void result.current[1]({ x: 100 }, { config: SLOW }) })
    await adv(32)
    await act(async () => { result.current[2].stop(); void result.current[1]({ y: 100 }, { config: SLOW }) })
    expect(result.current[2].isAnimating()).toBe(true)
    await adv(48) // the stale chain's check resolves in here
    expect(result.current[2].isAnimating()).toBe(true)
    await adv(8000)
    expect(result.current[2].isAnimating()).toBe(false)
  })
  it('a throwing onComplete does not leave isAnimating stuck', async () => {
    clock = installTestClock({ startTime: 0, timers: true })
    const { result } = renderHook(() => useAnimate())
    const orig = console.error
    console.error = () => {}
    try {
      await act(async () => { void result.current[1]({ x: 100 }, { config: FAST, onComplete: () => { throw new Error('boom') } }) })
      await adv(2000)
    } finally { console.error = orig }
    expect(result.current[2].isAnimating()).toBe(false)
  })
})

describe('F2603 useTimeline uses the latest callbacks', () => {
  it('onComplete / onStart / onUpdate come from the latest render', async () => {
    clock = installTestClock({ startTime: 0, timers: true })
    const log: string[] = []
    const { result, rerender } = renderHook(({ tag }: { tag: string }) => useTimeline({
      onStart: () => { log.push('start:' + tag) },
      onUpdate: () => { if (!log.includes('update:' + tag)) log.push('update:' + tag) },
      onComplete: () => { log.push('complete:' + tag) },
    }), { initialProps: { tag: 'a' } })
    rerender({ tag: 'b' })
    const box = document.createElement('div')
    act(() => { result.current.timeline!.to(box, { x: 100 }); result.current.play() })
    await adv(16)
    rerender({ tag: 'c' }) // changes mid-run
    await adv(3000)
    expect(log[0]).toBe('start:b')
    expect(log).toContain('update:c')
    expect(log.some((l) => l.endsWith(':a'))).toBe(false)
    expect(log.filter((l) => l.startsWith('complete'))).toEqual(['complete:c'])
  })
  it('control: unchanged callback still fires exactly once; non-callback options (repeat) still applied', async () => {
    clock = installTestClock({ startTime: 0, timers: true })
    let completes = 0, repeats = 0
    const { result } = renderHook(() => useTimeline({ repeat: 1, onRepeat: () => { repeats++ }, onComplete: () => { completes++ } }))
    const box = document.createElement('div')
    act(() => { result.current.timeline!.to(box, { x: 100 }); result.current.play() })
    await adv(6000)
    expect(repeats).toBe(1)
    expect(completes).toBe(1)
  })
  it('omitted callbacks and callbacks removed later do not throw', async () => {
    clock = installTestClock({ startTime: 0, timers: true })
    let completes = 0
    const { result, rerender } = renderHook(({ opts }: { opts: UseTimelineOptions }) => useTimeline(opts), { initialProps: { opts: { onComplete: () => { completes++ } } as UseTimelineOptions } })
    rerender({ opts: {} })
    const box = document.createElement('div')
    act(() => { result.current.timeline!.to(box, { x: 100 }); result.current.play() })
    await adv(3000)
    expect(completes).toBe(0)
  })
  it('gated: unmount before completion -> no callback fires, nothing pending', async () => {
    clock = installTestClock({ startTime: 0, timers: true })
    let completes = 0
    const { result, unmount } = renderHook(() => useTimeline({ onComplete: () => { completes++ } }))
    const box = document.createElement('div')
    act(() => { result.current.timeline!.to(box, { x: 100 }); result.current.play() })
    await adv(32)
    unmount()
    await adv(3000)
    expect(completes).toBe(0)
    expect(clock.pendingFrames).toBe(0)
  })
})
