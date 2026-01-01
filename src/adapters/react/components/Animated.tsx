import React, { useEffect, useRef, useState, useContext, useCallback, memo } from 'react'
import { createSpringGroup } from '../../../index.js'
import type { SpringConfig } from '../../../types.js'
import { PresenceContext } from '../context/PresenceContext.js'
import { isBrowser } from '../utils/ssr.js'

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
export interface AnimatedElementProps extends Omit<React.HTMLAttributes<HTMLElement>, 'style'> {
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

  /** Callback when tap is cancelled */
  onTapCancel?: (event: React.PointerEvent) => void

  ref?: React.Ref<HTMLElement>
}

/**
 * Extract numeric values from a style object
 */
function extractNumericValues(style: AnimatedStyle): Record<string, number> {
  const result: Record<string, number> = {}
  for (const key in style) {
    if (typeof style[key] === 'number') {
      result[key] = style[key] as number
    }
  }
  return result
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
 * Create an animated component for a given tag
 */
function createAnimatedComponent<T extends React.ElementType>(
  tag: T
) {
  const AnimatedComponent = React.forwardRef<HTMLElement, React.ComponentPropsWithoutRef<T> & AnimatedElementProps>(
    (
      {
        children,
        style = {},
        config = {},
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
        onMouseEnter: propsOnMouseEnter,
        onMouseLeave: propsOnMouseLeave,
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
      const [animatedStyle, setAnimatedStyle] = useState<React.CSSProperties>({})
      const isFirstRender = useRef(true)
      const hasCalledSafeToRemove = useRef(false)
      const isDestroyedRef = useRef(false)

      // Gesture states
      const [isHovered, setIsHovered] = useState(false)
      const [isPressed, setIsPressed] = useState(false)
      const [isFocused, setIsFocused] = useState(false)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [isDragging, _setIsDragging] = useState(false)
      const [isInViewport, setIsInViewport] = useState(false)
      const hasTriggeredInView = useRef(false)

      // Get presence context for exit animations
      const presenceContext = useContext(PresenceContext)
      const isPresent = presenceContext?.isPresent ?? true
      const safeToRemove = presenceContext?.safeToRemove

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
          observer.unobserve(element)
          observer.disconnect()
        }
      }, [whileInView, viewport?.once, viewport?.margin, viewport?.amount])

      // Determine the target style based on presence and gesture states
      const getTargetStyle = useCallback((): AnimatedStyle => {
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

        // If no target styles, fallback to numeric values from style prop
        if (Object.keys(target).length === 0) {
          return Object.fromEntries(
            Object.entries(style).filter((entry): entry is [string, number] => typeof entry[1] === 'number')
          ) as AnimatedStyle
        }

        return target
      }, [isPresent, exit, animate, style, whileHover, whileTap, whileFocus, whileDrag, whileInView, isHovered, isPressed, isFocused, isDragging, isInViewport])

      // Get initial style
      const getInitialStyle = useCallback((): AnimatedStyle => {
        // Skip initial animation
        if (initial === false) {
          return getTargetStyle()
        }

        // Use explicit initial values
        if (initial) {
          return initial
        }

        // Default to target for no animation on mount
        return getTargetStyle()
      }, [initial, getTargetStyle])

      // Initialize spring
      useEffect(() => {
        const initialStyle = getInitialStyle()
        const numericInitial = extractNumericValues(initialStyle)

        // Only create spring if there are numeric values to animate
        if (Object.keys(numericInitial).length === 0) {
          return
        }

        // Cleanup previous subscription if exists
        if (unsubscribeRef.current) {
          unsubscribeRef.current()
          unsubscribeRef.current = null
        }

        // Destroy previous spring if exists
        if (springRef.current) {
          springRef.current.destroy()
          springRef.current = null
        }

        const spring = createSpringGroup(numericInitial, config)

        // Subscribe with destroyed check
        unsubscribeRef.current = spring.subscribe((values) => {
          if (!isDestroyedRef.current) {
            setAnimatedStyle(values as React.CSSProperties)
          }
        })

        springRef.current = spring

        return () => {
          isDestroyedRef.current = true
          if (unsubscribeRef.current) {
            unsubscribeRef.current()
            unsubscribeRef.current = null
          }
          spring.destroy()
        }
      }, [config.stiffness, config.damping, getInitialStyle]) // eslint-disable-line react-hooks/exhaustive-deps

      // Handle animation updates
      useEffect(() => {
        if (!springRef.current) return

        const targetStyle = getTargetStyle()
        const numericTarget = extractNumericValues(targetStyle)

        // Skip animation on first render if initial !== false
        if (isFirstRender.current) {
          isFirstRender.current = false

          // If initial is provided and different from animate, we need to animate
          if (initial && initial !== false && animate) {
            const numericInitial = extractNumericValues(initial)
            const numericAnimate = extractNumericValues(animate)

            // Check if initial and animate are different
            const needsAnimation = Object.keys(numericAnimate).some(
              (key) => numericInitial[key] !== numericAnimate[key]
            )

            if (needsAnimation) {
              springRef.current.set(numericAnimate)
            }
          }
          return
        }

        springRef.current.set(numericTarget)
      }, [isPresent, animate, exit, getTargetStyle, initial, isHovered, isPressed, isFocused, isInViewport])

      // Handle exit animation completion
      useEffect(() => {
        if (!isPresent && exit && safeToRemove && !hasCalledSafeToRemove.current) {
          let innerTimeout: ReturnType<typeof setTimeout> | null = null
          let cancelled = false

          const checkComplete = () => {
            if (cancelled) return

            // Simple velocity check - in a real implementation,
            // we'd check the spring's isAtRest state
            const values = springRef.current
            if (values) {
              // For now, use a timeout as a fallback
              // The spring group doesn't expose isAtRest easily
              innerTimeout = setTimeout(() => {
                if (!cancelled && !hasCalledSafeToRemove.current) {
                  hasCalledSafeToRemove.current = true
                  safeToRemove()
                  onAnimationComplete?.()
                }
              }, 500) // Reasonable default for spring animations
            }
          }

          // Start checking for completion
          const timeout = setTimeout(checkComplete, 50)

          return () => {
            cancelled = true
            clearTimeout(timeout)
            if (innerTimeout !== null) {
              clearTimeout(innerTimeout)
            }
          }
        }
      }, [isPresent, exit, safeToRemove, onAnimationComplete])

      // Reset flag when becoming present again
      useEffect(() => {
        if (isPresent) {
          hasCalledSafeToRemove.current = false
        }
      }, [isPresent])

      // Gesture event handlers
      const handleMouseEnter = useCallback((e: React.MouseEvent) => {
        if (whileHover) setIsHovered(true)
        onHoverStart?.(e)
        propsOnMouseEnter?.(e as React.MouseEvent<HTMLElement>)
      }, [whileHover, onHoverStart, propsOnMouseEnter])

      const handleMouseLeave = useCallback((e: React.MouseEvent) => {
        if (whileHover) setIsHovered(false)
        if (whileTap) setIsPressed(false)
        onHoverEnd?.(e)
        propsOnMouseLeave?.(e as React.MouseEvent<HTMLElement>)
      }, [whileHover, whileTap, onHoverEnd, propsOnMouseLeave])

      const handlePointerDown = useCallback((e: React.PointerEvent) => {
        if (whileTap) setIsPressed(true)
        onTapStart?.(e)
        propsOnPointerDown?.(e as React.PointerEvent<HTMLElement>)
      }, [whileTap, onTapStart, propsOnPointerDown])

      const handlePointerUp = useCallback((e: React.PointerEvent) => {
        if (whileTap && isPressed) {
          setIsPressed(false)
          onTap?.(e)
        }
        propsOnPointerUp?.(e as React.PointerEvent<HTMLElement>)
      }, [whileTap, isPressed, onTap, propsOnPointerUp])

      const handlePointerCancel = useCallback((e: React.PointerEvent) => {
        if (whileTap && isPressed) {
          setIsPressed(false)
          onTapCancel?.(e)
        }
        propsOnPointerCancel?.(e as React.PointerEvent<HTMLElement>)
      }, [whileTap, isPressed, onTapCancel, propsOnPointerCancel])

      const handleFocus = useCallback((e: React.FocusEvent) => {
        if (whileFocus) setIsFocused(true)
        propsOnFocus?.(e as React.FocusEvent<HTMLElement>)
      }, [whileFocus, propsOnFocus])

      const handleBlur = useCallback((e: React.FocusEvent) => {
        if (whileFocus) setIsFocused(false)
        propsOnBlur?.(e as React.FocusEvent<HTMLElement>)
      }, [whileFocus, propsOnBlur])

      // Global pointer up listener for tap state
      useEffect(() => {
        if (!whileTap || !isPressed) return

        const handleGlobalPointerUp = () => {
          setIsPressed(false)
        }

        window.addEventListener('pointerup', handleGlobalPointerUp)
        window.addEventListener('pointercancel', handleGlobalPointerUp)

        return () => {
          window.removeEventListener('pointerup', handleGlobalPointerUp)
          window.removeEventListener('pointercancel', handleGlobalPointerUp)
        }
      }, [whileTap, isPressed])

      // Combine static and animated styles
      const staticStyle = Object.fromEntries(
        Object.entries(style).filter(([_, v]) => typeof v !== 'number')
      )

      // Get string values from active gesture states (applied immediately, not animated)
      const gestureStringStyles: React.CSSProperties = {}

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

      // Build event handlers
      const eventHandlers: Record<string, React.EventHandler<React.SyntheticEvent>> = {}

      if (whileHover || onHoverStart || onHoverEnd) {
        eventHandlers.onMouseEnter = handleMouseEnter as React.EventHandler<React.SyntheticEvent>
        eventHandlers.onMouseLeave = handleMouseLeave as React.EventHandler<React.SyntheticEvent>
      }

      if (whileTap || onTapStart || onTap || onTapCancel) {
        eventHandlers.onPointerDown = handlePointerDown as React.EventHandler<React.SyntheticEvent>
        eventHandlers.onPointerUp = handlePointerUp as React.EventHandler<React.SyntheticEvent>
        eventHandlers.onPointerCancel = handlePointerCancel as React.EventHandler<React.SyntheticEvent>
      }

      if (whileFocus) {
        eventHandlers.onFocus = handleFocus as React.EventHandler<React.SyntheticEvent>
        eventHandlers.onBlur = handleBlur as React.EventHandler<React.SyntheticEvent>
      }

      return React.createElement(
        tag,
        {
          ...props,
          ...eventHandlers,
          ref: setRef,
          style: { ...staticStyle, ...animatedStyle, ...gestureStringStyles },
        },
        children
      )
    }
  )

  AnimatedComponent.displayName = `Animated.${String(tag)}`
  return memo(AnimatedComponent)
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
