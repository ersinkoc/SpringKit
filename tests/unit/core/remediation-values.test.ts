import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMotionValue, createSpringValue, spring, decay, globalLoop } from '../../../src/index'
import { installTestClock } from '../../../src/testing'

afterEach(() => { globalLoop.setTimeScale(1); vi.restoreAllMocks() })

describe('value contracts', () => {
  it('keeps subscription handles independent, including stale handles', () => {
    for (const factory of [createMotionValue<number>, createSpringValue]) {
      const value = factory(0)
      const callback = vi.fn()
      const first = value.subscribe(callback)
      const second = value.subscribe(callback)
      callback.mockClear()
      first()
      value.jump(1)
      expect(callback).toHaveBeenCalledTimes(1)
      second()
      value.subscribe(callback)
      first()
      callback.mockClear()
      value.jump(2)
      expect(callback).toHaveBeenCalledTimes(1)
      value.destroy()
    }
  })

  it.each([NaN, Infinity, -Infinity])('keeps numeric state finite for %s', (invalid) => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const value = createMotionValue(invalid)
    expect(Number.isFinite(value.get())).toBe(true)
    value.jump(invalid)
    expect(Number.isFinite(value.get())).toBe(true)
    value.set(invalid, false)
    expect(Number.isFinite(value.get())).toBe(true)
    value.destroy()
    const text = createMotionValue('hello')
    text.jump('world')
    expect(text.get()).toBe('world')
    text.destroy()
  })

  it('does not schedule a completion poll per MotionValue', () => {
    const clock = installTestClock()
    const values = Array.from({ length: 100 }, () => createMotionValue(0))
    try {
      values.forEach(value => value.set(1000))
      expect(clock.pendingFrames).toBe(1)
      clock.runAll()
      expect(values.every(value => !value.isAnimating() && value.get() === 1000)).toBe(true)
    } finally { values.forEach(value => value.destroy()); clock.uninstall() }
  })
})

describe('animation time equivalence', () => {
  it.each([0.1, 1, 2, 5, 10])('preserves spring and decay motion at %sx', scale => {
    const sample = (rate: number) => {
      const clock = installTestClock({ startTime: 0 })
      globalLoop.setTimeScale(rate)
      const s = spring(0, 100, { stiffness: 100, damping: 10 }).start()
      const d = decay({ velocity: 1000 }).start()
      try { clock.advance(1000 / rate); return [s.getValue(), d.getValue()] }
      finally { s.destroy(); d.destroy(); clock.uninstall() }
    }
    const control = sample(1)
    const actual = sample(scale)
    expect(actual[0]).toBeCloseTo(control[0]!, 7)
    expect(actual[1]).toBeCloseTo(control[1]!, 7)
  })
})
