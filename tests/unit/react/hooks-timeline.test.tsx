/**
 * Regression tests for useTimeline / useTimelineState
 */
import { describe, it, expect } from 'vitest'
import { render, act } from '@testing-library/react'
import * as React from 'react'
import { createTimeline, type Timeline } from '../../../src/animation/timeline'
import { useTimeline, useTimelineState } from '../../../src/adapters/react/hooks/useTimeline'

describe('useTimeline', () => {
  it('exposes the timeline instance after mount (documented useEffect([timeline]) pattern)', () => {
    const seen: Array<Timeline | null> = []
    function C() {
      const { timeline } = useTimeline()
      React.useEffect(() => {
        seen.push(timeline)
      }, [timeline])
      return null
    }
    render(<C />)
    expect(seen.some((t) => t !== null)).toBe(true)
  })

  it('exposes a live timeline under StrictMode', () => {
    let latest: Timeline | null = null
    function C() {
      latest = useTimeline().timeline
      return null
    }
    render(<React.StrictMode><C /></React.StrictMode>)
    expect(latest).not.toBeNull()
    // the exposed instance must be the one the hook controls (not a killed one)
    expect(() => latest!.to({ x: 0 } as never, { x: 1 } as never)).not.toThrow()
  })
})

describe('useTimelineState', () => {
  it('re-renders when the timeline state changes', async () => {
    const target = { x: 0 }
    const timeline = createTimeline()
    timeline.to(target, { x: 100, duration: 1000 } as never)

    function Progress() {
      const { progress } = useTimelineState(timeline)
      return <span data-testid="p">{progress.toFixed(2)}</span>
    }
    const { getByTestId } = render(<Progress />)
    expect(getByTestId('p').textContent).toBe('0.00')

    act(() => {
      timeline.seek(500)
    })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })
    expect(getByTestId('p').textContent).toBe('0.50')
    timeline.kill()
  })
})
