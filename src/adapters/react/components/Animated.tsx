import * as React from 'react'
import { useEffect, useRef, useState, useContext, useCallback, memo } from 'react'
import { createSpringGroup } from '@oxog/springkit'
import type { SpringConfig } from '@oxog/springkit'
import { PresenceContext } from '../context/PresenceContext.js'
import { isBrowser, safeRequestAnimationFrame, safeCancelAnimationFrame } from '../utils/ssr.js'
import { MotionContext } from './MotionConfig.js'
import { useAnimatedDrag } from './useAnimatedDrag.js'
import type { AnimatedDragProps } from './useAnimatedDrag.js'

export type {
  AnimatedDragProps,
  DragConstraints,
  DragConstraintsBox,
  DragElastic,
  DragPoint,
  DragTransition,
  PanInfo,
} from './useAnimatedDrag.js'

/**
 * Animation state for Animated components
 */
export interface AnimatedStyle {
  [key: string]: number | string
}

/**
 * Viewport options for whileInView
 */
export interface ViewportOptions {
  /** Only trigger animation once */
  once?: boolean
  /** IntersectionObserver margin */
  margin?: string
  /** Amount of element that must be visible (0-1) */
  amount?: number | 'some' | 'all'
}

/**
 * Props for animated elements
 */
/**
 * Native HTML5 drag-and-drop handlers replaced by the pointer-based drag
 * gesture callbacks (as in Framer Motion)
 */
type DragHandlerName = 'onDrag' | 'onDragStart' | 'onDragEnd'

export interface AnimatedElementProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'style' | DragHandlerName>,
    AnimatedDragProps {
  /** Spring configuration */
  config?: SpringConfig

  /** Initial animation state (animates from this on mount) */
  initial?: AnimatedStyle | false

  /** Target animation state */
  animate?: AnimatedStyle

  /** Exit animation state (used with AnimatePresence) */
  exit?: AnimatedStyle

  /** Animation state while hovered */
  whileHover?: AnimatedStyle

  /** Animation state while pressed/tapped */
  whileTap?: AnimatedStyle

  /** Animation state while focused */
  whileFocus?: AnimatedStyle

  /** Animation state while dragging */
  whileDrag?: AnimatedStyle

  /** Animation state while in viewport */
  whileInView?: AnimatedStyle

  /** Viewport options for whileInView */
  viewport?: ViewportOptions

  /** Style object (static styles + animated values) */
  style?: React.CSSProperties

  /** Callback when animation completes */
  onAnimationComplete?: () => void

  /** Callback when hover starts */
  onHoverStart?: (event: React.MouseEvent) => void

  /** Callback when hover ends */
  onHoverEnd?: (event: React.MouseEvent) => void

  /** Callback when tap/press starts */
  onTapStart?: (event: React.PointerEvent) => void

  /** Callback when tap/press ends */
  onTap?: (event: React.PointerEvent) => void

  /**
   * Callback when a press ends without a tap: the pointer is cancelled, or it is
   * released outside the element (including after leaving the element while
   * pressed). For a release outside the element there is no React event, so the
   * native `PointerEvent` is passed.
   */
  // Method syntax keeps handlers typed `(e: React.PointerEvent) => void` assignable
  onTapCancel?(event: React.PointerEvent | PointerEvent): void

  ref?: React.Ref<HTMLElement>
}

/** Stable defaults (a new `{}` each render would invalidate memoization) */
const EMPTY_STYLE: React.CSSProperties = {}
const EMPTY_CONFIG: SpringConfig = {}

/**
 * Transform shorthand keys, in the order they are applied to the `transform` string
 */
const TRANSFORM_KEYS = [
  'x', 'y', 'z',
  'translateX', 'translateY', 'translateZ',
  'scale', 'scaleX', 'scaleY',
  'rotate', 'rotateX', 'rotateY', 'rotateZ',
  'skewX', 'skewY',
] as const

const TRANSFORM_KEY_SET = new Set<string>(TRANSFORM_KEYS)

/**
 * Resting values for keys that aren't specified by `animate` or `style`
 */
const DEFAULT_VALUES: Record<string, number> = {
  opacity: 1,
  scale: 1,
  scaleX: 1,
  scaleY: 1,
}

function getNumber(source: object | false | null | undefined, key: string): number | undefined {
  if (!source) return undefined
  const value = (source as Record<string, unknown>)[key]
  return typeof value === 'number' ? value : undefined
}

function pickKeys(values: Record<string, number>, keys: string[]): Record<string, number> {
  const result: Record<string, number> = {}
  for (const key of keys) {
    const value = values[key]
    if (value !== undefined) result[key] = value
  }
  return result
}

function shallowEqualValues(a: Record<string, number> | null, b: Record<string, number>): boolean {
  if (!a) return false
  const aKeys = Object.keys(a)
  if (aKeys.length !== Object.keys(b).length) return false
  return aKeys.every((key) => a[key] === b[key])
}

function isIdentityTransform(key: string, value: number | string): boolean {
  if (typeof value === 'string') return false
  return key.startsWith('scale') ? value === 1 : value === 0
}

function formatTransform(key: string, value: number | string): string {
  const fn = key === 'x' ? 'translateX' : key === 'y' ? 'translateY' : key === 'z' ? 'translateZ' : key
  if (typeof value === 'string') return `${fn}(${value})`
  const unit = key.startsWith('scale') ? '' : key.startsWith('rotate') || key.startsWith('skew') ? 'deg' : 'px'
  return `${fn}(${value}${unit})`
}

/**
 * Convert animated values to a style object, combining transform shorthands
 * (x, y, scale, rotate, ...) into a single `transform` string that is prepended
 * to any static `style.transform`
 */
function buildStyle(
  values: Record<string, number | string>,
  staticTransform: unknown
): React.CSSProperties {
  const style: Record<string, number | string> = {}
  const transforms: string[] = []
  let hasNonIdentity = false

  for (const key of TRANSFORM_KEYS) {
    const value = values[key]
    if (value === undefined) continue
    transforms.push(formatTransform(key, value))
    if (!isIdentityTransform(key, value)) hasNonIdentity = true
  }

  for (const key in values) {
    if (!TRANSFORM_KEY_SET.has(key)) {
      style[key] = values[key] as number | string
    }
  }

  if (hasNonIdentity) {
    style.transform = typeof staticTransform === 'string' && staticTransform
      ? `${transforms.join(' ')} ${staticTransform}`
      : transforms.join(' ')
  }

  return style as React.CSSProperties
}

/**
 * Extract non-numeric (string) values from a style object
 */
function extractStringValues(style: AnimatedStyle): Record<string, string> {
  const result: Record<string, string> = {}
  for (const key in style) {
    if (typeof style[key] === 'string') {
      result[key] = style[key] as string
    }
  }
  return result
}

/**
 * Public props of `Animated.<tag>`: the element's own props (minus the native
 * HTML5 drag-and-drop handlers, replaced by the drag gesture callbacks) plus
 * the animation props
 */
type AnimatedComponentProps<T extends React.ElementType> =
  Omit<React.ComponentPropsWithoutRef<T>, DragHandlerName> & AnimatedElementProps

/**
 * Create an animated component for a given tag
 */
function createAnimatedComponent<T extends React.ElementType>(
  tag: T
): React.MemoExoticComponent<
  React.ForwardRefExoticComponent<AnimatedComponentProps<T> & React.RefAttributes<HTMLElement>>
> {
  const AnimatedComponent = React.forwardRef<HTMLElement, React.ComponentPropsWithoutRef<T> & AnimatedElementProps>(
    (
      {
        children,
        style = EMPTY_STYLE,
        config = EMPTY_CONFIG,
        initial,
        animate,
        exit,
        whileHover,
        whileTap,
        whileFocus,
        whileDrag,
        whileInView,
        viewport,
        onAnimationComplete,
        onHoverStart,
        onHoverEnd,
        onTapStart,
        onTap,
        onTapCancel,
        drag,
        dragControls,
        dragListener = true,
        dragConstraints,
        dragElastic,
        dragMomentum,
        dragTransition,
        dragSnapToOrigin,
        dragDirectionLock,
        onDirectionLock,
        onDragStart,
        onDrag,
        onDragEnd,
        onMouseEnter: propsOnMouseEnter,
        onMouseLeave: propsOnMouseLeave,
        onPointerEnter: propsOnPointerEnter,
        onPointerDown: propsOnPointerDown,
        onPointerUp: propsOnPointerUp,
        onPointerCancel: propsOnPointerCancel,
        onFocus: propsOnFocus,
        onBlur: propsOnBlur,
        ...props
      },
      forwardedRef
    ) => {
      const springRef = useRef<ReturnType<typeof createSpringGroup> | null>(null)
      const unsubscribeRef = useRef<(() => void) | null>(null)
      const elementRef = useRef<HTMLElement | null>(null)
      const hasCalledSafeToRemove = useRef(false)
      const isDestroyedRef = useRef(false)
      const hasMountedRef = useRef(false)
      // Last target sent to the spring (set() restarts the spring with zero
      // velocity, so it must only be called when the target actually changes)
      const lastTargetRef = useRef<Record<string, number> | null>(null)
      // Latest animated values (to continue from when the spring is re-created)
      const latestValuesRef = useRef<Record<string, number>>({})

      // Gesture states
      const [isHovered, setIsHovered] = useState(false)
      const [isPressed, setIsPressed] = useState(false)
      const [isFocused, setIsFocused] = useState(false)
      const [isInViewport, setIsInViewport] = useState(false)
      const hasTriggeredInView = useRef(false)

      // Press tracking independent of whileTap (so onTap/onTapCancel work on their own)
      const isPressedRef = useRef(false)
      const removeGlobalPressListenersRef = useRef<(() => void) | null>(null)
      // Last pointer type seen, used to ignore emulated mouse events on touch devices
      const lastPointerTypeRef = useRef<string | null>(null)
      // Latest onTapCancel, for the global (release outside) listener
      const onTapCancelRef = useRef(onTapCancel)
      onTapCancelRef.current = onTapCancel

      // Drag gesture: offset applied on top of the animated transform
      const { dragOffset, isDragging, startDrag } = useAnimatedDrag(
        {
          drag,
          dragControls,
          dragListener,
          dragConstraints,
          dragElastic,
          dragMomentum,
          dragTransition,
          dragSnapToOrigin,
          dragDirectionLock,
          onDirectionLock,
          onDragStart,
          onDrag,
          onDragEnd,
        },
        elementRef
      )

      // Get presence context for exit animations
      const presenceContext = useContext(PresenceContext)
      const isPresent = presenceContext?.isPresent ?? true
      const safeToRemove = presenceContext?.safeToRemove

      // Inherit MotionConfig (default spring config, reduced motion, initial)
      const motionConfig = useContext(MotionContext)
      const reducedMotion = motionConfig.isReducedMotion
      const springConfig: SpringConfig = { ...motionConfig.config, ...config }
      const skipInitial =
        initial === false ||
        presenceContext?.initial === false ||
        motionConfig.initial === false

      // Combine refs
      const setRef = useCallback((node: HTMLElement | null) => {
        elementRef.current = node
        if (typeof forwardedRef === 'function') {
          forwardedRef(node)
        } else if (forwardedRef) {
          (forwardedRef as React.MutableRefObject<HTMLElement | null>).current = node
        }
      }, [forwardedRef])

      // IntersectionObserver for whileInView
      useEffect(() => {
        if (!whileInView || !isBrowser) return

        // Capture element at effect creation time
        const element = elementRef.current
        if (!element) return

        const threshold = viewport?.amount === 'all' ? 1 :
                         viewport?.amount === 'some' ? 0 :
                         typeof viewport?.amount === 'number' ? viewport.amount : 0.5

        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                if (viewport?.once && hasTriggeredInView.current) return
                setIsInViewport(true)
                hasTriggeredInView.current = true
              } else if (!viewport?.once) {
                setIsInViewport(false)
              }
            })
          },
          {
            rootMargin: viewport?.margin ?? '0px',
            threshold,
          }
        )

        observer.observe(element)
        return () => {
          // Only unobserve if element still exists (may be null after unmount)
          if (element) {
            observer.unobserve(element)
          }
          observer.disconnect()
        }
      }, [whileInView, viewport?.once, viewport?.margin, viewport?.amount])

      // Every numeric key that can be animated, from all animation sources.
      // Keys only present in e.g. whileHover must still be part of the spring group.
      const numericKeySet = new Set<string>()
      for (const source of [
        initial === false ? undefined : initial,
        animate,
        exit,
        whileHover,
        whileTap,
        whileFocus,
        whileDrag,
        whileInView,
        style,
      ]) {
        if (!source) continue
        for (const key in source) {
          if (typeof (source as Record<string, unknown>)[key] === 'number') numericKeySet.add(key)
        }
      }
      const numericKeys = Array.from(numericKeySet).sort()
      const numericKeysSignature = numericKeys.join('|')

      // Resting value of a key when no active state specifies it
      const getBaseValue = (key: string): number =>
        getNumber(animate, key) ?? getNumber(style, key) ?? DEFAULT_VALUES[key] ?? 0

      // Determine the target style based on presence and gesture states
      const getTargetStyle = (): AnimatedStyle => {
        // If exiting and we have exit styles
        if (!isPresent && exit) {
          return exit
        }

        // Start with base animate styles
        let target: AnimatedStyle = animate ? { ...animate } : {}

        // Layer gesture states (order matters - later ones override)
        if (whileInView && isInViewport) {
          target = { ...target, ...whileInView }
        }

        if (whileFocus && isFocused) {
          target = { ...target, ...whileFocus }
        }

        if (whileHover && isHovered) {
          target = { ...target, ...whileHover }
        }

        if (whileDrag && isDragging) {
          target = { ...target, ...whileDrag }
        }

        if (whileTap && isPressed) {
          target = { ...target, ...whileTap }
        }

        return target
      }

      // Numeric target for every animatable key (unspecified keys return to their base value)
      const getNumericTarget = (): Record<string, number> => {
        const target = getTargetStyle()
        const result: Record<string, number> = {}
        for (const key of numericKeys) {
          result[key] = getNumber(target, key) ?? getBaseValue(key)
        }
        return result
      }

      // Values to start from on mount
      const getInitialValues = (): Record<string, number> => {
        const target = getNumericTarget()
        if (skipInitial || reducedMotion || !initial) return target
        const result = { ...target }
        for (const key of numericKeys) {
          const value = getNumber(initial, key)
          if (value !== undefined) result[key] = value
        }
        return result
      }

      // Seed rendered values synchronously so the first paint (and SSR output)
      // uses the initial values instead of flashing unstyled content
      const [animatedStyle, setAnimatedStyle] = useState<Record<string, number>>(getInitialValues)

      // Latest render's computations, for use inside effects
      const getNumericTargetRef = useRef(getNumericTarget)
      getNumericTargetRef.current = getNumericTarget
      const getInitialValuesRef = useRef(getInitialValues)
      getInitialValuesRef.current = getInitialValues
      const reducedMotionRef = useRef(reducedMotion)
      reducedMotionRef.current = reducedMotion

      // Initialize spring (re-created when the config or the set of animated keys changes)
      useEffect(() => {
        const target = getNumericTargetRef.current()
        const keys = Object.keys(target)

        // Only create spring if there are numeric values to animate
        if (keys.length === 0) {
          return
        }

        // Start from the initial values on mount, otherwise continue from the
        // current values (config change, new keys, StrictMode effect re-run)
        const startValues: Record<string, number> = hasMountedRef.current
          ? { ...target, ...pickKeys(latestValuesRef.current, keys) }
          : getInitialValuesRef.current()
        hasMountedRef.current = true

        isDestroyedRef.current = false
        const spring = createSpringGroup(startValues, springConfig)

        // Subscribe with destroyed check
        unsubscribeRef.current = spring.subscribe((values) => {
          latestValuesRef.current = values
          if (!isDestroyedRef.current) {
            setAnimatedStyle(values)
          }
        })

        springRef.current = spring
        lastTargetRef.current = target

        let rafId: number | null = null
        const needsAnimation = keys.some((key) => startValues[key] !== target[key])
        if (needsAnimation) {
          if (reducedMotionRef.current) {
            spring.jump(target)
          } else {
            // Use requestAnimationFrame to ensure spring is ready
            rafId = safeRequestAnimationFrame(() => {
              rafId = null
              if (!isDestroyedRef.current) {
                spring.set(target)
              }
            })
          }
        }

        return () => {
          isDestroyedRef.current = true
          if (rafId !== null) safeCancelAnimationFrame(rafId)
          if (unsubscribeRef.current) {
            unsubscribeRef.current()
            unsubscribeRef.current = null
          }
          spring.destroy()
          springRef.current = null
        }
      }, [springConfig.stiffness, springConfig.damping, springConfig.mass, numericKeysSignature]) // eslint-disable-line react-hooks/exhaustive-deps

      // Handle animation updates after mount. Only send a new target to the spring
      // when it actually changed (see lastTargetRef).
      useEffect(() => {
        const spring = springRef.current
        if (!spring) return

        const target = getNumericTarget()
        if (shallowEqualValues(lastTargetRef.current, target)) return
        lastTargetRef.current = target

        if (reducedMotion) {
          spring.jump(target)
        } else {
          spring.set(target)
        }
      })

      // Handle exit animation completion
      useEffect(() => {
        if (isPresent || !safeToRemove || hasCalledSafeToRemove.current) return

        const complete = () => {
          if (hasCalledSafeToRemove.current) return
          hasCalledSafeToRemove.current = true
          safeToRemove()
          onAnimationComplete?.()
        }

        // Nothing to animate out: allow removal right away
        if (!exit) {
          complete()
          return
        }

        let cancelled = false
        let timeout: ReturnType<typeof setTimeout> | null = null

        // Poll until the exit spring has settled
        const checkComplete = () => {
          if (cancelled) return
          const spring = springRef.current
          if (!spring || spring.isDestroyed() || !spring.isAnimating()) {
            complete()
            return
          }
          timeout = setTimeout(checkComplete, 50)
        }

        timeout = setTimeout(checkComplete, 50)

        return () => {
          cancelled = true
          if (timeout !== null) clearTimeout(timeout)
        }
      }, [isPresent, exit, safeToRemove, onAnimationComplete])

      // Reset flag when becoming present again
      useEffect(() => {
        if (isPresent) {
          hasCalledSafeToRemove.current = false
        }
      }, [isPresent])

      // End an active press (pointer released or cancelled). A press that left
      // the element is no longer pressed but stays pending until released.
      const endPress = useCallback(() => {
        isPressedRef.current = false
        setIsPressed(false)
        removeGlobalPressListenersRef.current?.()
        removeGlobalPressListenersRef.current = null
      }, [])

      // Remove global press listeners on unmount
      useEffect(() => {
        return () => {
          removeGlobalPressListenersRef.current?.()
          removeGlobalPressListenersRef.current = null
        }
      }, [])

      // Gesture event handlers
      const handlePointerEnter = useCallback((e: React.PointerEvent) => {
        lastPointerTypeRef.current = e.pointerType || null
        propsOnPointerEnter?.(e as React.PointerEvent<HTMLElement>)
      }, [propsOnPointerEnter])

      // Touch devices fire emulated mouse events after a tap; ignoring them keeps
      // the hover state from getting stuck on
      const handleMouseEnter = useCallback((e: React.MouseEvent) => {
        if (lastPointerTypeRef.current !== 'touch') {
          if (whileHover) setIsHovered(true)
          onHoverStart?.(e)
        }
        propsOnMouseEnter?.(e as React.MouseEvent<HTMLElement>)
      }, [whileHover, onHoverStart, propsOnMouseEnter])

      const handleMouseLeave = useCallback((e: React.MouseEvent) => {
        if (lastPointerTypeRef.current !== 'touch') {
          if (whileHover) setIsHovered(false)
          // Leaving the element cancels an active press (onTapCancel fires on release)
          if (isPressedRef.current) {
            isPressedRef.current = false
            setIsPressed(false)
          }
          onHoverEnd?.(e)
        }
        propsOnMouseLeave?.(e as React.MouseEvent<HTMLElement>)
      }, [whileHover, onHoverEnd, propsOnMouseLeave])

      const handlePointerDown = useCallback((e: React.PointerEvent) => {
        if (e.pointerType) lastPointerTypeRef.current = e.pointerType
        isPressedRef.current = true
        if (whileTap) setIsPressed(true)

        // Releasing outside the element cancels the tap. A release on the element
        // ends the press (removing these listeners) before the event reaches window.
        if (isBrowser && !removeGlobalPressListenersRef.current) {
          const handleGlobalPointerUp = (event: PointerEvent) => {
            if (!removeGlobalPressListenersRef.current) return
            endPress()
            onTapCancelRef.current?.(event)
          }
          window.addEventListener('pointerup', handleGlobalPointerUp)
          window.addEventListener('pointercancel', handleGlobalPointerUp)
          removeGlobalPressListenersRef.current = () => {
            window.removeEventListener('pointerup', handleGlobalPointerUp)
            window.removeEventListener('pointercancel', handleGlobalPointerUp)
          }
        }

        onTapStart?.(e)
        propsOnPointerDown?.(e as React.PointerEvent<HTMLElement>)
      }, [whileTap, onTapStart, propsOnPointerDown, endPress])

      const handlePointerUp = useCallback((e: React.PointerEvent) => {
        // A press cancelled by leaving the element is left to the global
        // listener, which reports it through onTapCancel
        if (isPressedRef.current) {
          endPress()
          onTap?.(e)
        }
        propsOnPointerUp?.(e as React.PointerEvent<HTMLElement>)
      }, [onTap, propsOnPointerUp, endPress])

      const handlePointerCancel = useCallback((e: React.PointerEvent) => {
        if (isPressedRef.current || removeGlobalPressListenersRef.current) {
          endPress()
          onTapCancel?.(e)
        }
        propsOnPointerCancel?.(e as React.PointerEvent<HTMLElement>)
      }, [onTapCancel, propsOnPointerCancel, endPress])

      const handleFocus = useCallback((e: React.FocusEvent) => {
        if (whileFocus) setIsFocused(true)
        propsOnFocus?.(e as React.FocusEvent<HTMLElement>)
      }, [whileFocus, propsOnFocus])

      const handleBlur = useCallback((e: React.FocusEvent) => {
        if (whileFocus) setIsFocused(false)
        propsOnBlur?.(e as React.FocusEvent<HTMLElement>)
      }, [whileFocus, propsOnBlur])

      // Combine static and animated styles
      const staticStyle = Object.fromEntries(
        Object.entries(style).filter(([_, v]) => typeof v !== 'number')
      ) as React.CSSProperties

      // Get string values from active gesture states (applied immediately, not animated)
      const gestureStringStyles: Record<string, string> = {}

      // Layer gesture string styles in order (later ones override)
      if (whileInView && isInViewport) {
        Object.assign(gestureStringStyles, extractStringValues(whileInView))
      }
      if (whileFocus && isFocused) {
        Object.assign(gestureStringStyles, extractStringValues(whileFocus))
      }
      if (whileHover && isHovered) {
        Object.assign(gestureStringStyles, extractStringValues(whileHover))
      }
      if (whileDrag && isDragging) {
        Object.assign(gestureStringStyles, extractStringValues(whileDrag))
      }
      if (whileTap && isPressed) {
        Object.assign(gestureStringStyles, extractStringValues(whileTap))
      }

      // User event handlers we destructured are always passed through; gesture
      // handlers below wrap (and call) them when gestures are in use
      const eventHandlers: Record<string, unknown> = {
        onMouseEnter: propsOnMouseEnter,
        onMouseLeave: propsOnMouseLeave,
        onPointerEnter: propsOnPointerEnter,
        onPointerDown: propsOnPointerDown,
        onPointerUp: propsOnPointerUp,
        onPointerCancel: propsOnPointerCancel,
        onFocus: propsOnFocus,
        onBlur: propsOnBlur,
      }

      if (whileHover || onHoverStart || onHoverEnd) {
        eventHandlers.onPointerEnter = handlePointerEnter
        eventHandlers.onMouseEnter = handleMouseEnter
        eventHandlers.onMouseLeave = handleMouseLeave
      }

      if (whileTap || onTapStart || onTap || onTapCancel) {
        eventHandlers.onPointerDown = handlePointerDown
        eventHandlers.onPointerUp = handlePointerUp
        eventHandlers.onPointerCancel = handlePointerCancel
      }

      const isDragListener = Boolean(drag) && dragListener
      if (isDragListener) {
        const onPointerDown = eventHandlers.onPointerDown as ((e: React.PointerEvent) => void) | undefined
        eventHandlers.onPointerDown = (e: React.PointerEvent) => {
          // Primary button only (touch and pen report button 0 too)
          if (!e.button) startDrag(e.nativeEvent)
          onPointerDown?.(e)
        }
      }

      if (whileFocus) {
        eventHandlers.onFocus = handleFocus
        eventHandlers.onBlur = handleBlur
      }

      const elementStyle: React.CSSProperties = {
        // Keep touch input from scrolling the page instead of dragging
        ...(isDragListener
          ? { touchAction: drag === 'x' ? 'pan-y' : drag === 'y' ? 'pan-x' : 'none' }
          : undefined),
        ...staticStyle,
        ...buildStyle({ ...animatedStyle, ...gestureStringStyles }, staticStyle.transform),
      }
      if (dragOffset.x !== 0 || dragOffset.y !== 0) {
        // Outermost, so the element follows the pointer 1:1 even when scaled/rotated
        const rest = elementStyle.transform && elementStyle.transform !== 'none'
          ? ` ${elementStyle.transform}`
          : ''
        elementStyle.transform = `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0px)${rest}`
      }

      return React.createElement(
        tag,
        {
          ...props,
          ...eventHandlers,
          ref: setRef,
          style: elementStyle,
        },
        children
      )
    }
  )

  AnimatedComponent.displayName = `Animated.${String(tag)}`
  const MemoizedComponent = memo(AnimatedComponent)
  MemoizedComponent.displayName = `Animated.${String(tag)}`
  // The implementation is typed with the full element props (an Omit over the
  // generic tag's props can't be destructured); the public type drops the
  // native onDrag* handlers whose names the drag gesture callbacks reuse
  return MemoizedComponent as unknown as React.MemoExoticComponent<
    React.ForwardRefExoticComponent<AnimatedComponentProps<T> & React.RefAttributes<HTMLElement>>
  >
}

/**
 * Animated components with spring physics
 *
 * @example Basic animation
 * ```tsx
 * <Animated.div
 *   style={{
 *     opacity: isVisible ? 1 : 0,
 *     transform: `translateX(${isOpen ? 100 : 0}px)`,
 *   }}
 *   config={{ stiffness: 120, damping: 14 }}
 * >
 *   Content automatically animates
 * </Animated.div>
 * ```
 *
 * @example With AnimatePresence
 * ```tsx
 * <AnimatePresence>
 *   {isVisible && (
 *     <Animated.div
 *       key="modal"
 *       initial={{ opacity: 0, scale: 0.9 }}
 *       animate={{ opacity: 1, scale: 1 }}
 *       exit={{ opacity: 0, scale: 0.9 }}
 *     >
 *       Modal content
 *     </Animated.div>
 *   )}
 * </AnimatePresence>
 * ```
 */
export const Animated = {
  div: createAnimatedComponent('div'),
  span: createAnimatedComponent('span'),
  button: createAnimatedComponent('button'),
  a: createAnimatedComponent('a'),
  p: createAnimatedComponent('p'),
  h1: createAnimatedComponent('h1'),
  h2: createAnimatedComponent('h2'),
  h3: createAnimatedComponent('h3'),
  h4: createAnimatedComponent('h4'),
  h5: createAnimatedComponent('h5'),
  h6: createAnimatedComponent('h6'),
  ul: createAnimatedComponent('ul'),
  ol: createAnimatedComponent('ol'),
  li: createAnimatedComponent('li'),
  section: createAnimatedComponent('section'),
  article: createAnimatedComponent('article'),
  header: createAnimatedComponent('header'),
  footer: createAnimatedComponent('footer'),
  nav: createAnimatedComponent('nav'),
  main: createAnimatedComponent('main'),
  aside: createAnimatedComponent('aside'),
  img: createAnimatedComponent('img'),
  svg: createAnimatedComponent('svg'),
  path: createAnimatedComponent('path'),
  circle: createAnimatedComponent('circle'),
  rect: createAnimatedComponent('rect'),
  g: createAnimatedComponent('g'),
}
