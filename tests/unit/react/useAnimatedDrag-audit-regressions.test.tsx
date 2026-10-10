import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, act, cleanup, screen, fireEvent } from '@testing-library/react'
import * as React from 'react'
import { installTestClock, type TestClock } from '@oxog/springkit/testing'
import { Animated, MotionConfig, useDragControls } from '@oxog/springkit/react'

let clock: TestClock | null = null

afterEach(() => {
  cleanup()
  clock?.uninstall()
  clock = null
  vi.restoreAllMocks()
})

function startClock(): TestClock {
  clock = installTestClock({ timers: true })
  return clock
}

function advance(ms: number) {
  act(() => {
    clock!.advance(ms)
  })
}

function pointer(type: string, x: number, pointerId = 1) {
  act(() => {
    window.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: x, clientY: 0, pointerId }))
  })
}

function down(el: Element, x: number) {
  fireEvent.pointerDown(el, { clientX: x, clientY: 0, pointerId: 1 })
}

function offsetX(el: HTMLElement): number {
  const match = /translate3d\((-?[\d.e+-]+)px/.exec(el.style.transform)
  return match ? Number(match[1]) : 0
}

describe('F1901: dragTransition.modifyTarget that throws', () => {
  function release(modifyTarget: (t: number) => number, reduced = false) {
    startClock()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const escaped: unknown[] = []
    const onError = (e: ErrorEvent) => {
      escaped.push(e.error)
      e.preventDefault()
    }
    window.addEventListener('error', onError)
    const onDragEnd = vi.fn()
    const onDragTransitionEnd = vi.fn()
    const tree = (
      <Animated.div
        data-testid="el"
        drag="x"
        onDragEnd={onDragEnd}
        onDragTransitionEnd={onDragTransitionEnd}
        dragTransition={{ modifyTarget }}
      />
    )
    render(reduced ? <MotionConfig reducedMotion="always">{tree}</MotionConfig> : tree)
    const el = screen.getByTestId('el')
    down(el, 0)
    advance(16)
    pointer('pointermove', 50)
    advance(16)
    pointer('pointermove', 100)
    pointer('pointerup', 100)
    advance(5000)
    window.removeEventListener('error', onError)
    const result = {
      escaped: escaped.length,
      onDragEnd: onDragEnd.mock.calls.length,
      transitionEnd: onDragTransitionEnd.mock.calls.length,
      logged: consoleError.mock.calls.filter((c) => String(c[0]).includes('modifyTarget')).length,
      x: offsetX(el),
    }
    cleanup()
    clock!.uninstall()
    clock = null
    return result
  }

  it('is isolated: the drag ends, settles and keeps the unmodified target', () => {
    const identity = release((t) => t)
    const broken = release(() => {
      throw new Error('boom')
    })
    expect(broken).toMatchObject({ escaped: 0, onDragEnd: 1, transitionEnd: 1, logged: 1 })
    expect(broken.x).toBeCloseTo(identity.x, 6)
    expect(broken.x).toBeGreaterThan(100)
  })

  it('is isolated under reduced motion (target probe)', () => {
    const identity = release((t) => t, true)
    const broken = release(() => {
      throw new Error('boom')
    }, true)
    expect(broken).toMatchObject({ escaped: 0, onDragEnd: 1, transitionEnd: 1, logged: 1 })
    expect(broken.x).toBeCloseTo(identity.x, 6)
  })

  it('still applies a working modifyTarget', () => {
    const snapped = release((t) => Math.round(t / 100) * 100)
    expect(snapped.escaped).toBe(0)
    expect(snapped.logged).toBe(0)
    expect(snapped.x % 100).toBeCloseTo(0, 6)
  })
})

describe('F1902: release velocity after the pointer rested', () => {
  function releaseVelocity(steps: Array<[number, number]>, restMs: number): number {
    startClock()
    let velocity = NaN
    render(
      <Animated.div
        data-testid="el"
        drag="x"
        onDragEnd={(_e, info) => {
          velocity = info.velocity.x
        }}
      />
    )
    down(screen.getByTestId('el'), 0)
    let x = 0
    for (const [dt, nx] of steps) {
      advance(dt)
      pointer('pointermove', nx)
      x = nx
    }
    advance(restMs)
    pointer('pointerup', x)
    cleanup()
    clock!.uninstall()
    clock = null
    return velocity
  }

  const flick: Array<[number, number]> = [[10, 100]]

  it('does not fling at the stale flick speed when the pointer rested just inside the window', () => {
    expect(releaseVelocity(flick, 0)).toBeCloseTo(10000, 3)
    expect(releaseVelocity(flick, 50)).toBeCloseTo((100 / 60) * 1000, 3)
    expect(releaseVelocity(flick, 95)).toBe(0)
    expect(releaseVelocity(flick, 150)).toBe(0)
  })

  it('keeps the speed of steady motion released at once, and averages over a short rest', () => {
    const steady: Array<[number, number]> = [[16, 16], [16, 32], [16, 48], [16, 64]]
    expect(releaseVelocity(steady, 0)).toBeCloseTo(1000, 3)
    expect(releaseVelocity(steady, 32)).toBeCloseTo((64 / 96) * 1000, 3)
  })
})

describe('F1903: dragControls replaced mid-gesture', () => {
  type Controls = ReturnType<typeof useDragControls>

  function setup() {
    startClock()
    const h = {} as { a: Controls; b: Controls }
    function C({ mode, drag = true }: { mode: 'a' | 'b' | 'none'; drag?: boolean }) {
      h.a = useDragControls()
      h.b = useDragControls()
      return (
        <Animated.div
          data-testid="el"
          drag={drag}
          dragControls={mode === 'a' ? h.a : mode === 'b' ? h.b : undefined}
        />
      )
    }
    const view = render(<C mode="a" />)
    down(screen.getByTestId('el'), 0)
    advance(16)
    pointer('pointermove', 20)
    return { h, C, view }
  }

  it('tells the controls that saw the gesture start that it ended', () => {
    const s = setup()
    expect(s.h.a.isDragging()).toBe(true)
    s.view.rerender(<s.C mode="b" />)
    expect(s.h.a.isDragging()).toBe(true)
    pointer('pointerup', 20)
    expect(s.h.a.isDragging()).toBe(false)
    expect(s.h.b.isDragging()).toBe(false)
  })

  it('also when the controls are removed, drag is turned off, or the element unmounts', () => {
    let s = setup()
    s.view.rerender(<s.C mode="none" />)
    pointer('pointerup', 20)
    expect(s.h.a.isDragging()).toBe(false)
    cleanup()
    clock!.uninstall()

    s = setup()
    s.view.rerender(<s.C mode="b" />)
    s.view.rerender(<s.C mode="b" drag={false} />)
    expect(s.h.a.isDragging()).toBe(false)
    cleanup()
    clock!.uninstall()

    s = setup()
    s.view.rerender(<s.C mode="b" />)
    const a = s.h.a
    s.view.unmount()
    expect(a.isDragging()).toBe(false)
  })

  it('lets the new controls drive the next gesture', () => {
    const s = setup()
    s.view.rerender(<s.C mode="b" />)
    pointer('pointerup', 20)
    advance(2000)
    act(() => {
      s.h.b.start(new PointerEvent('pointerdown', { clientX: 0, clientY: 0, pointerId: 2 }))
    })
    expect(s.h.b.isDragging()).toBe(true)
    pointer('pointerup', 0, 2)
    expect(s.h.b.isDragging()).toBe(false)
    expect(s.h.a.isDragging()).toBe(false)
  })
})
