import * as React from 'react'
import { useEffect, useRef, useState, useContext, useCallback, memo } from 'react'
import { createSpringGroup } from '@oxog/springkit'
import type { SpringConfig } from '@oxog/springkit'
import { PresenceContext } from '../context/PresenceContext.js'
import { isBrowser, safeRequestAnimationFrame, safeCancelAnimationFrame } from '../utils/ssr.js'
import {
  animatableSignature,
  channelValuesOf,
  composeAnimatableRecord,
  hasKeys,
  hiddenChannelKey,
  parseAnimatableRecord,
  parseAnimatableValue,
  planTransition,
  type AnimatableValue,
  type ChannelKeysOf,
  type ParsedValue,
} from '../utils/animatable.js'
import { MotionContext } from './MotionConfig.js'
import { useShouldReduceMotion } from '../utils/reducedMotion.js'
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

  /** Called when the exit animation (inside AnimatePresence) has completed */
  onAnimationComplete?: () => void

  /** Callback when hover starts */
  onHoverStart?: (event: React.MouseEvent) => void

  /** Callback when hover ends */
  onHoverEnd?: (event: React.MouseEvent) => void

  /** Callback when tap/press starts */
  onTapStart?: (event: React.PointerEvent) => void

  /**
   * Callback when tap/press ends on the element. On a draggable element, a
   * press that turned into a drag (moved past `dragThreshold`) is not a tap.
   */
  onTap?: (event: React.PointerEvent) => void

  /**
   * Callback when a press ends without a tap: the pointer is cancelled, it is
   * released outside the element (including after leaving the element while
   * pressed), or the press turned into a drag. For a release outside the
   * element there is no React event, so the native `PointerEvent` is passed.
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

/** Value of `key` in an animation source, if it is a number or a string */
function getValue(source: object | false | null | undefined, key: string): AnimatableValue | undefined {
  if (!source) return undefined
  const value = (source as Record<string, unknown>)[key]
  return typeof value === 'number' || typeof value === 'string' ? value : undefined
}

function sameChannels(a: Record<string, number>, b: Record<string, number>): boolean {
  const aKeys = Object.keys(a)
  if (aKeys.length !== Object.keys(b).length) return false
  return aKeys.every((key) => a[key] === b[key])
}

function pickKeys(values: Record<string, number>, keys: string[]): Record<string, number> {
  const result: Record<string, number> = {}
  for (const key of keys) {
    const value = values[key]
    if (value !== undefined) result[key] = value
  }
  return result
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
        dragThreshold,
        onDirectionLock,
        onDragStart,
        onDrag,
        onDragEnd,
        onDragTransitionEnd,
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
      // Set once the first commit's effects have run
      const hasCommittedRef = useRef(false)
      // Last target sent to (or scheduled for) the spring, so it is only
      // re-sent when it actually changes
      const lastTargetRef = useRef<{ signature: string; values: Record<string, ParsedValue> } | null>(null)
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
      const { dragOffset, isDragging, startDrag, getDragCount } = useAnimatedDrag(
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
          dragThreshold,
          onDirectionLock,
          onDragStart,
          onDrag,
          onDragEnd,
          onDragTransitionEnd,
        },
        elementRef
      )
      // Drag count at the last pointerdown: a press that turned into a drag is
      // not a tap
      const pressDragCountRef = useRef(0)

      // Get presence context for exit animations
      const presenceContext = useContext(PresenceContext)
      const isPresent = presenceContext?.isPresent ?? true
      const safeToRemove = presenceContext?.safeToRemove

      // Inherit MotionConfig (default spring config, reduced motion, initial)
      const motionConfig = useContext(MotionContext)
      // Reduced motion: MotionConfig 'always' / 'never', or the OS setting for
      // 'user' (the default, also without any MotionConfig)
      const reducedMotion = useShouldReduceMotion()
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

        // No IntersectionObserver (old browsers, some WebViews): treat the
        // element as visible rather than crashing
        if (typeof IntersectionObserver === 'undefined') {
          hasTriggeredInView.current = true
          setIsInViewport(true)
          return
        }

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

      // Every key that can be animated, from all animation sources. Keys only
      // present in e.g. whileHover must still be part of the spring group.
      // Keys with a string value anywhere (colors, '50%', box shadows...) are
      // decomposed into hidden numeric channels (see utils/animatable.ts).
      const animationSources = [
        initial === false ? undefined : initial,
        animate,
        exit,
        whileHover,
        whileTap,
        whileFocus,
        whileDrag,
        whileInView,
      ]
      const numericKeySet = new Set<string>()
      const stringKeySet = new Set<string>()
      for (const source of animationSources) {
        if (!source) continue
        for (const key in source) {
          const value = (source as Record<string, unknown>)[key]
          if (typeof value === 'number') numericKeySet.add(key)
          else if (typeof value === 'string') stringKeySet.add(key)
        }
      }
      // Numeric inline styles animate when they change; string inline styles
      // stay static unless an animation source animates that key
      for (const key in style) {
        if (typeof (style as Record<string, unknown>)[key] === 'number') numericKeySet.add(key)
      }
      for (const key of stringKeySet) numericKeySet.delete(key)
      const numericKeys = Array.from(numericKeySet).sort()
      const stringKeys = Array.from(stringKeySet).sort()

      // Spring-group layout: a numeric key is its own channel; a string key
      // has hidden channels, enough for the largest value it takes
      const channelKeysOf: ChannelKeysOf = (key, value) => {
        if (!stringKeySet.has(key)) return [key]
        const keys: string[] = []
        for (let i = 0; i < value.template.size; i++) keys.push(hiddenChannelKey(key, i))
        return keys
      }

      // Resting value of a transform key written as a string with a unit when
      // nothing specifies it: the identity in that unit ('0%' for x: '50%')
      const getTransformIdentity = (key: string): string | undefined => {
        if (!TRANSFORM_KEY_SET.has(key)) return undefined
        for (const source of animationSources) {
          const value = getValue(source, key)
          if (typeof value !== 'string') continue
          const { template } = parseAnimatableValue(value)
          if (template.kinds.length === 1 && template.kinds[0] === 'n') {
            return `${template.parts[0]}${key.startsWith('scale') ? 1 : 0}${template.parts[1]}`
          }
        }
        return undefined
      }

      // Resting value of a key when no active state specifies it. A string key
      // without one isn't rendered (and starts at its target when it appears).
      const getBaseValue = (key: string): AnimatableValue | undefined => {
        if (stringKeySet.has(key)) {
          return getValue(animate, key) ?? getValue(style, key) ?? getTransformIdentity(key)
        }
        const value = getValue(animate, key) ?? getValue(style, key)
        return typeof value === 'number' ? value : (DEFAULT_VALUES[key] ?? 0)
      }

      const channelKeys: string[] = [...numericKeys]
      for (const key of stringKeys) {
        let size = 0
        for (const source of [...animationSources, style]) {
          const value = getValue(source, key)
          if (value !== undefined) size = Math.max(size, parseAnimatableValue(value).template.size)
        }
        for (let i = 0; i < size; i++) channelKeys.push(hiddenChannelKey(key, i))
      }
      channelKeys.sort()
      const channelKeysSignature = channelKeys.join('|')

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

      // Target of every animatable key (unspecified keys return to their base value)
      const getTargetValues = (): Record<string, AnimatableValue> => {
        const target = getTargetStyle()
        const result: Record<string, AnimatableValue> = {}
        for (const key of numericKeys) {
          const value = getValue(target, key)
          result[key] = typeof value === 'number' ? value : (getBaseValue(key) as number)
        }
        for (const key of stringKeys) {
          const value = getValue(target, key) ?? getBaseValue(key)
          if (value !== undefined) result[key] = value
        }
        return result
      }

      // Values to start from on mount
      const getInitialValues = (): Record<string, AnimatableValue> => {
        const target = getTargetValues()
        if (skipInitial || reducedMotion || !initial) return target
        const result = { ...target }
        for (const key of [...numericKeys, ...stringKeys]) {
          const value = getValue(initial, key)
          if (value !== undefined) result[key] = value
        }
        return result
      }

      // Rendered state: the values the channels currently represent (the
      // last target given to the spring) and the channel values. Seeded
      // synchronously so the first paint (and SSR output) uses the initial
      // values instead of flashing unstyled content.
      const [animatedState, setAnimatedState] = useState<{
        values: Record<string, ParsedValue>
        channels: Record<string, number>
      }>(() => {
        const values = parseAnimatableRecord(getInitialValues())
        return { values, channels: channelValuesOf(values, channelKeysOf) }
      })
      // What the spring channels currently represent (updated with the spring)
      const appliedRef = useRef(animatedState.values)

      // Latest render's computations, for use inside effects
      const getTargetValuesRef = useRef(getTargetValues)
      getTargetValuesRef.current = getTargetValues
      const channelKeysOfRef = useRef(channelKeysOf)
      channelKeysOfRef.current = channelKeysOf
      const channelKeysRef = useRef(channelKeys)
      channelKeysRef.current = channelKeys
      const reducedMotionRef = useRef(reducedMotion)
      reducedMotionRef.current = reducedMotion

      // Render a state (skipping identical ones, e.g. the spring's notification
      // of a jump that was already rendered)
      const shownRef = useRef(animatedState)
      const showState = useCallback(
        (values: Record<string, ParsedValue>, channels: Record<string, number>) => {
          const shown = shownRef.current
          if (shown.values === values && sameChannels(shown.channels, channels)) return
          const state = { values, channels }
          shownRef.current = state
          setAnimatedState(state)
        },
        []
      )

      // Send a target to the spring: values whose template is unchanged
      // animate, the others (new keys, mismatched units...) jump
      const applyTarget = useCallback(
        (targetValues: Record<string, AnimatableValue>, instant: boolean) => {
          const spring = springRef.current
          const next = parseAnimatableRecord(targetValues)
          const plan = planTransition(appliedRef.current, next, channelKeysOfRef.current, instant)
          appliedRef.current = next
          lastTargetRef.current = { signature: animatableSignature(targetValues), values: next }
          if (spring) {
            if (hasKeys(plan.jump)) spring.jump(plan.jump)
            if (hasKeys(plan.set)) spring.set(plan.set)
          }
          // What the channels mean changed (or they jumped): re-render now
          // instead of on the spring's next notification
          if (plan.structural || hasKeys(plan.jump)) {
            showState(next, spring ? spring.get() : {})
          }
        },
        [showState]
      )

      // Initialize spring (re-created when the config or the set of channels changes)
      useEffect(() => {
        const keys = channelKeysRef.current

        // Only create spring if there are numeric channels to animate
        if (keys.length === 0) {
          return
        }

        // Start from the initial values on mount, otherwise continue from the
        // current values (config change, new keys, StrictMode effect re-run)
        const startValues: Record<string, number> = {}
        for (const key of keys) startValues[key] = 0
        Object.assign(
          startValues,
          pickKeys(channelValuesOf(appliedRef.current, channelKeysOfRef.current), keys)
        )
        if (hasMountedRef.current) Object.assign(startValues, pickKeys(latestValuesRef.current, keys))
        hasMountedRef.current = true
        // Re-created after the first commit (config change, new channels,
        // StrictMode re-run): continue right away instead of on the next frame
        const isMount = !hasCommittedRef.current

        isDestroyedRef.current = false
        const spring = createSpringGroup(startValues, springConfig)

        // Subscribe with destroyed check
        unsubscribeRef.current = spring.subscribe((values) => {
          latestValuesRef.current = values
          if (!isDestroyedRef.current) {
            showState(appliedRef.current, values)
          }
        })

        springRef.current = spring

        const targetValues = getTargetValuesRef.current()
        const signature = animatableSignature(targetValues)
        const targetChannels = channelValuesOf(
          parseAnimatableRecord(targetValues),
          channelKeysOfRef.current
        )
        const appliedValues: Record<string, AnimatableValue> = {}
        for (const key in appliedRef.current) appliedValues[key] = appliedRef.current[key]!.raw
        const needsAnimation =
          animatableSignature(appliedValues) !== signature ||
          Object.keys(targetChannels).some((key) => startValues[key] !== targetChannels[key])
        // Scheduled: later renders don't re-send the same target
        lastTargetRef.current = { signature, values: parseAnimatableRecord(targetValues) }

        let rafId: number | null = null
        if (needsAnimation) {
          if (reducedMotionRef.current || !isMount) {
            applyTarget(targetValues, reducedMotionRef.current)
          } else {
            // Use requestAnimationFrame to ensure spring is ready
            rafId = safeRequestAnimationFrame(() => {
              rafId = null
              if (isDestroyedRef.current) return
              // The reduced-motion preference may have arrived since mount
              // (e.g. right after hydration): don't play the entrance then
              applyTarget(getTargetValuesRef.current(), reducedMotionRef.current)
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
      }, [springConfig.stiffness, springConfig.damping, springConfig.mass, channelKeysSignature]) // eslint-disable-line react-hooks/exhaustive-deps

      // Handle animation updates after mount. Only send a new target to the spring
      // when it actually changed (see lastTargetRef).
      useEffect(() => {
        hasCommittedRef.current = true
        const spring = springRef.current
        const targetValues = getTargetValues()
        // Reduced motion switched on mid-animation: finish it immediately
        if (reducedMotion && spring && spring.isAnimating() && lastTargetRef.current) {
          spring.jump(channelValuesOf(lastTargetRef.current.values, channelKeysOf))
        }
        if (lastTargetRef.current?.signature === animatableSignature(targetValues)) return
        applyTarget(targetValues, reducedMotion)
      })

      // Handle exit animation completion. `exit` and `onAnimationComplete` are
      // usually inline: read them from refs so re-renders (every animation
      // frame) don't restart the wait.
      const onAnimationCompleteRef = useRef(onAnimationComplete)
      onAnimationCompleteRef.current = onAnimationComplete
      const hasExit = Boolean(exit)
      useEffect(() => {
        if (isPresent || !safeToRemove || hasCalledSafeToRemove.current) return

        const complete = () => {
          if (hasCalledSafeToRemove.current) return
          hasCalledSafeToRemove.current = true
          safeToRemove()
          onAnimationCompleteRef.current?.()
        }

        // Nothing to animate out (or no spring): allow removal right away
        const spring = springRef.current
        if (!hasExit || !spring || spring.isDestroyed()) {
          complete()
          return
        }

        // The exit target was sent by the update effect above: complete on the
        // spring's notification of the frame it settles in (subscribe() also
        // reports right away, covering an exit with nothing to animate)
        let unsubscribe: (() => void) | null = null
        unsubscribe = spring.subscribe(() => {
          if (spring.isAnimating()) return
          unsubscribe?.()
          unsubscribe = null
          complete()
        })
        if (hasCalledSafeToRemove.current) {
          unsubscribe?.()
          unsubscribe = null
        }

        return () => {
          unsubscribe?.()
        }
        // The spring is re-created when its config or channels change
      }, [isPresent, hasExit, safeToRemove, springConfig.stiffness, springConfig.damping, springConfig.mass, channelKeysSignature])

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
        pressDragCountRef.current = getDragCount()
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
      }, [whileTap, onTapStart, propsOnPointerDown, endPress, getDragCount])

      const handlePointerUp = useCallback((e: React.PointerEvent) => {
        // A press cancelled by leaving the element is left to the global
        // listener, which reports it through onTapCancel
        if (isPressedRef.current) {
          endPress()
          // A press that turned into a drag (past dragThreshold) is not a tap
          if (getDragCount() !== pressDragCountRef.current) {
            onTapCancel?.(e)
          } else {
            onTap?.(e)
          }
        }
        propsOnPointerUp?.(e as React.PointerEvent<HTMLElement>)
      }, [onTap, onTapCancel, propsOnPointerUp, endPress, getDragCount])

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

      // Recompose the animated values (hidden channels never reach the DOM)
      const animatedValues = composeAnimatableRecord(
        animatedState.values,
        animatedState.channels,
        channelKeysOf
      )

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
        ...buildStyle(animatedValues, staticStyle.transform),
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
 * String values animate too: colors (`'#f00'`, `'rgba(0,0,255,.5)'`,
 * `'transparent'`, CSS names; premultiplied alpha, so fades from
 * `transparent` don't go dark), numbers with units (`'50%'`, `'20rem'`,
 * `'45deg'`) and complex strings whose numbers/colors line up
 * (`boxShadow: '0 4px 12px rgba(0,0,0,.3)'`, `filter: 'blur(4px)'`). They
 * use the same spring as the numbers (gestures, exit, retargeting, reduced
 * motion all apply). A value jumps instead of animating when:
 * - its shape differs from the current one (`'auto'` → `'100px'`,
 *   `'50%'` → `'200px'`, a number → a string, a different shadow count);
 * - the key has no previous value: a string key missing from `initial`,
 *   `animate` and `style` starts at its target (a transform shorthand with a
 *   unit, e.g. `whileHover={{ x: '20%' }}`, starts from `'0%'`).
 * Inline `style` strings are static unless an animation prop animates that
 * key; they then act as its resting value.
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
