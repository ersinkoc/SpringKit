/**
 * Audit regressions for useInView / useInViewCallback / useInViewMultiple / useScroll
 * (round F24xx). jsdom has no layout: IntersectionObserver, scroll metrics and
 * getBoundingClientRect are mocked at the seam.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, act, cleanup } from '@testing-library/react'
import * as React from 'react'
import { installTestClock, type TestClock } from '../../../src/testing'
import {
  useInView,
  useInViewCallback,
  useInViewMultiple,
  type UseInViewOptions,
} from '../../../src/adapters/react/hooks/useInView'
import { useScroll, type UseScrollReturn } from '../../../src/adapters/react/hooks/useScroll'

const instances: MockIO[] = []
class MockIO {
  callback: IntersectionObserverCallback
  observed = new Set<Element>()
  disconnected = false
  constructor(cb: IntersectionObserverCallback) {
    this.callback = cb
    instances.push(this)
  }
  observe(t: Element) { this.observed.add(t) }
  unobserve(t: Element) { this.observed.delete(t) }
  disconnect() { this.disconnected = true; this.observed.clear() }
  takeRecords() { return [] }
  /** Deliver one batch (oldest first) for the first observed element, or the element with `id` */
  deliver(flags: boolean[], id?: string) {
    const target = id
      ? document.querySelector(`[data-inview-id="${id}"]`)!
      : [...this.observed][0] ?? lastTarget!
    lastTarget = target
    const entries = flags.map((f, i) => ({
      isIntersecting: f,
      intersectionRatio: f ? 1 : 0,
      target,
      time: i,
    } as unknown as IntersectionObserverEntry))
    this.callback(entries, this as unknown as IntersectionObserver)
  }
}
let lastTarget: Element | null = null

beforeEach(() => {
  instances.length = 0
  lastTarget = null
  vi.stubGlobal('IntersectionObserver', MockIO)
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function mountInView(opts: UseInViewOptions = {}) {
  const out = { inView: false }
  function C() {
    const r = useInView(opts)
    out.inView = r.inView
    return <div ref={r.ref as React.RefObject<HTMLDivElement>} />
  }
  render(<C />)
  return { out, io: instances[instances.length - 1]! }
}

describe('F2401: batched IntersectionObserver entries (oldest first)', () => {
  it('useInView reports the latest entry of a batch', () => {
    const { out, io } = mountInView()
    act(() => io.deliver([true]))
    expect(out.inView).toBe(true)
    act(() => io.deliver([true, false]))
    expect(out.inView).toBe(false)
    act(() => io.deliver([false, true]))
    expect(out.inView).toBe(true)
  })

  it('useInView with once treats any intersecting entry of the batch as an enter', () => {
    const { out, io } = mountInView({ once: true })
    act(() => io.deliver([true, false]))
    expect(out.inView).toBe(true)
    expect(io.disconnected).toBe(true)
  })

  it('useInView ignores an empty batch', () => {
    const { out, io } = mountInView()
    act(() => io.deliver([]))
    expect(out.inView).toBe(false)
  })

  it('useInViewCallback fires when the batch ends with an enter', () => {
    const calls: boolean[] = []
    function C() {
      const ref = useInViewCallback((e) => { calls.push(e.isIntersecting) })
      return <div ref={ref as React.RefObject<HTMLDivElement>} />
    }
    render(<C />)
    const io = instances[instances.length - 1]!
    act(() => io.deliver([false]))
    expect(calls).toEqual([])
    act(() => io.deliver([false, true]))
    expect(calls).toEqual([true])
  })

  it('useInViewCallback with once fires a single time and disconnects', () => {
    const cb = vi.fn()
    function C() {
      const ref = useInViewCallback(cb, { once: true })
      return <div ref={ref as React.RefObject<HTMLDivElement>} />
    }
    render(<C />)
    const io = instances[instances.length - 1]!
    act(() => io.deliver([false, true]))
    expect(cb).toHaveBeenCalledTimes(1)
    expect(io.disconnected).toBe(true)
  })
})

describe('F2402: useInViewMultiple once is not undone by a later "left" entry', () => {
  function run(once: boolean, batches: Array<[boolean[], string]>) {
    let api!: ReturnType<typeof useInViewMultiple>
    function C() {
      api = useInViewMultiple({ once })
      return (
        <div>
          <div ref={(el) => api.setRef('a', el)} />
          <div ref={(el) => api.setRef('b', el)} />
        </div>
      )
    }
    render(<C />)
    const io = instances[instances.length - 1]!
    for (const [flags, id] of batches) act(() => io.deliver(flags, id))
    return { api, io }
  }

  it('keeps the element in view for [enter, leave] in one batch and stays unobserved', () => {
    const { api, io } = run(true, [[[true, false], 'a']])
    expect(api.getInView('a')).toBe(true)
    expect(io.observed.size).toBe(1) // only "b" is still observed
  })

  it('ignores a later separate "left" delivery after the enter', () => {
    const { api } = run(true, [[[true], 'a'], [[false], 'a']])
    expect(api.getInView('a')).toBe(true)
  })

  it('without once the latest entry still wins', () => {
    const { api } = run(false, [[[true, false], 'a']])
    expect(api.getInView('a')).toBe(false)
  })

  it('once: an element that has not entered yet stays false and observed', () => {
    const { api, io } = run(true, [[[false], 'a']])
    expect(api.getInView('a')).toBe(false)
    expect(io.observed.size).toBe(2)
  })
})

describe('F2403: useScroll progress stays finite and within 0..1', () => {
  let clock: TestClock | null = null
  afterEach(() => {
    clock?.uninstall()
    clock = null
  })

  function setMetrics(scrollY: number) {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: scrollY })
    Object.defineProperty(window, 'pageYOffset', { configurable: true, value: scrollY })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1000 })
    Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: 2000 })
  }

  function pageProgress(scrollY: number): number {
    clock = installTestClock({ startTime: 0 })
    setMetrics(scrollY)
    let s!: UseScrollReturn
    function C() { s = useScroll(); return <div /> }
    render(<C />)
    act(() => { clock!.advance(32) })
    const v = s.scrollYProgress.get()
    cleanup()
    clock.uninstall()
    clock = null
    return v
  }

  function targetProgress(offset: [string, string]): number {
    clock = installTestClock({ startTime: 0 })
    setMetrics(0)
    let s!: UseScrollReturn
    function C() {
      const ref = React.useRef<HTMLDivElement>(null)
      s = useScroll({ target: ref, offset })
      return <div ref={ref} />
    }
    const { container } = render(<C />)
    const el = container.firstElementChild as HTMLElement
    el.getBoundingClientRect = () => ({
      top: 500, bottom: 700, left: 0, right: 100, width: 100, height: 200, x: 0, y: 500, toJSON: () => ({}),
    }) as DOMRect
    window.dispatchEvent(new Event('scroll'))
    act(() => { clock!.advance(32) })
    const v = s.scrollYProgress.get()
    cleanup()
    clock.uninstall()
    clock = null
    return v
  }

  it('is proportional inside the scroll range', () => {
    expect(pageProgress(500)).toBe(0.5)
  })

  it('clamps overscroll (rubber-banding) to 0 and 1', () => {
    expect(pageProgress(-100)).toBe(0)
    expect(pageProgress(1200)).toBe(1)
  })

  it('does not store NaN for a malformed target offset', () => {
    expect(targetProgress(['abc px', 'end start'])).toBe(0)
    expect(targetProgress(['start end', 'end start'])).toBeCloseTo(500 / 1200, 6)
  })
})
