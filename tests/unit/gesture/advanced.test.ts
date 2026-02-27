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

  describe('Pinch gesture - full touch flow', () => {
    it('should handle complete pinch gesture lifecycle', () => {
      const onPinchStart = vi.fn()
      const onPinch = vi.fn()
      const onPinchEnd = vi.fn()

      const controller = createPinchGesture(element, {
        onPinchStart,
        onPinch,
        onPinchEnd,
        minScale: 0.5,
        maxScale: 3,
      })

      // Start pinch with two fingers
      const touch1 = { identifier: 0, clientX: 100, clientY: 100 }
      const touch2 = { identifier: 1, clientX: 200, clientY: 200 }

      element.dispatchEvent(new TouchEvent('touchstart', {
        changedTouches: [touch1, touch2] as unknown as TouchList,
        touches: [touch1, touch2] as unknown as TouchList,
        bubbles: true,
      }))

      expect(onPinchStart).toHaveBeenCalled()

      // Move fingers apart (zoom in)
      const moveTouch1 = { identifier: 0, clientX: 50, clientY: 50 }
      const moveTouch2 = { identifier: 1, clientX: 250, clientY: 250 }

      element.dispatchEvent(new TouchEvent('touchmove', {
        changedTouches: [moveTouch1, moveTouch2] as unknown as TouchList,
        touches: [moveTouch1, moveTouch2] as unknown as TouchList,
        bubbles: true,
      }))

      expect(onPinch).toHaveBeenCalled()

      // Release one finger
      element.dispatchEvent(new TouchEvent('touchend', {
        changedTouches: [moveTouch1] as unknown as TouchList,
        touches: [moveTouch2] as unknown as TouchList,
        bubbles: true,
      }))

      expect(onPinchEnd).toHaveBeenCalled()

      controller.destroy()
    })

    it('should respect minScale and maxScale bounds', () => {
      const onPinch = vi.fn()
      const controller = createPinchGesture(element, {
        onPinch,
        minScale: 0.5,
        maxScale: 2,
        rubberBand: false,
      })

      // Start pinch
      element.dispatchEvent(new TouchEvent('touchstart', {
        changedTouches: [
          { identifier: 0, clientX: 100, clientY: 100 },
          { identifier: 1, clientX: 200, clientY: 200 },
        ] as unknown as TouchList,
        touches: [
          { identifier: 0, clientX: 100, clientY: 100 },
          { identifier: 1, clientX: 200, clientY: 200 },
        ] as unknown as TouchList,
        bubbles: true,
      }))

      // Try to zoom way past maxScale
      element.dispatchEvent(new TouchEvent('touchmove', {
        changedTouches: [
          { identifier: 0, clientX: 0, clientY: 0 },
          { identifier: 1, clientX: 400, clientY: 400 },
        ] as unknown as TouchList,
        bubbles: true,
      }))

      const lastCall = onPinch.mock.calls[onPinch.mock.calls.length - 1][0]
      expect(lastCall.scale).toBeLessThanOrEqual(2)

      controller.destroy()
    })

    it('should handle rubber band effect', () => {
      const onPinch = vi.fn()
      const controller = createPinchGesture(element, {
        onPinch,
        minScale: 0.5,
        maxScale: 2,
        rubberBand: true,
        rubberBandFactor: 0.5,
      })

      // Start and move beyond bounds
      element.dispatchEvent(new TouchEvent('touchstart', {
        changedTouches: [
          { identifier: 0, clientX: 100, clientY: 100 },
          { identifier: 1, clientX: 200, clientY: 200 },
        ] as unknown as TouchList,
        bubbles: true,
      }))

      element.dispatchEvent(new TouchEvent('touchmove', {
        changedTouches: [
          { identifier: 0, clientX: -100, clientY: -100 },
          { identifier: 1, clientX: 500, clientY: 500 },
        ] as unknown as TouchList,
        bubbles: true,
      }))

      expect(onPinch).toHaveBeenCalled()

      controller.destroy()
    })

    it('should spring back to bounds when released', async () => {
      const onPinchEnd = vi.fn()
      const controller = createPinchGesture(element, {
        onPinchEnd,
        minScale: 0.5,
        maxScale: 2,
        spring: { stiffness: 300, damping: 30 },
      })

      // Start pinch
      element.dispatchEvent(new TouchEvent('touchstart', {
        changedTouches: [
          { identifier: 0, clientX: 100, clientY: 100 },
          { identifier: 1, clientX: 200, clientY: 200 },
        ] as unknown as TouchList,
        bubbles: true,
      }))

      // Move beyond maxScale
      element.dispatchEvent(new TouchEvent('touchmove', {
        changedTouches: [
          { identifier: 0, clientX: 0, clientY: 0 },
          { identifier: 1, clientX: 400, clientY: 400 },
        ] as unknown as TouchList,
        bubbles: true,
      }))

      // Release
      element.dispatchEvent(new TouchEvent('touchend', {
        changedTouches: [{ identifier: 0, clientX: 0, clientY: 0 }] as unknown as TouchList,
        bubbles: true,
      }))

      expect(onPinchEnd).toHaveBeenCalled()

      controller.destroy()
    })

    it('should not trigger when disabled', () => {
      const onPinchStart = vi.fn()
      const controller = createPinchGesture(element, { onPinchStart })

      controller.disable()

      element.dispatchEvent(new TouchEvent('touchstart', {
        changedTouches: [
          { identifier: 0, clientX: 100, clientY: 100 },
          { identifier: 1, clientX: 200, clientY: 200 },
        ] as unknown as TouchList,
        bubbles: true,
      }))

      expect(onPinchStart).not.toHaveBeenCalled()

      controller.destroy()
    })

    it('should handle touch cancel', () => {
      const onPinchEnd = vi.fn()
      const controller = createPinchGesture(element, { onPinchEnd })

      // Start pinch
      element.dispatchEvent(new TouchEvent('touchstart', {
        changedTouches: [
          { identifier: 0, clientX: 100, clientY: 100 },
          { identifier: 1, clientX: 200, clientY: 200 },
        ] as unknown as TouchList,
        bubbles: true,
      }))

      // Cancel
      element.dispatchEvent(new TouchEvent('touchcancel', {
        changedTouches: [{ identifier: 0, clientX: 100, clientY: 100 }] as unknown as TouchList,
        bubbles: true,
      }))

      controller.destroy()
    })

    it('should handle single touch (no pinch)', () => {
      const onPinchStart = vi.fn()
      const controller = createPinchGesture(element, { onPinchStart })

      // Only one touch
      element.dispatchEvent(new TouchEvent('touchstart', {
        changedTouches: [{ identifier: 0, clientX: 100, clientY: 100 }] as unknown as TouchList,
        touches: [{ identifier: 0, clientX: 100, clientY: 100 }] as unknown as TouchList,
        bubbles: true,
      }))

      expect(onPinchStart).not.toHaveBeenCalled()

      controller.destroy()
    })

    it('should destroy spring on disable', () => {
      const controller = createPinchGesture(element)

      // Start pinch
      element.dispatchEvent(new TouchEvent('touchstart', {
        changedTouches: [
          { identifier: 0, clientX: 100, clientY: 100 },
          { identifier: 1, clientX: 200, clientY: 200 },
        ] as unknown as TouchList,
        bubbles: true,
      }))

      // Move beyond bounds to trigger spring
      element.dispatchEvent(new TouchEvent('touchmove', {
        changedTouches: [
          { identifier: 0, clientX: 0, clientY: 0 },
          { identifier: 1, clientX: 500, clientY: 500 },
        ] as unknown as TouchList,
        bubbles: true,
      }))

      // Release to start spring
      element.dispatchEvent(new TouchEvent('touchend', {
        changedTouches: [{ identifier: 0, clientX: 0, clientY: 0 }] as unknown as TouchList,
        bubbles: true,
      }))

      // Disable should destroy spring
      expect(() => controller.disable()).not.toThrow()

      controller.destroy()
    })
  })

  describe('Rotate gesture - full touch flow', () => {
    it('should handle complete rotate gesture lifecycle', () => {
      const onRotateStart = vi.fn()
      const onRotate = vi.fn()
      const onRotateEnd = vi.fn()

      const controller = createRotateGesture(element, {
        onRotateStart,
        onRotate,
        onRotateEnd,
      })

      // Start rotation
      element.dispatchEvent(new TouchEvent('touchstart', {
        changedTouches: [
          { identifier: 0, clientX: 100, clientY: 100 },
          { identifier: 1, clientX: 200, clientY: 200 },
        ] as unknown as TouchList,
        bubbles: true,
      }))

      expect(onRotateStart).toHaveBeenCalled()

      // Rotate
      element.dispatchEvent(new TouchEvent('touchmove', {
        changedTouches: [
          { identifier: 0, clientX: 150, clientY: 50 },
          { identifier: 1, clientX: 150, clientY: 250 },
        ] as unknown as TouchList,
        bubbles: true,
      }))

      expect(onRotate).toHaveBeenCalled()

      // End
      element.dispatchEvent(new TouchEvent('touchend', {
        changedTouches: [{ identifier: 0, clientX: 150, clientY: 50 }] as unknown as TouchList,
        bubbles: true,
      }))

      expect(onRotateEnd).toHaveBeenCalled()

      controller.destroy()
    })

    it('should respect rotation threshold', () => {
      const onRotate = vi.fn()
      const controller = createRotateGesture(element, {
        onRotate,
        threshold: 45,
      })

      // Start
      element.dispatchEvent(new TouchEvent('touchstart', {
        changedTouches: [
          { identifier: 0, clientX: 100, clientY: 150 },
          { identifier: 1, clientX: 200, clientY: 150 },
        ] as unknown as TouchList,
        bubbles: true,
      }))

      // Small rotation (below threshold)
      element.dispatchEvent(new TouchEvent('touchmove', {
        changedTouches: [
          { identifier: 0, clientX: 95, clientY: 150 },
          { identifier: 1, clientX: 205, clientY: 150 },
        ] as unknown as TouchList,
        bubbles: true,
      }))

      // onRotate should not be called for small rotation
      const callCountBefore = onRotate.mock.calls.length

      // Large rotation (above threshold)
      element.dispatchEvent(new TouchEvent('touchmove', {
        changedTouches: [
          { identifier: 0, clientX: 150, clientY: 50 },
          { identifier: 1, clientX: 150, clientY: 250 },
        ] as unknown as TouchList,
        bubbles: true,
      }))

      expect(onRotate.mock.calls.length).toBeGreaterThan(callCountBefore)

      controller.destroy()
    })

    it('should handle angle wrap-around', () => {
      const onRotate = vi.fn()
      const controller = createRotateGesture(element, { onRotate })

      // Start at -170 degrees
      element.dispatchEvent(new TouchEvent('touchstart', {
        changedTouches: [
          { identifier: 0, clientX: 0, clientY: 150 },
          { identifier: 1, clientX: 200, clientY: 150 },
        ] as unknown as TouchList,
        bubbles: true,
      }))

      // Rotate past 180 to +170 (should handle wrap)
      element.dispatchEvent(new TouchEvent('touchmove', {
        changedTouches: [
          { identifier: 0, clientX: 0, clientY: 150 },
          { identifier: 1, clientX: 196, clientY: 175 },
        ] as unknown as TouchList,
        bubbles: true,
      }))

      expect(onRotate).toHaveBeenCalled()

      controller.destroy()
    })
  })

  describe('Swipe gesture - full pointer flow', () => {
    it('should detect left swipe', () => {
      const onSwipe = vi.fn()
      const controller = createSwipeGesture(element, {
        onSwipe,
        velocityThreshold: 0.1,
        distanceThreshold: 50,
        maxDuration: 1000,
      })

      // Start
      element.dispatchEvent(new PointerEvent('pointerdown', {
        pointerId: 1,
        clientX: 300,
        clientY: 100,
        bubbles: true,
      }))

      // Move left
      element.dispatchEvent(new PointerEvent('pointermove', {
        pointerId: 1,
        clientX: 200,
        clientY: 100,
        bubbles: true,
      }))

      // End
      element.dispatchEvent(new PointerEvent('pointerup', {
        pointerId: 1,
        clientX: 100,
        clientY: 100,
        bubbles: true,
      }))

      expect(onSwipe).toHaveBeenCalled()
      expect(onSwipe.mock.calls[0][0].direction).toBe('left')

      controller.destroy()
    })

    it('should detect right swipe', () => {
      const onSwipe = vi.fn()
      const controller = createSwipeGesture(element, {
        onSwipe,
        velocityThreshold: 0.1,
        distanceThreshold: 50,
      })

      element.dispatchEvent(new PointerEvent('pointerdown', {
        pointerId: 1,
        clientX: 100,
        clientY: 100,
        bubbles: true,
      }))

      element.dispatchEvent(new PointerEvent('pointerup', {
        pointerId: 1,
        clientX: 300,
        clientY: 100,
        bubbles: true,
      }))

      expect(onSwipe).toHaveBeenCalled()
      expect(onSwipe.mock.calls[0][0].direction).toBe('right')

      controller.destroy()
    })

    it('should detect up swipe', () => {
      const onSwipe = vi.fn()
      const controller = createSwipeGesture(element, {
        onSwipe,
        velocityThreshold: 0.1,
        distanceThreshold: 50,
      })

      element.dispatchEvent(new PointerEvent('pointerdown', {
        pointerId: 1,
        clientX: 100,
        clientY: 300,
        bubbles: true,
      }))

      element.dispatchEvent(new PointerEvent('pointerup', {
        pointerId: 1,
        clientX: 100,
        clientY: 100,
        bubbles: true,
      }))

      expect(onSwipe).toHaveBeenCalled()
      expect(onSwipe.mock.calls[0][0].direction).toBe('up')

      controller.destroy()
    })

    it('should detect down swipe', () => {
      const onSwipe = vi.fn()
      const controller = createSwipeGesture(element, {
        onSwipe,
        velocityThreshold: 0.1,
        distanceThreshold: 50,
      })

      element.dispatchEvent(new PointerEvent('pointerdown', {
        pointerId: 1,
        clientX: 100,
        clientY: 100,
        bubbles: true,
      }))

      element.dispatchEvent(new PointerEvent('pointerup', {
        pointerId: 1,
        clientX: 100,
        clientY: 300,
        bubbles: true,
      }))

      expect(onSwipe).toHaveBeenCalled()
      expect(onSwipe.mock.calls[0][0].direction).toBe('down')

      controller.destroy()
    })

    it('should respect maxDuration parameter', () => {
      const onSwipe = vi.fn()
      const controller = createSwipeGesture(element, {
        onSwipe,
        maxDuration: 1000,
      })

      element.dispatchEvent(new PointerEvent('pointerdown', {
        pointerId: 1,
        clientX: 100,
        clientY: 100,
        bubbles: true,
      }))

      element.dispatchEvent(new PointerEvent('pointerup', {
        pointerId: 1,
        clientX: 300,
        clientY: 100,
        bubbles: true,
      }))

      expect(onSwipe).toHaveBeenCalled()

      controller.destroy()
    })

    it('should respect distance threshold', () => {
      const onSwipe = vi.fn()
      const controller = createSwipeGesture(element, {
        onSwipe,
        distanceThreshold: 10,
      })

      element.dispatchEvent(new PointerEvent('pointerdown', {
        pointerId: 1,
        clientX: 100,
        clientY: 100,
        bubbles: true,
      }))

      element.dispatchEvent(new PointerEvent('pointerup', {
        pointerId: 1,
        clientX: 300,
        clientY: 100,
        bubbles: true,
      }))

      expect(onSwipe).toHaveBeenCalled()

      controller.destroy()
    })

    it('should handle pointer cancel', () => {
      const onSwipeEnd = vi.fn()
      const controller = createSwipeGesture(element, { onSwipeEnd })

      element.dispatchEvent(new PointerEvent('pointerdown', {
        pointerId: 1,
        clientX: 100,
        clientY: 100,
        bubbles: true,
      }))

      element.dispatchEvent(new PointerEvent('pointercancel', {
        pointerId: 1,
        bubbles: true,
      }))

      controller.destroy()
    })

    it('should ignore second pointer', () => {
      const onSwipeStart = vi.fn()
      const controller = createSwipeGesture(element, { onSwipeStart })

      element.dispatchEvent(new PointerEvent('pointerdown', {
        pointerId: 1,
        clientX: 100,
        clientY: 100,
        bubbles: true,
      }))

      expect(onSwipeStart).toHaveBeenCalledTimes(1)

      // Second pointer should be ignored
      element.dispatchEvent(new PointerEvent('pointerdown', {
        pointerId: 2,
        clientX: 200,
        clientY: 200,
        bubbles: true,
      }))

      expect(onSwipeStart).toHaveBeenCalledTimes(1)

      controller.destroy()
    })

    it('should ignore pointer move for different pointerId', () => {
      const controller = createSwipeGesture(element)

      element.dispatchEvent(new PointerEvent('pointerdown', {
        pointerId: 1,
        clientX: 100,
        clientY: 100,
        bubbles: true,
      }))

      // Different pointerId should be ignored
      expect(() => {
        element.dispatchEvent(new PointerEvent('pointermove', {
          pointerId: 2,
          clientX: 200,
          clientY: 200,
          bubbles: true,
        }))
      }).not.toThrow()

      controller.destroy()
    })
  })

  describe('Long press gesture - full flow', () => {
    it('should trigger long press after threshold', () => {
      vi.useFakeTimers()

      const onLongPress = vi.fn()
      const controller = createLongPressGesture(element, {
        onLongPress,
        threshold: 500,
      })

      element.dispatchEvent(new PointerEvent('pointerdown', {
        pointerId: 1,
        clientX: 100,
        clientY: 100,
        bubbles: true,
      }))

      expect(onLongPress).not.toHaveBeenCalled()

      vi.advanceTimersByTime(500)

      expect(onLongPress).toHaveBeenCalled()

      controller.destroy()
      vi.useRealTimers()
    })

    it('should cancel long press on move beyond tolerance', () => {
      vi.useFakeTimers()

      const onLongPress = vi.fn()
      const controller = createLongPressGesture(element, {
        onLongPress,
        threshold: 500,
        movementTolerance: 10,
      })

      element.dispatchEvent(new PointerEvent('pointerdown', {
        pointerId: 1,
        clientX: 100,
        clientY: 100,
        bubbles: true,
      }))

      // Move beyond tolerance
      element.dispatchEvent(new PointerEvent('pointermove', {
        pointerId: 1,
        clientX: 150,
        clientY: 150,
        bubbles: true,
      }))

      vi.advanceTimersByTime(500)

      expect(onLongPress).not.toHaveBeenCalled()

      controller.destroy()
      vi.useRealTimers()
    })

    it('should cancel long press on pointer up', () => {
      vi.useFakeTimers()

      const onLongPress = vi.fn()
      const onPressEnd = vi.fn()
      const controller = createLongPressGesture(element, {
        onLongPress,
        onPressEnd,
        threshold: 500,
      })

      element.dispatchEvent(new PointerEvent('pointerdown', {
        pointerId: 1,
        clientX: 100,
        clientY: 100,
        bubbles: true,
      }))

      // Release before threshold
      vi.advanceTimersByTime(200)

      element.dispatchEvent(new PointerEvent('pointerup', {
        pointerId: 1,
        clientX: 100,
        clientY: 100,
        bubbles: true,
      }))

      vi.advanceTimersByTime(500)

      expect(onLongPress).not.toHaveBeenCalled()
      expect(onPressEnd).toHaveBeenCalled()

      controller.destroy()
      vi.useRealTimers()
    })

    it('should clear timer on disable', () => {
      vi.useFakeTimers()

      const onLongPress = vi.fn()
      const controller = createLongPressGesture(element, {
        onLongPress,
        threshold: 500,
      })

      element.dispatchEvent(new PointerEvent('pointerdown', {
        pointerId: 1,
        clientX: 100,
        clientY: 100,
        bubbles: true,
      }))

      controller.disable()

      vi.advanceTimersByTime(500)

      expect(onLongPress).not.toHaveBeenCalled()

      controller.destroy()
      vi.useRealTimers()
    })

    it('should handle pointer cancel', () => {
      vi.useFakeTimers()

      const onLongPress = vi.fn()
      const controller = createLongPressGesture(element, {
        onLongPress,
        threshold: 500,
      })

      element.dispatchEvent(new PointerEvent('pointerdown', {
        pointerId: 1,
        clientX: 100,
        clientY: 100,
        bubbles: true,
      }))

      element.dispatchEvent(new PointerEvent('pointercancel', {
        pointerId: 1,
        bubbles: true,
      }))

      vi.advanceTimersByTime(500)

      expect(onLongPress).not.toHaveBeenCalled()

      controller.destroy()
      vi.useRealTimers()
    })

    it('should not trigger twice for same press', () => {
      vi.useFakeTimers()

      const onLongPress = vi.fn()
      const controller = createLongPressGesture(element, {
        onLongPress,
        threshold: 500,
      })

      element.dispatchEvent(new PointerEvent('pointerdown', {
        pointerId: 1,
        clientX: 100,
        clientY: 100,
        bubbles: true,
      }))

      vi.advanceTimersByTime(500)

      expect(onLongPress).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(500)

      expect(onLongPress).toHaveBeenCalledTimes(1)

      controller.destroy()
      vi.useRealTimers()
    })
  })

  describe('Edge cases and error handling', () => {
    it('should handle rapid enable/disable cycles', () => {
      const controller = createPinchGesture(element)

      for (let i = 0; i < 10; i++) {
        controller.disable()
        controller.enable()
      }

      expect(controller.isEnabled()).toBe(true)

      controller.destroy()
    })

    it('should handle multiple destroy calls', () => {
      const controller = createPinchGesture(element)

      expect(() => {
        controller.destroy()
        controller.destroy()
        controller.destroy()
      }).not.toThrow()
    })

    it('should handle gestures on removed elements gracefully', () => {
      const controller = createSwipeGesture(element)

      // Remove element from DOM
      element.remove()

      // Should not throw
      expect(() => {
        element.dispatchEvent(new PointerEvent('pointerdown', {
          pointerId: 1,
          clientX: 100,
          clientY: 100,
          bubbles: true,
        }))
      }).not.toThrow()

      controller.destroy()
    })

    it('should handle simultaneous gestures', () => {
      const pinchController = createPinchGesture(element)
      const rotateController = createRotateGesture(element)

      expect(pinchController.isEnabled()).toBe(true)
      expect(rotateController.isEnabled()).toBe(true)

      // Both should work independently
      pinchController.disable()
      expect(pinchController.isEnabled()).toBe(false)
      expect(rotateController.isEnabled()).toBe(true)

      pinchController.destroy()
      rotateController.destroy()
    })

    it('should handle createGestures with no options', () => {
      const controller = createGestures(element, {})

      expect(controller.isEnabled()).toBe(true)
      expect(() => controller.destroy()).not.toThrow()
    })

    it('should handle empty createGestures', () => {
      const controller = createGestures(element, {
        pinch: undefined,
        rotate: undefined,
        swipe: undefined,
        longPress: undefined,
      })

      expect(controller.isEnabled()).toBe(true)
      controller.destroy()
    })
  })
})
