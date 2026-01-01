import { useEffect, useRef, useState, useCallback } from 'react'
import { createSpringGroup } from '../../../index.js'
import type { SpringConfig } from '../../../types.js'

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
 *       opacity: 1,
 *       y: 0,
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

  // Initialize springs
  useEffect(() => {
    isMountedRef.current = true

    // Clean up old springs
    springsRef.current.forEach((s) => s?.destroy())
    springsRef.current = []

    // Track timeouts for cleanup to prevent memory leaks
    const timeoutIds: ReturnType<typeof setTimeout>[] = []
    const unsubscribers: (() => void)[] = []

    // Create new springs
    for (let i = 0; i < count; i++) {
      const item = itemsRef.current(i)
      const initialValues = (item.from ?? item.values) as T
      const spring = createSpringGroup(initialValues, {
        ...defaultConfig,
        ...item.config,
      })

      springsRef.current.push(spring)

      // Subscribe with mount check
      const index = i
      const unsubscribe = spring.subscribe((values) => {
        if (isMountedRef.current) {
          setCurrentValues(prev => {
            const next = [...prev]
            next[index] = values as { [K in keyof T]: number }
            return next
          })
        }
      })
      unsubscribers.push(unsubscribe)

      // Start animation with delay (track timeout for cleanup)
      const timeoutId = setTimeout(() => {
        spring.set(item.values as Partial<T>)
      }, item.delay ?? 0)
      timeoutIds.push(timeoutId)
    }

    return () => {
      isMountedRef.current = false
      // Unsubscribe all
      unsubscribers.forEach(unsub => unsub())
      // Clear all pending timeouts to prevent memory leaks
      timeoutIds.forEach(clearTimeout)
      springsRef.current.forEach((s) => s?.destroy())
    }
  }, [count, defaultConfig])

  return currentValues
}
