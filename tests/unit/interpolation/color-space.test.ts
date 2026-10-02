import { describe, it, expect } from 'vitest'
import { interpolateColor } from '../../../src/interpolation/color'
import {
  rgbToOklab,
  oklabToRgb,
  srgbToLinear,
  linearToSrgb,
  mixColorsRGBA,
  parseColorRGBA,
} from '../../../src/utils/color'

const channels = (css: string) => {
  const { r, g, b, a } = parseColorRGBA(css)
  return { r, g, b, a }
}

describe('premultiplied alpha color interpolation', () => {
  it('transparent -> white stays white while fading in (no gray midpoint)', () => {
    const color = interpolateColor(() => 0.5, [0, 1], ['transparent', '#ffffff'])
    expect(color.get()).toBe('rgba(255, 255, 255, 0.5)')
  })

  it('red -> transparent keeps the red hue', () => {
    const color = interpolateColor(() => 0.75, [0, 1], ['#ff0000', 'rgba(0, 0, 255, 0)'])
    expect(color.get()).toBe('rgba(255, 0, 0, 0.25)')
  })

  it('weights each color by its alpha', () => {
    // 50/50 mix of opaque red and 50% blue: premultiplied -> red dominates
    const mixed = mixColorsRGBA({ r: 255, g: 0, b: 0, a: 1 }, { r: 0, g: 0, b: 255, a: 0.5 }, 0.5)
    expect(mixed.a).toBeCloseTo(0.75)
    expect(mixed.r).toBeCloseTo(170)
    expect(mixed.b).toBeCloseTo(85)
  })

  it('keeps the previous output for opaque colors in the default space', () => {
    const color = interpolateColor(() => 0.5, [0, 1], ['#ff0000', '#0000ff'])
    expect(color.get()).toBe('rgb(128, 0, 128)')
  })
})

describe('color space conversions', () => {
  it('sRGB <-> linear round-trips and matches reference points', () => {
    expect(srgbToLinear(0)).toBe(0)
    expect(srgbToLinear(1)).toBeCloseTo(1, 10)
    expect(srgbToLinear(0.5)).toBeCloseTo(0.214041, 5)
    for (const v of [0, 0.02, 0.04045, 0.2, 0.5, 0.8, 1]) {
      expect(linearToSrgb(srgbToLinear(v))).toBeCloseTo(v, 6)
    }
  })

  it('OKLab of white is (1, 0, 0)', () => {
    const white = rgbToOklab(255, 255, 255)
    expect(white.l).toBeCloseTo(1, 3)
    expect(white.a).toBeCloseTo(0, 3)
    expect(white.b).toBeCloseTo(0, 3)
  })

  it('OKLab of black is (0, 0, 0)', () => {
    const black = rgbToOklab(0, 0, 0)
    expect(black.l).toBeCloseTo(0, 6)
    expect(black.a).toBeCloseTo(0, 6)
    expect(black.b).toBeCloseTo(0, 6)
  })

  it('OKLab of red/green/blue match reference values', () => {
    const red = rgbToOklab(255, 0, 0)
    expect(red.l).toBeCloseTo(0.628, 3)
    expect(red.a).toBeCloseTo(0.2249, 3)
    expect(red.b).toBeCloseTo(0.1258, 3)

    const green = rgbToOklab(0, 255, 0)
    expect(green.l).toBeCloseTo(0.8664, 3)
    expect(green.a).toBeCloseTo(-0.2339, 3)
    expect(green.b).toBeCloseTo(0.1795, 3)

    const blue = rgbToOklab(0, 0, 255)
    expect(blue.l).toBeCloseTo(0.452, 3)
    expect(blue.a).toBeCloseTo(-0.0325, 3)
    expect(blue.b).toBeCloseTo(-0.3115, 3)
  })

  it('OKLab round-trips back to sRGB', () => {
    for (const [r, g, b] of [[255, 0, 0], [12, 200, 99], [255, 255, 0], [30, 30, 30]] as const) {
      const lab = rgbToOklab(r, g, b)
      const back = oklabToRgb(lab.l, lab.a, lab.b)
      expect(back.r).toBeCloseTo(r, 3)
      expect(back.g).toBeCloseTo(g, 3)
      expect(back.b).toBeCloseTo(b, 3)
    }
  })
})

describe('interpolateColor color spaces', () => {
  it('srgb midpoint of blue -> yellow is a flat gray', () => {
    const { r, g, b } = channels(interpolateColor(() => 0.5, [0, 1], ['#0000ff', '#ffff00']).get())
    expect(r).toBe(128)
    expect(g).toBe(128)
    expect(b).toBe(128)
  })

  it('oklab midpoint of blue -> yellow keeps lightness and chroma', () => {
    const css = interpolateColor(() => 0.5, [0, 1], ['#0000ff', '#ffff00'], { space: 'oklab' }).get()
    const { r, g, b } = channels(css)
    const lab = rgbToOklab(r, g, b)
    const gray = rgbToOklab(128, 128, 128)
    const chroma = Math.hypot(lab.a, lab.b)

    // Lightness halfway between blue (0.452) and yellow (0.968), clearly above sRGB gray
    expect(lab.l).toBeGreaterThan(0.68)
    expect(lab.l).toBeGreaterThan(gray.l + 0.05)
    // Meaningful chroma (sRGB gray has ~0)
    expect(chroma).toBeGreaterThan(0.03)
    expect(Math.hypot(gray.a, gray.b)).toBeLessThan(0.001)
  })

  it('linear space midpoint of black -> white is lighter than srgb midpoint', () => {
    const srgb = channels(interpolateColor(() => 0.5, [0, 1], ['#000000', '#ffffff']).get())
    const linear = channels(interpolateColor(() => 0.5, [0, 1], ['#000000', '#ffffff'], { space: 'linear' }).get())
    expect(srgb.r).toBe(128)
    expect(linear.r).toBe(188)
  })

  it('endpoints are exact in every space', () => {
    for (const space of ['srgb', 'linear', 'oklab'] as const) {
      expect(interpolateColor(() => 0, [0, 1], ['#3366cc', '#ff8800'], { space }).get()).toBe('rgb(51, 102, 204)')
      expect(interpolateColor(() => 1, [0, 1], ['#3366cc', '#ff8800'], { space }).get()).toBe('rgb(255, 136, 0)')
    }
  })

  it('premultiplies alpha in oklab too', () => {
    const css = interpolateColor(() => 0.5, [0, 1], ['transparent', '#ffffff'], { space: 'oklab' }).get()
    expect(css).toBe('rgba(255, 255, 255, 0.5)')
  })
})
