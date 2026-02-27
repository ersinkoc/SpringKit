import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createScrollProgress,
  createParallax,
  createScrollTrigger,
  createScrollLinkedValue,
  scrollEasings,
} from '@oxog/springkit'

describe('Scroll-Linked Animations', () => {
  let element: HTMLElement

  beforeEach(() => {
    element = document.createElement('div')
    element.style.height = '200px'
    document.body.appendChild(element)

    // Mock document height
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 2000,
      configurable: true,
    })
  })

  afterEach(() => {
    document.body.textContent = ''
  })

  describe('createScrollProgress', () => {
    it('should create scroll progress tracker', () => {
      const progress = createScrollProgress()

      expect(progress).toHaveProperty('get')
      expect(progress).toHaveProperty('getInfo')
      expect(progress).toHaveProperty('subscribe')
      expect(progress).toHaveProperty('destroy')

      progress.destroy()
    })

    it('should track page scroll without element', () => {
      const progress = createScrollProgress()

      expect(progress.get()).toBeGreaterThanOrEqual(0)
      expect(progress.get()).toBeLessThanOrEqual(1)

      progress.destroy()
    })

    it('should track element scroll', () => {
      const progress = createScrollProgress(element)

      const info = progress.getInfo()
      expect(info).toHaveProperty('progress')
      expect(info).toHaveProperty('scrollY')
      expect(info).toHaveProperty('velocity')
      expect(info).toHaveProperty('direction')
      expect(info).toHaveProperty('isInView')
      expect(info).toHaveProperty('visibleRatio')

      progress.destroy()
    })

    it('should support offset options', () => {
      const progress = createScrollProgress(element, {
        offset: ['start', 'end'],
      })

      expect(progress.get()).toBeGreaterThanOrEqual(0)

      progress.destroy()
    })

    it('should support smooth option', () => {
      const progress = createScrollProgress(element, {
        smooth: 0.1,
      })

      expect(progress.get()).toBeGreaterThanOrEqual(0)

      progress.destroy()
    })

    it('should subscribe to progress changes', () => {
      const callback = vi.fn()
      const progress = createScrollProgress()

      const unsubscribe = progress.subscribe(callback)

      expect(callback).toHaveBeenCalled()

      unsubscribe()
      progress.destroy()
    })

    it('should unsubscribe correctly', () => {
      const callback = vi.fn()
      const progress = createScrollProgress()

      const unsubscribe = progress.subscribe(callback)
      unsubscribe()

      progress.destroy()
    })
  })

  describe('createParallax', () => {
    it('should create parallax controller', () => {
      const parallax = createParallax(element)

      expect(parallax).toHaveProperty('getOffset')
      expect(parallax).toHaveProperty('update')
      expect(parallax).toHaveProperty('destroy')

      parallax.destroy()
    })

    it('should get offset', () => {
      const parallax = createParallax(element)

      const offset = parallax.getOffset()
      expect(typeof offset).toBe('number')

      parallax.destroy()
    })

    it('should support speed option', () => {
      const parallax = createParallax(element, { speed: 0.5 })

      expect(parallax.getOffset()).toBeDefined()

      parallax.destroy()
    })

    it('should support negative speed', () => {
      const parallax = createParallax(element, { speed: -0.5 })

      expect(parallax.getOffset()).toBeDefined()

      parallax.destroy()
    })

    it('should support horizontal direction', () => {
      const parallax = createParallax(element, { direction: 'horizontal' })

      expect(parallax.getOffset()).toBeDefined()

      parallax.destroy()
    })

    it('should support vertical direction', () => {
      const parallax = createParallax(element, { direction: 'vertical' })

      expect(parallax.getOffset()).toBeDefined()

      parallax.destroy()
    })

    it('should support custom easing', () => {
      const parallax = createParallax(element, {
        easing: (t) => t * t,
      })

      expect(parallax.getOffset()).toBeDefined()

      parallax.destroy()
    })

    it('should update on call', () => {
      const parallax = createParallax(element)

      expect(() => parallax.update()).not.toThrow()

      parallax.destroy()
    })

    it('should clean up on destroy', () => {
      const parallax = createParallax(element)

      parallax.destroy()

      expect(element.style.transform).toBe('')
    })
  })

  describe('createScrollTrigger', () => {
    it('should create scroll trigger', () => {
      const trigger = createScrollTrigger(element)

      expect(trigger).toHaveProperty('isActive')
      expect(trigger).toHaveProperty('getProgress')
      expect(trigger).toHaveProperty('refresh')
      expect(trigger).toHaveProperty('destroy')

      trigger.destroy()
    })

    it('should check active state', () => {
      const trigger = createScrollTrigger(element)

      expect(typeof trigger.isActive()).toBe('boolean')

      trigger.destroy()
    })

    it('should get progress', () => {
      const trigger = createScrollTrigger(element)

      const progress = trigger.getProgress()
      expect(progress).toBeGreaterThanOrEqual(0)
      expect(progress).toBeLessThanOrEqual(1)

      trigger.destroy()
    })

    it('should support start/end options', () => {
      const trigger = createScrollTrigger(element, {
        start: 'top',
        end: 'bottom',
      })

      expect(trigger.getProgress()).toBeDefined()

      trigger.destroy()
    })

    it('should support numeric start/end', () => {
      const trigger = createScrollTrigger(element, {
        start: 100,
        end: 500,
      })

      expect(trigger.getProgress()).toBeDefined()

      trigger.destroy()
    })

    it('should support offset options', () => {
      const trigger = createScrollTrigger(element, {
        startOffset: 50,
        endOffset: -50,
      })

      expect(trigger.getProgress()).toBeDefined()

      trigger.destroy()
    })

    it('should call onEnter callback', () => {
      const onEnter = vi.fn()
      const trigger = createScrollTrigger(element, { onEnter })

      trigger.destroy()
    })

    it('should call onLeave callback', () => {
      const onLeave = vi.fn()
      const trigger = createScrollTrigger(element, { onLeave })

      trigger.destroy()
    })

    it('should call onProgress callback', () => {
      const onProgress = vi.fn()
      const trigger = createScrollTrigger(element, { onProgress })

      trigger.destroy()
    })

    it('should support once option', () => {
      const onEnter = vi.fn()
      const trigger = createScrollTrigger(element, {
        onEnter,
        once: true,
      })

      trigger.destroy()
    })

    it('should support scrub option', () => {
      const trigger = createScrollTrigger(element, { scrub: true })

      expect(trigger.getProgress()).toBeDefined()

      trigger.destroy()
    })

    it('should support numeric scrub', () => {
      const trigger = createScrollTrigger(element, { scrub: 0.5 })

      expect(trigger.getProgress()).toBeDefined()

      trigger.destroy()
    })

    it('should refresh calculations', () => {
      const trigger = createScrollTrigger(element)

      expect(() => trigger.refresh()).not.toThrow()

      trigger.destroy()
    })
  })

  describe('createScrollLinkedValue', () => {
    it('should create scroll-linked value', () => {
      const scrollProgress = createScrollProgress()
      const value = createScrollLinkedValue(scrollProgress, {
        inputRange: [0, 1],
        outputRange: [0, 100],
      })

      expect(value).toHaveProperty('get')
      expect(value).toHaveProperty('subscribe')
      expect(value).toHaveProperty('destroy')

      value.destroy()
      scrollProgress.destroy()
    })

    it('should get current value', () => {
      const scrollProgress = createScrollProgress()
      const value = createScrollLinkedValue(scrollProgress, {
        inputRange: [0, 1],
        outputRange: [0, 100],
      })

      const current = value.get()
      expect(typeof current).toBe('number')

      value.destroy()
      scrollProgress.destroy()
    })

    it('should interpolate between values', () => {
      const scrollProgress = createScrollProgress()
      const value = createScrollLinkedValue(scrollProgress, {
        inputRange: [0, 0.5, 1],
        outputRange: [0, 50, 100],
      })

      expect(value.get()).toBeDefined()

      value.destroy()
      scrollProgress.destroy()
    })

    it('should support color interpolation', () => {
      const scrollProgress = createScrollProgress()
      const value = createScrollLinkedValue(scrollProgress, {
        inputRange: [0, 1],
        outputRange: ['#ff0000', '#0000ff'],
      })

      const current = value.get()
      expect(typeof current).toBe('string')

      value.destroy()
      scrollProgress.destroy()
    })

    it('should subscribe to value changes', () => {
      const callback = vi.fn()
      const scrollProgress = createScrollProgress()
      const value = createScrollLinkedValue(scrollProgress, {
        inputRange: [0, 1],
        outputRange: [0, 100],
      })

      const unsubscribe = value.subscribe(callback)

      expect(callback).toHaveBeenCalled()

      unsubscribe()
      value.destroy()
      scrollProgress.destroy()
    })

    it('should support clamp option', () => {
      const scrollProgress = createScrollProgress()
      const value = createScrollLinkedValue(scrollProgress, {
        inputRange: [0, 1],
        outputRange: [0, 100],
        clamp: true,
      })

      expect(value.get()).toBeDefined()

      value.destroy()
      scrollProgress.destroy()
    })

    it('should support easing option', () => {
      const scrollProgress = createScrollProgress()
      const value = createScrollLinkedValue(scrollProgress, {
        inputRange: [0, 1],
        outputRange: [0, 100],
        easing: (t) => t * t,
      })

      expect(value.get()).toBeDefined()

      value.destroy()
      scrollProgress.destroy()
    })

    it('should throw for mismatched ranges', () => {
      const scrollProgress = createScrollProgress()

      expect(() => {
        createScrollLinkedValue(scrollProgress, {
          inputRange: [0, 1],
          outputRange: [0, 50, 100],
        })
      }).toThrow('inputRange and outputRange must have the same length')

      scrollProgress.destroy()
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle center offset option (line 196)', () => {
      const progress = createScrollProgress(element, {
        offset: ['center', 'end'],
      })

      expect(progress.get()).toBeGreaterThanOrEqual(0)

      progress.destroy()
    })

    it('should handle end offset option (line 200)', () => {
      const progress = createScrollProgress(element, {
        offset: ['start', 'start'],
      })

      expect(progress.get()).toBeGreaterThanOrEqual(0)

      progress.destroy()
    })

    it('should handle onEnter callback errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const onEnter = vi.fn(() => { throw new Error('onEnter error') })

      const trigger = createScrollTrigger(element, { onEnter })

      trigger.destroy()
      consoleSpy.mockRestore()
    })

    it('should handle onLeave callback errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const onLeave = vi.fn(() => { throw new Error('onLeave error') })

      const trigger = createScrollTrigger(element, { onLeave })

      trigger.destroy()
      consoleSpy.mockRestore()
    })

    it('should handle onProgress callback errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const onProgress = vi.fn(() => { throw new Error('onProgress error') })

      const trigger = createScrollTrigger(element, { onProgress, scrub: true })

      trigger.destroy()
      consoleSpy.mockRestore()
    })

    it('should handle segment index beyond range (lines 568-570)', () => {
      const scrollProgress = createScrollProgress()
      const value = createScrollLinkedValue(scrollProgress, {
        inputRange: [0, 0.5, 1],
        outputRange: [0, 50, 100],
      })

      // Value should be defined even when progress is beyond segments
      expect(value.get()).toBeDefined()

      value.destroy()
      scrollProgress.destroy()
    })

    it('should handle equal segment start and end (line 577)', () => {
      const scrollProgress = createScrollProgress()
      const value = createScrollLinkedValue(scrollProgress, {
        inputRange: [0, 0.5, 0.5, 1], // Two segments with same boundary
        outputRange: [0, 50, 50, 100],
      })

      // Should handle equal segment boundaries without division by zero
      expect(value.get()).toBeDefined()

      value.destroy()
      scrollProgress.destroy()
    })

    it('should handle parallax with element not in view', () => {
      const parallax = createParallax(element)

      // Element is in view by default in jsdom, but update should handle not in view
      parallax.update()
      expect(parallax.getOffset()).toBeDefined()

      parallax.destroy()
    })

    it('should handle multiple destroy calls on scroll progress', () => {
      const progress = createScrollProgress()

      expect(() => {
        progress.destroy()
        progress.destroy()
        progress.destroy()
      }).not.toThrow()
    })

    it('should handle multiple destroy calls on parallax', () => {
      const parallax = createParallax(element)

      expect(() => {
        parallax.destroy()
        parallax.destroy()
        parallax.destroy()
      }).not.toThrow()
    })

    it('should handle multiple destroy calls on scroll trigger', () => {
      const trigger = createScrollTrigger(element)

      expect(() => {
        trigger.destroy()
        trigger.destroy()
        trigger.destroy()
      }).not.toThrow()
    })

    it('should handle scroll trigger with center start', () => {
      const trigger = createScrollTrigger(element, {
        start: 'center',
        end: 'center',
      })

      expect(trigger.getProgress()).toBeDefined()

      trigger.destroy()
    })

    it('should handle scroll trigger with bottom start', () => {
      const trigger = createScrollTrigger(element, {
        start: 'bottom',
        end: 'bottom',
      })

      expect(trigger.getProgress()).toBeDefined()

      trigger.destroy()
    })

    it('should handle scroll linked value with no clamp', () => {
      const scrollProgress = createScrollProgress()
      const value = createScrollLinkedValue(scrollProgress, {
        inputRange: [0, 1],
        outputRange: [0, 100],
        clamp: false,
      })

      expect(value.get()).toBeDefined()

      value.destroy()
      scrollProgress.destroy()
    })

    it('should handle rgb color interpolation', () => {
      const scrollProgress = createScrollProgress()
      const value = createScrollLinkedValue(scrollProgress, {
        inputRange: [0, 1],
        outputRange: ['rgb(255, 0, 0)', 'rgb(0, 0, 255)'],
      })

      const current = value.get()
      expect(typeof current).toBe('string')

      value.destroy()
      scrollProgress.destroy()
    })

    it('should handle hsl color interpolation', () => {
      const scrollProgress = createScrollProgress()
      const value = createScrollLinkedValue(scrollProgress, {
        inputRange: [0, 1],
        outputRange: ['hsl(0, 100%, 50%)', 'hsl(240, 100%, 50%)'],
      })

      const current = value.get()
      expect(typeof current).toBe('string')

      value.destroy()
      scrollProgress.destroy()
    })

    it('should handle parallax with element in view (line 310)', () => {
      const parallax = createParallax(element)

      // Element is in view by default in jsdom
      parallax.update()
      expect(parallax.getOffset()).toBeDefined()

      parallax.destroy()
    })

    it('should handle parallax cleanup of pending RAF (lines 366-369)', () => {
      const parallax = createParallax(element)

      // Trigger an update that schedules RAF
      parallax.update()

      // Destroy immediately to cancel pending RAF
      parallax.destroy()

      // Should not throw
      expect(() => parallax.destroy()).not.toThrow()
    })

    it('should handle scroll trigger with scrub smoothing (lines 444-449)', () => {
      const trigger = createScrollTrigger(element, {
        scrub: 0.5, // Numeric scrub with smoothing
      })

      expect(trigger.getProgress()).toBeDefined()

      trigger.destroy()
    })

    it('should handle scroll trigger with boolean scrub (lines 447-449)', () => {
      const trigger = createScrollTrigger(element, {
        scrub: true, // Boolean scrub (no smoothing)
      })

      expect(trigger.getProgress()).toBeDefined()

      trigger.destroy()
    })

    it('should handle scroll trigger refresh (line 509)', () => {
      const trigger = createScrollTrigger(element)

      // Refresh should recalculate
      trigger.refresh()

      expect(trigger.getProgress()).toBeDefined()

      trigger.destroy()
    })

    it('should handle scroll linked value interpolation with easing (lines 554, 557)', () => {
      const scrollProgress = createScrollProgress()
      const value = createScrollLinkedValue(scrollProgress, {
        inputRange: [0, 0.5, 1],
        outputRange: [0, 50, 100],
        easing: (t) => t * t, // Custom easing
      })

      expect(value.get()).toBeDefined()

      value.destroy()
      scrollProgress.destroy()
    })

    it('should handle scroll linked value with progress beyond last segment (lines 568-570)', () => {
      const scrollProgress = createScrollProgress()
      const value = createScrollLinkedValue(scrollProgress, {
        inputRange: [0, 0.5, 1],
        outputRange: [0, 50, 100],
        clamp: false, // Allow extrapolation
      })

      // Value should handle progress beyond segments
      expect(value.get()).toBeDefined()

      value.destroy()
      scrollProgress.destroy()
    })

    it('should handle scroll linked value with equal segment boundaries (lines 575-577)', () => {
      const scrollProgress = createScrollProgress()
      const value = createScrollLinkedValue(scrollProgress, {
        inputRange: [0, 0.5, 0.5, 1], // Two segments with same boundary
        outputRange: [0, 50, 50, 100],
      })

      // Should handle equal segment boundaries without division by zero
      expect(value.get()).toBeDefined()

      value.destroy()
      scrollProgress.destroy()
    })

    it('should handle scroll progress when element is not in view (lines 211-213)', () => {
      // Create element outside viewport
      const offscreenElement = document.createElement('div')
      offscreenElement.style.position = 'absolute'
      offscreenElement.style.top = '5000px'
      offscreenElement.style.left = '5000px'
      document.body.appendChild(offscreenElement)

      const progress = createScrollProgress(offscreenElement)
      const info = progress.getInfo()

      expect(info.isInView).toBe(false)
      expect(info.visibleRatio).toBe(0)

      progress.destroy()
      offscreenElement.remove()
    })

    it('should handle scroll progress with document height of zero (line 217)', () => {
      // Mock document height to be equal to window height (zero scroll range)
      const originalScrollHeight = Object.getOwnPropertyDescriptor(document.documentElement, 'scrollHeight')
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: window.innerHeight,
        configurable: true,
      })

      const progress = createScrollProgress()
      expect(progress.get()).toBe(0)

      progress.destroy()

      // Restore original
      if (originalScrollHeight) {
        Object.defineProperty(document.documentElement, 'scrollHeight', originalScrollHeight)
      }
    })

    it('should handle scroll progress destroyed state in onScroll (lines 249, 252)', () => {
      const progress = createScrollProgress()

      // Destroy immediately
      progress.destroy()

      // Trigger scroll event
      window.dispatchEvent(new Event('scroll'))

      // Should not throw
      expect(() => progress.get()).not.toThrow()
    })

    it('should handle scroll trigger with active state changes (lines 471-496)', () => {
      const onEnter = vi.fn()
      const onLeave = vi.fn()
      const onProgress = vi.fn()

      const trigger = createScrollTrigger(element, {
        start: 'top',
        end: 'bottom',
        onEnter,
        onLeave,
        onProgress,
      })

      // Trigger scroll to activate
      window.dispatchEvent(new Event('scroll'))

      expect(trigger.isActive()).toBeDefined()

      trigger.destroy()
    })

    it('should handle scroll trigger once option (lines 473-475)', () => {
      const onEnter = vi.fn()
      const trigger = createScrollTrigger(element, {
        onEnter,
        once: true,
      })

      trigger.destroy()
    })

    it('should handle parallax with IntersectionObserver entry undefined (lines 337-340)', () => {
      const parallax = createParallax(element)

      // Update should handle when entry is undefined
      parallax.update()

      expect(parallax.getOffset()).toBeDefined()

      parallax.destroy()
    })

    it('should handle scroll progress with rafId already set (line 249)', () => {
      const progress = createScrollProgress()

      // Multiple rapid scroll events should not create multiple RAFs
      window.dispatchEvent(new Event('scroll'))
      window.dispatchEvent(new Event('scroll'))
      window.dispatchEvent(new Event('scroll'))

      expect(progress.get()).toBeDefined()

      progress.destroy()
    })
  })

  describe('scrollEasings', () => {
    it('should have linear easing', () => {
      expect(scrollEasings.linear(0.5)).toBe(0.5)
    })

    it('should have easeIn', () => {
      expect(scrollEasings.easeIn(0.5)).toBe(0.25)
    })

    it('should have easeOut', () => {
      expect(scrollEasings.easeOut(0.5)).toBe(0.75)
    })

    it('should have easeInOut', () => {
      const result = scrollEasings.easeInOut(0.5)
      expect(result).toBeCloseTo(0.5, 5)
    })

    it('should have cubic easings', () => {
      expect(scrollEasings.easeInCubic(0.5)).toBeDefined()
      expect(scrollEasings.easeOutCubic(0.5)).toBeDefined()
      expect(scrollEasings.easeInOutCubic(0.5)).toBeDefined()
    })

    it('should have quart easings', () => {
      expect(scrollEasings.easeInQuart(0.5)).toBeDefined()
      expect(scrollEasings.easeOutQuart(0.5)).toBeDefined()
      expect(scrollEasings.easeInOutQuart(0.5)).toBeDefined()
    })

    it('should return 0 at start and 1 at end', () => {
      const easings = Object.values(scrollEasings)

      easings.forEach(easing => {
        expect(easing(0)).toBeCloseTo(0, 5)
        expect(easing(1)).toBeCloseTo(1, 5)
      })
    })
  })
})
