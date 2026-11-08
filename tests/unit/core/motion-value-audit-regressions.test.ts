import { describe, it, expect, afterEach, vi } from 'vitest'
import { installTestClock, type TestClock } from '../../../src/testing'
import { createMotionValue } from '../../../src/core/MotionValue'

describe('MotionValue audit regressions', () => {
  let clock: TestClock | null = null

  afterEach(() => {
    clock?.uninstall()
    clock = null
    vi.restoreAllMocks()
  })

  // F402: set() went on to use the spring after an animationStart listener
  // re-entered the MotionValue
  describe('animationStart listener re-entrancy', () => {
    it('does not throw when the listener destroys the value', () => {
      clock = installTestClock()
      const mv = createMotionValue(0)
      const ev: string[] = []
      mv.on('animationCancel', () => ev.push('cancel'))
      mv.on('animationStart', () => mv.destroy())
      expect(() => mv.set(100)).not.toThrow()
      expect(mv.isDestroyed()).toBe(true)
      expect(clock.pendingFrames).toBe(0)
      expect(ev).toEqual(['cancel'])
    })

    it('stays put when the listener stops the value', () => {
      clock = installTestClock()
      const mv = createMotionValue(0)
      mv.on('animationStart', () => mv.stop())
      mv.set(100)
      clock.advance(300)
      expect(mv.get()).toBe(0)
      expect(mv.isAnimating()).toBe(false)
      mv.destroy()
    })

    it('lets a nested set() win with a single completion', () => {
      clock = installTestClock()
      const mv = createMotionValue(0)
      let first = true
      let completes = 0
      mv.on('animationStart', () => {
        if (first) {
          first = false
          mv.set(50)
        }
      })
      mv.on('animationComplete', () => void completes++)
      mv.set(100)
      clock.runAll()
      expect(mv.get()).toBeCloseTo(50, 2)
      expect(completes).toBe(1)
      mv.destroy()
    })
  })

  // F403: getVelocity() kept reporting the last in-flight velocity after stop()
  it('reports zero velocity after stop()', () => {
    clock = installTestClock()
    const mv = createMotionValue(0)
    mv.set(100)
    clock.advance(100)
    expect(mv.getVelocity()).toBeGreaterThan(1)
    mv.stop()
    const at = mv.get()
    expect(mv.getVelocity()).toBe(0)
    clock.advance(200)
    expect(mv.get()).toBe(at)
    expect(mv.getVelocity()).toBe(0)
    mv.destroy()
  })
})
