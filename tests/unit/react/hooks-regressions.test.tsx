/**
 * Regression tests for hook gaps: late-mounted elements (useInView, useScroll),
 * horizontal useScroll, useScrollVelocity decay, stale physics config, applied
 * variant stagger, synchronous useMorph controller, gyroscope mouse fallback
 * and useTimeline seek semantics.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, renderHook, act, cleanup } from '@testing-library/react'
import * as React from 'react'
import { installTestClock, type TestClock } from '@oxog/springkit/testing'
import type { MorphController } from '@oxog/springkit'
import { useInView, useInViewCallback } from '../../../src/adapters/react/hooks/useInView'
import { useScroll, useScrollVelocity, type UseScrollReturn } from '../../../src/adapters/react/hooks/useScroll'
import {
  useMomentum,
  useBounce,
  useGravity,
  useGyroscope,
  usePointer,
} from '../../../src/adapters/react/hooks/usePhysics'
import { useVariants, VariantContext } from '../../../src/adapters/react/hooks/useVariants'
import { useMorph } from '../../../src/adapters/react/hooks/useMorph'
import { useTimeline } from '../../../src/adapters/react/hooks/useTimeline'

let clock: TestClock | null = null
const restores: Array<() => void> = []

afterEach(() => {
  // Unmount while the virtual clock is still installed, so frame loops are
  // cancelled with the ids they were scheduled with
  cleanup()
  clock?.uninstall()
  clock = null
  while (restores.length) restores.pop()!()
  vi.unstubAllGlobals()
})

/**
 * Advance virtual time in frame-sized async act() scopes so React renders in
 * between (SpringGroup notifies subscribers in a microtask)
 */
async function step(ms: number) {
  for (let t = 0; t < ms; t += 16) {
    await act(async () => {
      clock!.advance(Math.min(16, ms - t))
    })
  }
}

/** Override a (possibly read-only) property for the duration of the test */
function setProp(target: object, key: string, value: unknown) {
  const previous = Object.getOwnPropertyDescriptor(target, key)
  Object.defineProperty(target, key, { value, configurable: true, writable: true })
  restores.push(() => {
    if (previous) Object.defineProperty(target, key, previous)
    else delete (target as Record<string, unknown>)[key]
  })
}

function rect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    left, top, width, height, x: left, y: top,
    right: left + width, bottom: top + height,
    toJSON: () => ({}),
  } as DOMRect
}

class RecordingIntersectionObserver {
  static observed: Element[] = []
  static disconnected = 0
  constructor(private callback: IntersectionObserverCallback) {}
  observe(target: Element) {
    RecordingIntersectionObserver.observed.push(target)
    this.callback(
      [{ isIntersecting: true, intersectionRatio: 1, target } as unknown as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    )
  }
  unobserve() {}
  disconnect() {
    RecordingIntersectionObserver.disconnected++
  }
  takeRecords() {
    return []
  }
}

function stubIntersectionObserver() {
  RecordingIntersectionObserver.observed = []
  RecordingIntersectionObserver.disconnected = 0
  vi.stubGlobal('IntersectionObserver', RecordingIntersectionObserver)
}

// ============ 1. late-mounted elements ============

describe('useInView with an element that mounts later', () => {
  it('observes a conditionally rendered element once it mounts', () => {
    stubIntersectionObserver()
    function C({ show }: { show: boolean }) {
      const { ref, inView } = useInView()
      return (
        <>
          {show && <div ref={ref as React.RefObject<HTMLDivElement>} />}
          <span data-testid="state">{String(inView)}</span>
        </>
      )
    }
    const { rerender, getByTestId } = render(<C show={false} />)
    expect(getByTestId('state').textContent).toBe('false')

    rerender(<C show />)
    expect(RecordingIntersectionObserver.observed).toHaveLength(1)
    expect(getByTestId('state').textContent).toBe('true')
  })

  it('re-attaches to a replaced element and disconnects the old observer', () => {
    stubIntersectionObserver()
    function C({ id }: { id: string }) {
      const { ref } = useInView()
      return <div key={id} data-id={id} ref={ref as React.RefObject<HTMLDivElement>} />
    }
    const { rerender } = render(<C id="a" />)
    rerender(<C id="b" />)
    const observed = RecordingIntersectionObserver.observed.map((el) => (el as HTMLElement).dataset.id)
    expect(observed).toEqual(['a', 'b'])
    expect(RecordingIntersectionObserver.disconnected).toBe(1)
  })

  it('does not re-create the observer on unrelated re-renders', () => {
    stubIntersectionObserver()
    function C({ n }: { n: number }) {
      const { ref } = useInView()
      return <div data-n={n} ref={ref as React.RefObject<HTMLDivElement>} />
    }
    const { rerender } = render(<C n={1} />)
    rerender(<C n={2} />)
    rerender(<C n={3} />)
    expect(RecordingIntersectionObserver.observed).toHaveLength(1)
  })

  it('keeps observing under StrictMode', () => {
    stubIntersectionObserver()
    function C() {
      const { ref, inView } = useInView()
      return <div ref={ref as React.RefObject<HTMLDivElement>} data-testid="el">{String(inView)}</div>
    }
    const { getByTestId } = render(<React.StrictMode><C /></React.StrictMode>)
    expect(getByTestId('el').textContent).toBe('true')
    // simulated unmount disconnected the first observer, the remount re-observed
    expect(RecordingIntersectionObserver.observed.length).toBe(
      RecordingIntersectionObserver.disconnected + 1
    )
  })

  it('useInViewCallback fires for an element that mounts later', () => {
    stubIntersectionObserver()
    const callback = vi.fn()
    function C({ show }: { show: boolean }) {
      const ref = useInViewCallback(callback)
      return show ? <div ref={ref as React.RefObject<HTMLDivElement>} /> : null
    }
    const { rerender } = render(<C show={false} />)
    expect(callback).not.toHaveBeenCalled()
    rerender(<C show />)
    expect(callback).toHaveBeenCalledTimes(1)
  })
})

describe('useScroll with elements that mount later', () => {
  it('tracks a container that mounts after the hook', async () => {
    clock = installTestClock()
    let scroll!: UseScrollReturn
    let container: HTMLDivElement | null = null
    function C({ show }: { show: boolean }) {
      const ref = React.useRef<HTMLDivElement>(null)
      scroll = useScroll({ container: ref })
      return show ? (
        <div
          ref={(el) => {
            ref.current = el
            container = el
          }}
        />
      ) : null
    }
    const { rerender } = render(<C show={false} />)
    rerender(<C show />)
    expect(container).not.toBeNull()
    const el = container!
    setProp(el, 'scrollHeight', 1000)
    setProp(el, 'clientHeight', 200)
    el.scrollTop = 400

    act(() => {
      el.dispatchEvent(new Event('scroll'))
    })
    await step(32)
    expect(scroll.scrollY.get()).toBe(400)
    expect(scroll.scrollYProgress.get()).toBeCloseTo(0.5)
  })

  it('tracks a target that mounts after the hook', async () => {
    clock = installTestClock()
    let scroll!: UseScrollReturn
    let target: HTMLDivElement | null = null
    function C({ show }: { show: boolean }) {
      const ref = React.useRef<HTMLDivElement>(null)
      scroll = useScroll({ target: ref, offset: ['start end', 'end start'] })
      return show ? (
        <div
          ref={(el) => {
            ref.current = el
            target = el
            // halfway through: top = (innerHeight - height) / 2 ... progress 0.5
            if (el) el.getBoundingClientRect = () => rect(0, 334, 100, 100)
          }}
        />
      ) : null
    }
    const { rerender } = render(<C show={false} />)
    rerender(<C show />)
    expect(target).not.toBeNull()
    await step(32)
    // start = 768 - 334 = 434, end = -(434) => progress 434 / 868 = 0.5
    expect(scroll.scrollYProgress.get()).toBeCloseTo(0.5)
  })
})

describe('usePointer with a target that mounts later', () => {
  it('tracks hover on a conditionally rendered target', () => {
    let hovering = false
    let el: HTMLDivElement | null = null
    function C({ show }: { show: boolean }) {
      const ref = React.useRef<HTMLDivElement>(null)
      hovering = usePointer({ target: ref as React.RefObject<HTMLElement> }).isHovering
      return show ? (
        <div
          ref={(node) => {
            ref.current = node
            el = node
          }}
        />
      ) : null
    }
    const { rerender } = render(<C show={false} />)
    rerender(<C show />)
    act(() => {
      el!.dispatchEvent(new Event('pointerenter'))
    })
    expect(hovering).toBe(true)
  })
})

// ============ 2. horizontal useScroll ============

describe('useScroll axis: x', () => {
  it('measures target progress horizontally', async () => {
    clock = installTestClock()
    const target = document.createElement('div')
    document.body.appendChild(target)
    restores.push(() => target.remove())
    // innerWidth 1024, width 100: progress = (1024 - left) / 1124 = 0.5
    target.getBoundingClientRect = () => rect(462, 0, 100, 100)
    const ref = { current: target }

    const { result } = renderHook(() =>
      useScroll({ target: ref, axis: 'x', offset: ['start end', 'end start'] })
    )
    await step(32)
    expect(result.current.scrollXProgress.get()).toBeCloseTo(0.5)
  })

  it('measures target progress relative to its container', async () => {
    clock = installTestClock()
    const container = document.createElement('div')
    const target = document.createElement('div')
    container.appendChild(target)
    document.body.appendChild(container)
    restores.push(() => container.remove())
    container.getBoundingClientRect = () => rect(0, 100, 300, 200)
    setProp(container, 'clientHeight', 200)
    // container spans y 100..300; target (h=100) at top 150:
    // start = 300 - 150 = 150, end = 100 - 250 = -150 => progress 0.5
    target.getBoundingClientRect = () => rect(0, 150, 100, 100)

    const { result } = renderHook(() =>
      useScroll({
        target: { current: target },
        container: { current: container },
        offset: ['start end', 'end start'],
      })
    )
    await step(32)
    expect(result.current.scrollYProgress.get()).toBeCloseTo(0.5)
  })
})

// ============ 3. useScrollVelocity decay ============

describe('useScrollVelocity', () => {
  it('decays back to 0 after scrolling stops', () => {
    clock = installTestClock({ timers: true })
    setProp(window, 'scrollY', 0)
    setProp(window, 'pageYOffset', 0)
    const { result } = renderHook(() => useScrollVelocity())

    act(() => clock!.advance(16))
    setProp(window, 'scrollY', 100)
    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })
    expect(result.current.get()).toBeGreaterThan(0)

    act(() => clock!.advance(300))
    expect(result.current.get()).toBe(0)
  })

  it('does not report the initial scroll offset as velocity', () => {
    clock = installTestClock({ timers: true })
    setProp(window, 'scrollY', 5000)
    const { result } = renderHook(() => useScrollVelocity())
    act(() => clock!.advance(1000))
    setProp(window, 'scrollY', 5010)
    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })
    // 10px over 1s, not 5010px
    expect(result.current.get()).toBeCloseTo(10)
  })
})

// ============ 4. physics hooks read latest options ============

describe('physics hooks use the latest options while running', () => {
  it('useMomentum calls the latest onRest', () => {
    clock = installTestClock()
    const first = vi.fn()
    const second = vi.fn()
    const { result, rerender } = renderHook(
      ({ onRest }) => useMomentum({ friction: 0.5, onRest }),
      { initialProps: { onRest: first } }
    )
    act(() => result.current.push(10))
    rerender({ onRest: second })
    act(() => clock!.advance(1000))
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('useBounce uses the latest floor', () => {
    clock = installTestClock()
    const { result, rerender } = renderHook(
      ({ floor }) => useBounce({ floor, gravity: 2 }),
      { initialProps: { floor: 300 } }
    )
    act(() => result.current.drop(0))
    rerender({ floor: 50 })
    act(() => clock!.advance(5000))
    expect(result.current.value.get()).toBeLessThanOrEqual(50)
  })

  it('useGravity uses the latest bounds', () => {
    clock = installTestClock()
    const { result, rerender } = renderHook(
      ({ bottom }) => useGravity({ bounds: { bottom } }),
      { initialProps: { bottom: 300 } }
    )
    act(() => result.current.launch({ x: 0, y: 0 }))
    rerender({ bottom: 50 })
    act(() => clock!.advance(3000))
    expect(result.current.y.get()).toBeLessThanOrEqual(50)
    act(() => result.current.stop())
  })
})

// ============ 5. useVariants stagger ============

describe('useVariants stagger', () => {
  const variants = { hidden: { opacity: 0 }, visible: { opacity: 1 } }
  const spring = { stiffness: 1000, damping: 100 }

  it('delays a staggered child by staggerIndex * staggerChildren', async () => {
    clock = installTestClock({ timers: true })
    let opacity: unknown = -1
    function Child() {
      opacity = useVariants({ variants, initial: 'hidden', spring }).values.opacity
      return null
    }
    render(
      <VariantContext.Provider
        value={{ variant: 'visible', transition: { staggerChildren: 100 }, staggerIndex: 3 }}
      >
        <Child />
      </VariantContext.Provider>
    )
    await step(250)
    expect(opacity).toBe(0)
    await step(1000)
    expect(opacity).toBeGreaterThan(0.9)
  })

  it('applies the variant transition delay', async () => {
    clock = installTestClock({ timers: true })
    const delayed = {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { delay: 300 } },
    }
    let opacity: unknown = -1
    function C() {
      opacity = useVariants({ variants: delayed, initial: 'hidden', animate: 'visible', spring }).values.opacity
      return null
    }
    render(<C />)
    await step(250)
    expect(opacity).toBe(0)
    await step(1000)
    expect(opacity).toBeGreaterThan(0.9)
  })
})

// ============ 6. useMorph controller ============

describe('useMorph controller', () => {
  const PATH_A = 'M0,0 L10,0 L10,10 Z'
  const PATH_B = 'M0,0 L20,0 L20,20 Z'

  it('is available on the first render', () => {
    const controllers: Array<MorphController | null> = []
    function C() {
      controllers.push(useMorph(PATH_A).controller)
      return null
    }
    render(<C />)
    expect(controllers[0]).not.toBeNull()
  })

  it('exposes a live controller under StrictMode that drives `path`', async () => {
    clock = installTestClock()
    let controller: MorphController | null = null
    let path = ''
    function C() {
      const morph = useMorph(PATH_A)
      controller = morph.controller
      path = morph.path
      return null
    }
    render(<React.StrictMode><C /></React.StrictMode>)
    expect(controller).not.toBeNull()
    const initial = path
    act(() => controller!.morphTo(PATH_B))
    await step(1000)
    expect(path).not.toBe(initial)
  })
})

describe('useMorph initialPath', () => {
  it('replaces (and destroys) the controller when initialPath changes', () => {
    const PATH_A = 'M0,0 L10,0 L10,10 Z'
    const PATH_B = 'M0,0 L20,0 L20,20 Z'
    const { result, rerender } = renderHook(({ p }) => useMorph(p), {
      initialProps: { p: PATH_A },
    })
    const first = result.current.controller!
    const destroy = vi.spyOn(first, 'destroy')
    rerender({ p: PATH_B })
    expect(result.current.controller).not.toBe(first)
    expect(destroy).toHaveBeenCalled()
  })
})

// ============ 7. useGyroscope mouse fallback ============

describe('useGyroscope', () => {
  function defineOrientationEvent() {
    setProp(window, 'DeviceOrientationEvent', class extends Event {})
  }

  it('falls back to the mouse when DeviceOrientationEvent exists but never fires', () => {
    clock = installTestClock({ timers: true })
    defineOrientationEvent()
    const { result } = renderHook(() => useGyroscope({ smooth: 1 }))
    // desktop Chrome: a single event with null values
    act(() => {
      window.dispatchEvent(new Event('deviceorientation'))
    })
    act(() => clock!.advance(1000))
    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: window.innerWidth, clientY: window.innerHeight / 2 }))
    })
    act(() => clock!.advance(50))
    expect(result.current.isSupported).toBe(false)
    expect(result.current.tiltX.get()).toBeCloseTo(45)
  })

  it('uses orientation (not the mouse) when real orientation events arrive', () => {
    clock = installTestClock({ timers: true })
    defineOrientationEvent()
    const { result } = renderHook(() => useGyroscope({ smooth: 1 }))
    act(() => {
      const event = new Event('deviceorientation') as Event & { gamma: number; beta: number }
      Object.assign(event, { gamma: 10, beta: 5 })
      window.dispatchEvent(event)
    })
    act(() => clock!.advance(1000))
    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 0, clientY: 0 }))
    })
    act(() => clock!.advance(50))
    expect(result.current.isSupported).toBe(true)
    expect(result.current.tiltX.get()).toBeCloseTo(10)
    expect(result.current.tiltY.get()).toBeCloseTo(5)
  })
})

// ============ 8. useTimeline seek ============

describe('useTimeline seek', () => {
  function setup() {
    const { result } = renderHook(() => useTimeline())
    act(() => {
      result.current.to({ x: 0 } as never, { x: 100, duration: 1000 } as never)
    })
    return result
  }

  it('seek() takes a time in ms (same as Timeline.seek)', () => {
    const result = setup()
    act(() => result.current.seek(250))
    expect(result.current.progress).toBeCloseTo(0.25)
  })

  it('seekProgress() takes a 0-1 progress', () => {
    const result = setup()
    act(() => result.current.seekProgress(0.5))
    expect(result.current.progress).toBeCloseTo(0.5)
  })
})
