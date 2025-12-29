import React, { useEffect, useRef, useState } from 'react'
import { createSpringGroup } from '../../../index.js'
import type { SpringConfig } from '../../../types.js'

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
  config = {},
  onRest,
  children,
}: SpringProps<T>) => {
  const springRef = useRef<ReturnType<typeof createSpringGroup<T>> | null>(null)
  const [values, setValues] = useState<T>(from)

  // Initialize spring
  useEffect(() => {
    const spring = createSpringGroup(from, config)
    spring.subscribe(setValues)
    springRef.current = spring

    // Start animation
    requestAnimationFrame(() => {
      spring.set(to, { ...config, onRest })
    })

    return () => spring.destroy()
  }, [])

  // Update when props change
  useEffect(() => {
    springRef.current?.set(to, { ...config, onRest })
  }, [to, config, onRest])

  return <>{children(values)}</>}
