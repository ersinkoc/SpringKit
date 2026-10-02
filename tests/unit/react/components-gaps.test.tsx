import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, act, cleanup, screen, fireEvent } from '@testing-library/react'
import * as React from 'react'
import { installTestClock, type TestClock } from '@oxog/springkit/testing'
import {
  AnimatePresence,
  Animated,
  MotionConfig,
  Magnetic,
  MouseParallax,
  Parallax,
  TiltCard,
  Trail,
  useDragControls,
  useIsPresent,
  usePresence,
} from '@oxog/springkit/react'

let clock: TestClock | null = null

function startClock(): TestClock {
  clock = installTestClock({ timers: true })
  return clock
}

/** Advance the virtual clock, flushing React updates and microtasks */
async function advance(ms: number) {
  await act(async () => {
    clock!.advance(ms)
  })
}

function mockRect(el: Element, rect: { left: number; top: number; width: number; height: number }) {
  el.getBoundingClientRect = () =>
    ({
      ...rect,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height,
      x: rect.left,
      y: rect.top,
      toJSON() {
        return {}
      },
    }) as DOMRect
}

function mockOffsets(el: HTMLElement, offsets: { top: number; left: number; width: number; height: number }) {
  Object.defineProperty(el, 'offsetTop', { configurable: true, get: () => offsets.top })
  Object.defineProperty(el, 'offsetLeft', { configurable: true, get: () => offsets.left })
  Object.defineProperty(el, 'offsetWidth', { configurable: true, get: () => offsets.width })
  Object.defineProperty(el, 'offsetHeight', { configurable: true, get: () => offsets.height })
}

function parseTranslate(transform: string): { x: number; y: number } {
  const match = /translate\(([-\d.e]+)px, ([-\d.e]+)px\)/.exec(transform)
  return { x: Number(match?.[1] ?? NaN), y: Number(match?.[2] ?? NaN) }
}

function stubReducedMotionQuery(matches: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: matches && query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }))
}

function leaveWindow() {
  act(() => {
    document.documentElement.dispatchEvent(
      new MouseEvent('mouseout', { bubbles: true, relatedTarget: null })
    )
  })
}

afterEach(() => {
  cleanup()
  clock?.uninstall()
  clock = null
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

// ============ 1. AnimatePresence mode="popLayout" ============

describe('AnimatePresence mode="popLayout"', () => {
  const list = (ids: string[], mode: 'sync' | 'popLayout', ref?: React.Ref<HTMLElement>) => (
    <div style={{ position: 'relative' }}>
      <AnimatePresence mode={mode}>
        {ids.map((id) => (
          <Animated.div
            key={id}
            data-testid={id}
            ref={id === 'a' ? ref : undefined}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {id}
          </Animated.div>
        ))}
      </AnimatePresence>
    </div>
  )

  it('pops an exiting child out of the layout at its measured position and size', () => {
    startClock()
    const { rerender } = render(list(['a', 'b'], 'popLayout'))
    const a = screen.getByTestId('a')
    mockOffsets(a, { top: 10, left: 5, width: 100, height: 20 })

    rerender(list(['b'], 'popLayout'))

    // Still mounted (exit animation pending), but out of the flow
    expect(screen.getByTestId('a')).toBe(a)
    expect(a.style.position).toBe('absolute')
    expect(a.style.top).toBe('10px')
    expect(a.style.left).toBe('5px')
    expect(a.style.width).toBe('100px')
    expect(a.style.height).toBe('20px')
    expect(screen.getByTestId('b').style.position).toBe('')
  })

  it('keeps the child in the flow in sync mode', () => {
    startClock()
    const { rerender } = render(list(['a', 'b'], 'sync'))
    const a = screen.getByTestId('a')
    mockOffsets(a, { top: 10, left: 5, width: 100, height: 20 })

    rerender(list(['b'], 'sync'))

    expect(screen.getByTestId('a')).toBe(a)
    expect(a.style.position).toBe('')
  })

  it('restores a popped child that is re-added while exiting and keeps the child ref working', () => {
    startClock()
    const ref = React.createRef<HTMLElement>()
    const { rerender } = render(list(['a', 'b'], 'popLayout', ref))
    const a = screen.getByTestId('a')
    expect(ref.current).toBe(a)
    mockOffsets(a, { top: 10, left: 5, width: 100, height: 20 })

    rerender(list(['b'], 'popLayout', ref))
    expect(a.style.position).toBe('absolute')

    rerender(list(['a', 'b'], 'popLayout', ref))
    expect(screen.getByTestId('a')).toBe(a)
    expect(a.style.position).toBe('')
    expect(a.style.width).toBe('')
    expect(ref.current).toBe(a)
  })

  it('removes the popped child once its exit animation completes', async () => {
    startClock()
    const { rerender } = render(list(['a', 'b'], 'popLayout'))
    rerender(list(['b'], 'popLayout'))
    expect(screen.getByTestId('a')).toBeInTheDocument()

    await advance(3000)
    expect(screen.queryByTestId('a')).toBeNull()
  })
})

// ============ 2. Children that never register an exit animation ============

describe('AnimatePresence children without an exit animation', () => {
  it('removes a plain DOM child immediately instead of after the fallback timeout', () => {
    startClock()
    const onExitComplete = vi.fn()
    const ui = (show: boolean) => (
      <AnimatePresence onExitComplete={onExitComplete}>
        {show ? [<div key="a" data-testid="a" />] : []}
      </AnimatePresence>
    )

    const { rerender } = render(ui(true))
    rerender(ui(false))

    expect(screen.queryByTestId('a')).toBeNull()
    expect(onExitComplete).toHaveBeenCalledTimes(1)
  })

  it('removes a child that only reads useIsPresent immediately', () => {
    startClock()
    function Child() {
      const isPresent = useIsPresent()
      return <div data-testid="a" data-present={String(isPresent)} />
    }
    const ui = (show: boolean) => <AnimatePresence>{show ? [<Child key="a" />] : []}</AnimatePresence>

    const { rerender } = render(ui(true))
    rerender(ui(false))
    expect(screen.queryByTestId('a')).toBeNull()
  })

  it('mode="wait" shows the entering plain child right away', () => {
    startClock()
    const ui = (id: string) => (
      <AnimatePresence mode="wait">
        <div key={id} data-testid={id} />
      </AnimatePresence>
    )
    const { rerender } = render(ui('a'))
    rerender(ui('b'))
    expect(screen.queryByTestId('a')).toBeNull()
    expect(screen.getByTestId('b')).toBeInTheDocument()
  })

  it('still waits for a usePresence child (also under StrictMode)', () => {
    startClock()
    let remove: (() => void) | null = null
    function Child() {
      const [isPresent, safeToRemove] = usePresence()
      remove = safeToRemove
      return <div data-testid="a" data-present={String(isPresent)} />
    }
    const ui = (show: boolean) => (
      <React.StrictMode>
        <AnimatePresence>{show ? [<Child key="a" />] : []}</AnimatePresence>
      </React.StrictMode>
    )

    const { rerender } = render(ui(true))
    rerender(ui(false))
    expect(screen.getByTestId('a')).toHaveAttribute('data-present', 'false')

    act(() => remove!())
    expect(screen.queryByTestId('a')).toBeNull()
  })
})

// ============ 3. Animated onTapCancel ============

describe('Animated onTapCancel', () => {
  it('is called with the native event when released outside the element', () => {
    const onTap = vi.fn()
    const onTapCancel = vi.fn()
    render(<Animated.button data-testid="el" onTap={onTap} onTapCancel={onTapCancel} />)
    const el = screen.getByTestId('el')

    fireEvent.pointerDown(el)
    fireEvent.pointerUp(document.body)

    expect(onTap).not.toHaveBeenCalled()
    expect(onTapCancel).toHaveBeenCalledTimes(1)
    const event = onTapCancel.mock.calls[0]![0] as Event
    expect(event).toBeInstanceOf(Event)
    expect(event.type).toBe('pointerup')
  })

  it('is not called for a normal tap', () => {
    const onTap = vi.fn()
    const onTapCancel = vi.fn()
    render(<Animated.button data-testid="el" onTap={onTap} onTapCancel={onTapCancel} />)
    const el = screen.getByTestId('el')

    fireEvent.pointerDown(el)
    fireEvent.pointerUp(el)

    expect(onTap).toHaveBeenCalledTimes(1)
    expect(onTapCancel).not.toHaveBeenCalled()
  })

  it('is called once when the pointer leaves the element while pressed and is released', () => {
    const onTap = vi.fn()
    const onTapCancel = vi.fn()
    render(
      <Animated.button
        data-testid="el"
        whileHover={{ color: 'red' }}
        whileTap={{ color: 'blue' }}
        onTap={onTap}
        onTapCancel={onTapCancel}
      />
    )
    const el = screen.getByTestId('el')

    fireEvent.pointerDown(el)
    fireEvent.mouseLeave(el)
    fireEvent.pointerUp(el)

    expect(onTap).not.toHaveBeenCalled()
    expect(onTapCancel).toHaveBeenCalledTimes(1)
  })

  it('accepts a handler typed for React pointer events (backward compatible type)', () => {
    const handler = (e: React.PointerEvent) => void e
    const element = <Animated.div onTapCancel={handler} />
    expect(element).toBeTruthy()
  })
})

// ============ 4 + 5. Magnetic / Parallax: leaving the window, reduced motion ============

describe('Magnetic / MouseParallax leaving the window', () => {
  it('Magnetic returns to center when the pointer leaves the window', async () => {
    startClock()
    const onRelease = vi.fn()
    const { container } = render(
      <Magnetic strength={0.5} range={200} onRelease={onRelease}>
        <span>x</span>
      </Magnetic>
    )
    const el = container.firstChild as HTMLElement
    mockRect(el, { left: 0, top: 0, width: 100, height: 100 })

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 50 }))
    })
    await advance(2000)
    expect(parseTranslate(el.style.transform).x).toBeCloseTo(18.75, 1)

    leaveWindow()
    await advance(2000)
    expect(parseTranslate(el.style.transform).x).toBeCloseTo(0, 1)
    expect(onRelease).toHaveBeenCalledTimes(1)
  })

  it('MouseParallax resets when the pointer leaves the window', async () => {
    startClock()
    const { container } = render(
      <MouseParallax strength={20}>
        <span>x</span>
      </MouseParallax>
    )
    const el = container.firstChild as HTMLElement

    act(() => {
      window.dispatchEvent(
        new MouseEvent('mousemove', { clientX: window.innerWidth, clientY: window.innerHeight / 2 })
      )
    })
    await advance(3000)
    expect(parseTranslate(el.style.transform).x).toBeCloseTo(20, 0)

    leaveWindow()
    await advance(3000)
    expect(parseTranslate(el.style.transform).x).toBeCloseTo(0, 1)
  })

  it('removes the document leave listener on unmount', () => {
    const addSpy = vi.spyOn(document, 'addEventListener')
    const removeSpy = vi.spyOn(document, 'removeEventListener')
    const { unmount } = render(
      <Magnetic>
        <span>x</span>
      </Magnetic>
    )
    const listener = addSpy.mock.calls.find(([type]) => type === 'mouseout')?.[1]
    expect(listener).toBeDefined()
    unmount()
    expect(removeSpy.mock.calls.some(([type, l]) => type === 'mouseout' && l === listener)).toBe(true)
  })
})

describe('reduced motion', () => {
  async function magneticOffset(wrap: (node: React.ReactNode) => React.ReactNode) {
    const { container } = render(
      <>
        {wrap(
          <Magnetic strength={0.5} range={200}>
            <span>x</span>
          </Magnetic>
        )}
      </>
    )
    const el = container.querySelector('div') as HTMLElement
    mockRect(el, { left: 0, top: 0, width: 100, height: 100 })
    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 50 }))
    })
    await advance(2000)
    return parseTranslate(el.style.transform).x
  }

  it('Magnetic stays at rest with MotionConfig reducedMotion="always"', async () => {
    startClock()
    const x = await magneticOffset((node) => <MotionConfig reducedMotion="always">{node}</MotionConfig>)
    expect(x).toBe(0)
  })

  it('Magnetic stays at rest when the OS prefers reduced motion', async () => {
    stubReducedMotionQuery(true)
    startClock()
    const x = await magneticOffset((node) => node)
    expect(x).toBe(0)
  })

  it('Magnetic still moves with reducedMotion="never" even if the OS prefers reduced motion', async () => {
    stubReducedMotionQuery(true)
    startClock()
    const x = await magneticOffset((node) => <MotionConfig reducedMotion="never">{node}</MotionConfig>)
    expect(x).toBeCloseTo(18.75, 1)
  })

  it('Parallax stays at rest with reduced motion', async () => {
    startClock()
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(private callback: IntersectionObserverCallback) {}
        observe(target: Element) {
          this.callback(
            [{ isIntersecting: true, target } as unknown as IntersectionObserverEntry],
            this as unknown as IntersectionObserver
          )
        }
        unobserve() {}
        disconnect() {}
        takeRecords() {
          return []
        }
      }
    )
    const { container } = render(
      <MotionConfig reducedMotion="always">
        <Parallax speed={0.5}>
          <span>x</span>
        </Parallax>
      </MotionConfig>
    )
    const el = container.firstChild as HTMLElement
    mockRect(el, { left: 0, top: 0, width: 100, height: 100 })

    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })
    await advance(3000)
    expect(el.style.transform).toBe('translateY(0px)')
  })

  it('MouseParallax stays at rest with reduced motion', async () => {
    startClock()
    const { container } = render(
      <MotionConfig reducedMotion="always">
        <MouseParallax strength={20}>
          <span>x</span>
        </MouseParallax>
      </MotionConfig>
    )
    const el = container.firstChild as HTMLElement
    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: window.innerWidth, clientY: 0 }))
    })
    await advance(3000)
    expect(parseTranslate(el.style.transform)).toEqual({ x: 0, y: 0 })
  })

  it('TiltCard does not tilt with reduced motion', async () => {
    startClock()
    const { container } = render(
      <MotionConfig reducedMotion="always">
        <TiltCard maxTilt={20}>
          <span>x</span>
        </TiltCard>
      </MotionConfig>
    )
    const outer = container.firstChild as HTMLElement
    const inner = outer.firstChild as HTMLElement
    mockRect(outer, { left: 0, top: 0, width: 100, height: 100 })

    fireEvent.mouseMove(outer, { clientX: 100, clientY: 50 })
    await advance(3000)
    expect(inner.style.transform).toBe('rotateX(0deg) rotateY(0deg) scale(1)')
  })
})

// ============ 6. Trail reverse ============

describe('Trail reverse', () => {
  function renderTrail(reverse: boolean) {
    const latest: number[] = []
    const indices: number[] = []
    render(
      <Trail
        items={['a', 'b', 'c', 'd']}
        keys={(item) => item}
        from={{ o: 0 }}
        to={{ o: 100 }}
        reverse={reverse}
      >
        {(values, item, index) => {
          latest[['a', 'b', 'c', 'd'].indexOf(item)] = values.o
          indices[['a', 'b', 'c', 'd'].indexOf(item)] = index
          return <div>{item}</div>
        }}
      </Trail>
    )
    return { latest, indices }
  }

  it('staggers from the last item when reversed', async () => {
    startClock()
    const { latest, indices } = renderTrail(true)
    await advance(150)

    expect(latest[3]!).toBeGreaterThan(latest[0]!)
    expect(latest[3]!).toBeGreaterThan(latest[2]!)
    // Items keep their own index
    expect(indices).toEqual([0, 1, 2, 3])
  })

  it('staggers from the first item by default', async () => {
    startClock()
    const { latest } = renderTrail(false)
    await advance(150)
    expect(latest[0]!).toBeGreaterThan(latest[3]!)
  })
})

// ============ 7. Animated drag / dragControls ============

function pointer(type: string, init: { clientX: number; clientY: number }) {
  act(() => {
    window.dispatchEvent(new PointerEvent(type, { bubbles: true, ...init }))
  })
}

describe('Animated drag', () => {
  it('drags along the locked axis, applies whileDrag and keeps the offset after release', () => {
    render(<Animated.div data-testid="el" drag="x" whileDrag={{ cursor: 'grabbing' }} />)
    const el = screen.getByTestId('el')
    expect(el.style.touchAction).toBe('pan-y')

    fireEvent.pointerDown(el, { clientX: 10, clientY: 10 })
    // whileDrag applies once the pointer moved past dragThreshold (3px)
    expect(el.style.cursor).toBe('')
    pointer('pointermove', { clientX: 60, clientY: 40 })
    expect(el.style.cursor).toBe('grabbing')
    expect(el.style.transform).toBe('translate3d(50px, 0px, 0px)')

    pointer('pointerup', { clientX: 60, clientY: 40 })
    expect(el.style.cursor).toBe('')
    expect(el.style.transform).toBe('translate3d(50px, 0px, 0px)')

    // A move after release doesn't drag
    pointer('pointermove', { clientX: 200, clientY: 40 })
    expect(el.style.transform).toBe('translate3d(50px, 0px, 0px)')

    // A second drag continues from the current offset
    fireEvent.pointerDown(el, { clientX: 0, clientY: 0 })
    pointer('pointermove', { clientX: 5, clientY: 0 })
    expect(el.style.transform).toBe('translate3d(55px, 0px, 0px)')
  })

  it('composes the drag offset with the animated transform', () => {
    render(<Animated.div data-testid="el" drag style={{ transform: 'rotate(10deg)' }} />)
    const el = screen.getByTestId('el')
    fireEvent.pointerDown(el, { clientX: 0, clientY: 0 })
    pointer('pointermove', { clientX: 3, clientY: 4 })
    expect(el.style.transform).toBe('translate3d(3px, 4px, 0px) rotate(10deg)')
  })

  it('does nothing without the drag prop', () => {
    render(<Animated.div data-testid="el" />)
    const el = screen.getByTestId('el')
    fireEvent.pointerDown(el, { clientX: 0, clientY: 0 })
    pointer('pointermove', { clientX: 30, clientY: 30 })
    expect(el.style.transform).toBe('')
  })

  it('starts a drag from a handle via dragControls, with dragListener={false}', () => {
    let controls: ReturnType<typeof useDragControls> | null = null
    function Card() {
      const dragControls = useDragControls()
      controls = dragControls
      return (
        <>
          <div data-testid="handle" onPointerDown={(e) => dragControls.start(e)} />
          <Animated.div data-testid="card" drag dragControls={dragControls} dragListener={false} />
        </>
      )
    }
    render(<Card />)
    const card = screen.getByTestId('card')
    expect(card.style.touchAction).toBeFalsy()

    // The element itself doesn't start drags
    fireEvent.pointerDown(card, { clientX: 0, clientY: 0 })
    pointer('pointermove', { clientX: 30, clientY: 30 })
    expect(card.style.transform).toBe('')
    pointer('pointerup', { clientX: 30, clientY: 30 })

    // The handle does
    fireEvent.pointerDown(screen.getByTestId('handle'), { clientX: 0, clientY: 0 })
    expect(controls!.isDragging()).toBe(true)
    pointer('pointermove', { clientX: 30, clientY: 20 })
    expect(card.style.transform).toBe('translate3d(30px, 20px, 0px)')

    pointer('pointerup', { clientX: 30, clientY: 20 })
    expect(controls!.isDragging()).toBe(false)
  })

  it('dragControls.stop() ends the drag', () => {
    let controls: ReturnType<typeof useDragControls> | null = null
    function Card() {
      const dragControls = useDragControls()
      controls = dragControls
      return <Animated.div data-testid="card" drag dragControls={dragControls} />
    }
    render(<Card />)
    const card = screen.getByTestId('card')

    act(() => controls!.start(new PointerEvent('pointerdown', { clientX: 0, clientY: 0 })))
    pointer('pointermove', { clientX: 10, clientY: 0 })
    expect(card.style.transform).toBe('translate3d(10px, 0px, 0px)')

    act(() => controls!.stop())
    expect(controls!.isDragging()).toBe(false)
    pointer('pointermove', { clientX: 50, clientY: 0 })
    expect(card.style.transform).toBe('translate3d(10px, 0px, 0px)')
  })

  it('removes window drag listeners when unmounted mid-drag', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = render(<Animated.div data-testid="el" drag />)
    fireEvent.pointerDown(screen.getByTestId('el'), { clientX: 0, clientY: 0 })
    unmount()
    expect(removeSpy.mock.calls.some(([type]) => type === 'pointermove')).toBe(true)
  })
})
