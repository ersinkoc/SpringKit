import * as React from 'react'
import { createContext, useContext, useMemo, useSyncExternalStore } from 'react'
import type { SpringConfig } from '@oxog/springkit'
import { useStableSpringConfig } from '../utils/config.js'
import {
  subscribeToReducedMotion,
  getReducedMotionPreference,
  getServerReducedMotion,
} from '../hooks/useReducedMotion.js'

function noop(): void {}

function subscribeNoop(): () => void {
  return noop
}

const EMPTY_CONFIG: SpringConfig = {}

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
 * Track the user's reduced motion preference, updating when it changes.
 *
 * SSR / hydration safe: the server and the hydrating client render use
 * `false` (no preference), and React re-renders right after hydration when the
 * real preference differs. Client-only renders read the real preference
 * immediately, so reduced-motion users never see the initial animation start.
 */
function usePrefersReducedMotion(enabled: boolean): boolean {
  return useSyncExternalStore(
    enabled ? subscribeToReducedMotion : subscribeNoop,
    enabled ? getReducedMotionPreference : getServerReducedMotion,
    getServerReducedMotion
  )
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
