import React, { useEffect, useRef, useState } from 'react'
import { createTrail } from '../../../index.js'
import type { SpringConfig } from '../../../types.js'

/**
 * Trail component props
 */
export interface TrailProps<T, V extends Record<string, number>> {
  /** Array of items */
  items: T[]
  /** Key extractor for items */
  keys: (item: T, index: number) => string | number
  /** Starting values */
  from: V
  /** Target values */
  to: V
  /** Spring configuration */
  config?: SpringConfig
  /** Whether to reverse the trail */
  reverse?: boolean
  /** Render function */
  children: (values: V, item: T, index: number) => React.ReactNode
}

/**
 * Trail component for staggered animations
 *
 * @example
 * ```tsx
 * <Trail
 *   items={items}
 *   keys={(item) => item.id}
 *   from={{ opacity: 0, x: -20 }}
 *   to={{ opacity: 1, x: 0 }}
 *   config={{ stiffness: 120, damping: 14 }}
 * >
 *   {(style, item, index) => (
 *     <div
 *       key={item.id}
 *       style={{
 *         opacity: style.opacity,
 *         transform: `translateX(${style.x}px)`,
 *       }}
 *     >
 *       {item.name}
 *     </div>
 *   )}
 * </Trail>
 * ```
 */
export const Trail = <T, V extends Record<string, number>>({
  items,
  keys,
  from,
  to,
  config = {},
  reverse = false,
  children,
}: TrailProps<T, V>) => {
  const trailRef = useRef<ReturnType<typeof createTrail> | null>(null)
  const [values, setValues] = useState<V[]>(() =>
    items.map(() => ({ ...from }))
  )

  // Initialize trail
  useEffect(() => {
    const trail = createTrail(items.length, config)

    const unsubscribe = trail.subscribe((vals) => {
      setValues(vals.map((v) => ({ ...to, x: v })))
    })

    trailRef.current = trail

    // Start animation
    const firstValue = Object.values(to)[0] as number
    trail.set(firstValue)

    return () => {
      unsubscribe()
      trail.destroy()
    }
  }, [items.length, config.stiffness, config.damping]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update when to values change
  useEffect(() => {
    const firstValue = Object.values(to)[0] as number
    trailRef.current?.set(firstValue)
  }, [to])

  return (
    <>
      {items.map((item, index) => (
        <React.Fragment key={keys(item, index)}>
          {children(values[index]!, item, reverse ? items.length - 1 - index : index)}
        </React.Fragment>
      ))}
    </>
  )
}
