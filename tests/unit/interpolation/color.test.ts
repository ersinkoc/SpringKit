import { describe, it, expect } from 'vitest'
import { interpolateColor, createSpringValue } from '@oxog/springkit'

describe('interpolateColor', () => {
  describe('basic color interpolation', () => {
    it('should interpolate between two colors', () => {
      const value = createSpringValue(0)
      const color = interpolateColor(value, [0, 100], ['#ff0000', '#0000ff'])

      value.jump(0)
      expect(color.get()).toBe('rgb(255, 0, 0)')

      value.jump(50)
      const midColor = color.get()
      expect(midColor).toMatch(/^rgb\(\d+, \d+, \d+\)$/)

      value.jump(100)
      expect(color.get()).toBe('rgb(0, 0, 255)')
    })

    it('should handle function source', () => {
      const color = interpolateColor(() => 50, [0, 100], ['#ff0000', '#0000ff'])

      expect(color.get()).toMatch(/^rgb\(\d+, \d+, \d+\)$/)
    })
  })

  describe('color formats', () => {
    it('should parse hex colors', () => {
      const color = interpolateColor(() => 0, [0], ['#ff0000'])

      expect(color.get()).toBe('rgb(255, 0, 0)')
    })

    it('should parse short hex colors', () => {
      const color = interpolateColor(() => 0, [0], ['#f00'])

      expect(color.get()).toBe('rgb(255, 0, 0)')
    })

    it('should parse rgb colors', () => {
      const color = interpolateColor(() => 0, [0], ['rgb(255, 0, 0)'])

      expect(color.get()).toBe('rgb(255, 0, 0)')
    })

    it('should parse rgba colors', () => {
      const color = interpolateColor(() => 0, [0], ['rgba(255, 0, 0, 0.5)'])

      expect(color.get()).toBe('rgb(255, 0, 0)')
    })

    it('should parse hsl colors', () => {
      const color = interpolateColor(() => 0, [0], ['hsl(0, 100%, 50%)'])

      expect(color.get()).toBe('rgb(255, 0, 0)')
    })

    it('should parse hsl grayscale colors (s=0)', () => {
      const color = interpolateColor(() => 0, [0], ['hsl(0, 0%, 50%)'])

      expect(color.get()).toBe('rgb(128, 128, 128)')
    })
  })

  describe('multi-point color interpolation', () => {
    it('should interpolate through multiple colors', () => {
      const value = createSpringValue(0)
      const color = interpolateColor(value, [0, 50, 100], [
        '#ff0000',
        '#00ff00',
        '#0000ff',
      ])

      value.jump(0)
      expect(color.get()).toBe('rgb(255, 0, 0)')

      value.jump(50)
      expect(color.get()).toBe('rgb(0, 255, 0)')

      value.jump(100)
      expect(color.get()).toBe('rgb(0, 0, 255)')
    })
  })

  describe('color channel interpolation', () => {
    it('should interpolate red channel', () => {
      const value = createSpringValue(0)
      const color = interpolateColor(value, [0, 100], ['#000000', '#ff0000'])

      value.jump(50)
      const result = color.get()
      const match = result.match(/rgb\((\d+), \d+, \d+\)/)
      expect(match?.[1]).toBe('128')
    })

    it('should interpolate green channel', () => {
      const value = createSpringValue(0)
      const color = interpolateColor(value, [0, 100], ['#000000', '#00ff00'])

      value.jump(50)
      const result = color.get()
      const match = result.match(/rgb\(\d+, (\d+), \d+\)/)
      expect(match?.[1]).toBe('128')
    })

    it('should interpolate blue channel', () => {
      const value = createSpringValue(0)
      const color = interpolateColor(value, [0, 100], ['#000000', '#0000ff'])

      value.jump(50)
      const result = color.get()
      const match = result.match(/rgb\(\d+, \d+, (\d+)\)/)
      expect(match?.[1]).toBe('128')
    })
  })

  describe('edge cases', () => {
    it('should handle invalid color format', () => {
      const color = interpolateColor(() => 0, [0], ['invalid'])

      // Should default to black
      expect(color.get()).toBe('rgb(0, 0, 0)')
    })

    it('should handle single color', () => {
      const color = interpolateColor(() => 50, [50], ['#ff0000'])

      expect(color.get()).toBe('rgb(255, 0, 0)')
    })

    it('should extrapolate with clamp mode when value below range', () => {
      const value = createSpringValue(0)
      const color = interpolateColor(value, [50, 100], ['#ff0000', '#0000ff'], {
        extrapolate: 'clamp',
      })

      value.jump(-10) // Below range
      expect(color.get()).toBe('rgb(255, 0, 0)') // Clamped to first color
    })

    it('should extrapolate with clamp mode when value above range', () => {
      const value = createSpringValue(0)
      const color = interpolateColor(value, [0, 50], ['#ff0000', '#0000ff'], {
        extrapolate: 'clamp',
      })

      value.jump(100) // Above range
      expect(color.get()).toBe('rgb(0, 0, 255)') // Clamped to last color
    })

    it('should extrapolate with identity mode (clamps for colors)', () => {
      const value = createSpringValue(0)
      const color = interpolateColor(value, [0, 50], ['#ff0000', '#0000ff'], {
        extrapolate: 'identity',
      })

      value.jump(100) // Above range
      expect(color.get()).toBe('rgb(0, 0, 255)') // Identity behaves like clamp for colors
    })

    it('should extrapolate with extrapolateLeft option', () => {
      const value = createSpringValue(0)
      const color = interpolateColor(value, [50, 100], ['#ff0000', '#0000ff'], {
        extrapolateLeft: 'clamp',
        extrapolate: 'extend', // Should be overridden by extrapolateLeft
      })

      value.jump(0) // Below range
      expect(color.get()).toBe('rgb(255, 0, 0)') // Clamped
    })

    it('should extrapolate with extrapolateLeft identity mode (clamps)', () => {
      const value = createSpringValue(0)
      const color = interpolateColor(value, [50, 100], ['#ff0000', '#0000ff'], {
        extrapolateLeft: 'identity',
      })

      value.jump(0) // Below range
      expect(color.get()).toBe('rgb(255, 0, 0)') // Identity behaves like clamp for colors
    })

    it('should extrapolate with extrapolateRight option', () => {
      const value = createSpringValue(0)
      const color = interpolateColor(value, [0, 50], ['#ff0000', '#0000ff'], {
        extrapolateRight: 'clamp',
        extrapolate: 'extend', // Should be overridden by extrapolateRight
      })

      value.jump(100) // Above range
      expect(color.get()).toBe('rgb(0, 0, 255)') // Clamped
    })

    it('should extend by default when value above range', () => {
      const value = createSpringValue(0)
      const color = interpolateColor(value, [0, 50], ['#ff0000', '#0000ff'])

      value.jump(100) // Above range, should extend
      // When extending beyond range, the color calculation will continue
      const result = color.get()
      expect(result).toMatch(/^rgb\((\d+|-?\d+), \s*(\d+|-?\d+), \s*(\d+|-?\d+)\)$/)
    })

    it('should extend by default when value below range', () => {
      const value = createSpringValue(0)
      const color = interpolateColor(value, [50, 100], ['#ff0000', '#0000ff'])

      value.jump(0) // Below range, should extend
      const result = color.get()
      expect(result).toMatch(/^rgb\((\d+|-?\d+), \s*(\d+|-?\d+), \s*(\d+|-?\d+)\)$/)
    })
  })

  describe('HSL to RGB conversion - hue2rgb branches', () => {
    // Test all branches of the hue2rgb function (lines 144, 147-151)
    // The hue wheel has 6 segments, each handled by different branches

    it('should handle hue 0 (red) - first segment boundary', () => {
      const color = interpolateColor(() => 0, [0], ['hsl(0, 100%, 50%)'])
      expect(color.get()).toBe('rgb(255, 0, 0)')
    })

    it('should handle hue 60 (yellow) - first segment', () => {
      const color = interpolateColor(() => 0, [0], ['hsl(60, 100%, 50%)'])
      expect(color.get()).toBe('rgb(255, 255, 0)')
    })

    it('should handle hue 120 (green) - second segment', () => {
      const color = interpolateColor(() => 0, [0], ['hsl(120, 100%, 50%)'])
      expect(color.get()).toBe('rgb(0, 255, 0)')
    })

    it('should handle hue 180 (cyan) - third segment', () => {
      const color = interpolateColor(() => 0, [0], ['hsl(180, 100%, 50%)'])
      expect(color.get()).toBe('rgb(0, 255, 255)')
    })

    it('should handle hue 240 (blue) - fourth segment', () => {
      const color = interpolateColor(() => 0, [0], ['hsl(240, 100%, 50%)'])
      expect(color.get()).toBe('rgb(0, 0, 255)')
    })

    it('should handle hue 300 (magenta) - fifth segment', () => {
      const color = interpolateColor(() => 0, [0], ['hsl(300, 100%, 50%)'])
      expect(color.get()).toBe('rgb(255, 0, 255)')
    })

    it('should handle hue wrapping (360 -> 0)', () => {
      const color = interpolateColor(() => 0, [0], ['hsl(360, 100%, 50%)'])
      expect(color.get()).toBe('rgb(255, 0, 0)')
    })

    it('should handle negative hue (wraps around)', () => {
      // This tests line 144: if (t < 0) t += 1
      // Note: The HSL regex doesn't parse negative hues, so we test hue > 360 which wraps
      const color = interpolateColor(() => 0, [0], ['hsl(390, 100%, 50%)'])
      // 390 degrees wraps to 30 degrees (orange)
      expect(color.get()).toBe('rgb(255, 128, 0)')
    })

    it('should handle hue greater than 360 (wraps around)', () => {
      const color = interpolateColor(() => 0, [0], ['hsl(420, 100%, 50%)'])
      // 420 degrees should wrap to 60 degrees (yellow)
      expect(color.get()).toBe('rgb(255, 255, 0)')
    })

    it('should handle intermediate hue values', () => {
      // Test hue 30 (between red and yellow) - exercises first branch
      const color1 = interpolateColor(() => 0, [0], ['hsl(30, 100%, 50%)'])
      expect(color1.get()).toBe('rgb(255, 128, 0)')

      // Test hue 90 (between yellow and green) - exercises second branch
      const color2 = interpolateColor(() => 0, [0], ['hsl(90, 100%, 50%)'])
      expect(color2.get()).toBe('rgb(128, 255, 0)')

      // Test hue 150 (between green and cyan) - exercises third branch
      const color3 = interpolateColor(() => 0, [0], ['hsl(150, 100%, 50%)'])
      expect(color3.get()).toBe('rgb(0, 255, 128)')

      // Test hue 210 (between cyan and blue) - exercises fourth branch
      const color4 = interpolateColor(() => 0, [0], ['hsl(210, 100%, 50%)'])
      expect(color4.get()).toBe('rgb(0, 127, 255)')

      // Test hue 270 (between blue and magenta) - exercises fifth branch
      const color5 = interpolateColor(() => 0, [0], ['hsl(270, 100%, 50%)'])
      expect(color5.get()).toBe('rgb(127, 0, 255)')

      // Test hue 330 (between magenta and red) - exercises sixth branch
      const color6 = interpolateColor(() => 0, [0], ['hsl(330, 100%, 50%)'])
      expect(color6.get()).toBe('rgb(255, 0, 128)')
    })

    it('should handle HSL with lightness < 50% (line 151 first branch)', () => {
      // This tests line 151: const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      // With l < 50%, we exercise the first branch
      const color = interpolateColor(() => 0, [0], ['hsl(0, 100%, 25%)'])
      expect(color.get()).toBe('rgb(128, 0, 0)')
    })

    it('should handle HSL with lightness > 50% (line 151 second branch)', () => {
      // With l > 50%, we exercise the second branch
      const color = interpolateColor(() => 0, [0], ['hsl(0, 100%, 75%)'])
      expect(color.get()).toBe('rgb(255, 128, 128)')
    })
  })
})
