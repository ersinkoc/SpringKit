import type { SpringValue } from '../core/spring-value.js'

/**
 * RGB color representation
 */
export interface RGB {
  r: number
  g: number
  b: number
}

/**
 * HSL color representation
 */
export interface HSL {
  h: number
  s: number
  l: number
}

/**
 * Parse a color string to RGB
 * Supports hex (#rgb, #rrggbb), rgb(), and named colors
 * @param color - The color string to parse
 * @returns The RGB representation
 */
export function parseColor(color: string): RGB {
  // Try hex format first
  const hexMatch = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (hexMatch) {
    return hexToRgb(color)
  }

  // Try rgb() format
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/i)
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]!, 10),
      g: parseInt(rgbMatch[2]!, 10),
      b: parseInt(rgbMatch[3]!, 10),
    }
  }

  // Try rgba() format
  const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/i)
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1]!, 10),
      g: parseInt(rgbaMatch[2]!, 10),
      b: parseInt(rgbaMatch[3]!, 10),
    }
  }

  // Try hsl() format
  const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/i)
  if (hslMatch) {
    return hslToRgb(
      parseInt(hslMatch[1]!, 10),
      parseInt(hslMatch[2]!, 10),
      parseInt(hslMatch[3]!, 10)
    )
  }

  // Default to black for unknown formats
  return { r: 0, g: 0, b: 0 }
}

/**
 * Convert RGB to hex color string
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns Hex color string
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number): string => {
    const clamped = Math.round(Math.max(0, Math.min(255, n)))
    return clamped.toString(16).padStart(2, '0')
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Convert hex color string to RGB
 * @param hex - Hex color string (with or without #)
 * @returns RGB representation
 */
export function hexToRgb(hex: string): RGB {
  const cleanHex = hex.replace('#', '')

  if (cleanHex.length === 3) {
    return {
      r: parseInt(cleanHex.charAt(0) + cleanHex.charAt(0), 16),
      g: parseInt(cleanHex.charAt(1) + cleanHex.charAt(1), 16),
      b: parseInt(cleanHex.charAt(2) + cleanHex.charAt(2), 16),
    }
  }

  return {
    r: parseInt(cleanHex.slice(0, 2), 16),
    g: parseInt(cleanHex.slice(2, 4), 16),
    b: parseInt(cleanHex.slice(4, 6), 16),
  }
}

/**
 * Convert HSL to RGB
 * @param h - Hue (0-360)
 * @param s - Saturation (0-100)
 * @param l - Lightness (0-100)
 * @returns RGB representation
 */
export function hslToRgb(h: number, s: number, l: number): RGB {
  h = ((h % 360) + 360) % 360
  s = Math.max(0, Math.min(100, s)) / 100
  l = Math.max(0, Math.min(100, l)) / 100

  if (s === 0) {
    const gray = Math.round(l * 255)
    return { r: gray, g: gray, b: gray }
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

  return {
    r: Math.round(hue2rgb(p, q, h / 360 + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h / 360) * 255),
    b: Math.round(hue2rgb(p, q, h / 360 - 1 / 3) * 255),
  }
}

/**
 * Convert RGB to HSL
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns HSL representation
 */
export function rgbToHsl(r: number, g: number, b: number): HSL {
  r = Math.max(0, Math.min(255, r)) / 255
  g = Math.max(0, Math.min(255, g)) / 255
  b = Math.max(0, Math.min(255, b)) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min

  let h = 0
  let s = 0

  if (delta !== 0) {
    s = (max + min) / 2 > 0.5
      ? delta / (2 - max - min)
      : delta / (max + min)

    if (max === r) {
      h = ((g - b) / delta + (g < b ? 6 : 0)) / 6
    } else if (max === g) {
      h = ((b - r) / delta + 2) / 6
    } else {
      h = ((r - g) / delta + 4) / 6
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(((max + min) / 2) * 100),
  }
}
