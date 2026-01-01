import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'

// ============ Feature Definitions ============

/**
 * Available feature sets for LazyMotion
 */
export interface MotionFeatures {
  /** Basic animation features (animate, initial, exit) */
  animations: boolean
  /** Gesture features (whileHover, whileTap, drag) */
  gestures: boolean
  /** Layout animation features (layout, layoutId) */
  layout: boolean
  /** SVG animation features (path morphing, pathLength) */
  svg: boolean
  /** Scroll-linked animation features */
  scroll: boolean
}

export type FeatureBundle = Partial<MotionFeatures>

/**
 * Pre-defined feature bundles
 */
export const domAnimation: FeatureBundle = {
  animations: true,
  gestures: true,
}

export const domMax: FeatureBundle = {
  animations: true,
  gestures: true,
  layout: true,
  svg: true,
  scroll: true,
}

export const domMin: FeatureBundle = {
  animations: true,
}

// ============ Context ============

interface LazyMotionContextValue {
  features: FeatureBundle
  isStrict: boolean
  isLoaded: boolean
}

const LazyMotionContext = createContext<LazyMotionContextValue>({
  features: domMax,
  isStrict: false,
  isLoaded: true,
})

/**
 * Hook to access lazy motion features
 */
export function useLazyMotion(): LazyMotionContextValue {
  return useContext(LazyMotionContext)
}

/**
 * Hook to check if a specific feature is available
 */
export function useMotionFeature(feature: keyof MotionFeatures): boolean {
  const { features, isLoaded } = useLazyMotion()
  return isLoaded && (features[feature] ?? false)
}

// ============ LazyMotion Component ============

export interface LazyMotionProps {
  /**
   * Feature bundle to load
   *
   * Can be:
   * - An object with feature flags
   * - A function that returns a promise (for async loading)
   * - A pre-defined bundle (domAnimation, domMax, domMin)
   */
  features: FeatureBundle | (() => Promise<FeatureBundle>)

  /**
   * Whether to enforce that child motion components use the `m` component
   * instead of `motion` for smaller bundle size.
   *
   * When true, using `motion.div` inside LazyMotion will throw an error.
   */
  strict?: boolean

  /**
   * Children to render
   */
  children: React.ReactNode
}

/**
 * LazyMotion - Optimize bundle size by lazy-loading motion features
 *
 * Wrap your app or a section of your app with LazyMotion to control
 * which animation features are loaded. This can significantly reduce
 * bundle size for simple use cases.
 *
 * @example Basic usage with domAnimation
 * ```tsx
 * import { LazyMotion, domAnimation, m } from '@oxog/springkit/react'
 *
 * function App() {
 *   return (
 *     <LazyMotion features={domAnimation}>
 *       <m.div animate={{ opacity: 1 }} />
 *     </LazyMotion>
 *   )
 * }
 * ```
 *
 * @example Async feature loading
 * ```tsx
 * import { LazyMotion, m } from '@oxog/springkit/react'
 *
 * const loadFeatures = () =>
 *   import('./features').then((mod) => mod.domMax)
 *
 * function App() {
 *   return (
 *     <LazyMotion features={loadFeatures}>
 *       <m.div animate={{ opacity: 1 }} />
 *     </LazyMotion>
 *   )
 * }
 * ```
 *
 * @example Strict mode (enforces m component usage)
 * ```tsx
 * <LazyMotion features={domAnimation} strict>
 *   <m.div /> {/* OK *\/}
 *   <motion.div /> {/* Error in dev! *\/}
 * </LazyMotion>
 * ```
 *
 * @example Custom feature set
 * ```tsx
 * <LazyMotion features={{
 *   animations: true,
 *   gestures: true,
 *   layout: false, // Skip layout animations to save bundle size
 * }}>
 *   <m.div whileHover={{ scale: 1.1 }} />
 * </LazyMotion>
 * ```
 */
export function LazyMotion({
  features,
  strict = false,
  children,
}: LazyMotionProps): React.ReactElement {
  const [loadedFeatures, setLoadedFeatures] = useState<FeatureBundle | null>(
    typeof features === 'function' ? null : features
  )
  const [isLoaded, setIsLoaded] = useState(typeof features !== 'function')

  // Load async features
  useEffect(() => {
    if (typeof features === 'function') {
      features().then((loaded) => {
        setLoadedFeatures(loaded)
        setIsLoaded(true)
      })
    } else {
      setLoadedFeatures(features)
      setIsLoaded(true)
    }
  }, [features])

  const contextValue = useMemo<LazyMotionContextValue>(() => ({
    features: loadedFeatures ?? {},
    isStrict: strict,
    isLoaded,
  }), [loadedFeatures, strict, isLoaded])

  // Show nothing or a fallback while loading
  if (!isLoaded) {
    return React.createElement(React.Fragment, null, null)
  }

  return React.createElement(
    LazyMotionContext.Provider,
    { value: contextValue },
    children
  )
}

// ============ MotionFeatureGuard ============

interface MotionFeatureGuardProps {
  feature: keyof MotionFeatures
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Conditionally render content based on feature availability
 *
 * @example
 * ```tsx
 * <LazyMotion features={domAnimation}>
 *   <MotionFeatureGuard feature="layout" fallback={<StaticLayout />}>
 *     <AnimatedLayout />
 *   </MotionFeatureGuard>
 * </LazyMotion>
 * ```
 */
export function MotionFeatureGuard({
  feature,
  children,
  fallback = null,
}: MotionFeatureGuardProps): React.ReactElement {
  const isAvailable = useMotionFeature(feature)

  return React.createElement(
    React.Fragment,
    null,
    isAvailable ? children : fallback
  )
}

// ============ Feature Loading Utilities ============

/**
 * Create an async feature loader
 *
 * @example
 * ```tsx
 * const loadFeatures = createAsyncFeatures({
 *   animations: true,
 *   gestures: true,
 *   layout: () => import('./layout-features'),
 * })
 *
 * <LazyMotion features={loadFeatures}>
 *   ...
 * </LazyMotion>
 * ```
 */
export function createAsyncFeatures(
  config: {
    [K in keyof MotionFeatures]?: boolean | (() => Promise<unknown>)
  }
): () => Promise<FeatureBundle> {
  return async () => {
    const result: FeatureBundle = {}

    await Promise.all(
      Object.entries(config).map(async ([key, value]) => {
        const featureKey = key as keyof MotionFeatures
        if (typeof value === 'function') {
          await value()
          result[featureKey] = true
        } else {
          result[featureKey] = value
        }
      })
    )

    return result
  }
}

/**
 * Merge multiple feature bundles
 */
export function mergeFeatures(...bundles: FeatureBundle[]): FeatureBundle {
  return bundles.reduce((acc, bundle) => ({
    ...acc,
    ...bundle,
  }), {})
}
