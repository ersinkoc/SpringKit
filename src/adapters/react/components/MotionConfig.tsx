import * as React from 'react'
import { createContext, useContext, useMemo, useState, useEffect } from 'react'
import type { SpringConfig } from '@oxog/springkit'
import { useStableSpringConfig } from '../utils/config.js'

const EMPTY_CONFIG: SpringConfig = {}
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Reduced motion preference
 */
export type ReducedMotionMode = 'user' | 'always' | 'never'

/**
 * Motion configuration options
 */
export interface MotionConfigProps {
  /** Default spring configuration for all children */
  config?: SpringConfig
  /** How to handle reduced motion preference (inherits from a parent MotionConfig, default 'user') */
  reducedMotion?: ReducedMotionMode
  /** Whether to skip initial animations (inherits from a parent MotionConfig, default true) */
  initial?: boolean
  /** Children components */
  children: React.ReactNode
}

/**
 * Motion context value
 */
export interface MotionContextValue {
  config: SpringConfig
  reducedMotion: ReducedMotionMode
  initial: boolean
  isReducedMotion: boolean
}

const defaultContext: MotionContextValue = {
  config: {},
  reducedMotion: 'user',
  initial: true,
  isReducedMotion: false,
}

/**
 * Context for sharing motion configuration
 */
export const MotionContext = createContext<MotionContextValue>(defaultContext)

/**
 * Hook to access motion configuration
 */
export function useMotionConfig(): MotionContextValue {
  return useContext(MotionContext)
}

/**
 * Check if user prefers reduced motion
 */
function checkReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.(REDUCED_MOTION_QUERY)?.matches ?? false
}

/**
 * Track the user's reduced motion preference, updating when it changes
 */
function usePrefersReducedMotion(enabled: boolean): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(checkReducedMotion)

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !window.matchMedia) return

    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY)
    if (!mediaQuery) return
    const update = () => setPrefersReducedMotion(mediaQuery.matches)
    update()

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', update)
      return () => mediaQuery.removeEventListener('change', update)
    }
    // Safari < 14
    mediaQuery.addListener?.(update)
    return () => mediaQuery.removeListener?.(update)
  }, [enabled])

  return prefersReducedMotion
}

/**
 * Provides motion configuration to all children.
 * Supports reduced motion preferences and default spring config.
 *
 * @example Default spring config
 * ```tsx
 * <MotionConfig config={{ stiffness: 200, damping: 20 }}>
 *   <Animated.div animate={{ opacity: 1 }}>
 *     Uses parent config
 *   </Animated.div>
 * </MotionConfig>
 * ```
 *
 * @example Reduced motion
 * ```tsx
 * // Respect user's system preference
 * <MotionConfig reducedMotion="user">
 *   <App />
 * </MotionConfig>
 *
 * // Force reduced motion (accessibility)
 * <MotionConfig reducedMotion="always">
 *   <App />
 * </MotionConfig>
 * ```
 *
 * @example Skip initial animations
 * ```tsx
 * <MotionConfig initial={false}>
 *   <Animated.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
 *     No initial animation
 *   </Animated.div>
 * </MotionConfig>
 * ```
 */
export function MotionConfig({
  config: configProp,
  reducedMotion: reducedMotionProp,
  initial: initialProp,
  children,
}: MotionConfigProps): React.ReactElement {
  const parentContext = useContext(MotionContext)

  // Unspecified options inherit from the parent MotionConfig
  const reducedMotion = reducedMotionProp ?? parentContext.reducedMotion
  const initial = initialProp ?? parentContext.initial
  const config = useStableSpringConfig(configProp, EMPTY_CONFIG)
  const prefersReducedMotion = usePrefersReducedMotion(reducedMotion === 'user')

  const value = useMemo<MotionContextValue>(() => {
    // Determine if reduced motion is active
    let isReducedMotion = false
    switch (reducedMotion) {
      case 'always':
        isReducedMotion = true
        break
      case 'never':
        isReducedMotion = false
        break
      case 'user':
      default:
        isReducedMotion = prefersReducedMotion
    }

    // Merge with parent config
    return {
      config: { ...parentContext.config, ...config },
      reducedMotion,
      initial,
      isReducedMotion,
    }
  }, [config, reducedMotion, initial, parentContext.config, prefersReducedMotion])

  return (
    <MotionContext.Provider value={value}>
      {children}
    </MotionContext.Provider>
  )
}
