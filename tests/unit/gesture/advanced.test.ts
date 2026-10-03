import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createPinchGesture,
  createRotateGesture,
  createSwipeGesture,
  createLongPressGesture,
  createGestures,
} from '@oxog/springkit'
import { installTestClock, type TestClock } from '../../../src/testing'

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
        velocityThreshold: 300,
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
        changedTouches: [touch1, touch2] as unknown as Touch[],
        touches: [touch1, touch2] as unknown as Touch[],
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
        changedTouches: [touch1, touch2] as unknown as Touch[],
        touches: [touch1, touch2] as unknown as Touch[],
        bubbles: true,
      }))

      expect(onPinchStart).toHaveBeenCalled()

      // Move fingers apart (zoom in)
      const moveTouch1 = { identifier: 0, clientX: 50, clientY: 50 }
      const moveTouch2 = { identifier: 1, clientX: 250, clientY: 250 }

      element.dispatchEvent(new TouchEvent('touchmove', {
        changedTouches: [moveTouch1, moveTouch2] as unknown as Touch[],
        touches: [moveTouch1, moveTouch2] as unknown as Touch[],
        bubbles: true,
      }))

      expect(onPinch).toHaveBeenCalled()

      // Release one finger
      element.dispatchEvent(new TouchEvent('touchend', {
        changedTouches: [moveTouch1] as unknown as Touch[],
        touches: [moveTouch2] as unknown as Touch[],
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
        ] as unknown as Touch[],
        touches: [
          { identifier: 0, clientX: 100, clientY: 100 },
          { identifier: 1, clientX: 200, clientY: 200 },
        ] as unknown as Touch[],
        bubbles: true,
      }))

      // Try to zoom way past maxScale
      element.dispatchEvent(new TouchEvent('touchmove', {
        changedTouches: [
          { identifier: 0, clientX: 0, clientY: 0 },
          { identifier: 1, clientX: 400, clientY: 400 },
        ] as unknown as Touch[],
        bubbles: true,
      }))

      const lastCall = onPinch.mock.calls[onPinch.mock.calls.length - 1]![0]
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
        ] as unknown as Touch[],
        bubbles: true,
      }))

      element.dispatchEvent(new TouchEvent('touchmove', {
        changedTouches: [
          { identifier: 0, clientX: -100, clientY: -100 },
          { identifier: 1, clientX: 500, clientY: 500 },
        ] as unknown as Touch[],
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
        ] as unknown as Touch[],
        bubbles: true,
      }))

      // Move beyond maxScale
      element.dispatchEvent(new TouchEvent('touchmove', {
        changedTouches: [
          { identifier: 0, clientX: 0, clientY: 0 },
          { identifier: 1, clientX: 400, clientY: 400 },
        ] as unknown as Touch[],
        bubbles: true,
      }))

      // Release
      element.dispatchEvent(new TouchEvent('touchend', {
        changedTouches: [{ identifier: 0, clientX: 0, clientY: 0 }] as unknown as Touch[],
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
        ] as unknown as Touch[],
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
        ] as unknown as Touch[],
        bubbles: true,
      }))

      // Cancel
      element.dispatchEvent(new TouchEvent('touchcancel', {
        changedTouches: [{ identifier: 0, clientX: 100, clientY: 100 }] as unknown as Touch[],
        bubbles: true,
      }))

      controller.destroy()
    })

    it('should handle single touch (no pinch)', () => {
      const onPinchStart = vi.fn()
      const controller = createPinchGesture(element, { onPinchStart })

      // Only one touch
      element.dispatchEvent(new TouchEvent('touchstart', {
        changedTouches: [{ identifier: 0, clientX: 100, clientY: 100 }] as unknown as Touch[],
        touches: [{ identifier: 0, clientX: 100, clientY: 100 }] as unknown as Touch[],
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
        ] as unknown as Touch[],
        bubbles: true,
      }))

      // Move beyond bounds to trigger spring
      element.dispatchEvent(new TouchEvent('touchmove', {
        changedTouches: [
          { identifier: 0, clientX: 0, clientY: 0 },
          { identifier: 1, clientX: 500, clientY: 500 },
        ] as unknown as Touch[],
        bubbles: true,
      }))

      // Release to start spring
      element.dispatchEvent(new TouchEvent('touchend', {
        changedTouches: [{ identifier: 0, clientX: 0, clientY: 0 }] as unknown as Touch[],
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
        ] as unknown as Touch[],
        bubbles: true,
      }))

      expect(onRotateStart).toHaveBeenCalled()

      // Rotate
      element.dispatchEvent(new TouchEvent('touchmove', {
        changedTouches: [
          { identifier: 0, clientX: 150, clientY: 50 },
          { identifier: 1, clientX: 150, clientY: 250 },
        ] as unknown as Touch[],
        bubbles: true,
      }))

      expect(onRotate).toHaveBeenCalled()

      // End
      element.dispatchEvent(new TouchEvent('touchend', {
        changedTouches: [{ identifier: 0, clientX: 150, clientY: 50 }] as unknown as Touch[],
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
        ] as unknown as Touch[],
        bubbles: true,
      }))

      // Small rotation (below threshold)
      element.dispatchEvent(new TouchEvent('touchmove', {
        changedTouches: [
          { identifier: 0, clientX: 95, clientY: 150 },
          { identifier: 1, clientX: 205, clientY: 150 },
        ] as unknown as Touch[],
        bubbles: true,
      }))

      // onRotate should not be called for small rotation
      const callCountBefore = onRotate.mock.calls.length

      // Large rotation (above threshold)
      element.dispatchEvent(new TouchEvent('touchmove', {
        changedTouches: [
          { identifier: 0, clientX: 150, clientY: 50 },
          { identifier: 1, clientX: 150, clientY: 250 },
        ] as unknown as Touch[],
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
        ] as unknown as Touch[],
        bubbles: true,
      }))

      // Rotate past 180 to +170 (should handle wrap)
      element.dispatchEvent(new TouchEvent('touchmove', {
        changedTouches: [
          { identifier: 0, clientX: 0, clientY: 150 },
          { identifier: 1, clientX: 196, clientY: 175 },
        ] as unknown as Touch[],
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
        velocityThreshold: 100,
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
      expect(onSwipe.mock.calls[0]![0].direction).toBe('left')

      controller.destroy()
    })

    it('should detect right swipe', () => {
      const onSwipe = vi.fn()
      const controller = createSwipeGesture(element, {
        onSwipe,
        velocityThreshold: 100,
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
      expect(onSwipe.mock.calls[0]![0].direction).toBe('right')

      controller.destroy()
    })

    it('should detect up swipe', () => {
      const onSwipe = vi.fn()
      const controller = createSwipeGesture(element, {
        onSwipe,
        velocityThreshold: 100,
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
      expect(onSwipe.mock.calls[0]![0].direction).toBe('up')

      controller.destroy()
    })

    it('should detect down swipe', () => {
      const onSwipe = vi.fn()
      const controller = createSwipeGesture(element, {
        onSwipe,
        velocityThreshold: 100,
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
      expect(onSwipe.mock.calls[0]![0].direction).toBe('down')

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

describe('Advanced Gestures regressions', () => {
  let element: HTMLElement

  const touch = (type: string, touches: Array<{ identifier: number; clientX: number; clientY: number }>) =>
    new TouchEvent(type, { changedTouches: touches as unknown as Touch[], bubbles: true, cancelable: true })

  const pointer = (type: string, pointerId: number, clientX: number, clientY: number) =>
    new PointerEvent(type, { pointerId, clientX, clientY, bubbles: true })

  beforeEach(() => {
    element = document.createElement('div')
    document.body.appendChild(element)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.body.textContent = ''
  })

  it('rotate keeps counting past 180° instead of flipping sign', () => {
    const onRotate = vi.fn()
    const controller = createRotateGesture(element, { onRotate })
    const r = 100
    const at = (deg: number) => {
      const rad = (deg * Math.PI) / 180
      return { identifier: 1, clientX: 200 + r * Math.cos(rad), clientY: 200 + r * Math.sin(rad) }
    }

    element.dispatchEvent(touch('touchstart', [{ identifier: 0, clientX: 200, clientY: 200 }, at(0)]))
    for (const deg of [60, 120, 170, 200, 250, 300]) {
      element.dispatchEvent(touch('touchmove', [at(deg)]))
    }

    const lastState = onRotate.mock.calls[onRotate.mock.calls.length - 1]![0]
    expect(lastState.angle).toBeCloseTo(300)
    controller.destroy()
  })

  it('rotate handles crossing the ±180° boundary of atan2', () => {
    const onRotate = vi.fn()
    const controller = createRotateGesture(element, { onRotate })

    // Second finger to the left of the first: atan2 ≈ 180°
    element.dispatchEvent(touch('touchstart', [
      { identifier: 0, clientX: 200, clientY: 200 },
      { identifier: 1, clientX: 100, clientY: 199 },
    ]))
    // Small clockwise move to just past 180 (atan2 flips to ≈ -179°)
    element.dispatchEvent(touch('touchmove', [{ identifier: 1, clientX: 100, clientY: 202 }]))

    const lastState = onRotate.mock.calls[onRotate.mock.calls.length - 1]![0]
    expect(Math.abs(lastState.angle)).toBeLessThan(5)
    controller.destroy()
  })

  it('pinch rubber band never amplifies small overshoot or produces a negative scale', () => {
    const onPinch = vi.fn()
    const controller = createPinchGesture(element, { onPinch, minScale: 0.5, maxScale: 2, rubberBandFactor: 0.5 })

    element.dispatchEvent(touch('touchstart', [
      { identifier: 0, clientX: 0, clientY: 0 },
      { identifier: 1, clientX: 100, clientY: 0 },
    ]))
    // Raw scale 0.45 -> 0.05 below minScale
    element.dispatchEvent(touch('touchmove', [{ identifier: 1, clientX: 45, clientY: 0 }]))

    const scale = onPinch.mock.calls[onPinch.mock.calls.length - 1]![0].scale
    expect(scale).toBeLessThanOrEqual(0.5)
    expect(scale).toBeGreaterThanOrEqual(0.45)

    // Raw scale 2.1 -> 0.1 above maxScale
    element.dispatchEvent(touch('touchmove', [{ identifier: 1, clientX: 210, clientY: 0 }]))
    const scale2 = onPinch.mock.calls[onPinch.mock.calls.length - 1]![0].scale
    expect(scale2).toBeGreaterThanOrEqual(2)
    expect(scale2).toBeLessThanOrEqual(2.1)
    controller.destroy()
  })

  it('pinch does not produce Infinity/NaN when both fingers start at the same point', () => {
    const onPinch = vi.fn()
    const controller = createPinchGesture(element, { onPinch, rubberBand: false })

    element.dispatchEvent(touch('touchstart', [
      { identifier: 0, clientX: 100, clientY: 100 },
      { identifier: 1, clientX: 100, clientY: 100 },
    ]))
    element.dispatchEvent(touch('touchmove', [{ identifier: 1, clientX: 150, clientY: 100 }]))
    element.dispatchEvent(touch('touchmove', [{ identifier: 1, clientX: 200, clientY: 100 }]))

    for (const call of onPinch.mock.calls) {
      expect(Number.isFinite(call[0].scale)).toBe(true)
    }
    const lastScale = onPinch.mock.calls[onPinch.mock.calls.length - 1]![0].scale
    expect(lastScale).toBeCloseTo(2)
    controller.destroy()
  })

  it('swipe uses the velocity of the last moves when pointerup has the same position', () => {
    let now = 1000
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    const onSwipe = vi.fn()
    const controller = createSwipeGesture(element, { onSwipe, velocityThreshold: 500, distanceThreshold: 100 })

    element.dispatchEvent(pointer('pointerdown', 1, 100, 100))
    now += 16
    element.dispatchEvent(pointer('pointermove', 1, 120, 100))
    now += 16
    element.dispatchEvent(pointer('pointermove', 1, 140, 100))
    now += 4
    // Fast flick (40px in 32ms = 1.25px/ms) but below distance threshold; up at the last move position
    element.dispatchEvent(pointer('pointerup', 1, 140, 100))

    expect(onSwipe).toHaveBeenCalledTimes(1)
    expect(onSwipe.mock.calls[0]![0].direction).toBe('right')
    expect(onSwipe.mock.calls[0]![0].velocity.x).toBeGreaterThan(500)
    controller.destroy()
  })

  it('swipe ignores stale velocity when the pointer was held still before release', () => {
    let now = 1000
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    const onSwipe = vi.fn()
    const controller = createSwipeGesture(element, { onSwipe, velocityThreshold: 500, distanceThreshold: 100, maxDuration: 1000 })

    element.dispatchEvent(pointer('pointerdown', 1, 100, 100))
    now += 16
    element.dispatchEvent(pointer('pointermove', 1, 140, 100))
    now += 300
    element.dispatchEvent(pointer('pointerup', 1, 140, 100))

    expect(onSwipe).not.toHaveBeenCalled()
    controller.destroy()
  })

  it('pointercancel never fires onSwipe and reports cancelled', () => {
    const onSwipe = vi.fn()
    const onSwipeEnd = vi.fn()
    const controller = createSwipeGesture(element, { onSwipe, onSwipeEnd })

    element.dispatchEvent(pointer('pointerdown', 1, 300, 100))
    // Browsers may report cancel coordinates as 0,0
    element.dispatchEvent(pointer('pointercancel', 1, 0, 0))

    expect(onSwipe).not.toHaveBeenCalled()
    expect(onSwipeEnd).toHaveBeenCalledTimes(1)
    expect(onSwipeEnd.mock.calls[0]![0].cancelled).toBe(true)
    expect(onSwipeEnd.mock.calls[0]![0].movement).toEqual({ x: 0, y: 0 })
    controller.destroy()
  })

  it('long press reports cancelled on pointercancel', () => {
    const onPressEnd = vi.fn()
    const controller = createLongPressGesture(element, { onPressEnd })

    element.dispatchEvent(pointer('pointerdown', 1, 100, 100))
    element.dispatchEvent(pointer('pointercancel', 1, 0, 0))

    expect(onPressEnd.mock.calls[0]![0].cancelled).toBe(true)
    controller.destroy()
  })
})

describe('Advanced Gestures lost pointerup recovery', () => {
  let element: HTMLElement
  let clock: TestClock

  const pointer = (type: string, pointerId: number, clientX: number, clientY: number) =>
    new PointerEvent(type, { pointerId, clientX, clientY, bubbles: true })

  beforeEach(() => {
    clock = installTestClock({ timers: true })
    element = document.createElement('div')
    document.body.appendChild(element)
  })

  afterEach(() => {
    clock.uninstall()
    element.remove()
  })

  const swipeRight = (pointerId: number) => {
    element.dispatchEvent(pointer('pointerdown', pointerId, 0, 0))
    clock.advance(16)
    element.dispatchEvent(pointer('pointermove', pointerId, 100, 0))
    clock.advance(16)
    element.dispatchEvent(pointer('pointerup', pointerId, 100, 0))
  }

  it('swipe resets when the pointerup only reaches window', () => {
    const onSwipe = vi.fn()
    const onSwipeEnd = vi.fn()
    const controller = createSwipeGesture(element, { onSwipe, onSwipeEnd })

    element.dispatchEvent(pointer('pointerdown', 1, 0, 0))
    // Element removed / released elsewhere: only window sees the pointerup
    window.dispatchEvent(pointer('pointerup', 1, 0, 0))
    expect(onSwipeEnd).toHaveBeenCalledTimes(1)

    // Not locked: a new pointer can swipe
    swipeRight(2)
    expect(onSwipe).toHaveBeenCalledTimes(1)
    expect(onSwipe.mock.calls[0]![0].direction).toBe('right')
    controller.destroy()
  })

  it('swipe treats lostpointercapture as a cancel', () => {
    const onSwipe = vi.fn()
    const onSwipeEnd = vi.fn()
    const controller = createSwipeGesture(element, { onSwipe, onSwipeEnd })

    element.dispatchEvent(pointer('pointerdown', 1, 0, 0))
    element.dispatchEvent(pointer('pointermove', 1, 100, 0))
    element.dispatchEvent(pointer('lostpointercapture', 1, 100, 0))

    expect(onSwipe).not.toHaveBeenCalled()
    expect(onSwipeEnd).toHaveBeenCalledTimes(1)
    expect(onSwipeEnd.mock.calls[0]![0].cancelled).toBe(true)

    swipeRight(2)
    expect(onSwipe).toHaveBeenCalledTimes(1)
    controller.destroy()
  })

  it('swipe does not report twice when the pointerup bubbles to window', () => {
    const onSwipeEnd = vi.fn()
    const controller = createSwipeGesture(element, { onSwipeEnd })
    swipeRight(1)
    expect(onSwipeEnd).toHaveBeenCalledTimes(1)
    controller.destroy()
  })

  it('swipe removes its window listeners on destroy', () => {
    const onSwipeEnd = vi.fn()
    const controller = createSwipeGesture(element, { onSwipeEnd })
    element.dispatchEvent(pointer('pointerdown', 1, 0, 0))
    controller.destroy()
    window.dispatchEvent(pointer('pointerup', 1, 0, 0))
    expect(onSwipeEnd).not.toHaveBeenCalled()
  })

  it('long press resets when the pointerup only reaches window', () => {
    const onLongPress = vi.fn()
    const onPressEnd = vi.fn()
    const onPressStart = vi.fn()
    const controller = createLongPressGesture(element, { threshold: 500, onLongPress, onPressStart, onPressEnd })

    element.dispatchEvent(pointer('pointerdown', 1, 0, 0))
    window.dispatchEvent(pointer('pointerup', 1, 0, 0))
    expect(onPressEnd).toHaveBeenCalledTimes(1)
    clock.advance(600)
    expect(onLongPress).not.toHaveBeenCalled()

    // A new press works
    element.dispatchEvent(pointer('pointerdown', 2, 0, 0))
    expect(onPressStart).toHaveBeenCalledTimes(2)
    clock.advance(600)
    expect(onLongPress).toHaveBeenCalledTimes(1)
    element.dispatchEvent(pointer('pointerup', 2, 0, 0))
    expect(onPressEnd).toHaveBeenCalledTimes(2)
    controller.destroy()
  })

  it('long press cancels on lostpointercapture', () => {
    const onLongPress = vi.fn()
    const onPressEnd = vi.fn()
    const controller = createLongPressGesture(element, { threshold: 500, onLongPress, onPressEnd })

    element.dispatchEvent(pointer('pointerdown', 1, 0, 0))
    element.dispatchEvent(pointer('lostpointercapture', 1, 0, 0))
    expect(onPressEnd).toHaveBeenCalledTimes(1)
    expect(onPressEnd.mock.calls[0]![0].cancelled).toBe(true)
    clock.advance(600)
    expect(onLongPress).not.toHaveBeenCalled()
    controller.destroy()
  })
})

describe('createRotateGesture movement', () => {
  it('movement is the rotation of the current gesture, whatever the finger angle', () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const onRotate = vi.fn()
    const onRotateEnd = vi.fn()
    const controller = createRotateGesture(element, { onRotate, onRotateEnd })

    const touches = (type: string, list: Array<{ identifier: number; clientX: number; clientY: number }>) =>
      element.dispatchEvent(new TouchEvent(type, {
        changedTouches: list as unknown as Touch[],
        touches: list as unknown as Touch[],
        bubbles: true,
      }))

    // First gesture: fingers vertical (90°), rotated to 135° (+45°)
    const a = { identifier: 0, clientX: 100, clientY: 100 }
    touches('touchstart', [a, { identifier: 1, clientX: 100, clientY: 200 }])
    touches('touchmove', [a, { identifier: 1, clientX: 0, clientY: 200 }])
    let state = onRotate.mock.calls.at(-1)![0]
    expect(state.angle).toBeCloseTo(45, 6)
    expect(state.movement).toBeCloseTo(45, 6)
    touches('touchend', [a, { identifier: 1, clientX: 0, clientY: 200 }])
    expect(onRotateEnd.mock.calls.at(-1)![0].movement).toBeCloseTo(45, 6)

    // Second gesture: fingers horizontal (0°), rotated to 30° (+30°)
    touches('touchstart', [a, { identifier: 1, clientX: 200, clientY: 100 }])
    touches('touchmove', [a, { identifier: 1, clientX: 100 + 100 * Math.cos(Math.PI / 6), clientY: 100 + 100 * Math.sin(Math.PI / 6) }])
    state = onRotate.mock.calls.at(-1)![0]
    expect(state.angle).toBeCloseTo(75, 6)
    expect(state.movement).toBeCloseTo(30, 6)

    controller.destroy()
    element.remove()
  })
})

describe('pinch/rotate with a third finger', () => {
  type T = { identifier: number; clientX: number; clientY: number }
  let element: HTMLElement
  const send = (type: string, changed: T[], all: T[]) =>
    element.dispatchEvent(new TouchEvent(type, {
      changedTouches: changed as unknown as Touch[],
      touches: all as unknown as Touch[],
      bubbles: true,
    }))

  beforeEach(() => {
    element = document.createElement('div')
    document.body.appendChild(element)
  })

  afterEach(() => {
    element.remove()
  })

  const A = { identifier: 0, clientX: 100, clientY: 100 }
  const B = { identifier: 1, clientX: 200, clientY: 100 }
  const C = { identifier: 2, clientX: 100, clientY: 300 }

  it('lifting one finger of the pinching pair does not make the scale jump', () => {
    const onPinch = vi.fn()
    const controller = createPinchGesture(element, { onPinch })
    send('touchstart', [A, B], [A, B])
    send('touchstart', [C], [A, B, C])
    send('touchend', [B], [A, C])
    // Nothing moved: the scale must stay 1
    send('touchmove', [C], [A, C])
    expect(onPinch.mock.calls.at(-1)![0].scale).toBeCloseTo(1, 6)
    // Spreading the new pair scales relative to its own distance
    send('touchmove', [{ ...C, clientY: 500 }], [A, { ...C, clientY: 500 }])
    expect(onPinch.mock.calls.at(-1)![0].scale).toBeCloseTo(2, 6)
    controller.destroy()
  })

  it('lifting one finger of the rotating pair does not make the angle jump', () => {
    const onRotate = vi.fn()
    const controller = createRotateGesture(element, { onRotate })
    send('touchstart', [A, B], [A, B])
    send('touchstart', [C], [A, B, C])
    send('touchend', [B], [A, C])
    send('touchmove', [C], [A, C])
    expect(onRotate.mock.calls.at(-1)![0].angle).toBeCloseTo(0, 6)
    controller.destroy()
  })
})

describe('swipe / long-press robustness', () => {
  let clock: TestClock
  let element: HTMLElement

  beforeEach(() => {
    clock = installTestClock({ timers: true })
    element = document.createElement('div')
    document.body.appendChild(element)
  })

  afterEach(() => {
    clock.uninstall()
    element.remove()
  })

  const pointer = (type: string, clientX: number) =>
    new PointerEvent(type, { pointerId: 1, button: 0, clientX, clientY: 0, bubbles: true })

  const swipeRight = () => {
    element.dispatchEvent(pointer('pointerdown', 0))
    clock.advance(16)
    element.dispatchEvent(pointer('pointermove', 60))
    clock.advance(16)
    element.dispatchEvent(pointer('pointermove', 120))
    element.dispatchEvent(pointer('pointerup', 120))
  }

  it('a throwing setPointerCapture does not leave swipe / long-press half-started', () => {
    element.setPointerCapture = () => { throw new Error('InvalidPointerId') }
    const onSwipe = vi.fn()
    const onLongPress = vi.fn()
    const swipe = createSwipeGesture(element, { onSwipe })
    swipeRight()
    expect(onSwipe).toHaveBeenCalledTimes(1)
    swipe.destroy()

    const longPress = createLongPressGesture(element, { onLongPress })
    element.dispatchEvent(pointer('pointerdown', 0))
    clock.advance(600)
    expect(onLongPress).toHaveBeenCalledTimes(1)
    element.dispatchEvent(pointer('pointerup', 0))
    longPress.destroy()
  })

  it('disable() during a swipe prevents it from firing', () => {
    const onSwipe = vi.fn()
    const onSwipeEnd = vi.fn()
    const swipe = createSwipeGesture(element, { onSwipe, onSwipeEnd })
    element.dispatchEvent(pointer('pointerdown', 0))
    clock.advance(16)
    element.dispatchEvent(pointer('pointermove', 60))
    swipe.disable()
    clock.advance(16)
    element.dispatchEvent(pointer('pointerup', 120))
    expect(onSwipe).not.toHaveBeenCalled()
    expect(onSwipeEnd).toHaveBeenCalledTimes(1)
    expect(onSwipeEnd.mock.calls[0]![0].cancelled).toBe(true)

    // Re-enabled, the next swipe works
    swipe.enable()
    swipeRight()
    expect(onSwipe).toHaveBeenCalledTimes(1)
    swipe.destroy()
  })
})

describe('swipe minDistance', () => {
  let clock: TestClock
  let element: HTMLElement

  beforeEach(() => {
    clock = installTestClock()
    element = document.createElement('div')
    document.body.appendChild(element)
  })

  afterEach(() => {
    clock.uninstall()
    element.remove()
  })

  const flick = (distance: number) => {
    const pointer = (type: string, clientX: number) =>
      new PointerEvent(type, { pointerId: 1, button: 0, clientX, clientY: 0, bubbles: true })
    element.dispatchEvent(pointer('pointerdown', 0))
    clock.advance(5)
    element.dispatchEvent(pointer('pointermove', distance))
    element.dispatchEvent(pointer('pointerup', distance))
  }

  it('a fast jitter shorter than minDistance (default 10px) is not a swipe', () => {
    const onSwipe = vi.fn()
    const swipe = createSwipeGesture(element, { onSwipe })
    flick(5) // ~1000 px/s, but only 5px
    expect(onSwipe).not.toHaveBeenCalled()
    flick(15) // fast and past minDistance: a swipe below distanceThreshold
    expect(onSwipe).toHaveBeenCalledTimes(1)
    expect(onSwipe.mock.calls[0]![0].direction).toBe('right')
    swipe.destroy()
  })

  it('minDistance is configurable', () => {
    const onSwipe = vi.fn()
    const swipe = createSwipeGesture(element, { onSwipe, minDistance: 0 })
    flick(5)
    expect(onSwipe).toHaveBeenCalledTimes(1)
    swipe.destroy()
  })
})
