/**
 * React hooks for Variants System
 */
import { useRef, useCallback, useEffect, useMemo, useState, createContext, useContext, type ReactNode } from 'react'
import * as React from 'react'
import {
  getVariant,
  calculateStaggerDelays,
  buildTransformString,
  isTransformProperty,
  solveSpring,
  delay,
  type Variants,
  type AnimationValues,
  type VariantTransition,
} from '@oxog/springkit'
import { useIsomorphicLayoutEffect } from '../utils/ssr.js'
import { useAnimatableValues } from '../utils/useAnimatableValues.js'
import { animatableSignature, type AnimatableValue } from '../utils/animatable.js'

// ============ Animatable values ============

/** Spring used when neither the hook nor the variant's transition sets one */
const DEFAULT_PHYSICS = { stiffness: 100, damping: 15, mass: 1 }

/** Resting values of the shorthands always present in `values` */
const DEFAULT_VALUES: Record<string, number> = {
  x: 0,
  y: 0,
  scale: 1,
  scaleX: 1,
  scaleY: 1,
  rotate: 0,
  opacity: 1,
}

/**
 * Settle time (ms) of a spring from rest over a unit distance, from the exact
 * solution (0.1% of the distance), capped at 10s
 */
function settleTime(spring: { stiffness?: number; damping?: number; mass?: number }): number {
  const duration = solveSpring(
    {
      stiffness: spring.stiffness ?? DEFAULT_PHYSICS.stiffness,
      damping: spring.damping ?? DEFAULT_PHYSICS.damping,
      mass: spring.mass ?? DEFAULT_PHYSICS.mass,
    },
    0,
    1
  ).duration
  return Math.min(duration, 10_000)
}

/** `'12px'` → `12` (x/y were always numbers in pixels) */
const PX_REGEX = /^\s*(-?(?:\d+\.?\d*|\.\d+))px\s*$/

/**
 * The animatable entries of variant values (numbers and strings, minus
 * `transition`), over `fallback` and the shorthand defaults
 */
function toAnimatable(
  values: AnimationValues,
  fallback?: AnimationValues
): Record<string, AnimatableValue> {
  const result: Record<string, AnimatableValue> = { ...DEFAULT_VALUES }
  for (const source of [fallback, values]) {
    if (!source) continue
    for (const key in source) {
      const value = source[key]
      if (key === 'transition' || (typeof value !== 'number' && typeof value !== 'string')) continue
      const px = (key === 'x' || key === 'y') && typeof value === 'string' ? PX_REGEX.exec(value) : null
      result[key] = px ? parseFloat(px[1]!) : value
    }
  }
  return result
}

// ============ Context ============

interface VariantContextValue {
  /** Current variant name */
  variant: string | undefined
  /** Custom data passed to variant functions */
  custom?: unknown
  /** Inherited transition settings */
  transition?: VariantTransition
  /** Stagger index for children */
  staggerIndex?: number
  /** Total stagger count */
  staggerCount?: number
}

const VariantContext = createContext<VariantContextValue>({
  variant: undefined,
})

// ============ useVariantContext ============

/**
 * Get the current variant context
 */
export function useVariantContext(): VariantContextValue {
  return useContext(VariantContext)
}

// ============ useVariants ============

export interface UseVariantsOptions {
  /** Named animation states */
  variants?: Variants
  /** Current animation state */
  animate?: string | AnimationValues
  /** Initial animation state */
  initial?: string | AnimationValues | false
  /** Custom data for variant functions */
  custom?: unknown
  /** Inherit variant from parent */
  inherit?: boolean
  /** Spring configuration override */
  spring?: { stiffness?: number; damping?: number; mass?: number }
  /** Callback when animation completes */
  onAnimationComplete?: (variant: string) => void
}

export interface UseVariantsReturn {
  /** Current animation values */
  values: AnimationValues
  /** Trigger a specific variant */
  setVariant: (name: string) => void
  /** Current variant name */
  currentVariant: string | undefined
  /** Whether animation is in progress */
  isAnimating: boolean
}

/**
 * Use variants for declarative animation states
 *
 * Every number and string of a variant animates: colors, numbers with units
 * (`'50%'`, `'20rem'`) and complex strings (box shadows, filters), recomposed
 * in `values` (an animation that settled returns the variant's exact string).
 * `x` / `y` in pixels (`'12px'`) are returned as numbers. Values whose shape
 * differs between variants (`'50%'` → `'200px'`, `'auto'`) and keys without a
 * previous value jump.
 *
 * @example
 * ```tsx
 * const variants = {
 *   hidden: { opacity: 0, y: 20 },
 *   visible: {
 *     opacity: 1,
 *     y: 0,
 *     transition: { staggerChildren: 100 } // ms
 *   },
 * }
 *
 * function MyComponent() {
 *   const { values, setVariant } = useVariants({
 *     variants,
 *     initial: 'hidden',
 *     animate: 'visible',
 *   })
 *
 *   return (
 *     <div style={{
 *       opacity: values.opacity,
 *       transform: `translateY(${values.y}px)`,
 *     }}>
 *       Content
 *     </div>
 *   )
 * }
 * ```
 */
export function useVariants(options: UseVariantsOptions): UseVariantsReturn {
  const {
    variants,
    animate,
    initial,
    custom,
    inherit = true,
    spring: springConfig,
    onAnimationComplete,
  } = options

  const parentContext = useVariantContext()
  const currentVariantRef = useRef<string | undefined>(undefined)
  const isAnimatingRef = useRef<boolean>(false)

  // Variant requested imperatively via setVariant(). It applies until the
  // `animate` option changes (the prop then takes over again).
  const [variantOverride, setVariantOverride] = useState<{
    name: string
    animate: UseVariantsOptions['animate']
  } | null>(null)
  const animateRef = useRef(animate)
  animateRef.current = animate
  const overrideName =
    variantOverride && variantOverride.animate === animate ? variantOverride.name : undefined

  // Determine the target variant
  const targetVariant = useMemo(() => {
    if (overrideName !== undefined) {
      return overrideName
    }
    // If animate is a string, use it
    if (typeof animate === 'string') {
      return animate
    }
    // If inherit and parent has a variant, use that
    if (inherit && parentContext.variant) {
      return parentContext.variant
    }
    return undefined
  }, [overrideName, animate, inherit, parentContext.variant])

  // Resolve initial values
  const initialValues = useMemo(() => {
    if (initial === false) {
      // Skip initial animation
      return getVariant(variants, targetVariant, custom).values
    }
    if (typeof initial === 'string') {
      return getVariant(variants, initial, custom).values
    }
    if (typeof initial === 'object') {
      return initial
    }
    return {}
  }, [initial, variants, targetVariant, custom])

  // Resolve target values
  const targetValues = useMemo(() => {
    if (typeof animate === 'object' && overrideName === undefined) {
      return animate
    }
    if (targetVariant && variants) {
      return getVariant(variants, targetVariant, custom).values
    }
    return initialValues
  }, [animate, overrideName, targetVariant, variants, custom, initialValues])

  // Get transition settings
  const transition = useMemo(() => {
    if (targetVariant && variants) {
      return getVariant(variants, targetVariant, custom).transition
    }
    return parentContext.transition || {}
  }, [targetVariant, variants, custom, parentContext.transition])

  // Spring physics of this element (shared by the animation and the settle timer)
  const stiffness = springConfig?.stiffness ?? transition.spring?.stiffness ?? DEFAULT_PHYSICS.stiffness
  const damping = springConfig?.damping ?? transition.spring?.damping ?? DEFAULT_PHYSICS.damping
  const mass = springConfig?.mass ?? transition.spring?.mass ?? DEFAULT_PHYSICS.mass

  // Calculate delay from stagger (ms). staggerChildren/delayChildren are
  // orchestration settings of the PARENT's transition; fall back to this
  // element's own transition for backward compatibility.
  const parentTransition = parentContext.transition
  const staggerDelay = useMemo(() => {
    const staggerChildren = parentTransition?.staggerChildren ?? transition.staggerChildren
    const delayChildren = parentTransition?.delayChildren ?? transition.delayChildren
    const staggerDirection = parentTransition?.staggerDirection ?? transition.staggerDirection
    const index = parentContext.staggerIndex
    // `when: 'beforeChildren'`: children start once the parent's animation
    // (its delay + the settle time of its spring) is done
    const parentFirst = parentTransition?.when === 'beforeChildren' && parentContext.variant !== undefined
      ? (parentTransition.delay ?? 0) + settleTime(parentTransition.spring ?? DEFAULT_PHYSICS)
      : 0
    if (index !== undefined && staggerChildren) {
      const count = parentContext.staggerCount
      const position =
        staggerDirection === -1 && count !== undefined ? count - 1 - index : index
      return parentFirst + position * staggerChildren + (delayChildren || 0)
    }
    return parentFirst + (transition.delay || 0)
  }, [parentContext.staggerIndex, parentContext.staggerCount, parentContext.variant, parentTransition, transition])

  // Values to animate: every number/string of the variant (colors, '50%',
  // box shadows... animate too), falling back to the initial values, then
  // to the defaults of the transform/opacity shorthands
  const initialAnimatable = useMemo(() => toAnimatable(initialValues), [initialValues])
  const targetAnimatable = useMemo(
    () => toAnimatable(targetValues, initialValues),
    [targetValues, initialValues]
  )

  // With a (stagger) delay the spring keeps its previous target until the
  // delay has elapsed. null = nothing released yet (still at the initial values)
  const [releasedTarget, setReleasedTarget] = useState<Record<string, AnimatableValue> | null>(null)
  const latestTargetRef = useRef(targetAnimatable)
  latestTargetRef.current = targetAnimatable
  const hasDelay = staggerDelay > 0
  const targetSignature = animatableSignature(targetAnimatable)

  useEffect(() => {
    if (!hasDelay) return
    // Animation time: follows the time scale and the test clock
    return delay(staggerDelay, () => {
      setReleasedTarget(latestTargetRef.current)
    })
    // Keyed on the target's contents (not identity) so inline `variants`
    // objects don't keep postponing the start
  }, [hasDelay, staggerDelay, targetSignature])

  // The first render shows the initial values; the target is released after
  // mount (or after the delay, if any)
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])
  const springTarget = hasDelay
    ? (releasedTarget ?? initialAnimatable)
    : isMounted ? targetAnimatable : initialAnimatable
  const springValues = useAnimatableValues(springTarget, { stiffness, damping, mass })

  // Track variant changes and detect animation completion. The callback is
  // read from a ref: an inline `onAnimationComplete` changes every render, and
  // the animation re-renders every frame, so depending on it would cancel the
  // completion timer before it could fire.
  const onAnimationCompleteRef = useRef(onAnimationComplete)
  onAnimationCompleteRef.current = onAnimationComplete
  const completedVariantRef = useRef<string | undefined>(undefined)

  useIsomorphicLayoutEffect(() => {
    if (!targetVariant) return
    if (targetVariant !== currentVariantRef.current) {
      currentVariantRef.current = targetVariant
      completedVariantRef.current = undefined
    }
    if (completedVariantRef.current === targetVariant) return
    isAnimatingRef.current = true

    // Settle time of the spring actually used, from the exact solution, at
    // 0.1% of the travelled distance
    const settleDuration = settleTime({ stiffness, damping, mass })
    const variant = targetVariant
    // Animation time: follows the time scale and the test clock
    return delay(staggerDelay + settleDuration, () => {
      isAnimatingRef.current = false
      completedVariantRef.current = variant
      onAnimationCompleteRef.current?.(variant)
    })
  }, [targetVariant, staggerDelay, stiffness, damping, mass])

  const setVariant = useCallback((name: string) => {
    setVariantOverride({ name, animate: animateRef.current })
  }, [])

  return {
    values: {
      ...targetValues,
      ...springValues,
    },
    setVariant,
    currentVariant: currentVariantRef.current,
    isAnimating: isAnimatingRef.current,
  }
}

// ============ VariantProvider ============

export interface VariantProviderProps {
  children: ReactNode
  /** Current variant for all children */
  variant?: string
  /** Custom data for variant functions */
  custom?: unknown
  /** Transition settings for children */
  transition?: VariantTransition
}

/**
 * Provide variant context to children.
 *
 * `transition` holds the orchestration of the children: `staggerChildren`,
 * `delayChildren`, `staggerDirection` and `when`. With
 * `when: 'beforeChildren'` the children start once the parent's animation is
 * done: after `transition.delay` plus the settle time of `transition.spring`
 * (the default spring when omitted), so pass the parent's own transition.
 * `when: 'afterChildren'` is not supported (treated like `false`): a parent
 * can't see its children's animations through context.
 *
 * Each direct child receives its position (`staggerIndex`) and the number of
 * children (`staggerCount`), so `transition.staggerChildren` /
 * `staggerDirection` stagger a list of `useVariants` children:
 *
 * @example
 * ```tsx
 * <VariantProvider variant="visible" transition={{ staggerChildren: 80 }}>
 *   {items.map((item) => <Item key={item.id} {...item} />)}
 * </VariantProvider>
 * ```
 */
export function VariantProvider({
  children,
  variant,
  custom,
  transition,
}: VariantProviderProps): React.ReactElement {
  const items = React.Children.toArray(children)
  const count = items.length

  return React.createElement(
    React.Fragment,
    null,
    items.map((child, index) =>
      React.createElement(
        VariantContext.Provider,
        {
          key: React.isValidElement(child) && child.key !== null ? child.key : index,
          value: { variant, custom, transition, staggerIndex: index, staggerCount: count },
        },
        child
      )
    )
  )
}

// ============ useStaggerChildren ============

export interface UseStaggerChildrenOptions {
  /** Number of children to stagger */
  count: number
  /** Stagger delay between children (ms) */
  staggerChildren?: number
  /** Initial delay before first child (ms) */
  delayChildren?: number
  /** Direction of stagger */
  staggerDirection?: 1 | -1
}

export interface UseStaggerChildrenReturn {
  /** Get delay for a specific child index */
  getDelay: (index: number) => number
  /** Get props to pass to a child */
  getChildProps: (index: number) => { style: { transitionDelay: string } }
  /** All delays */
  delays: number[]
}

/**
 * Calculate stagger delays for children
 */
export function useStaggerChildren(options: UseStaggerChildrenOptions): UseStaggerChildrenReturn {
  const {
    count,
    staggerChildren = 100,
    delayChildren = 0,
    staggerDirection = 1,
  } = options

  const delays = useMemo(() => {
    return calculateStaggerDelays(count, {
      staggerChildren,
      delayChildren,
      staggerDirection,
    })
  }, [count, staggerChildren, delayChildren, staggerDirection])

  const getDelay = useCallback(
    (index: number) => delays[index] || 0,
    [delays]
  )

  const getChildProps = useCallback(
    (index: number) => ({
      style: { transitionDelay: `${getDelay(index)}ms` },
    }),
    [getDelay]
  )

  return { getDelay, getChildProps, delays }
}

// ============ Motion Component Helper ============

export interface CreateMotionComponentOptions {
  /** Default variants */
  variants?: Variants
  /** Default spring config */
  spring?: { stiffness?: number; damping?: number; mass?: number }
}

/** Props added by {@link createMotionComponent} */
export type MotionComponentProps = Omit<UseVariantsOptions, 'variants' | 'spring'> & {
  /** Variants (defaults to the ones passed to createMotionComponent) */
  variants?: Variants
  /** Spring config (defaults to the one passed to createMotionComponent) */
  spring?: UseVariantsOptions['spring']
}

/**
 * Turn `values` from {@link useVariants} into inline styles: transform
 * shorthands (x, y, scale, rotate...) become one `transform`, everything else
 * (opacity, colors...) is applied as-is.
 */
function variantValuesToStyle(
  values: AnimationValues,
  baseTransform: unknown
): React.CSSProperties {
  const style: Record<string, string | number> = {}
  const transformValues: AnimationValues = {}
  for (const [key, value] of Object.entries(values)) {
    if (key === 'transition' || (typeof value !== 'number' && typeof value !== 'string')) continue
    if (isTransformProperty(key)) {
      ;(transformValues as Record<string, unknown>)[key] = value
    } else {
      style[key] = value
    }
  }
  const transform = buildTransformString(transformValues)
  const base = typeof baseTransform === 'string' && baseTransform !== 'none' ? baseTransform : ''
  if (transform || base) style.transform = [base, transform].filter(Boolean).join(' ')
  return style as React.CSSProperties
}

/**
 * Create a variant-driven component for an HTML/SVG element.
 *
 * The component accepts the element's own props plus `variants`, `initial`,
 * `animate`, `custom`, `inherit`, `spring` and `onAnimationComplete`, and
 * inherits the variant from a parent {@link VariantProvider}.
 *
 * @example
 * ```tsx
 * const MotionLi = createMotionComponent('li', {
 *   variants: {
 *     hidden: { opacity: 0, y: 12 },
 *     visible: { opacity: 1, y: 0 },
 *   },
 * })
 *
 * <VariantProvider variant="visible" transition={{ staggerChildren: 60 }}>
 *   {items.map((item) => <MotionLi key={item.id} initial="hidden">{item.label}</MotionLi>)}
 * </VariantProvider>
 * ```
 */
export function createMotionComponent<T extends keyof React.JSX.IntrinsicElements>(
  element: T,
  options: CreateMotionComponentOptions = {}
) {
  type ElementProps = React.ComponentPropsWithoutRef<T>
  type Props = Omit<ElementProps, keyof MotionComponentProps> & MotionComponentProps

  const Component = React.forwardRef<Element, Props>(function MotionComponent(props, ref) {
    const {
      variants = options.variants,
      spring = options.spring,
      animate,
      initial,
      custom,
      inherit,
      onAnimationComplete,
      ...rest
    } = props as MotionComponentProps & { style?: React.CSSProperties } & Record<string, unknown>
    const { style, ...elementProps } = rest as { style?: React.CSSProperties } & Record<string, unknown>

    const { values } = useVariants({
      variants,
      spring,
      animate,
      initial,
      custom,
      inherit,
      onAnimationComplete,
    })

    return React.createElement(element, {
      ...elementProps,
      ref,
      style: { ...style, ...variantValuesToStyle(values, style?.transform) },
    })
  })
  Component.displayName = `Motion(${String(element)})`
  return Component
}

// ============ Export Context ============

export { VariantContext }
