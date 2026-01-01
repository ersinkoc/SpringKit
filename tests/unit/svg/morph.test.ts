import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createMorph, createMorphSequence, shapes } from '@oxog/springkit'

describe('SVG Morph', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('shapes', () => {
    it('should generate circle path', () => {
      const path = shapes.circle(50, 50, 25)
      expect(path).toContain('M')
      expect(path).toContain('A')
    })

    it('should generate rectangle path', () => {
      const path = shapes.rect(0, 0, 100, 100)
      expect(path).toContain('M')
      expect(path).toContain('L')
      expect(path).toContain('Z')
    })

    it('should generate rounded rectangle path', () => {
      const path = shapes.rect(0, 0, 100, 100, 10)
      expect(path).toContain('Q')
    })

    it('should generate polygon path', () => {
      const path = shapes.polygon(50, 50, 25, 6) // hexagon
      expect(path).toContain('M')
      expect(path).toContain('L')
      expect(path).toContain('Z')
    })

    it('should generate star path', () => {
      const path = shapes.star(50, 50, 25, 10, 5)
      expect(path).toContain('M')
      expect(path).toContain('L')
      expect(path).toContain('Z')
    })

    it('should generate heart path', () => {
      const path = shapes.heart(50, 50, 40)
      expect(path).toContain('M')
      expect(path).toContain('C')
      expect(path).toContain('Z')
    })

    it('should generate arrow paths in all directions', () => {
      const right = shapes.arrow(0, 50, 100, 50, 'right')
      const left = shapes.arrow(0, 50, 100, 50, 'left')
      const up = shapes.arrow(50, 0, 50, 100, 'up')
      const down = shapes.arrow(50, 0, 50, 100, 'down')

      expect(right).toContain('M')
      expect(left).toContain('M')
      expect(up).toContain('M')
      expect(down).toContain('M')
    })
  })

  describe('createMorph', () => {
    it('should create a morph controller', () => {
      const circlePath = shapes.circle(50, 50, 25)
      const morph = createMorph(circlePath)

      expect(morph).toHaveProperty('getPath')
      expect(morph).toHaveProperty('getProgress')
      expect(morph).toHaveProperty('morphTo')
      expect(morph).toHaveProperty('setProgress')
      expect(morph).toHaveProperty('subscribe')
      expect(morph).toHaveProperty('destroy')

      morph.destroy()
    })

    it('should return initial path', () => {
      const circlePath = shapes.circle(50, 50, 25)
      const morph = createMorph(circlePath)

      const path = morph.getPath()
      expect(path).toContain('M')
      expect(path).toContain('L')

      morph.destroy()
    })

    it('should start with progress 0', () => {
      const circlePath = shapes.circle(50, 50, 25)
      const morph = createMorph(circlePath)

      expect(morph.getProgress()).toBe(0)

      morph.destroy()
    })

    it('should subscribe to path changes', () => {
      const circlePath = shapes.circle(50, 50, 25)
      const morph = createMorph(circlePath)
      const callback = vi.fn()

      const unsubscribe = morph.subscribe(callback)

      // Should be called immediately with current path
      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith(expect.stringContaining('M'))

      unsubscribe()
      morph.destroy()
    })

    it('should unsubscribe correctly', () => {
      const circlePath = shapes.circle(50, 50, 25)
      const morph = createMorph(circlePath)
      const callback = vi.fn()

      const unsubscribe = morph.subscribe(callback)
      unsubscribe()

      morph.setProgress(0.5)

      // Should only have initial call
      expect(callback).toHaveBeenCalledTimes(1)

      morph.destroy()
    })

    it('should set progress directly', () => {
      const circlePath = shapes.circle(50, 50, 25)
      const squarePath = shapes.rect(25, 25, 50, 50)
      const morph = createMorph(circlePath)

      morph.morphTo(squarePath)
      morph.setProgress(0.5)

      expect(morph.getProgress()).toBe(0.5)

      morph.destroy()
    })

    it('should clamp progress between 0 and 1', () => {
      const circlePath = shapes.circle(50, 50, 25)
      const morph = createMorph(circlePath)

      morph.setProgress(-0.5)
      expect(morph.getProgress()).toBe(0)

      morph.setProgress(1.5)
      expect(morph.getProgress()).toBe(1)

      morph.destroy()
    })

    it('should call onProgress callback', () => {
      const onProgress = vi.fn()
      const circlePath = shapes.circle(50, 50, 25)
      const morph = createMorph(circlePath, { onProgress })

      // Initial subscription triggers callback
      expect(onProgress).toHaveBeenCalled()

      morph.destroy()
    })

    it('should destroy and cleanup', () => {
      const circlePath = shapes.circle(50, 50, 25)
      const morph = createMorph(circlePath)
      const callback = vi.fn()

      morph.subscribe(callback)
      morph.destroy()

      // Should not throw after destroy
      expect(() => morph.getPath()).not.toThrow()
      expect(() => morph.getProgress()).not.toThrow()
    })
  })

  describe('subscriber error isolation', () => {
    it('should continue notifying other subscribers if one throws', () => {
      const circlePath = shapes.circle(50, 50, 25)
      const morph = createMorph(circlePath)

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const errorCallback = vi.fn(() => {
        throw new Error('Test error')
      })
      const normalCallback = vi.fn()

      morph.subscribe(errorCallback)
      morph.subscribe(normalCallback)

      // Both should have been called on initial subscription
      expect(errorCallback).toHaveBeenCalled()
      expect(normalCallback).toHaveBeenCalled()

      // Now test setProgress also isolates errors
      errorCallback.mockClear()
      normalCallback.mockClear()

      morph.setProgress(0.5)

      expect(errorCallback).toHaveBeenCalled()
      expect(normalCallback).toHaveBeenCalled()

      consoleSpy.mockRestore()
      morph.destroy()
    })
  })

  describe('createMorphSequence', () => {
    it('should create a morph sequence', () => {
      const paths = [
        shapes.circle(50, 50, 25),
        shapes.rect(25, 25, 50, 50),
        shapes.star(50, 50, 25, 10, 5),
      ]

      const sequence = createMorphSequence(paths)

      expect(sequence).toHaveProperty('getPath')
      expect(sequence).toHaveProperty('getCurrentIndex')
      expect(sequence).toHaveProperty('morphToIndex')
      expect(sequence).toHaveProperty('morphToNext')
      expect(sequence).toHaveProperty('morphToPrevious')
      expect(sequence).toHaveProperty('subscribe')
      expect(sequence).toHaveProperty('destroy')

      sequence.destroy()
    })

    it('should start at index 0', () => {
      const paths = [
        shapes.circle(50, 50, 25),
        shapes.rect(25, 25, 50, 50),
      ]

      const sequence = createMorphSequence(paths)

      expect(sequence.getCurrentIndex()).toBe(0)

      sequence.destroy()
    })

    it('should throw if no paths provided', () => {
      expect(() => createMorphSequence([])).toThrow('At least one path is required')
    })

    it('should morph to specific index', () => {
      const paths = [
        shapes.circle(50, 50, 25),
        shapes.rect(25, 25, 50, 50),
        shapes.star(50, 50, 25, 10, 5),
      ]

      const sequence = createMorphSequence(paths)

      sequence.morphToIndex(2)
      expect(sequence.getCurrentIndex()).toBe(2)

      sequence.destroy()
    })

    it('should clamp index to valid range', () => {
      const paths = [
        shapes.circle(50, 50, 25),
        shapes.rect(25, 25, 50, 50),
      ]

      const sequence = createMorphSequence(paths)

      sequence.morphToIndex(10)
      expect(sequence.getCurrentIndex()).toBe(1) // clamped to max

      sequence.morphToIndex(-5)
      expect(sequence.getCurrentIndex()).toBe(0) // clamped to min

      sequence.destroy()
    })

    it('should morph to next with wrapping', () => {
      const paths = [
        shapes.circle(50, 50, 25),
        shapes.rect(25, 25, 50, 50),
      ]

      const sequence = createMorphSequence(paths)

      sequence.morphToNext()
      expect(sequence.getCurrentIndex()).toBe(1)

      sequence.morphToNext()
      expect(sequence.getCurrentIndex()).toBe(0) // wrapped

      sequence.destroy()
    })

    it('should morph to previous with wrapping', () => {
      const paths = [
        shapes.circle(50, 50, 25),
        shapes.rect(25, 25, 50, 50),
      ]

      const sequence = createMorphSequence(paths)

      sequence.morphToPrevious()
      expect(sequence.getCurrentIndex()).toBe(1) // wrapped to last

      sequence.morphToPrevious()
      expect(sequence.getCurrentIndex()).toBe(0)

      sequence.destroy()
    })
  })
})
