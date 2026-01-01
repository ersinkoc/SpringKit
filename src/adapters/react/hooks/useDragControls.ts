import { useRef, useCallback } from 'react'

/**
 * Drag controls for programmatic drag initiation
 */
export interface DragControls {
  /** Start dragging from a pointer event */
  start: (event: React.PointerEvent | PointerEvent, options?: DragStartOptions) => void
  /** Stop any active drag */
  stop: () => void
  /** Check if currently dragging */
  isDragging: () => boolean
}

export interface DragStartOptions {
  /** Snap to cursor position on start */
  snapToCursor?: boolean
  /** Cursor offset from element center */
  cursorOffset?: { x: number; y: number }
}

/**
 * Creates drag controls for programmatic drag initiation
 *
 * This hook allows you to start a drag from a different element than
 * the one being dragged, useful for drag handles.
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
  const listenerRef = useRef<((event: PointerEvent, options?: DragStartOptions) => void) | null>(null)
  const stopRef = useRef<(() => void) | null>(null)

  const start = useCallback((
    event: React.PointerEvent | PointerEvent,
    options?: DragStartOptions
  ) => {
    isDraggingRef.current = true

    // Prevent default to avoid text selection
    event.preventDefault()

    // Call the registered drag handler
    if (listenerRef.current) {
      const pointerEvent = 'nativeEvent' in event ? event.nativeEvent : event
      listenerRef.current(pointerEvent, options)
    }
  }, [])

  const stop = useCallback(() => {
    isDraggingRef.current = false
    if (stopRef.current) {
      stopRef.current()
    }
  }, [])

  const isDragging = useCallback(() => {
    return isDraggingRef.current
  }, [])

  // Create a controls object with internal setters for the drag component
  const controls: DragControls & {
    _setDragHandler: (handler: (event: PointerEvent, options?: DragStartOptions) => void) => void
    _setStopHandler: (handler: () => void) => void
    _notifyDragEnd: () => void
  } = {
    start,
    stop,
    isDragging,
    _setDragHandler: (handler) => {
      listenerRef.current = handler
    },
    _setStopHandler: (handler) => {
      stopRef.current = handler
    },
    _notifyDragEnd: () => {
      isDraggingRef.current = false
    },
  }

  return controls
}

export type { DragControls as DragControlsType }
