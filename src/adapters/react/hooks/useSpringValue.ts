import { useEffect, useRef } from 'react'
import { createSpringValue } from '../../../index.js'
import type { SpringConfig, SpringValue } from '../../../types.js'

/**
 * Hook for creating a spring value
 *
 * @param initial - Initial value
 * @param config - Spring configuration
 * @returns Spring value controller
 *
 * @example
 * ```tsx
 * function ProgressBar({ value }) {
 *   const progress = useSpringValue(value, {
 *     stiffness: 100,
 *     damping: 20,
 *   })
 *
 *   useEffect(() => {
 *     progress.set(value)
 *   }, [value])
 *
 *   return (
 *     <div className="progress-container">
 *       <div
 *         className="progress-bar"
 *         style={{ width: `${progress.get()}%` }}
 *       />
 *     </div>
 *   )
 * }
 * ```
 */
export function useSpringValue(
  initial: number,
  config: SpringConfig = {}
): SpringValue {
  const springRef = useRef<SpringValue | null>(null)

  if (!springRef.current) {
    springRef.current = createSpringValue(initial, config)
  }

  useEffect(() => {
    return () => springRef.current?.destroy()
  }, [])

  return springRef.current
}
