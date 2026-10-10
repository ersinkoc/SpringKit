import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createParallax } from '@oxog/springkit'
import { installTestClock, type TestClock } from '../../../src/testing'

describe('createParallax audit regressions (F501, F503)', () => {
  let clock: TestClock
  let ioCallback: IntersectionObserverCallback | null = null
  const RealIO = globalThis.IntersectionObserver
  const realHeight = window.innerHeight

  beforeEach(() => {
    clock = installTestClock()
    ioCallback = null
    globalThis.IntersectionObserver = class {
      constructor(cb: IntersectionObserverCallback) {
        ioCallback = cb
      }
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return []
      }
    } as unknown as typeof IntersectionObserver
  })

  afterEach(() => {
    clock.uninstall()
    globalThis.IntersectionObserver = RealIO
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: realHeight })
    document.body.textContent = ''
  })

  const entry = (isIntersecting: boolean) => ({ isIntersecting }) as IntersectionObserverEntry

  const makeElement = () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    el.getBoundingClientRect = () =>
      ({ top: 100, bottom: 200, left: 0, right: 100, width: 100, height: 100, x: 0, y: 100, toJSON() {} }) as DOMRect
    return el
  }

  it('F501: applies the latest entry of a batched IntersectionObserver delivery', () => {
    const el = makeElement()
    const parallax = createParallax(el)

    // The element entered and left the viewport before the callback ran
    ioCallback!([entry(true), entry(false)], {} as IntersectionObserver)
    expect(parallax.getOffset()).toBe(0)

    // Scroll-driven updates stay off while the latest state is "out of view"
    window.dispatchEvent(new Event('scroll'))
    clock.advance(100)
    expect(parallax.getOffset()).toBe(0)

    // Left then entered: in view
    ioCallback!([entry(false), entry(true)], {} as IntersectionObserver)
    expect(parallax.getOffset()).not.toBe(0)
    parallax.destroy()
  })

  it('F503: keeps the offset finite when the viewport has no height', () => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 0 })
    const el = makeElement()
    const parallax = createParallax(el)
    ioCallback!([entry(true)], {} as IntersectionObserver)

    expect(parallax.getOffset()).toBe(0)
    expect(el.style.transform).not.toMatch(/NaN|Infinity/)
    parallax.destroy()
  })
})
