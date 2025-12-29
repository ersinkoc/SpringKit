import { useEffect, useRef, useState } from 'react'
import { createDragSpring, type DragSpring, type DragSpringConfig } from '../../gesture/drag.ts'

/**
 * Drag API interface
 */
export interface DragAPI {
  /** Bind drag events to an element */
  bind(): { onPointerDown: (e: React.PointerEvent) => void }
  /** Set position */
  set(values: { x?: number; y?: number }): void
  /** Reset to initial position */
  reset(): void
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
 *       {...api.bind()}
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
export function useDrag(config: DragSpringConfig = []): [
  { x: number; y: number },
  DragAPI
] {
  const dragRef = useRef<DragSpring | null>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const elementRef = useRef<HTMLElement | null>(null)

  // Initialize drag spring
  useEffect(() => {
    if (!elementRef.current) return

    dragRef.current = createDragSpring(elementRef.current, {
      ...config,
      onUpdate: (x, y) => {
        setPosition({ x, y })
        config.onUpdate?.(x, y)
      },
    })

    return () => {
      dragRef.current?.destroy()
    }
  }, [config.bounds?.left, config.bounds?.right])

  // Bind to element
  const bind = () => ({
    onPointerDown: (e: React.PointerEvent) => {
      elementRef.current = e.currentTarget as HTMLElement
      if (!dragRef.current && elementRef.current) {
        dragRef.current = createDragSpring(elementRef.current, {
          ...config,
          onUpdate: (x, y) => {
            setPosition({ x, y })
            config.onUpdate?.(x, y)
          },
        })
      }
    },
  })

  // API
  const api: DragAPI = {
    bind,
    set: (values) => {
      dragRef.current?.setPosition(values.x ?? position.x, values.y ?? position.y)
    },
    reset: () => {
      dragRef.current?.reset()
    },
  }

  return [position, api]
}
