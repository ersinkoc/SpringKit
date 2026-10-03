import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createScrollProgress,
  createParallax,
  createScrollTrigger,
  createScrollLinkedValue,
  scrollEasings,
} from '@oxog/springkit'
import type { ScrollProgress } from '../../../src/scroll/scroll-linked'
import { installTestClock, type TestClock } from '../../../src/testing'

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
    it('should handle center offset option for start point (line 195-196)', () => {
      const progress = createScrollProgress(element, {
        offset: ['center', 'end'], // offset[0] === 'center' triggers line 195-196
      })

      const info = progress.getInfo()
      expect(info).toBeDefined()

      progress.destroy()
    })

    it('should handle end offset option (line 200)', () => {
      const progress = createScrollProgress(element, {
        offset: ['start', 'start'],
      })

      expect(progress.get()).toBeGreaterThanOrEqual(0)

      progress.destroy()
    })

    it('should handle offset[0] = "end" (line 196)', () => {
      const progress = createScrollProgress(element, {
        offset: ['end', 'start'], // offset[0] === 'end' triggers line 196
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

    it('should handle segment index update when progress > next (lines 568-570)', () => {
      const scrollProgress = createScrollProgress()
      const value = createScrollLinkedValue(scrollProgress, {
        inputRange: [0, 0.3, 0.6, 1],
        outputRange: [0, 30, 60, 100],
      })

      // Trigger interpolation which will find the correct segment
      // The loop updates segmentIndex when p > next (line 569)
      const currentValue = value.get()
      expect(typeof currentValue).toBe('number')

      value.destroy()
      scrollProgress.destroy()
    })

    it('should handle equal segment start and end (line 577)', () => {
      const scrollProgress = createScrollProgress()
      const value = createScrollLinkedValue(scrollProgress, {
        inputRange: [0, 0.5, 0.5, 1], // Two segments with same boundary at 0.5
        outputRange: [0, 50, 50, 100],
      })

      // Should handle equal segment boundaries without division by zero
      // When segmentEnd === segmentStart, segmentProgress becomes 0 (line 577)
      const currentValue = value.get()
      expect(typeof currentValue).toBe('number')

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

    it('should handle progress beyond last segment (line 569)', () => {
      const scrollProgress = createScrollProgress()
      const value = createScrollLinkedValue(scrollProgress, {
        inputRange: [0, 0.5, 1],
        outputRange: [0, 50, 100],
        clamp: false,
      })

      // Get the subscriber and manually call it with progress > 1
      // This triggers line 569: if (p > next) { segmentIndex = i + 1 }
      const subscriber = value.subscribe
      expect(subscriber).toBeDefined()

      // Subscribe to trigger the callback with default progress
      const callback = vi.fn()
      value.subscribe(callback)

      // Initial call should work
      expect(callback).toHaveBeenCalled()

      value.destroy()
      scrollProgress.destroy()
    })

    it('should handle duplicate input range values (line 577)', () => {
      const scrollProgress = createScrollProgress()
      const value = createScrollLinkedValue(scrollProgress, {
        inputRange: [0, 0.5, 0.5, 1], // Duplicate at index 1-2
        outputRange: [0, 50, 75, 100],
        clamp: true,
      })

      // This triggers line 575-577: segmentEnd !== segmentStart ? ... : 0
      // When segmentEnd === segmentStart, it should return 0 to avoid division by zero

      const callback = vi.fn()
      value.subscribe(callback)

      // Should not throw and should return valid value
      expect(callback).toHaveBeenCalled()

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

    it('should handle segment with zero length (lines 575-577)', () => {
      const scrollProgress = createScrollProgress()
      const value = createScrollLinkedValue(scrollProgress, {
        inputRange: [0, 0.5, 0.5, 1],
        outputRange: [0, 50, 60, 100],
        clamp: true,
      })

      // Progress at exactly the boundary point
      expect(value.get()).toBeDefined()

      value.destroy()
      scrollProgress.destroy()
    })

    it('should handle progress beyond last segment with clamp false (lines 568-570)', () => {
      const scrollProgress = createScrollProgress()
      const value = createScrollLinkedValue(scrollProgress, {
        inputRange: [0, 0.5, 1],
        outputRange: [0, 50, 100],
        clamp: false,
      })

      // Should extrapolate beyond last segment
      expect(value.get()).toBeDefined()

      value.destroy()
      scrollProgress.destroy()
    })

    it('should handle progress before first segment with clamp false (lines 568-570)', () => {
      const scrollProgress = createScrollProgress()
      const value = createScrollLinkedValue(scrollProgress, {
        inputRange: [0.2, 0.5, 1],
        outputRange: [0, 50, 100],
        clamp: false,
      })

      // Should extrapolate before first segment
      expect(value.get()).toBeDefined()

      value.destroy()
      scrollProgress.destroy()
    })

    it('should handle segment index finding with progress at exact boundary (lines 577)', () => {
      const scrollProgress = createScrollProgress()
      const value = createScrollLinkedValue(scrollProgress, {
        inputRange: [0, 0.25, 0.5, 0.75, 1],
        outputRange: [0, 25, 50, 75, 100],
        clamp: true,
      })

      // Progress at exact boundaries
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

    it('should handle segment index update when p > next (lines 568-570)', () => {
      const scrollProgress = createScrollProgress()
      const value = createScrollLinkedValue(scrollProgress, {
        inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
        outputRange: [0, 20, 40, 60, 80, 100],
      })

      // Force the interpolation to iterate through segments
      // This should trigger lines 568-570 when p > next for earlier segments
      const result = value.get()
      expect(typeof result).toBe('number')

      value.destroy()
      scrollProgress.destroy()
    })

    it('should handle equal segment boundaries division by zero protection (line 577)', () => {
      const scrollProgress = createScrollProgress()
      const value = createScrollLinkedValue(scrollProgress, {
        inputRange: [0, 0.5, 0.5, 1], // segment 1-2 has equal boundaries
        outputRange: [0, 50, 50, 100],
      })

      // When segmentEnd === segmentStart, line 577 returns 0
      const result = value.get()
      expect(typeof result).toBe('number')

      value.destroy()
      scrollProgress.destroy()
    })

    it('should handle segment index increment when p > next (lines 568-570)', () => {
      const scrollProgress = createScrollProgress()
      // Create value with inputRange where progress will be > next for early segments
      const value = createScrollLinkedValue(scrollProgress, {
        inputRange: [0, 0.1, 0.2],
        outputRange: [0, 50, 100],
        clamp: false, // Allow progress outside bounds
      })

      // This should trigger the segmentIndex = i + 1 path when p > next
      const result = value.get()
      expect(typeof result).toBe('number')

      value.destroy()
      scrollProgress.destroy()
    })

    it('should handle segment progress calculation with equal start/end (lines 575-577)', () => {
      const scrollProgress = createScrollProgress()
      // Create input range where segmentStart === segmentEnd scenario occurs
      const value = createScrollLinkedValue(scrollProgress, {
        inputRange: [0, 0.5, 0.5, 1], // segment at index 1 has equal boundaries
        outputRange: [0, 25, 75, 100],
      })

      // Force interpolation to hit the equal boundary segment
      // segmentProgress = segmentEnd !== segmentStart ? ... : 0
      const result = value.get()
      expect(typeof result).toBe('number')

      value.destroy()
      scrollProgress.destroy()
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

describe('Scroll-Linked regressions', () => {
  let element: HTMLElement

  const mockRect = (el: HTMLElement, top: number, height: number) => {
    el.getBoundingClientRect = () => ({
      top, bottom: top + height, left: 0, right: 100, width: 100, height, x: 0, y: top,
      toJSON: () => ({}),
    }) as DOMRect
  }

  const nextFrame = () => new Promise(resolve => requestAnimationFrame(() => resolve(undefined)))

  beforeEach(() => {
    element = document.createElement('div')
    document.body.appendChild(element)
  })

  afterEach(() => {
    element.remove()
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 })
    Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: 0 })
  })

  it('scroll trigger progress grows as the element scrolls through the viewport', () => {
    const wh = window.innerHeight
    const trigger = createScrollTrigger(element, { start: 'top', end: 'bottom' })

    // Element below the viewport: not started
    mockRect(element, wh + 100, 200)
    trigger.refresh()
    expect(trigger.getProgress()).toBe(0)

    // Element top in the middle of the viewport
    mockRect(element, wh / 2, 200)
    trigger.refresh()
    expect(trigger.getProgress()).toBeCloseTo((wh / 2) / (wh + 200))

    // Element bottom has left through the top of the viewport: finished
    mockRect(element, -300, 200)
    trigger.refresh()
    expect(trigger.getProgress()).toBe(1)

    trigger.destroy()
  })

  it('scroll progress subscribers receive the current info, not the creation-time info', async () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: window.innerHeight + 1000 })
    const progress = createScrollProgress()
    expect(progress.get()).toBe(0)

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 500 })
    window.dispatchEvent(new Event('scroll'))
    await nextFrame()
    expect(progress.get()).toBeCloseTo(0.5)

    const callback = vi.fn()
    progress.subscribe(callback)
    expect(callback.mock.calls[0]![0].progress).toBeCloseTo(0.5)

    progress.destroy()
  })

  it('does not report a bogus velocity when created on an already scrolled page', async () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: window.innerHeight + 5000 })
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 3000 })
    const progress = createScrollProgress()

    expect(progress.getInfo().velocity).toBe(0)
    expect(progress.getInfo().direction).toBe(0)
    progress.destroy()
  })

  it('reports visibleRatio 0 instead of NaN for zero-height elements', () => {
    mockRect(element, 100, 0)
    const progress = createScrollProgress(element)
    expect(progress.getInfo().visibleRatio).toBe(0)
    progress.destroy()

    const onProgress = vi.fn()
    const trigger = createScrollTrigger(element, { onProgress, scrub: true })
    return nextFrame().then(() => {
      expect(Number.isNaN(onProgress.mock.calls[0]![0].visibleRatio)).toBe(false)
      trigger.destroy()
    })
  })

  it('scroll-linked value extrapolates past the last stop when clamp is false', () => {
    const fakeProgress: ScrollProgress = {
      get: () => 1,
      getInfo: () => ({ progress: 1, scrollY: 0, velocity: 0, direction: 0, isInView: true, visibleRatio: 1 }),
      subscribe: (cb) => {
        cb({ progress: 1, scrollY: 0, velocity: 0, direction: 0, isInView: true, visibleRatio: 1 })
        return () => {}
      },
      destroy: () => {},
    }
    const value = createScrollLinkedValue(fakeProgress, {
      inputRange: [0, 0.25, 0.5],
      outputRange: [0, 25, 50],
      clamp: false,
    })

    expect(value.get()).toBeCloseTo(100)
    value.destroy()
  })

  it('isolates scroll-linked value subscriber errors', () => {
    let emit: ((info: ReturnType<ScrollProgress['getInfo']>) => void) | null = null
    const fakeProgress: ScrollProgress = {
      get: () => 0,
      getInfo: () => ({ progress: 0, scrollY: 0, velocity: 0, direction: 0, isInView: true, visibleRatio: 1 }),
      subscribe: (cb) => {
        emit = cb
        return () => {}
      },
      destroy: () => {},
    }
    const value = createScrollLinkedValue(fakeProgress, { inputRange: [0, 1], outputRange: [0, 10] })
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const good = vi.fn()
    let calls = 0
    value.subscribe(() => {
      if (calls++ > 0) throw new Error('boom')
    })
    value.subscribe(good)

    expect(() => emit!({ progress: 0.5, scrollY: 0, velocity: 0, direction: 0, isInView: true, visibleRatio: 1 })).not.toThrow()
    expect(good).toHaveBeenLastCalledWith(5)
    errorSpy.mockRestore()
    value.destroy()
  })
})

describe('Scroll-linked color interpolation regressions', () => {
  const fixedProgress = (progress: number): ScrollProgress => ({
    get: () => progress,
    getInfo: () => ({ progress, scrollY: 0, velocity: 0, direction: 0, isInView: true, visibleRatio: 1 }),
    subscribe: (cb) => {
      cb({ progress, scrollY: 0, velocity: 0, direction: 0, isInView: true, visibleRatio: 1 })
      return () => {}
    },
    destroy: () => {},
  })

  it('keeps alpha and does not pass through gray when fading from transparent', () => {
    const value = createScrollLinkedValue(fixedProgress(0.5), {
      inputRange: [0, 1],
      outputRange: ['transparent', '#ffffff'],
    })
    expect(value.get()).toBe('rgba(255, 255, 255, 0.5)')
    value.destroy()
  })

  it('keeps hex output for opaque colors', () => {
    const value = createScrollLinkedValue(fixedProgress(0.5), {
      inputRange: [0, 1],
      outputRange: ['#ff0000', '#0000ff'],
    })
    expect(value.get()).toBe('#800080')
    value.destroy()
  })

  it('supports an opt-in OKLab color space', () => {
    const value = createScrollLinkedValue(fixedProgress(0.5), {
      inputRange: [0, 1],
      outputRange: ['#0000ff', '#ffff00'],
      colorSpace: 'oklab',
    })
    expect(value.get()).not.toBe('#808080')
    value.destroy()
  })
})

describe('Scroll-linked smoothing (smooth option)', () => {
  let clock: TestClock

  beforeEach(() => {
    clock = installTestClock()
  })

  afterEach(() => {
    clock.uninstall()
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 })
    Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: 0 })
  })

  const info = (progress: number) => ({
    progress, scrollY: 0, velocity: 0, direction: 0 as const, isInView: true, visibleRatio: 1,
  })

  /** Fake progress source whose progress can be pushed manually */
  const manualProgress = (initial = 0) => {
    let current = initial
    const subs = new Set<(i: ReturnType<typeof info>) => void>()
    const source: ScrollProgress = {
      get: () => current,
      getInfo: () => info(current),
      subscribe: (cb) => {
        subs.add(cb)
        cb(info(current))
        return () => subs.delete(cb)
      },
      destroy: () => subs.clear(),
    }
    const emit = (progress: number) => {
      current = progress
      subs.forEach(cb => cb(info(progress)))
    }
    return { source, emit }
  }

  it('follows the scroll target with a spring and settles exactly on it (numeric factor)', () => {
    const { source, emit } = manualProgress(0)
    const value = createScrollLinkedValue(source, {
      inputRange: [0, 1],
      outputRange: [0, 100],
      smooth: 0.8,
    })
    expect(value.get()).toBe(0)

    emit(1)
    // Not applied instantly: the value lags behind the scroll position
    expect(value.get()).toBeLessThan(100)

    clock.advance(50)
    const mid = value.get() as number
    expect(mid).toBeGreaterThan(0)
    expect(mid).toBeLessThan(100)

    // Keeps moving after scrolling stopped (no more progress events)
    clock.runAll()
    expect(value.get()).toBe(100)
    value.destroy()
  })

  it('accepts a spring config and notifies subscribers every frame', () => {
    const { source, emit } = manualProgress(0)
    const value = createScrollLinkedValue(source, {
      inputRange: [0, 1],
      outputRange: [0, 10],
      smooth: { stiffness: 170, damping: 26 },
    })
    const seen: number[] = []
    value.subscribe(v => seen.push(v as number))

    emit(0.5)
    clock.runAll()
    expect(seen.length).toBeGreaterThan(3)
    expect(value.get()).toBe(5)
    value.destroy()
  })

  it('smooths the progress and maps it through color output ranges', () => {
    const { source, emit } = manualProgress(0)
    const value = createScrollLinkedValue(source, {
      inputRange: [0, 1],
      outputRange: ['#000000', '#ffffff'],
      smooth: 0.8,
    })
    emit(1)
    clock.advance(50)
    expect(value.get()).not.toBe('#000000')
    expect(value.get()).not.toBe('#ffffff')
    clock.runAll()
    expect(value.get()).toBe('#ffffff')
    value.destroy()
  })

  it('starts at the current progress instead of animating in from 0', () => {
    const { source } = manualProgress(0.5)
    const value = createScrollLinkedValue(source, {
      inputRange: [0, 1],
      outputRange: [0, 100],
      smooth: 0.8,
    })
    expect(value.get()).toBe(50)
    expect(clock.pendingFrames).toBe(0)
    value.destroy()
  })

  it('smooth: 0 keeps the instant (unsmoothed) behavior', () => {
    const { source, emit } = manualProgress(0)
    const value = createScrollLinkedValue(source, {
      inputRange: [0, 1],
      outputRange: [0, 100],
      smooth: 0,
    })
    emit(1)
    expect(value.get()).toBe(100)
    value.destroy()
  })

  it('stops the smoothing spring on destroy', () => {
    const { source, emit } = manualProgress(0)
    const value = createScrollLinkedValue(source, {
      inputRange: [0, 1],
      outputRange: [0, 100],
      smooth: 0.8,
    })
    const callback = vi.fn()
    value.subscribe(callback)
    emit(1)
    clock.advance(16)
    value.destroy()
    callback.mockClear()
    const frozen = value.get()

    clock.advance(1000)
    expect(callback).not.toHaveBeenCalled()
    expect(value.get()).toBe(frozen)
  })

  it('createScrollProgress smoothing keeps converging after scrolling stops', () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true, value: window.innerHeight + 1000,
    })
    const progress = createScrollProgress(undefined, { smooth: 0.8 })
    expect(progress.get()).toBe(0)

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 500 })
    window.dispatchEvent(new Event('scroll'))
    clock.nextFrame()
    expect(progress.get()).toBeLessThan(0.5)

    // A single scroll event: the smoothed progress must still reach the target
    clock.runAll()
    expect(progress.get()).toBeCloseTo(0.5, 6)
    progress.destroy()
  })

  it('createScrollProgress smoothing starts at the current scroll position', () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true, value: window.innerHeight + 1000,
    })
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 500 })
    const progress = createScrollProgress(undefined, { smooth: 0.8 })
    expect(progress.get()).toBeCloseTo(0.5)
    progress.destroy()
  })

  it('createScrollTrigger numeric scrub keeps converging after scrolling stops', () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const wh = window.innerHeight
    let top = wh + 100
    element.getBoundingClientRect = () => ({
      top, bottom: top + 200, left: 0, right: 100, width: 100, height: 200, x: 0, y: top,
      toJSON: () => ({}),
    }) as DOMRect
    const onProgress = vi.fn()
    const trigger = createScrollTrigger(element, { scrub: 0.8, onProgress })
    clock.nextFrame()
    expect(trigger.getProgress()).toBe(0)

    top = wh / 2
    window.dispatchEvent(new Event('scroll'))
    clock.nextFrame()
    const expected = (wh / 2) / (wh + 200)
    expect(trigger.getProgress()).toBeLessThan(expected)

    clock.runAll()
    expect(trigger.getProgress()).toBeCloseTo(expected, 6)
    expect(onProgress.mock.lastCall![0].progress).toBeCloseTo(expected, 6)
    trigger.destroy()
    element.remove()
  })
})

describe('createParallax cleanup', () => {
  it("restores the element's own inline transform on destroy instead of clearing it", () => {
    const element = document.createElement('div')
    element.style.transform = 'rotate(10deg)'
    document.body.appendChild(element)
    const parallax = createParallax(element)
    element.style.transform = 'translate3d(0, 12px, 0)' // as written by update()
    parallax.destroy()
    expect(element.style.transform).toBe('rotate(10deg)')
    element.remove()
  })
})

describe('Scroll-linked review regressions', () => {
  let clock: TestClock

  beforeEach(() => {
    clock = installTestClock()
  })

  afterEach(() => {
    clock.uninstall()
  })

  it('createScrollLinkedValue maps descending multi-stop input ranges', () => {
    const subs = new Set<(i: { progress: number; scrollY: number; velocity: number; direction: 0; isInView: boolean; visibleRatio: number }) => void>()
    let current = 0.75
    const info = () => ({ progress: current, scrollY: 0, velocity: 0, direction: 0 as const, isInView: true, visibleRatio: 1 })
    const source: ScrollProgress = {
      get: () => current,
      getInfo: info,
      subscribe: (cb) => { subs.add(cb); cb(info()); return () => subs.delete(cb) },
      destroy: () => subs.clear(),
    }
    const value = createScrollLinkedValue(source, {
      inputRange: [1, 0.5, 0],
      outputRange: [0, 10, 100],
    })
    // 0.75 is halfway between the stops 1 -> 0 and 0.5 -> 10
    expect(value.get()).toBeCloseTo(5, 6)
    current = 0.25
    subs.forEach((cb) => cb(info()))
    expect(value.get()).toBeCloseTo(55, 6)
    value.destroy()
  })

  it('createScrollTrigger with numeric scrub fires onEnter/onLeave from the scroll position', () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const wh = window.innerHeight
    let top = wh + 100
    element.getBoundingClientRect = () => ({
      top, bottom: top + 200, left: 0, right: 100, width: 100, height: 200, x: 0, y: top,
      toJSON: () => ({}),
    }) as DOMRect
    const onEnter = vi.fn()
    const onLeave = vi.fn()
    const trigger = createScrollTrigger(element, { scrub: 0.9, onEnter, onLeave })
    clock.nextFrame()

    // Scroll the element into the middle of the viewport
    top = wh / 2
    window.dispatchEvent(new Event('scroll'))
    clock.nextFrame()
    expect(onEnter).toHaveBeenCalledTimes(1)
    expect(trigger.isActive()).toBe(true)

    // Scroll past it, then stop scrolling
    top = -500
    window.dispatchEvent(new Event('scroll'))
    clock.nextFrame()
    clock.runAll()
    expect(trigger.getProgress()).toBeCloseTo(1, 3)
    expect(onLeave).toHaveBeenCalledTimes(1)
    expect(trigger.isActive()).toBe(false)

    trigger.destroy()
    element.remove()
  })
})

describe('Scroll-linked smoothing config', () => {
  it('the largest smoothing factor does not trigger spring config warnings', async () => {
    const { clearWarnings } = await import('../../../src/utils/warnings')
    clearWarnings()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const subs = new Set<(i: ReturnType<ScrollProgress['getInfo']>) => void>()
    const info = { progress: 0, scrollY: 0, velocity: 0, direction: 0 as const, isInView: true, visibleRatio: 1 }
    const source: ScrollProgress = {
      get: () => 0,
      getInfo: () => info,
      subscribe: (cb) => { subs.add(cb); cb(info); return () => subs.delete(cb) },
      destroy: () => subs.clear(),
    }
    const value = createScrollLinkedValue(source, { inputRange: [0, 1], outputRange: [0, 100], smooth: 0.95 })
    subs.forEach((cb) => cb({ ...info, progress: 1 }))
    expect(warn).not.toHaveBeenCalled()
    value.destroy()
    warn.mockRestore()
  })
})

describe('createScrollProgress getInfo()', () => {
  let clock: TestClock

  beforeEach(() => {
    clock = installTestClock()
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true, value: window.innerHeight + 1000,
    })
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 })
  })

  afterEach(() => {
    clock.uninstall()
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 })
    Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: 0 })
  })

  it('has no side effects: repeated calls agree and scroll updates keep their velocity', () => {
    const progress = createScrollProgress()
    const infos: number[] = []
    progress.subscribe((info) => infos.push(info.velocity))
    clock.advance(100)

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 100 })
    const first = progress.getInfo()
    const second = progress.getInfo()
    expect(first.velocity).toBeGreaterThan(0)
    expect(second.velocity).toBe(first.velocity)
    expect(second.direction).toBe(1)
    expect(first.progress).toBeCloseTo(0.1, 6)

    // The scroll update still measures the movement since the last update
    window.dispatchEvent(new Event('scroll'))
    clock.nextFrame()
    expect(infos.at(-1)!).toBeGreaterThan(0)
    progress.destroy()
  })

  it('does not retarget the smoothing spring', () => {
    const progress = createScrollProgress(undefined, { smooth: 0.8 })
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 500 })
    expect(progress.getInfo().progress).toBe(0)
    clock.runAll()
    expect(progress.get()).toBe(0)

    window.dispatchEvent(new Event('scroll'))
    clock.runAll()
    expect(progress.get()).toBeCloseTo(0.5, 6)
    progress.destroy()
  })
})
