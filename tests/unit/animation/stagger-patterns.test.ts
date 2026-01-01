import { describe, it, expect } from 'vitest'
import {
  linearStagger,
  reverseStagger,
  centerStagger,
  edgeStagger,
  gridStagger,
  waveStagger,
  spiralStagger,
  randomStagger,
  customStagger,
  applyStagger,
  staggerPresets,
} from '@oxog/springkit'

describe('Stagger Patterns', () => {
  describe('linearStagger', () => {
    it('should create linear delays', () => {
      const delays = linearStagger({ count: 5, delay: 0.1 })

      expect(delays).toHaveLength(5)
      expect(delays[0]).toBe(0)
      expect(delays[delays.length - 1]).toBeCloseTo(0.4, 5)
    })

    it('should handle count of 1', () => {
      const delays = linearStagger({ count: 1, delay: 0.1 })

      expect(delays).toHaveLength(1)
      expect(delays[0]).toBe(0)
    })

    it('should apply easing function', () => {
      const easeIn = (t: number) => t * t
      const delays = linearStagger({ count: 5, delay: 0.1, easing: easeIn })

      expect(delays).toHaveLength(5)
      // Eased delays should be different from linear
      expect(delays[2]).not.toBeCloseTo(0.2, 5)
    })
  })

  describe('reverseStagger', () => {
    it('should create reverse delays', () => {
      const delays = reverseStagger({ count: 5, delay: 0.1 })

      expect(delays).toHaveLength(5)
      expect(delays[0]).toBeCloseTo(0.4, 5)
      expect(delays[delays.length - 1]).toBe(0)
    })
  })

  describe('centerStagger', () => {
    it('should create center-out delays', () => {
      const delays = centerStagger({ count: 5, delay: 0.1 })

      expect(delays).toHaveLength(5)
      // Center item should have smallest delay
      expect(delays[2]).toBe(0)
      // Edge items should have larger delays
      expect(delays[0]).toBeGreaterThan(delays[2])
      expect(delays[4]).toBeGreaterThan(delays[2])
    })

    it('should handle even count', () => {
      const delays = centerStagger({ count: 4, delay: 0.1 })

      expect(delays).toHaveLength(4)
    })
  })

  describe('edgeStagger', () => {
    it('should create edge-in delays', () => {
      const delays = edgeStagger({ count: 5, delay: 0.1 })

      expect(delays).toHaveLength(5)
      // Edge items should have smallest delays
      expect(delays[0]).toBeLessThan(delays[2])
      expect(delays[4]).toBeLessThan(delays[2])
    })
  })

  describe('gridStagger', () => {
    it('should create grid-based delays', () => {
      const delays = gridStagger({
        count: 12,
        columns: 4,
        origin: 'top-left',
        direction: 'diagonal',
        delay: 0.1,
      })

      expect(delays).toHaveLength(12)
    })

    it('should support radial direction', () => {
      const delays = gridStagger({
        count: 9,
        columns: 3,
        origin: 'center',
        direction: 'radial',
        delay: 0.1,
      })

      expect(delays).toHaveLength(9)
      // Center should have smallest delay
      expect(delays[4]).toBeLessThanOrEqual(delays[0])
    })

    it('should support row direction', () => {
      const delays = gridStagger({
        count: 6,
        columns: 3,
        direction: 'row',
        delay: 0.1,
      })

      expect(delays).toHaveLength(6)
    })

    it('should support column direction', () => {
      const delays = gridStagger({
        count: 6,
        columns: 3,
        direction: 'column',
        delay: 0.1,
      })

      expect(delays).toHaveLength(6)
    })

    it('should support different origins', () => {
      const origins = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'] as const

      origins.forEach(origin => {
        const delays = gridStagger({
          count: 9,
          columns: 3,
          origin,
          delay: 0.1,
        })

        expect(delays).toHaveLength(9)
      })
    })
  })

  describe('waveStagger', () => {
    it('should create wave-based delays', () => {
      const delays = waveStagger({
        count: 10,
        direction: 'horizontal',
        frequency: 1,
        amplitude: 0.5,
        delay: 0.1,
      })

      expect(delays).toHaveLength(10)
    })

    it('should support vertical direction', () => {
      const delays = waveStagger({
        count: 10,
        direction: 'vertical',
        delay: 0.1,
      })

      expect(delays).toHaveLength(10)
    })

    it('should support diagonal direction', () => {
      const delays = waveStagger({
        count: 10,
        direction: 'diagonal',
        delay: 0.1,
      })

      expect(delays).toHaveLength(10)
    })

    it('should adjust with frequency', () => {
      const delays1 = waveStagger({ count: 10, frequency: 1, delay: 0.1 })
      const delays2 = waveStagger({ count: 10, frequency: 2, delay: 0.1 })

      // Different frequencies should produce different patterns
      expect(delays1).not.toEqual(delays2)
    })
  })

  describe('spiralStagger', () => {
    it('should create spiral delays', () => {
      const delays = spiralStagger({
        count: 16,
        columns: 4,
        direction: 'clockwise',
        startFrom: 'edge',
        delay: 0.1,
      })

      expect(delays).toHaveLength(16)
    })

    it('should support counter-clockwise', () => {
      const cw = spiralStagger({
        count: 9,
        columns: 3,
        direction: 'clockwise',
        delay: 0.1,
      })
      const ccw = spiralStagger({
        count: 9,
        columns: 3,
        direction: 'counter-clockwise',
        delay: 0.1,
      })

      expect(cw).not.toEqual(ccw)
    })

    it('should support starting from center', () => {
      const edge = spiralStagger({
        count: 9,
        columns: 3,
        startFrom: 'edge',
        delay: 0.1,
      })
      const center = spiralStagger({
        count: 9,
        columns: 3,
        startFrom: 'center',
        delay: 0.1,
      })

      expect(edge).not.toEqual(center)
    })
  })

  describe('randomStagger', () => {
    it('should create random delays', () => {
      const delays = randomStagger({
        count: 10,
        seed: 12345,
        delay: 0.1,
      })

      expect(delays).toHaveLength(10)
    })

    it('should be reproducible with same seed', () => {
      const delays1 = randomStagger({ count: 10, seed: 42, delay: 0.1 })
      const delays2 = randomStagger({ count: 10, seed: 42, delay: 0.1 })

      expect(delays1).toEqual(delays2)
    })

    it('should produce different results with different seeds', () => {
      const delays1 = randomStagger({ count: 10, seed: 42, delay: 0.1 })
      const delays2 = randomStagger({ count: 10, seed: 123, delay: 0.1 })

      expect(delays1).not.toEqual(delays2)
    })

    it('should respect min/max multipliers', () => {
      const delays = randomStagger({
        count: 10,
        seed: 42,
        delay: 0.1,
        minMultiplier: 0.5,
        maxMultiplier: 1,
      })

      expect(delays).toHaveLength(10)
      delays.forEach(d => {
        expect(d).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe('customStagger', () => {
    it('should use custom function', () => {
      const delays = customStagger(
        { count: 5, delay: 0.1 },
        (index, total) => index / (total - 1)
      )

      expect(delays).toHaveLength(5)
      expect(delays[0]).toBe(0)
      expect(delays[4]).toBeCloseTo(0.4, 5)
    })

    it('should clamp values to 0-1', () => {
      const delays = customStagger(
        { count: 5, delay: 0.1 },
        () => 2 // Always returns value > 1
      )

      delays.forEach(d => {
        expect(d).toBeLessThanOrEqual(0.4)
      })
    })
  })

  describe('applyStagger', () => {
    it('should apply delays to options array', () => {
      const options = [{ delay: 0 }, { delay: 0 }, { delay: 0 }]
      const delays = [0, 0.1, 0.2]

      const result = applyStagger(options, delays)

      expect(result[0]?.delay).toBe(0)
      expect(result[1]?.delay).toBe(0.1)
      expect(result[2]?.delay).toBe(0.2)
    })

    it('should add to existing delays', () => {
      const options = [{ delay: 0.5 }, { delay: 0.5 }]
      const delays = [0, 0.1]

      const result = applyStagger(options, delays)

      expect(result[0]?.delay).toBe(0.5)
      expect(result[1]?.delay).toBe(0.6)
    })
  })

  describe('staggerPresets', () => {
    it('should have cascade preset', () => {
      const delays = staggerPresets.cascade(5)
      expect(delays).toHaveLength(5)
    })

    it('should have reveal preset', () => {
      const delays = staggerPresets.reveal(5)
      expect(delays).toHaveLength(5)
    })

    it('should have pop preset', () => {
      const delays = staggerPresets.pop(5)
      expect(delays).toHaveLength(5)
    })

    it('should have ripple preset', () => {
      const delays = staggerPresets.ripple(5)
      expect(delays).toHaveLength(5)
    })

    it('should have scatter preset', () => {
      const delays = staggerPresets.scatter(5)
      expect(delays).toHaveLength(5)
    })

    it('should have gridWave preset', () => {
      const delays = staggerPresets.gridWave(12, 4)
      expect(delays).toHaveLength(12)
    })

    it('should have gridRadial preset', () => {
      const delays = staggerPresets.gridRadial(9, 3)
      expect(delays).toHaveLength(9)
    })

    it('should have spiralIn preset', () => {
      const delays = staggerPresets.spiralIn(16, 4)
      expect(delays).toHaveLength(16)
    })

    it('should have spiralOut preset', () => {
      const delays = staggerPresets.spiralOut(16, 4)
      expect(delays).toHaveLength(16)
    })
  })
})
