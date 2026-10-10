import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, act, cleanup, fireEvent } from '@testing-library/react'
import * as React from 'react'
import { Parallax, TiltCard, MouseParallax, Magnetic } from '@oxog/springkit/react'
import { clearWarnings } from '@oxog/springkit'
import { installTestClock, type TestClock } from '@oxog/springkit/testing'

// jsdom has no layout and no IntersectionObserver delivery: getBoundingClientRect,
// window.innerWidth/innerHeight and IntersectionObserver are mocked at the seam.

let clock: TestClock | null = null
let ioCallback: IntersectionObserverCallback | null = null
const realIO = (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver
const realInnerHeight = window.innerHeight
const realInnerWidth = window.innerWidth

class FakeIntersectionObserver {
  constructor(cb: IntersectionObserverCallback) {
    ioCallback = cb
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

// Reports the element as in view as soon as it is observed
class InViewIntersectionObserver {
  private callback: IntersectionObserverCallback
  constructor(cb: IntersectionObserverCallback) {
    this.callback = cb
  }
  observe() {
    this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
  }
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

afterEach(() => {
  cleanup()
  clock?.uninstall()
  clock = null
  ;(globalThis as { IntersectionObserver?: unknown }).IntersectionObserver = realIO
  Object.defineProperty(window, 'innerHeight', { value: realInnerHeight, configurable: true })
  Object.defineProperty(window, 'innerWidth', { value: realInnerWidth, configurable: true })
  ioCallback = null
  vi.restoreAllMocks()
})

type Rect = { top: number; left: number; width: number; height: number }

function mockRect(getRect: () => Rect) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => {
    const r = getRect()
    return {
      ...r,
      right: r.left + r.width,
      bottom: r.top + r.height,
      x: r.left,
      y: r.top,
      toJSON: () => ({}),
    } as DOMRect
  })
}

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true })
  Object.defineProperty(window, 'innerHeight', { value: height, configurable: true })
}

describe('Parallax (audit F2001): latest batched IntersectionObserver entry wins', () => {
  async function setup() {
    clock = installTestClock()
    ;(globalThis as { IntersectionObserver?: unknown }).IntersectionObserver = FakeIntersectionObserver
    setViewport(1000, 800)
    const state = { top: 600, scrollListeners: 0 }
    mockRect(() => ({ top: state.top, left: 0, width: 100, height: 100 }))
    const origAdd = window.addEventListener.bind(window)
    const origRemove = window.removeEventListener.bind(window)
    vi.spyOn(window, 'addEventListener').mockImplementation(((type: string, ...rest: unknown[]) => {
      if (type === 'scroll') state.scrollListeners++
      return (origAdd as (...a: unknown[]) => void)(type, ...rest)
    }) as typeof window.addEventListener)
    vi.spyOn(window, 'removeEventListener').mockImplementation(((type: string, ...rest: unknown[]) => {
      if (type === 'scroll') state.scrollListeners--
      return (origRemove as (...a: unknown[]) => void)(type, ...rest)
    }) as typeof window.removeEventListener)
    const utils = render(
      <Parallax speed={0.5}>
        <span>x</span>
      </Parallax>
    )
    await act(async () => {
      clock!.runAll()
    })
    const deliver = async (batch: boolean[]) => {
      await act(async () => {
        ioCallback!(batch.map((isIntersecting) => ({ isIntersecting }) as IntersectionObserverEntry), {} as IntersectionObserver)
      })
    }
    const scrollTo = async (top: number) => {
      state.top = top
      await act(async () => {
        window.dispatchEvent(new Event('scroll'))
        clock!.runAll()
      })
      return (utils.container.firstChild as HTMLElement).style.transform
    }
    return { state, deliver, scrollTo }
  }

  it('control: a single in-view entry tracks the scroll position', async () => {
    const s = await setup()
    await s.deliver([true])
    expect(s.state.scrollListeners).toBe(1)
    expect(await s.scrollTo(200)).toBe('translateY(-18.75px)')
  })

  it('a batch whose latest entry is in view starts tracking even if the oldest was out of view', async () => {
    const s = await setup()
    await s.deliver([false, true])
    expect(s.state.scrollListeners).toBe(1)
    expect(await s.scrollTo(200)).toBe('translateY(-18.75px)')
  })

  it('a batch whose latest entry is out of view stops tracking even if the oldest was in view', async () => {
    const s = await setup()
    await s.deliver([true])
    expect(await s.scrollTo(200)).toBe('translateY(-18.75px)')
    await s.deliver([true, false])
    expect(s.state.scrollListeners).toBe(0)
    expect(await s.scrollTo(700)).toBe('translateY(-18.75px)')
  })
})

describe('Parallax / MouseParallax / TiltCard (audit F2002): zero-size viewport or element', () => {
  async function renderParallax(innerW: number, innerH: number, rect: Rect, props: Partial<React.ComponentProps<typeof Parallax>>) {
    clock = installTestClock()
    ;(globalThis as { IntersectionObserver?: unknown }).IntersectionObserver = InViewIntersectionObserver
    setViewport(innerW, innerH)
    mockRect(() => rect)
    clearWarnings()
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { container } = render(
      <Parallax speed={0.5} {...props}>
        <span>x</span>
      </Parallax>
    )
    await act(async () => {
      clock!.runAll()
    })
    const out = { transform: (container.firstChild as HTMLElement).style.transform, errors: errors.mock.calls.length }
    cleanup()
    clock.uninstall()
    clock = null
    return out
  }

  it('control: normal viewport keeps the offset and the scroll contribution', async () => {
    expect(await renderParallax(1000, 800, { top: 350, left: 450, width: 100, height: 100 }, { offset: { y: 10 } })).toEqual({
      transform: 'translateY(10px)',
      errors: 0,
    })
    expect((await renderParallax(1000, 800, { top: 600, left: 450, width: 100, height: 100 }, {})).transform).toBe('translateY(31.25px)')
  })

  it('a zero-height viewport keeps the offset instead of dropping it via a non-finite value', async () => {
    expect(await renderParallax(1000, 0, { top: 100, left: 450, width: 100, height: 100 }, { offset: { y: 10 } })).toEqual({
      transform: 'translateY(10px)',
      errors: 0,
    })
  })

  it('a zero-width viewport keeps the horizontal offset', async () => {
    expect(
      await renderParallax(0, 800, { top: 350, left: 450, width: 100, height: 100 }, { direction: 'horizontal', offset: { x: 7 } })
    ).toEqual({ transform: 'translateX(7px)', errors: 0 })
  })

  it('MouseParallax with a zero-size container rests at 0 without logging an invalid-value error', async () => {
    clock = installTestClock()
    mockRect(() => ({ top: 0, left: 0, width: 0, height: 0 }))
    clearWarnings()
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    const holder = React.createRef<HTMLDivElement>()
    const { container } = render(
      <div ref={holder}>
        <MouseParallax strength={20} container={holder as React.RefObject<HTMLElement>}>
          <span>x</span>
        </MouseParallax>
      </div>
    )
    await act(async () => {
      holder.current!.dispatchEvent(new MouseEvent('mousemove', { clientX: 5, clientY: 3 }))
      clock!.runAll()
    })
    expect((container.querySelectorAll('div')[1] as HTMLElement).style.transform).toBe('translate(0px, 0px)')
    expect(errors).not.toHaveBeenCalled()
  })

  it('TiltCard reports finite tilt values and glare position for a zero-size card', () => {
    mockRect(() => ({ top: 0, left: 0, width: 0, height: 0 }))
    const calls: Array<[number, number]> = []
    const { container } = render(
      <TiltCard glare onTilt={(x, y) => calls.push([x, y])}>
        <span>x</span>
      </TiltCard>
    )
    fireEvent.mouseMove(container.firstChild as HTMLElement, { clientX: 5, clientY: 3 })
    expect(calls).toHaveLength(1)
    expect(Number.isFinite(calls[0]![0])).toBe(true)
    expect(Number.isFinite(calls[0]![1])).toBe(true)
    expect(container.innerHTML).not.toMatch(/Infinity|NaN/)
  })

  it('TiltCard control: a normal card still tilts proportionally to the pointer position', () => {
    mockRect(() => ({ top: 0, left: 0, width: 100, height: 100 }))
    const calls: Array<[number, number]> = []
    const { container } = render(
      <TiltCard onTilt={(x, y) => calls.push([x, y])}>
        <span>x</span>
      </TiltCard>
    )
    fireEvent.mouseMove(container.firstChild as HTMLElement, { clientX: 5, clientY: 3 })
    expect(calls[0]![0]).toBeCloseTo(9.4, 5)
    expect(calls[0]![1]).toBeCloseTo(-9, 5)
  })
})

describe('Magnetic (audit F2003): throwing onAttract / onRelease callbacks are isolated', () => {
  class Boundary extends React.Component<{ children: React.ReactNode; onError: (e: unknown) => void }, { failed: boolean }> {
    override state = { failed: false }
    static getDerivedStateFromError() {
      return { failed: true }
    }
    override componentDidCatch(e: unknown) {
      this.props.onError(e)
    }
    override render() {
      return this.state.failed ? <p>crashed</p> : this.props.children
    }
  }

  function setup(callbacks: { onAttract?: () => void; onRelease?: () => void }) {
    clock = installTestClock()
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockRect(() => ({ top: 50, left: 50, width: 100, height: 100 }))
    const caught: unknown[] = []
    const ui = (enabled: boolean) => (
      <Boundary onError={(e) => caught.push(e)}>
        <Magnetic enabled={enabled} strength={0.5} range={100} {...callbacks}>
          <span data-testid="child">x</span>
        </Magnetic>
      </Boundary>
    )
    const utils = render(ui(true))
    const wrapper = () => utils.container.querySelector('[data-testid="child"]')!.parentElement as HTMLElement
    const move = async (x: number) => {
      await act(async () => {
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: 100 }))
        clock!.runAll()
      })
    }
    const setEnabled = async (enabled: boolean) => {
      await act(async () => {
        utils.rerender(ui(enabled))
      })
      await act(async () => {
        clock!.runAll()
      })
    }
    return { caught, logged, utils, wrapper, move, setEnabled }
  }

  it('control: a well-behaved onRelease fires once when the component is disabled while attracted', async () => {
    const onRelease = vi.fn()
    const s = setup({ onRelease })
    await s.move(130)
    expect(s.wrapper().style.transform).toBe('translate(10.5px, 0px) scale(1)')
    await s.setEnabled(false)
    expect(onRelease).toHaveBeenCalledTimes(1)
    expect(s.caught).toHaveLength(0)
    expect(s.wrapper().style.transform).toBe('translate(0px, 0px) scale(1)')
  })

  it('a throwing onRelease during disable neither unmounts the tree nor stops the element recentring', async () => {
    const onRelease = vi.fn(() => {
      throw new Error('boom-release')
    })
    const s = setup({ onRelease })
    await s.move(130)
    await s.setEnabled(false)
    expect(onRelease).toHaveBeenCalledTimes(1)
    expect(s.caught).toHaveLength(0)
    expect(s.utils.queryByTestId('child')).not.toBeNull()
    expect(s.wrapper().style.transform).toBe('translate(0px, 0px) scale(1)')
    expect(s.logged.mock.calls.some((c) => c[0] === '[SpringKit]' && String(c[1]).includes('boom-release'))).toBe(true)
  })

  it('a throwing onAttract still applies the attraction and keeps the release bookkeeping intact', async () => {
    const onAttract = vi.fn(() => {
      throw new Error('boom-attract')
    })
    const onRelease = vi.fn()
    const s = setup({ onAttract, onRelease })
    await s.move(130)
    await s.move(135)
    expect(onAttract).toHaveBeenCalledTimes(1)
    expect(s.wrapper().style.transform).not.toBe('translate(0px, 0px) scale(1)')
    await s.move(900)
    expect(onRelease).toHaveBeenCalledTimes(1)
    expect(s.caught).toHaveLength(0)
  })
})
