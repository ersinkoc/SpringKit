import { describe, it, expect } from 'vitest'
import {
  defaultConfig,
  springPresets,
  configFromDuration,
  configFromBounce,
  getPhysicsPreset,
  createFeeling,
  adjustSpeed,
  adjustBounce,
  physicsPresets,
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

  describe('physicsPresets', () => {
    it('should have UI interaction presets', () => {
      expect(physicsPresets.button.stiffness).toBe(400)
      expect(physicsPresets.toggle.stiffness).toBe(500)
      expect(physicsPresets.checkbox.stiffness).toBe(600)
      expect(physicsPresets.hover.stiffness).toBe(300)
      expect(physicsPresets.focus.stiffness).toBe(200)
    })

    it('should have layout presets', () => {
      expect(physicsPresets.pageTransition.stiffness).toBe(100)
      expect(physicsPresets.modalEnter.stiffness).toBe(300)
      expect(physicsPresets.sidebar.stiffness).toBe(200)
    })

    it('should have gesture presets', () => {
      expect(physicsPresets.dragRelease.stiffness).toBe(150)
      expect(physicsPresets.swipe.stiffness).toBe(250)
      expect(physicsPresets.snap.stiffness).toBe(400)
    })

    it('should have natural physics presets', () => {
      expect(physicsPresets.pendulum.stiffness).toBe(50)
      expect(physicsPresets.jelly.stiffness).toBe(150)
      expect(physicsPresets.elastic.stiffness).toBe(200)
      expect(physicsPresets.heavy.stiffness).toBe(150)
      expect(physicsPresets.light.stiffness).toBe(400)
    })

    it('should have mobile presets', () => {
      expect(physicsPresets.ios.stiffness).toBe(300)
      expect(physicsPresets.android.stiffness).toBe(350)
      expect(physicsPresets.haptic.stiffness).toBe(600)
    })
  })

  describe('getPhysicsPreset', () => {
    it('should return a copy of the preset', () => {
      const preset = getPhysicsPreset('button')
      expect(preset.stiffness).toBe(400)
      expect(preset.damping).toBe(30)

      // Modifying returned preset should not affect original
      preset.stiffness = 999
      expect(physicsPresets.button.stiffness).toBe(400)
    })

    it('should return preset for all preset names', () => {
      const presetNames = Object.keys(physicsPresets) as Array<keyof typeof physicsPresets>
      presetNames.forEach(name => {
        const preset = getPhysicsPreset(name)
        expect(preset).toBeDefined()
        expect(preset.stiffness).toBeDefined()
        expect(preset.damping).toBeDefined()
      })
    })
  })

  describe('createFeeling', () => {
    it('should create snappy feeling', () => {
      const config = createFeeling('snappy')
      expect(config.stiffness).toBe(400)
      expect(config.damping).toBe(30)
      expect(config.mass).toBe(0.8)
    })

    it('should create smooth feeling', () => {
      const config = createFeeling('smooth')
      expect(config.stiffness).toBe(150)
      expect(config.damping).toBe(25)
      expect(config.mass).toBe(1.2)
    })

    it('should create bouncy feeling', () => {
      const config = createFeeling('bouncy')
      expect(config.stiffness).toBe(300)
      expect(config.damping).toBe(12)
      expect(config.mass).toBe(1)
    })

    it('should create heavy feeling', () => {
      const config = createFeeling('heavy')
      expect(config.stiffness).toBe(100)
      expect(config.damping).toBe(30)
      expect(config.mass).toBe(2.5)
    })

    it('should create light feeling', () => {
      const config = createFeeling('light')
      expect(config.stiffness).toBe(400)
      expect(config.damping).toBe(25)
      expect(config.mass).toBe(0.5)
    })

    it('should create elastic feeling', () => {
      const config = createFeeling('elastic')
      expect(config.stiffness).toBe(200)
      expect(config.damping).toBe(10)
      expect(config.mass).toBe(1.2)
    })
  })

  describe('adjustSpeed', () => {
    it('should increase stiffness and damping for faster speed', () => {
      const baseConfig = { stiffness: 100, damping: 10 }
      const adjusted = adjustSpeed(baseConfig, 2)
      expect(adjusted.stiffness).toBe(200)
      expect(adjusted.damping).toBeCloseTo(14.14, 1)
    })

    it('should decrease stiffness and damping for slower speed', () => {
      const baseConfig = { stiffness: 100, damping: 10 }
      const adjusted = adjustSpeed(baseConfig, 0.5)
      expect(adjusted.stiffness).toBe(50)
      expect(adjusted.damping).toBeCloseTo(7.07, 1)
    })

    it('should preserve other config properties', () => {
      const baseConfig = { stiffness: 100, damping: 10, mass: 2, clamp: true }
      const adjusted = adjustSpeed(baseConfig, 1.5)
      expect(adjusted.mass).toBe(2)
      expect(adjusted.clamp).toBe(true)
    })

    it('should use defaults when stiffness and damping are undefined', () => {
      const baseConfig = {}
      const adjusted = adjustSpeed(baseConfig, 1)
      expect(adjusted.stiffness).toBe(100)
      expect(adjusted.damping).toBe(10)
    })
  })

  describe('adjustBounce', () => {
    it('should set high damping for no bounce', () => {
      const baseConfig = { stiffness: 100, damping: 10 }
      const adjusted = adjustBounce(baseConfig, 0)
      expect(adjusted.damping).toBe(40)
    })

    it('should set low damping for max bounce', () => {
      const baseConfig = { stiffness: 100, damping: 10 }
      const adjusted = adjustBounce(baseConfig, 1)
      expect(adjusted.damping).toBe(5)
    })

    it('should set medium damping for half bounce', () => {
      const baseConfig = { stiffness: 100, damping: 10 }
      const adjusted = adjustBounce(baseConfig, 0.5)
      expect(adjusted.damping).toBeCloseTo(22.5, 0)
    })

    it('should preserve stiffness and other properties', () => {
      const baseConfig = { stiffness: 200, damping: 15, mass: 1.5 }
      const adjusted = adjustBounce(baseConfig, 0.3)
      expect(adjusted.stiffness).toBe(200)
      expect(adjusted.mass).toBe(1.5)
    })

    it('should clamp damping to valid range', () => {
      const baseConfig = { stiffness: 100, damping: 10 }
      const adjustedHigh = adjustBounce(baseConfig, -1)
      const adjustedLow = adjustBounce(baseConfig, 2)
      expect(adjustedHigh.damping).toBe(40)
      expect(adjustedLow.damping).toBe(5)
    })
  })
})
