/**
 * Regressions found in a review of the React adapter (2.0.0)
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, act, cleanup, screen, fireEvent } from '@testing-library/react'
import * as React from 'react'
import { installTestClock, type TestClock } from '@oxog/springkit/testing'
import { useSprings, useTrail, AnimatePresence, usePresence, Animated } from '@oxog/springkit/react'

let clock: TestClock | null = null

afterEach(() => {
  cleanup()
  clock?.uninstall()
  clock = null
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

/** SpringGroup notifies in a microtask: flush it inside an async act() */
async function advance(ms: number) {
  await act(async () => {
    clock!.advance(ms)
  })
}

describe('useSprings count changes', () => {
  function List({ n, log }: { n: number; log: Array<Array<number | undefined>> }) {
    const springs = useSprings(n, () => ({
      from: { o: 0 },
      values: { o: 1 },
      config: { stiffness: 1000, damping: 100 },
    }))
    log.push(Array.from({ length: n }, (_, i) => springs[i]?.o))
    return null
  }

  it('returns `count` items in the render where count increased', async () => {
    clock = installTestClock({ timers: true })
    const log: Array<Array<number | undefined>> = []
    const { rerender } = render(<List n={2} log={log} />)
    await advance(1000)
    log.length = 0
    rerender(<List n={3} log={log} />)
    expect(log[0]).toHaveLength(3)
    expect(log[0]!.every((v) => typeof v === 'number')).toBe(true)
  })

  it('keeps the springs of the remaining items when an item is added', async () => {
    clock = installTestClock({ timers: true })
    const log: Array<Array<number | undefined>> = []
    const { rerender } = render(<List n={2} log={log} />)
    await advance(1000)
    log.length = 0
    rerender(<List n={3} log={log} />)
    await advance(32)
    // Existing items stay at their target; only the new one animates from 0
    for (const frame of log) {
      expect(frame[0]).toBeCloseTo(1, 2)
      expect(frame[1]).toBeCloseTo(1, 2)
    }
    const last = log[log.length - 1]!
    expect(last[2]).toBeGreaterThan(0)
    expect(last[2]).toBeLessThan(1)
  })
})

describe('useTrail count changes', () => {
  function Trail({ n, x, log }: { n: number; x: number; log: Array<Array<number | undefined>> }) {
    const trail = useTrail(n, { x }, { stiffness: 100, damping: 20 })
    log.push(Array.from({ length: n }, (_, i) => trail[i]?.x))
    return null
  }

  it('returns `count` items and keeps animations in progress when an item is added', async () => {
    clock = installTestClock({ timers: true })
    const log: Array<Array<number | undefined>> = []
    const { rerender } = render(<Trail n={2} x={0} log={log} />)
    await advance(100)
    rerender(<Trail n={2} x={100} log={log} />)
    await advance(50)
    const before = log[log.length - 1]![0]!
    expect(before).toBeGreaterThan(0)
    expect(before).toBeLessThan(100)
    log.length = 0

    rerender(<Trail n={3} x={100} log={log} />)
    expect(log[0]).toHaveLength(3)
    expect(log[0]!.every((v) => typeof v === 'number')).toBe(true)
    await advance(16)
    // The first item continues its animation instead of jumping to the target
    const after = log[log.length - 1]![0]!
    expect(after).toBeGreaterThanOrEqual(before)
    expect(after).toBeLessThan(100)
  })
})

describe('hooks inside a hidden and shown <Activity>', () => {
  // React 19.2: hiding runs the effect cleanups, showing sets the effects up
  // again without re-rendering the (memoized) subtree
  const { Activity } = React as unknown as {
    Activity: React.ComponentType<{ mode: 'visible' | 'hidden'; children: React.ReactNode }>
  }

  async function hideAndShow(rerender: (ui: React.ReactElement) => void, ui: (mode: 'visible' | 'hidden') => React.ReactElement) {
    await act(async () => rerender(ui('hidden')))
    await act(async () => rerender(ui('visible')))
  }

  it('useMotionValue hands out a live MotionValue again', async () => {
    const { useMotionValue } = await import('@oxog/springkit/react')
    let latest: ReturnType<typeof useMotionValue<number>> | null = null
    const Child = React.memo(function Child() {
      latest = useMotionValue(5)
      return null
    })
    const ui = (mode: 'visible' | 'hidden') => <Activity mode={mode}><Child /></Activity>
    const { rerender } = render(ui('visible'))
    await hideAndShow(rerender, ui)
    expect(latest!.isDestroyed()).toBe(false)
    expect(latest!.get()).toBe(5)
  })

  it('useSpring keeps animating after being shown again', async () => {
    clock = installTestClock({ timers: true })
    const { useSpring } = await import('@oxog/springkit/react')
    let latest = { x: 0 }
    const Child = React.memo(function Child({ x }: { x: number }) {
      latest = useSpring({ x }, { stiffness: 1000, damping: 100 })
      return null
    })
    const ui = (mode: 'visible' | 'hidden', x = 0) => <Activity mode={mode}><Child x={x} /></Activity>
    const { rerender } = render(ui('visible'))
    await hideAndShow(rerender, ui)
    rerender(ui('visible', 100))
    await advance(1000)
    expect(latest.x).toBeCloseTo(100, 0)
  })
})

describe('useScroll inside a hidden and shown <Activity>', () => {
  const { Activity } = React as unknown as {
    Activity: React.ComponentType<{ mode: 'visible' | 'hidden'; children: React.ReactNode }>
  }

  it('keeps tracking with live MotionValues after being shown again', async () => {
    clock = installTestClock()
    const { useScroll } = await import('@oxog/springkit/react')
    let scroll: ReturnType<typeof useScroll> | null = null
    let el: HTMLDivElement | null = null
    const Child = React.memo(function Child() {
      const ref = React.useRef<HTMLDivElement>(null)
      scroll = useScroll({ container: ref })
      return <div ref={(node) => { ref.current = node; el = node }} />
    })
    const ui = (mode: 'visible' | 'hidden') => <Activity mode={mode}><Child /></Activity>
    const { rerender } = render(ui('visible'))
    await act(async () => rerender(ui('hidden')))
    await act(async () => rerender(ui('visible')))
    expect(scroll!.scrollY.isDestroyed()).toBe(false)

    Object.defineProperty(el!, 'scrollHeight', { configurable: true, value: 1000 })
    Object.defineProperty(el!, 'clientHeight', { configurable: true, value: 200 })
    el!.scrollTop = 400
    act(() => {
      el!.dispatchEvent(new Event('scroll'))
      clock!.nextFrame()
    })
    expect(scroll!.scrollY.get()).toBe(400)
    expect(scroll!.scrollYProgress.get()).toBeCloseTo(0.5)
  })
})

describe('useMorph inside a hidden and shown <Activity>', () => {
  const { Activity } = React as unknown as {
    Activity: React.ComponentType<{ mode: 'visible' | 'hidden'; children: React.ReactNode }>
  }

  it('renders morph updates after being shown again', async () => {
    clock = installTestClock({ timers: true })
    const { useMorph } = await import('@oxog/springkit/react')
    let api: ReturnType<typeof useMorph> | null = null
    const Child = React.memo(function Child() {
      api = useMorph('M 0 0 L 10 0')
      return <path data-testid="path" d={api.path} />
    })
    const ui = (mode: 'visible' | 'hidden') => <Activity mode={mode}><svg><Child /></svg></Activity>
    const { rerender } = render(ui('visible'))
    await act(async () => rerender(ui('hidden')))
    await act(async () => rerender(ui('visible')))
    act(() => api!.morphTo('M 0 0 L 100 0'))
    await advance(3000)
    const numbers = (screen.getByTestId('path').getAttribute('d') ?? '').match(/-?[\d.]+/g)!.map(Number)
    expect(Math.max(...numbers)).toBeCloseTo(100, 0)
  })
})

describe('useTransform range mapping', () => {
  it('clamp with an easing maps values below the range to the first output', async () => {
    const { createMotionValue } = await import('@oxog/springkit')
    const { useTransform } = await import('@oxog/springkit/react')
    const { renderHook } = await import('@testing-library/react')
    const source = createMotionValue(-50)
    const easeIn = (t: number) => t * t
    const easeOutCirc = (t: number) => Math.sqrt(1 - (t - 1) ** 2)
    const { result } = renderHook(() => ({
      quad: useTransform(source, [0, 100], [0, 100], { clamp: true, ease: easeIn }),
      circ: useTransform(source, [0, 100], [0, 100], { clamp: true, ease: easeOutCirc }),
    }))
    expect(result.current.quad.get()).toBe(0)
    expect(result.current.circ.get()).toBe(0)
    act(() => source.jump(150))
    expect(result.current.quad.get()).toBe(100)
    act(() => source.jump(50))
    expect(result.current.quad.get()).toBeCloseTo(25)
  })

  it('maps descending input ranges with more than two stops', async () => {
    const { createMotionValue } = await import('@oxog/springkit')
    const { useTransform, useSpringTransform } = await import('@oxog/springkit/react')
    const { renderHook } = await import('@testing-library/react')
    const source = createMotionValue(25)
    const { result } = renderHook(() => ({
      plain: useTransform(source, [100, 50, 0], [0, 1, 10]),
      clamped: useTransform(source, [100, 50, 0], [0, 1, 10], { clamp: true }),
      sprung: useSpringTransform(source, [100, 50, 0], [0, 1, 10]),
    }))
    expect(result.current.plain.get()).toBeCloseTo(5.5)
    expect(result.current.clamped.get()).toBeCloseTo(5.5)
    expect(result.current.sprung.get()).toBeCloseTo(5.5)
    act(() => source.jump(75))
    expect(result.current.plain.get()).toBeCloseTo(0.5)
  })
})

describe('useMotionValueEvent', () => {
  it("'change' only fires when the value changes, not on mount", async () => {
    const { createMotionValue } = await import('@oxog/springkit')
    const { useMotionValueEvent } = await import('@oxog/springkit/react')
    const { renderHook } = await import('@testing-library/react')
    const mv = createMotionValue(1)
    const onChange = vi.fn()
    renderHook(() => useMotionValueEvent(mv, 'change', onChange), {
      wrapper: React.StrictMode,
    })
    expect(onChange).not.toHaveBeenCalled()
    act(() => mv.jump(2))
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(2)
  })
})

describe('AnimatePresence mode="wait"', () => {
  it('keeps a sibling that stays in the list mounted while another child exits', () => {
    const mounts: Record<string, number> = {}
    const registry: Record<string, () => void> = {}
    function Child({ id }: { id: string }) {
      const [isPresent, safeToRemove] = usePresence()
      registry[id] = safeToRemove
      React.useEffect(() => {
        mounts[id] = (mounts[id] ?? 0) + 1
      }, [id])
      return <div data-testid={`child-${id}`} data-present={String(isPresent)} />
    }
    const ui = (ids: string[]) => (
      <AnimatePresence mode="wait">
        {ids.map((id) => <Child key={id} id={id} />)}
      </AnimatePresence>
    )
    const { rerender } = render(ui(['a', 'b']))
    rerender(ui(['b', 'c']))

    // b stays mounted, a exits, c waits for a
    expect(screen.getByTestId('child-b')).toHaveAttribute('data-present', 'true')
    expect(screen.getByTestId('child-a')).toHaveAttribute('data-present', 'false')
    expect(screen.queryByTestId('child-c')).toBeNull()
    expect(mounts.b).toBe(1)

    act(() => registry.a!())
    expect(screen.queryByTestId('child-a')).toBeNull()
    expect(screen.getByTestId('child-c')).toBeInTheDocument()
    expect(mounts.b).toBe(1)
  })
})

describe('Animated drag with a second pointer', () => {
  function windowPointer(type: string, x: number, y: number, pointerId: number) {
    act(() => {
      window.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId }))
    })
  }

  it('a second finger touching the element does not take over (or silently end) the drag', () => {
    clock = installTestClock({ timers: true })
    const onDragStart = vi.fn()
    const onDragEnd = vi.fn()
    render(
      <Animated.div
        data-testid="el"
        drag="x"
        dragMomentum={false}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      />
    )
    const el = screen.getByTestId('el')
    fireEvent.pointerDown(el, { clientX: 0, clientY: 0, pointerId: 1, isPrimary: true })
    act(() => clock!.advance(16))
    windowPointer('pointermove', 20, 0, 1)
    expect(onDragStart).toHaveBeenCalledTimes(1)

    // Second touch (not the primary pointer) on the dragged element
    fireEvent.pointerDown(el, { clientX: 100, clientY: 0, pointerId: 2, isPrimary: false })
    act(() => clock!.advance(16))
    windowPointer('pointermove', 140, 0, 2)
    windowPointer('pointermove', 40, 0, 1)
    expect(onDragStart).toHaveBeenCalledTimes(1)
    expect(onDragEnd).not.toHaveBeenCalled()

    windowPointer('pointerup', 40, 0, 1)
    expect(onDragEnd).toHaveBeenCalledTimes(1)
    expect(el.style.transform).toContain('translate3d(40px')
  })
})

describe('scroll-linked hooks with an element that mounts later', () => {
  async function lateMount(useHook: () => { ref: React.RefObject<HTMLElement> }) {
    const added: string[] = []
    const original = window.addEventListener.bind(window)
    vi.spyOn(window, 'addEventListener').mockImplementation(((type: string, ...rest: unknown[]) => {
      added.push(type)
      return (original as (...args: unknown[]) => void)(type, ...rest)
    }) as typeof window.addEventListener)
    function C({ show }: { show: boolean }) {
      const { ref } = useHook()
      return show ? <div ref={ref as React.RefObject<HTMLDivElement>} /> : null
    }
    const { rerender } = render(<C show={false} />)
    const before = added.filter((t) => t === 'scroll').length
    rerender(<C show={true} />)
    return added.filter((t) => t === 'scroll').length - before
  }

  it('useScrollTrigger attaches to the element once it mounts', async () => {
    const { useScrollTrigger } = await import('@oxog/springkit/react')
    expect(await lateMount(() => useScrollTrigger())).toBeGreaterThan(0)
  })

  it('useParallax attaches to the element once it mounts', async () => {
    const { useParallax } = await import('@oxog/springkit/react')
    expect(await lateMount(() => useParallax())).toBeGreaterThan(0)
  })
})

describe('<Spring> onRest', () => {
  it('fires once when every value has come to rest', async () => {
    clock = installTestClock({ timers: true })
    const { Spring } = await import('@oxog/springkit/react')
    const onRest = vi.fn()
    let latest = { a: 0, b: 0 }
    render(
      <Spring
        from={{ a: 0, b: 0 }}
        to={{ a: 100, b: 10 }}
        config={{ stiffness: 300, damping: 30 }}
        onRest={onRest}
      >
        {(values) => {
          latest = values
          return null
        }}
      </Spring>
    )
    // Advance until the first value settled but not necessarily the second
    for (let i = 0; i < 300 && onRest.mock.calls.length === 0; i++) await advance(16)
    expect(onRest).toHaveBeenCalledTimes(1)
    await advance(2000)
    expect(onRest).toHaveBeenCalledTimes(1)
    expect(latest).toEqual({ a: 100, b: 10 })
  })

  it('does not fire when the animation is retargeted before it settles', async () => {
    clock = installTestClock({ timers: true })
    const { Spring } = await import('@oxog/springkit/react')
    const onRest = vi.fn()
    const ui = (to: number) => (
      <Spring from={{ a: 0 }} to={{ a: to }} config={{ stiffness: 300, damping: 30 }} onRest={onRest}>
        {() => null}
      </Spring>
    )
    const { rerender } = render(ui(100))
    await advance(100)
    rerender(ui(200))
    await advance(3000)
    expect(onRest).toHaveBeenCalledTimes(1)
  })
})

describe('Reorder drop', () => {
  it('a displaced neighbour does not slide back from its displaced offset after the reorder', async () => {
    clock = installTestClock({ timers: true })
    const { Reorder } = await import('@oxog/springkit/react')
    function List() {
      const [values, setValues] = React.useState(['a', 'b', 'c'])
      return (
        <Reorder.Group values={values} onReorder={setValues} layoutDuration={0}>
          {values.map((value) => (
            <Reorder.Item key={value} value={value}>{`item-${value}`}</Reorder.Item>
          ))}
        </Reorder.Group>
      )
    }
    render(<List />)
    const list = screen.getByRole('listbox')
    Array.from(list.children).forEach((child) => {
      const el = child as HTMLElement
      el.getBoundingClientRect = () => {
        const top = Array.from(list.children).indexOf(el) * 50
        return { left: 0, top, width: 200, height: 50, right: 200, bottom: top + 50, x: 0, y: top, toJSON: () => ({}) } as DOMRect
      }
    })
    const a = screen.getByText('item-a')
    const b = screen.getByText('item-b')
    fireEvent.pointerDown(a, { clientX: 10, clientY: 25, pointerId: 1 })
    fireEvent.pointerMove(a, { clientX: 10, clientY: 80, pointerId: 1 })
    act(() => clock!.advance(2000))
    expect(b.style.transform).toBe('translateY(-50px)')

    fireEvent.pointerUp(a, { clientX: 10, clientY: 80, pointerId: 1 })
    expect(Array.from(list.children).map((el) => el.textContent)).toEqual(['item-b', 'item-a', 'item-c'])
    // b now sits at the top in the DOM: its displacement is gone right away
    act(() => clock!.advance(16))
    expect(b.style.transform).toBe('translateY(0px)')
  })
})

describe('reduced motion switched on while an effect component is displaced', () => {
  function rect(el: Element) {
    el.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect
  }

  it('Magnetic snaps back to rest', async () => {
    clock = installTestClock({ timers: true })
    const { Magnetic, MotionConfig } = await import('@oxog/springkit/react')
    const ui = (mode: 'never' | 'always') => (
      <MotionConfig reducedMotion={mode}>
        <Magnetic strength={0.5} range={200} scaleOnHover={1.2}><span>x</span></Magnetic>
      </MotionConfig>
    )
    const { container, rerender } = render(ui('never'))
    const el = container.firstChild as HTMLElement
    rect(el)
    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 50 }))
    })
    await advance(2000)
    expect(el.style.transform).not.toBe('translate(0px, 0px) scale(1)')
    rerender(ui('always'))
    await advance(16)
    expect(el.style.transform).toBe('translate(0px, 0px) scale(1)')
  })

  it('MouseParallax snaps back to rest', async () => {
    clock = installTestClock({ timers: true })
    const { MouseParallax, MotionConfig } = await import('@oxog/springkit/react')
    const ui = (mode: 'never' | 'always') => (
      <MotionConfig reducedMotion={mode}>
        <MouseParallax strength={20}><span>x</span></MouseParallax>
      </MotionConfig>
    )
    const { container, rerender } = render(ui('never'))
    const el = container.firstChild as HTMLElement
    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: window.innerWidth, clientY: window.innerHeight / 2 }))
    })
    await advance(3000)
    expect(el.style.transform).not.toMatch(/translate\(0px, 0px\)/)
    rerender(ui('always'))
    await advance(16)
    expect(el.style.transform).toMatch(/translate\(0px, 0px\)/)
  })

  it('TiltCard snaps back to rest', async () => {
    clock = installTestClock({ timers: true })
    const { TiltCard, MotionConfig } = await import('@oxog/springkit/react')
    const ui = (mode: 'never' | 'always') => (
      <MotionConfig reducedMotion={mode}>
        <TiltCard maxTilt={20} scale={1.1}><span>x</span></TiltCard>
      </MotionConfig>
    )
    const { container, rerender } = render(ui('never'))
    const outer = container.firstChild as HTMLElement
    const inner = outer.firstChild as HTMLElement
    rect(outer)
    fireEvent.mouseMove(outer, { clientX: 100, clientY: 50 })
    await advance(3000)
    expect(inner.style.transform).not.toBe('rotateX(0deg) rotateY(0deg) scale(1)')
    rerender(ui('always'))
    await advance(16)
    expect(inner.style.transform).toBe('rotateX(0deg) rotateY(0deg) scale(1)')
  })

  it('Parallax snaps back to rest', async () => {
    clock = installTestClock({ timers: true })
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
    const { Parallax, MotionConfig } = await import('@oxog/springkit/react')
    const ui = (mode: 'never' | 'always') => (
      <MotionConfig reducedMotion={mode}>
        <Parallax speed={0.5}><span>x</span></Parallax>
      </MotionConfig>
    )
    const { container, rerender } = render(ui('never'))
    const el = container.firstChild as HTMLElement
    el.getBoundingClientRect = () =>
      ({ left: 0, top: 2000, width: 100, height: 100, right: 100, bottom: 2100, x: 0, y: 2000, toJSON: () => ({}) }) as DOMRect
    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })
    await advance(3000)
    expect(el.style.transform).not.toBe('translateY(0px)')
    rerender(ui('always'))
    await advance(16)
    expect(el.style.transform).toBe('translateY(0px)')
    vi.unstubAllGlobals()
  })

  it('useMagnetic snaps back to rest', async () => {
    clock = installTestClock({ timers: true })
    const { useMagnetic, MotionConfig } = await import('@oxog/springkit/react')
    let latest = { x: 0, y: 0 }
    function Button() {
      const { ref, x, y } = useMagnetic({ strength: 0.5, range: 200 })
      latest = { x, y }
      return <button ref={ref as React.RefObject<HTMLButtonElement>} />
    }
    const ui = (mode: 'never' | 'always') => (
      <MotionConfig reducedMotion={mode}><Button /></MotionConfig>
    )
    const { container, rerender } = render(ui('never'))
    rect(container.querySelector('button')!)
    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 50 }))
    })
    await advance(2000)
    expect(latest.x).not.toBe(0)
    rerender(ui('always'))
    await advance(16)
    expect(latest).toEqual({ x: 0, y: 0 })
  })
})

describe('useDragControls shared by several elements', () => {
  it('isDragging() stays true while another element is still dragging', async () => {
    clock = installTestClock({ timers: true })
    const { useDragControls } = await import('@oxog/springkit/react')
    let controls: ReturnType<typeof useDragControls> | null = null
    function Cards({ dragA }: { dragA: boolean }) {
      controls = useDragControls()
      return (
        <>
          <Animated.div data-testid="a" drag={dragA ? 'x' : false} dragControls={controls} dragListener={false} />
          <Animated.div data-testid="b" drag="x" dragControls={controls} dragListener={false} />
        </>
      )
    }
    const { rerender } = render(<Cards dragA />)
    act(() => {
      controls!.start(new PointerEvent('pointerdown', { clientX: 0, clientY: 0, pointerId: 1 }))
    })
    expect(controls!.isDragging()).toBe(true)
    // a stops dragging (drag disabled) while b continues
    rerender(<Cards dragA={false} />)
    expect(controls!.isDragging()).toBe(true)
    act(() => {
      window.dispatchEvent(new PointerEvent('pointerup', { clientX: 0, clientY: 0, pointerId: 1 }))
    })
    expect(controls!.isDragging()).toBe(false)
  })
})

describe('ParallaxLayer', () => {
  async function scrollTo(container: HTMLElement, progress: number) {
    Object.defineProperty(container, 'scrollHeight', { configurable: true, value: 3000 })
    Object.defineProperty(container, 'clientHeight', { configurable: true, value: 1000 })
    container.scrollTop = progress * 2000
    await act(async () => {
      container.dispatchEvent(new Event('scroll'))
    })
  }

  it('speed 0 keeps the layer fixed in the viewport with more than two pages', async () => {
    const { ParallaxContainer, ParallaxLayer } = await import('@oxog/springkit/react')
    const { container } = render(
      <ParallaxContainer pages={3}>
        <ParallaxLayer offset={0} speed={0}><span data-testid="fixed">fixed</span></ParallaxLayer>
        <ParallaxLayer sticky={{ start: 0.5, end: 1.5 }}><span data-testid="sticky">sticky</span></ParallaxLayer>
      </ParallaxContainer>
    )
    const scroller = container.firstChild as HTMLElement
    const fixed = screen.getByTestId('fixed').parentElement!
    const sticky = screen.getByTestId('sticky').parentElement!

    // Scrolled to the bottom: two pages (200vh)
    await scrollTo(scroller, 1)
    expect(fixed.style.transform).toBe('translate(0vh, 200vh)')
    expect(sticky.style.transform).toBe('translate(0vh, 150vh)')

    // Scrolled one page: inside the sticky range, the layer follows the scroll
    await scrollTo(scroller, 0.5)
    expect(fixed.style.transform).toBe('translate(0vh, 100vh)')
    expect(sticky.style.transform).toBe('translate(0vh, 100vh)')

    await scrollTo(scroller, 0)
    expect(sticky.style.transform).toBe('translate(0vh, 50vh)')
  })
})
