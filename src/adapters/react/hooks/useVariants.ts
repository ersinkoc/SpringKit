/**
 * React hooks for Variants System
 */
import { useRef, useCallback, useMemo, useState, createContext, useContext, type ReactNode } from 'react'
import React from 'react'
import {
  getVariant,
  calculateStaggerDelays,
  type Variants,
  type AnimationValues,
  type VariantTransition,
} from '../../../index.js'
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
 *     transition: { staggerChildren: 0.1 }
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

  // Determine the target variant
  const targetVariant = useMemo(() => {
    // If animate is a string, use it
    if (typeof animate === 'string') {
      return animate
    }
    // If inherit and parent has a variant, use that
    if (inherit && parentContext.variant) {
      return parentContext.variant
    }
    return undefined
  }, [animate, inherit, parentContext.variant])

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
    if (typeof animate === 'object') {
      return animate
    }
    if (targetVariant && variants) {
      return getVariant(variants, targetVariant, custom).values
    }
    return initialValues
  }, [animate, targetVariant, variants, custom, initialValues])

  // Get transition settings
  const transition = useMemo(() => {
    if (targetVariant && variants) {
      return getVariant(variants, targetVariant, custom).transition
    }
    return parentContext.transition || {}
  }, [targetVariant, variants, custom, parentContext.transition])

  // Calculate delay from stagger
  const staggerDelay = useMemo(() => {
    if (parentContext.staggerIndex !== undefined && transition.staggerChildren) {
      return (
        (parentContext.staggerIndex * transition.staggerChildren) +
        (transition.delayChildren || 0)
      )
    }
    return transition.delay || 0
  }, [parentContext.staggerIndex, transition])

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

  // Track if initial animation has been triggered
  const hasAnimatedRef = useRef(false)
  // Track the last variant we animated to, to detect actual changes
  const lastAnimatedVariantRef = useRef<string | undefined>(undefined)

  // Store target values that should be animated to after initial render
  // Initialize with initial values so spring starts there
  const [animatedTargetValues, setAnimatedTargetValues] = useState(() =>
    computeSpringValues(initialValues)
  )

  // Spring values for animation
  const springValues = useSpring(
    animatedTargetValues,
    {
      stiffness: springConfig?.stiffness ?? transition.spring?.stiffness ?? 100,
      damping: springConfig?.damping ?? transition.spring?.damping ?? 15,
      mass: springConfig?.mass ?? transition.spring?.mass ?? 1,
    }
  )

  // Trigger initial animation and handle subsequent variant changes
  // Only depend on targetVariant (string) to avoid object reference issues
  useIsomorphicLayoutEffect(() => {
    // On mount, animate from initial to target
    if (!hasAnimatedRef.current) {
      hasAnimatedRef.current = true
      lastAnimatedVariantRef.current = targetVariant
      // Use setTimeout to ensure this runs after the spring is initialized
      const timeoutId = setTimeout(() => {
        setAnimatedTargetValues(computeSpringValues(targetValues, initialValues))
      }, 0)
      return () => clearTimeout(timeoutId)
    }

    // On subsequent renders, only update if the variant actually changed
    if (targetVariant !== lastAnimatedVariantRef.current) {
      lastAnimatedVariantRef.current = targetVariant
      setAnimatedTargetValues(computeSpringValues(targetValues, initialValues))
    }
  }, [targetVariant, computeSpringValues, targetValues, initialValues])

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
    currentVariantRef.current = name
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
 * Provide variant context to children
 */
export function VariantProvider({
  children,
  variant,
  custom,
  transition,
}: VariantProviderProps): React.ReactElement {
  const value = useMemo(
    () => ({ variant, custom, transition }),
    [variant, custom, transition]
  )

  return React.createElement(VariantContext.Provider, { value }, children)
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

/**
 * Create a motion-enabled component
 *
 * @example
 * ```tsx
 * const MotionDiv = createMotionComponent('div', {
 *   variants: {
 *     hidden: { opacity: 0 },
 *     visible: { opacity: 1 },
 *   },
 * })
 *
 * <MotionDiv animate="visible" />
 * ```
 */
export function createMotionComponent<T extends keyof React.JSX.IntrinsicElements>(
  _element: T,
  _options: CreateMotionComponentOptions = {}
) {
  // This is a placeholder - the actual implementation would create
  // a component that uses useVariants internally
  // For now, users should use the Animated component or useVariants directly
  throw new Error(
    'createMotionComponent is not yet implemented. Use useVariants hook or Animated component instead.'
  )
}

// ============ Export Context ============

export { VariantContext }
