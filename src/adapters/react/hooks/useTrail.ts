import { useEffect, useRef, useState } from 'react'
import { createTrail } from '../../../index.js'
import type { SpringConfig, Trail } from '../../../types.js'

/**
 * Hook for creating trail animations
 *
 * @param count - Number of items in the trail
 * @param values - Target values
 * @param config - Spring configuration
 * @returns Array of trail values
 *
 * @example
 * ```tsx
 * function TrailList({ items, isVisible }) {
 *   const trail = useTrail(items.length, {
 *     opacity: isVisible ? 1 : 0,
 *     x: isVisible ? 0 : -20,
 *     stiffness: 120,
 *     damping: 14,
 *   })
 *
 *   return (
 *     <ul>
 *       {trail.map((style, index) => (
 *         <li
 *           key={items[index].id}
 *           style={{
 *             opacity: style.opacity,
 *             transform: `translateX(${style.x}px)`,
 *           }}
 *         >
 *           {items[index].name}
 *         </li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 */
export function useTrail<T extends Record<string, number>>(
  count: number,
  values: T,
  config: SpringConfig = {}
): Array<T> {
  const trailRef = useRef<Trail | null>(null)
  const [currentValues, setCurrentValues] = useState<T[]>(() =>
    Array.from({ length: count }, () => ({ ...values }))
  )

  // Initialize trail
  useEffect(() => {
    trailRef.current = createTrail(count, config)

    const unsubscribe = trailRef.current.subscribe((vals) => {
      setCurrentValues(vals.map((v) => ({ ...values, x: v })))
    })

    // Set initial values
    const firstValue = Object.values(values)[0] as number
    trailRef.current.set(firstValue)

    return () => {
      unsubscribe()
      trailRef.current?.destroy()
    }
  }, [count, config.stiffness, config.damping])

  // Update when values change
  useEffect(() => {
    const firstValue = Object.values(values)[0] as number
    trailRef.current?.set(firstValue)
  }, [values])

  return currentValues
}
