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
  type Variants,
  type AnimationValues,
  type VariantTransition,
} from '@oxog/springkit'
import { useSpring } from './useSpring.js'
import { useIsomorphicLayoutEffect } from '../utils/ssr.js'

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

  // Calculate delay from stagger (ms). staggerChildren/delayChildren are
  // orchestration settings of the PARENT's transition; fall back to this
  // element's own transition for backward compatibility.
  const staggerDelay = useMemo(() => {
    const parentTransition = parentContext.transition
    const staggerChildren = parentTransition?.staggerChildren ?? transition.staggerChildren
    const delayChildren = parentTransition?.delayChildren ?? transition.delayChildren
    const staggerDirection = parentTransition?.staggerDirection ?? transition.staggerDirection
    const index = parentContext.staggerIndex
    if (index !== undefined && staggerChildren) {
      const count = parentContext.staggerCount
      const position =
        staggerDirection === -1 && count !== undefined ? count - 1 - index : index
      return position * staggerChildren + (delayChildren || 0)
    }
    return transition.delay || 0
  }, [parentContext.staggerIndex, parentContext.staggerCount, parentContext.transition, transition])

  // Helper to convert string/number values to numbers for spring
  const toNumber = (val: string | number | undefined, fallback: number): number => {
    if (val === undefined) return fallback
    if (typeof val === 'number') return val
    // Parse numeric strings (e.g., "100px" -> 100, "50%" -> 50)
    const parsed = parseFloat(val)
    return isNaN(parsed) ? fallback : parsed
  }

  // Helper to compute spring values from variant values
  const computeSpringValues = useCallback((values: AnimationValues, fallbackValues?: AnimationValues) => ({
    x: toNumber(values.x ?? fallbackValues?.x, 0),
    y: toNumber(values.y ?? fallbackValues?.y, 0),
    scale: values.scale ?? fallbackValues?.scale ?? 1,
    scaleX: values.scaleX ?? fallbackValues?.scaleX ?? 1,
    scaleY: values.scaleY ?? fallbackValues?.scaleY ?? 1,
    rotate: values.rotate ?? fallbackValues?.rotate ?? 0,
    opacity: values.opacity ?? fallbackValues?.opacity ?? 1,
  }), [])

  // Compute spring-compatible values for initial state
  const initialSpringValues = useMemo(() =>
    computeSpringValues(initialValues),
    [initialValues, computeSpringValues]
  )

  // Compute spring-compatible values from target values
  // This is what we pass to useSpring for animation
  const animatedTargetValues = useMemo(() =>
    computeSpringValues(targetValues, initialValues),
    [targetValues, initialValues, computeSpringValues]
  )

  // Use a ref to track if we've done the initial setup
  const hasInitializedRef = useRef(false)

  // With a (stagger) delay the spring keeps its previous target until the
  // delay has elapsed. null = nothing released yet (still at the initial values)
  const [releasedTarget, setReleasedTarget] = useState<typeof animatedTargetValues | null>(null)
  const latestTargetRef = useRef(animatedTargetValues)
  latestTargetRef.current = animatedTargetValues
  const hasDelay = staggerDelay > 0
  const { x: tx, y: ty, scale: ts, scaleX: tsx, scaleY: tsy, rotate: tr, opacity: to } = animatedTargetValues

  useEffect(() => {
    if (!hasDelay) return
    const timer = setTimeout(() => {
      setReleasedTarget(latestTargetRef.current)
    }, staggerDelay)
    return () => clearTimeout(timer)
    // Keyed on the target's contents (not identity) so inline `variants`
    // objects don't keep postponing the start
  }, [hasDelay, staggerDelay, tx, ty, ts, tsx, tsy, tr, to])

  // Spring values for animation
  // On first render, use initial values to prevent unwanted animation
  // After that, use target values (released after the delay, if any)
  const springTarget = hasDelay
    ? (releasedTarget ?? initialSpringValues)
    : hasInitializedRef.current ? animatedTargetValues : initialSpringValues
  const springValues = useSpring(
    springTarget,
    {
      stiffness: springConfig?.stiffness ?? transition.spring?.stiffness ?? 100,
      damping: springConfig?.damping ?? transition.spring?.damping ?? 15,
      mass: springConfig?.mass ?? transition.spring?.mass ?? 1,
    }
  )

  // After first render, mark as initialized and trigger animation to target
  useIsomorphicLayoutEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true
    }
  }, [])

  // Track variant changes and detect animation completion
  useIsomorphicLayoutEffect(() => {
    if (targetVariant && targetVariant !== currentVariantRef.current) {
      currentVariantRef.current = targetVariant
      isAnimatingRef.current = true

      // Use ref to capture onAnimationComplete for cleanup safety
      const capturedVariant = targetVariant
      const capturedCallback = onAnimationComplete

      // Calculate a reasonable timeout based on spring physics
      // Time constant for a damped spring system: 2 * mass / damping
      // For settling to ~2% of initial amplitude, use ~4 time constants
      const damping = springConfig?.damping ?? 15
      const mass = springConfig?.mass ?? 1
      // Estimated settle time: ~4 time constants = 4 * (2 * mass / damping)
      const estimatedDuration = Math.max(200, Math.min(2000, (8 * mass / damping) * 1000))
      const totalDelay = staggerDelay + estimatedDuration

      const timer = setTimeout(() => {
        isAnimatingRef.current = false
        capturedCallback?.(capturedVariant)
      }, totalDelay)

      return () => clearTimeout(timer)
    }
  }, [targetVariant, staggerDelay, onAnimationComplete, springConfig?.stiffness, springConfig?.damping, springConfig?.mass])

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
