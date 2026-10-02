import { useEffect, useRef, useState, useCallback } from 'react'
import { createSpringGroup } from '@oxog/springkit'
import type { SpringConfig } from '@oxog/springkit'

function shallowEqual(a: Record<string, number>, b: Record<string, number>): boolean {
  const keysA = Object.keys(a)
  if (keysA.length !== Object.keys(b).length) return false
  for (const key of keysA) {
    if (a[key] !== b[key]) return false
  }
  return true
}

/**
 * Spring item configuration
 */
export interface SpringItem<T> {
  values: T
  from?: Partial<T>
  delay?: number
  config?: Partial<SpringConfig>
}

/**
 * Hook for managing multiple spring animations
 *
 * @param count - Number of springs
 * @param items - Function that returns spring config for each index
 * @param defaultConfig - Default spring configuration
 * @returns Array of animated values
 *
 * @example
 * ```tsx
 * function AnimatedList({ items }) {
 *   const springs = useSprings(
 *     items.length,
 *     (index) => ({
 *       values: { opacity: 1, y: 0 },
 *       from: { opacity: 0, y: 20 },
 *       delay: index * 50,
 *     })
 *   )
 *
 *   return (
 *     <ul>
 *       {items.map((item, index) => (
 *         <li
 *           key={item.id}
 *           style={{
 *             opacity: springs[index].opacity,
 *             transform: `translateY(${springs[index].y}px)`,
 *           }}
 *         >
 *           {item.name}
 *         </li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 */
export function useSprings<T extends Record<string, number>>(
  count: number,
  items: (index: number) => SpringItem<T>,
  defaultConfig: Partial<SpringConfig> = {}
): Array<{ [K in keyof T]: number }> {
  const springsRef = useRef<Array<ReturnType<typeof createSpringGroup<T>>>>([])
  const isMountedRef = useRef(false)

  // Use ref to always have access to the latest items function
  // This prevents stale closure issues while avoiding infinite effect loops
  const itemsRef = useRef(items)
  itemsRef.current = items

  // Initialize current values state based on initial items
  const getInitialValues = useCallback(() => {
    const result: Array<{ [K in keyof T]: number }> = []
    for (let i = 0; i < count; i++) {
      const item = itemsRef.current(i)
      result.push((item.from ?? item.values) as { [K in keyof T]: number })
    }
    return result
  }, [count])

  const [currentValues, setCurrentValues] = useState<Array<{ [K in keyof T]: number }>>(getInitialValues)

  // Inline config objects (including the `{}` default) get a new identity on
  // every render. Key the setup effect on the config's content so the springs
  // are not destroyed and recreated (restarting the animation) on each render.
  const defaultConfigRef = useRef(defaultConfig)
  defaultConfigRef.current = defaultConfig
  const defaultConfigKey = JSON.stringify(defaultConfig)

  // Last target applied to each spring (used to detect changed item values)
  const lastTargetsRef = useRef<Array<T | undefined>>([])
  // Pending delayed `set` per spring index
  const timeoutsRef = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const scheduleSet = useCallback((index: number, values: T, delay: number, config?: Partial<SpringConfig>) => {
    const timeouts = timeoutsRef.current
    const pending = timeouts.get(index)
    if (pending !== undefined) clearTimeout(pending)
    const timeoutId = setTimeout(() => {
      timeouts.delete(index)
      springsRef.current[index]?.set(values as Partial<T>, config)
    }, delay)
    timeouts.set(index, timeoutId)
  }, [])

  // Initialize springs
  useEffect(() => {
    isMountedRef.current = true

    // Clean up old springs
    springsRef.current.forEach((s) => s?.destroy())
    springsRef.current = []
    lastTargetsRef.current = []

    const unsubscribers: (() => void)[] = []

    // Drop values of springs that no longer exist (count decreased)
    setCurrentValues(prev => (prev.length > count ? prev.slice(0, count) : prev))

    // Create new springs
    for (let i = 0; i < count; i++) {
      const item = itemsRef.current(i)
      const initialValues = (item.from ?? item.values) as T
      const spring = createSpringGroup(initialValues, {
        ...defaultConfigRef.current,
        ...item.config,
      })

      springsRef.current.push(spring)

      // Subscribe with mount check
      const index = i
      const unsubscribe = spring.subscribe((values) => {
        if (isMountedRef.current) {
          setCurrentValues(prev => {
            // Only update if value actually changed to prevent unnecessary re-renders
            const prevValues = prev[index]
            const newValues = values as { [K in keyof T]: number }

            // Check if any value changed
            let hasChanged = false
            if (prevValues) {
              for (const key in newValues) {
                if (newValues[key] !== prevValues[key]) {
                  hasChanged = true
                  break
                }
              }
            } else {
              hasChanged = true
            }

            if (!hasChanged) return prev

            const next = [...prev]
            next[index] = newValues
            return next
          })
        }
      })
      unsubscribers.push(unsubscribe)

      // Start animation with delay (tracked timeout for cleanup)
      lastTargetsRef.current[i] = item.values
      scheduleSet(i, item.values, item.delay ?? 0)
    }

    const timeouts = timeoutsRef.current
    return () => {
      isMountedRef.current = false
      // Unsubscribe all
      unsubscribers.forEach(unsub => unsub())
      // Clear all pending timeouts to prevent memory leaks
      timeouts.forEach(clearTimeout)
      timeouts.clear()
      springsRef.current.forEach((s) => s?.destroy())
    }
  }, [count, defaultConfigKey, scheduleSet])

  // Retarget springs when the values returned by `items` change after mount
  useEffect(() => {
    for (let i = 0; i < springsRef.current.length; i++) {
      const spring = springsRef.current[i]
      if (!spring || spring.isDestroyed()) continue

      const item = itemsRef.current(i)
      const prevTarget = lastTargetsRef.current[i]
      if (prevTarget && shallowEqual(prevTarget, item.values)) continue

      lastTargetsRef.current[i] = item.values
      scheduleSet(i, item.values, item.delay ?? 0, item.config)
    }
  })

  return currentValues
}
