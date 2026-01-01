import { useEffect, useRef, useState } from 'react'
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
  const [, forceUpdate] = useState({})

  // Initialize springs
  useEffect(() => {
    // Clean up old springs
    springsRef.current.forEach((s) => s?.destroy())
    springsRef.current = []

    // Track timeouts for cleanup to prevent memory leaks
    const timeoutIds: ReturnType<typeof setTimeout>[] = []

    // Create new springs
    for (let i = 0; i < count; i++) {
      const item = items(i)
      const initialValues = (item.from ?? item.values) as T
      const spring = createSpringGroup(initialValues, {
        ...defaultConfig,
        ...item.config,
      })

      spring.subscribe(() => forceUpdate({}))
      springsRef.current.push(spring)

      // Start animation with delay (track timeout for cleanup)
      const timeoutId = setTimeout(() => {
        spring.set(item.values as Partial<T>)
      }, item.delay ?? 0)
      timeoutIds.push(timeoutId)
    }

    return () => {
      // Clear all pending timeouts to prevent memory leaks
      timeoutIds.forEach(clearTimeout)
      springsRef.current.forEach((s) => s?.destroy())
    }
  }, [count, defaultConfig]) // eslint-disable-line react-hooks/exhaustive-deps

  // Get current values
  return springsRef.current.map((spring) => spring?.get() ?? ({} as T))
}
