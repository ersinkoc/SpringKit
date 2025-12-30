import { useRef, useEffect, useMemo } from 'react'
import { MotionValue, createMotionValue } from '../../../core/MotionValue.js'
import { interpolate as coreInterpolate } from '../../../interpolation/interpolate.js'

type InputRange = number[]
type OutputRange = number[] | string[]

export interface UseTransformOptions {
  /** Clamp output to the output range bounds */
  clamp?: boolean
  /** Custom easing function for the interpolation */
  ease?: (t: number) => number
}

/**
 * Transform a MotionValue to a new derived value
 *
 * Supports two forms:
 * 1. Range mapping: useTransform(value, [0, 100], [0, 1])
 * 2. Function: useTransform(value, (v) => v * 2)
 *
 * @example Range mapping
 * ```tsx
 * const x = useMotionValue(0)
 * const opacity = useTransform(x, [0, 100], [1, 0])
 * const scale = useTransform(x, [-100, 0, 100], [0.5, 1, 1.5])
 * ```
 *
 * @example Function transform
 * ```tsx
 * const x = useMotionValue(0)
 * const inverted = useTransform(x, (v) => -v)
 * const clamped = useTransform(x, (v) => Math.max(0, Math.min(100, v)))
 * ```
 *
 * @example Chaining transforms
 * ```tsx
 * const x = useMotionValue(0)
 * const scale = useTransform(x, [0, 100], [1, 2])
 * const opacity = useTransform(scale, [1, 2], [0.5, 1])
 * ```
 */
export function useTransform<O = number>(
  source: MotionValue<number>,
  inputRangeOrTransform: InputRange | ((value: number) => O),
  outputRange?: OutputRange,
  options?: UseTransformOptions
): MotionValue<O> {
  const derivedRef = useRef<MotionValue<O> | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  // Determine transform function
  const transformFn = useMemo(() => {
    if (typeof inputRangeOrTransform === 'function') {
      return inputRangeOrTransform
    }

    if (!outputRange) {
      throw new Error('useTransform: outputRange is required when using range mapping')
    }

    const inputRange = inputRangeOrTransform

    // Use core interpolate for numeric outputs
    if (typeof outputRange[0] === 'number') {
      return (value: number): O => {
        // Find the segment
        let i = 0
        for (; i < inputRange.length - 1; i++) {
          const nextVal = inputRange[i + 1]
          if (nextVal !== undefined && value <= nextVal) break
        }

        const inputMin = inputRange[i] ?? 0
        const inputMax = inputRange[Math.min(i + 1, inputRange.length - 1)] ?? 1
        const outputMin = (outputRange[i] ?? 0) as number
        const outputMax = (outputRange[Math.min(i + 1, outputRange.length - 1)] ?? 1) as number

        // Normalize to 0-1
        let t = inputMax !== inputMin
          ? (value - inputMin) / (inputMax - inputMin)
          : 0

        // Apply easing if provided
        if (options?.ease) {
          t = options.ease(t)
        }

        // Clamp if requested
        if (options?.clamp) {
          t = Math.max(0, Math.min(1, t))
        }

        // Interpolate
        return (outputMin + t * (outputMax - outputMin)) as O
      }
    }

    // String interpolation (colors, etc.)
    return (value: number): O => {
      // Simple string interpolation - find nearest
      let i = 0
      for (; i < inputRange.length - 1; i++) {
        const nextVal = inputRange[i + 1]
        if (nextVal !== undefined && value <= nextVal) break
      }

      const inCurr = inputRange[i] ?? 0
      const inNext = inputRange[i + 1] ?? 1

      const t = inNext !== inCurr
        ? (value - inCurr) / (inNext - inCurr)
        : 0

      // For strings, just return the nearest one
      // (full color interpolation would require parsing)
      return (t < 0.5 ? outputRange[i] : outputRange[i + 1]) as O
    }
  }, [inputRangeOrTransform, outputRange, options?.clamp, options?.ease])

  // Create derived value on first render
  if (derivedRef.current === null) {
    derivedRef.current = createMotionValue(transformFn(source.get()))
  }

  // Subscribe to source changes
  useEffect(() => {
    unsubscribeRef.current = source.subscribe((value) => {
      derivedRef.current?.jump(transformFn(value))
    })

    return () => {
      unsubscribeRef.current?.()
    }
  }, [source, transformFn])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      derivedRef.current?.destroy()
    }
  }, [])

  return derivedRef.current
}

/**
 * Combine multiple MotionValues into one
 *
 * @example
 * ```tsx
 * const x = useMotionValue(0)
 * const y = useMotionValue(0)
 *
 * const distance = useCombinedTransform(
 *   [x, y],
 *   ([xVal, yVal]) => Math.sqrt(xVal ** 2 + yVal ** 2)
 * )
 * ```
 */
export function useCombinedTransform<T extends number[], O = number>(
  sources: { [K in keyof T]: MotionValue<T[K]> },
  transform: (values: T) => O
): MotionValue<O> {
  const derivedRef = useRef<MotionValue<O> | null>(null)
  const unsubscribesRef = useRef<Array<() => void>>([])

  // Get current values
  const getCurrentValues = (): T => {
    return sources.map((source) => source.get()) as T
  }

  // Create on first render
  if (derivedRef.current === null) {
    derivedRef.current = createMotionValue(transform(getCurrentValues()))
  }

  useEffect(() => {
    // Subscribe to all sources
    unsubscribesRef.current = sources.map((source) =>
      source.subscribe(() => {
        derivedRef.current?.jump(transform(getCurrentValues()))
      })
    )

    return () => {
      unsubscribesRef.current.forEach((unsub) => unsub())
    }
  }, [sources, transform])

  useEffect(() => {
    return () => {
      derivedRef.current?.destroy()
    }
  }, [])

  return derivedRef.current
}

/**
 * Apply velocity-based transform
 *
 * @example
 * ```tsx
 * const x = useMotionValue(0)
 * const skewX = useVelocityTransform(x, (velocity) => velocity * 0.1)
 * ```
 */
export function useVelocityTransform(
  source: MotionValue<number>,
  transform: (velocity: number) => number
): MotionValue<number> {
  const derivedRef = useRef<MotionValue<number> | null>(null)
  const frameRef = useRef<number | null>(null)

  if (derivedRef.current === null) {
    derivedRef.current = createMotionValue(transform(source.getVelocity()))
  }

  useEffect(() => {
    const update = () => {
      derivedRef.current?.jump(transform(source.getVelocity()))
      frameRef.current = requestAnimationFrame(update)
    }

    frameRef.current = requestAnimationFrame(update)

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [source, transform])

  useEffect(() => {
    return () => {
      derivedRef.current?.destroy()
    }
  }, [])

  return derivedRef.current
}

/**
 * Spring-based transform that animates to the transformed value
 *
 * Unlike useTransform which instantly updates, this animates smoothly.
 *
 * @example
 * ```tsx
 * const x = useMotionValue(0)
 * const smoothScale = useSpringTransform(x, [0, 100], [1, 2], {
 *   stiffness: 300,
 *   damping: 30
 * })
 * ```
 */
export function useSpringTransform(
  source: MotionValue<number>,
  inputRange: InputRange,
  outputRange: number[],
  springConfig?: { stiffness?: number; damping?: number }
): MotionValue<number> {
  const derivedRef = useRef<MotionValue<number> | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  const transform = useMemo(() => {
    return (value: number): number => {
      let i = 0
      for (; i < inputRange.length - 1; i++) {
        const nextVal = inputRange[i + 1]
        if (nextVal !== undefined && value <= nextVal) break
      }

      const inCurr = inputRange[i] ?? 0
      const inNext = inputRange[i + 1] ?? 1
      const outCurr = outputRange[i] ?? 0
      const outNext = outputRange[i + 1] ?? 1

      const t = (value - inCurr) / (inNext - inCurr)
      return outCurr + t * (outNext - outCurr)
    }
  }, [inputRange, outputRange])

  if (derivedRef.current === null) {
    derivedRef.current = createMotionValue(transform(source.get()), {
      spring: springConfig,
    })
  }

  useEffect(() => {
    unsubscribeRef.current = source.subscribe((value) => {
      // Use set (animated) instead of jump
      derivedRef.current?.set(transform(value))
    })

    return () => {
      unsubscribeRef.current?.()
    }
  }, [source, transform])

  useEffect(() => {
    return () => {
      derivedRef.current?.destroy()
    }
  }, [])

  return derivedRef.current
}
