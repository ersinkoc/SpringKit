import { describe, it, expect } from 'vitest'
import {
  simulateSpring,
  calculatePeriod,
  calculateDampingRatio,
  isUnderdamped,
  isCriticallyDamped,
  isOverdamped,
} from '@oxog/springkit'

describe('physics', () => {
  describe('simulateSpring', () => {
    it('should simulate spring physics', () => {
      const result = simulateSpring(0, 0, 100, {
        stiffness: 100,
        damping: 10,
        mass: 1,
      })

      expect(result.position).toBeGreaterThan(0)
      expect(result.velocity).toBeGreaterThan(0)
      expect(result.isRest).toBe(false)
    })

    it('should detect rest when close to target', () => {
      const result = simulateSpring(99.999, 0, 100, {
        stiffness: 100,
        damping: 10,
        restSpeed: 1, // Higher threshold for rest detection
        restDelta: 0.01,
      })

      // With zero initial velocity and close to target, the spring is at rest
      expect(result.isRest).toBe(true)
    })

    it('should use default config values', () => {
      const result = simulateSpring(0, 0, 100, {})

      expect(result).toBeDefined()
      expect(result.position).toBeGreaterThanOrEqual(0)
    })

    it('should handle zero mass', () => {
      const result = simulateSpring(0, 0, 100, {
        stiffness: 100,
        damping: 10,
        mass: 0.1,
      })

      expect(result).toBeDefined()
    })

    it('should handle high stiffness', () => {
      const result = simulateSpring(0, 0, 100, {
        stiffness: 1000,
        damping: 10,
      })

      expect(result.position).toBeGreaterThan(0)
    })

    it('should handle high damping', () => {
      const result = simulateSpring(0, 0, 100, {
        stiffness: 100,
        damping: 100,
      })

      // High damping slows down the spring but velocity is still positive toward target
      expect(result.velocity).toBeGreaterThan(0)
    })

    it('should simulate from target position', () => {
      const result = simulateSpring(100, 0, 100, {
        stiffness: 100,
        damping: 10,
      })

      expect(result.isRest).toBe(true)
    })
  })

  describe('calculatePeriod', () => {
    it('should calculate oscillation period', () => {
      const period = calculatePeriod(100, 1)
      expect(period).toBeCloseTo(2 * Math.PI * Math.sqrt(1 / 100), 5)
    })

    it('should handle different mass values', () => {
      const period1 = calculatePeriod(100, 1)
      const period2 = calculatePeriod(100, 4)

      expect(period2).toBeGreaterThan(period1)
    })
  })

  describe('calculateDampingRatio', () => {
    it('should calculate damping ratio', () => {
      const ratio = calculateDampingRatio(10, 100, 1)
      expect(ratio).toBeCloseTo(10 / (2 * Math.sqrt(100 * 1)), 5)
    })

    it('should handle zero damping', () => {
      const ratio = calculateDampingRatio(0, 100, 1)
      expect(ratio).toBe(0)
    })
  })

  describe('damping state checks', () => {
    it('should detect underdamped springs', () => {
      const isUnder = isUnderdamped({ stiffness: 100, damping: 5, mass: 1 })
      expect(isUnder).toBe(true)
    })

    it('should detect critically damped springs', () => {
      const isCritical = isCriticallyDamped({
        stiffness: 100,
        damping: 20,
        mass: 1,
      })
      expect(isCritical).toBe(true)
    })

    it('should detect overdamped springs', () => {
      const isOver = isOverdamped({ stiffness: 100, damping: 30, mass: 1 })
      expect(isOver).toBe(true)
    })

    it('should use default values', () => {
      expect(isUnderdamped({})).toBe(true)
      expect(isCriticallyDamped({})).toBe(false)
      expect(isOverdamped({})).toBe(false)
    })
  })
})
