import React, { createContext, useContext, useMemo } from 'react'
import type { SpringConfig } from '../../../types.js'

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
  /** How to handle reduced motion preference */
  reducedMotion?: ReducedMotionMode
  /** Whether to skip initial animations */
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
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
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
  config = {},
  reducedMotion = 'user',
  initial = true,
  children,
}: MotionConfigProps): React.ReactElement {
  const parentContext = useContext(MotionContext)

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
        isReducedMotion = checkReducedMotion()
    }

    // Merge with parent config
    return {
      config: { ...parentContext.config, ...config },
      reducedMotion,
      initial,
      isReducedMotion,
    }
  }, [config, reducedMotion, initial, parentContext.config])

  return (
    <MotionContext.Provider value={value}>
      {children}
    </MotionContext.Provider>
  )
}
