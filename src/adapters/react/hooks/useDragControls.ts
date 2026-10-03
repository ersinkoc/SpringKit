import * as React from 'react'
import { useRef, useCallback, useMemo } from 'react'

/**
 * Drag controls for programmatic drag initiation
 */
export interface DragControls {
  /**
   * Start a drag gesture from a pointer event (usually the `onPointerDown` of
   * a handle). As with the element's own listener, the drag callbacks and
   * `whileDrag` begin once the pointer has moved `dragThreshold` px.
   */
  start: (event: React.PointerEvent | PointerEvent, options?: DragStartOptions) => void
  /**
   * Stop the active drag (and any momentum / snap-back animation): the element
   * settles immediately, without momentum. `onDragEnd` is called for an
   * active drag.
   */
  stop: () => void
  /**
   * Cancel the active drag: it ends without momentum (`onDragEnd` is called
   * with zero velocity) and the element animates back inside its constraints
   * (or to the origin with `dragSnapToOrigin`). While no drag is active, it
   * interrupts a running release animation the same way, without callbacks.
   */
  cancel: () => void
  /** Whether a gesture started by these controls / the element is in progress */
  isDragging: () => boolean
}

export interface DragStartOptions {
  /** Snap to cursor position on start */
  snapToCursor?: boolean
  /** Cursor offset from element center */
  cursorOffset?: { x: number; y: number }
}

/** Handlers registered by an Animated element using these controls */
interface DragControlsSubscriber {
  start: (event: PointerEvent, options?: DragStartOptions) => void
  stop: () => void
  cancel: () => void
}

/**
 * Creates drag controls for programmatic drag initiation
 *
 * This hook allows you to start a drag from a different element than
 * the one being dragged, useful for drag handles. The same controls can be
 * passed to several elements: `start()`, `stop()` and `cancel()` drive all of
 * them.
 *
 * @example Basic usage with drag handle
 * ```tsx
 * function DraggableCard() {
 *   const controls = useDragControls()
 *
 *   return (
 *     <div>
 *       <div
 *         className="drag-handle"
 *         onPointerDown={(e) => controls.start(e)}
 *       >
 *         ⋮⋮ Drag here
 *       </div>
 *       <Animated.div
 *         dragControls={controls}
 *         drag="both"
 *         dragListener={false} // only the handle starts drags
 *       >
 *         Card content
 *       </Animated.div>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example With snap to cursor
 * ```tsx
 * const controls = useDragControls()
 *
 * <button
 *   onPointerDown={(e) => controls.start(e, { snapToCursor: true })}
 * >
 *   Pick up item
 * </button>
 * ```
 *
 * @example Multiple draggable items
 * ```tsx
 * function DraggableList({ items }) {
 *   return items.map((item) => {
 *     const controls = useDragControls()
 *
 *     return (
 *       <div key={item.id}>
 *         <GripIcon onPointerDown={(e) => controls.start(e)} />
 *         <Animated.div dragControls={controls} drag="y">
 *           {item.content}
 *         </Animated.div>
 *       </div>
 *     )
 *   })
 * }
 * ```
 */
export function useDragControls(): DragControls {
  const isDraggingRef = useRef(false)
  // Elements with a gesture in progress (the controls may drive several)
  const activeCountRef = useRef(0)
  // Single-handler registration (legacy internal API)
  const listenerRef = useRef<((event: PointerEvent, options?: DragStartOptions) => void) | null>(null)
  const stopRef = useRef<(() => void) | null>(null)
  // Elements subscribed through _subscribe()
  const subscribersRef = useRef(new Set<DragControlsSubscriber>())

  const start = useCallback((
    event: React.PointerEvent | PointerEvent,
    options?: DragStartOptions
  ) => {
    isDraggingRef.current = true

    // Prevent default to avoid text selection
    event.preventDefault()

    // Start a drag on every registered element (Animated elements with `drag`
    // and `dragControls={controls}`)
    const pointerEvent = 'nativeEvent' in event ? event.nativeEvent : event
    listenerRef.current?.(pointerEvent, options)
    for (const subscriber of Array.from(subscribersRef.current)) {
      subscriber.start(pointerEvent, options)
    }
  }, [])

  const stop = useCallback(() => {
    isDraggingRef.current = false
    stopRef.current?.()
    for (const subscriber of Array.from(subscribersRef.current)) {
      subscriber.stop()
    }
  }, [])

  const cancel = useCallback(() => {
    isDraggingRef.current = false
    for (const subscriber of Array.from(subscribersRef.current)) {
      subscriber.cancel()
    }
  }, [])

  const isDragging = useCallback(() => {
    return isDraggingRef.current
  }, [])

  // Create a controls object with internal setters for the drag component.
  // Memoized so it can be passed as a prop / effect dependency without
  // changing identity on every render.
  const controls = useMemo<DragControls & {
    // Called by the dragged component (Animated with `dragControls`); returns
    // the unsubscribe function
    _subscribe: (subscriber: DragControlsSubscriber) => () => void
    // Legacy single-handler registration; null unregisters
    _setDragHandler: (handler: ((event: PointerEvent, options?: DragStartOptions) => void) | null) => void
    _setStopHandler: (handler: (() => void) | null) => void
    _notifyDragStart: () => void
    _notifyDragEnd: () => void
  }>(() => ({
    start,
    stop,
    cancel,
    isDragging,
    _subscribe: (subscriber) => {
      subscribersRef.current.add(subscriber)
      return () => {
        subscribersRef.current.delete(subscriber)
      }
    },
    _setDragHandler: (handler) => {
      listenerRef.current = handler
    },
    _setStopHandler: (handler) => {
      stopRef.current = handler
    },
    // Called by the dragged component when a gesture starts / ends, including
    // gestures started by its own pointer listener
    _notifyDragStart: () => {
      activeCountRef.current++
      isDraggingRef.current = true
    },
    _notifyDragEnd: () => {
      // Still dragging while another element's gesture is in progress
      activeCountRef.current = Math.max(0, activeCountRef.current - 1)
      if (activeCountRef.current === 0) isDraggingRef.current = false
    },
  }), [start, stop, cancel, isDragging])

  return controls
}

export type { DragControls as DragControlsType }
