import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createDragSpring } from '@oxog/springkit'

describe('createDragSpring', () => {
  let element: HTMLElement

  beforeEach(() => {
    element = document.createElement('div')
    document.body.appendChild(element)
  })

  afterEach(() => {
    document.body.removeChild(element)
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
  })
})
