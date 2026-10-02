
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
 * RGBA color representation (alpha in 0-1)
 */
export interface RGBA extends RGB {
  a: number
}

const NUMBER = /[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/.source
const FUNCTIONAL_COLOR_REGEX = new RegExp(
  String.raw`^(rgba?|hsla?)\(\s*(${NUMBER})(deg|%)?\s*,?\s*(${NUMBER})(%)?\s*,?\s*(${NUMBER})(%)?\s*(?:[,/]\s*(${NUMBER})(%)?\s*)?\)$`,
  'i'
)

/**
 * Parse a color string to RGBA.
 * Supports hex (#rgb, #rgba, #rrggbb, #rrggbbaa), rgb()/rgba() and hsl()/hsla()
 * (comma or space separated, decimals, percentages, optional alpha) and `transparent`.
 * Unknown formats resolve to opaque black.
 * @param color - The color string to parse
 * @returns The RGBA representation (alpha in 0-1)
 */
export function parseColorRGBA(color: string): RGBA {
  const input = color.trim()

  if (input.toLowerCase() === 'transparent') {
    return { r: 0, g: 0, b: 0, a: 0 }
  }

  if (/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(input)) {
    return { ...hexToRgb(input), a: hexAlpha(input) }
  }

  const match = input.match(FUNCTIONAL_COLOR_REGEX)
  if (match) {
    const fn = match[1]!.toLowerCase()
    const alphaValue = match[8]
    let a = 1
    if (alphaValue !== undefined) {
      a = parseFloat(alphaValue) / (match[9] ? 100 : 1)
      a = Math.max(0, Math.min(1, a))
    }

    if (fn.startsWith('rgb')) {
      const channel = (value: string, percent: string | undefined): number =>
        Math.round(percent ? (parseFloat(value) / 100) * 255 : parseFloat(value))
      return {
        r: channel(match[2]!, match[3] === '%' ? '%' : undefined),
        g: channel(match[4]!, match[5]),
        b: channel(match[6]!, match[7]),
        a,
      }
    }

    return {
      ...hslToRgb(parseFloat(match[2]!), parseFloat(match[4]!), parseFloat(match[6]!)),
      a,
    }
  }

  // Default to opaque black for unknown formats
  return { r: 0, g: 0, b: 0, a: 1 }
}

/**
 * Parse a color string to RGB
 * Supports hex (#rgb, #rgba, #rrggbb, #rrggbbaa), rgb()/rgba(), hsl()/hsla()
 * Alpha is ignored; use parseColorRGBA to keep it.
 * @param color - The color string to parse
 * @returns The RGB representation
 */
export function parseColor(color: string): RGB {
  const { r, g, b } = parseColorRGBA(color)
  return { r, g, b }
}

/**
 * Extract alpha (0-1) from a 4 or 8 digit hex color, 1 otherwise
 */
function hexAlpha(hex: string): number {
  const cleanHex = hex.replace('#', '')
  if (cleanHex.length === 4) {
    return parseInt(cleanHex.charAt(3) + cleanHex.charAt(3), 16) / 255
  }
  if (cleanHex.length === 8) {
    return parseInt(cleanHex.slice(6, 8), 16) / 255
  }
  return 1
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
 * Accepts 3, 4, 6 or 8 digit hex (alpha digits are ignored)
 * @param hex - Hex color string (with or without #)
 * @returns RGB representation
 */
export function hexToRgb(hex: string): RGB {
  const cleanHex = hex.replace('#', '')

  if (cleanHex.length === 3 || cleanHex.length === 4) {
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

// ============ Color spaces & mixing ============

/**
 * Color space used to interpolate between colors.
 * - `srgb`: gamma-encoded sRGB channels (CSS default, cheapest)
 * - `linear`: linear-light sRGB (physically correct light mixing)
 * - `oklab`: perceptually uniform OKLab (even lightness, no muddy midpoints)
 */
export type ColorSpace = 'srgb' | 'linear' | 'oklab'

/**
 * OKLab color (L in 0-1, a/b roughly in -0.4..0.4)
 */
export interface OKLab {
  l: number
  a: number
  b: number
}

/**
 * Convert a gamma-encoded sRGB channel (0-1) to linear light (0-1)
 */
export function srgbToLinear(channel: number): number {
  const abs = Math.abs(channel)
  const linear = abs <= 0.04045 ? abs / 12.92 : Math.pow((abs + 0.055) / 1.055, 2.4)
  return channel < 0 ? -linear : linear
}

/**
 * Convert a linear-light channel (0-1) to gamma-encoded sRGB (0-1)
 */
export function linearToSrgb(channel: number): number {
  const abs = Math.abs(channel)
  const encoded = abs <= 0.0031308 ? abs * 12.92 : 1.055 * Math.pow(abs, 1 / 2.4) - 0.055
  return channel < 0 ? -encoded : encoded
}

/**
 * Convert linear sRGB (0-1 channels) to OKLab (Björn Ottosson, 2020)
 */
export function linearRgbToOklab(r: number, g: number, b: number): OKLab {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)

  return {
    l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  }
}

/**
 * Convert OKLab to linear sRGB (0-1 channels, may fall outside the gamut)
 */
export function oklabToLinearRgb(L: number, a: number, b: number): RGB {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3

  return {
    r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  }
}

/**
 * Convert an sRGB color (0-255 channels) to OKLab
 */
export function rgbToOklab(r: number, g: number, b: number): OKLab {
  return linearRgbToOklab(srgbToLinear(r / 255), srgbToLinear(g / 255), srgbToLinear(b / 255))
}

/**
 * Convert OKLab to an sRGB color (0-255 channels, unclamped)
 */
export function oklabToRgb(L: number, a: number, b: number): RGB {
  const linear = oklabToLinearRgb(L, a, b)
  return {
    r: linearToSrgb(linear.r) * 255,
    g: linearToSrgb(linear.g) * 255,
    b: linearToSrgb(linear.b) * 255,
  }
}

/** Convert 0-255 sRGB channels to the coordinates of the given space */
function toSpace(color: RGBA, space: ColorSpace): [number, number, number] {
  if (space === 'oklab') {
    const { l, a, b } = rgbToOklab(color.r, color.g, color.b)
    return [l, a, b]
  }
  if (space === 'linear') {
    return [srgbToLinear(color.r / 255), srgbToLinear(color.g / 255), srgbToLinear(color.b / 255)]
  }
  return [color.r, color.g, color.b]
}

/** Convert coordinates of the given space back to 0-255 sRGB channels */
function fromSpace(c: [number, number, number], space: ColorSpace): RGB {
  if (space === 'oklab') {
    return oklabToRgb(c[0], c[1], c[2])
  }
  if (space === 'linear') {
    return { r: linearToSrgb(c[0]) * 255, g: linearToSrgb(c[1]) * 255, b: linearToSrgb(c[2]) * 255 }
  }
  return { r: c[0], g: c[1], b: c[2] }
}

/**
 * Mix two colors with alpha-premultiplied interpolation (like CSS `color-mix()`),
 * so fading from `transparent` doesn't pass through a dark/gray tint.
 *
 * @param from - Start color (0-255 channels, alpha 0-1)
 * @param to - End color
 * @param t - Progress (0 = from, 1 = to; values outside extrapolate)
 * @param space - Interpolation color space (default `'srgb'`)
 * @returns The mixed color (unrounded, unclamped channels)
 */
export function mixColorsRGBA(from: RGBA, to: RGBA, t: number, space: ColorSpace = 'srgb'): RGBA {
  const fromAlpha = Math.max(0, Math.min(1, from.a))
  const toAlpha = Math.max(0, Math.min(1, to.a))
  const alpha = fromAlpha + (toAlpha - fromAlpha) * t
  const a = toSpace(from, space)
  const b = toSpace(to, space)

  // Premultiply, lerp, un-premultiply
  const mixed: [number, number, number] = [0, 0, 0]
  for (let i = 0; i < 3; i++) {
    const premultiplied = a[i]! * fromAlpha + (b[i]! * toAlpha - a[i]! * fromAlpha) * t
    mixed[i] = alpha > 0 ? premultiplied / alpha : 0
  }

  // A fully transparent result has no meaningful color
  const rgb = alpha > 0 ? fromSpace(mixed, space) : { r: 0, g: 0, b: 0 }
  return { ...rgb, a: alpha }
}

/**
 * Format RGBA channels as a CSS color: `rgb()` when opaque, `rgba()` otherwise.
 * Channels are rounded and clamped to 0-255, alpha to 0-1 (3 decimals).
 */
export function formatRGBA(color: RGBA): string {
  const channel = (v: number): number => Math.round(Math.max(0, Math.min(255, v)))
  const rgb = `${channel(color.r)}, ${channel(color.g)}, ${channel(color.b)}`
  const alpha = Math.round(Math.max(0, Math.min(1, color.a)) * 1000) / 1000
  return alpha >= 1 ? `rgb(${rgb})` : `rgba(${rgb}, ${alpha})`
}
