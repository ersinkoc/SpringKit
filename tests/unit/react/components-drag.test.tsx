import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, act, cleanup, screen, fireEvent } from '@testing-library/react'
import * as React from 'react'
import { installTestClock, type TestClock } from '@oxog/springkit/testing'
import { Animated, MotionConfig, useDragControls } from '@oxog/springkit/react'
import type { PanInfo } from '../../../src/adapters/react/components/useAnimatedDrag.js'

let clock: TestClock | null = null

function startClock(): TestClock {
  clock = installTestClock({ timers: true })
  return clock
}

afterEach(() => {
  cleanup()
  clock?.uninstall()
  clock = null
  vi.restoreAllMocks()
})

/** Advance the virtual clock, flushing React updates */
function advance(ms: number) {
  act(() => {
    clock!.advance(ms)
  })
}

function runAll() {
  act(() => {
    clock!.runAll()
  })
}

function down(el: Element, x: number, y: number) {
  fireEvent.pointerDown(el, { clientX: x, clientY: y, pointerId: 1 })
}

function pointer(type: string, x: number, y: number, pointerId = 1) {
  act(() => {
    window.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId }))
  })
}

const move = (x: number, y: number, id?: number) => pointer('pointermove', x, y, id)
const up = (x: number, y: number, id?: number) => pointer('pointerup', x, y, id)

/** Current drag offset, parsed from the translate3d() the element renders */
function offsetOf(el: HTMLElement): { x: number; y: number } {
  const match = /translate3d\((-?[\d.e+-]+)px, (-?[\d.e+-]+)px, 0px\)/.exec(el.style.transform)
  return match ? { x: Number(match[1]), y: Number(match[2]) } : { x: 0, y: 0 }
}

function mockRect(el: Element, rect: { left: number; top: number; width: number; height: number }) {
  el.getBoundingClientRect = () =>
    ({
      ...rect,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height,
      x: rect.left,
      y: rect.top,
      toJSON: () => ({}),
    }) as DOMRect
}

/**
 * Drag by `dx` along x in `steps` moves of 16ms each and release: the release
 * velocity is dx / (steps * 16ms)
 */
function fling(el: HTMLElement, dx: number, steps = 2, dy = 0) {
  down(el, 0, 0)
  for (let i = 1; i <= steps; i++) {
    advance(16)
    move((dx * i) / steps, (dy * i) / steps)
  }
  up(dx, dy)
}

/** Resting point of a decay: from + v / -ln(d), with v in px/ms */
const decayRest = (from: number, velocityPxS: number, deceleration = 0.998) =>
  from + velocityPxS / 1000 / -Math.log(deceleration)

describe('Animated drag callbacks', () => {
  it('calls onDragStart, onDrag and onDragEnd with point, delta, offset and velocity', () => {
    startClock()
    const onDragStart = vi.fn()
    const onDrag = vi.fn()
    const onDragEnd = vi.fn()
    render(
      <Animated.div
        data-testid="el"
        drag
        dragMomentum={false}
        onDragStart={onDragStart}
        onDrag={onDrag}
        onDragEnd={onDragEnd}
      />
    )
    const el = screen.getByTestId('el')

    down(el, 10, 20)
    expect(onDragStart).toHaveBeenCalledTimes(1)
    const [startEvent, startInfo] = onDragStart.mock.calls[0] as [PointerEvent, PanInfo]
    expect(startEvent.type).toBe('pointerdown')
    expect(startInfo).toEqual({
      point: { x: 10, y: 20 },
      delta: { x: 0, y: 0 },
      offset: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
    })

    advance(16)
    move(26, 20)
    advance(16)
    move(42, 28)
    expect(onDrag).toHaveBeenCalledTimes(2)
    const [, info] = onDrag.mock.calls[1] as [PointerEvent, PanInfo]
    expect(info.point).toEqual({ x: 42, y: 28 })
    expect(info.delta).toEqual({ x: 16, y: 8 })
    expect(info.offset).toEqual({ x: 32, y: 8 })
    // 32px / 32ms and 8px / 32ms
    expect(info.velocity.x).toBeCloseTo(1000, 5)
    expect(info.velocity.y).toBeCloseTo(250, 5)

    up(42, 28)
    expect(onDragEnd).toHaveBeenCalledTimes(1)
    const [endEvent, endInfo] = onDragEnd.mock.calls[0] as [PointerEvent, PanInfo]
    expect(endEvent.type).toBe('pointerup')
    expect(endInfo.offset).toEqual({ x: 32, y: 8 })
    expect(endInfo.velocity.x).toBeCloseTo(1000, 5)
  })

  it('measures velocity over the last ~100ms only and reports 0 after a pause', () => {
    startClock()
    const onDragEnd = vi.fn()
    render(<Animated.div data-testid="el" drag="x" onDragEnd={onDragEnd} />)
    const el = screen.getByTestId('el')

    down(el, 0, 0)
    advance(16)
    move(100, 0) // fast at first...
    advance(150)
    move(110, 0) // ...then slow: only the last 100ms count
    advance(50)
    move(120, 0)
    up(120, 0)
    const [, info] = onDragEnd.mock.calls[0] as [PointerEvent, PanInfo]
    // 10px over the 50ms since the previous sample (the fast one is stale)
    expect(info.velocity.x).toBeCloseTo(200, 5)

    // Holding still before releasing: no velocity, no momentum
    onDragEnd.mockClear()
    down(el, 0, 0)
    advance(16)
    move(40, 0)
    advance(200)
    up(40, 0)
    expect((onDragEnd.mock.calls[0] as [PointerEvent, PanInfo])[1].velocity).toEqual({ x: 0, y: 0 })
    const before = offsetOf(el).x
    runAll()
    expect(offsetOf(el).x).toBe(before)
  })

  it('ignores moves of other pointers', () => {
    startClock()
    const onDrag = vi.fn()
    render(<Animated.div data-testid="el" drag onDrag={onDrag} />)
    down(screen.getByTestId('el'), 0, 0)
    move(50, 50, 2)
    expect(onDrag).not.toHaveBeenCalled()
    expect(screen.getByTestId('el').style.transform).toBe('')
  })

  it('locks to the first axis that moves with dragDirectionLock', () => {
    startClock()
    const onDirectionLock = vi.fn()
    render(
      <Animated.div data-testid="el" drag dragDirectionLock onDirectionLock={onDirectionLock} dragMomentum={false} />
    )
    const el = screen.getByTestId('el')

    down(el, 0, 0)
    move(2, 1) // below the threshold: nothing moves yet
    expect(onDirectionLock).not.toHaveBeenCalled()
    expect(el.style.transform).toBe('')

    move(3, 12)
    expect(onDirectionLock).toHaveBeenCalledWith('y')
    expect(offsetOf(el)).toEqual({ x: 0, y: 12 })

    move(80, 20)
    expect(offsetOf(el)).toEqual({ x: 0, y: 20 })
    expect(onDirectionLock).toHaveBeenCalledTimes(1)
    up(80, 20)

    // A new drag locks again
    down(el, 0, 0)
    move(-10, 1)
    expect(onDirectionLock).toHaveBeenLastCalledWith('x')
    expect(offsetOf(el)).toEqual({ x: -10, y: 20 })
  })

  it('keeps the drag start on pointerdown in sync with dragControls.isDragging()', () => {
    let controls: ReturnType<typeof useDragControls> | null = null
    function Card() {
      controls = useDragControls()
      return <Animated.div data-testid="el" drag dragControls={controls} />
    }
    render(<Card />)
    down(screen.getByTestId('el'), 0, 0)
    expect(controls!.isDragging()).toBe(true)
    up(0, 0)
    expect(controls!.isDragging()).toBe(false)
  })
})

describe('Animated dragConstraints / dragElastic', () => {
  it('clamps to box constraints without elasticity', () => {
    startClock()
    render(
      <Animated.div
        data-testid="el"
        drag
        dragConstraints={{ left: -50, right: 100, top: 0, bottom: 40 }}
        dragElastic={0}
        dragMomentum={false}
      />
    )
    const el = screen.getByTestId('el')
    down(el, 0, 0)
    move(300, -30)
    expect(offsetOf(el)).toEqual({ x: 100, y: 0 })
    move(-200, 90)
    expect(offsetOf(el)).toEqual({ x: -50, y: 40 })
    move(20, 10)
    expect(offsetOf(el)).toEqual({ x: 20, y: 10 })
  })

  it('lets the element be pulled beyond the constraints with dragElastic (default 0.5)', () => {
    startClock()
    const { rerender } = render(
      <Animated.div data-testid="el" drag="x" dragConstraints={{ left: 0, right: 100 }} dragMomentum={false} />
    )
    const el = screen.getByTestId('el')
    down(el, 0, 0)
    move(140, 0)
    expect(offsetOf(el).x).toBe(120) // 100 + 40 * 0.5
    move(-40, 0)
    expect(offsetOf(el).x).toBe(-20)
    up(-40, 0)
    runAll()
    expect(offsetOf(el).x).toBe(0)

    // Per-side elasticity
    rerender(
      <Animated.div
        data-testid="el"
        drag="x"
        dragConstraints={{ left: 0, right: 100 }}
        dragElastic={{ left: 0, right: 0.2 }}
        dragMomentum={false}
      />
    )
    down(el, 0, 0)
    move(150, 0)
    expect(offsetOf(el).x).toBe(110)
    move(-30, 0)
    expect(offsetOf(el).x).toBe(0)
  })

  it('springs back to the boundary when released outside the constraints', () => {
    startClock()
    render(
      <Animated.div data-testid="el" drag="x" dragConstraints={{ left: 0, right: 100 }} dragMomentum={false} />
    )
    const el = screen.getByTestId('el')
    down(el, 0, 0)
    advance(16)
    move(200, 0) // pulled to 150
    advance(200) // hold still: no release velocity
    up(200, 0)
    expect(offsetOf(el).x).toBe(150)
    advance(100)
    const mid = offsetOf(el).x
    expect(mid).toBeLessThan(150)
    expect(mid).toBeGreaterThan(100)
    runAll()
    expect(offsetOf(el).x).toBe(100)
  })

  it('constrains the element inside a container ref', () => {
    startClock()
    function Box() {
      const container = React.useRef<HTMLDivElement>(null)
      return (
        <div data-testid="container" ref={container}>
          <Animated.div data-testid="el" drag dragConstraints={container} dragElastic={0} dragMomentum={false} />
        </div>
      )
    }
    render(<Box />)
    mockRect(screen.getByTestId('container'), { left: 0, top: 0, width: 300, height: 200 })
    const el = screen.getByTestId('el')
    mockRect(el, { left: 50, top: 50, width: 100, height: 50 })

    down(el, 0, 0)
    move(1000, 1000)
    // The element's right / bottom edges stop at the container's
    expect(offsetOf(el)).toEqual({ x: 150, y: 100 })
    move(-1000, -1000)
    expect(offsetOf(el)).toEqual({ x: -50, y: -50 })
  })

  it('accounts for the current offset when measuring a container ref on a later drag', () => {
    startClock()
    function Box() {
      const container = React.useRef<HTMLDivElement>(null)
      return (
        <div data-testid="container" ref={container}>
          <Animated.div data-testid="el" drag="x" dragConstraints={container} dragElastic={0} dragMomentum={false} />
        </div>
      )
    }
    render(<Box />)
    mockRect(screen.getByTestId('container'), { left: 0, top: 0, width: 300, height: 200 })
    const el = screen.getByTestId('el')
    mockRect(el, { left: 50, top: 0, width: 100, height: 50 })
    down(el, 0, 0)
    move(30, 0)
    up(30, 0)
    expect(offsetOf(el).x).toBe(30)

    // The measured box now includes the 30px offset
    mockRect(el, { left: 80, top: 0, width: 100, height: 50 })
    down(el, 0, 0)
    move(1000, 0)
    expect(offsetOf(el).x).toBe(150)
  })
})

describe('Animated drag release', () => {
  it('continues with momentum (decay) after release by default', () => {
    startClock()
    render(<Animated.div data-testid="el" drag="x" />)
    const el = screen.getByTestId('el')
    fling(el, 32) // 1000 px/s
    expect(offsetOf(el).x).toBe(32)

    advance(100)
    const mid = offsetOf(el).x
    expect(mid).toBeGreaterThan(32)
    runAll()
    const rest = offsetOf(el).x
    expect(rest).toBeGreaterThan(mid)
    expect(rest).toBeCloseTo(decayRest(32, 1000), 0)
  })

  it('tunes momentum with dragTransition.deceleration and modifyTarget', () => {
    startClock()
    const { rerender } = render(
      <Animated.div data-testid="el" drag="x" dragTransition={{ deceleration: 0.99 }} />
    )
    const el = screen.getByTestId('el')
    fling(el, 32)
    runAll()
    expect(offsetOf(el).x).toBeCloseTo(decayRest(32, 1000, 0.99), 0)

    rerender(
      <Animated.div
        data-testid="el"
        drag="x"
        dragTransition={{ modifyTarget: (target) => Math.round(target / 100) * 100 }}
      />
    )
    const from = offsetOf(el).x
    fling(el, 32)
    runAll()
    expect(offsetOf(el).x).toBe(Math.round(decayRest(from + 32, 1000) / 100) * 100)
  })

  it('does not continue after release with dragMomentum={false}', () => {
    startClock()
    render(<Animated.div data-testid="el" drag="x" dragMomentum={false} />)
    const el = screen.getByTestId('el')
    fling(el, 32)
    runAll()
    expect(offsetOf(el).x).toBe(32)
    expect(clock!.pendingFrames).toBe(0)
  })

  it('stops momentum at a boundary without elasticity', () => {
    startClock()
    render(<Animated.div data-testid="el" drag="x" dragConstraints={{ left: 0, right: 100 }} dragElastic={0} />)
    const el = screen.getByTestId('el')
    fling(el, 32)
    let max = 0
    for (let i = 0; i < 100 && clock!.pendingFrames > 0; i++) {
      advance(16)
      max = Math.max(max, offsetOf(el).x)
    }
    expect(max).toBe(100)
    expect(offsetOf(el).x).toBe(100)
  })

  it('bounces off a boundary with elasticity and settles on it', () => {
    startClock()
    render(<Animated.div data-testid="el" drag="x" dragConstraints={{ left: 0, right: 100 }} dragElastic={0.5} />)
    const el = screen.getByTestId('el')
    fling(el, 32)
    let max = 0
    for (let i = 0; i < 300 && clock!.pendingFrames > 0; i++) {
      advance(16)
      max = Math.max(max, offsetOf(el).x)
    }
    expect(max).toBeGreaterThan(100) // overshoots...
    expect(offsetOf(el).x).toBe(100) // ...and springs back onto the boundary
  })

  it('springs back to the origin with dragSnapToOrigin', () => {
    startClock()
    render(<Animated.div data-testid="el" drag dragSnapToOrigin />)
    const el = screen.getByTestId('el')
    fling(el, 60, 2, 30)
    expect(offsetOf(el)).toEqual({ x: 60, y: 30 })
    advance(50)
    const mid = offsetOf(el)
    expect(Math.abs(mid.x)).toBeLessThan(60 + 40) // moving, not flying off with momentum
    runAll()
    expect(el.style.transform).toBe('')
  })

  it('jumps to the final position with MotionConfig reducedMotion="always"', () => {
    startClock()
    render(
      <MotionConfig reducedMotion="always">
        <Animated.div data-testid="el" drag="x" />
        <Animated.div data-testid="bounded" drag="x" dragConstraints={{ left: 0, right: 100 }} />
        <Animated.div data-testid="snap" drag="x" dragSnapToOrigin />
      </MotionConfig>
    )
    const el = screen.getByTestId('el')
    fling(el, 32)
    expect(offsetOf(el).x).toBeCloseTo(decayRest(32, 1000), 5)
    expect(clock!.pendingFrames).toBe(0)

    const bounded = screen.getByTestId('bounded')
    fling(bounded, 32)
    expect(offsetOf(bounded).x).toBe(100)

    const snap = screen.getByTestId('snap')
    fling(snap, 32)
    expect(snap.style.transform).toBe('')
    expect(clock!.pendingFrames).toBe(0)
  })

  it('respects the OS reduced motion setting', () => {
    startClock()
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
    try {
      render(<Animated.div data-testid="el" drag="x" />)
      const el = screen.getByTestId('el')
      fling(el, 32)
      expect(offsetOf(el).x).toBeCloseTo(decayRest(32, 1000), 5)
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('animates back inside the constraints on pointercancel, without momentum', () => {
    startClock()
    const onDragEnd = vi.fn()
    render(
      <Animated.div data-testid="el" drag="x" dragConstraints={{ left: 0, right: 100 }} onDragEnd={onDragEnd} />
    )
    const el = screen.getByTestId('el')
    down(el, 0, 0)
    advance(16)
    move(50, 0)
    pointer('pointercancel', 50, 0)
    expect(onDragEnd).toHaveBeenCalledTimes(1)
    expect((onDragEnd.mock.calls[0] as [PointerEvent, PanInfo])[1].velocity).toEqual({ x: 0, y: 0 })
    runAll()
    expect(offsetOf(el).x).toBe(50)
  })
})

describe('Animated drag cleanup', () => {
  it('stops momentum when a new drag starts and continues from the current position', () => {
    startClock()
    render(<Animated.div data-testid="el" drag="x" />)
    const el = screen.getByTestId('el')
    fling(el, 32)
    advance(100)
    const current = offsetOf(el).x
    down(el, 0, 0)
    advance(100)
    expect(offsetOf(el).x).toBe(current)
    move(10, 0)
    expect(offsetOf(el).x).toBe(current + 10)
  })

  it('dragControls.stop() ends a drag and stops momentum / springs', () => {
    startClock()
    let controls: ReturnType<typeof useDragControls> | null = null
    const onDragEnd = vi.fn()
    function Card() {
      controls = useDragControls()
      return (
        <Animated.div
          data-testid="el"
          drag="x"
          dragControls={controls}
          dragConstraints={{ left: 0, right: 100 }}
          onDragEnd={onDragEnd}
        />
      )
    }
    render(<Card />)
    const el = screen.getByTestId('el')

    // Mid-drag beyond a boundary: ends the drag and jumps inside the constraints
    down(el, 0, 0)
    advance(16)
    move(200, 0)
    expect(offsetOf(el).x).toBe(150)
    act(() => controls!.stop())
    expect(onDragEnd).toHaveBeenCalledTimes(1)
    expect(offsetOf(el).x).toBe(100)
    expect(controls!.isDragging()).toBe(false)
    expect(clock!.pendingFrames).toBe(0)
    move(0, 0)
    expect(offsetOf(el).x).toBe(100)

    // During momentum: stops where it is (moved back inside the constraints
    // if it overshot them)
    down(el, 0, 0)
    advance(16)
    move(-10, 0)
    advance(16)
    move(-20, 0)
    up(-20, 0)
    advance(50)
    const current = offsetOf(el).x
    expect(current).toBeLessThan(80)
    act(() => controls!.stop())
    expect(clock!.pendingFrames).toBe(0)
    runAll()
    expect(offsetOf(el).x).toBe(Math.min(Math.max(current, 0), 100))
  })

  it('stops listeners and animations when drag is disabled', () => {
    startClock()
    const onDrag = vi.fn()
    const { rerender } = render(<Animated.div data-testid="el" drag="x" onDrag={onDrag} />)
    const el = screen.getByTestId('el')
    down(el, 0, 0)
    rerender(<Animated.div data-testid="el" drag={false} onDrag={onDrag} />)
    move(50, 0)
    expect(onDrag).not.toHaveBeenCalled()

    rerender(<Animated.div data-testid="el" drag="x" onDrag={onDrag} />)
    fling(el, 32)
    advance(50)
    const current = offsetOf(el).x
    rerender(<Animated.div data-testid="el" drag={false} onDrag={onDrag} />)
    runAll()
    expect(offsetOf(el).x).toBe(current)
  })

  it('cleans up window listeners and release animations on unmount', () => {
    startClock()
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const onDragEnd = vi.fn()
    const { unmount } = render(<Animated.div data-testid="el" drag="x" onDragEnd={onDragEnd} />)
    const el = screen.getByTestId('el')

    fling(el, 32)
    advance(50)
    down(el, 0, 0)
    advance(16)
    move(40, 0)
    unmount()

    for (const type of ['pointermove', 'pointerup', 'pointercancel']) {
      expect(removeSpy.mock.calls.some(([t]) => t === type)).toBe(true)
    }
    up(40, 0)
    expect(onDragEnd).toHaveBeenCalledTimes(1) // only the first fling
    runAll()
    expect(clock!.pendingFrames).toBe(0)
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('unmounting during momentum stops the animation', () => {
    startClock()
    const { unmount } = render(<Animated.div data-testid="el" drag="x" />)
    fling(screen.getByTestId('el'), 32)
    advance(50)
    expect(clock!.pendingFrames).toBeGreaterThan(0)
    unmount()
    advance(16)
    expect(clock!.pendingFrames).toBe(0)
  })

  it('works in StrictMode', () => {
    startClock()
    let controls: ReturnType<typeof useDragControls> | null = null
    const onDragEnd = vi.fn()
    function Card() {
      controls = useDragControls()
      return (
        <Animated.div
          data-testid="el"
          drag="x"
          dragControls={controls}
          dragConstraints={{ left: 0, right: 100 }}
          onDragEnd={onDragEnd}
        />
      )
    }
    const { unmount } = render(
      <React.StrictMode>
        <Card />
      </React.StrictMode>
    )
    const el = screen.getByTestId('el')
    fling(el, 32)
    runAll()
    expect(offsetOf(el).x).toBe(100)
    expect(onDragEnd).toHaveBeenCalledTimes(1)

    // dragControls still drive the element after the StrictMode effect re-run
    act(() => controls!.start(new PointerEvent('pointerdown', { clientX: 0, clientY: 0, pointerId: 1 })))
    move(-30, 0)
    expect(offsetOf(el).x).toBe(70)
    unmount()
  })
})
