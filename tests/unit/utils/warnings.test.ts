import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  validateSpringConfig,
  validateDragConfig,
  validateDecayConfig,
  clearWarnings,
  validateNumber,
  validateAnimationValue,
} from '../../../src/utils/warnings.js'

describe('warnings', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    clearWarnings()
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleWarnSpy.mockRestore()
  })

  describe('validateSpringConfig', () => {
    it('should warn about high stiffness with low damping', () => {
      validateSpringConfig({ stiffness: 500, damping: 5 })
      expect(consoleWarnSpy).toHaveBeenCalled()
      expect(consoleWarnSpy.mock.calls[0]?.[0]).toContain('excessive oscillation')
    })

    it('should warn about very low stiffness', () => {
      validateSpringConfig({ stiffness: 10 })
      expect(consoleWarnSpy).toHaveBeenCalled()
      expect(consoleWarnSpy.mock.calls[0]?.[0]).toContain('sluggish')
    })

    it('should warn about damping higher than stiffness', () => {
      validateSpringConfig({ stiffness: 50, damping: 100 })
      expect(consoleWarnSpy).toHaveBeenCalled()
      expect(consoleWarnSpy.mock.calls[0]?.[0]).toContain('springy')
    })

    it('should warn about zero or negative mass', () => {
      validateSpringConfig({ mass: 0 })
      expect(consoleWarnSpy).toHaveBeenCalled()
      expect(consoleWarnSpy.mock.calls[0]?.[0]).toContain('positive')
    })

    it('should warn about very high mass', () => {
      validateSpringConfig({ mass: 15 })
      expect(consoleWarnSpy).toHaveBeenCalled()
      expect(consoleWarnSpy.mock.calls[0]?.[0]).toContain('slow')
    })

    it('should not warn twice for the same message', () => {
      validateSpringConfig({ stiffness: 500, damping: 5 })
      validateSpringConfig({ stiffness: 500, damping: 5 })
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
    })

    it('should not warn for valid config', () => {
      validateSpringConfig({ stiffness: 100, damping: 10, mass: 1 })
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })
  })

  describe('validateDragConfig', () => {
    it('should warn about rubberBandFactor out of range', () => {
      validateDragConfig({ rubberBandFactor: 1.5 })
      expect(consoleWarnSpy).toHaveBeenCalled()
      expect(consoleWarnSpy.mock.calls[0]?.[0]).toContain('0 and 1')
    })

    it('should warn about inverted left/right bounds', () => {
      validateDragConfig({ bounds: { left: 100, right: 50 } })
      expect(consoleWarnSpy).toHaveBeenCalled()
      expect(consoleWarnSpy.mock.calls[0]?.[0]).toContain('inverted')
    })

    it('should warn about inverted top/bottom bounds', () => {
      validateDragConfig({ bounds: { top: 200, bottom: 100 } })
      expect(consoleWarnSpy).toHaveBeenCalled()
      expect(consoleWarnSpy.mock.calls[0]?.[0]).toContain('inverted')
    })

    it('should not warn for valid config', () => {
      validateDragConfig({ rubberBandFactor: 0.5, bounds: { left: 0, right: 100 } })
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })
  })

  describe('validateDecayConfig', () => {
    it('should warn about zero velocity', () => {
      validateDecayConfig({ velocity: 0 })
      expect(consoleWarnSpy).toHaveBeenCalled()
      expect(consoleWarnSpy.mock.calls[0]?.[0]).toContain('zero velocity')
    })

    it('should warn about deceleration out of range', () => {
      validateDecayConfig({ velocity: 100, deceleration: 1.5 })
      expect(consoleWarnSpy).toHaveBeenCalled()
      expect(consoleWarnSpy.mock.calls[0]?.[0]).toContain('between 0 and 1')
    })

    it('should not warn for valid config', () => {
      validateDecayConfig({ velocity: 500, deceleration: 0.995 })
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })
  })

  describe('clearWarnings', () => {
    it('should allow same warning to be shown again after clear', () => {
      validateSpringConfig({ stiffness: 500, damping: 5 })
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)

      clearWarnings()

      validateSpringConfig({ stiffness: 500, damping: 5 })
      expect(consoleWarnSpy).toHaveBeenCalledTimes(2)
    })
  })

  describe('validateNumber', () => {
    it('should return value for valid number', () => {
      const result = validateNumber(42, 'testValue')
      expect(result).toBe(42)
    })

    it('should return default value for NaN', () => {
      const result = validateNumber(NaN, 'testValue', 10)
      expect(result).toBe(10)
    })

    it('should return default value for non-number', () => {
      const result = validateNumber('not a number' as unknown as number, 'testValue', 5)
      expect(result).toBe(5)
    })

    it('should return default value for Infinity', () => {
      const result = validateNumber(Infinity, 'testValue', 0)
      expect(result).toBe(0)
    })

    it('should return default value for negative Infinity', () => {
      const result = validateNumber(-Infinity, 'testValue', 0)
      expect(result).toBe(0)
    })

    it('should warn about NaN in development', () => {
      validateNumber(NaN, 'testProp', 0)
      expect(consoleWarnSpy).toHaveBeenCalled()
      expect(consoleWarnSpy.mock.calls[0]?.[0]).toContain('NaN')
    })

    it('should warn about Infinity in development', () => {
      validateNumber(Infinity, 'testProp', 0)
      expect(consoleWarnSpy).toHaveBeenCalled()
      expect(consoleWarnSpy.mock.calls[0]?.[0]).toContain('Infinity')
    })
  })

  describe('validateAnimationValue', () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      consoleErrorSpy.mockRestore()
    })

    it('should return value for valid number', () => {
      const result = validateAnimationValue(42, 'testContext')
      expect(result).toBe(42)
    })

    it('should return 0 and error for NaN', () => {
      const result = validateAnimationValue(NaN, 'SpringValue.set')
      expect(result).toBe(0)
      expect(consoleErrorSpy).toHaveBeenCalled()
      expect(consoleErrorSpy.mock.calls[0]?.[0]).toContain('Invalid animation value')
    })

    it('should return 0 and error for non-number', () => {
      const result = validateAnimationValue('invalid' as unknown as number, 'SpringValue.set')
      expect(result).toBe(0)
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('should return 0 and error for Infinity', () => {
      const result = validateAnimationValue(Infinity, 'SpringValue.set')
      expect(result).toBe(0)
      expect(consoleErrorSpy).toHaveBeenCalled()
      expect(consoleErrorSpy.mock.calls[0]?.[0]).toContain('Infinity')
    })

    it('should return 0 and error for negative Infinity', () => {
      const result = validateAnimationValue(-Infinity, 'SpringValue.set')
      expect(result).toBe(0)
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })
})
