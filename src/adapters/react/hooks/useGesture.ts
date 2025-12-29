import { useEffect, useRef, useState } from 'react'

/**
 * Gesture state
 */
export interface GestureState {
  x: number
  y: number
  scale?: number
  angle?: number
}

/**
 * Gesture handlers
 */
export interface GestureHandlers {
  onDrag?: (state: GestureState) => void
  onPinch?: (state: GestureState) => void
  onRotate?: (state: GestureState) => void
}

/**
 * Gesture bind function return type
 */
export interface GestureBind {
  onPointerDown: (e: React.PointerEvent) => void
  onPointerMove: (e: React.PointerEvent) => void
  onPointerUp: (e: React.PointerEvent) => void
  onPointerCancel: (e: React.PointerEvent) => void
}

/**
 * Hook for gesture interactions
 *
 * @param handlers - Gesture event handlers
 * @returns Bind function for attaching to elements
 *
 * @example
 * ```tsx
 * function GestureCard() {
 *   const [style, setStyle] = useState({
 *     x: 0,
 *     y: 0,
 *     scale: 1,
 *     rotation: 0,
 *   })
 *
 *   const bind = useGesture({
 *     onDrag: ({ x, y }) => {
 *       setStyle(s => ({ ...s, x, y }))
 *     },
 *     onPinch: ({ scale }) => {
 *       setStyle(s => ({ ...s, scale }))
 *     },
 *   })
 *
 *   return (
 *     <div
 *       {...bind()}
 *       style={{
 *         transform: `translate(${style.x}px, ${style.y}px) scale(${style.scale})`,
 *       }}
 *     >
 *       Gesture enabled card
 *     </div>
 *   )
 * }
 * ```
 */
export function useGesture(handlers: GestureHandlers): GestureBind {
  const stateRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  })

  const onPointerDown = (e: React.PointerEvent) => {
    stateRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!stateRef.current.isDragging) return

    const deltaX = e.clientX - stateRef.current.startX
    const deltaY = e.clientY - stateRef.current.startY

    handlers.onDrag?.({ x: deltaX, y: deltaY })

    stateRef.current.currentX = e.clientX
    stateRef.current.currentY = e.clientY
  }

  const onPointerUp = () => {
    stateRef.current.isDragging = false
  }

  const onPointerCancel = () => {
    stateRef.current.isDragging = false
  }

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  }
}
