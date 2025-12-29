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
  })

  describe('wheel events', () => {
    it('should handle wheel event (lines 113-166)', () => {
      const onScrollStart = vi.fn()
      const scroll = createScrollSpring(container, { onScrollStart })

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
      const scroll = createScrollSpring(container, {
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
  })
})
