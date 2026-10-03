import { useCallback, useEffect, useRef, useState } from 'react'
import { createDragSpring } from '@oxog/springkit'
import type { DragSpring, DragSpringConfig } from '@oxog/springkit'

/** Stable ids for elements inside a config (e.g. `constraints.constrainToElement`) */
const elementIds = new WeakMap<object, number>()
let nextElementId = 0

/**
 * The config's contents as a string (callbacks excluded: they are always read
 * from the latest config), so an inline config object doesn't re-create the
 * drag on every render but a changed option does
 */
function configKeyOf(config: DragSpringConfig): string {
  return JSON.stringify(config, (_key, value: unknown) => {
    if (typeof value === 'function') return undefined
    if (typeof Element !== 'undefined' && value instanceof Element) {
      let id = elementIds.get(value)
      if (id === undefined) {
        id = nextElementId++
        elementIds.set(value, id)
      }
      return `#element${id}`
    }
    return value
  })
}

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
  // RAF throttling for position updates
  const rafIdRef = useRef<number | null>(null)
  const pendingUpdateRef = useRef(false)

  // Keep config ref updated
  configRef.current = config

  // Ref callback - triggers re-render when element changes.
  // Must be stable: a new function each render makes React detach (null) and
  // re-attach it on every render, queueing two extra state updates each time.
  const refCallback = useCallback((el: HTMLElement | null) => {
    setElement(el)
  }, [])

  // RAF-throttled update function
  const throttledUpdate = () => {
    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null
        if (pendingUpdateRef.current) {
          pendingUpdateRef.current = false
          forceUpdate({})
        }
      })
    }
  }

  const configKey = configKeyOf(config)

  // Setup/cleanup the drag spring when the element or the options change. The
  // position carries over to the new instance.
  useEffect(() => {
    let isActive = true

    // Cleanup previous instance
    if (dragSpringRef.current) {
      dragSpringRef.current.destroy()
      dragSpringRef.current = null
    }

    // Cancel any pending RAF
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }

    if (element) {
      // Read before creating: the new instance reports its (0, 0) start
      const carried = positionRef.current
      // Create drag spring with the element
      dragSpringRef.current = createDragSpring(element, {
        ...configRef.current,
        onDragStart: (e) => {
          if (!isActive) return
          setIsDragging(true)
          configRef.current.onDragStart?.(e)
        },
        onDragEnd: (x, y, velocity) => {
          if (!isActive) return
          setIsDragging(false)
          configRef.current.onDragEnd?.(x, y, velocity)
        },
        onUpdate: (x, y) => {
          if (!isActive) return
          positionRef.current = { x, y }
          pendingUpdateRef.current = true
          throttledUpdate()
          configRef.current.onUpdate?.(x, y)
        },
      })
      if (carried.x !== 0 || carried.y !== 0) dragSpringRef.current.setPosition(carried.x, carried.y)
    }

    return () => {
      isActive = false
      // A drag in progress ends with this instance
      if (dragSpringRef.current?.isDragging()) setIsDragging(false)
      dragSpringRef.current?.destroy()
      dragSpringRef.current = null
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
    }
    // configKey: the options changed (callbacks are read from configRef)
  }, [element, configKey])

  // API methods with validation
  const set = (values: { x?: number; y?: number }) => {
    // Validate input values - skip NaN/Infinity
    const rawX = values.x ?? positionRef.current.x
    const rawY = values.y ?? positionRef.current.y

    // Guard against NaN/Infinity
    const x = Number.isFinite(rawX) ? rawX : positionRef.current.x
    const y = Number.isFinite(rawY) ? rawY : positionRef.current.y

    dragSpringRef.current?.setPosition(x, y)
  }

  const reset = () => {
    dragSpringRef.current?.reset()
    positionRef.current = { x: 0, y: 0 }
    forceUpdate({})
  }

  return [positionRef.current, { ref: refCallback, set, reset, isDragging }]
}
