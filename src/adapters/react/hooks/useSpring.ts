import { useEffect, useRef, useState } from 'react'
import { createSpringGroup } from '../../../index.js'
import type { SpringConfig, SpringGroup } from '../../../types.js'

/**
 * Animated values type
 */
export type AnimatedValues<T extends Record<string, number>> = {
  [K in keyof T]: number
}

/**
 * Hook for animating multiple values with springs
 *
 * @param values - Target values object
 * @param config - Spring configuration
 * @returns Current animated values
 *
 * @example
 * ```tsx
 * function Box() {
 *   const [isOpen, setIsOpen] = useState(false)
 *
 *   const style = useSpring({
 *     width: isOpen ? 300 : 100,
 *     height: isOpen ? 200 : 100,
 *     opacity: isOpen ? 1 : 0.5,
 *   }, {
 *     stiffness: 100,
 *     damping: 10,
 *   })
 *
 *   return (
 *     <div
 *       onClick={() => setIsOpen(!isOpen)}
 *       style={{
 *         width: style.width,
 *         height: style.height,
 *         opacity: style.opacity,
 *       }}
 *     />
 *   )
 * }
 * ```
 */
export function useSpring<T extends Record<string, number>>(
  values: T,
  config: Partial<SpringConfig> = {}
): AnimatedValues<T> {
  const springRef = useRef<SpringGroup<T> | null>(null)
  const [, forceUpdate] = useState({})

  // Initialize spring group
  if (!springRef.current) {
    const initialValues = Object.fromEntries(
      Object.entries(values).map(([k, v]) => [k, 0])
    ) as T

    springRef.current = createSpringGroup(initialValues, config)
    springRef.current.subscribe(() => forceUpdate({}))
  }

  // Update when values change
  useEffect(() => {
    springRef.current?.set(values, config)
  }, [values, config])

  // Cleanup on unmount
  useEffect(() => {
    return () => springRef.current?.destroy()
  }, [])

  return springRef.current.get()
}
