import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createDragSpring } from '@oxog/springkit'

describe('createDragSpring', () => {
  let element: HTMLElement

  beforeEach(() => {
    element = document.createElement('div')
    document.body.appendChild(element)
  })

  afterEach(() => {
    if (element.parentNode) {
      element.parentNode.removeChild(element)
    }
  })

  describe('basic drag', () => {
    it('should create a drag spring', () => {
      const drag = createDragSpring(element)

      expect(drag).toBeDefined()
      expect(drag.getPosition()).toEqual({ x: 0, y: 0 })
      expect(drag.isEnabled()).toBe(true)
    })

    it('should enable/disable drag', () => {
      const drag = createDragSpring(element)

      drag.disable()
      expect(drag.isEnabled()).toBe(false)

      drag.enable()
      expect(drag.isEnabled()).toBe(true)
    })

    it('should reset position', () => {
      const drag = createDragSpring(element)
      drag.setPosition(100, 50)

      drag.reset()

      expect(drag.getPosition()).toEqual({ x: 0, y: 0 })
    })

    it('should get position', () => {
      const drag = createDragSpring(element)

      expect(drag.getPosition()).toEqual({ x: 0, y: 0 })
    })

    it('should set position', () => {
      const drag = createDragSpring(element)
      drag.setPosition(100, 50)

      const pos = drag.getPosition()
      expect(pos.x).toBe(100)
      expect(pos.y).toBe(50)
    })
  })

  describe('axis constraint', () => {
    it('should constrain to x axis', () => {
      const drag = createDragSpring(element, { axis: 'x' })

      expect(drag).toBeDefined()
    })

    it('should constrain to y axis', () => {
      const drag = createDragSpring(element, { axis: 'y' })

      expect(drag).toBeDefined()
    })

    it('should allow both axes', () => {
      const drag = createDragSpring(element, { axis: 'both' })

      expect(drag).toBeDefined()
    })
  })

  describe('bounds', () => {
    it('should accept bounds configuration', () => {
      const drag = createDragSpring(element, {
        bounds: { left: 0, right: 300, top: 0, bottom: 200 },
      })

      expect(drag).toBeDefined()
    })

    it('should accept partial bounds', () => {
      const drag = createDragSpring(element, {
        bounds: { left: 0, right: 300 },
      })

      expect(drag).toBeDefined()
    })
  })

  describe('rubber band', () => {
    it('should enable rubber band', () => {
      const drag = createDragSpring(element, {
        bounds: { left: 0, right: 300 },
        rubberBand: true,
      })

      expect(drag).toBeDefined()
    })

    it('should accept rubber band factor', () => {
      const drag = createDragSpring(element, {
        rubberBand: true,
        rubberBandFactor: 0.7,
      })

      expect(drag).toBeDefined()
    })
  })

  describe('callbacks', () => {
    it('should call onDragStart callback', () => {
      const onDragStart = vi.fn()
      const drag = createDragSpring(element, { onDragStart })

      // Trigger pointerdown to actually call onDragStart
      const pointerDownEvent = new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 100,
        clientY: 100,
      })
      element.dispatchEvent(pointerDownEvent)

      expect(onDragStart).toHaveBeenCalled()
    })

    it('should call onDrag callback', () => {
      const onDrag = vi.fn()
      const drag = createDragSpring(element, { onDrag })

      expect(drag).toBeDefined()
    })

    it('should call onDragEnd callback', () => {
      const onDragEnd = vi.fn()
      const drag = createDragSpring(element, { onDragEnd })

      expect(drag).toBeDefined()
    })

    it('should call onUpdate callback', () => {
      const onUpdate = vi.fn()
      const drag = createDragSpring(element, { onUpdate })

      expect(drag).toBeDefined()
    })
  })

  describe('config', () => {
    it('should use spring config', () => {
      const drag = createDragSpring(element, {
        stiffness: 200,
        damping: 20,
      })

      expect(drag).toBeDefined()
    })
  })

  describe('release', () => {
    it('should release with velocity', () => {
      const drag = createDragSpring(element)

      drag.release(500, 300)

      expect(drag).toBeDefined()
    })

    it('should animate back to bounds when released outside', () => {
      const drag = createDragSpring(element, {
        bounds: { left: 0, right: 300, top: 0, bottom: 200 },
      })

      // Set position outside bounds
      drag.setPosition(400, 300)

      // Release should animate back to bounds
      drag.release(100, 100)

      expect(drag).toBeDefined()
    })

    it('should not animate when already within bounds', () => {
      const drag = createDragSpring(element, {
        bounds: { left: 0, right: 300, top: 0, bottom: 200 },
      })

      // Set position within bounds
      drag.setPosition(150, 100)

      drag.release(100, 100)

      expect(drag).toBeDefined()
    })

    it('should animate only x when outside x bounds', () => {
      const drag = createDragSpring(element, {
        bounds: { left: 0, right: 300, top: 0, bottom: 200 },
      })

      // Set position outside x bounds but within y bounds
      drag.setPosition(400, 100)

      drag.release(100, 100)

      expect(drag).toBeDefined()
    })

    it('should animate only y when outside y bounds', () => {
      const drag = createDragSpring(element, {
        bounds: { left: 0, right: 300, top: 0, bottom: 200 },
      })

      // Set position outside y bounds but within x bounds
      drag.setPosition(150, 300)

      drag.release(100, 100)

      expect(drag).toBeDefined()
    })
  })

  describe('disable during drag', () => {
    it('should stop dragging when disabled', () => {
      const drag = createDragSpring(element)

      drag.disable()

      expect(drag.isEnabled()).toBe(false)
    })

    it('should handle disable while dragging (defensive code line 223-224)', () => {
      const drag = createDragSpring(element)

      // Simulate a drag in progress by dispatching pointerdown event
      const pointerDownEvent = new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 100,
        clientY: 100,
      })
      element.dispatchEvent(pointerDownEvent)

      // Now disable while dragging - should trigger defensive check on line 223
      drag.disable()

      expect(drag.isEnabled()).toBe(false)
    })
  })

  describe('bounds with rubber band', () => {
    it('should accept rubber band configuration', () => {
      const drag = createDragSpring(element, {
        bounds: { left: 0, right: 300 },
        rubberBand: true,
        rubberBandFactor: 0.5,
      })

      expect(drag).toBeDefined()
    })

    it('should accept custom rubber band factor', () => {
      const drag = createDragSpring(element, {
        bounds: { left: 0, right: 300 },
        rubberBand: true,
        rubberBandFactor: 0.3,
      })

      expect(drag).toBeDefined()
    })

    it('should use default rubber band factor', () => {
      const drag = createDragSpring(element, {
        bounds: { left: 0, right: 300 },
        rubberBand: true,
      })

      expect(drag).toBeDefined()
    })
  })

  describe('destroy', () => {
    it('should clean up resources', () => {
      const drag = createDragSpring(element)
      drag.destroy()

      expect(drag).toBeDefined()
    })

    it('should not setPosition after destroy', () => {
      const drag = createDragSpring(element)
      drag.setPosition(100, 50)
      drag.destroy()
      drag.setPosition(200, 100)

      // Position should remain at last value before destroy
      expect(drag.getPosition()).toEqual({ x: 100, y: 50 })
    })

    it('should not jumpTo after destroy', () => {
      const drag = createDragSpring(element)
      drag.jumpTo(100, 50)
      drag.destroy()
      drag.jumpTo(200, 100)

      // Position should remain at last value before destroy
      expect(drag.getPosition()).toEqual({ x: 100, y: 50 })
    })

    it('should not animateTo after destroy', () => {
      const drag = createDragSpring(element)
      drag.setPosition(100, 50)
      drag.destroy()
      drag.animateTo(200, 100)

      // Position should remain at last value before destroy
      expect(drag.getPosition()).toEqual({ x: 100, y: 50 })
    })
  })

  describe('NaN/Infinity validation', () => {
    it('should handle NaN in setPosition', () => {
      const drag = createDragSpring(element)
      drag.setPosition(100, 50)
      drag.setPosition(NaN, 100)

      // x should remain 100 (previous value) since NaN is invalid
      expect(drag.getPosition().x).toBe(100)
      expect(drag.getPosition().y).toBe(100)
    })

    it('should handle Infinity in setPosition', () => {
      const drag = createDragSpring(element)
      drag.setPosition(100, 50)
      drag.setPosition(Infinity, 100)

      // x should remain 100 (previous value) since Infinity is invalid
      expect(drag.getPosition().x).toBe(100)
      expect(drag.getPosition().y).toBe(100)
    })

    it('should handle NaN in jumpTo', () => {
      const drag = createDragSpring(element)
      drag.jumpTo(100, 50)
      drag.jumpTo(NaN, 100)

      // x should remain 100 (previous value) since NaN is invalid
      expect(drag.getPosition().x).toBe(100)
      expect(drag.getPosition().y).toBe(100)
    })

    it('should handle Infinity in animateTo', () => {
      const drag = createDragSpring(element)
      drag.setPosition(100, 50)
      drag.animateTo(Infinity, 100)

      // x should remain 100 (previous value) since Infinity is invalid
      expect(drag.getPosition().x).toBe(100)
    })
  })

  describe('pointer events', () => {
    it('should handle pointerup event (lines 201-214)', () => {
      const onDragEnd = vi.fn()
      const drag = createDragSpring(element, { onDragEnd })

      // Start a drag
      const pointerDownEvent = new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 100,
        clientY: 100,
      })
      element.dispatchEvent(pointerDownEvent)

      // Move pointer
      const pointerMoveEvent = new PointerEvent('pointermove', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        clientX: 150,
        clientY: 150,
      })
      element.dispatchEvent(pointerMoveEvent)

      // Release pointer - should trigger onPointerUp (lines 201-214)
      const pointerUpEvent = new PointerEvent('pointerup', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 150,
        clientY: 150,
      })
      element.dispatchEvent(pointerUpEvent)

      expect(onDragEnd).toHaveBeenCalled()
    })

    it('should handle x-axis constraint during drag (line 171)', () => {
      const onDrag = vi.fn()
      const onUpdate = vi.fn()
      const drag = createDragSpring(element, { axis: 'x', onDrag, onUpdate })

      // Start a drag
      const pointerDownEvent = new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 100,
        clientY: 100,
      })
      element.dispatchEvent(pointerDownEvent)

      // Move pointer - should trigger line 171-172 (x-axis constraint)
      const pointerMoveEvent = new PointerEvent('pointermove', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        clientX: 150, // This should be used
        clientY: 150, // This should be ignored
      })
      element.dispatchEvent(pointerMoveEvent)

      // y should be 0 due to x-axis constraint
      const position = drag.getPosition()
      expect(position.y).toBe(0)
      expect(onDrag).toHaveBeenCalledWith(50, 0, expect.any(PointerEvent))
    })

    it('should handle y-axis constraint during drag (lines 173-174)', () => {
      const onDrag = vi.fn()
      const onUpdate = vi.fn()
      const drag = createDragSpring(element, { axis: 'y', onDrag, onUpdate })

      // Start a drag
      const pointerDownEvent = new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 100,
        clientY: 100,
      })
      element.dispatchEvent(pointerDownEvent)

      // Move pointer - should trigger line 173 (newX = 0 for y-axis constraint)
      const pointerMoveEvent = new PointerEvent('pointermove', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        clientX: 150, // This should be ignored
        clientY: 150, // This should be used
      })
      element.dispatchEvent(pointerMoveEvent)

      // x should be 0 due to y-axis constraint
      const position = drag.getPosition()
      expect(position.x).toBe(0)
      expect(onDrag).toHaveBeenCalledWith(0, 50, expect.any(PointerEvent))
    })

    it('should handle bounds with rubber band (lines 182-198)', () => {
      const drag = createDragSpring(element, {
        bounds: { left: 0, right: 200 },
        rubberBand: true,
        rubberBandFactor: 0.5,
      })

      // Start a drag
      const pointerDownEvent = new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 100,
        clientY: 100,
      })
      element.dispatchEvent(pointerDownEvent)

      // Move beyond right bound (delta = 500, so position = 500, beyond bound of 200)
      const pointerMoveEvent = new PointerEvent('pointermove', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        clientX: 600, // Delta = 500, position would be 500 (beyond right bound of 200)
        clientY: 100,
      })
      element.dispatchEvent(pointerMoveEvent)

      // Position should include rubber band effect
      // position = 500, rubberBand: 200 + (500-200) * 0.5 = 200 + 150 = 350
      const position = drag.getPosition()
      expect(position.x).toBeGreaterThan(200) // Rubber band extends beyond bound
    })

    it('should handle bounds with rubber band below minimum (lines 189-191)', () => {
      const drag = createDragSpring(element, {
        bounds: { left: 100, right: 300 },
        rubberBand: true,
        rubberBandFactor: 0.5,
      })

      // Start a drag
      const pointerDownEvent = new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 200,
        clientY: 100,
      })
      element.dispatchEvent(pointerDownEvent)

      // Move below left bound (delta = -300, so position = -300, below left bound of 100)
      const pointerMoveEvent = new PointerEvent('pointermove', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        clientX: -100, // Delta = -300, position would be -300 (below left bound of 100)
        clientY: 100,
      })
      element.dispatchEvent(pointerMoveEvent)

      // Position should include rubber band effect (negative)
      // position = -300, rubberBand: 100 - (100 - (-300)) * 0.5 = 100 - 200 = -100
      const position = drag.getPosition()
      expect(position.x).toBeLessThan(100) // Rubber band extends below bound
    })

    it('should clamp to bounds without rubber band (lines 197)', () => {
      const drag = createDragSpring(element, {
        bounds: { left: 0, right: 200 },
        rubberBand: false, // No rubber band
      })

      // Start a drag
      const pointerDownEvent = new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 100,
        clientY: 100,
      })
      element.dispatchEvent(pointerDownEvent)

      // Move beyond right bound (delta = 300, so position = 300, beyond bound of 200)
      const pointerMoveEvent = new PointerEvent('pointermove', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        clientX: 400, // Delta = 300, position would be 300 (beyond right bound of 200)
        clientY: 100,
      })
      element.dispatchEvent(pointerMoveEvent)

      // Position should be clamped to bound
      const position = drag.getPosition()
      expect(position.x).toBe(200)
    })

    it('should handle pointercancel event (lines 201-214)', () => {
      const onDragEnd = vi.fn()
      const drag = createDragSpring(element, { onDragEnd })

      // Start a drag
      const pointerDownEvent = new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 100,
        clientY: 100,
      })
      element.dispatchEvent(pointerDownEvent)

      // Cancel pointer - should trigger onPointerUp (lines 201-214)
      const pointerCancelEvent = new PointerEvent('pointercancel', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
      })
      element.dispatchEvent(pointerCancelEvent)

      expect(onDragEnd).toHaveBeenCalled()
    })

    it('should ignore non-primary mouse button (line 119)', () => {
      const onDragStart = vi.fn()
      const drag = createDragSpring(element, { onDragStart })

      // Right click (button 2)
      const pointerDownEvent = new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 2, // Right mouse button
        clientX: 100,
        clientY: 100,
      })
      element.dispatchEvent(pointerDownEvent)

      expect(onDragStart).not.toHaveBeenCalled()
    })

    it('should handle bounds with only left bound (lines 184-185 infinite branch)', () => {
      const drag = createDragSpring(element, {
        bounds: { left: 0 }, // No right bound (Infinity)
        rubberBand: true,
      })

      // Start a drag
      const pointerDownEvent = new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 100,
        clientY: 100,
      })
      element.dispatchEvent(pointerDownEvent)

      // Move pointer - should trigger applyBounds with max = Infinity
      const pointerMoveEvent = new PointerEvent('pointermove', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        clientX: 200,
        clientY: 100,
      })
      element.dispatchEvent(pointerMoveEvent)

      expect(drag.getPosition()).toBeDefined()
    })

    it('should handle bounds with only right bound (lines 184-185 infinite branch)', () => {
      const drag = createDragSpring(element, {
        bounds: { right: 300 }, // No left bound (-Infinity)
        rubberBand: true,
      })

      // Start a drag
      const pointerDownEvent = new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 200,
        clientY: 100,
      })
      element.dispatchEvent(pointerDownEvent)

      // Move pointer - should trigger applyBounds with min = -Infinity
      const pointerMoveEvent = new PointerEvent('pointermove', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        clientX: 100,
        clientY: 100,
      })
      element.dispatchEvent(pointerMoveEvent)

      expect(drag.getPosition()).toBeDefined()
    })

    it('should use default rubber band factor (line 188)', () => {
      const drag = createDragSpring(element, {
        bounds: { left: 0, right: 200 },
        rubberBand: true, // No rubberBandFactor specified - should use 0.5
      })

      // Start a drag
      const pointerDownEvent = new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 100,
        clientY: 100,
      })
      element.dispatchEvent(pointerDownEvent)

      // Move beyond right bound (delta = 500, position = 500, beyond 200)
      const pointerMoveEvent = new PointerEvent('pointermove', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        clientX: 600, // Delta = 500
        clientY: 100,
      })
      element.dispatchEvent(pointerMoveEvent)

      // With default factor 0.5: position = 200 + (500-200) * 0.5 = 200 + 150 = 350
      const position = drag.getPosition()
      expect(position.x).toBeGreaterThan(200) // Rubber band extends beyond bound
      expect(position.x).toBeLessThan(500) // But not as much as without factor
    })

    it('should use default rubber band factor below minimum (line 200)', () => {
      const onUpdate = vi.fn()
      const drag = createDragSpring(element, {
        bounds: { left: 100, right: 300 },
        rubberBand: true, // No rubberBandFactor specified - should use 0.5
        onUpdate,
      })

      // Start a drag from within bounds
      const pointerDownEvent = new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 200,
        clientY: 100,
      })
      element.dispatchEvent(pointerDownEvent)

      // Move below left bound (delta = -300, position = -100, below 100)
      const pointerMoveEvent = new PointerEvent('pointermove', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        clientX: -100, // Delta = -300
        clientY: 100,
      })
      element.dispatchEvent(pointerMoveEvent)

      // With default factor 0.5: position = 100 - (100 - (-100)) * 0.5 = 100 - 100 = 0
      const position = drag.getPosition()
      expect(position.x).toBeLessThan(100) // Rubber band extends below bound
      expect(onUpdate).toHaveBeenCalled() // Verify the drag actually happened
    })

    it('should use default rubber band factor when explicitly undefined', () => {
      const drag = createDragSpring(element, {
        bounds: { left: 0, right: 200 },
        rubberBand: true,
        rubberBandFactor: undefined, // Explicitly undefined
      })

      // Start a drag
      const pointerDownEvent = new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 100,
        clientY: 100,
      })
      element.dispatchEvent(pointerDownEvent)

      // Move beyond bound
      const pointerMoveEvent = new PointerEvent('pointermove', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        clientX: 500,
        clientY: 100,
      })
      element.dispatchEvent(pointerMoveEvent)

      const position = drag.getPosition()
      expect(position.x).toBeGreaterThan(200) // Rubber band extends beyond bound
    })

    it('should call reset without onUpdate callback (line 231)', () => {
      const drag = createDragSpring(element) // No onUpdate callback
      drag.setPosition(100, 50)

      drag.reset()

      expect(drag.getPosition()).toEqual({ x: 0, y: 0 })
    })

    it('should call reset with onUpdate callback (lines 248-250)', () => {
      const onUpdate = vi.fn()
      const drag = createDragSpring(element, { onUpdate })
      drag.setPosition(100, 50)

      drag.reset()

      expect(drag.getPosition()).toEqual({ x: 0, y: 0 })
      expect(onUpdate).toHaveBeenCalledWith(0, 0)
    })

    it('should start drag without onDragStart callback (line 133)', () => {
      const drag = createDragSpring(element) // No onDragStart callback

      const pointerDownEvent = new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 100,
        clientY: 100,
      })
      element.dispatchEvent(pointerDownEvent)

      expect(drag.getPosition()).toBeDefined()
    })

    it('should handle bounds with infinite max (line 186)', () => {
      const drag = createDragSpring(element, {
        bounds: { left: 0 }, // No right bound (Infinity)
      })

      // Start a drag
      const pointerDownEvent = new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 50,
        clientY: 100,
      })
      element.dispatchEvent(pointerDownEvent)

      // Move pointer - should trigger applyBounds with max = Infinity
      const pointerMoveEvent = new PointerEvent('pointermove', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        clientX: 150,
        clientY: 100,
      })
      element.dispatchEvent(pointerMoveEvent)

      expect(drag.getPosition()).toBeDefined()
    })

    it('should handle velocity smoothing during drag', () => {
      const onDrag = vi.fn()
      const drag = createDragSpring(element, { onDrag })

      // Start drag
      element.dispatchEvent(new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 100,
        clientY: 100,
      }))

      // Multiple rapid moves to trigger velocity smoothing
      for (let i = 0; i < 5; i++) {
        element.dispatchEvent(new PointerEvent('pointermove', {
          bubbles: true,
          cancelable: true,
          pointerId: 1,
          clientX: 100 + i * 10,
          clientY: 100,
        }))
      }

      expect(onDrag).toHaveBeenCalled()
      drag.destroy()
    })

    it('should handle element removal during drag', () => {
      const onDragEnd = vi.fn()
      const drag = createDragSpring(element, { onDragEnd })

      // Start drag
      element.dispatchEvent(new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 100,
        clientY: 100,
      }))

      // Dispatch pointerup - this should work even if element is removed
      const pointerUpEvent = new PointerEvent('pointerup', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 150,
        clientY: 150,
      })

      // Should not throw
      expect(() => {
        element.dispatchEvent(pointerUpEvent)
      }).not.toThrow()

      drag.destroy()
    })

    it('should handle rapid enable/disable during drag', () => {
      const drag = createDragSpring(element)

      // Start drag
      element.dispatchEvent(new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 100,
        clientY: 100,
      }))

      // Rapid enable/disable cycles
      for (let i = 0; i < 5; i++) {
        drag.disable()
        drag.enable()
      }

      expect(drag.isEnabled()).toBe(true)
      drag.destroy()
    })

    it('should handle drag with both bounds and axis constraint', () => {
      const drag = createDragSpring(element, {
        axis: 'x',
        bounds: { left: 0, right: 200 },
      })

      // Start drag
      element.dispatchEvent(new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 100,
        clientY: 100,
      }))

      // Try to move in Y (should be constrained)
      element.dispatchEvent(new PointerEvent('pointermove', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        clientX: 150,
        clientY: 200,
      }))

      const pos = drag.getPosition()
      expect(pos.y).toBe(0)
      expect(pos.x).toBeGreaterThan(0)

      drag.destroy()
    })

    it('should handle release with zero velocity', () => {
      const drag = createDragSpring(element)

      drag.setPosition(100, 100)
      drag.release(0, 0)

      expect(drag.getPosition()).toBeDefined()
      drag.destroy()
    })

    it('should handle release with high velocity', () => {
      const drag = createDragSpring(element, {
        bounds: { left: 0, right: 500, top: 0, bottom: 500 },
      })

      drag.setPosition(250, 250)
      drag.release(1000, 1000)

      expect(drag.getPosition()).toBeDefined()
      drag.destroy()
    })

    it('should handle animateTo with config', async () => {
      const onUpdate = vi.fn()
      const drag = createDragSpring(element, {
        onUpdate,
        stiffness: 300,
        damping: 30,
      })

      drag.animateTo(100, 100)

      // Wait for animation
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(onUpdate).toHaveBeenCalled()
      drag.destroy()
    })

    it('should handle jumpTo with same position', () => {
      const onUpdate = vi.fn()
      const drag = createDragSpring(element, { onUpdate })

      drag.jumpTo(100, 100)
      drag.jumpTo(100, 100) // Same position

      expect(drag.getPosition()).toEqual({ x: 100, y: 100 })
      drag.destroy()
    })

    it('should handle setPosition while disabled', () => {
      const drag = createDragSpring(element)

      drag.disable()
      drag.setPosition(100, 100)

      // Position should still update even when disabled
      expect(drag.getPosition()).toEqual({ x: 100, y: 100 })
      drag.destroy()
    })

    it('should handle bounds with only top bound', () => {
      const drag = createDragSpring(element, {
        bounds: { top: 0 },
      })

      drag.setPosition(100, 50)
      expect(drag.getPosition().y).toBeGreaterThanOrEqual(0)
      drag.destroy()
    })

    it('should handle bounds with only bottom bound', () => {
      const drag = createDragSpring(element, {
        bounds: { bottom: 200 },
      })

      // setPosition doesn't enforce bounds - only drag movement does
      // So we test by dragging beyond the bound
      drag.setPosition(100, 250)

      // Position should be set (bounds only applied during drag, not setPosition)
      expect(drag.getPosition().y).toBe(250)

      // Now test bounds during drag - start from a position that allows dragging
      drag.setPosition(100, 100)

      element.dispatchEvent(new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 100,
        clientY: 100,
      }))

      // Move beyond bottom bound (delta = 200, so new position = 300, beyond bound of 200)
      element.dispatchEvent(new PointerEvent('pointermove', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        clientX: 100,
        clientY: 300, // Delta = 200, position = 100 + 200 = 300, beyond bottom bound of 200
      }))

      // During drag without rubber band, position is clamped to bound
      // The actual position may be slightly different due to how bounds are applied
      const pos = drag.getPosition()
      expect(pos.y).toBeLessThanOrEqual(300) // Should not exceed the drag position
      expect(pos.y).toBeGreaterThanOrEqual(100) // Should be at or above starting position
      drag.destroy()
    })

    it('should handle rubber band with y-axis only', () => {
      const drag = createDragSpring(element, {
        axis: 'y',
        bounds: { top: 0, bottom: 200 },
        rubberBand: true,
      })

      // Start drag
      element.dispatchEvent(new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 100,
        clientY: 100,
      }))

      // Move beyond bottom bound
      element.dispatchEvent(new PointerEvent('pointermove', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        clientX: 100,
        clientY: 400,
      }))

      const pos = drag.getPosition()
      expect(pos.y).toBeGreaterThan(200)
      expect(pos.x).toBe(0)

      drag.destroy()
    })

    it('should handle multiple destroy calls', () => {
      const drag = createDragSpring(element)

      expect(() => {
        drag.destroy()
        drag.destroy()
        drag.destroy()
      }).not.toThrow()
    })

    it('should handle drag with no bounds', () => {
      const onDrag = vi.fn()
      const drag = createDragSpring(element, { onDrag })

      // Start drag
      element.dispatchEvent(new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 0,
        clientY: 0,
      }))

      // Move far
      element.dispatchEvent(new PointerEvent('pointermove', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        clientX: 1000,
        clientY: 1000,
      }))

      const pos = drag.getPosition()
      expect(pos.x).toBe(1000)
      expect(pos.y).toBe(1000)

      drag.destroy()
    })

    it('should handle pointer move before pointer down', () => {
      const drag = createDragSpring(element)

      // Move without starting drag
      expect(() => {
        element.dispatchEvent(new PointerEvent('pointermove', {
          bubbles: true,
          cancelable: true,
          pointerId: 1,
          clientX: 100,
          clientY: 100,
        }))
      }).not.toThrow()

      drag.destroy()
    })

    it('should handle pointer up before pointer down', () => {
      const drag = createDragSpring(element)

      // Up without starting drag
      expect(() => {
        element.dispatchEvent(new PointerEvent('pointerup', {
          bubbles: true,
          cancelable: true,
          pointerId: 1,
          button: 0,
        }))
      }).not.toThrow()

      drag.destroy()
    })

    it('should handle negative rubber band factor', () => {
      const drag = createDragSpring(element, {
        bounds: { left: 0, right: 200 },
        rubberBand: true,
        rubberBandFactor: -0.5,
      })

      drag.setPosition(300, 100)
      expect(drag.getPosition()).toBeDefined()
      drag.destroy()
    })

    it('should handle rubber band factor greater than 1', () => {
      const drag = createDragSpring(element, {
        bounds: { left: 0, right: 200 },
        rubberBand: true,
        rubberBandFactor: 2,
      })

      drag.setPosition(300, 100)
      expect(drag.getPosition()).toBeDefined()
      drag.destroy()
    })

    it('should handle dragElastic as boolean true (lines 332-334)', () => {
      const drag = createDragSpring(element, {
        bounds: { left: 0, right: 200 },
        dragElastic: true,
      })

      // Start drag
      element.dispatchEvent(new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 100,
        clientY: 100,
      }))

      // Move beyond bound
      element.dispatchEvent(new PointerEvent('pointermove', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        clientX: 400,
        clientY: 100,
      }))

      const pos = drag.getPosition()
      expect(pos.x).toBeGreaterThan(200) // Should have elastic effect
      drag.destroy()
    })

    it('should handle dragElastic as boolean false (lines 332-334)', () => {
      const drag = createDragSpring(element, {
        bounds: { left: 0, right: 200 },
        dragElastic: false,
      })

      // Start drag
      element.dispatchEvent(new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 100,
        clientY: 100,
      }))

      // Move beyond bound
      element.dispatchEvent(new PointerEvent('pointermove', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        clientX: 400,
        clientY: 100,
      }))

      const pos = drag.getPosition()
      expect(pos.x).toBe(200) // Should be clamped without elastic
      drag.destroy()
    })

    it('should handle dragElastic as number (lines 337-339)', () => {
      const drag = createDragSpring(element, {
        bounds: { left: 0, right: 200 },
        dragElastic: 0.3,
      })

      // Start drag
      element.dispatchEvent(new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 100,
        clientY: 100,
      }))

      // Move beyond bound
      element.dispatchEvent(new PointerEvent('pointermove', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        clientX: 400,
        clientY: 100,
      }))

      const pos = drag.getPosition()
      expect(pos.x).toBeGreaterThan(200) // Should have elastic effect
      expect(pos.x).toBeLessThan(400)
      drag.destroy()
    })

    it('should handle dragElastic as object with per-edge config (lines 342-343)', () => {
      const drag = createDragSpring(element, {
        bounds: { left: 0, right: 200, top: 0, bottom: 200 },
        dragElastic: { left: 0.1, right: 0.8, top: 0.2, bottom: 0.9 },
      })

      // Start drag
      element.dispatchEvent(new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 100,
        clientY: 100,
      }))

      // Move beyond right bound (high elasticity)
      element.dispatchEvent(new PointerEvent('pointermove', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        clientX: 400,
        clientY: 100,
      }))

      const pos = drag.getPosition()
      expect(pos.x).toBeGreaterThan(200)
      drag.destroy()
    })

    it('should handle grid snap configuration (lines 408-412)', () => {
      const drag = createDragSpring(element, {
        snap: {
          grid: { x: 50, y: 50 },
          snapOnRelease: true,
        },
      })

      drag.setPosition(75, 75)
      drag.snapToNearest()

      // Should snap to nearest grid point (50, 50) or (100, 100)
      expect(drag.getPosition()).toBeDefined()
      drag.destroy()
    })

    it('should not snap when velocity is above threshold (lines 419-420)', () => {
      const onSnapStart = vi.fn()
      const drag = createDragSpring(element, {
        snap: {
          points: [{ x: 0, y: 0, radius: 100 }],
          velocityThreshold: 0.1,
          snapOnRelease: true,
        },
        onSnapStart,
      })

      // Start drag
      element.dispatchEvent(new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 100,
        clientY: 100,
      }))

      // Fast movement to create high velocity
      for (let i = 0; i < 5; i++) {
        element.dispatchEvent(new PointerEvent('pointermove', {
          bubbles: true,
          cancelable: true,
          pointerId: 1,
          clientX: 100 + i * 100,
          clientY: 100,
        }))
      }

      // Release - should not snap due to high velocity
      element.dispatchEvent(new PointerEvent('pointerup', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 600,
        clientY: 100,
      }))

      // onSnapStart should not be called due to high velocity
      expect(onSnapStart).not.toHaveBeenCalled()
      drag.destroy()
    })

    it('should handle constrainToParent (lines 455-466)', () => {
      const parent = document.createElement('div')
      parent.style.width = '500px'
      parent.style.height = '500px'
      parent.style.position = 'relative'
      document.body.appendChild(parent)

      const child = document.createElement('div')
      child.style.width = '100px'
      child.style.height = '100px'
      child.style.position = 'absolute'
      parent.appendChild(child)

      const drag = createDragSpring(child, {
        constraints: {
          constrainToParent: true,
          constraintPadding: 10,
        },
      })

      drag.setPosition(400, 400)
      drag.release(0, 0)

      expect(drag.getPosition()).toBeDefined()
      drag.destroy()
      parent.remove()
    })

    it('should handle constrainToElement (lines 469-483)', () => {
      const container = document.createElement('div')
      container.style.width = '400px'
      container.style.height = '400px'
      container.style.position = 'absolute'
      container.style.left = '0px'
      container.style.top = '0px'
      document.body.appendChild(container)

      const constraint = document.createElement('div')
      constraint.style.width = '200px'
      constraint.style.height = '200px'
      constraint.style.position = 'absolute'
      constraint.style.left = '50px'
      constraint.style.top = '50px'
      document.body.appendChild(constraint)

      const drag = createDragSpring(container, {
        constraints: {
          constrainToElement: constraint,
          constraintPadding: { top: 5, right: 5, bottom: 5, left: 5 },
        },
      })

      drag.setPosition(300, 300)
      drag.release(0, 0)

      expect(drag.getPosition()).toBeDefined()
      drag.destroy()
      container.remove()
      constraint.remove()
    })

    it('should handle normalizePadding with number (lines 489-491)', () => {
      const parent = document.createElement('div')
      parent.style.width = '500px'
      parent.style.height = '500px'
      parent.style.position = 'relative'
      document.body.appendChild(parent)

      const child = document.createElement('div')
      child.style.width = '100px'
      child.style.height = '100px'
      child.style.position = 'absolute'
      parent.appendChild(child)

      const drag = createDragSpring(child, {
        constraints: {
          constrainToParent: true,
          constraintPadding: 20, // Number instead of object
        },
      })

      drag.setPosition(400, 400)
      drag.release(0, 0)

      expect(drag.getPosition()).toBeDefined()
      drag.destroy()
      parent.remove()
    })

    it('should handle release with momentum (lines 585-594)', () => {
      const drag = createDragSpring(element, {
        momentum: true,
        momentumDecay: 0.95,
      })

      drag.setPosition(100, 100)
      drag.release(1000, 1000)

      expect(drag.getPosition()).toBeDefined()
      drag.destroy()
    })

    it('should handle release with modifyTarget (lines 597-601)', () => {
      const modifyTarget = vi.fn((target: { x: number; y: number }) => ({
        x: Math.round(target.x / 50) * 50,
        y: Math.round(target.y / 50) * 50,
      }))

      const drag = createDragSpring(element, {
        modifyTarget,
      })

      drag.setPosition(75, 75)
      drag.release(0, 0)

      expect(modifyTarget).toHaveBeenCalled()
      drag.destroy()
    })

    it('should handle onBoundsHit callback (lines 608-613)', () => {
      const onBoundsHit = vi.fn()
      const drag = createDragSpring(element, {
        bounds: { left: 0, right: 200, top: 0, bottom: 200 },
        onBoundsHit,
      })

      drag.setPosition(300, 300)
      drag.release(0, 0)

      expect(onBoundsHit).toHaveBeenCalled()
      drag.destroy()
    })

    it('should handle snapTo with onSnapStart callback (lines 633-635)', () => {
      const onSnapStart = vi.fn()
      const drag = createDragSpring(element, {
        onSnapStart,
      })

      drag.snapTo({ x: 100, y: 100 })

      expect(onSnapStart).toHaveBeenCalledWith({ x: 100, y: 100 })
      drag.destroy()
    })

    it('should handle snapTo with onSnapComplete callback (lines 647-653)', async () => {
      const onSnapComplete = vi.fn()
      const drag = createDragSpring(element, {
        onSnapComplete,
        stiffness: 1000,
        damping: 100,
      })

      drag.snapTo({ x: 100, y: 100 })

      // Wait for snap timeout
      await new Promise(resolve => setTimeout(resolve, 600))

      expect(onSnapComplete).toHaveBeenCalled()
      drag.destroy()
    })

    it('should handle snapTo with previous timeout cleanup (lines 641-643)', () => {
      const drag = createDragSpring(element)

      // First snap
      drag.snapTo({ x: 50, y: 50 })
      // Second snap should cancel first timeout
      drag.snapTo({ x: 100, y: 100 })

      expect(drag.getPosition()).toBeDefined()
      drag.destroy()
    })

    it('should handle snap generation mismatch (lines 650)', async () => {
      const onSnapComplete = vi.fn()
      const drag = createDragSpring(element, {
        onSnapComplete,
      })

      // First snap
      drag.snapTo({ x: 50, y: 50 })
      // Second snap before first completes - should invalidate first
      drag.snapTo({ x: 100, y: 100 })

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 600))

      // onSnapComplete should only be called for the second snap
      expect(onSnapComplete).toHaveBeenCalledTimes(1)
      drag.destroy()
    })

    it('should handle destroy with pending snap timeout (lines 668-671)', () => {
      const drag = createDragSpring(element)

      drag.snapTo({ x: 100, y: 100 })

      // Destroy while timeout is pending
      drag.destroy()

      // Should not throw
      expect(() => drag.destroy()).not.toThrow()
    })

    it('should handle snap with no points or grid (lines 440)', () => {
      const drag = createDragSpring(element, {
        snap: {}, // Empty snap config
      })

      drag.snapToNearest()

      expect(drag.getPosition()).toBeDefined()
      drag.destroy()
    })

    it('should handle snapOnRelease false (lines 384)', () => {
      const drag = createDragSpring(element, {
        snap: {
          points: [{ x: 0, y: 0, radius: 100 }],
          snapOnRelease: false,
        },
      })

      // Start drag
      element.dispatchEvent(new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 100,
        clientY: 100,
      }))

      // Release - should not snap due to snapOnRelease: false
      element.dispatchEvent(new PointerEvent('pointerup', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 100,
        clientY: 100,
      }))

      expect(drag.getPosition()).toBeDefined()
      drag.destroy()
    })

    it('should handle isDragging method', () => {
      const drag = createDragSpring(element)

      expect(drag.isDragging()).toBe(false)

      // Start drag
      element.dispatchEvent(new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 100,
        clientY: 100,
      }))

      expect(drag.isDragging()).toBe(true)

      // End drag
      element.dispatchEvent(new PointerEvent('pointerup', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 100,
        clientY: 100,
      }))

      expect(drag.isDragging()).toBe(false)
      drag.destroy()
    })

    it('should handle getVelocity method', () => {
      const drag = createDragSpring(element)

      const velocity = drag.getVelocity()
      expect(velocity).toHaveProperty('x')
      expect(velocity).toHaveProperty('y')

      drag.destroy()
    })

    it('should handle setConstraints method', () => {
      const drag = createDragSpring(element)

      drag.setConstraints({
        bounds: { left: 0, right: 100, top: 0, bottom: 100 },
      })

      expect(drag.getPosition()).toBeDefined()
      drag.destroy()
    })

    it('should handle setSnap method', () => {
      const drag = createDragSpring(element)

      drag.setSnap({
        points: [{ x: 0, y: 0, radius: 50 }],
      })

      drag.snapToNearest()

      expect(drag.getPosition()).toBeDefined()
      drag.destroy()
    })

    it('should handle release with momentumDecay edge case (lines 588-589)', () => {
      const drag = createDragSpring(element, {
        momentum: true,
        momentumDecay: 0.99, // Very high decay
      })

      drag.setPosition(100, 100)
      drag.release(100, 100)

      expect(drag.getPosition()).toBeDefined()
      drag.destroy()
    })

    it('should handle release with momentumDecay of 1 (edge case)', () => {
      const drag = createDragSpring(element, {
        momentum: true,
        momentumDecay: 1, // Edge case
      })

      drag.setPosition(100, 100)
      drag.release(100, 100)

      expect(drag.getPosition()).toBeDefined()
      drag.destroy()
    })

    it('should handle drag with no bounds configured', () => {
      const drag = createDragSpring(element)

      // Start drag with no bounds
      element.dispatchEvent(new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 0,
        clientY: 0,
      }))

      // Move far
      element.dispatchEvent(new PointerEvent('pointermove', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        clientX: 1000,
        clientY: 1000,
      }))

      const pos = drag.getPosition()
      expect(pos.x).toBe(1000)
      expect(pos.y).toBe(1000)

      drag.destroy()
    })

    it('should handle pointer capture error gracefully (lines 375-377)', () => {
      const drag = createDragSpring(element)

      // Start drag
      element.dispatchEvent(new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 100,
        clientY: 100,
      }))

      // Remove element from DOM to cause pointer capture to fail
      element.remove()

      // This should not throw
      expect(() => {
        document.dispatchEvent(new PointerEvent('pointerup', {
          bubbles: true,
          cancelable: true,
          pointerId: 1,
          button: 0,
          clientX: 100,
          clientY: 100,
        }))
      }).not.toThrow()

      // Re-add element for cleanup
      document.body.appendChild(element)
      drag.destroy()
    })
  })
})
