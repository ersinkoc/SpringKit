/**
 * Audit regressions for useGestureState / useTap / useGesture (scope 27).
 *
 * SEAMS: jsdom's TouchEvent cannot carry Touch lists, so touch events are plain
 * bubbling Events with `touches` / `targetTouches` defined as array-likes.
 * PointerEvent comes from the tests/setup.ts polyfill. No timers are involved.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, act, cleanup, fireEvent } from '@testing-library/react'
import * as React from 'react'
import { useGestureState, useTap } from '../../../src/adapters/react/hooks/useGestureState'
import { useGesture } from '../../../src/adapters/react/hooks/useGesture'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

type TouchKind = 'touchstart' | 'touchend' | 'touchcancel'

/** `remaining` = all touches still on screen, `onTarget` = those started on the element */
function touch(
  el: EventTarget,
  type: TouchKind,
  changed: number[],
  remaining: number[],
  onTarget: number[]
) {
  const e = new Event(type, { bubbles: true, cancelable: true })
  const list = (ids: number[]) => ids.map((identifier) => ({ identifier }))
  Object.defineProperty(e, 'changedTouches', { value: list(changed) })
  Object.defineProperty(e, 'touches', { value: list(remaining) })
  Object.defineProperty(e, 'targetTouches', { value: list(onTarget) })
  act(() => {
    el.dispatchEvent(e)
  })
}

type Which = 'state' | 'tap'

function setupPress(which: Which) {
  const out = { pressed: false }
  function Probe() {
    const s = useGestureState({ hover: false, focus: false })
    const t = useTap()
    const r = which === 'state' ? s : t
    out.pressed = r.isPressed
    return (
      <div>
        <div data-testid="el" {...r.handlers} />
        <div data-testid="other" />
      </div>
    )
  }
  const utils = render(<Probe />)
  return { out, el: utils.getByTestId('el'), other: utils.getByTestId('other'), utils }
}

describe.each(['state', 'tap'] as const)('F2701 touch press lifecycle (%s)', (which) => {
  it('control: a plain tap presses and releases', () => {
    const { out, el } = setupPress(which)
    touch(el, 'touchstart', [1], [1], [1])
    expect(out.pressed).toBe(true)
    touch(el, 'touchend', [1], [], [])
    expect(out.pressed).toBe(false)
  })

  it('touchcancel releases the press', () => {
    const { out, el } = setupPress(which)
    touch(el, 'touchstart', [1], [1], [1])
    expect(out.pressed).toBe(true)
    touch(el, 'touchcancel', [1], [], [])
    expect(out.pressed).toBe(false)
  })

  it('a finger lifting elsewhere does not release a press that is still held', () => {
    const { out, el, other } = setupPress(which)
    touch(el, 'touchstart', [1], [1], [1])
    touch(other, 'touchstart', [2], [1, 2], [2])
    touch(other, 'touchend', [2], [1], [])
    expect(out.pressed).toBe(true)
    touch(el, 'touchend', [1], [], [])
    expect(out.pressed).toBe(false)
  })

  it('with two fingers on the element the press ends when the last one lifts', () => {
    const { out, el } = setupPress(which)
    touch(el, 'touchstart', [1], [1], [1])
    touch(el, 'touchstart', [2], [1, 2], [1, 2])
    touch(el, 'touchend', [2], [1], [1])
    expect(out.pressed).toBe(true)
    touch(el, 'touchend', [1], [], [])
    expect(out.pressed).toBe(false)
  })

  it('a touchend without touch lists (synthetic events) still releases', () => {
    const { out, el } = setupPress(which)
    fireEvent.touchStart(el)
    expect(out.pressed).toBe(true)
    fireEvent.touchEnd(el)
    expect(out.pressed).toBe(false)
  })

  it('a window-level touchcancel releases a press whose element never saw the end', () => {
    const { out, el } = setupPress(which)
    touch(el, 'touchstart', [1], [1], [1])
    touch(window, 'touchcancel', [1], [], [])
    expect(out.pressed).toBe(false)
  })

  it('mouse press / release still works', () => {
    const { out, el } = setupPress(which)
    fireEvent.mouseDown(el)
    expect(out.pressed).toBe(true)
    fireEvent.mouseUp(el)
    expect(out.pressed).toBe(false)
  })

  it('removes every window listener it added on unmount', () => {
    const added = vi.spyOn(window, 'addEventListener')
    const removed = vi.spyOn(window, 'removeEventListener')
    const { utils } = setupPress(which)
    const touchAdds = added.mock.calls
      .filter(([t]) => String(t).startsWith('touch'))
      .map(([t, f]) => [t, f] as const)
    expect(touchAdds.map(([t]) => t)).toContain('touchcancel')
    utils.unmount()
    for (const [t, f] of touchAdds) {
      expect(removed.mock.calls.some(([rt, rf]) => rt === t && rf === f)).toBe(true)
    }
  })
})

describe('F2702 useGesture: a lost pointerup must not leak into the next press', () => {
  function setup() {
    const starts: Array<[number, number]> = []
    const drags: Array<{ x: number; y: number }> = []
    const pinches: Array<{ scale?: number }> = []
    function C() {
      const bind = useGesture({
        onDragStart: (e) => starts.push([e.clientX, e.clientY]),
        onDrag: (s) => drags.push({ x: s.x, y: s.y }),
        onPinch: (s) => pinches.push({ scale: s.scale }),
      })
      return <div data-testid="el" {...bind} />
    }
    const { getByTestId } = render(<C />)
    const el = getByTestId('el')
    return {
      starts,
      drags,
      pinches,
      down: (id: number, x: number, y: number) =>
        fireEvent.pointerDown(el, { pointerId: id, clientX: x, clientY: y }),
      move: (id: number, x: number, y: number) =>
        fireEvent.pointerMove(el, { pointerId: id, clientX: x, clientY: y }),
      up: (id: number, x: number, y: number) =>
        fireEvent.pointerUp(el, { pointerId: id, clientX: x, clientY: y }),
      cancel: (id: number) => fireEvent.pointerCancel(el, { pointerId: id }),
    }
  }

  it('control: pointerup delivered, the next press starts at its own origin', () => {
    const g = setup()
    g.down(1, 0, 0)
    g.move(1, 5, 0)
    g.up(1, 5, 0)
    g.down(1, 50, 50)
    g.move(1, 60, 50)
    expect(g.starts).toHaveLength(2)
    expect(g.drags[g.drags.length - 1]).toEqual({ x: 10, y: 0 })
  })

  it('a new pointerdown for a still-tracked id starts a fresh drag', () => {
    const g = setup()
    g.down(1, 0, 0)
    g.move(1, 5, 0)
    // pointerup / pointercancel never arrive
    g.down(1, 50, 50)
    g.move(1, 60, 50)
    expect(g.starts).toEqual([
      [0, 0],
      [50, 50],
    ])
    expect(g.drags[g.drags.length - 1]).toEqual({ x: 10, y: 0 })
  })

  it('repeated lost releases keep starting fresh drags', () => {
    const g = setup()
    for (let i = 0; i < 3; i++) {
      g.down(1, i * 100, 0)
      g.move(1, i * 100 + 7, 0)
      expect(g.drags[g.drags.length - 1]).toEqual({ x: 7, y: 0 })
    }
    expect(g.starts).toHaveLength(3)
  })

  it('re-pressing during a pinch restarts the pinch from the new geometry', () => {
    const g = setup()
    g.down(1, 0, 0)
    g.down(2, 100, 0)
    g.move(2, 200, 0)
    expect(g.pinches[g.pinches.length - 1]?.scale).toBe(2)
    // finger 1's release is lost; it lands again 100px from finger 2's position
    g.down(1, 100, 0)
    g.move(2, 300, 0)
    // fingers are 200px apart now vs 100px apart when the pinch was restarted
    expect(g.pinches[g.pinches.length - 1]?.scale).toBeCloseTo(2)
  })

  it('a different pointer id is unaffected (second finger does not reset the drag origin)', () => {
    const g = setup()
    g.down(1, 0, 0)
    g.move(1, 10, 0)
    g.down(2, 100, 100)
    g.move(1, 20, 0)
    expect(g.starts).toHaveLength(1)
    expect(g.drags[g.drags.length - 1]).toEqual({ x: 20, y: 0 })
  })

  it('pointercancel still ends the gesture normally', () => {
    const g = setup()
    g.down(1, 0, 0)
    g.cancel(1)
    g.down(1, 30, 30)
    g.move(1, 31, 30)
    expect(g.drags[g.drags.length - 1]).toEqual({ x: 1, y: 0 })
  })
})
