import { useSyncExternalStore } from 'react'
import { isBrowser } from '../utils/ssr.js'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function noop(): void {}

/**
 * Subscribe to changes of the OS reduced motion preference
 * @internal
 */
export function subscribeToReducedMotion(onChange: () => void): () => void {
  if (!isBrowser || typeof window.matchMedia !== 'function') return noop
  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY)
  if (!mediaQuery) return noop

  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', onChange)
    return () => mediaQuery.removeEventListener('change', onChange)
  }
  // Legacy API (Safari < 14)
  mediaQuery.addListener?.(onChange)
  return () => mediaQuery.removeListener?.(onChange)
}

/**
 * Server snapshot: no preference is known while rendering on the server, and
 * the first (hydrating) client render must produce the same markup
 * @internal
 */
export function getServerReducedMotion(): boolean {
  return false
}

/**
 * Detect user's reduced motion preference
 *
 * Respects the `prefers-reduced-motion` media query.
 * Returns true when the user has requested reduced motion, and updates when
 * the preference changes.
 *
 * SSR / hydration safe: the server and the hydrating client render return
 * `false` (React re-renders right after hydration when the real preference
 * differs). Client-only renders read the real preference immediately.
 *
 * @example
 * ```tsx
 * function AnimatedComponent() {
 *   const prefersReducedMotion = useReducedMotion()
 *
 *   const config = prefersReducedMotion
 *     ? { duration: 0 } // Instant
 *     : { stiffness: 100, damping: 15 } // Spring
 *
 *   return <Animated.div config={config}>...</Animated.div>
 * }
 * ```
 *
 * @example With fallback animation
 * ```tsx
 * function FadeIn({ children }) {
 *   const prefersReducedMotion = useReducedMotion()
 *
 *   return (
 *     <Animated.div
 *       initial={{ opacity: prefersReducedMotion ? 1 : 0 }}
 *       animate={{ opacity: 1 }}
 *     >
 *       {children}
 *     </Animated.div>
 *   )
 * }
 * ```
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionPreference,
    getServerReducedMotion
  )
}

/**
 * Get reduced motion preference synchronously (for SSR)
 *
 * @returns false on server, actual value on client
 */
export function getReducedMotionPreference(): boolean {
  if (!isBrowser || typeof window.matchMedia !== 'function') return false
  return window.matchMedia(REDUCED_MOTION_QUERY)?.matches ?? false
}

/**
 * Create animation config based on reduced motion preference
 *
 * @example
 * ```tsx
 * function AnimatedBox() {
 *   const config = useReducedMotionConfig({
 *     default: { stiffness: 100, damping: 15 },
 *     reduced: { stiffness: 500, damping: 50 }, // Much stiffer = faster
 *   })
 *
 *   return <Animated.div config={config}>...</Animated.div>
 * }
 * ```
 */
export function useReducedMotionConfig<T>(configs: {
  default: T
  reduced: T
}): T {
  const prefersReducedMotion = useReducedMotion()
  return prefersReducedMotion ? configs.reduced : configs.default
}

/**
 * Skip animations entirely when reduced motion is preferred
 *
 * @example
 * ```tsx
 * function AnimatedList() {
 *   const shouldAnimate = useShouldAnimate()
 *
 *   return items.map((item, i) => (
 *     <Animated.li
 *       initial={shouldAnimate ? { opacity: 0 } : false}
 *       animate={{ opacity: 1 }}
 *       transition={shouldAnimate ? { delay: i * 0.1 } : { duration: 0 }}
 *     >
 *       {item}
 *     </Animated.li>
 *   ))
 * }
 * ```
 */
export function useShouldAnimate(): boolean {
  return !useReducedMotion()
}

/**
 * Create an animation value that respects reduced motion
 *
 * Returns the full animation when motion is allowed,
 * or the final value immediately when reduced motion is preferred.
 *
 * @example
 * ```tsx
 * function SlideIn() {
 *   const x = useReducedMotionValue(0, 100)
 *   // Returns 0 → 100 normally
 *   // Returns 100 immediately with reduced motion
 *
 *   return <Animated.div animate={{ x }}>...</Animated.div>
 * }
 * ```
 */
export function useReducedMotionValue<T>(
  animatedValue: T,
  reducedValue: T
): T {
  const prefersReducedMotion = useReducedMotion()
  return prefersReducedMotion ? reducedValue : animatedValue
}
