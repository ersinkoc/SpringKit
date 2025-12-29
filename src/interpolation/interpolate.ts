import type { SpringValue } from '../core/spring-value.js'

/**
 * Interpolation options interface
 */
export interface InterpolateOptions {
  /** Clamp output to output range */
  clamp?: boolean
  /** Default extrapolation mode */
  extrapolate?: 'extend' | 'clamp' | 'identity'
  /** Extrapolation mode for left side */
  extrapolateLeft?: 'extend' | 'clamp' | 'identity'
  /** Extrapolation mode for right side */
  extrapolateRight?: 'extend' | 'clamp' | 'identity'
}

/**
 * Interpolation interface
 */
export interface Interpolation {
  /** Get current interpolated value */
  get(): number
}

/**
 * Default interpolation options
 * Note: extrapolate is handled inline to allow proper branch coverage
 */
const defaultInterpolateOptions: Required<Pick<InterpolateOptions, 'clamp'>> = {
  clamp: false,
}

/**
 * Value interpolation implementation
 */
class InterpolationImpl implements Interpolation {
  private source: SpringValue | (() => number)
  private input: number[]
  private output: number[]
  private options: InterpolateOptions

  constructor(
    source: SpringValue | (() => number),
    input: number[],
    output: number[],
    options: InterpolateOptions = {}
  ) {
    this.source = source
    this.input = input
    this.output = output
    this.options = { ...defaultInterpolateOptions, ...options }
  }

  get(): number {
    const value = typeof this.source === 'function' ? this.source() : this.source.get()
    return this.interpolate(value)
  }

  private interpolate(value: number): number {
    const { input, output } = this
    const { extrapolate, extrapolateLeft, extrapolateRight, clamp } = this.options

    // Handle single point case - just return the output value
    if (input.length === 1) {
      return output[0]!
    }

    // Handle extrapolation
    if (value < input[0]!) {
      // Pass extrapolate as-is (may be undefined to test default branch)
      const mode = this.getExtrapolationMode(extrapolateLeft, extrapolate)
      if (mode === 'clamp') {
        value = input[0]!
      } else if (mode === 'identity') {
        return value
      }
    } else if (value > input[input.length - 1]!) {
      // Pass extrapolate as-is (may be undefined to test default branch)
      const mode = this.getExtrapolationMode(extrapolateRight, extrapolate)
      if (mode === 'clamp') {
        value = input[input.length - 1]!
      } else if (mode === 'identity') {
        return value
      }
    }

    // Find the segment
    let i = 1
    while (i < input.length - 1 && value > input[i]!) {
      i++
    }

    // Linear interpolation within segment
    const ratio = (value - input[i - 1]!) / (input[i]! - input[i - 1]!)
    const result = output[i - 1]! + ratio * (output[i]! - output[i - 1]!)

    if (clamp) {
      const min = Math.min(...output)
      const max = Math.max(...output)
      return Math.max(min, Math.min(max, result))
    }

    return result
  }

  private getExtrapolationMode(
    specificMode: 'extend' | 'clamp' | 'identity' | undefined,
    fallbackMode: 'extend' | 'clamp' | 'identity' | undefined
  ): 'extend' | 'clamp' | 'identity' {
    if (specificMode !== undefined) {
      return specificMode
    }
    if (fallbackMode !== undefined) {
      return fallbackMode
    }
    return 'extend'
  }
}

/**
 * Create a value interpolation
 *
 * @param value - Spring value or function that returns a number
 * @param input - Input range (array of numbers)
 * @param output - Output range (array of numbers)
 * @param options - Interpolation options
 * @returns Interpolation controller
 *
 * @example
 * ```ts
 * const x = createSpringValue(0)
 *
 * // Map 0-100 to 0-1 (opacity)
 * const opacity = interpolate(x, [0, 100], [0, 1])
 *
 * x.subscribe(() => {
 *   element.style.opacity = String(opacity.get())
 * })
 *
 * x.set(100) // opacity animates to 1
 * ```
 */
export function interpolate(
  value: SpringValue | (() => number),
  input: number[],
  output: number[],
  options?: InterpolateOptions
): Interpolation {
  return new InterpolationImpl(value, input, output, options)
}
