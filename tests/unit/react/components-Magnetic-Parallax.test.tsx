import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, act, cleanup, fireEvent } from '@testing-library/react'
import * as React from 'react'
import { Magnetic, Parallax, TiltCard, MouseParallax } from '@oxog/springkit/react'

function useAnimationClock() {
  vi.useFakeTimers({
    toFake: [
      'setTimeout',
      'clearTimeout',
      'setInterval',
      'clearInterval',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'performance',
      'Date',
    ],
  })
}

async function advanceFrames(frames: number) {
  for (let i = 0; i < frames; i++) {
    await act(async () => {
      vi.advanceTimersByTime(16)
    })
  }
}

function mockRect(el: HTMLElement, rect: { left: number; top: number; width: number; height: number }) {
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

function parseTranslate(transform: string): { x: number; y: number } {
  const match = /translate\(([-\d.e]+)px, ([-\d.e]+)px\)/.exec(transform)
  return { x: Number(match?.[1] ?? NaN), y: Number(match?.[2] ?? NaN) }
}

describe('Magnetic / Parallax (regressions)', () => {
  beforeEach(() => {
    useAnimationClock()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('Magnetic with the default config animates all the way to the target', async () => {
    const { container } = render(
      <Magnetic strength={0.5} range={200}>
        <span>x</span>
      </Magnetic>
    )
    const el = container.firstChild as HTMLElement
    mockRect(el, { left: 0, top: 0, width: 100, height: 100 })

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 50 }))
    })
    await advanceFrames(150)

    // distance 50, factor 0.75 -> 50 * 0.5 * 0.75
    expect(parseTranslate(el.style.transform).x).toBeCloseTo(18.75, 1)
  })

  it('Magnetic keeps animating when re-rendered with an equal inline config', async () => {
    const ui = (n: number) => (
      <Magnetic strength={0.5} range={200} config={{ stiffness: 200, damping: 20 }}>
        <span>{n}</span>
      </Magnetic>
    )
    const { container, rerender } = render(ui(0))
    const el = container.firstChild as HTMLElement
    mockRect(el, { left: 0, top: 0, width: 100, height: 100 })

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 50 }))
    })
    await advanceFrames(2)
    rerender(ui(1))
    await advanceFrames(150)

    expect(parseTranslate(el.style.transform).x).toBeCloseTo(18.75, 1)
  })

  it('Magnetic returns to center when disabled while attracted', async () => {
    const onRelease = vi.fn()
    const ui = (enabled: boolean) => (
      <Magnetic strength={0.5} range={200} enabled={enabled} onRelease={onRelease}>
        <span>x</span>
      </Magnetic>
    )
    const { container, rerender } = render(ui(true))
    const el = container.firstChild as HTMLElement
    mockRect(el, { left: 0, top: 0, width: 100, height: 100 })

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 50 }))
    })
    await advanceFrames(150)
    expect(parseTranslate(el.style.transform).x).toBeGreaterThan(10)

    rerender(ui(false))
    await advanceFrames(150)

    expect(Math.abs(parseTranslate(el.style.transform).x)).toBeLessThan(0.1)
    expect(onRelease).toHaveBeenCalledTimes(1)
  })

  it('Parallax with the default config animates to the scroll target', async () => {
    // Element is in view immediately (don't depend on other files' observer mocks)
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
      <Parallax speed={0.5}>
        <span>x</span>
      </Parallax>
    )
    const el = container.firstChild as HTMLElement
    mockRect(el, { left: 0, top: 0, width: 100, height: 100 })

    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })
    await advanceFrames(200)

    const centerY = (50 - window.innerHeight / 2) / window.innerHeight
    const expected = centerY * 0.5 * 200
    const match = /translateY\(([-\d.e]+)px\)/.exec(el.style.transform)
    expect(Number(match?.[1])).toBeCloseTo(expected, 0)
  })

  it('MouseParallax with the default config animates to the target', async () => {
    const { container } = render(
      <MouseParallax strength={20}>
        <span>x</span>
      </MouseParallax>
    )
    const el = container.firstChild as HTMLElement

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: window.innerWidth, clientY: window.innerHeight / 2 }))
    })
    await advanceFrames(200)

    expect(parseTranslate(el.style.transform).x).toBeCloseTo(20, 0)
  })

  it('TiltCard with the default config animates to the target tilt', async () => {
    const { container } = render(
      <TiltCard maxTilt={20}>
        <span>x</span>
      </TiltCard>
    )
    const outer = container.firstChild as HTMLElement
    const inner = outer.firstChild as HTMLElement
    mockRect(outer, { left: 0, top: 0, width: 100, height: 100 })

    fireEvent.mouseMove(outer, { clientX: 100, clientY: 50 })
    await advanceFrames(150)

    const match = /rotateY\(([-\d.e]+)deg\)/.exec(inner.style.transform)
    expect(Number(match?.[1])).toBeCloseTo(10, 0)
  })
})
