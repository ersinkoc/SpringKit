import { useEffect, useRef, useState } from 'react'
import { createSpringValue, type SpringValue } from '../../../core/spring-value.js'
import type { SpringConfig } from '../../../types.js'

/**
 * Hook for creating trail animations with staggered delays
 *
 * @param count - Number of items in the trail
 * @param values - Target values object (all numeric properties will be animated)
 * @param config - Spring configuration
 * @returns Array of animated value objects
 *
 * @example
 * ```tsx
 * function TrailList({ items, isVisible }) {
 *   const trail = useTrail(items.length, {
 *     opacity: isVisible ? 1 : 0,
 *     x: isVisible ? 0 : -20,
 *   }, { stiffness: 120, damping: 14 })
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
  // Store springs for each item and each property
  const springsRef = useRef<Map<string, SpringValue[]> | null>(null)
  const [currentValues, setCurrentValues] = useState<T[]>(() =>
    Array.from({ length: count }, () => ({ ...values }))
  )
  const isFirstRender = useRef(true)
  const prevValuesRef = useRef<string>(JSON.stringify(values))

  // Initialize springs
  useEffect(() => {
    const keys = Object.keys(values)
    const springs = new Map<string, SpringValue[]>()

    // Create springs for each property and each item
    keys.forEach(key => {
      const propSprings: SpringValue[] = []
      const initialValue = values[key] as number
      for (let i = 0; i < count; i++) {
        const spring = createSpringValue(initialValue, config)
        propSprings.push(spring)
      }
      springs.set(key, propSprings)
    })

    springsRef.current = springs

    // Subscribe to all springs and update state
    const unsubscribers: (() => void)[] = []

    springs.forEach((propSprings, key) => {
      propSprings.forEach((spring, index) => {
        const unsub = spring.subscribe(() => {
          setCurrentValues(prev => {
            const next = [...prev]
            if (!next[index]) {
              next[index] = { ...values }
            }
            // Get current values from all springs for this index
            const newItem = { ...next[index] } as T
            springs.forEach((ps, k) => {
              (newItem as Record<string, number>)[k] = ps[index]!.get()
            })
            next[index] = newItem
            return next
          })
        })
        unsubscribers.push(unsub)
      })
    })

    return () => {
      unsubscribers.forEach(unsub => unsub())
      springs.forEach(propSprings => {
        propSprings.forEach(spring => spring.destroy())
      })
      springsRef.current = null
    }
  }, [count])

  // Update springs when values change with staggered delay
  useEffect(() => {
    if (!springsRef.current) return

    const currentValuesString = JSON.stringify(values)
    if (isFirstRender.current) {
      isFirstRender.current = false
      prevValuesRef.current = currentValuesString
      return
    }

    if (currentValuesString === prevValuesRef.current) return
    prevValuesRef.current = currentValuesString

    const keys = Object.keys(values)
    const staggerDelay = 50 // ms between each item

    keys.forEach(key => {
      const propSprings = springsRef.current?.get(key)
      if (!propSprings) return

      const targetValue = values[key] as number
      propSprings.forEach((spring, index) => {
        setTimeout(() => {
          spring.set(targetValue, config)
        }, index * staggerDelay)
      })
    })
  }, [JSON.stringify(values), config.stiffness, config.damping])

  return currentValues
}
