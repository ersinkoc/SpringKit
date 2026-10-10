/**
 * Regressions found by the usePhysics audit (F701-F703).
 * Deterministic: everything runs on installTestClock().
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { renderHook, act, cleanup } from '@testing-library/react'
import { useElastic, useChain } from '@oxog/springkit/react'
import { installTestClock, type TestClock } from '@oxog/springkit/testing'

let clock: TestClock | null = null
afterEach(() => {
  cleanup()
  clock?.uninstall()
  clock = null
  vi.restoreAllMocks()
})

describe('useElastic: stretch() keeps the spring in sync (F701)', () => {
  it('release() after stretch() springs back instead of snapping to 0', () => {
    clock = installTestClock({ startTime: 0 })
    const { result } = renderHook(() => useElastic({ elasticity: 0.5, maxStretch: 100 }))
    act(() => result.current.stretch(80))
    const stretched = result.current.value.get()
    expect(stretched).toBeGreaterThan(0)

    act(() => result.current.release())
    act(() => clock!.advance(48))
    const mid = result.current.value.get()
    expect(mid).toBeGreaterThan(stretched * 0.1)
    expect(mid).toBeLessThan(stretched)

    act(() => clock!.advance(3000))
    expect(result.current.value.get()).toBeCloseTo(0, 2)
  })

  it('a stretch() during a running release wins (the old release is cancelled)', () => {
    clock = installTestClock({ startTime: 0 })
    const { result } = renderHook(() => useElastic({ elasticity: 0.5, maxStretch: 100 }))
    act(() => result.current.stretch(80))
    act(() => result.current.release())
    act(() => clock!.advance(48))
    act(() => result.current.stretch(60))
    const held = result.current.value.get()
    act(() => clock!.advance(500))
    expect(result.current.value.get()).toBe(held)
  })

  it('release() at rest stays at 0 and non-finite stretch is ignored', () => {
    clock = installTestClock({ startTime: 0 })
    const { result } = renderHook(() => useElastic())
    act(() => result.current.release())
    act(() => clock!.advance(500))
    expect(result.current.value.get()).toBe(0)
    act(() => result.current.stretch(Number.NaN))
    act(() => result.current.stretch(Number.POSITIVE_INFINITY))
    expect(result.current.value.get()).toBe(0)
    expect(result.current.getRaw()).toBe(0)
  })

  it('set() still animates from the current position', () => {
    clock = installTestClock({ startTime: 0 })
    const { result } = renderHook(() => useElastic())
    act(() => result.current.set(80))
    act(() => clock!.advance(3000))
    expect(Math.round(result.current.value.get())).toBe(80)
  })
})

type Steps = Parameters<typeof useChain>[0]
const STIFF = { stiffness: 1000, damping: 100 }

describe('useChain: keys added after mount (F702)', () => {
  it('animates a key that only appears in a later steps prop', async () => {
    clock = installTestClock({ startTime: 0, timers: true })
    const { result, rerender } = renderHook(({ steps }: { steps: Steps }) => useChain(steps), {
      initialProps: { steps: [{ to: { x: 100 }, config: STIFF }] as Steps },
    })
    // play() is ignored while isPlaying, so let each run finish (promise-driven)
    const runToEnd = async () => {
      act(() => result.current.play())
      for (let i = 0; i < 300 && (result.current.isPlaying || i === 0); i++) {
        await act(async () => { clock!.advance(16) })
      }
      expect(result.current.isPlaying).toBe(false)
    }
    await runToEnd()
    expect(Math.round(result.current.values.x!.get())).toBe(100)

    rerender({ steps: [{ to: { x: 100, y: 50, z: -20 }, config: STIFF }] })
    await runToEnd()
    expect(Math.round(result.current.values.y!.get())).toBe(50)
    expect(Math.round(result.current.values.z!.get())).toBe(-20)
    expect(Math.round(result.current.values.x!.get())).toBe(100)
  })

  it('unmounting mid-run neither throws nor updates state afterwards', async () => {
    clock = installTestClock({ startTime: 0, timers: true })
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { result, rerender, unmount } = renderHook(({ steps }: { steps: Steps }) => useChain(steps), {
      initialProps: { steps: [{ to: { x: 10 }, config: STIFF }] as Steps },
    })
    rerender({ steps: [{ to: { y: 50 } }, { to: { x: 0 }, delay: 50 }] })
    act(() => result.current.play())
    await act(async () => { clock!.advance(32) })
    unmount()
    await act(async () => { clock!.advance(5000) })
    expect(errors).not.toHaveBeenCalled()
    expect(clock.pendingFrames).toBe(0)
  })
})

describe('useChain: a step config applies to that step only (F703)', () => {
  async function lastStepDuration(
    steps: Steps,
    initial: Record<string, number>,
    lastIndex: number
  ): Promise<number> {
    clock = installTestClock({ startTime: 0, timers: true })
    const { result, unmount } = renderHook(() => useChain(steps, initial))
    act(() => result.current.play())
    let start = -1
    for (let t = 0; t < 30000; t += 16) {
      await act(async () => { clock!.advance(16) })
      if (start < 0 && result.current.currentStep === lastIndex) start = t
      if (!result.current.isPlaying) {
        unmount()
        clock.uninstall()
        clock = null
        return t - start
      }
    }
    throw new Error('chain never finished')
  }

  it('a step without config uses the default physics after a stiff step on the same key', async () => {
    const fresh = await lastStepDuration([{ to: { x: 0 } }], { x: 100 }, 0)
    const afterStiff = await lastStepDuration(
      [{ to: { x: 100 }, config: { stiffness: 2000, damping: 130 } }, { to: { x: 0 } }],
      {},
      1
    )
    expect(afterStiff).toBeGreaterThan(fresh * 0.7)
    expect(afterStiff).toBeLessThan(fresh * 1.3)
  })

  it('a step with its own config still uses it', async () => {
    const dflt = await lastStepDuration([{ to: { x: 0 } }], { x: 100 }, 0)
    const stiff = await lastStepDuration([{ to: { x: 0 }, config: { stiffness: 2000, damping: 130 } }], { x: 100 }, 0)
    expect(stiff).toBeLessThan(dflt * 0.5)
  })
})
