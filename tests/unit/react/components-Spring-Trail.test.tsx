import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, act, cleanup } from '@testing-library/react'
import * as React from 'react'
import { Spring, Trail } from '@oxog/springkit/react'

function useAnimationClock() {
  vi.useFakeTimers({
    toFake: [
      'setTimeout',
      'clearTimeout',
      'setInterval',
      'clearInterval',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'performance',
      'Date',
    ],
  })
}

async function advanceFrames(frames: number, onFrame?: () => void) {
  for (let i = 0; i < frames; i++) {
    await act(async () => {
      vi.advanceTimersByTime(16)
    })
    onFrame?.()
  }
}

describe('Spring / Trail components (regressions)', () => {
  beforeEach(() => {
    useAnimationClock()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('Spring does not restart its spring on every render (keeps velocity, overshoots)', async () => {
    let latest = 0
    let max = 0
    render(
      <Spring from={{ x: 0 }} to={{ x: 100 }} config={{ stiffness: 300, damping: 5 }}>
        {(values) => {
          latest = values.x
          return <div>{values.x}</div>
        }}
      </Spring>
    )
    await advanceFrames(120, () => {
      max = Math.max(max, latest)
    })
    expect(max).toBeGreaterThan(100)
  })

  it('Spring with the default config reaches its target', async () => {
    let latest = 0
    render(
      <Spring from={{ x: 0 }} to={{ x: 100 }}>
        {(values) => {
          latest = values.x
          return <div>{values.x}</div>
        }}
      </Spring>
    )
    await advanceFrames(300)
    expect(latest).toBeCloseTo(100, 0)
  })

  it('Trail animates every key from `from` to `to`', async () => {
    const seen: Array<Record<string, number>> = []
    render(
      <Trail
        items={['a', 'b']}
        keys={(item) => item}
        from={{ opacity: 0, x: -20 }}
        to={{ opacity: 1, x: 0 }}
        config={{ stiffness: 300, damping: 30 }}
      >
        {(values, _item, index) => {
          seen[index] = values
          return <div>{values.opacity}</div>
        }}
      </Trail>
    )

    // Starts from `from`
    expect(seen[0]).toEqual({ opacity: 0, x: -20 })

    await advanceFrames(300)

    for (const values of seen) {
      expect(values.opacity).toBeCloseTo(1, 1)
      expect(values.x).toBeCloseTo(0, 1)
    }
  })
})
