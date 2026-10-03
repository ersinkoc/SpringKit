/**
 * Physics hooks run on real elapsed time: same motion at any refresh rate,
 * and they follow the global time scale
 */
import { describe, it, expect, afterEach } from 'vitest'
import { renderHook, act, cleanup } from '@testing-library/react'
import { useMomentum } from '../../../src/adapters/react/hooks/usePhysics'
import { globalLoop } from '@oxog/springkit'
import { installTestClock, type TestClock } from '@oxog/springkit/testing'

let clock: TestClock | null = null
afterEach(() => {
  cleanup()
  globalLoop.setTimeScale(1)
  clock?.uninstall()
  clock = null
})

function momentumAfter(frameRate: number, ms: number): number {
  clock = installTestClock({ frameRate, startTime: 0 })
  const { result, unmount } = renderHook(() => useMomentum({ friction: 0.98 }))
  act(() => result.current.push(10))
  act(() => clock!.advance(ms))
  const value = result.current.value.get()
  unmount()
  clock.uninstall()
  clock = null
  return value
}

describe('physics hooks timing', () => {
  it('useMomentum travels the same distance at 60Hz and 120Hz', () => {
    const at60 = momentumAfter(60, 200)
    const at120 = momentumAfter(120, 200)
    expect(at60).toBeGreaterThan(50)
    // per-frame integration made 120Hz travel ~2x as far; now within a few %
    expect(Math.abs(at120 - at60) / at60).toBeLessThan(0.1)
  })

  it('useMomentum freezes when the global time scale is 0', () => {
    clock = installTestClock({ startTime: 0 })
    const { result } = renderHook(() => useMomentum({ friction: 0.95 }))
    act(() => result.current.push(10))
    act(() => clock!.advance(100))
    const before = result.current.value.get()
    globalLoop.setTimeScale(0)
    act(() => clock!.advance(500))
    expect(result.current.value.get()).toBe(before)
  })
})
