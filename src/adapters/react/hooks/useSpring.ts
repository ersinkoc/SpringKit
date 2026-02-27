import { useEffect, useRef, useState, useCallback } from 'react'
import { createSpringGroup } from '../../../index.js'
import type { SpringConfig, SpringGroup } from '../../../types.js'

/**
 * Animated values type
 */
export type AnimatedValues<T extends Record<string, number>> = {
  [K in keyof T]: number
}

/**
 * Deep equality check for objects
 */
function shallowEqual<T extends Record<string, number>>(a: T, b: T): boolean {
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false
  for (const key of keysA) {
    if (a[key] !== b[key]) return false
  }
  return true
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
  const isMounted = useRef(false)
  const configRef = useRef(config)
  const prevValuesRef = useRef<T>(values)

  // Keep config ref updated
  configRef.current = config

  // Initialize spring group with ACTUAL initial values (not 0)
  // Check isDestroyed() for React StrictMode compatibility
  if (!springRef.current || springRef.current.isDestroyed()) {
    springRef.current = createSpringGroup(values, config)
    prevValuesRef.current = values
  }

  // Get initial values from spring (not from props)
  // This ensures we sync with spring's actual current state
  const getSpringValues = useCallback(() => {
    const spring = springRef.current
    if (!spring) return values

    // Get all current values from spring
    return spring.get()
  }, [])

  // Initialize state from spring's actual values
  const [currentValues, setCurrentValues] = useState<T>(getSpringValues)

  // Subscribe to spring updates and sync with React state
  useEffect(() => {
    isMounted.current = true
    const spring = springRef.current
    if (!spring) return

    // Subscribe to spring updates
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

  // Update spring when values actually change (not just reference)
  useEffect(() => {
    const spring = springRef.current
    if (!spring) return

    // Only update if values actually changed
    if (!shallowEqual(values, prevValuesRef.current)) {
      prevValuesRef.current = values
      spring.set(values, configRef.current)
    }
  })

  // Cleanup on unmount: destroy spring to prevent memory leaks
  useEffect(() => {
    return () => {
      springRef.current?.destroy()
      springRef.current = null
    }
  }, [])

  return currentValues as AnimatedValues<T>
}
