import { useEffect, useRef, useState } from 'react'
import { createSpringValue, delay, type SpringValue } from '@oxog/springkit'
import type { SpringConfig } from '@oxog/springkit'

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
  const isMountedRef = useRef(false)
  const [currentValues, setCurrentValues] = useState<T[]>(() =>
    Array.from({ length: count }, () => ({ ...values }))
  )
  const isFirstRender = useRef(true)
  const prevValuesRef = useRef<string>(JSON.stringify(values))
  // Pending stagger delays (cancel functions), cleaned up to prevent leaks
  const timeoutsRef = useRef<Array<() => void>>([])

  // Physics config the springs were created with (a change recreates them)
  const springsConfigKeyRef = useRef<string | null>(null)
  const configKey = `${config.stiffness}|${config.damping}|${config.mass}`

  // Initialize springs. When only `count` changes, the springs of the
  // remaining items are kept (an animation in progress continues): only added
  // items get new springs and removed items' springs are destroyed.
  useEffect(() => {
    isMountedRef.current = true
    const keys = Object.keys(values)
    const springs = new Map<string, SpringValue[]>()

    // Reuse live springs created with the same config (destroyed ones, e.g.
    // after StrictMode's simulated unmount, are recreated)
    const existingSprings = springsConfigKeyRef.current === configKey ? springsRef.current : null
    springsConfigKeyRef.current = configKey
    keys.forEach(key => {
      const propSprings: SpringValue[] = []
      const initialValue = values[key] as number
      const existingPropSprings = existingSprings?.get(key)
      for (let i = 0; i < count; i++) {
        const existingSpring = existingPropSprings?.[i]
        const spring = (existingSpring && !existingSpring.isDestroyed())
          ? existingSpring
          : createSpringValue(initialValue, config)
        propSprings.push(spring)
      }
      springs.set(key, propSprings)
    })

    // Destroy the springs that are no longer used
    springsRef.current?.forEach((propSprings, key) => {
      const kept = springs.get(key)
      propSprings.forEach((spring, index) => {
        if (kept?.[index] !== spring) spring.destroy()
      })
    })

    springsRef.current = springs

    // Drop values of items that no longer exist (count decreased)
    setCurrentValues(prev => (prev.length > count ? prev.slice(0, count) : prev))

    // Subscribe to all springs and update state
    const unsubscribers: (() => void)[] = []

    springs.forEach((propSprings, _key) => {
      propSprings.forEach((spring, index) => {
        const unsub = spring.subscribe(() => {
          if (!isMountedRef.current) return
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
      isMountedRef.current = false
      unsubscribers.forEach(unsub => unsub())
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, configKey])

  // Destroy the springs on unmount (StrictMode's simulated unmount included:
  // the effect above then recreates them)
  useEffect(() => {
    return () => {
      springsRef.current?.forEach(propSprings => {
        propSprings.forEach(spring => spring.destroy())
      })
    }
  }, [])

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

    // Clear any pending timeouts from previous animation
    timeoutsRef.current.forEach((cancel) => cancel())
    timeoutsRef.current = []

    keys.forEach(key => {
      const propSprings = springsRef.current?.get(key)
      if (!propSprings) return

      const targetValue = values[key] as number
      propSprings.forEach((spring, index) => {
        if (index === 0) {
          spring.set(targetValue, config)
          return
        }
        // Animation time (follows the time scale and the test clock)
        const cancel = delay(index * staggerDelay, () => {
          spring.set(targetValue, config)
        })
        timeoutsRef.current.push(cancel)
      })
    })

    // Cleanup function for this effect
    return () => {
      timeoutsRef.current.forEach((cancel) => cancel())
      timeoutsRef.current = []
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(values), config.stiffness, config.damping])

  // Right after `count` changed, the state still has the previous number of
  // items: return exactly `count` (new items start at `values`)
  if (currentValues.length === count) return currentValues
  const result = currentValues.slice(0, count)
  while (result.length < count) result.push({ ...values })
  return result
}
