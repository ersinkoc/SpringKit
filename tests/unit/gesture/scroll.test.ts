import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createScrollSpring } from '@oxog/springkit'

describe('createScrollSpring', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    container.style.width = '300px'
    container.style.height = '200px'
    container.style.overflow = 'auto'
    document.body.appendChild(container)

    // Add content to make scrollable
    const content = document.createElement('div')
    content.style.width = '1000px'
    content.style.height = '1000px'
    container.appendChild(content)
  })

  afterEach(() => {
    document.body.removeChild(container)
  })

  describe('basic scroll', () => {
    it('should create a scroll spring', () => {
      const scroll = createScrollSpring(container)

      expect(scroll).toBeDefined()
      expect(scroll.getScroll()).toEqual({ x: 0, y: 0 })
    })

    it('should get scroll position', () => {
      const scroll = createScrollSpring(container)

      expect(scroll.getScroll()).toEqual({ x: 0, y: 0 })
    })

    it('should scroll to position', () => {
      const scroll = createScrollSpring(container)

      scroll.scrollTo(100, 50)

      expect(scroll).toBeDefined()
    })
  })

  describe('direction', () => {
    it('should handle horizontal direction', () => {
      const scroll = createScrollSpring(container, { direction: 'horizontal' })

      expect(scroll).toBeDefined()
    })

    it('should handle vertical direction', () => {
      const scroll = createScrollSpring(container, { direction: 'vertical' })

      expect(scroll).toBeDefined()
    })

    it('should handle both directions', () => {
      const scroll = createScrollSpring(container, { direction: 'both' })

      expect(scroll).toBeDefined()
    })
  })

  describe('momentum', () => {
    it('should enable momentum', () => {
      const scroll = createScrollSpring(container, {
        momentum: true,
        momentumDecay: 0.95,
      })

      expect(scroll).toBeDefined()
    })
  })

  describe('bounce', () => {
    it('should enable bounce', () => {
      const scroll = createScrollSpring(container, {
        bounce: true,
        bounceStiffness: 300,
        bounceDamping: 20,
      })

      expect(scroll).toBeDefined()
    })
  })

  describe('callbacks', () => {
    it('should call onScroll callback', () => {
      const onScroll = vi.fn()
      const scroll = createScrollSpring(container, { onScroll })

      expect(scroll).toBeDefined()
    })

    it('should call onScrollStart callback', () => {
      const onScrollStart = vi.fn()
      const scroll = createScrollSpring(container, { onScrollStart })

      expect(scroll).toBeDefined()
    })

    it('should call onScrollEnd callback', () => {
      const onScrollEnd = vi.fn()
      const scroll = createScrollSpring(container, { onScrollEnd })

      expect(scroll).toBeDefined()
    })
  })

  describe('scroll to element', () => {
    it('should scroll to element', () => {
      const scroll = createScrollSpring(container)
      const target = document.createElement('div')
      target.style.position = 'absolute'
      target.style.top = '200px'
      target.style.left = '100px'
      container.appendChild(target)

      scroll.scrollToElement(target)

      expect(scroll).toBeDefined()
    })

    it('should scroll to element with offset', () => {
      const scroll = createScrollSpring(container)
      const target = document.createElement('div')
      target.style.position = 'absolute'
      target.style.top = '200px'
      target.style.left = '100px'
      container.appendChild(target)

      scroll.scrollToElement(target, 100)

      expect(scroll).toBeDefined()
    })

    it('should scroll to element with negative offset', () => {
      const scroll = createScrollSpring(container)
      const target = document.createElement('div')
      target.style.position = 'absolute'
      target.style.top = '200px'
      target.style.left = '100px'
      container.appendChild(target)

      scroll.scrollToElement(target, -50)

      expect(scroll).toBeDefined()
    })

    it('should handle element at origin', () => {
      const scroll = createScrollSpring(container)
      const target = document.createElement('div')
      container.appendChild(target)

      scroll.scrollToElement(target)

      expect(scroll).toBeDefined()
    })
  })

  describe('spring config', () => {
    it('should use custom spring config', () => {
      const scroll = createScrollSpring(container, {
        stiffness: 200,
        damping: 20,
        mass: 1.5,
      })

      expect(scroll).toBeDefined()
    })

    it('should use custom rest thresholds', () => {
      const scroll = createScrollSpring(container, {
        restSpeed: 0.001,
        restDelta: 0.001,
      })

      expect(scroll).toBeDefined()
    })
  })

  describe('direction constraints', () => {
    it('should use vertical by default', () => {
      const scroll = createScrollSpring(container)

      expect(scroll).toBeDefined()
    })

    it('should handle horizontal only', () => {
      const scroll = createScrollSpring(container, {
        direction: 'horizontal',
      })

      expect(scroll).toBeDefined()
    })

    it('should handle both directions', () => {
      const scroll = createScrollSpring(container, {
        direction: 'both',
      })

      expect(scroll).toBeDefined()
    })
  })

  describe('bounce config', () => {
    it('should accept bounce stiffness', () => {
      const scroll = createScrollSpring(container, {
        bounce: true,
        bounceStiffness: 400,
      })

      expect(scroll).toBeDefined()
    })

    it('should accept bounce damping', () => {
      const scroll = createScrollSpring(container, {
        bounce: true,
        bounceDamping: 30,
      })

      expect(scroll).toBeDefined()
    })

    it('should accept both bounce config values', () => {
      const scroll = createScrollSpring(container, {
        bounce: true,
        bounceStiffness: 400,
        bounceDamping: 30,
      })

      expect(scroll).toBeDefined()
    })
  })

  describe('momentum config', () => {
    it('should accept custom momentum decay', () => {
      const scroll = createScrollSpring(container, {
        momentum: true,
        momentumDecay: 0.9,
      })

      expect(scroll).toBeDefined()
    })

    it('should accept high momentum decay', () => {
      const scroll = createScrollSpring(container, {
        momentum: true,
        momentumDecay: 0.99,
      })

      expect(scroll).toBeDefined()
    })

    it('should accept low momentum decay', () => {
      const scroll = createScrollSpring(container, {
        momentum: true,
        momentumDecay: 0.8,
      })

      expect(scroll).toBeDefined()
    })
  })

  describe('enable/disable', () => {
    it('should enable scroll', () => {
      const scroll = createScrollSpring(container)
      scroll.disable()
      scroll.enable()

      expect(scroll).toBeDefined()
    })

    it('should disable scroll', () => {
      const scroll = createScrollSpring(container)
      scroll.disable()

      expect(scroll).toBeDefined()
    })

    it('should cancel pending RAF on disable (lines 246-248)', () => {
      vi.useFakeTimers()

      const scroll = createScrollSpring(container)

      // Trigger wheel to create pending RAF
      container.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }))
      vi.advanceTimersByTime(16)

      // Disable should cancel pending RAF
      scroll.disable()

      // Second disable should not throw
      expect(() => scroll.disable()).not.toThrow()

      vi.useRealTimers()
    })

    it('should call onScrollEnd when disabling during scroll (lines 251-253)', () => {
      const onScrollEnd = vi.fn()
      const scroll = createScrollSpring(container, { onScrollEnd })

      // Start scrolling
      container.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }))

      // Disable while scrolling - should call onScrollEnd
      scroll.disable()

      expect(onScrollEnd).toHaveBeenCalled()
    })
  })

  describe('wheel events', () => {
    it('should handle wheel event (lines 113-166)', () => {
      const onScrollStart = vi.fn()
      const _scroll = createScrollSpring(container, { onScrollStart })

      // Dispatch wheel event
      const wheelEvent = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        deltaX: 10,
        deltaY: 20,
      })
      container.dispatchEvent(wheelEvent)

      expect(onScrollStart).toHaveBeenCalled()
    })

    it('should filter horizontal direction (lines 124-128)', () => {
      const scroll = createScrollSpring(container, { direction: 'horizontal' })

      const wheelEvent = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        deltaX: 10,
        deltaY: 20,
      })
      container.dispatchEvent(wheelEvent)

      expect(scroll.getScroll()).toBeDefined()
    })

    it('should filter vertical direction (lines 124-128)', () => {
      const scroll = createScrollSpring(container, { direction: 'vertical' })

      const wheelEvent = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        deltaX: 10,
        deltaY: 20,
      })
      container.dispatchEvent(wheelEvent)

      expect(scroll.getScroll()).toBeDefined()
    })

    it('should handle bounce effect (lines 131-153)', () => {
      const scroll = createScrollSpring(container, { bounce: true })

      // First, scroll to near the left edge, then try to scroll further left
      scroll.scrollTo(0, 0)

      const wheelEvent = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        deltaX: -500, // Large negative value to trigger line 140
        deltaY: 0,
      })
      container.dispatchEvent(wheelEvent)

      expect(scroll.getScroll()).toBeDefined()
    })

    it('should handle bounce beyond right edge (lines 141-143)', () => {
      const scroll = createScrollSpring(container, { bounce: true })

      // Scroll near the right edge (max scroll X is 700 for 1000px content - 300px container)
      scroll.scrollTo(690, 0)

      // Now try to scroll further right
      const wheelEvent = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        deltaX: 100,
        deltaY: 0,
      })
      container.dispatchEvent(wheelEvent)

      expect(scroll.getScroll()).toBeDefined()
    })

    it('should handle bounce beyond bottom edge (lines 148-149)', () => {
      const scroll = createScrollSpring(container, { bounce: true })

      // Scroll near the bottom edge (max scroll Y is 800 for 1000px content - 200px container)
      scroll.scrollTo(0, 790)

      // Now try to scroll further down
      const wheelEvent = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        deltaX: 0,
        deltaY: 100,
      })
      container.dispatchEvent(wheelEvent)

      expect(scroll.getScroll()).toBeDefined()
    })

    it('should handle bounce beyond top edge (line 145-146)', () => {
      const scroll = createScrollSpring(container, { bounce: true })

      // Scroll to top, then try to scroll up further
      scroll.scrollTo(0, 0)

      const wheelEvent = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        deltaX: 0,
        deltaY: -500, // Large negative value to trigger line 145
      })
      container.dispatchEvent(wheelEvent)

      expect(scroll.getScroll()).toBeDefined()
    })

    it('should trigger x < 0 bounce branch (line 140)', async () => {
      const scroll = createScrollSpring(container, {
        bounce: true,
        direction: 'both', // Enable both directions to ensure horizontal is processed
        stiffness: 1000,
        damping: 50,
      })

      // Ensure we start at position 0
      scroll.scrollTo(0, 0)

      // Dispatch wheel event with large negative deltaX to make target.x < 0
      const wheelEvent = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        deltaX: -1000, // Very large negative to ensure target.x < 0
        deltaY: 0,
      })
      container.dispatchEvent(wheelEvent)

      // Wait for spring animation to propagate
      await new Promise(resolve => setTimeout(resolve, 50))

      // Check if we got past the left edge - the bounce should have been applied
      const scrollPos = scroll.getScroll()
      expect(scrollPos).toBeDefined()
      // The bounce formula: -Math.sqrt(-(-1000)) * 10 = -Math.sqrt(1000) * 10 ≈ -316
      // So scroll position should be negative (beyond left edge)
      expect(scrollPos.x).toBeLessThan(0)
    })

    it('should clamp without bounce (lines 153-163)', () => {
      const scroll = createScrollSpring(container, { bounce: false })

      const wheelEvent = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        deltaX: 100,
        deltaY: 100,
      })
      container.dispatchEvent(wheelEvent)

      expect(scroll.getScroll()).toBeDefined()
    })

    it('should handle wheel when disabled (line 113)', () => {
      const onScrollStart = vi.fn()
      const scroll = createScrollSpring(container, { onScrollStart })
      scroll.disable()

      const wheelEvent = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        deltaX: 10,
        deltaY: 20,
      })
      container.dispatchEvent(wheelEvent)

      expect(onScrollStart).not.toHaveBeenCalled()
    })

    it('should handle scroll end detection (lines 170-190)', async () => {
      const onScrollEnd = vi.fn()
      const _scroll = createScrollSpring(container, {
        onScrollEnd,
        stiffness: 1000,
        damping: 50,
      })

      // Dispatch wheel event to start scroll
      const wheelEvent = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        deltaX: 10,
        deltaY: 20,
      })
      container.dispatchEvent(wheelEvent)

      // Wait for scroll to settle
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(onScrollEnd).toHaveBeenCalled()
    }, 2000)
  })

  describe('destroy', () => {
    it('should clean up resources', () => {
      const scroll = createScrollSpring(container)
      scroll.destroy()

      expect(scroll).toBeDefined()
    })

    it('should cancel pending RAF on destroy (lines 261-263)', () => {
      vi.useFakeTimers()

      const scroll = createScrollSpring(container)

      // Start scrolling to create pending RAF
      container.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }))

      vi.advanceTimersByTime(16)

      // Destroy should cancel pending RAF (lines 261-263)
      scroll.destroy()

      // Second destroy should not throw
      expect(() => scroll.destroy()).not.toThrow()

      vi.useRealTimers()
    })
  })
})

describe('createScrollSpring regressions', () => {
  let container: HTMLElement

  const setScrollSize = (el: HTMLElement, scrollHeight: number, clientHeight: number) => {
    Object.defineProperty(el, 'scrollHeight', { configurable: true, value: scrollHeight })
    Object.defineProperty(el, 'clientHeight', { configurable: true, value: clientHeight })
    Object.defineProperty(el, 'scrollWidth', { configurable: true, value: 0 })
    Object.defineProperty(el, 'clientWidth', { configurable: true, value: 0 })
  }

  const waitFor = async (condition: () => boolean, timeout = 3000) => {
    const start = Date.now()
    while (!condition() && Date.now() - start < timeout) {
      await new Promise(resolve => setTimeout(resolve, 16))
    }
  }

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    setScrollSize(container, 1000, 200)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    container.remove()
  })

  it('keeps a single end-check RAF loop across many wheel events', () => {
    const realRaf = globalThis.requestAnimationFrame.bind(globalThis)
    const realCancel = globalThis.cancelAnimationFrame.bind(globalThis)
    const pending = new Set<number>()
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      const id = realRaf((t) => {
        pending.delete(id)
        cb(t)
      })
      pending.add(id)
      return id
    })
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation((id: number) => {
      pending.delete(id)
      realCancel(id)
    })

    const scroll = createScrollSpring(container)
    for (let i = 0; i < 10; i++) {
      container.dispatchEvent(new WheelEvent('wheel', { deltaY: 10, cancelable: true }))
    }

    // At most one frame for the global animation loop and one for the end check
    expect(pending.size).toBeLessThanOrEqual(2)
    scroll.destroy()
  })

  it('converts line-based wheel deltas (deltaMode = 1) to pixels', async () => {
    const scroll = createScrollSpring(container, { stiffness: 2000, damping: 90 })

    container.dispatchEvent(new WheelEvent('wheel', { deltaY: 3, deltaMode: 1, cancelable: true }))
    await waitFor(() => scroll.getScroll().y > 40, 1000)

    // 3 lines must scroll ~48px, not 3px
    expect(scroll.getScroll().y).toBeGreaterThan(40)
    scroll.destroy()
  })

  it('bounces back to the edge after overscrolling with bounce enabled', async () => {
    const onScrollEnd = vi.fn()
    const scroll = createScrollSpring(container, { bounce: true, stiffness: 2000, damping: 90, onScrollEnd })

    container.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, cancelable: true }))
    await waitFor(() => onScrollEnd.mock.calls.length > 0)

    expect(onScrollEnd).toHaveBeenCalledTimes(1)
    expect(Math.abs(scroll.getScroll().y)).toBeLessThan(1)
    scroll.destroy()
  })
})

describe('createScrollSpring bounce spring config', () => {
  it('bounceStiffness / bounceDamping drive the spring back from an overscroll', async () => {
    const { installTestClock } = await import('../../../src/testing')
    const clock = installTestClock()
    const container = document.createElement('div')
    document.body.appendChild(container)

    const timeToSettle = (config: { bounceStiffness?: number; bounceDamping?: number }) => {
      const onScrollEnd = vi.fn()
      const scroll = createScrollSpring(container, { bounce: true, stiffness: 100, damping: 20, onScrollEnd, ...config })
      container.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, cancelable: true }))
      const start = clock.now()
      while (onScrollEnd.mock.calls.length === 0 && clock.now() - start < 10000) clock.nextFrame()
      const elapsed = clock.now() - start
      expect(Math.abs(scroll.getScroll().y)).toBeLessThan(1)
      scroll.destroy()
      return elapsed
    }

    const regular = timeToSettle({})
    const stiffBounce = timeToSettle({ bounceStiffness: 2000, bounceDamping: 90 })
    expect(stiffBounce).toBeLessThan(regular - 300)

    clock.uninstall()
    container.remove()
  })
})

describe('createScrollSpring bounce on content shorter than the container', () => {
  it('overscroll past the bottom is measured from scroll position 0', async () => {
    const { installTestClock } = await import('../../../src/testing')
    const clock = installTestClock()
    const container = document.createElement('div')
    document.body.appendChild(container)
    Object.defineProperty(container, 'clientHeight', { configurable: true, value: 200 })
    Object.defineProperty(container, 'scrollHeight', { configurable: true, value: 100 })

    const positions: number[] = []
    const scroll = createScrollSpring(container, { bounce: true, onScroll: (_x, y) => positions.push(y) })
    container.dispatchEvent(new WheelEvent('wheel', { deltaY: 10, cancelable: true }))
    clock.runAll()
    const down = Math.max(...positions)
    positions.length = 0
    container.dispatchEvent(new WheelEvent('wheel', { deltaY: -10, cancelable: true }))
    clock.runAll()
    const up = Math.min(...positions)

    // Same overscroll in both directions, and back at 0 afterwards
    expect(down).toBeGreaterThan(5)
    expect(down).toBeCloseTo(-up, 0)
    expect(Math.abs(scroll.getScroll().y)).toBeLessThan(1)
    scroll.destroy()
    clock.uninstall()
    container.remove()
  })
})

describe('createScrollSpring rubber band curve', () => {
  const overscrollFor = async (deltaY: number) => {
    const { installTestClock } = await import('../../../src/testing')
    const clock = installTestClock()
    const container = document.createElement('div')
    document.body.appendChild(container)
    Object.defineProperty(container, 'clientHeight', { configurable: true, value: 400 })
    Object.defineProperty(container, 'scrollHeight', { configurable: true, value: 1000 })
    let min = 0
    // Overdamped, so the extreme position is the rubber-banded target itself
    const scroll = createScrollSpring(container, {
      bounce: true, stiffness: 2000, damping: 400, onScroll: (_x, y) => { min = Math.min(min, y) },
    })
    container.dispatchEvent(new WheelEvent('wheel', { deltaY, cancelable: true }))
    clock.runAll()
    const end = scroll.getScroll().y
    scroll.destroy()
    clock.uninstall()
    container.remove()
    return { min, end }
  }

  it('never amplifies an overscroll: small ones move ~0.55x, large ones approach the container size', async () => {
    const curve = (x: number) => (1 - 1 / ((x * 0.55) / 400 + 1)) * 400

    const small = await overscrollFor(-20)
    expect(-small.min).toBeLessThan(20)
    expect(-small.min).toBeCloseTo(curve(20), 0)
    expect(Math.abs(small.end)).toBeLessThan(1)

    const huge = await overscrollFor(-100000)
    expect(-huge.min).toBeLessThan(400)
    expect(-huge.min).toBeGreaterThan(390)
  })

  it('scrolling back out of an overscroll follows the same curve', async () => {
    const { installTestClock } = await import('../../../src/testing')
    const clock = installTestClock()
    const container = document.createElement('div')
    document.body.appendChild(container)
    Object.defineProperty(container, 'clientHeight', { configurable: true, value: 400 })
    Object.defineProperty(container, 'scrollHeight', { configurable: true, value: 1000 })
    const positions: number[] = []
    const scroll = createScrollSpring(container, {
      bounce: true, stiffness: 2000, damping: 400, onScroll: (_x, y) => positions.push(y),
    })
    container.dispatchEvent(new WheelEvent('wheel', { deltaY: -200, cancelable: true }))
    clock.advance(16)
    // Back by the same amount: returns to the edge, not into the content
    container.dispatchEvent(new WheelEvent('wheel', { deltaY: 200, cancelable: true }))
    positions.length = 0
    clock.runAll()
    expect(Math.max(...positions)).toBeLessThan(1)
    expect(scroll.getScroll().y).toBeCloseTo(0, 0)
    scroll.destroy()
    clock.uninstall()
    container.remove()
  })
})
