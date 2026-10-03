/**
 * Regressions from the second review round of the React adapter (2.0.0)
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, renderHook, act, cleanup, screen, fireEvent } from '@testing-library/react'
import * as React from 'react'
import { installTestClock, type TestClock } from '@oxog/springkit/testing'
import { globalLoop } from '@oxog/springkit'
import { Animated, AnimatePresence, MotionConfig, useReducedMotion } from '@oxog/springkit/react'

let clock: TestClock | null = null

// Every test runs on the virtual clock at normal speed, whatever ran before
beforeEach(() => {
  globalLoop.setTimeScale(1)
})

afterEach(() => {
  cleanup()
  clock?.uninstall()
  clock = null
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

async function advance(ms: number) {
  await act(async () => {
    clock!.advance(ms)
  })
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

describe('reduced motion without a MotionConfig', () => {
  it('useReducedMotion reads the preference on the first client-only render', () => {
    stubReducedMotionQuery(true)
    const seen: boolean[] = []
    renderHook(() => {
      const reduced = useReducedMotion()
      seen.push(reduced)
      return reduced
    })
    expect(seen[0]).toBe(true)
  })

  it('Animated honours the OS preference like inside a default <MotionConfig>', async () => {
    stubReducedMotionQuery(true)
    clock = installTestClock()
    function Probe({ opacity }: { opacity: number }) {
      return <Animated.div data-testid="el" initial={{ opacity: 0 }} animate={{ opacity }} />
    }
    const { rerender } = render(<Probe opacity={1} />)
    const el = screen.getByTestId('el')
    // No entrance animation
    expect(Number(el.style.opacity)).toBe(1)
    rerender(<Probe opacity={0.2} />)
    await advance(16)
    // Changes jump instead of animating
    expect(Number(el.style.opacity)).toBe(0.2)
  })

  it('Animated with reducedMotion="never" still animates when the OS prefers reduced motion', async () => {
    stubReducedMotionQuery(true)
    clock = installTestClock()
    render(
      <MotionConfig reducedMotion="never">
        <Animated.div data-testid="el" initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
      </MotionConfig>
    )
    await advance(48)
    const opacity = Number(screen.getByTestId('el').style.opacity)
    expect(opacity).toBeGreaterThan(0)
    expect(opacity).toBeLessThan(1)
  })
})

describe('Animated exit completion', () => {
  it('completes on the frame the exit spring settles (inline exit and onAnimationComplete)', async () => {
    clock = installTestClock({ timers: true })
    const onComplete = vi.fn()
    const ui = (show: boolean) => (
      <AnimatePresence>
        {show && (
          <Animated.div
            key="a"
            data-testid="a"
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            // Overdamped: opacity never overshoots below 0 (where it would be
            // shown clamped at 0 while the spring still moves)
            config={{ stiffness: 300, damping: 60 }}
            onAnimationComplete={() => onComplete()}
          />
        )}
      </AnimatePresence>
    )
    const { rerender } = render(ui(true))
    await advance(1000)
    rerender(ui(false))
    let lastOpacity = 1
    for (let i = 0; i < 200 && screen.queryByTestId('a'); i++) {
      lastOpacity = Number(screen.getByTestId('a').style.opacity)
      await act(async () => {
        clock!.nextFrame()
      })
    }
    expect(screen.queryByTestId('a')).toBeNull()
    expect(onComplete).toHaveBeenCalledTimes(1)
    // Removed in the frame it settled: the previous frame was still moving
    expect(lastOpacity).toBeGreaterThan(0)
  })
})

describe('<Trail> when items are added', () => {
  it('keeps the existing items animating and renders the new item right away', async () => {
    clock = installTestClock({ timers: true })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { Trail } = await import('@oxog/springkit/react')
    const seen: Record<string, number[]> = {}
    const ui = (items: string[]) => (
      <Trail items={items} keys={(item) => item} from={{ x: 0 }} to={{ x: 100 }} config={{ stiffness: 100, damping: 20 }}>
        {(values, item) => {
          ;(seen[item] ??= []).push(values.x)
          return <span data-testid={item}>{item}</span>
        }}
      </Trail>
    )
    const { rerender } = render(ui(['a', 'b']))
    await advance(150)
    const before = seen.a![seen.a!.length - 1]!
    expect(before).toBeGreaterThan(0)
    expect(before).toBeLessThan(100)

    const renderedBefore = seen.a!.length
    rerender(ui(['a', 'b', 'c']))
    expect(screen.getByTestId('c')).toBeInTheDocument()
    await advance(32)
    // a never restarted from `from`
    expect(Math.min(...seen.a!.slice(renderedBefore))).toBeGreaterThanOrEqual(before)
    expect(warn).not.toHaveBeenCalled()
    await advance(5000)
    expect(seen.c![seen.c!.length - 1]).toBeCloseTo(100, 1)
  })
})

describe('Animated drag lifecycle', () => {
  function windowPointer(type: string, x: number, y: number) {
    act(() => {
      window.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 1 }))
    })
  }
  function rect(el: Element, box: { left: number; top: number; width: number; height: number }) {
    el.getBoundingClientRect = () =>
      ({ ...box, right: box.left + box.width, bottom: box.top + box.height, x: box.left, y: box.top, toJSON: () => ({}) }) as DOMRect
  }

  it('calls onDragEnd when drag is turned off mid-gesture, but not on unmount', () => {
    clock = installTestClock({ timers: true })
    const onDragEnd = vi.fn()
    const ui = (drag: boolean) => (
      <Animated.div data-testid="el" drag={drag ? 'x' : false} onDragEnd={onDragEnd} />
    )
    const { rerender, unmount } = render(ui(true))
    const el = screen.getByTestId('el')
    fireEvent.pointerDown(el, { clientX: 0, clientY: 0, pointerId: 1 })
    act(() => clock!.advance(16))
    windowPointer('pointermove', 30, 0)
    rerender(ui(false))
    expect(onDragEnd).toHaveBeenCalledTimes(1)
    expect(onDragEnd.mock.calls[0]![1].offset).toEqual({ x: 30, y: 0 })
    expect(onDragEnd.mock.calls[0]![1].velocity).toEqual({ x: 0, y: 0 })

    rerender(ui(true))
    fireEvent.pointerDown(el, { clientX: 0, clientY: 0, pointerId: 1 })
    act(() => clock!.advance(16))
    windowPointer('pointermove', 30, 0)
    unmount()
    expect(onDragEnd).toHaveBeenCalledTimes(1)
  })

  it('observes a constraints container that mounts after the element', () => {
    clock = installTestClock({ timers: true })
    const observed: Element[] = []
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe(target: Element) {
          observed.push(target)
        }
        unobserve() {}
        disconnect() {}
      }
    )
    function Box({ showContainer }: { showContainer: boolean }) {
      const ref = React.useRef<HTMLDivElement>(null)
      return (
        <>
          <Animated.div data-testid="el" drag="x" dragConstraints={ref} />
          {showContainer && <div data-testid="container" ref={ref} />}
        </>
      )
    }
    const { rerender } = render(<Box showContainer={false} />)
    rerender(<Box showContainer />)
    // Animated is memoized (it doesn't re-render here): the container is
    // picked up when the next drag starts
    fireEvent.pointerDown(screen.getByTestId('el'), { clientX: 0, clientY: 0, pointerId: 1 })
    windowPointer('pointerup', 0, 0)
    expect(observed).toContain(screen.getByTestId('container'))
  })

  it('a dragElastic object without a side gives that side no elasticity', () => {
    clock = installTestClock({ timers: true })
    render(
      <Animated.div data-testid="el" drag="x" dragMomentum={false} dragConstraints={{ left: 0, right: 0 }} dragElastic={{ left: 0.5 }} />
    )
    const el = screen.getByTestId('el')
    rect(el, { left: 0, top: 0, width: 10, height: 10 })
    fireEvent.pointerDown(el, { clientX: 0, clientY: 0, pointerId: 1 })
    act(() => clock!.advance(16))
    const offsetX = () => Number(/translate3d\((-?[\d.]+)px/.exec(el.style.transform)?.[1] ?? 0)
    windowPointer('pointermove', 40, 0)
    expect(offsetX()).toBe(0)
    windowPointer('pointermove', -40, 0)
    expect(offsetX()).toBe(-20)
    windowPointer('pointerup', -40, 0)
  })
})

describe('useScroll({ target }) without a container', () => {
  it('reports the page scroll position in scrollX / scrollY', async () => {
    clock = installTestClock()
    const { useScroll } = await import('@oxog/springkit/react')
    const target = document.createElement('div')
    document.body.appendChild(target)
    target.getBoundingClientRect = () =>
      ({ left: 0, top: 500, width: 100, height: 100, right: 100, bottom: 600, x: 0, y: 500, toJSON: () => ({}) }) as DOMRect
    const ref = { current: target }
    const { result } = renderHook(() => useScroll({ target: ref, offset: ['start end', 'end start'] }))
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 250 })
    act(() => {
      window.dispatchEvent(new Event('scroll'))
      clock!.nextFrame()
    })
    expect(result.current.scrollY.get()).toBe(250)
    target.remove()
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 })
  })
})

describe('useDrag config and element changes', () => {
  it('applies a new axis after mount and keeps the position; swapping the element keeps it too', async () => {
    clock = installTestClock({ timers: true })
    const { useDrag } = await import('@oxog/springkit/react')
    let latest: { x: number; y: number } = { x: 0, y: 0 }
    let api: { set(v: { x?: number; y?: number }): void } | null = null
    function Box({ axis, which }: { axis: 'x' | 'y'; which: 'a' | 'b' }) {
      const [position, dragApi] = useDrag({ axis, momentum: false })
      latest = position
      api = dragApi
      return which === 'a'
        ? <div data-testid="a" ref={dragApi.ref} />
        : <span data-testid="b" ref={dragApi.ref} />
    }
    const { rerender } = render(<Box axis="x" which="a" />)
    act(() => api!.set({ x: 40, y: 0 }))
    await advance(32)
    expect(latest).toEqual({ x: 40, y: 0 })

    rerender(<Box axis="y" which="a" />)
    await advance(32)
    expect(latest).toEqual({ x: 40, y: 0 })

    const a = screen.getByTestId('a')
    fireEvent.pointerDown(a, { clientX: 0, clientY: 0, pointerId: 1, button: 0 })
    fireEvent.pointerMove(a, { clientX: 30, clientY: 30, pointerId: 1 })
    fireEvent.pointerUp(a, { clientX: 30, clientY: 30, pointerId: 1 })
    await advance(2000)
    expect(latest.x).toBe(40)
    expect(latest.y).not.toBe(0)
    const y = latest.y

    rerender(<Box axis="y" which="b" />)
    await advance(32)
    expect(latest).toEqual({ x: 40, y })
  })
})

describe('useChain', () => {
  it('returns every value on the first render and runs the steps one after another', async () => {
    clock = installTestClock({ timers: true })
    const { useChain } = await import('@oxog/springkit/react')
    const firstRenderKeys: string[][] = []
    const { result } = renderHook(() => {
      const chain = useChain(
        [
          { to: { x: 100 }, config: { stiffness: 300, damping: 40 } },
          { to: { y: 50 }, delay: 100, config: { stiffness: 300, damping: 40 } },
        ],
        { x: 0, y: 0 }
      )
      firstRenderKeys.push(Object.keys(chain.values))
      return chain
    })
    expect(firstRenderKeys[0]).toEqual(['x', 'y'])
    const values = result.current.values

    act(() => result.current.play())
    await advance(100)
    expect(result.current.currentStep).toBe(0)
    expect(values.y!.get()).toBe(0)
    // Step 2 starts once x has settled, plus its delay
    for (let i = 0; i < 300 && result.current.currentStep === 0; i++) await advance(16)
    expect(values.x!.get()).toBe(100)
    expect(result.current.currentStep).toBe(1)
    await advance(3000)
    expect(values.y!.get()).toBe(50)
    expect(result.current.isPlaying).toBe(false)
    expect(result.current.values).toBe(values)

    act(() => result.current.reset())
    expect(values.x!.get()).toBe(0)
    expect(values.y!.get()).toBe(0)
  })
})

describe('usePointer smoothing', () => {
  async function smoothedAfter(frameRate: number, ms: number): Promise<number> {
    clock = installTestClock({ frameRate, startTime: 0 })
    const { usePointer } = await import('@oxog/springkit/react')
    const { result, unmount } = renderHook(() => usePointer({ smooth: 0.1 }))
    act(() => {
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: 100, clientY: 0 }))
    })
    act(() => clock!.advance(ms))
    const value = result.current.x.get()
    unmount()
    clock.uninstall()
    clock = null
    return value
  }

  it('moves the same distance at 60Hz and 144Hz', async () => {
    const at60 = await smoothedAfter(60, 200)
    const at144 = await smoothedAfter(144, 200)
    expect(at60).toBeGreaterThan(50)
    expect(at60).toBeLessThan(100)
    expect(Math.abs(at144 - at60)).toBeLessThan(2)
  })
})

describe('useGesture with several pointers', () => {
  async function setup() {
    const { useGesture } = await import('@oxog/springkit/react')
    const onDrag = vi.fn()
    const onPinch = vi.fn()
    const onRotate = vi.fn()
    function Target() {
      const bind = useGesture({ onDrag, onPinch, onRotate })
      return <div data-testid="t" {...bind} />
    }
    render(<Target />)
    const el = screen.getByTestId('t')
    const down = (id: number, x: number, y: number) => fireEvent.pointerDown(el, { pointerId: id, clientX: x, clientY: y })
    const move = (id: number, x: number, y: number) => fireEvent.pointerMove(el, { pointerId: id, clientX: x, clientY: y })
    return { onDrag, onPinch, onRotate, down, move }
  }

  it('a second finger does not reset the drag start point', async () => {
    const { onDrag, down, move } = await setup()
    down(1, 0, 0)
    move(1, 10, 0)
    down(2, 100, 100)
    move(1, 20, 0)
    expect(onDrag).toHaveBeenLastCalledWith({ x: 20, y: 0 })
  })

  it('reports pinch scale and rotation angle with two fingers', async () => {
    const { onPinch, onRotate, down, move } = await setup()
    down(1, 0, 0)
    down(2, 100, 0)
    move(2, 200, 0)
    expect(onPinch).toHaveBeenLastCalledWith(expect.objectContaining({ scale: 2, angle: 0 }))
    move(2, 0, 100)
    const state = onRotate.mock.calls[onRotate.mock.calls.length - 1]![0]
    expect(state.angle).toBeCloseTo(90)
    expect(state.scale).toBeCloseTo(1)
  })
})

// Keep imports used by later sections
void fireEvent
