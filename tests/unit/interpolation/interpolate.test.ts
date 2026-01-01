import { describe, it, expect } from 'vitest'
import { interpolate, createSpringValue } from '@oxog/springkit'

describe('interpolation', () => {
  describe('basic interpolation', () => {
    it('should interpolate between two points', () => {
      const value = createSpringValue(0)
      const interp = interpolate(value, [0, 100], [0, 1])

      value.jump(0)
      expect(interp.get()).toBe(0)

      value.jump(50)
      expect(interp.get()).toBe(0.5)

      value.jump(100)
      expect(interp.get()).toBe(1)
    })

    it('should handle function source', () => {
      const interp = interpolate(() => 50, [0, 100], [0, 1])

      expect(interp.get()).toBe(0.5)
    })
  })

  describe('multi-point interpolation', () => {
    it('should interpolate through multiple points', () => {
      const value = createSpringValue(0)
      const interp = interpolate(value, [0, 50, 100], [0, 1, 0])

      value.jump(0)
      expect(interp.get()).toBe(0)

      value.jump(50)
      expect(interp.get()).toBe(1)

      value.jump(100)
      expect(interp.get()).toBe(0)
    })

    it('should handle descending values', () => {
      const interp = interpolate(() => 75, [0, 50, 100], [100, 50, 0])

      expect(interp.get()).toBe(25)
    })
  })

  describe('extrapolation', () => {
    it('should extend by default', () => {
      const interp = interpolate(() => 150, [0, 100], [0, 1])

      expect(interp.get()).toBe(1.5)
    })

    it('should clamp when extrapolate is clamp', () => {
      const interp = interpolate(() => 150, [0, 100], [0, 1], {
        extrapolate: 'clamp',
      })

      expect(interp.get()).toBe(1)
    })

    it('should return identity when extrapolate is identity', () => {
      const interp = interpolate(() => 150, [0, 100], [0, 1], {
        extrapolate: 'identity',
      })

      expect(interp.get()).toBe(150)
    })

    it('should handle left extrapolation', () => {
      const interp = interpolate(() => -50, [0, 100], [0, 1], {
        extrapolateLeft: 'clamp',
      })

      expect(interp.get()).toBe(0)
    })

    it('should handle right extrapolation', () => {
      const interp = interpolate(() => 150, [0, 100], [0, 1], {
        extrapolateRight: 'clamp',
      })

      expect(interp.get()).toBe(1)
    })

    it('should handle different left and right extrapolation', () => {
      const interpLeft = interpolate(() => -50, [0, 100], [0, 1], {
        extrapolateLeft: 'identity',
        extrapolateRight: 'clamp',
      })
      const interpRight = interpolate(() => 150, [0, 100], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'identity',
      })

      expect(interpLeft.get()).toBe(-50)
      expect(interpRight.get()).toBe(150)
    })

    it('should extend left side by default when no extrapolate options provided', () => {
      // This tests the fallback to extrapolate on line 70
      const interp = interpolate(() => -50, [0, 100], [0, 1])
      // Should extend (not clamp or identity)
      expect(interp.get()).toBe(-0.5)
    })

    it('should use extrapolate as fallback when extrapolateLeft not provided', () => {
      // This tests the fallback on line 70
      const interp = interpolate(() => -50, [0, 100], [0, 1], {
        extrapolate: 'identity',
      })
      // Should use identity from extrapolate option
      expect(interp.get()).toBe(-50)
    })

    it('should use extrapolate as fallback when extrapolateRight not provided', () => {
      // This tests the fallback on line 77
      const interp = interpolate(() => 150, [0, 100], [0, 1], {
        extrapolate: 'clamp',
      })
      // Should use clamp from extrapolate option
      expect(interp.get()).toBe(1)
    })

    it('should use extrapolateLeft when provided (line 70 first branch)', () => {
      // This explicitly tests the first branch of ?? on line 70: extrapolateLeft is provided
      const interp = interpolate(() => -50, [0, 100], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolate: 'extend', // This should be ignored since extrapolateLeft is provided
      })
      // Should use clamp from extrapolateLeft
      expect(interp.get()).toBe(0)
    })

    it('should fall through to extrapolate when extrapolateLeft not provided (line 70 second branch)', () => {
      // This tests the second branch of ?? on line 70: extrapolateLeft is undefined, use extrapolate
      const interp = interpolate(() => -50, [0, 100], [0, 1], {
        // Note: not providing extrapolateLeft, but providing extrapolate
        extrapolate: 'clamp',
      })
      // Should use clamp from extrapolate (fallback from extrapolateLeft)
      expect(interp.get()).toBe(0)
    })

    it('should use default extend when no extrapolate options provided (line 70 third branch)', () => {
      // This tests the third branch of ?? on line 70: both are undefined, use default 'extend'
      const interp = interpolate(() => -50, [0, 100], [0, 1])
      // Should extend (default behavior)
      expect(interp.get()).toBe(-0.5)
    })

    it('should use extrapolateRight when provided (line 77 first branch)', () => {
      // This explicitly tests the first branch of ?? on line 77: extrapolateRight is provided
      const interp = interpolate(() => 150, [0, 100], [0, 1], {
        extrapolateRight: 'clamp',
        extrapolate: 'extend', // This should be ignored since extrapolateRight is provided
      })
      // Should use clamp from extrapolateRight
      expect(interp.get()).toBe(1)
    })

    it('should use extrapolateRight fallback to default extend (line 77 third branch)', () => {
      // This tests the third branch of ?? on line 77: both extrapolateRight and extrapolate are undefined
      const interp = interpolate(() => 150, [0, 100], [0, 1])
      // Should extend (default behavior)
      expect(interp.get()).toBe(1.5)
    })

    it('should fall through to extrapolate for right side (line 77 second branch)', () => {
      // This tests the second branch of ?? on line 77: extrapolateRight is undefined, use extrapolate
      const interp = interpolate(() => 150, [0, 100], [0, 1], {
        extrapolate: 'identity',
      })
      // Should use identity from extrapolate (fallback from extrapolateRight)
      expect(interp.get()).toBe(150)
    })

    it('should use extrapolateLeft fallback to default extend (line 70 - explicitly test all options undefined)', () => {
      // Create options object with undefined values explicitly
      const options: { extrapolate?: 'extend' | 'clamp' | 'identity'; extrapolateLeft?: 'extend' | 'clamp' | 'identity' } = {}

      const interp = interpolate(() => -50, [0, 100], [0, 1], options)
      expect(interp.get()).toBe(-0.5)
    })

    it('should use default extend for both left and right extrapolation (tests getExtrapolationMode default branch)', () => {
      // This tests the getExtrapolationMode method's default return 'extend'
      // when both specificMode and fallbackMode are undefined
      const interp = interpolate(() => -50, [0, 100], [0, 1], {})
      expect(interp.get()).toBe(-0.5)
    })
  })

  describe('clamping', () => {
    it('should clamp output range', () => {
      const interp = interpolate(() => 150, [0, 100], [0, 1], {
        clamp: true,
      })

      expect(interp.get()).toBe(1)
    })

    it('should clamp both sides', () => {
      const interpAbove = interpolate(() => 150, [0, 100], [0, 1], {
        clamp: true,
      })
      const interpBelow = interpolate(() => -50, [0, 100], [0, 1], {
        clamp: true,
      })

      expect(interpAbove.get()).toBeGreaterThanOrEqual(0)
      expect(interpAbove.get()).toBeLessThanOrEqual(1)
      expect(interpBelow.get()).toBeGreaterThanOrEqual(0)
      expect(interpBelow.get()).toBeLessThanOrEqual(1)
    })
  })

  describe('edge cases', () => {
    it('should handle single point', () => {
      const interp = interpolate(() => 50, [50], [1])

      expect(interp.get()).toBe(1)
    })

    it('should handle negative input range', () => {
      const interp = interpolate(() => -50, [-100, 0], [0, 1])

      expect(interp.get()).toBe(0.5)
    })

    it('should handle negative output range', () => {
      const interp = interpolate(() => 50, [0, 100], [-1, 0])

      expect(interp.get()).toBe(-0.5)
    })

    it('should handle NaN from source', () => {
      const interp = interpolate(() => NaN, [0, 100], [0, 1])
      // Should return first output value as fallback
      expect(interp.get()).toBe(0)
    })

    it('should handle Infinity from source', () => {
      const interp = interpolate(() => Infinity, [0, 100], [0, 1])
      // Should return first output value as fallback
      expect(interp.get()).toBe(0)
    })

    it('should handle -Infinity from source', () => {
      const interp = interpolate(() => -Infinity, [0, 100], [0, 1])
      // Should return first output value as fallback
      expect(interp.get()).toBe(0)
    })

    it('should handle division by zero (same input values)', () => {
      // When two adjacent input values are the same, avoid division by zero
      const interp = interpolate(() => 50, [50, 50, 100], [0, 0.5, 1])
      // Should return a finite value without crashing
      expect(Number.isFinite(interp.get())).toBe(true)
    })

    it('should handle empty output array gracefully', () => {
      const interp = interpolate(() => NaN, [0, 100], [])
      // Should return 0 as fallback when output[0] is undefined
      expect(interp.get()).toBe(0)
    })
  })
})
