import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import { createSpringGroup } from '@oxog/springkit'
import type { SpringConfig } from '@oxog/springkit'
import { useStableSpringConfig } from '../utils/config.js'

const DEFAULT_SPRING_CONFIG: SpringConfig = {}

/**
 * Spring component props
 */
export interface SpringProps<T extends Record<string, number>> {
  /** Starting values */
  from: T
  /** Target values */
  to: T
  /** Spring configuration */
  config?: SpringConfig
  /** Callback when animation is at rest */
  onRest?: () => void
  /** Render function */
  children: (values: T) => React.ReactNode
}

/**
 * Spring component for declarative animations
 *
 * @example
 * ```tsx
 * <Spring
 *   from={{ opacity: 0, y: 20 }}
 *   to={{ opacity: 1, y: 0 }}
 *   config={{ stiffness: 100, damping: 10 }}
 * >
 *   {(style) => (
 *     <div
 *       style={{
 *         opacity: style.opacity,
 *         transform: `translateY(${style.y}px)`,
 *       }}
 *     >
 *       Animated content
 *     </div>
 *   )}
 * </Spring>
 * ```
 */
export const Spring = <T extends Record<string, number>>({
  from,
  to,
  config: configProp,
  onRest,
  children,
}: SpringProps<T>) => {
  // Stable config: a default/inline object must not re-trigger the update
  // effect on every render (set() restarts the spring with zero velocity)
  const config = useStableSpringConfig(configProp, DEFAULT_SPRING_CONFIG)
  const springRef = useRef<ReturnType<typeof createSpringGroup<T>> | null>(null)
  const [values, setValues] = useState<T>(from)

  // Latest props for use in effects
  const toRef = useRef(to)
  toRef.current = to
  const onRestRef = useRef(onRest)
  onRestRef.current = onRest
  const handleRest = useRef(() => onRestRef.current?.()).current

  // Only re-target when the target values actually change
  const toSignature = Object.keys(to).map((key) => `${key}:${to[key]}`).join('|')

  // Initialize spring
  useEffect(() => {
    const spring = createSpringGroup(from, config)
    const unsubscribe = spring.subscribe(setValues)
    springRef.current = spring

    // Start animation
    const rafId = requestAnimationFrame(() => {
      spring.set(toRef.current, { ...config, onRest: handleRest })
    })

    return () => {
      cancelAnimationFrame(rafId)
      unsubscribe()
      spring.destroy()
      springRef.current = null
    }
    // Intentionally only run on mount - updates handled in separate effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update when props change (skip the first run: the mount effect animates)
  const isFirstUpdateRef = useRef(true)
  useEffect(() => {
    if (isFirstUpdateRef.current) {
      isFirstUpdateRef.current = false
      return
    }
    springRef.current?.set(toRef.current, { ...config, onRest: handleRest })
  }, [toSignature, config, handleRest])

  return <>{children(values)}</>}
