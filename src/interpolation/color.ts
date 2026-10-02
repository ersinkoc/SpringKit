import type { SpringValue } from '../core/spring-value.js'
import type { InterpolateOptions } from './interpolate.js'
import { parseColorRGBA, mixColorsRGBA, formatRGBA, type ColorSpace } from '../utils/color.js'

type RGBATuple = [number, number, number, number]

/**
 * Color interpolation options
 */
export interface ColorInterpolateOptions extends InterpolateOptions {
  /**
   * Color space to interpolate in (default `'srgb'`).
   * `'oklab'` gives perceptually even blends (e.g. blue → yellow without a
   * gray midpoint); `'linear'` mixes physically like light.
   * Alpha is always interpolated premultiplied.
   */
  space?: ColorSpace
}

/**
 * Global color parsing cache to avoid repeated regex operations
 * Maps color strings to their RGB values
 *
 * LRU (Least Recently Used) cache with max size to prevent memory bloat
 * in long-running applications with many unique colors
 */
const MAX_COLOR_CACHE_SIZE = 1000
const colorCache = new Map<string, RGBATuple>()

/**
 * Color interpolation interface
 */
export interface ColorInterpolation {
  /** Get current interpolated color */
  get(): string
}

/**
 * Color interpolation implementation
 */
class ColorInterpolationImpl implements ColorInterpolation {
  private source: SpringValue | (() => number)
  private input: number[]
  private colors: RGBATuple[]
  private options: ColorInterpolateOptions

  constructor(
    source: SpringValue | (() => number),
    input: number[],
    colorStrings: string[],
    options: ColorInterpolateOptions = {}
  ) {
    this.source = source
    // Ignore unmatched trailing entries so mismatched lengths can't produce NaN
    const length = Math.min(input.length, colorStrings.length)
    let normalizedInput = input.slice(0, length)
    let colors = colorStrings.slice(0, length).map((c) => this.parseColorCached(c))
    // Segment lookup assumes an ascending input range; reverse descending ranges
    if (length > 1 && normalizedInput[0]! > normalizedInput[length - 1]!) {
      normalizedInput = normalizedInput.reverse()
      colors = colors.reverse()
    }
    this.input = normalizedInput
    this.colors = colors
    this.options = options
  }

  /**
   * Parse color with caching for performance
   * Avoids repeated regex operations for the same color strings
   * Implements LRU eviction to prevent memory bloat
   */
  private parseColorCached(color: string): RGBATuple {
    // Check cache first
    const cached = colorCache.get(color)
    if (cached) {
      // Move to end to mark as recently used
      colorCache.delete(color)
      colorCache.set(color, cached)
      return cached
    }

    // Parse and cache result
    const result = this.parseColorInternal(color)

    // Evict oldest entry if cache is full (LRU strategy)
    if (colorCache.size >= MAX_COLOR_CACHE_SIZE) {
      const firstKey = colorCache.keys().next().value
      if (firstKey !== undefined) {
        colorCache.delete(firstKey)
      }
    }

    colorCache.set(color, result)
    return result
  }

  get(): string {
    let value = typeof this.source === 'function' ? this.source() : this.source.get()
    const { extrapolate, extrapolateLeft, extrapolateRight } = this.options

    // Handle single color case, and guard against NaN/Infinity from source
    // (which would otherwise produce an invalid `rgb(NaN, NaN, NaN)` string)
    if (this.input.length <= 1 || !Number.isFinite(value)) {
      const [r, g, b, a] = this.colors[0] ?? [0, 0, 0, 1]
      return this.format(r, g, b, a)
    }

    // Handle extrapolation
    if (value < this.input[0]!) {
      const mode = extrapolateLeft ?? extrapolate ?? 'extend'
      if (mode === 'clamp') {
        value = this.input[0]!
      } else if (mode === 'identity') {
        // For color, we can't return identity, so we clamp
        value = this.input[0]!
      }
    } else if (value > this.input[this.input.length - 1]!) {
      const mode = extrapolateRight ?? extrapolate ?? 'extend'
      if (mode === 'clamp') {
        value = this.input[this.input.length - 1]!
      } else if (mode === 'identity') {
        // For color, we can't return identity, so we clamp
        value = this.input[this.input.length - 1]!
      }
    }

    // Find the segment
    let i = 1
    while (i < this.input.length - 1 && value > this.input[i]!) {
      i++
    }

    // Calculate interpolation ratio with division by zero protection
    const inputRange = this.input[i]! - this.input[i - 1]!
    const ratio = inputRange !== 0 ? (value - this.input[i - 1]!) / inputRange : 0

    // Interpolate alpha-premultiplied in the requested color space, so
    // e.g. transparent -> white doesn't pass through gray
    const from = this.colors[i - 1]!
    const to = this.colors[i]!
    const mixed = mixColorsRGBA(
      { r: from[0], g: from[1], b: from[2], a: from[3] },
      { r: to[0], g: to[1], b: to[2], a: to[3] },
      ratio,
      this.options.space
    )

    return this.format(mixed.r, mixed.g, mixed.b, mixed.a)
  }

  /**
   * Format channels as a CSS color. Opaque colors keep the `rgb()` form,
   * translucent ones use `rgba()` so alpha is not silently dropped.
   */
  private format(r: number, g: number, b: number, a: number): string {
    return formatRGBA({ r, g, b, a })
  }

  private parseColorInternal(color: string): RGBATuple {
    const { r, g, b, a } = parseColorRGBA(color)
    return [r, g, b, a]
  }

}

/**
 * Create a color interpolation
 *
 * @param value - Spring value or function that returns a number
 * @param input - Input range (array of numbers)
 * @param colors - Array of color strings (hex, rgb(a), hsl(a), transparent)
 * @param options - Interpolation options (plus `space`: `'srgb'` | `'linear'` | `'oklab'`)
 * @returns Color interpolation controller
 *
 * @example
 * ```ts
 * const progress = createSpringValue(0)
 *
 * // Interpolate through colors
 * const color = interpolateColor(
 *   progress,
 *   [0, 50, 100],
 *   ['#ff0000', '#00ff00', '#0000ff']
 * )
 *
 * progress.subscribe(() => {
 *   element.style.backgroundColor = color.get()
 * })
 *
 * progress.set(50) // color is '#00ff00'
 *
 * // Perceptually even blend
 * const sky = interpolateColor(progress, [0, 100], ['#0000ff', '#ffff00'], { space: 'oklab' })
 * ```
 */
export function interpolateColor(
  value: SpringValue | (() => number),
  input: number[],
  colors: string[],
  options?: ColorInterpolateOptions
): ColorInterpolation {
  return new ColorInterpolationImpl(value, input, colors, options)
}
