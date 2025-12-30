import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { globalLoop, type Animatable, AnimationState } from '../../../src/animation/loop'

describe('AnimationLoop', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('globalLoop', () => {
    it('should be defined', () => {
      expect(globalLoop).toBeDefined()
      expect(globalLoop.size).toBe(0)
    })
  })

  describe('AnimationState enum', () => {
    it('should have all states', () => {
      expect(AnimationState.Idle).toBe('idle')
      expect(AnimationState.Running).toBe('running')
      expect(AnimationState.Paused).toBe('paused')
      expect(AnimationState.Complete).toBe('complete')
    })
  })

  describe('adding animations', () => {
    it('should add an animation to the loop', () => {
      const animation: Animatable = {
        update: vi.fn(),
        isComplete: () => false,
      }

      globalLoop.add(animation)

      expect(globalLoop.size).toBeGreaterThan(0)

      // Clean up
      globalLoop.remove(animation)
    })

    it('should add multiple animations', () => {
      const animation1: Animatable = {
        update: vi.fn(),
        isComplete: () => false,
      }
      const animation2: Animatable = {
        update: vi.fn(),
        isComplete: () => false,
      }

      globalLoop.add(animation1)
      globalLoop.add(animation2)

      expect(globalLoop.size).toBeGreaterThan(0)

      // Clean up
      globalLoop.remove(animation1)
      globalLoop.remove(animation2)
    })
  })

  describe('removing animations', () => {
    it('should remove an animation from the loop', () => {
      const animation: Animatable = {
        update: vi.fn(),
        isComplete: () => false,
      }

      globalLoop.add(animation)
      const sizeBefore = globalLoop.size

      globalLoop.remove(animation)

      expect(globalLoop.size).toBeLessThan(sizeBefore)
    })

    it('should stop loop when no animations remain', () => {
      const animation: Animatable = {
        update: vi.fn(),
        isComplete: () => false,
      }

      globalLoop.add(animation)
      globalLoop.remove(animation)

      expect(globalLoop.size).toBe(0)
    })

    it('should handle removing non-existent animation', () => {
      const animation: Animatable = {
        update: vi.fn(),
        isComplete: () => false,
      }

      // Should not throw
      expect(() => {
        globalLoop.remove(animation)
      }).not.toThrow()
    })
  })

  describe(' Animatable interface', () => {
    it('should accept valid animatable object', () => {
      const animation: Animatable = {
        update: vi.fn(),
        isComplete: () => false,
      }

      expect(animation.update).toBeDefined()
      expect(animation.isComplete).toBeDefined()
    })
  })

  describe('completed animation removal', () => {
    it('should remove completed animations from loop', async () => {
      let completed = false
      const animation: Animatable = {
        update: vi.fn(),
        isComplete: () => completed,
      }

      globalLoop.add(animation)

      // Wait a bit for the loop to process
      await new Promise(resolve => setTimeout(resolve, 50))

      completed = true

      // Wait for loop to detect completion and remove
      await new Promise(resolve => setTimeout(resolve, 100))

      // Animation should be removed by the loop
      expect(globalLoop.size).toBe(0)
    })
  })

  describe('edge cases', () => {
    it('should handle adding same animation multiple times', () => {
      const animation: Animatable = {
        update: vi.fn(),
        isComplete: () => false,
      }

      globalLoop.add(animation)
      globalLoop.add(animation) // Add again (Set should handle deduplication)

      expect(globalLoop.size).toBeGreaterThan(0)

      // Single remove should remove it
      globalLoop.remove(animation)
      expect(globalLoop.size).toBe(0)
    })

    it('should handle animation that becomes complete immediately', () => {
      const animation: Animatable = {
        update: vi.fn(),
        isComplete: () => true,
      }

      globalLoop.add(animation)

      // Animation should be removed quickly
      expect(globalLoop.size).toBe(0)
    })

    it('should handle rapid add/remove cycles', () => {
      const animation: Animatable = {
        update: vi.fn(),
        isComplete: () => false,
      }

      for (let i = 0; i < 10; i++) {
        globalLoop.add(animation)
        globalLoop.remove(animation)
      }

      expect(globalLoop.size).toBe(0)
    })
  })

  describe('onFrame callback', () => {
    it('should call onFrame callback with delta time', async () => {
      const frameCallback = vi.fn()
      const unsubscribe = globalLoop.onFrame(frameCallback)

      const animation: Animatable = {
        update: vi.fn(),
        isComplete: () => false,
      }

      globalLoop.add(animation)

      // Wait for some frames
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(frameCallback).toHaveBeenCalled()

      // Delta time should be positive
      const deltaTime = frameCallback.mock.calls[0]?.[0]
      expect(deltaTime).toBeGreaterThan(0)

      unsubscribe()
      globalLoop.remove(animation)
    })

    it('should allow unsubscribing from onFrame', async () => {
      const frameCallback = vi.fn()
      const unsubscribe = globalLoop.onFrame(frameCallback)

      const animation: Animatable = {
        update: vi.fn(),
        isComplete: () => false,
      }

      globalLoop.add(animation)

      // Wait for some frames
      await new Promise(resolve => setTimeout(resolve, 30))

      const callCountBeforeUnsubscribe = frameCallback.mock.calls.length

      unsubscribe()

      // Wait for more frames
      await new Promise(resolve => setTimeout(resolve, 30))

      // Should not have received more calls after unsubscribe
      expect(frameCallback.mock.calls.length).toBe(callCountBeforeUnsubscribe)

      globalLoop.remove(animation)
    })
  })

  describe('animation ID tracking', () => {
    it('should return unique ID when adding animation', () => {
      const animation1: Animatable = {
        update: vi.fn(),
        isComplete: () => false,
      }
      const animation2: Animatable = {
        update: vi.fn(),
        isComplete: () => false,
      }

      const id1 = globalLoop.add(animation1)
      const id2 = globalLoop.add(animation2)

      expect(id1).not.toBe(id2)
      expect(typeof id1).toBe('number')
      expect(typeof id2).toBe('number')

      globalLoop.remove(animation1)
      globalLoop.remove(animation2)
    })

    it('should return same ID when adding same animation twice', () => {
      const animation: Animatable = {
        update: vi.fn(),
        isComplete: () => false,
      }

      const id1 = globalLoop.add(animation)
      const id2 = globalLoop.add(animation)

      expect(id1).toBe(id2)

      globalLoop.remove(animation)
    })
  })

  describe('getFPS', () => {
    it('should return a reasonable FPS value', async () => {
      const animation: Animatable = {
        update: vi.fn(),
        isComplete: () => false,
      }

      globalLoop.add(animation)

      // Wait for some frames to establish timing
      await new Promise(resolve => setTimeout(resolve, 100))

      const fps = globalLoop.getFPS()

      // FPS should be a positive number
      // Note: In test environments, FPS can vary wildly, so we just check it's positive
      expect(fps).toBeGreaterThan(0)

      globalLoop.remove(animation)
    })
  })

  describe('getAliveCount', () => {
    it('should return count of alive animations', () => {
      // First, get the current count to account for any lingering animations
      const initialCount = globalLoop.getAliveCount()

      const animation1: Animatable = {
        update: vi.fn(),
        isComplete: () => false,
      }
      const animation2: Animatable = {
        update: vi.fn(),
        isComplete: () => false,
      }

      globalLoop.add(animation1)
      globalLoop.add(animation2)

      // Should have 2 more than initial
      expect(globalLoop.getAliveCount()).toBe(initialCount + 2)

      globalLoop.remove(animation1)
      globalLoop.remove(animation2)

      // Should be back to initial
      expect(globalLoop.getAliveCount()).toBe(initialCount)
    })
  })
})
