import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createPinchGesture,
  createRotateGesture,
  createSwipeGesture,
  createLongPressGesture,
  createGestures,
} from '@oxog/springkit'

describe('Advanced Gestures', () => {
  let element: HTMLElement

  beforeEach(() => {
    element = document.createElement('div')
    document.body.appendChild(element)
  })

  afterEach(() => {
    document.body.textContent = ''
  })

  describe('createPinchGesture', () => {
    it('should create pinch gesture controller', () => {
      const controller = createPinchGesture(element)

      expect(controller).toHaveProperty('enable')
      expect(controller).toHaveProperty('disable')
      expect(controller).toHaveProperty('isEnabled')
      expect(controller).toHaveProperty('destroy')

      controller.destroy()
    })

    it('should be enabled by default', () => {
      const controller = createPinchGesture(element)

      expect(controller.isEnabled()).toBe(true)

      controller.destroy()
    })

    it('should disable and enable', () => {
      const controller = createPinchGesture(element)

      controller.disable()
      expect(controller.isEnabled()).toBe(false)

      controller.enable()
      expect(controller.isEnabled()).toBe(true)

      controller.destroy()
    })

    it('should accept config options', () => {
      const onPinch = vi.fn()
      const onPinchStart = vi.fn()
      const onPinchEnd = vi.fn()

      const controller = createPinchGesture(element, {
        minScale: 0.5,
        maxScale: 3,
        rubberBand: true,
        rubberBandFactor: 0.3,
        spring: { stiffness: 300, damping: 25 },
        onPinch,
        onPinchStart,
        onPinchEnd,
      })

      expect(controller.isEnabled()).toBe(true)

      controller.destroy()
    })

    it('should clean up on destroy', () => {
      const controller = createPinchGesture(element)

      controller.destroy()

      // Should not throw
      expect(() => controller.destroy()).not.toThrow()
    })
  })

  describe('createRotateGesture', () => {
    it('should create rotate gesture controller', () => {
      const controller = createRotateGesture(element)

      expect(controller).toHaveProperty('enable')
      expect(controller).toHaveProperty('disable')
      expect(controller).toHaveProperty('isEnabled')
      expect(controller).toHaveProperty('destroy')

      controller.destroy()
    })

    it('should be enabled by default', () => {
      const controller = createRotateGesture(element)

      expect(controller.isEnabled()).toBe(true)

      controller.destroy()
    })

    it('should support enabled config option', () => {
      const controller = createRotateGesture(element, { enabled: false })

      expect(controller.isEnabled()).toBe(false)

      controller.destroy()
    })

    it('should accept config options', () => {
      const onRotate = vi.fn()
      const onRotateStart = vi.fn()
      const onRotateEnd = vi.fn()

      const controller = createRotateGesture(element, {
        threshold: 5,
        onRotate,
        onRotateStart,
        onRotateEnd,
      })

      expect(controller.isEnabled()).toBe(true)

      controller.destroy()
    })
  })

  describe('createSwipeGesture', () => {
    it('should create swipe gesture controller', () => {
      const controller = createSwipeGesture(element)

      expect(controller).toHaveProperty('enable')
      expect(controller).toHaveProperty('disable')
      expect(controller).toHaveProperty('isEnabled')
      expect(controller).toHaveProperty('destroy')

      controller.destroy()
    })

    it('should be enabled by default', () => {
      const controller = createSwipeGesture(element)

      expect(controller.isEnabled()).toBe(true)

      controller.destroy()
    })

    it('should accept config options', () => {
      const onSwipe = vi.fn()
      const onSwipeStart = vi.fn()
      const onSwipeEnd = vi.fn()

      const controller = createSwipeGesture(element, {
        velocityThreshold: 0.3,
        distanceThreshold: 30,
        maxDuration: 500,
        axis: 'x',
        onSwipe,
        onSwipeStart,
        onSwipeEnd,
      })

      expect(controller.isEnabled()).toBe(true)

      controller.destroy()
    })

    it('should support axis constraints', () => {
      const axes = ['x', 'y', 'both'] as const

      axes.forEach(axis => {
        const controller = createSwipeGesture(element, { axis })
        expect(controller.isEnabled()).toBe(true)
        controller.destroy()
      })
    })
  })

  describe('createLongPressGesture', () => {
    it('should create long press gesture controller', () => {
      const controller = createLongPressGesture(element)

      expect(controller).toHaveProperty('enable')
      expect(controller).toHaveProperty('disable')
      expect(controller).toHaveProperty('isEnabled')
      expect(controller).toHaveProperty('destroy')

      controller.destroy()
    })

    it('should be enabled by default', () => {
      const controller = createLongPressGesture(element)

      expect(controller.isEnabled()).toBe(true)

      controller.destroy()
    })

    it('should accept config options', () => {
      const onLongPress = vi.fn()
      const onPressStart = vi.fn()
      const onPressEnd = vi.fn()

      const controller = createLongPressGesture(element, {
        threshold: 800,
        movementTolerance: 15,
        onLongPress,
        onPressStart,
        onPressEnd,
      })

      expect(controller.isEnabled()).toBe(true)

      controller.destroy()
    })
  })

  describe('createGestures', () => {
    it('should create combined gesture controller', () => {
      const controller = createGestures(element, {
        pinch: {},
        rotate: {},
        swipe: {},
        longPress: {},
      })

      expect(controller).toHaveProperty('enable')
      expect(controller).toHaveProperty('disable')
      expect(controller).toHaveProperty('isEnabled')
      expect(controller).toHaveProperty('destroy')

      controller.destroy()
    })

    it('should enable/disable all gestures', () => {
      const controller = createGestures(element, {
        pinch: {},
        swipe: {},
      })

      expect(controller.isEnabled()).toBe(true)

      controller.disable()
      expect(controller.isEnabled()).toBe(false)

      controller.enable()
      expect(controller.isEnabled()).toBe(true)

      controller.destroy()
    })

    it('should only create specified gestures', () => {
      const controller = createGestures(element, {
        pinch: {},
      })

      expect(controller.isEnabled()).toBe(true)

      controller.destroy()
    })

    it('should accept callbacks for all gestures', () => {
      const onPinch = vi.fn()
      const onRotate = vi.fn()
      const onSwipe = vi.fn()
      const onLongPress = vi.fn()

      const controller = createGestures(element, {
        pinch: { onPinch },
        rotate: { onRotate },
        swipe: { onSwipe },
        longPress: { onLongPress },
      })

      expect(controller.isEnabled()).toBe(true)

      controller.destroy()
    })
  })

  describe('Touch event simulation', () => {
    it('should handle touch start', () => {
      const onPinchStart = vi.fn()
      const controller = createPinchGesture(element, { onPinchStart })

      const touch1 = { identifier: 0, clientX: 100, clientY: 100 }
      const touch2 = { identifier: 1, clientX: 200, clientY: 200 }

      const touchStartEvent = new TouchEvent('touchstart', {
        changedTouches: [touch1, touch2] as unknown as TouchList,
        touches: [touch1, touch2] as unknown as TouchList,
      })

      element.dispatchEvent(touchStartEvent)

      controller.destroy()
    })

    it('should handle pointer events for swipe', () => {
      const onSwipeStart = vi.fn()
      const controller = createSwipeGesture(element, { onSwipeStart })

      const pointerEvent = new PointerEvent('pointerdown', {
        pointerId: 1,
        clientX: 100,
        clientY: 100,
      })

      element.dispatchEvent(pointerEvent)

      expect(onSwipeStart).toHaveBeenCalled()

      controller.destroy()
    })

    it('should handle pointer events for long press', () => {
      vi.useFakeTimers()

      const onPressStart = vi.fn()
      const controller = createLongPressGesture(element, { onPressStart })

      const pointerEvent = new PointerEvent('pointerdown', {
        pointerId: 1,
        clientX: 100,
        clientY: 100,
      })

      element.dispatchEvent(pointerEvent)

      expect(onPressStart).toHaveBeenCalled()

      controller.destroy()
      vi.useRealTimers()
    })
  })
})
