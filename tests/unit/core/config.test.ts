import { describe, it, expect } from 'vitest'
import {
  defaultConfig,
  springPresets,
  configFromDuration,
  configFromBounce,
} from '../../../src/core/config'

describe('config', () => {
  describe('defaultConfig', () => {
    it('should have correct default values', () => {
      expect(defaultConfig.stiffness).toBe(100)
      expect(defaultConfig.damping).toBe(10)
      expect(defaultConfig.mass).toBe(1)
      expect(defaultConfig.velocity).toBe(0)
      expect(defaultConfig.restSpeed).toBe(0.01)
      expect(defaultConfig.restDelta).toBe(0.01)
      expect(defaultConfig.clamp).toBe(false)
    })
  })

  describe('springPresets', () => {
    it('should have default preset', () => {
      expect(springPresets.default.stiffness).toBe(100)
      expect(springPresets.default.damping).toBe(10)
    })

    it('should have gentle preset', () => {
      expect(springPresets.gentle.stiffness).toBe(120)
      expect(springPresets.gentle.damping).toBe(14)
    })

    it('should have wobbly preset', () => {
      expect(springPresets.wobbly.stiffness).toBe(180)
      expect(springPresets.wobbly.damping).toBe(12)
    })

    it('should have stiff preset', () => {
      expect(springPresets.stiff.stiffness).toBe(210)
      expect(springPresets.stiff.damping).toBe(20)
    })

    it('should have slow preset', () => {
      expect(springPresets.slow.stiffness).toBe(280)
      expect(springPresets.slow.damping).toBe(60)
    })

    it('should have molasses preset', () => {
      expect(springPresets.molasses.stiffness).toBe(280)
      expect(springPresets.molasses.damping).toBe(120)
    })

    it('should have bounce preset', () => {
      expect(springPresets.bounce.stiffness).toBe(200)
      expect(springPresets.bounce.damping).toBe(8)
    })

    it('should have noWobble preset', () => {
      expect(springPresets.noWobble.stiffness).toBe(170)
      expect(springPresets.noWobble.damping).toBe(26)
    })
  })

  describe('configFromDuration', () => {
    it('should return fast config for duration < 300ms', () => {
      const config = configFromDuration(200)
      expect(config.stiffness).toBe(170)
      expect(config.damping).toBe(26)
    })

    it('should return medium config for duration < 500ms', () => {
      const config = configFromDuration(400)
      expect(config.stiffness).toBe(100)
      expect(config.damping).toBe(20)
    })

    it('should return slow config for duration >= 500ms', () => {
      const config = configFromDuration(600)
      expect(config.stiffness).toBe(80)
      expect(config.damping).toBe(15)
    })

    it('should return fast config for duration exactly 300ms', () => {
      const config = configFromDuration(300)
      expect(config.stiffness).toBe(100)
      expect(config.damping).toBe(20)
    })

    it('should return medium config for duration exactly 500ms', () => {
      const config = configFromDuration(500)
      expect(config.stiffness).toBe(80)
      expect(config.damping).toBe(15)
    })

    it('should handle very small durations', () => {
      const config = configFromDuration(50)
      expect(config.stiffness).toBe(170)
      expect(config.damping).toBe(26)
    })

    it('should handle very large durations', () => {
      const config = configFromDuration(5000)
      expect(config.stiffness).toBe(80)
      expect(config.damping).toBe(15)
    })
  })

  describe('configFromBounce', () => {
    it('should return no bounce config for bounce <= 0', () => {
      const config = configFromBounce(0)
      expect(config.stiffness).toBe(170)
      expect(config.damping).toBe(26)
    })

    it('should return no bounce config for negative bounce', () => {
      const config = configFromBounce(-0.5)
      expect(config.stiffness).toBe(170)
      expect(config.damping).toBe(26)
    })

    it('should return low bounce config for bounce <= 0.25', () => {
      const config = configFromBounce(0.1)
      expect(config.stiffness).toBe(200)
      expect(config.damping).toBe(12)
    })

    it('should return low bounce config for bounce exactly 0.25', () => {
      const config = configFromBounce(0.25)
      expect(config.stiffness).toBe(200)
      expect(config.damping).toBe(12)
    })

    it('should return high bounce config for bounce > 0.25', () => {
      const config = configFromBounce(0.5)
      expect(config.stiffness).toBe(200)
      expect(config.damping).toBe(8)
    })

    it('should return high bounce config for very high bounce', () => {
      const config = configFromBounce(1)
      expect(config.stiffness).toBe(200)
      expect(config.damping).toBe(8)
    })
  })
})
