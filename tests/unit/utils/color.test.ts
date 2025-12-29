import { describe, it, expect } from 'vitest'
import {
  parseColor,
  rgbToHex,
  hexToRgb,
  hslToRgb,
  rgbToHsl,
} from '@oxog/springkit'

describe('color utils', () => {
  describe('parseColor', () => {
    it('should parse hex colors', () => {
      expect(parseColor('#ff0000')).toEqual({ r: 255, g: 0, b: 0 })
      expect(parseColor('#00ff00')).toEqual({ r: 0, g: 255, b: 0 })
      expect(parseColor('#0000ff')).toEqual({ r: 0, g: 0, b: 255 })
    })

    it('should parse short hex colors', () => {
      expect(parseColor('#f00')).toEqual({ r: 255, g: 0, b: 0 })
      expect(parseColor('#0f0')).toEqual({ r: 0, g: 255, b: 0 })
      expect(parseColor('#00f')).toEqual({ r: 0, g: 0, b: 255 })
    })

    it('should parse rgb() colors', () => {
      expect(parseColor('rgb(255, 0, 0)')).toEqual({ r: 255, g: 0, b: 0 })
      expect(parseColor('rgb(0, 255, 0)')).toEqual({ r: 0, g: 255, b: 0 })
      expect(parseColor('rgb(128, 128, 128)')).toEqual({ r: 128, g: 128, b: 128 })
    })

    it('should parse rgba() colors', () => {
      expect(parseColor('rgba(255, 0, 0, 1)')).toEqual({ r: 255, g: 0, b: 0 })
      expect(parseColor('rgba(0, 255, 0, 0.5)')).toEqual({ r: 0, g: 255, b: 0 })
      expect(parseColor('rgba(128, 128, 128, 0.8)')).toEqual({ r: 128, g: 128, b: 128 })
    })

    it('should parse hsl() colors', () => {
      expect(parseColor('hsl(0, 100%, 50%)')).toEqual({ r: 255, g: 0, b: 0 })
      expect(parseColor('hsl(120, 100%, 50%)')).toEqual({ r: 0, g: 255, b: 0 })
      expect(parseColor('hsl(240, 100%, 50%)')).toEqual({ r: 0, g: 0, b: 255 })
    })

    it('should return black for unknown formats', () => {
      expect(parseColor('unknown')).toEqual({ r: 0, g: 0, b: 0 })
      expect(parseColor('')).toEqual({ r: 0, g: 0, b: 0 })
      expect(parseColor('notacolor')).toEqual({ r: 0, g: 0, b: 0 })
    })
  })

  describe('rgbToHex', () => {
    it('should convert RGB to hex', () => {
      expect(rgbToHex(255, 0, 0)).toBe('#ff0000')
      expect(rgbToHex(0, 255, 0)).toBe('#00ff00')
      expect(rgbToHex(0, 0, 255)).toBe('#0000ff')
    })

    it('should handle edge values', () => {
      expect(rgbToHex(0, 0, 0)).toBe('#000000')
      expect(rgbToHex(255, 255, 255)).toBe('#ffffff')
    })

    it('should clamp values', () => {
      expect(rgbToHex(300, -10, 128)).toBe('#ff0080')
    })
  })

  describe('hexToRgb', () => {
    it('should convert hex to RGB', () => {
      expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 })
      expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 })
      expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 })
    })

    it('should handle short hex', () => {
      expect(hexToRgb('#f00')).toEqual({ r: 255, g: 0, b: 0 })
      expect(hexToRgb('#0f0')).toEqual({ r: 0, g: 255, b: 0 })
    })

    it('should handle hex without #', () => {
      expect(hexToRgb('ff0000')).toEqual({ r: 255, g: 0, b: 0 })
    })
  })

  describe('hslToRgb', () => {
    it('should convert HSL to RGB', () => {
      expect(hslToRgb(0, 100, 50)).toEqual({ r: 255, g: 0, b: 0 })
      expect(hslToRgb(120, 100, 50)).toEqual({ r: 0, g: 255, b: 0 })
      expect(hslToRgb(240, 100, 50)).toEqual({ r: 0, g: 0, b: 255 })
    })

    it('should handle grayscale (s=0)', () => {
      expect(hslToRgb(0, 0, 50)).toEqual({ r: 128, g: 128, b: 128 })
      expect(hslToRgb(180, 0, 0)).toEqual({ r: 0, g: 0, b: 0 })
      expect(hslToRgb(0, 0, 100)).toEqual({ r: 255, g: 255, b: 255 })
    })

    it('should handle out of range hue', () => {
      const result = hslToRgb(360, 100, 50)
      expect(result).toEqual({ r: 255, g: 0, b: 0 })

      const result2 = hslToRgb(-360, 100, 50)
      expect(result2).toEqual({ r: 255, g: 0, b: 0 })
    })

    it('should clamp s and l values', () => {
      expect(hslToRgb(0, 150, -10)).toEqual({ r: 0, g: 0, b: 0 })
      expect(hslToRgb(0, 150, 150)).toEqual({ r: 255, g: 255, b: 255 })
    })

    it('should handle all hue2rgb branches', () => {
      // Test hue values that exercise all branches of the hue2rgb function

      // Hue 30 (orange) - exercises first branch
      expect(hslToRgb(30, 100, 50)).toEqual({ r: 255, g: 128, b: 0 })

      // Hue 90 (yellow-green) - exercises second branch
      expect(hslToRgb(90, 100, 50)).toEqual({ r: 128, g: 255, b: 0 })

      // Hue 150 (green-cyan) - exercises third branch (line 128)
      expect(hslToRgb(150, 100, 50)).toEqual({ r: 0, g: 255, b: 128 })

      // Hue 210 (cyan) - exercises fourth branch
      expect(hslToRgb(210, 100, 50)).toEqual({ r: 0, g: 127, b: 255 })

      // Hue 270 (magenta-blue) - exercises fifth branch
      expect(hslToRgb(270, 100, 50)).toEqual({ r: 127, g: 0, b: 255 })

      // Hue 330 (magenta-red) - exercises sixth branch
      expect(hslToRgb(330, 100, 50)).toEqual({ r: 255, g: 0, b: 128 })
    })

    it('should trigger t > 1 branch in hue2rgb', () => {
      // This tests line 125: if (t > 1) t -= 1
      // With high hue values and +1/3 offset, t can exceed 1
      expect(hslToRgb(390, 100, 50)).toEqual({ r: 255, g: 128, b: 0 })
    })
  })

  describe('rgbToHsl', () => {
    it('should convert RGB to HSL', () => {
      expect(rgbToHsl(255, 0, 0)).toEqual({ h: 0, s: 100, l: 50 })
      expect(rgbToHsl(0, 255, 0)).toEqual({ h: 120, s: 100, l: 50 })
      expect(rgbToHsl(0, 0, 255)).toEqual({ h: 240, s: 100, l: 50 })
    })

    it('should handle grayscale', () => {
      expect(rgbToHsl(128, 128, 128)).toEqual({ h: 0, s: 0, l: 50 })
      expect(rgbToHsl(0, 0, 0)).toEqual({ h: 0, s: 0, l: 0 })
      expect(rgbToHsl(255, 255, 255)).toEqual({ h: 0, s: 0, l: 100 })
    })

    it('should clamp RGB values', () => {
      expect(rgbToHsl(300, -10, 128)).toEqual({ h: expect.any(Number), s: expect.any(Number), l: expect.any(Number) })
    })

    it('should handle bright colors (l > 50%)', () => {
      // RGB(255, 255, 200) - light yellow with high lightness
      const result = rgbToHsl(255, 255, 200)
      expect(result.l).toBeGreaterThan(50)
      expect(result).toMatchObject({ h: expect.any(Number), s: expect.any(Number), l: expect.any(Number) })
    })

    it('should handle light colors (l > 50%) with saturation', () => {
      // RGB(255, 200, 150) - light orange
      const result = rgbToHsl(255, 200, 150)
      expect(result.l).toBeGreaterThan(50)
      expect(result.s).toBeGreaterThan(0)
      expect(result).toMatchObject({ h: expect.any(Number), s: expect.any(Number), l: expect.any(Number) })
    })

    it('should handle case where max is green', () => {
      // RGB(100, 255, 100) - bright green
      const result = rgbToHsl(100, 255, 100)
      expect(result.h).toBeCloseTo(120, -10) // Around 120 for green
      expect(result).toMatchObject({ h: expect.any(Number), s: expect.any(Number), l: expect.any(Number) })
    })

    it('should handle case where max is blue', () => {
      // RGB(100, 100, 255) - bright blue
      const result = rgbToHsl(100, 100, 255)
      expect(result.h).toBeCloseTo(240, -10) // Around 240 for blue
      expect(result).toMatchObject({ h: expect.any(Number), s: expect.any(Number), l: expect.any(Number) })
    })
  })
})
