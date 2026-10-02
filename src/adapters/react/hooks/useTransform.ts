import { useRef, useEffect, useMemo, useCallback } from 'react'
import {
  MotionValue,
  createMotionValue,
  parseColorRGBA,
  mixColorsRGBA,
  formatRGBA,
  type ColorSpace,
} from '@oxog/springkit'
import { useDestroyOnUnmount } from './useDestroyOnUnmount.js'

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
  const isRunningRef = useRef(false)

  if (velocityRef.current === null || velocityRef.current.isDestroyed()) {
    velocityRef.current = createMotionValue(source.getVelocity())
  }

  useEffect(() => {
    // Start RAF loop when source starts animating
    const startLoop = () => {
      if (isRunningRef.current) return
      isRunningRef.current = true

      const update = () => {
        if (!isRunningRef.current) return

        const velocity = source.getVelocity()
        // Only update if velocity changed significantly
        if (Math.abs(velocity - lastVelocityRef.current) > 0.001) {
          velocityRef.current?.jump(velocity)
          lastVelocityRef.current = velocity
        }

        // Continue loop only if source is still animating or velocity is significant
        if (source.isAnimating() || Math.abs(velocity) > 0.001) {
          frameRef.current = requestAnimationFrame(update)
        } else {
          isRunningRef.current = false
          frameRef.current = null
        }
      }

      frameRef.current = requestAnimationFrame(update)
    }

    // Subscribe to animation start events
    const unsubscribe = source.on('animationStart', startLoop)

    // Start immediately if already animating
    if (source.isAnimating()) {
      startLoop()
    }

    return () => {
      unsubscribe()
      isRunningRef.current = false
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [source])

  useDestroyOnUnmount(() => {
    velocityRef.current?.destroy()
  })

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
  event: 'change' | 'animationStart' | 'animationEnd' | 'animationComplete' | 'animationCancel',
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
  /**
   * Color space for color outputs (default `'srgb'`). `'oklab'` gives
   * perceptually even blends, `'linear'` mixes like light. Alpha is always
   * interpolated premultiplied.
   */
  space?: ColorSpace
}

// ============ String interpolation helpers ============

type RGBAColor = ReturnType<typeof parseColorRGBA>
type StringToken = number | RGBAColor

/** A string split into literal parts around animatable tokens */
interface ParsedString {
  parts: string[]
  tokens: StringToken[]
}

/** Colors (hex, rgb[a](), hsl[a](), transparent) or numbers inside a string */
const STRING_TOKEN_REGEX =
  /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b|(?:rgba?|hsla?)\([^)]*\)|\btransparent\b|-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi

function parseAnimatableString(value: string): ParsedString {
  const parts: string[] = []
  const tokens: StringToken[] = []
  let last = 0
  for (const match of value.matchAll(STRING_TOKEN_REGEX)) {
    const text = match[0]
    const index = match.index ?? 0
    parts.push(value.slice(last, index))
    tokens.push(/^[-.\d]/.test(text) ? parseFloat(text) : parseColorRGBA(text))
    last = index + text.length
  }
  parts.push(value.slice(last))
  return { parts, tokens }
}

/** Same literal parts and the same token kinds in the same places */
function isCompatible(a: ParsedString, b: ParsedString): boolean {
  return (
    a.parts.length === b.parts.length &&
    a.parts.every((part, i) => part === b.parts[i]) &&
    a.tokens.every((token, i) => typeof token === typeof b.tokens[i])
  )
}

/** Round away float noise (and exponent notation, which CSS rejects) */
const formatNumber = (value: number): string => String(Math.round(value * 1e6) / 1e6 || 0)

function mixParsedStrings(a: ParsedString, b: ParsedString, t: number, space?: ColorSpace): string {
  let result = a.parts[0] ?? ''
  for (let i = 0; i < a.tokens.length; i++) {
    const from = a.tokens[i]!
    const to = b.tokens[i]!
    result +=
      typeof from === 'number'
        ? formatNumber(from + ((to as number) - from) * t)
        : formatRGBA(mixColorsRGBA(from, to as RGBAColor, t, space))
    result += a.parts[i + 1] ?? ''
  }
  return result
}

/**
 * Transform a MotionValue to a new derived value
 *
 * Supports two forms:
 * 1. Range mapping: useTransform(value, [0, 100], [0, 1])
 * 2. Function: useTransform(value, (v) => v * 2)
 *
 * Range mapping also interpolates string outputs: colors (hex, rgb[a],
 * hsl[a], `transparent`, alpha-premultiplied, optional `space`), numbers
 * with units (`'10px'` → `'100px'`) and complex strings whose numbers and
 * colors line up (`'translateX(0px) rotate(0deg)'`, box shadows). Colors are
 * output as `rgb()` / `rgba()`. Strings that don't share the same shape
 * switch at the midpoint of each segment.
 *
 * @example Colors and units
 * ```tsx
 * const background = useTransform(x, [0, 100], ['#ff0000', 'rgba(0, 0, 255, 0.5)'])
 * const width = useTransform(x, [0, 100], ['10px', '100px'])
 * ```
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

    /** Segment index and (eased, optionally clamped) progress within it */
    const locate = (value: number): { i: number; next: number; t: number } => {
      // Find the segment (values beyond the last stop use the last segment,
      // so they extrapolate the same way values below the first stop do)
      let i = 0
      for (; i < inputRange.length - 2; i++) {
        const nextVal = inputRange[i + 1]
        if (nextVal !== undefined && value <= nextVal) break
      }
      const next = Math.min(i + 1, inputRange.length - 1)

      const inputMin = inputRange[i] ?? 0
      const inputMax = inputRange[next] ?? 1

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

      return { i, next, t }
    }

    if (typeof outputRange[0] === 'number') {
      return (value: number): O => {
        const { i, next, t } = locate(value)
        const outputMin = (outputRange[i] ?? 0) as number
        const outputMax = (outputRange[Math.min(next, outputRange.length - 1)] ?? 1) as number
        return (outputMin + t * (outputMax - outputMin)) as O
      }
    }

    // String interpolation: colors, numbers with units and complex strings
    const strings = (outputRange as Array<string | number>).map(String)
    const parsed = strings.map(parseAnimatableString)
    const space = options?.space

    return (value: number): O => {
      const { i, next, t } = locate(value)
      const j = Math.min(next, strings.length - 1)
      const from = parsed[i]
      const to = parsed[j]
      if (from && to && isCompatible(from, to)) {
        return mixParsedStrings(from, to, t, space) as O
      }
      // Incompatible shapes can't be interpolated: switch at the midpoint
      return (t < 0.5 ? strings[i] : (strings[j] ?? strings[i])) as O
    }
  }, [inputRangeOrTransform, outputRange, options?.clamp, options?.ease, options?.space]) // eslint-disable-line react-hooks/exhaustive-deps

  // Create derived value on first render
  if (derivedRef.current === null || derivedRef.current.isDestroyed()) {
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
  useDestroyOnUnmount(() => {
    derivedRef.current?.destroy()
  })

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
  if (derivedRef.current === null || derivedRef.current.isDestroyed()) {
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

  useDestroyOnUnmount(() => {
    derivedRef.current?.destroy()
  })

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
  const isRunningRef = useRef(false)

  if (derivedRef.current === null || derivedRef.current.isDestroyed()) {
    derivedRef.current = createMotionValue(transform(source.getVelocity()))
  }

  useEffect(() => {
    // Start RAF loop when source starts animating
    const startLoop = () => {
      if (isRunningRef.current) return
      isRunningRef.current = true

      const update = () => {
        if (!isRunningRef.current) return

        const velocity = source.getVelocity()
        derivedRef.current?.jump(transform(velocity))

        // Continue loop only if source is still animating or velocity is significant
        if (source.isAnimating() || Math.abs(velocity) > 0.001) {
          frameRef.current = requestAnimationFrame(update)
        } else {
          isRunningRef.current = false
          frameRef.current = null
        }
      }

      frameRef.current = requestAnimationFrame(update)
    }

    // Subscribe to animation start events
    const unsubscribe = source.on('animationStart', startLoop)

    // Start immediately if already animating
    if (source.isAnimating()) {
      startLoop()
    }

    return () => {
      unsubscribe()
      isRunningRef.current = false
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [source, transform])

  useDestroyOnUnmount(() => {
    derivedRef.current?.destroy()
  })

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
      // Values beyond the last stop use the last segment
      let i = 0
      for (; i < inputRange.length - 2; i++) {
        const nextVal = inputRange[i + 1]
        if (nextVal !== undefined && value <= nextVal) break
      }

      const inCurr = inputRange[i] ?? 0
      const inNext = inputRange[i + 1] ?? 1
      const outCurr = outputRange[i] ?? 0
      const outNext = outputRange[i + 1] ?? 1

      const t = inNext !== inCurr ? (value - inCurr) / (inNext - inCurr) : 0
      return outCurr + t * (outNext - outCurr)
    }
  }, [inputRange, outputRange])

  if (derivedRef.current === null || derivedRef.current.isDestroyed()) {
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

  useDestroyOnUnmount(() => {
    derivedRef.current?.destroy()
  })

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

  if (templateRef.current === null || templateRef.current.isDestroyed()) {
    templateRef.current = createMotionValue(buildString()) as MotionValue<string>
  }

  // Rest parameters are a new array on every render: bump a version only when
  // the MotionValues themselves change (identity or count), and use it as the
  // effect dependency so a swapped MotionValue gets (re)subscribed
  const subscribedValuesRef = useRef(values)
  const valuesVersionRef = useRef(0)
  const prevValues = subscribedValuesRef.current
  if (prevValues.length !== values.length || values.some((v, i) => v !== prevValues[i])) {
    subscribedValuesRef.current = values
    valuesVersionRef.current++
  }
  const valuesVersion = valuesVersionRef.current

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
  }, [valuesVersion, buildString])

  useDestroyOnUnmount(() => {
    templateRef.current?.destroy()
  })

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

  if (timeRef.current === null || timeRef.current.isDestroyed()) {
    timeRef.current = createMotionValue(0)
  }

  useEffect(() => {
    let isActive = true

    const update = (timestamp: number) => {
      if (!isActive) return

      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp
      }
      const elapsed = timestamp - startTimeRef.current
      timeRef.current?.jump(elapsed)
      frameRef.current = requestAnimationFrame(update)
    }

    frameRef.current = requestAnimationFrame(update)

    return () => {
      isActive = false
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [])

  useDestroyOnUnmount(() => {
    timeRef.current?.destroy()
  })

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

  if (willChangeRef.current === null || willChangeRef.current.isDestroyed()) {
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

  useDestroyOnUnmount(() => {
    willChangeRef.current?.destroy()
  })

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

  if (smoothedRef.current === null || smoothedRef.current.isDestroyed()) {
    smoothedRef.current = createMotionValue(source.get())
  }

  useEffect(() => {
    const unsub = source.subscribe((target) => {
      currentRef.current = currentRef.current + (target - currentRef.current) * factor
      smoothedRef.current?.jump(currentRef.current)
    })

    return unsub
  }, [source, factor])

  useDestroyOnUnmount(() => {
    smoothedRef.current?.destroy()
  })

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

  if (delayedRef.current === null || delayedRef.current.isDestroyed()) {
    delayedRef.current = createMotionValue(source.get())
    bufferRef.current = Array(frames).fill(source.get())
  }

  useEffect(() => {
    // Resize the buffer when the frame count changes
    const buffer = bufferRef.current
    const safeFrames = Math.max(0, Math.floor(frames) || 0)
    while (buffer.length > safeFrames) buffer.shift()
    while (buffer.length < safeFrames) buffer.unshift(buffer[0] ?? source.get())

    const unsub = source.subscribe((value) => {
      bufferRef.current.push(value)
      const delayed = bufferRef.current.shift()
      if (delayed !== undefined) {
        delayedRef.current?.jump(delayed)
      }
    })

    return unsub
  }, [source, frames])

  useDestroyOnUnmount(() => {
    delayedRef.current?.destroy()
  })

  return delayedRef.current
}
