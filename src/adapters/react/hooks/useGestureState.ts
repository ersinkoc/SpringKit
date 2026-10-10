import {
  useState,
  useRef,
  useEffect,
  type RefObject,
  type MouseEventHandler,
  type TouchEventHandler,
  type FocusEventHandler,
  type DragEventHandler,
} from 'react'
import { isBrowser } from '../utils/ssr.js'

export interface GestureState {
  /** Is the element being hovered */
  isHovered: boolean
  /** Is the element being pressed/tapped */
  isPressed: boolean
  /** Is the element focused */
  isFocused: boolean
  /** Is the element being dragged */
  isDragging: boolean
}

export interface UseGestureStateOptions {
  /** Enable hover tracking */
  hover?: boolean
  /** Enable press/tap tracking */
  press?: boolean
  /** Enable focus tracking */
  focus?: boolean
  /** Enable drag tracking */
  drag?: boolean
}

/**
 * Spreadable DOM event handlers for gesture tracking.
 * Typed with React's native handler types so they can be spread directly
 * onto JSX elements and also invoked manually with the event.
 */
export interface GestureHandlers {
  onMouseEnter?: MouseEventHandler<HTMLElement>
  onMouseLeave?: MouseEventHandler<HTMLElement>
  onMouseDown?: MouseEventHandler<HTMLElement>
  onMouseUp?: MouseEventHandler<HTMLElement>
  onTouchStart?: TouchEventHandler<HTMLElement>
  onTouchEnd?: TouchEventHandler<HTMLElement>
  onTouchCancel?: TouchEventHandler<HTMLElement>
  onFocus?: FocusEventHandler<HTMLElement>
  onBlur?: FocusEventHandler<HTMLElement>
  onDragStart?: DragEventHandler<HTMLElement>
  onDragEnd?: DragEventHandler<HTMLElement>
}

/**
 * Whether a touch event leaves a finger on the element (`targetTouches`) or,
 * for window-level events, anywhere on the screen (`touches`). A press must
 * only end when the last finger that caused it is gone.
 */
function touchStillDown(e: { targetTouches?: ArrayLike<unknown>; touches?: ArrayLike<unknown> }, onElement: boolean): boolean {
  const list = onElement ? e.targetTouches : e.touches
  return !!list && list.length > 0
}

export interface UseGestureStateReturn extends GestureState {
  /** Ref to attach to the target element */
  ref: RefObject<HTMLElement | null>
  /** Handlers to spread on the element */
  handlers: GestureHandlers
}

/**
 * Track gesture states for an element
 *
 * @example
 * ```tsx
 * function InteractiveButton() {
 *   const { ref, isHovered, isPressed, handlers } = useGestureState({
 *     hover: true,
 *     press: true,
 *   })
 *
 *   const scale = isPressed ? 0.95 : isHovered ? 1.05 : 1
 *
 *   return (
 *     <button
 *       ref={ref}
 *       {...handlers}
 *       style={{ transform: `scale(${scale})` }}
 *     >
 *       Click me
 *     </button>
 *   )
 * }
 * ```
 */
export function useGestureState(
  options: UseGestureStateOptions = {}
): UseGestureStateReturn {
  const {
    hover = true,
    press = true,
    focus = true,
    drag = false,
  } = options

  const ref = useRef<HTMLElement | null>(null)
  const [state, setState] = useState<GestureState>({
    isHovered: false,
    isPressed: false,
    isFocused: false,
    isDragging: false,
  })

  // Memoized handlers
  const handlers: GestureHandlers = {
    ...(hover && {
      onMouseEnter: () => setState((s) => ({ ...s, isHovered: true })),
      onMouseLeave: () => setState((s) => ({ ...s, isHovered: false, isPressed: false })),
    }),
    ...(press && {
      onMouseDown: () => setState((s) => ({ ...s, isPressed: true })),
      onMouseUp: () => setState((s) => ({ ...s, isPressed: false })),
      onTouchStart: () => setState((s) => ({ ...s, isPressed: true })),
      onTouchEnd: (e) => {
        if (touchStillDown(e, true)) return
        setState((s) => ({ ...s, isPressed: false }))
      },
      // The system can cancel a touch (scroll takeover, interruption): no touchend follows
      onTouchCancel: (e) => {
        if (touchStillDown(e, true)) return
        setState((s) => ({ ...s, isPressed: false }))
      },
    }),
    ...(focus && {
      onFocus: () => setState((s) => ({ ...s, isFocused: true })),
      onBlur: () => setState((s) => ({ ...s, isFocused: false })),
    }),
    ...(drag && {
      onDragStart: () => setState((s) => ({ ...s, isDragging: true })),
      onDragEnd: () => setState((s) => ({ ...s, isDragging: false })),
    }),
  }

  // Global mouseup listener for press
  useEffect(() => {
    if (!press || !isBrowser) return

    const handleGlobalMouseUp = (e: Event) => {
      // Another finger lifting elsewhere must not release a press that is still held
      if (touchStillDown(e as TouchEvent, false)) return
      setState((s) => (s.isPressed ? { ...s, isPressed: false } : s))
    }

    window.addEventListener('mouseup', handleGlobalMouseUp)
    window.addEventListener('touchend', handleGlobalMouseUp)
    window.addEventListener('touchcancel', handleGlobalMouseUp)

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp)
      window.removeEventListener('touchend', handleGlobalMouseUp)
      window.removeEventListener('touchcancel', handleGlobalMouseUp)
    }
  }, [press])

  return {
    ref,
    ...state,
    handlers,
  }
}

/**
 * Hook for hover state only
 *
 * @example
 * ```tsx
 * function HoverCard() {
 *   const { ref, isHovered, handlers } = useHover()
 *
 *   return (
 *     <div
 *       ref={ref}
 *       {...handlers}
 *       style={{ opacity: isHovered ? 1 : 0.7 }}
 *     >
 *       Hover me
 *     </div>
 *   )
 * }
 * ```
 */
export function useHover() {
  const ref = useRef<HTMLElement | null>(null)
  const [isHovered, setIsHovered] = useState(false)

  const handlers: GestureHandlers = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  }

  return { ref, isHovered, handlers }
}

/**
 * Hook for tap/press state
 *
 * @example
 * ```tsx
 * function TapButton() {
 *   const { ref, isPressed, handlers } = useTap()
 *
 *   return (
 *     <button
 *       ref={ref}
 *       {...handlers}
 *       style={{ transform: `scale(${isPressed ? 0.95 : 1})` }}
 *     >
 *       Press me
 *     </button>
 *   )
 * }
 * ```
 */
export function useTap() {
  const ref = useRef<HTMLElement | null>(null)
  const [isPressed, setIsPressed] = useState(false)

  const handlers: GestureHandlers = {
    onMouseDown: () => setIsPressed(true),
    onMouseUp: () => setIsPressed(false),
    onMouseLeave: () => setIsPressed(false),
    onTouchStart: () => setIsPressed(true),
    onTouchEnd: (e) => {
      if (touchStillDown(e, true)) return
      setIsPressed(false)
    },
    onTouchCancel: (e) => {
      if (touchStillDown(e, true)) return
      setIsPressed(false)
    },
  }

  // Global release
  useEffect(() => {
    if (!isBrowser) return

    const handleUp = (e: Event) => {
      if (touchStillDown(e as TouchEvent, false)) return
      setIsPressed(false)
    }
    window.addEventListener('mouseup', handleUp)
    window.addEventListener('touchend', handleUp)
    window.addEventListener('touchcancel', handleUp)

    return () => {
      window.removeEventListener('mouseup', handleUp)
      window.removeEventListener('touchend', handleUp)
      window.removeEventListener('touchcancel', handleUp)
    }
  }, [])

  return { ref, isPressed, handlers }
}

/**
 * Hook for focus state
 *
 * @example
 * ```tsx
 * function FocusInput() {
 *   const { ref, isFocused, handlers } = useFocus()
 *
 *   return (
 *     <input
 *       ref={ref}
 *       {...handlers}
 *       style={{ borderColor: isFocused ? 'blue' : 'gray' }}
 *     />
 *   )
 * }
 * ```
 */
export function useFocus() {
  const ref = useRef<HTMLElement | null>(null)
  const [isFocused, setIsFocused] = useState(false)

  const handlers: GestureHandlers = {
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
  }

  return { ref, isFocused, handlers }
}

/**
 * Combined hook for common interaction states
 *
 * Returns the current "active" state based on priority:
 * pressed > hovered > focused > default
 *
 * @example
 * ```tsx
 * function InteractiveElement() {
 *   const { ref, activeState, handlers } = useInteractionState()
 *
 *   const styles = {
 *     default: { scale: 1, opacity: 0.7 },
 *     hovered: { scale: 1.05, opacity: 0.9 },
 *     pressed: { scale: 0.95, opacity: 1 },
 *     focused: { scale: 1, opacity: 1 },
 *   }
 *
 *   const current = styles[activeState]
 *
 *   return (
 *     <div ref={ref} {...handlers} style={{ transform: `scale(${current.scale})` }}>
 *       Interact with me
 *     </div>
 *   )
 * }
 * ```
 */
export function useInteractionState() {
  const { ref, isHovered, isPressed, isFocused, handlers } = useGestureState({
    hover: true,
    press: true,
    focus: true,
  })

  const activeState: 'default' | 'hovered' | 'pressed' | 'focused' =
    isPressed ? 'pressed' :
    isHovered ? 'hovered' :
    isFocused ? 'focused' :
    'default'

  return { ref, isHovered, isPressed, isFocused, activeState, handlers }
}

/**
 * Hook that returns animated values for gesture states
 *
 * @example
 * ```tsx
 * function AnimatedButton() {
 *   const { ref, scale, opacity, handlers } = useGestureAnimation({
 *     default: { scale: 1, opacity: 0.8 },
 *     hover: { scale: 1.05, opacity: 1 },
 *     press: { scale: 0.95, opacity: 1 },
 *   })
 *
 *   return (
 *     <button
 *       ref={ref}
 *       {...handlers}
 *       style={{ transform: `scale(${scale})`, opacity }}
 *     >
 *       Animated Button
 *     </button>
 *   )
 * }
 * ```
 */
export function useGestureAnimation<T extends Record<string, number>>(
  states: {
    default: T
    hover?: Partial<T>
    press?: Partial<T>
    focus?: Partial<T>
  }
) {
  const { ref, isHovered, isPressed, isFocused, handlers } = useGestureState({
    hover: !!states.hover,
    press: !!states.press,
    focus: !!states.focus,
  })

  // Merge states based on priority
  const currentValues = { ...states.default }

  if (isFocused && states.focus) {
    Object.assign(currentValues, states.focus)
  }
  if (isHovered && states.hover) {
    Object.assign(currentValues, states.hover)
  }
  if (isPressed && states.press) {
    Object.assign(currentValues, states.press)
  }

  return {
    ref,
    handlers,
    isHovered,
    isPressed,
    isFocused,
    ...currentValues,
  }
}
