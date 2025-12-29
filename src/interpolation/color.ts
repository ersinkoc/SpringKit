import type { SpringValue } from '../core/spring-value.js'
import type { InterpolateOptions } from './interpolate.js'

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
  private colors: [number, number, number][]
  private options: InterpolateOptions

  constructor(
    source: SpringValue | (() => number),
    input: number[],
    colorStrings: string[],
    options: InterpolateOptions = {}
  ) {
    this.source = source
    this.input = input
    this.colors = colorStrings.map((c) => this.parseColor(c))
    this.options = options
  }

  get(): string {
    let value = typeof this.source === 'function' ? this.source() : this.source.get()
    const { extrapolate, extrapolateLeft, extrapolateRight } = this.options

    // Handle single color case
    if (this.input.length === 1) {
      const [r, g, b] = this.colors[0]!
      return `rgb(${r}, ${g}, ${b})`
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

    // Calculate interpolation ratio
    const ratio = (value - this.input[i - 1]!) / (this.input[i]! - this.input[i - 1]!)

    // Interpolate each color channel
    const r = this.lerp(this.colors[i - 1]![0], this.colors[i]![0], ratio)
    const g = this.lerp(this.colors[i - 1]![1], this.colors[i]![1], ratio)
    const b = this.lerp(this.colors[i - 1]![2], this.colors[i]![2], ratio)

    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
  }

  private parseColor(color: string): [number, number, number] {
    // Try to parse hex
    const hexMatch = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
    if (hexMatch) {
      const hex = hexMatch[1]!
      if (hex.length === 3) {
        return [
          parseInt(hex.charAt(0) + hex.charAt(0), 16),
          parseInt(hex.charAt(1) + hex.charAt(1), 16),
          parseInt(hex.charAt(2) + hex.charAt(2), 16),
        ]
      }
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
      ]
    }

    // Try to parse rgb()
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/i)
    if (rgbMatch) {
      return [
        parseInt(rgbMatch[1]!, 10),
        parseInt(rgbMatch[2]!, 10),
        parseInt(rgbMatch[3]!, 10),
      ]
    }

    // Try to parse rgba()
    const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/i)
    if (rgbaMatch) {
      return [
        parseInt(rgbaMatch[1]!, 10),
        parseInt(rgbaMatch[2]!, 10),
        parseInt(rgbaMatch[3]!, 10),
      ]
    }

    // Try to parse hsl()
    const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/i)
    if (hslMatch) {
      return this.hslToRgb(
        parseInt(hslMatch[1]!, 10),
        parseInt(hslMatch[2]!, 10),
        parseInt(hslMatch[3]!, 10)
      )
    }

    // Default to black
    return [0, 0, 0]
  }

  private hslToRgb(h: number, s: number, l: number): [number, number, number] {
    h = ((h % 360) + 360) % 360
    s = Math.max(0, Math.min(100, s)) / 100
    l = Math.max(0, Math.min(100, l)) / 100

    if (s === 0) {
      const gray = Math.round(l * 255)
      return [gray, gray, gray]
    }

    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q

    return [
      Math.round(hue2rgb(p, q, h / 360 + 1 / 3) * 255),
      Math.round(hue2rgb(p, q, h / 360) * 255),
      Math.round(hue2rgb(p, q, h / 360 - 1 / 3) * 255),
    ]
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t
  }
}

/**
 * Create a color interpolation
 *
 * @param value - Spring value or function that returns a number
 * @param input - Input range (array of numbers)
 * @param colors - Array of color strings (hex, rgb, hsl)
 * @param options - Interpolation options
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
 * ```
 */
export function interpolateColor(
  value: SpringValue | (() => number),
  input: number[],
  colors: string[],
  options?: InterpolateOptions
): ColorInterpolation {
  return new ColorInterpolationImpl(value, input, colors, options)
}
