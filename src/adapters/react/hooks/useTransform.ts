import { useRef, useEffect, useMemo, useCallback } from 'react'
import { MotionValue, createMotionValue } from '../../../core/MotionValue.js'

/**
 * Track the velocity of a MotionValue
 *
 * Creates a new MotionValue that outputs the velocity of the source value.
 * Useful for velocity-based effects like skewing elements while scrolling.
 *
 * @example
 * ```tsx
 * const x = useMotionValue(0)
 * const velocity = useVelocity(x)
 *
 * // Use velocity for visual effects
 * const skew = useTransform(velocity, [-1000, 0, 1000], [-10, 0, 10])
 * ```
 *
 * @example With scroll
 * ```tsx
 * const { scrollY } = useScroll()
 * const scrollVelocity = useVelocity(scrollY)
 *
 * // Show indicator when scrolling fast
 * const opacity = useTransform(scrollVelocity, [-500, 0, 500], [1, 0, 1])
 * ```
 */
export function useVelocity(source: MotionValue<number>): MotionValue<number> {
  const velocityRef = useRef<MotionValue<number> | null>(null)
  const frameRef = useRef<number | null>(null)
  const lastVelocityRef = useRef(0)

  if (velocityRef.current === null) {
    velocityRef.current = createMotionValue(source.getVelocity())
  }

  useEffect(() => {
    const update = () => {
      const velocity = source.getVelocity()
      // Only update if velocity changed significantly
      if (Math.abs(velocity - lastVelocityRef.current) > 0.001) {
        velocityRef.current?.jump(velocity)
        lastVelocityRef.current = velocity
      }
      frameRef.current = requestAnimationFrame(update)
    }

    frameRef.current = requestAnimationFrame(update)

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [source])

  useEffect(() => {
    return () => {
      velocityRef.current?.destroy()
    }
  }, [])

  return velocityRef.current
}

/**
 * Subscribe to MotionValue events
 *
 * A hook that allows you to subscribe to motion value lifecycle events
 * without manually managing subscriptions.
 *
 * @example
 * ```tsx
 * const x = useMotionValue(0)
 *
 * useMotionValueEvent(x, 'change', (latest) => {
 *   console.log('Value changed:', latest)
 * })
 *
 * useMotionValueEvent(x, 'animationStart', () => {
 *   console.log('Animation started')
 * })
 *
 * useMotionValueEvent(x, 'animationComplete', () => {
 *   console.log('Animation completed')
 * })
 * ```
 */
export function useMotionValueEvent<T>(
  value: MotionValue<T>,
  event: 'change' | 'animationStart' | 'animationComplete' | 'animationCancel',
  callback: (latest: T) => void
): void {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (event === 'change') {
      return value.subscribe((v) => callbackRef.current(v))
    }

    // For animation events, use the on method
    return value.on(event, () => callbackRef.current(value.get()))
  }, [value, event])
}

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
  }, [inputRangeOrTransform, outputRange, options?.clamp, options?.ease]) // eslint-disable-line react-hooks/exhaustive-deps

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
    // getCurrentValues is stable - defined within component
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

// ============ useMotionTemplate ============

/**
 * Combine multiple MotionValues into a template string
 *
 * Creates a MotionValue that outputs a string by combining multiple
 * motion values using a template literal-like syntax.
 *
 * @example
 * ```tsx
 * const x = useMotionValue(0)
 * const y = useMotionValue(0)
 *
 * // Create a transform string
 * const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px)`
 *
 * // Use in style
 * <div style={{ transform: transform.get() }} />
 * ```
 *
 * @example With colors
 * ```tsx
 * const r = useMotionValue(255)
 * const g = useMotionValue(100)
 * const b = useMotionValue(50)
 *
 * const color = useMotionTemplate`rgb(${r}, ${g}, ${b})`
 * ```
 */
export function useMotionTemplate(
  strings: TemplateStringsArray,
  ...values: MotionValue<number>[]
): MotionValue<string> {
  const templateRef = useRef<MotionValue<string> | null>(null)
  const unsubscribesRef = useRef<Array<() => void>>([])

  // Store values in ref to avoid dependency issues with rest parameters
  const valuesRef = useRef(values)
  valuesRef.current = values

  // Stable reference to strings (TemplateStringsArray is stable per call site)
  const stringsRef = useRef(strings)
  stringsRef.current = strings

  const buildString = useCallback((): string => {
    let result = ''
    stringsRef.current.forEach((str, i) => {
      result += str
      if (i < valuesRef.current.length) {
        result += String(valuesRef.current[i]?.get() ?? '')
      }
    })
    return result
  }, [])

  if (templateRef.current === null) {
    templateRef.current = createMotionValue(buildString()) as MotionValue<string>
  }

  // Use values.length as stable dependency instead of array reference
  const valuesLength = values.length

  useEffect(() => {
    // Clear previous subscriptions
    unsubscribesRef.current.forEach((unsub) => unsub())

    // Subscribe to all values
    unsubscribesRef.current = valuesRef.current.map((value) =>
      value.subscribe(() => {
        templateRef.current?.jump(buildString())
      })
    )

    return () => {
      unsubscribesRef.current.forEach((unsub) => unsub())
      unsubscribesRef.current = []
    }
  }, [valuesLength, buildString])

  useEffect(() => {
    return () => {
      templateRef.current?.destroy()
    }
  }, [])

  return templateRef.current as MotionValue<string>
}

// ============ useTime ============

/**
 * Returns a MotionValue that updates every frame with elapsed time
 *
 * The value starts at 0 and increases by the delta time each frame.
 * Useful for creating time-based animations.
 *
 * @example
 * ```tsx
 * const time = useTime()
 *
 * // Create a pulsing effect
 * const scale = useTransform(time, (t) => 1 + Math.sin(t / 500) * 0.1)
 *
 * // Create a rotating element
 * const rotate = useTransform(time, (t) => (t / 10) % 360)
 * ```
 *
 * @example Oscillating animation
 * ```tsx
 * const time = useTime()
 * const x = useTransform(time, (t) => Math.sin(t / 1000) * 100)
 * const y = useTransform(time, (t) => Math.cos(t / 1000) * 100)
 * ```
 */
export function useTime(): MotionValue<number> {
  const timeRef = useRef<MotionValue<number> | null>(null)
  const frameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)

  if (timeRef.current === null) {
    timeRef.current = createMotionValue(0)
  }

  useEffect(() => {
    const update = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp
      }
      const elapsed = timestamp - startTimeRef.current
      timeRef.current?.jump(elapsed)
      frameRef.current = requestAnimationFrame(update)
    }

    frameRef.current = requestAnimationFrame(update)

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [])

  useEffect(() => {
    return () => {
      timeRef.current?.destroy()
    }
  }, [])

  return timeRef.current
}

// ============ useAnimationFrame ============

/**
 * Runs a callback on every animation frame
 *
 * The callback receives the timestamp and delta time since last frame.
 * Automatically cleans up on unmount.
 *
 * @example
 * ```tsx
 * useAnimationFrame((time, delta) => {
 *   // Update custom animation logic
 *   element.style.transform = `rotate(${time / 10}deg)`
 * })
 * ```
 *
 * @example With conditional running
 * ```tsx
 * const [isPlaying, setIsPlaying] = useState(true)
 *
 * useAnimationFrame((time, delta) => {
 *   if (!isPlaying) return
 *   // Animation logic
 * })
 * ```
 */
export function useAnimationFrame(
  callback: (time: number, delta: number) => void
): void {
  const callbackRef = useRef(callback)
  const frameRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)

  callbackRef.current = callback

  useEffect(() => {
    const update = (timestamp: number) => {
      const delta = lastTimeRef.current !== null
        ? timestamp - lastTimeRef.current
        : 0
      lastTimeRef.current = timestamp

      callbackRef.current(timestamp, delta)
      frameRef.current = requestAnimationFrame(update)
    }

    frameRef.current = requestAnimationFrame(update)

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [])
}

// ============ useWillChange ============

/**
 * Automatically manages the CSS will-change property for better performance
 *
 * Returns a MotionValue that can be used as a style value. When any of the
 * source values are animating, will-change is automatically applied.
 *
 * @example
 * ```tsx
 * const x = useMotionValue(0)
 * const willChange = useWillChange([x])
 *
 * <motion.div style={{ x, willChange: willChange.get() }} />
 * ```
 *
 * @example With multiple values
 * ```tsx
 * const x = useMotionValue(0)
 * const opacity = useMotionValue(1)
 * const willChange = useWillChange([x, opacity])
 *
 * <div style={{
 *   transform: `translateX(${x.get()}px)`,
 *   opacity: opacity.get(),
 *   willChange: willChange.get()
 * }} />
 * ```
 */
export function useWillChange(
  sources: MotionValue<number>[],
  properties: string[] = ['transform', 'opacity']
): MotionValue<string> {
  const willChangeRef = useRef<MotionValue<string> | null>(null)
  const frameRef = useRef<number | null>(null)
  const wasAnimatingRef = useRef(false)
  const isDestroyedRef = useRef(false)

  // Store sources in ref to avoid dependency issues with array reference changes
  const sourcesRef = useRef(sources)
  sourcesRef.current = sources

  // Store properties in ref too
  const propertiesRef = useRef(properties)
  propertiesRef.current = properties

  if (willChangeRef.current === null) {
    willChangeRef.current = createMotionValue('auto') as MotionValue<string>
  }

  // Use sources.length as stable dependency instead of array reference
  const sourcesLength = sources.length

  useEffect(() => {
    isDestroyedRef.current = false

    const checkAnimating = () => {
      if (isDestroyedRef.current) return

      const isAnimating = sourcesRef.current.some((source) => source.isAnimating())

      if (isAnimating && !wasAnimatingRef.current) {
        ;(willChangeRef.current as MotionValue<string>)?.jump(propertiesRef.current.join(', '))
        wasAnimatingRef.current = true
      } else if (!isAnimating && wasAnimatingRef.current) {
        ;(willChangeRef.current as MotionValue<string>)?.jump('auto')
        wasAnimatingRef.current = false
      }

      if (!isDestroyedRef.current) {
        frameRef.current = requestAnimationFrame(checkAnimating)
      }
    }

    frameRef.current = requestAnimationFrame(checkAnimating)

    return () => {
      isDestroyedRef.current = true
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [sourcesLength])

  useEffect(() => {
    return () => {
      willChangeRef.current?.destroy()
    }
  }, [])

  return willChangeRef.current as MotionValue<string>
}

// ============ Motion Value Combiners ============

/**
 * Sum multiple MotionValues together
 *
 * @example
 * ```tsx
 * const base = useMotionValue(100)
 * const offset = useMotionValue(50)
 * const total = useSum(base, offset) // 150
 * ```
 */
export function useSum(...sources: MotionValue<number>[]): MotionValue<number> {
  return useCombinedTransform(sources, (values) =>
    values.reduce((sum, v) => sum + v, 0)
  )
}

/**
 * Multiply multiple MotionValues together
 *
 * @example
 * ```tsx
 * const scale = useMotionValue(2)
 * const modifier = useMotionValue(1.5)
 * const total = useProduct(scale, modifier) // 3
 * ```
 */
export function useProduct(...sources: MotionValue<number>[]): MotionValue<number> {
  return useCombinedTransform(sources, (values) =>
    values.reduce((product, v) => product * v, 1)
  )
}

/**
 * Get the difference between two MotionValues
 *
 * @example
 * ```tsx
 * const end = useMotionValue(100)
 * const start = useMotionValue(25)
 * const diff = useDifference(end, start) // 75
 * ```
 */
export function useDifference(
  a: MotionValue<number>,
  b: MotionValue<number>
): MotionValue<number> {
  return useCombinedTransform([a, b], ([aVal, bVal]) => aVal - bVal)
}

/**
 * Clamp a MotionValue between min and max
 *
 * @example
 * ```tsx
 * const value = useMotionValue(150)
 * const clamped = useClamp(value, 0, 100) // 100
 * ```
 */
export function useClamp(
  source: MotionValue<number>,
  min: number,
  max: number
): MotionValue<number> {
  return useTransform(source, (v) => Math.max(min, Math.min(max, v)))
}

/**
 * Round a MotionValue to nearest step
 *
 * @example
 * ```tsx
 * const value = useMotionValue(47)
 * const snapped = useSnap(value, 10) // 50
 * ```
 */
export function useSnap(
  source: MotionValue<number>,
  step: number
): MotionValue<number> {
  return useTransform(source, (v) => Math.round(v / step) * step)
}

/**
 * Smooth a MotionValue using exponential moving average
 *
 * @example
 * ```tsx
 * const rawValue = useMotionValue(0)
 * const smoothed = useSmooth(rawValue, 0.1) // Lower = smoother
 * ```
 */
export function useSmooth(
  source: MotionValue<number>,
  factor: number = 0.1
): MotionValue<number> {
  const smoothedRef = useRef<MotionValue<number> | null>(null)
  const currentRef = useRef(source.get())

  if (smoothedRef.current === null) {
    smoothedRef.current = createMotionValue(source.get())
  }

  useEffect(() => {
    const unsub = source.subscribe((target) => {
      currentRef.current = currentRef.current + (target - currentRef.current) * factor
      smoothedRef.current?.jump(currentRef.current)
    })

    return unsub
  }, [source, factor])

  useEffect(() => {
    return () => {
      smoothedRef.current?.destroy()
    }
  }, [])

  return smoothedRef.current
}

/**
 * Delay a MotionValue by a number of frames
 *
 * @example
 * ```tsx
 * const leader = useMotionValue(0)
 * const follower = useDelay(leader, 5) // 5 frames behind
 * ```
 */
export function useDelay(
  source: MotionValue<number>,
  frames: number
): MotionValue<number> {
  const delayedRef = useRef<MotionValue<number> | null>(null)
  const bufferRef = useRef<number[]>([])

  if (delayedRef.current === null) {
    delayedRef.current = createMotionValue(source.get())
    bufferRef.current = Array(frames).fill(source.get())
  }

  useEffect(() => {
    const unsub = source.subscribe((value) => {
      bufferRef.current.push(value)
      const delayed = bufferRef.current.shift()
      if (delayed !== undefined) {
        delayedRef.current?.jump(delayed)
      }
    })

    return unsub
  }, [source, frames])

  useEffect(() => {
    return () => {
      delayedRef.current?.destroy()
    }
  }, [])

  return delayedRef.current
}
