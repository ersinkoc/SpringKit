import { useRef, useEffect, useState } from 'react'
import { MotionValue, createMotionValue, type MotionValueOptions } from '../../../core/MotionValue.js'

/**
 * Create a MotionValue that persists across renders
 *
 * Unlike useState, updating a MotionValue doesn't trigger re-renders.
 * This makes it perfect for high-frequency animations.
 *
 * @example
 * ```tsx
 * function DragBox() {
 *   const x = useMotionValue(0)
 *   const y = useMotionValue(0)
 *
 *   return (
 *     <div
 *       ref={(el) => {
 *         if (!el) return
 *         x.subscribe((v) => el.style.transform = `translateX(${v}px)`)
 *       }}
 *       onMouseMove={(e) => {
 *         x.set(e.clientX)
 *         y.set(e.clientY)
 *       }}
 *     />
 *   )
 * }
 * ```
 */
export function useMotionValue<T = number>(
  initialValue: T,
  options?: MotionValueOptions
): MotionValue<T> {
  const motionValueRef = useRef<MotionValue<T> | null>(null)

  // Create on first render only
  if (motionValueRef.current === null) {
    motionValueRef.current = createMotionValue(initialValue, options)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      motionValueRef.current?.destroy()
    }
  }, [])

  return motionValueRef.current
}

/**
 * Subscribe to a MotionValue and trigger re-renders
 *
 * Use this when you need the value in render.
 * For most cases, prefer direct DOM updates via subscribe.
 *
 * @example
 * ```tsx
 * function ValueDisplay({ motionValue }) {
 *   const value = useMotionValueState(motionValue)
 *   return <span>{value.toFixed(2)}</span>
 * }
 * ```
 */
export function useMotionValueState<T>(motionValue: MotionValue<T>): T {
  const [value, setValue] = useState<T>(motionValue.get())

  useEffect(() => {
    const unsubscribe = motionValue.subscribe((newValue) => {
      setValue(newValue)
    })

    return unsubscribe
  }, [motionValue])

  return value
}

/**
 * Create a MotionValue that syncs with an external value
 *
 * Useful when you need a MotionValue that tracks a prop or state.
 *
 * @example
 * ```tsx
 * function AnimatedProgress({ progress }) {
 *   const motionProgress = useMotionValueSync(progress)
 *
 *   // motionProgress animates smoothly when progress prop changes
 *   return <ProgressBar motionValue={motionProgress} />
 * }
 * ```
 */
export function useMotionValueSync(
  externalValue: number,
  options?: MotionValueOptions
): MotionValue<number> {
  const motionValue = useMotionValue(externalValue, options)

  useEffect(() => {
    motionValue.set(externalValue)
  }, [externalValue, motionValue])

  return motionValue
}

/**
 * Create multiple MotionValues at once
 *
 * @example
 * ```tsx
 * function TransformBox() {
 *   const { x, y, scale, rotate } = useMotionValues({
 *     x: 0,
 *     y: 0,
 *     scale: 1,
 *     rotate: 0,
 *   })
 *
 *   // Each is an independent MotionValue
 *   x.set(100)
 *   scale.set(1.5)
 * }
 * ```
 */
export function useMotionValues<T extends Record<string, number>>(
  initialValues: T,
  options?: MotionValueOptions
): { [K in keyof T]: MotionValue<number> } {
  type ResultType = { [K in keyof T]: MotionValue<number> }
  const motionValuesRef = useRef<ResultType | null>(null)

  if (motionValuesRef.current === null) {
    const values: Record<string, MotionValue<number>> = {}

    for (const key in initialValues) {
      if (Object.prototype.hasOwnProperty.call(initialValues, key)) {
        const value = initialValues[key]
        values[key] = createMotionValue(value as number, options)
      }
    }

    motionValuesRef.current = values as ResultType
  }

  useEffect(() => {
    return () => {
      if (motionValuesRef.current) {
        const current = motionValuesRef.current
        for (const key in current) {
          if (Object.prototype.hasOwnProperty.call(current, key)) {
            current[key].destroy()
          }
        }
      }
    }
  }, [])

  return motionValuesRef.current
}
