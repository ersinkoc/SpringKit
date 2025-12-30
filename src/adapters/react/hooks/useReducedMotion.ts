import { useState, useEffect } from 'react'
import { isBrowser } from '../utils/ssr.js'

/**
 * Detect user's reduced motion preference
 *
 * Respects the `prefers-reduced-motion` media query.
 * Returns true when the user has requested reduced motion.
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
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    // SSR-safe: assume no preference on server
    if (!isBrowser) return false

    // Check initial value
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    if (!isBrowser) return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    // Update state when preference changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    // Modern API
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }

    // Legacy API (Safari < 14)
    mediaQuery.addListener(handleChange)
    return () => mediaQuery.removeListener(handleChange)
  }, [])

  return prefersReducedMotion
}

/**
 * Get reduced motion preference synchronously (for SSR)
 *
 * @returns false on server, actual value on client
 */
export function getReducedMotionPreference(): boolean {
  if (!isBrowser) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
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
