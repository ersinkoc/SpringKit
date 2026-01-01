import { useEffect, useRef, useState, useMemo } from 'react'
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
  const isFirstRender = useRef(true)
  const prevValuesRef = useRef<T>(values)
  const configRef = useRef(config)

  // Memoize values to detect actual changes without JSON.stringify on every render
  const valuesKey = useMemo(() => {
    const keys = Object.keys(values).sort()
    return keys.map(k => `${k}:${values[k]}`).join('|')
  }, [values])

  // Keep config ref updated
  configRef.current = config

  // Initialize spring group with ACTUAL initial values (not 0)
  if (!springRef.current) {
    springRef.current = createSpringGroup(values, config)
    springRef.current.subscribe(() => forceUpdate({}))
  }

  // Update when values change (skip first render since we initialized with values)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    // Check if any value actually changed
    const prev = prevValuesRef.current
    const hasChanged = Object.keys(values).some(
      key => values[key] !== prev[key]
    )

    if (hasChanged) {
      springRef.current?.set(values, configRef.current)
      prevValuesRef.current = values
    }
  }, [valuesKey, values])

  // Cleanup on unmount
  useEffect(() => {
    return () => springRef.current?.destroy()
  }, [])

  return springRef.current.get()
}
