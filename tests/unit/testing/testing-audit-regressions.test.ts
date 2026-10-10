import { describe, it, expect, afterEach } from 'vitest'
import { installTestClock, type TestClock } from '../../../src/testing/index'

/**
 * Runaway guard: the clock calls Math.max once per virtual frame, so counting
 * calls turns an infinite loop into a thrown error instead of a hung worker.
 */
function guarded<T>(fn: () => T): T {
  const realMax = Math.max
  let calls = 0
  Math.max = ((...args: number[]) => {
    if (++calls > 200_000) throw new Error('RUNAWAY: test clock looped forever')
    return realMax(...args)
  }) as typeof Math.max
  try {
    return fn()
  } finally {
    Math.max = realMax
  }
}

let clock: TestClock | null = null
afterEach(() => {
  clock?.uninstall()
  clock = null
})

describe('test clock audit regressions', () => {
  describe('F2901: non-finite advance() / runAll() arguments', () => {
    it('advance(NaN) and advance(Infinity) throw instead of spinning forever', () => {
      clock = installTestClock({ startTime: 0 })
      let fired = 0
      requestAnimationFrame(() => fired++)
      expect(() => guarded(() => clock!.advance(NaN))).toThrow(RangeError)
      expect(() => guarded(() => clock!.advance(Infinity))).toThrow(RangeError)
      // the clock is untouched and still usable
      expect(clock.now()).toBe(0)
      expect(fired).toBe(0)
      clock.advance(20)
      expect(fired).toBe(1)
      expect(clock.now()).toBe(20)
    })

    it('advance(-Infinity), negative and zero stay no-ops', () => {
      clock = installTestClock({ startTime: 100 })
      clock.advance(-Infinity)
      clock.advance(-5)
      clock.advance(0)
      expect(clock.now()).toBe(100)
    })

    it('runAll(NaN) throws even when a frame keeps rescheduling itself; runAll(Infinity) still settles finite work', () => {
      clock = installTestClock({ startTime: 0 })
      const loop = () => {
        requestAnimationFrame(loop)
      }
      requestAnimationFrame(loop)
      expect(() => guarded(() => clock!.runAll(NaN))).toThrow(RangeError)
      expect(() => clock!.runAll(500)).toThrow(/still running/)
      clock.uninstall()

      clock = installTestClock({ startTime: 0 })
      let n = 0
      const finite = () => {
        if (++n < 5) requestAnimationFrame(finite)
      }
      requestAnimationFrame(finite)
      expect(guarded(() => clock!.runAll(Infinity))).toBeGreaterThan(0)
      expect(n).toBe(5)
    })
  })

  describe('F2902: frameRate Infinity', () => {
    it('falls back to 60Hz like NaN / 0 / negative rates instead of hanging', () => {
      const frames = (frameRate: number) => {
        const c = installTestClock({ startTime: 0, frameRate })
        try {
          const stamps: number[] = []
          const loop = (t: number) => {
            stamps.push(Math.round(t * 1000) / 1000)
            requestAnimationFrame(loop)
          }
          requestAnimationFrame(loop)
          guarded(() => c.advance(100))
          return stamps
        } finally {
          c.uninstall()
        }
      }
      const expected = [16.667, 33.333, 50, 66.667, 83.333, 100]
      expect(frames(60)).toEqual(expected)
      expect(frames(NaN)).toEqual(expected)
      expect(frames(-Infinity)).toEqual(expected)
      expect(frames(Infinity)).toEqual(expected)
    })
  })
})
