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
  const [currentValues, setCurrentValues] = useState<T>(values)
  const isFirstRender = useRef(true)
  const isMounted = useRef(false)
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
  // Check isDestroyed() for React StrictMode compatibility
  if (!springRef.current || springRef.current.isDestroyed()) {
    springRef.current = createSpringGroup(values, config)
  }

  // Subscribe to spring updates after mount
  useEffect(() => {
    isMounted.current = true
    const spring = springRef.current
    if (!spring) return

    const unsubscribe = spring.subscribe((newValues) => {
      if (isMounted.current) {
        setCurrentValues(newValues)
      }
    })

    return () => {
      isMounted.current = false
      unsubscribe()
    }
  }, [])

  // Update when values or config change (skip first render since we initialized with values)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    // Check if any value actually changed
    const prev = prevValuesRef.current
    const hasValueChanged = Object.keys(values).some(
      key => values[key] !== prev[key]
    )

    if (hasValueChanged) {
      springRef.current?.set(values, configRef.current)
      prevValuesRef.current = values
    }
  }, [valuesKey, values])

  // Cleanup on unmount: destroy spring to prevent memory leaks
  useEffect(() => {
    return () => {
      springRef.current?.destroy()
      springRef.current = null
    }
  }, [])

  return currentValues as AnimatedValues<T>
}
