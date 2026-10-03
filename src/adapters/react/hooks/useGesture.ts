import { useRef } from 'react'

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
  /** The first pointer went down */
  onDragStart?: (e: React.PointerEvent) => void
  /** The first pointer moved: `x` / `y` since it went down */
  onDrag?: (state: GestureState) => void
  /**
   * Two pointers moved: `scale` (distance relative to when the second one
   * went down), `angle` (rotation in degrees since then) and `x` / `y` (their
   * midpoint's movement)
   */
  onPinch?: (state: GestureState) => void
  /** Same state as `onPinch`, for rotation handlers */
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
 *       {...bind}
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
  // Pointers currently down on the element
  const pointersRef = useRef(new Map<number, Point>())
  // The drag follows the first pointer; other fingers don't move its start
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number } | null>(null)
  // Two-finger gesture (pinch / rotate) in progress
  const pinchRef = useRef<{
    ids: [number, number]
    startDistance: number
    startMid: Point
    lastAngle: number
    angle: number
  } | null>(null)

  const call = <A,>(name: string, fn: ((arg: A) => void) | undefined, arg: A) => {
    if (!fn) return
    // Wrap user callbacks so an error can't corrupt the gesture state
    try {
      fn(arg)
    } catch (error) {
      console.error(`[SpringKit] Gesture ${name} error:`, error)
    }
  }

  const startPinch = () => {
    const [first, second] = Array.from(pointersRef.current.entries())
    if (!first || !second) return
    const [idA, a] = first
    const [idB, b] = second
    const angle = angleOf(a, b)
    pinchRef.current = {
      ids: [idA, idB],
      startDistance: distanceOf(a, b),
      startMid: midpointOf(a, b),
      lastAngle: angle,
      angle: 0,
    }
  }

  const onPointerDown = (e: React.PointerEvent) => {
    // Capture the pointer so move/up events keep coming to this element even
    // when the pointer leaves it (otherwise a release outside the element
    // leaves the gesture stuck in the dragging state)
    try {
      const target = e.currentTarget as Element | null
      target?.setPointerCapture?.(e.pointerId)
    } catch {
      // Ignore: capture can fail (e.g. synthetic or already-released pointers)
    }

    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (!dragRef.current) {
      dragRef.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY }
      call('onDragStart', handlers.onDragStart, e)
    }
    if (pointersRef.current.size === 2) startPinch()
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const pointers = pointersRef.current
    if (!pointers.has(e.pointerId)) return
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })

    const drag = dragRef.current
    if (drag && drag.pointerId === e.pointerId) {
      call('onDrag', handlers.onDrag, { x: e.clientX - drag.startX, y: e.clientY - drag.startY })
    }

    const pinch = pinchRef.current
    if (!pinch || !pinch.ids.includes(e.pointerId)) return
    const a = pointers.get(pinch.ids[0])
    const b = pointers.get(pinch.ids[1])
    if (!a || !b) return
    // Accumulate the angle change, so it doesn't jump at ±180°
    const angle = angleOf(a, b)
    let delta = angle - pinch.lastAngle
    if (delta > 180) delta -= 360
    else if (delta < -180) delta += 360
    pinch.lastAngle = angle
    pinch.angle += delta
    const mid = midpointOf(a, b)
    const state: GestureState = {
      x: mid.x - pinch.startMid.x,
      y: mid.y - pinch.startMid.y,
      scale: pinch.startDistance === 0 ? 1 : distanceOf(a, b) / pinch.startDistance,
      angle: pinch.angle,
    }
    call('onPinch', handlers.onPinch, state)
    call('onRotate', handlers.onRotate, state)
  }

  const onPointerEnd = (e: React.PointerEvent) => {
    pointersRef.current.delete(e.pointerId)
    if (pinchRef.current?.ids.includes(e.pointerId)) pinchRef.current = null
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null
  }

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: onPointerEnd,
    onPointerCancel: onPointerEnd,
  }
}

interface Point {
  x: number
  y: number
}

function distanceOf(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

function angleOf(a: Point, b: Point): number {
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI
}

function midpointOf(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}
