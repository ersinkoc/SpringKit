import * as React from 'react'
import { createContext, useContext, useState, useEffect, useMemo } from 'react'

// ============ Feature Definitions ============

/**
 * Feature flags provided by LazyMotion. They are only read through
 * `useMotionFeature()` / `MotionFeatureGuard`: `Animated` ignores them.
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
   * Exposed to descendants as `useLazyMotion().isStrict`; it enforces nothing
   * by itself (no-op, kept for API compatibility)
   */
  strict?: boolean

  /**
   * Children to render
   */
  children: React.ReactNode
}

/**
 * LazyMotion - provide a set of motion feature flags to a subtree
 *
 * `features` is a set of flags (or an async loader returning one).
 * Descendants read them with `useMotionFeature()` / `useLazyMotion()`, and
 * `MotionFeatureGuard` renders its children only when a feature is available.
 * Children always render; while an async loader is pending, `isLoaded` is
 * false and every feature reports as unavailable.
 *
 * LazyMotion does not change what `Animated` components do and doesn't split
 * any code by itself: what a flag gates (and lazy-loads) is up to your
 * components.
 *
 * @example Gate an optional effect
 * ```tsx
 * import { LazyMotion, MotionFeatureGuard, domAnimation } from '@oxog/springkit/react'
 *
 * function App() {
 *   return (
 *     <LazyMotion features={domAnimation}>
 *       <MotionFeatureGuard feature="gestures" fallback={<StaticCard />}>
 *         <TiltCard>...</TiltCard>
 *       </MotionFeatureGuard>
 *     </LazyMotion>
 *   )
 * }
 * ```
 *
 * @example Async feature loading
 * ```tsx
 * // Define the loader outside the component (a new function each render
 * // would load again)
 * const loadFeatures = () => import('./features').then((mod) => mod.domMax)
 *
 * function App() {
 *   return (
 *     <LazyMotion features={loadFeatures}>
 *       <Page />
 *     </LazyMotion>
 *   )
 * }
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
    if (typeof features !== 'function') {
      setLoadedFeatures(features)
      setIsLoaded(true)
      return
    }

    // Ignore results of a loader that was superseded or unmounted, so a slow
    // earlier loader can't overwrite the features of a newer one
    let cancelled = false
    features().then(
      (loaded) => {
        if (cancelled) return
        setLoadedFeatures(loaded)
        setIsLoaded(true)
      },
      (error: unknown) => {
        if (cancelled) return
        console.error('[SpringKit] LazyMotion: failed to load features', error)
        // Render children without optional features instead of nothing forever
        setLoadedFeatures({})
        setIsLoaded(true)
      }
    )
    return () => {
      cancelled = true
    }
  }, [features])

  const contextValue = useMemo<LazyMotionContextValue>(() => ({
    features: loadedFeatures ?? {},
    isStrict: strict,
    isLoaded,
  }), [loadedFeatures, strict, isLoaded])

  // Children always render, also while async features load: the content must be
  // part of the server-rendered HTML (SSR) and of the first client render.
  // Until loading completes `isLoaded` is false, so `useMotionFeature` reports
  // every feature as unavailable and `MotionFeatureGuard` shows its fallback.
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
