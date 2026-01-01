import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import React from 'react'
import { useDragControls } from '@oxog/springkit/react'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('useDragControls', () => {
  describe('return values', () => {
    it('should return start function', () => {
      const { result } = renderHook(() => useDragControls())
      expect(typeof result.current.start).toBe('function')
    })

    it('should return stop function', () => {
      const { result } = renderHook(() => useDragControls())
      expect(typeof result.current.stop).toBe('function')
    })

    it('should return isDragging function', () => {
      const { result } = renderHook(() => useDragControls())
      expect(typeof result.current.isDragging).toBe('function')
    })
  })

  describe('isDragging state', () => {
    it('should initially return false', () => {
      const { result } = renderHook(() => useDragControls())
      expect(result.current.isDragging()).toBe(false)
    })

    it('should return true after start is called', () => {
      const { result } = renderHook(() => useDragControls())

      const mockEvent = new PointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
      })

      act(() => {
        result.current.start(mockEvent)
      })

      expect(result.current.isDragging()).toBe(true)
    })

    it('should return false after stop is called', () => {
      const { result } = renderHook(() => useDragControls())

      const mockEvent = new PointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
      })

      act(() => {
        result.current.start(mockEvent)
      })

      act(() => {
        result.current.stop()
      })

      expect(result.current.isDragging()).toBe(false)
    })
  })

  describe('start function', () => {
    it('should accept PointerEvent', () => {
      const { result } = renderHook(() => useDragControls())

      const mockEvent = new PointerEvent('pointerdown', {
        clientX: 50,
        clientY: 75,
      })

      expect(() => {
        act(() => {
          result.current.start(mockEvent)
        })
      }).not.toThrow()
    })

    it('should accept React PointerEvent-like object', () => {
      const { result } = renderHook(() => useDragControls())

      const mockReactEvent = {
        nativeEvent: new PointerEvent('pointerdown', {
          clientX: 50,
          clientY: 75,
        }),
        preventDefault: vi.fn(),
      } as unknown as React.PointerEvent

      expect(() => {
        act(() => {
          result.current.start(mockReactEvent)
        })
      }).not.toThrow()
    })

    it('should accept options with snapToCursor', () => {
      const { result } = renderHook(() => useDragControls())

      const mockEvent = new PointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
      })

      expect(() => {
        act(() => {
          result.current.start(mockEvent, { snapToCursor: true })
        })
      }).not.toThrow()
    })

    it('should accept options with cursorOffset', () => {
      const { result } = renderHook(() => useDragControls())

      const mockEvent = new PointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
      })

      expect(() => {
        act(() => {
          result.current.start(mockEvent, { cursorOffset: { x: 10, y: 20 } })
        })
      }).not.toThrow()
    })
  })

  describe('stop function', () => {
    it('should stop without error when not dragging', () => {
      const { result } = renderHook(() => useDragControls())

      expect(() => {
        act(() => {
          result.current.stop()
        })
      }).not.toThrow()
    })

    it('should stop active drag', () => {
      const { result } = renderHook(() => useDragControls())

      const mockEvent = new PointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
      })

      act(() => {
        result.current.start(mockEvent)
      })

      expect(result.current.isDragging()).toBe(true)

      act(() => {
        result.current.stop()
      })

      expect(result.current.isDragging()).toBe(false)
    })
  })

  describe('multiple starts', () => {
    it('should handle multiple start calls', () => {
      const { result } = renderHook(() => useDragControls())

      const event1 = new PointerEvent('pointerdown', { clientX: 50, clientY: 50 })
      const event2 = new PointerEvent('pointerdown', { clientX: 100, clientY: 100 })

      act(() => {
        result.current.start(event1)
      })

      act(() => {
        result.current.start(event2)
      })

      expect(result.current.isDragging()).toBe(true)
    })
  })

  describe('internal handlers', () => {
    it('should have internal _setDragHandler', () => {
      const { result } = renderHook(() => useDragControls())

      // These are internal methods used by Animated component
      const controls = result.current as any
      expect(typeof controls._setDragHandler).toBe('function')
    })

    it('should have internal _setStopHandler', () => {
      const { result } = renderHook(() => useDragControls())

      const controls = result.current as any
      expect(typeof controls._setStopHandler).toBe('function')
    })

    it('should have internal _notifyDragEnd', () => {
      const { result } = renderHook(() => useDragControls())

      const controls = result.current as any
      expect(typeof controls._notifyDragEnd).toBe('function')
    })

    it('should call registered drag handler on start', () => {
      const { result } = renderHook(() => useDragControls())

      const dragHandler = vi.fn()
      const controls = result.current as any

      act(() => {
        controls._setDragHandler(dragHandler)
      })

      const mockEvent = new PointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
      })

      act(() => {
        result.current.start(mockEvent)
      })

      expect(dragHandler).toHaveBeenCalled()
    })

    it('should call registered stop handler on stop', () => {
      const { result } = renderHook(() => useDragControls())

      const stopHandler = vi.fn()
      const controls = result.current as any

      act(() => {
        controls._setStopHandler(stopHandler)
      })

      const mockEvent = new PointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
      })

      act(() => {
        result.current.start(mockEvent)
      })

      act(() => {
        result.current.stop()
      })

      expect(stopHandler).toHaveBeenCalled()
    })

    it('should reset isDragging when _notifyDragEnd is called', () => {
      const { result } = renderHook(() => useDragControls())

      const mockEvent = new PointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
      })

      act(() => {
        result.current.start(mockEvent)
      })

      expect(result.current.isDragging()).toBe(true)

      const controls = result.current as any
      act(() => {
        controls._notifyDragEnd()
      })

      expect(result.current.isDragging()).toBe(false)
    })
  })

  describe('stability', () => {
    it('should return stable function references', () => {
      const { result, rerender } = renderHook(() => useDragControls())

      const start1 = result.current.start
      const stop1 = result.current.stop
      const isDragging1 = result.current.isDragging

      rerender()

      expect(result.current.start).toBe(start1)
      expect(result.current.stop).toBe(stop1)
      expect(result.current.isDragging).toBe(isDragging1)
    })
  })
})
