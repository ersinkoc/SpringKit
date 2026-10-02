/**
 * Regression tests for useSprings / useTrail / useSpringState
 */
import { describe, it, expect, vi } from 'vitest'
import { render, renderHook, act } from '@testing-library/react'
import * as React from 'react'
import { useSprings } from '../../../src/adapters/react/hooks/useSprings'
import { useTrail } from '../../../src/adapters/react/hooks/useTrail'
import { useSpringState } from '../../../src/adapters/react/hooks/usePhysics'

const wait = (ms: number) => act(async () => { await new Promise((r) => setTimeout(r, ms)) })

describe('useSprings', () => {
  it('animates to the target when called without a defaultConfig (inline {} default must not restart springs every render)', async () => {
    let latest: Array<{ x: number }> = []
    function C() {
      latest = useSprings(1, () => ({
        values: { x: 100 },
        from: { x: 0 },
        config: { stiffness: 1000, damping: 100 },
      }))
      return null
    }
    render(<C />)
    await wait(400)
    expect(latest[0]!.x).toBeGreaterThan(90)
  })

  it('retargets (animates, not jumps) when the values returned by the items function change', async () => {
    let latest: Array<{ x: number }> = []
    const seen: number[] = []
    function C({ target }: { target: number }) {
      latest = useSprings(1, () => ({
        values: { x: target },
        config: { stiffness: 300, damping: 30 },
      }))
      seen.push(latest[0]!.x)
      return null
    }
    const { rerender } = render(<C target={0} />)
    await wait(50)
    expect(latest[0]!.x).toBe(0)
    rerender(<C target={100} />)
    // many short act() scopes so intermediate frames get rendered
    for (let i = 0; i < 20; i++) await wait(30)
    expect(latest[0]!.x).toBeGreaterThan(90)
    // intermediate frames prove the spring animated instead of being recreated at the target
    expect(seen.some((v) => v > 0 && v < 90)).toBe(true)
  })
})

describe('useTrail', () => {
  it('returns exactly `count` items after count decreases', async () => {
    const { result, rerender } = renderHook(
      ({ count }) => useTrail(count, { opacity: 1 }),
      { initialProps: { count: 3 } }
    )
    expect(result.current).toHaveLength(3)
    rerender({ count: 1 })
    await wait(20)
    expect(result.current).toHaveLength(1)
  })

  it('returns exactly `count` items after count increases', async () => {
    const { result, rerender } = renderHook(
      ({ count }) => useTrail(count, { opacity: 1 }),
      { initialProps: { count: 1 } }
    )
    rerender({ count: 3 })
    await wait(20)
    expect(result.current).toHaveLength(3)
    expect(result.current[2]).toEqual({ opacity: 1 })
  })
})

describe('useSpringState', () => {
  it('calls the latest onChange callback (no stale closure)', async () => {
    const first = vi.fn()
    const second = vi.fn()
    const { result, rerender } = renderHook(
      ({ onChange }) => useSpringState(0, { stiffness: 1000, damping: 100, onChange }),
      { initialProps: { onChange: first } }
    )
    rerender({ onChange: second })
    act(() => result.current[1](10))
    await wait(100)
    expect(second).toHaveBeenCalled()
    expect(first).not.toHaveBeenCalled()
  })
})
