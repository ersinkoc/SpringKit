import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import { createTrail } from '@oxog/springkit'
import type { SpringConfig } from '@oxog/springkit'
import { useStableSpringConfig } from '../utils/config.js'

const DEFAULT_TRAIL_CONFIG: SpringConfig = {}

/** Trails (one per animated key) driving a consecutive run of items */
interface TrailSegment {
  size: number
  trails: Map<string, ReturnType<typeof createTrail>>
  /** Latest values per key */
  current: Record<string, number[]>
}

interface TrailState {
  config: SpringConfig
  keysSignature: string
  segments: TrailSegment[]
}

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
  /**
   * Reverse the stagger order: the last item leads and the first item follows
   * last. Items keep their order in the DOM and their index in `children`.
   */
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
  config: configProp,
  reverse = false,
  children,
}: TrailProps<T, V>) => {
  const config = useStableSpringConfig(configProp, DEFAULT_TRAIL_CONFIG)
  // The trails (one per animated key) in segments: items appended later get
  // a new segment, so the existing items keep their animation
  const stateRef = useRef<TrailState | null>(null)
  const [values, setValues] = useState<V[]>(() =>
    items.map(() => ({ ...from }))
  )

  // Latest from/to/reverse for use in effects
  const fromRef = useRef(from)
  fromRef.current = from
  const toRef = useRef(to)
  toRef.current = to
  const reverseRef = useRef(reverse)
  reverseRef.current = reverse

  const valueKeysSignature = Object.keys(to).join('|')
  const toSignature = Object.keys(to).map((key) => `${key}:${to[key]}`).join('|')

  // Create the trails (each animating from `from[key]` to `to[key]`), and a
  // new segment for items added later
  useEffect(() => {
    const count = items.length
    const fromValues = fromRef.current as Record<string, number>
    const toValues = toRef.current as Record<string, number>
    const keys = Object.keys(toValues)

    let state = stateRef.current
    if (!state || state.config !== config || state.keysSignature !== valueKeysSignature) {
      state?.segments.forEach((segment) => segment.trails.forEach((trail) => trail.destroy()))
      state = { config, keysSignature: valueKeysSignature, segments: [] }
      stateRef.current = state
    }
    const segments = state.segments

    const capacity = segments.reduce((total, segment) => total + segment.size, 0)
    if (capacity < count) {
      const size = count - capacity
      const segment: TrailSegment = { size, trails: new Map(), current: {} }
      for (const key of keys) {
        const start = fromValues[key] ?? toValues[key] ?? 0
        const trail = createTrail(size, config)
        trail.jump(start)
        segment.trails.set(key, trail)
        segment.current[key] = new Array<number>(size).fill(start)
      }
      segments.push(segment)
      // Start animation
      for (const key of keys) {
        const target = toValues[key]
        if (typeof target === 'number') segment.trails.get(key)?.set(target)
      }
    }

    const publish = () => {
      // In reverse, the last item follows the leader first
      const isReversed = reverseRef.current
      const all: Record<string, number[]> = {}
      for (const key of keys) {
        all[key] = segments.flatMap((segment) => segment.current[key] ?? [])
      }
      setValues(
        Array.from({ length: count }, (_, index) => {
          const itemValues: Record<string, number> = { ...fromValues }
          const trailIndex = isReversed ? count - 1 - index : index
          for (const key of keys) {
            itemValues[key] = all[key]?.[trailIndex] ?? fromValues[key] ?? toValues[key] ?? 0
          }
          return itemValues as V
        })
      )
    }

    const unsubscribes: (() => void)[] = []
    for (const segment of segments) {
      segment.trails.forEach((trail, key) => {
        unsubscribes.push(
          trail.subscribe((vals) => {
            segment.current[key] = vals
            publish()
          })
        )
      })
    }

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe())
    }
  }, [items.length, config, valueKeysSignature])

  // Destroy the trails on unmount (StrictMode's simulated unmount included:
  // the effect above then creates them again)
  useEffect(() => {
    return () => {
      stateRef.current?.segments.forEach((segment) =>
        segment.trails.forEach((trail) => trail.destroy())
      )
      stateRef.current = null
    }
  }, [])

  // Update when to values change
  const isFirstUpdateRef = useRef(true)
  useEffect(() => {
    if (isFirstUpdateRef.current) {
      isFirstUpdateRef.current = false
      return
    }
    const toValues = toRef.current as Record<string, number>
    stateRef.current?.segments.forEach((segment) => {
      segment.trails.forEach((trail, key) => {
        const target = toValues[key]
        if (typeof target === 'number') trail.set(target)
      })
    })
  }, [toSignature])

  return (
    <>
      {items.map((item, index) => {
        // An item added in this render starts at `from` (its springs are
        // created right after this render)
        const itemValues = values[index] ?? from
        return (
          <React.Fragment key={keys(item, index)}>
            {children(itemValues, item, index)}
          </React.Fragment>
        )
      })}
    </>
  )
}
