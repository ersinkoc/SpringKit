import { describe, it, expect } from 'vitest'
import { clamp, lerp, mapRange, degToRad, radToDeg } from '@oxog/springkit'

describe('math utils', () => {
  describe('clamp', () => {
    it('should return value when within range', () => {
      expect(clamp(5, 0, 10)).toBe(5)
    })

    it('should return min when below range', () => {
      expect(clamp(-5, 0, 10)).toBe(0)
    })

    it('should return max when above range', () => {
      expect(clamp(15, 0, 10)).toBe(10)
    })

    it('should handle negative ranges', () => {
      expect(clamp(-15, -10, -5)).toBe(-10)
      expect(clamp(0, -10, -5)).toBe(-5)
      expect(clamp(-7, -10, -5)).toBe(-7)
    })

    it('should handle inverted min/max', () => {
      expect(clamp(5, 10, 0)).toBe(5)
    })
  })

  describe('lerp', () => {
    it('should interpolate at t=0', () => {
      expect(lerp(0, 100, 0)).toBe(0)
    })

    it('should interpolate at t=1', () => {
      expect(lerp(0, 100, 1)).toBe(100)
    })

    it('should interpolate at t=0.5', () => {
      expect(lerp(0, 100, 0.5)).toBe(50)
    })

    it('should handle negative values', () => {
      expect(lerp(-100, 100, 0.5)).toBe(0)
    })

    it('should extrapolate for t>1', () => {
      expect(lerp(0, 100, 2)).toBe(200)
    })

    it('should extrapolate for t<0', () => {
      expect(lerp(0, 100, -0.5)).toBe(-50)
    })
  })

  describe('mapRange', () => {
    it('should map value from one range to another', () => {
      expect(mapRange(50, 0, 100, 0, 1)).toBe(0.5)
    })

    it('should map to different scales', () => {
      expect(mapRange(25, 0, 100, 0, 200)).toBe(50)
    })

    it('should map negative ranges', () => {
      expect(mapRange(75, 0, 100, -100, 100)).toBe(50)
    })

    it('should map to negative range', () => {
      expect(mapRange(50, 0, 100, -100, 0)).toBe(-50)
    })

    it('should handle inverted output range', () => {
      expect(mapRange(0, 0, 100, 100, 0)).toBe(100)
      expect(mapRange(100, 0, 100, 100, 0)).toBe(0)
    })

    it('should handle edge cases', () => {
      expect(mapRange(0, 0, 100, 0, 1000)).toBe(0)
      expect(mapRange(100, 0, 100, 0, 1000)).toBe(1000)
    })
  })

  describe('degToRad', () => {
    it('should convert degrees to radians', () => {
      expect(degToRad(0)).toBe(0)
      expect(degToRad(90)).toBeCloseTo(Math.PI / 2, 5)
      expect(degToRad(180)).toBeCloseTo(Math.PI, 5)
      expect(degToRad(360)).toBeCloseTo(2 * Math.PI, 5)
    })

    it('should handle negative degrees', () => {
      expect(degToRad(-180)).toBeCloseTo(-Math.PI, 5)
    })
  })

  describe('radToDeg', () => {
    it('should convert radians to degrees', () => {
      expect(radToDeg(0)).toBe(0)
      expect(radToDeg(Math.PI / 2)).toBeCloseTo(90, 5)
      expect(radToDeg(Math.PI)).toBeCloseTo(180, 5)
      expect(radToDeg(2 * Math.PI)).toBeCloseTo(360, 5)
    })

    it('should handle negative radians', () => {
      expect(radToDeg(-Math.PI)).toBeCloseTo(-180, 5)
    })
  })
})
