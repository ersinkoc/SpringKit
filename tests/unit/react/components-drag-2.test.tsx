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
  vi.unstubAllGlobals()
})

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

/** Drag by dx (and dy) in `steps` moves of 16ms and release */
function fling(el: HTMLElement, dx: number, steps = 2, dy = 0) {
  down(el, 0, 0)
  for (let i = 1; i <= steps; i++) {
    advance(16)
    move((dx * i) / steps, (dy * i) / steps)
  }
  up(dx, dy)
}

/** Drag to (x, y), hold still (no release velocity) and release */
function dragTo(el: HTMLElement, x: number, y = 0) {
  down(el, 0, 0)
  advance(16)
  move(x, y)
  advance(200)
  up(x, y)
}

type Controls = ReturnType<typeof useDragControls>

describe('Animated dragThreshold', () => {
  it('a click on a draggable element is a tap, not a drag', () => {
    startClock()
    const onDragStart = vi.fn()
    const onDrag = vi.fn()
    const onDragEnd = vi.fn()
    const onDragTransitionEnd = vi.fn()
    const onTap = vi.fn()
    const onTapCancel = vi.fn()
    render(
      <Animated.div
        data-testid="el"
        drag
        whileDrag={{ cursor: 'grabbing' }}
        onDragStart={onDragStart}
        onDrag={onDrag}
        onDragEnd={onDragEnd}
        onDragTransitionEnd={onDragTransitionEnd}
        onTap={onTap}
        onTapCancel={onTapCancel}
      />
    )
    const el = screen.getByTestId('el')

    down(el, 10, 10)
    move(11, 12) // below 3px
    expect(el.style.cursor).toBe('')
    expect(el.style.transform).toBe('')
    fireEvent.pointerUp(el, { clientX: 11, clientY: 12, pointerId: 1 })

    expect(onDragStart).not.toHaveBeenCalled()
    expect(onDrag).not.toHaveBeenCalled()
    expect(onDragEnd).not.toHaveBeenCalled()
    expect(onDragTransitionEnd).not.toHaveBeenCalled()
    expect(onTap).toHaveBeenCalledTimes(1)
    expect(onTapCancel).not.toHaveBeenCalled()
    expect(el.style.transform).toBe('')
  })

  it('starts the drag once the pointer moved 3px, following the pointer from pointerdown', () => {
    startClock()
    const onDragStart = vi.fn()
    render(<Animated.div data-testid="el" drag dragMomentum={false} onDragStart={onDragStart} />)
    const el = screen.getByTestId('el')
    down(el, 0, 0)
    move(2, 2) // 2.83px
    expect(onDragStart).not.toHaveBeenCalled()
    expect(el.style.transform).toBe('')
    move(2, 3) // 3.6px
    expect(onDragStart).toHaveBeenCalledTimes(1)
    // No jump: the offset is measured from the pointerdown point
    expect(offsetOf(el)).toEqual({ x: 2, y: 3 })
  })

  it('accepts a custom dragThreshold, and 0 starts the drag on pointerdown', () => {
    startClock()
    const onDragStart = vi.fn()
    const { rerender } = render(
      <Animated.div data-testid="el" drag="x" dragThreshold={10} onDragStart={onDragStart} />
    )
    const el = screen.getByTestId('el')
    down(el, 0, 0)
    move(9, 0)
    expect(onDragStart).not.toHaveBeenCalled()
    move(10, 0)
    expect(onDragStart).toHaveBeenCalledTimes(1)
    up(10, 0)

    onDragStart.mockClear()
    rerender(
      <Animated.div data-testid="el" drag="x" dragThreshold={0} whileDrag={{ cursor: 'grabbing' }} onDragStart={onDragStart} />
    )
    down(el, 5, 6)
    expect(onDragStart).toHaveBeenCalledTimes(1)
    const [event, info] = onDragStart.mock.calls[0] as [PointerEvent, PanInfo]
    expect(event.type).toBe('pointerdown')
    expect(info).toEqual({
      point: { x: 5, y: 6 },
      delta: { x: 0, y: 0 },
      offset: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
    })
    expect(el.style.cursor).toBe('grabbing')
  })

  it('a press that turns into a drag reports onTapCancel instead of onTap; whileTap still works', () => {
    startClock()
    const onTap = vi.fn()
    const onTapCancel = vi.fn()
    const onDragEnd = vi.fn()
    render(
      <Animated.div
        data-testid="el"
        drag="x"
        dragMomentum={false}
        whileTap={{ outline: 'auto' }}
        onTap={onTap}
        onTapCancel={onTapCancel}
        onDragEnd={onDragEnd}
      />
    )
    const el = screen.getByTestId('el')
    down(el, 0, 0)
    expect(el.style.outline).toBe('auto')
    move(40, 0)
    fireEvent.pointerUp(el, { clientX: 40, clientY: 0, pointerId: 1 })
    expect(onDragEnd).toHaveBeenCalledTimes(1)
    expect(onTap).not.toHaveBeenCalled()
    expect(onTapCancel).toHaveBeenCalledTimes(1)

    // The next plain click is a tap again
    down(el, 0, 0)
    fireEvent.pointerUp(el, { clientX: 0, clientY: 0, pointerId: 1 })
    expect(onTap).toHaveBeenCalledTimes(1)
  })

  it('a click during momentum stops it without drag callbacks', () => {
    startClock()
    const onDragEnd = vi.fn()
    render(<Animated.div data-testid="el" drag="x" onDragEnd={onDragEnd} />)
    const el = screen.getByTestId('el')
    fling(el, 32)
    advance(50)
    const current = offsetOf(el).x
    down(el, 0, 0)
    up(0, 0)
    runAll()
    expect(onDragEnd).toHaveBeenCalledTimes(1) // the fling only
    expect(offsetOf(el).x).toBe(current)
  })

  it('a click while outside the constraints (interrupted bounce) springs back inside', () => {
    startClock()
    render(<Animated.div data-testid="el" drag="x" dragConstraints={{ left: 0, right: 100 }} />)
    const el = screen.getByTestId('el')
    dragTo(el, 200) // pulled to 150, springing back to 100
    advance(32)
    expect(offsetOf(el).x).toBeGreaterThan(100)
    down(el, 0, 0)
    up(0, 0)
    runAll()
    expect(offsetOf(el).x).toBe(100)
  })
})

describe('Animated onDragTransitionEnd', () => {
  it('fires once when the momentum settles', () => {
    startClock()
    const onDragTransitionEnd = vi.fn()
    render(<Animated.div data-testid="el" drag onDragTransitionEnd={onDragTransitionEnd} />)
    const el = screen.getByTestId('el')
    fling(el, 32, 2, 16)
    expect(onDragTransitionEnd).not.toHaveBeenCalled()
    advance(200)
    expect(onDragTransitionEnd).not.toHaveBeenCalled()
    runAll()
    expect(onDragTransitionEnd).toHaveBeenCalledTimes(1)
    expect(clock!.pendingFrames).toBe(0)
  })

  it('fires right after onDragEnd when there is nothing to animate', () => {
    startClock()
    const calls: string[] = []
    render(
      <Animated.div
        data-testid="el"
        drag
        dragMomentum={false}
        onDragEnd={() => calls.push('end')}
        onDragTransitionEnd={() => calls.push('transitionEnd')}
      />
    )
    fling(screen.getByTestId('el'), 32)
    expect(calls).toEqual(['end', 'transitionEnd'])
  })

  it('fires after bouncing off a boundary (momentum handing over to the spring)', () => {
    startClock()
    const onDragTransitionEnd = vi.fn()
    render(
      <Animated.div
        data-testid="el"
        drag="x"
        dragConstraints={{ left: 0, right: 100 }}
        onDragTransitionEnd={onDragTransitionEnd}
      />
    )
    const el = screen.getByTestId('el')
    fling(el, 32)
    let max = 0
    for (let i = 0; i < 300 && clock!.pendingFrames > 0; i++) {
      advance(16)
      max = Math.max(max, offsetOf(el).x)
      if (clock!.pendingFrames > 0) expect(onDragTransitionEnd).not.toHaveBeenCalled()
    }
    expect(max).toBeGreaterThan(100)
    expect(offsetOf(el).x).toBe(100)
    expect(onDragTransitionEnd).toHaveBeenCalledTimes(1)
  })

  it('fires after the snap back to the origin', () => {
    startClock()
    const onDragTransitionEnd = vi.fn()
    render(<Animated.div data-testid="el" drag dragSnapToOrigin onDragTransitionEnd={onDragTransitionEnd} />)
    const el = screen.getByTestId('el')
    fling(el, 60, 2, 30)
    advance(50)
    expect(onDragTransitionEnd).not.toHaveBeenCalled()
    runAll()
    expect(el.style.transform).toBe('')
    expect(onDragTransitionEnd).toHaveBeenCalledTimes(1)
  })

  it('fires immediately with reduced motion', () => {
    startClock()
    const onDragTransitionEnd = vi.fn()
    render(
      <MotionConfig reducedMotion="always">
        <Animated.div data-testid="el" drag="x" onDragTransitionEnd={onDragTransitionEnd} />
      </MotionConfig>
    )
    fling(screen.getByTestId('el'), 32)
    expect(onDragTransitionEnd).toHaveBeenCalledTimes(1)
  })

  it('does not fire when a new drag interrupts the release animation', () => {
    startClock()
    const onDragTransitionEnd = vi.fn()
    render(<Animated.div data-testid="el" drag="x" onDragTransitionEnd={onDragTransitionEnd} />)
    const el = screen.getByTestId('el')
    fling(el, 32)
    advance(50)
    // A click interrupts the momentum: no transition end for it
    down(el, 0, 0)
    up(0, 0)
    runAll()
    expect(onDragTransitionEnd).not.toHaveBeenCalled()

    // A second fling interrupted by a third: only the third one reports
    fling(el, 32)
    advance(50)
    fling(el, 32)
    runAll()
    expect(onDragTransitionEnd).toHaveBeenCalledTimes(1)
  })

  it('does not fire when dragControls.stop() / cancel() interrupt the release, or on unmount', () => {
    startClock()
    let controls: Controls | null = null
    const onDragTransitionEnd = vi.fn()
    function Card() {
      controls = useDragControls()
      return (
        <Animated.div data-testid="el" drag="x" dragControls={controls} onDragTransitionEnd={onDragTransitionEnd} />
      )
    }
    const { unmount } = render(<Card />)
    const el = screen.getByTestId('el')

    fling(el, 32)
    advance(50)
    act(() => controls!.stop())
    runAll()
    fling(el, 32)
    advance(50)
    act(() => controls!.cancel())
    runAll()
    fling(el, 32)
    advance(50)
    unmount()
    runAll()
    expect(onDragTransitionEnd).not.toHaveBeenCalled()
  })

  it('fires once when dragControls.stop() ends an active drag (nothing left to animate)', () => {
    startClock()
    let controls: Controls | null = null
    const calls: string[] = []
    function Card() {
      controls = useDragControls()
      return (
        <Animated.div
          data-testid="el"
          drag="x"
          dragControls={controls}
          onDragEnd={() => calls.push('end')}
          onDragTransitionEnd={() => calls.push('transitionEnd')}
        />
      )
    }
    render(<Card />)
    const el = screen.getByTestId('el')
    down(el, 0, 0)
    advance(16)
    move(30, 0)
    act(() => controls!.stop())
    runAll()
    expect(calls).toEqual(['end', 'transitionEnd'])
  })
})

describe('dragControls.cancel()', () => {
  function setup(props: Partial<React.ComponentProps<typeof Animated.div>> = {}) {
    let controls: Controls | null = null
    const onDragEnd = vi.fn()
    const onDragTransitionEnd = vi.fn()
    function Card() {
      controls = useDragControls()
      return (
        <Animated.div
          data-testid="el"
          drag="x"
          dragControls={controls}
          dragConstraints={{ left: 0, right: 100 }}
          onDragEnd={onDragEnd}
          onDragTransitionEnd={onDragTransitionEnd}
          {...props}
        />
      )
    }
    render(<Card />)
    return { el: screen.getByTestId('el'), controls: () => controls!, onDragEnd, onDragTransitionEnd }
  }

  it('ends the drag without momentum and reports zero velocity', () => {
    startClock()
    const { el, controls, onDragEnd, onDragTransitionEnd } = setup()
    down(el, 0, 0)
    advance(16)
    move(25, 0)
    advance(16)
    move(50, 0) // moving fast
    act(() => controls().cancel())
    expect(controls().isDragging()).toBe(false)
    expect(onDragEnd).toHaveBeenCalledTimes(1)
    const [event, info] = onDragEnd.mock.calls[0] as [PointerEvent, PanInfo]
    expect(event.type).toBe('pointermove') // the last event of the gesture
    expect(info.velocity).toEqual({ x: 0, y: 0 })
    expect(info.offset).toEqual({ x: 50, y: 0 })
    runAll()
    expect(offsetOf(el).x).toBe(50) // no momentum
    expect(onDragTransitionEnd).toHaveBeenCalledTimes(1)

    // Pointer events of the cancelled gesture are ignored
    move(90, 0)
    up(90, 0)
    expect(offsetOf(el).x).toBe(50)
    expect(onDragEnd).toHaveBeenCalledTimes(1)
  })

  it('animates back inside the constraints', () => {
    startClock()
    const { el, controls, onDragTransitionEnd } = setup()
    down(el, 0, 0)
    advance(16)
    move(200, 0)
    expect(offsetOf(el).x).toBe(150)
    act(() => controls().cancel())
    expect(offsetOf(el).x).toBe(150) // animates, unlike stop()
    advance(50)
    expect(offsetOf(el).x).toBeLessThan(150)
    expect(onDragTransitionEnd).not.toHaveBeenCalled()
    runAll()
    expect(offsetOf(el).x).toBe(100)
    expect(onDragTransitionEnd).toHaveBeenCalledTimes(1)
  })

  it('while idle, stops momentum where it is without callbacks', () => {
    startClock()
    const { el, controls, onDragEnd } = setup({ dragConstraints: undefined })
    fling(el, 32)
    advance(50)
    const current = offsetOf(el).x
    act(() => controls().cancel())
    runAll()
    expect(offsetOf(el).x).toBe(current)
    expect(onDragEnd).toHaveBeenCalledTimes(1) // the fling only
  })

  it('cancels a pending press (below the threshold) without callbacks', () => {
    startClock()
    const { el, controls, onDragEnd } = setup()
    down(el, 0, 0)
    act(() => controls().cancel())
    move(50, 0)
    expect(el.style.transform).toBe('')
    expect(onDragEnd).not.toHaveBeenCalled()
  })
})

describe('dragControls with several elements', () => {
  it('drives every element and survives one of them unmounting', () => {
    startClock()
    let controls: Controls | null = null
    function List({ showFirst }: { showFirst: boolean }) {
      controls = useDragControls()
      return (
        <>
          {showFirst && <Animated.div data-testid="a" drag="x" dragControls={controls} dragListener={false} />}
          <Animated.div data-testid="b" drag="x" dragControls={controls} dragListener={false} />
        </>
      )
    }
    const { rerender } = render(<List showFirst />)
    act(() => controls!.start(new PointerEvent('pointerdown', { clientX: 0, clientY: 0, pointerId: 1 })))
    move(20, 0)
    expect(offsetOf(screen.getByTestId('a')).x).toBe(20)
    expect(offsetOf(screen.getByTestId('b')).x).toBe(20)
    up(20, 0)

    rerender(<List showFirst={false} />)
    act(() => controls!.start(new PointerEvent('pointerdown', { clientX: 0, clientY: 0, pointerId: 1 })))
    move(10, 0)
    expect(offsetOf(screen.getByTestId('b')).x).toBe(30)
  })
})

describe('Animated drag pointer capture', () => {
  it('captures the pointer on the element when the drag starts and releases it on end', () => {
    startClock()
    const setSpy = vi.spyOn(HTMLElement.prototype, 'setPointerCapture')
    render(<Animated.div data-testid="el" drag dragMomentum={false} />)
    const el = screen.getByTestId('el')
    down(el, 0, 0)
    expect(setSpy).not.toHaveBeenCalled() // a click doesn't capture
    move(10, 0)
    expect(setSpy).toHaveBeenCalledWith(1)
    expect(el.hasPointerCapture(1)).toBe(true)
    up(10, 0)
    expect(el.hasPointerCapture(1)).toBe(false)
  })

  it('captures on the handle with dragControls + dragListener={false}', () => {
    startClock()
    const onHandleUp = vi.fn()
    function Card() {
      const controls = useDragControls()
      return (
        <>
          <div data-testid="handle" onPointerDown={(e) => controls.start(e)} onPointerUp={onHandleUp} />
          <Animated.div data-testid="card" drag dragControls={controls} dragListener={false} dragMomentum={false} />
        </>
      )
    }
    render(<Card />)
    const handle = screen.getByTestId('handle')
    const card = screen.getByTestId('card')
    down(handle, 0, 0)
    move(20, 10)
    expect(handle.hasPointerCapture(1)).toBe(true)
    expect(card.hasPointerCapture(1)).toBe(false)
    expect(offsetOf(card)).toEqual({ x: 20, y: 10 })
    // The handle keeps receiving its own events
    fireEvent.pointerUp(handle, { clientX: 20, clientY: 10, pointerId: 1 })
    expect(onHandleUp).toHaveBeenCalledTimes(1)
    expect(handle.hasPointerCapture(1)).toBe(false)
    move(80, 80)
    expect(offsetOf(card)).toEqual({ x: 20, y: 10 })
  })

  it('starts a single gesture when a dragControls handle sits inside the draggable element', () => {
    startClock()
    const onDragStart = vi.fn()
    function Card() {
      const controls = useDragControls()
      return (
        <Animated.div data-testid="card" drag dragControls={controls} onDragStart={onDragStart}>
          <div data-testid="handle" onPointerDown={(e) => controls.start(e)} />
        </Animated.div>
      )
    }
    render(<Card />)
    const handle = screen.getByTestId('handle')
    down(handle, 0, 0)
    move(20, 0)
    expect(onDragStart).toHaveBeenCalledTimes(1)
    // The controls' gesture (capturing on the handle) was kept
    expect(handle.hasPointerCapture(1)).toBe(true)
    expect(screen.getByTestId('card').hasPointerCapture(1)).toBe(false)
  })

  it('releases the capture on cancel and unmount', () => {
    startClock()
    let controls: Controls | null = null
    function Card() {
      controls = useDragControls()
      return <Animated.div data-testid="el" drag dragControls={controls} />
    }
    const { unmount } = render(<Card />)
    const el = screen.getByTestId('el')
    down(el, 0, 0)
    move(10, 0)
    expect(el.hasPointerCapture(1)).toBe(true)
    act(() => controls!.cancel())
    expect(el.hasPointerCapture(1)).toBe(false)

    down(el, 0, 0)
    move(10, 0)
    expect(el.hasPointerCapture(1)).toBe(true)
    unmount()
    expect(el.hasPointerCapture(1)).toBe(false)
  })

  it('keeps dragging through the window listeners when capture fails', () => {
    startClock()
    vi.spyOn(HTMLElement.prototype, 'setPointerCapture').mockImplementation(() => {
      throw new DOMException('No active pointer', 'NotFoundError')
    })
    const onDragEnd = vi.fn()
    render(<Animated.div data-testid="el" drag dragMomentum={false} onDragEnd={onDragEnd} />)
    const el = screen.getByTestId('el')
    down(el, 0, 0)
    move(10, 5)
    move(30, 5)
    expect(offsetOf(el)).toEqual({ x: 30, y: 5 })
    up(30, 5)
    expect(onDragEnd).toHaveBeenCalledTimes(1)
  })

  it('ends the drag even if a child stops the pointerup propagation', () => {
    startClock()
    const onDragEnd = vi.fn()
    render(
      <Animated.div data-testid="el" drag dragMomentum={false} onDragEnd={onDragEnd}>
        <span data-testid="child" onPointerUp={(e) => e.stopPropagation()} />
      </Animated.div>
    )
    const child = screen.getByTestId('child')
    down(child, 0, 0)
    move(10, 0)
    fireEvent.pointerUp(child, { clientX: 10, clientY: 0, pointerId: 1 })
    expect(onDragEnd).toHaveBeenCalledTimes(1)
    move(50, 0)
    expect(offsetOf(screen.getByTestId('el')).x).toBe(10)
  })
})

describe('Animated ref dragConstraints re-measuring', () => {
  function Box() {
    const container = React.useRef<HTMLDivElement>(null)
    return (
      <div data-testid="container" ref={container}>
        <Animated.div data-testid="el" drag="x" dragConstraints={container} dragElastic={0} dragMomentum={false} />
      </div>
    )
  }

  /** Render, drag the element to the container's right edge (offset 150) */
  function setupAtRightEdge() {
    render(<Box />)
    const container = screen.getByTestId('container')
    const el = screen.getByTestId('el')
    mockRect(container, { left: 0, top: 0, width: 300, height: 200 })
    mockRect(el, { left: 50, top: 0, width: 100, height: 50 })
    dragTo(el, 1000)
    expect(offsetOf(el).x).toBe(150)
    // The measured box includes the drag offset
    mockRect(el, { left: 200, top: 0, width: 100, height: 50 })
    return { container, el }
  }

  it('springs an idle element back inside after the window resizes', () => {
    startClock()
    const { container, el } = setupAtRightEdge()
    mockRect(container, { left: 0, top: 0, width: 200, height: 200 })
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    expect(offsetOf(el).x).toBe(150)
    advance(50)
    expect(offsetOf(el).x).toBeLessThan(150)
    runAll()
    expect(offsetOf(el).x).toBe(50)
  })

  it('jumps back inside with reduced motion, and does nothing while still inside', () => {
    startClock()
    const container = React.createRef<HTMLDivElement>()
    render(
      <MotionConfig reducedMotion="always">
        <div ref={container} data-testid="container">
          <Animated.div data-testid="el" drag="x" dragConstraints={container} dragElastic={0} />
        </div>
      </MotionConfig>
    )
    const el = screen.getByTestId('el')
    mockRect(container.current!, { left: 0, top: 0, width: 300, height: 200 })
    mockRect(el, { left: 50, top: 0, width: 100, height: 50 })
    dragTo(el, 100)
    expect(offsetOf(el).x).toBe(100)
    mockRect(el, { left: 150, top: 0, width: 100, height: 50 })

    // Still fits
    mockRect(container.current!, { left: 0, top: 0, width: 260, height: 200 })
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    expect(offsetOf(el).x).toBe(100)

    mockRect(container.current!, { left: 0, top: 0, width: 200, height: 200 })
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    expect(offsetOf(el).x).toBe(50)
    expect(clock!.pendingFrames).toBe(0)
  })

  it('uses the new constraints from the next move of an active drag', () => {
    startClock()
    const { container, el } = setupAtRightEdge()
    // Back to offset 0 to start fresh
    down(el, 0, 0)
    move(-150, 0)
    expect(offsetOf(el).x).toBe(0)
    mockRect(el, { left: 50, top: 0, width: 100, height: 50 })
    move(-140, 0) // offset 10
    mockRect(el, { left: 60, top: 0, width: 100, height: 50 })
    mockRect(container, { left: 0, top: 0, width: 200, height: 200 })
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    expect(offsetOf(el).x).toBe(10) // not moved while dragging
    move(1000, 0)
    expect(offsetOf(el).x).toBe(50)
  })

  it('observes the container and the element with ResizeObserver, and cleans up', () => {
    startClock()
    const instances: Array<{ callback: () => void; targets: Element[]; disconnect: ReturnType<typeof vi.fn> }> = []
    vi.stubGlobal(
      'ResizeObserver',
      class {
        callback: () => void
        targets: Element[] = []
        disconnect = vi.fn()
        constructor(callback: () => void) {
          this.callback = callback
          instances.push(this)
        }
        observe(target: Element) {
          this.targets.push(target)
        }
        unobserve() {}
      }
    )
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const { container, el } = setupAtRightEdge()
    const observer = instances[instances.length - 1]!
    expect(observer.targets).toEqual([container, el])

    mockRect(container, { left: 0, top: 0, width: 220, height: 200 })
    act(() => observer.callback())
    runAll()
    expect(offsetOf(el).x).toBe(70)

    cleanup()
    expect(observer.disconnect).toHaveBeenCalled()
    expect(removeSpy.mock.calls.some(([type]) => type === 'resize')).toBe(true)
  })

  it('does not observe box constraints', () => {
    startClock()
    const addSpy = vi.spyOn(window, 'addEventListener')
    render(<Animated.div data-testid="el" drag dragConstraints={{ left: 0, right: 10 }} />)
    expect(addSpy.mock.calls.some(([type]) => type === 'resize')).toBe(false)
  })
})
