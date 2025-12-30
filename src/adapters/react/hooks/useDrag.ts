import { useEffect, useRef, useState } from 'react'
import { createDragSpring } from '../../../index.js'
import type { DragSpring, DragSpringConfig } from '../../../types.js'

/**
 * Drag API interface
 */
export interface DragAPI {
  /** Ref callback to attach to your draggable element */
  ref: (el: HTMLElement | null) => void
  /** Set position */
  set(values: { x?: number; y?: number }): void
  /** Reset to initial position */
  reset(): void
  /** Whether currently dragging */
  isDragging: boolean
}

/**
 * Hook for creating drag interactions
 *
 * @param config - Drag spring configuration
 * @returns Tuple of [position, api]
 *
 * @example
 * ```tsx
 * function DraggableCard() {
 *   const [{ x, y }, api] = useDrag({
 *     bounds: { left: 0, right: 300, top: 0, bottom: 200 },
 *     rubberBand: true,
 *     stiffness: 200,
 *     damping: 20,
 *   })
 *
 *   return (
 *     <div
 *       ref={api.ref}
 *       style={{
 *         transform: `translate(${x}px, ${y}px)`,
 *         width: 100,
 *         height: 100,
 *         background: '#3b82f6',
 *       }}
 *     >
 *       Drag me!
 *     </div>
 *   )
 * }
 * ```
 */
export function useDrag(config: DragSpringConfig = {}): [
  { x: number; y: number },
  DragAPI
] {
  const dragSpringRef = useRef<DragSpring | null>(null)
  const positionRef = useRef({ x: 0, y: 0 })
  const [element, setElement] = useState<HTMLElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [, forceUpdate] = useState({})
  const configRef = useRef(config)

  // Keep config ref updated
  configRef.current = config

  // Ref callback - triggers re-render when element changes
  const refCallback = (el: HTMLElement | null) => {
    setElement(el)
  }

  // Setup/cleanup drag spring when element changes
  useEffect(() => {
    // Cleanup previous instance
    if (dragSpringRef.current) {
      dragSpringRef.current.destroy()
      dragSpringRef.current = null
    }

    if (element) {
      // Create drag spring with the element
      dragSpringRef.current = createDragSpring(element, {
        ...configRef.current,
        onDragStart: (e) => {
          setIsDragging(true)
          configRef.current.onDragStart?.(e)
        },
        onDragEnd: (x, y, velocity) => {
          setIsDragging(false)
          configRef.current.onDragEnd?.(x, y, velocity)
        },
        onUpdate: (x, y) => {
          positionRef.current = { x, y }
          forceUpdate({})
          configRef.current.onUpdate?.(x, y)
        },
      })
    }

    return () => {
      dragSpringRef.current?.destroy()
      dragSpringRef.current = null
    }
  }, [element])

  // API methods
  const set = (values: { x?: number; y?: number }) => {
    const x = values.x ?? positionRef.current.x
    const y = values.y ?? positionRef.current.y
    dragSpringRef.current?.setPosition(x, y)
  }

  const reset = () => {
    dragSpringRef.current?.reset()
    positionRef.current = { x: 0, y: 0 }
    forceUpdate({})
  }

  return [positionRef.current, { ref: refCallback, set, reset, isDragging }]
}
