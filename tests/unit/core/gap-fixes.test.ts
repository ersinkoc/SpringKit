import { describe, it, expect, afterEach } from 'vitest'
import { spring } from '../../../src/core/spring'
import { createSpringValue } from '../../../src/core/spring-value'
import { createSpringGroup } from '../../../src/core/spring-group'
import { createMotionValue, type MotionValueEvent } from '../../../src/core/MotionValue'
import {
  configFromDuration,
  configFromBounce,
  adjustSpeed,
  adjustBounce,
} from '../../../src/core/config'
import { springMotion, calculateDampingRatio } from '../../../src/core/physics'
import { variantPresets, calculateStaggerDelays, type Variant } from '../../../src/core/variants'
import { installTestClock, type TestClock } from '../../../src/testing/index'

let clock: TestClock | null = null
afterEach(() => {
  clock?.uninstall()
  clock = null
})

/** Whether a promise has settled (after draining pending microtasks) */
async function isSettled(promise: Promise<unknown>): Promise<boolean> {
  let settled = false
  void promise.then(() => {
    settled = true
  })
  for (let i = 0; i < 10; i++) await Promise.resolve()
  return settled
}

describe('finished settles on stop()', () => {
  it('spring().stop() resolves the pending finished promise', async () => {
    clock = installTestClock()
    const anim = spring(0, 100).start()
    clock.advance(50)
    anim.stop()
    expect(await isSettled(anim.finished)).toBe(true)
  })

  it('start() after stop() creates a fresh pending finished for the new run', async () => {
    clock = installTestClock()
    const anim = spring(0, 100, { stiffness: 300, damping: 30 }).start()
    clock.advance(50)
    anim.stop()
    const stopped = anim.finished

    anim.start()
    expect(anim.finished).not.toBe(stopped)
    expect(await isSettled(anim.finished)).toBe(false)

    clock.runAll()
    expect(anim.getValue()).toBe(100)
    expect(await isSettled(anim.finished)).toBe(true)
  })

  it('start() after natural completion creates a fresh pending finished', async () => {
    clock = installTestClock()
    const anim = spring(0, 100, { stiffness: 300, damping: 30 }).start()
    clock.runAll()
    expect(await isSettled(anim.finished)).toBe(true)

    anim.set(200)
    anim.start()
    expect(await isSettled(anim.finished)).toBe(false)
    clock.runAll()
    expect(anim.getValue()).toBe(200)
    expect(await isSettled(anim.finished)).toBe(true)
  })

  it('pause() and start() while running keep the same pending promise', async () => {
    clock = installTestClock()
    const anim = spring(0, 100).start()
    const first = anim.finished
    anim.start()
    expect(anim.finished).toBe(first)
    anim.pause()
    expect(await isSettled(first)).toBe(false)
    anim.resume()
    expect(anim.finished).toBe(first)
    anim.destroy()
  })

  it('SpringValue, SpringGroup and MotionValue settle on stop() too', async () => {
    clock = installTestClock()
    const value = createSpringValue(0)
    value.set(100)
    clock.advance(50)
    value.stop()
    expect(await isSettled(value.finished)).toBe(true)

    const group = createSpringGroup({ x: 0, y: 0 })
    group.set({ x: 100, y: 50 })
    clock.advance(50)
    group.stop()
    expect(await isSettled(group.finished)).toBe(true)

    const mv = createMotionValue(0)
    mv.set(100)
    clock.advance(50)
    mv.stop()
    expect(mv.isAnimating()).toBe(false)
    expect(clock.pendingFrames).toBe(0)
  })
})

describe('perceptual config helpers', () => {
  it('configFromDuration gives a distinct critically damped spring per duration', () => {
    const fast = configFromDuration(300)
    const slow = configFromDuration(5000)
    expect(fast.stiffness).not.toBe(slow.stiffness)
    expect(fast.stiffness).toBeCloseTo(Math.pow((2 * Math.PI) / 0.3, 2), 6)
    expect(fast.damping).toBeCloseTo((4 * Math.PI) / 0.3, 6)
    expect(calculateDampingRatio(fast.damping!, fast.stiffness!, fast.mass ?? 1)).toBeCloseTo(1, 6)
    expect(calculateDampingRatio(slow.damping!, slow.stiffness!, slow.mass ?? 1)).toBeCloseTo(1, 6)
  })

  it('configFromDuration(ms) is perceptually done after ms', () => {
    for (const ms of [150, 300, 800, 5000]) {
      const motion = springMotion(configFromDuration(ms), 1, 0)
      // more than half the distance remains at a quarter of the duration...
      expect(motion(ms / 4000).position).toBeGreaterThan(0.5)
      // ...and less than 2% at the duration
      expect(Math.abs(motion(ms / 1000).position)).toBeLessThan(0.02)
    }
  })

  it('configFromBounce maps bounce to the damping ratio at a 500ms perceived duration', () => {
    const ratio = (bounce: number) => {
      const c = configFromBounce(bounce)
      return calculateDampingRatio(c.damping!, c.stiffness!, c.mass ?? 1)
    }
    expect(ratio(0)).toBeCloseTo(1, 6)
    expect(ratio(0.1)).toBeCloseTo(0.9, 6)
    expect(ratio(0.2)).toBeCloseTo(0.8, 6)
    expect(ratio(0.5)).toBeCloseTo(0.5, 6)
    expect(ratio(-0.5)).toBeCloseTo(2, 6)
    expect(configFromBounce(0.3).stiffness).toBeCloseTo(Math.pow(4 * Math.PI, 2), 6)
  })

  it('perceptual helpers never return NaN for invalid input', () => {
    for (const bad of [NaN, -100, 0, Infinity]) {
      const c = configFromDuration(bad)
      expect(Number.isFinite(c.stiffness)).toBe(true)
      expect(Number.isFinite(c.damping)).toBe(true)
    }
    for (const bad of [NaN, -5, 5]) {
      const c = configFromBounce(bad)
      expect(Number.isFinite(c.stiffness)).toBe(true)
      expect(Number.isFinite(c.damping)).toBe(true)
      expect(c.damping!).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('adjustSpeed / adjustBounce input guards', () => {
  it('adjustSpeed with zero, negative or non-finite speed keeps a valid config', () => {
    for (const speed of [0, -1, NaN, Infinity]) {
      const adjusted = adjustSpeed({ stiffness: 100, damping: 10 }, speed)
      expect(Number.isFinite(adjusted.stiffness)).toBe(true)
      expect(Number.isFinite(adjusted.damping)).toBe(true)
      expect(adjusted.stiffness!).toBeGreaterThan(0)
    }
  })

  it('adjustBounce with a non-finite bounce keeps a valid damping', () => {
    for (const bounce of [NaN, Infinity, -Infinity]) {
      const adjusted = adjustBounce({ stiffness: 100, damping: 10 }, bounce)
      expect(Number.isFinite(adjusted.damping)).toBe(true)
    }
  })
})

describe('MotionValue animationComplete / animationCancel events', () => {
  const record = (mv: ReturnType<typeof createMotionValue<number>>) => {
    const events: MotionValueEvent[] = []
    const names: MotionValueEvent[] = [
      'animationStart',
      'animationComplete',
      'animationCancel',
      'animationEnd',
    ]
    for (const name of names) mv.on(name, () => events.push(name))
    return events
  }

  it('emits animationComplete (then animationEnd) when the spring settles', () => {
    clock = installTestClock()
    const mv = createMotionValue(0, { spring: { stiffness: 300, damping: 30 } })
    const events = record(mv)
    mv.set(100)
    clock.runAll()
    expect(events).toEqual(['animationStart', 'animationComplete', 'animationEnd'])
    expect(mv.get()).toBe(100)
  })

  it('emits animationCancel (then animationEnd) on stop()', () => {
    clock = installTestClock()
    const mv = createMotionValue(0)
    const events = record(mv)
    mv.set(100)
    clock.advance(50)
    mv.stop()
    clock.runAll()
    expect(events).toEqual(['animationStart', 'animationCancel', 'animationEnd'])
  })

  it('emits animationCancel synchronously on jump(), never a late animationEnd', () => {
    clock = installTestClock()
    const mv = createMotionValue(0)
    const events = record(mv)
    mv.set(100)
    clock.advance(50)
    mv.jump(20)
    expect(events).toEqual(['animationStart', 'animationCancel', 'animationEnd'])
    clock.runAll()
    expect(events).toEqual(['animationStart', 'animationCancel', 'animationEnd'])
    expect(mv.get()).toBe(20)
  })

  it('emits animationCancel on set(v, false)', () => {
    clock = installTestClock()
    const mv = createMotionValue(0)
    const events = record(mv)
    mv.set(100)
    clock.advance(50)
    mv.set(10, false)
    clock.runAll()
    expect(events).toEqual(['animationStart', 'animationCancel', 'animationEnd'])
  })

  it('emits animationCancel on destroy() while animating', () => {
    clock = installTestClock()
    const mv = createMotionValue(0)
    const events = record(mv)
    mv.set(100)
    clock.advance(50)
    mv.destroy()
    clock.runAll()
    expect(events).toEqual(['animationStart', 'animationCancel', 'animationEnd'])
  })

  it('does not emit cancel/end events for idle stop(), jump() or destroy()', () => {
    clock = installTestClock()
    const mv = createMotionValue(0)
    const events = record(mv)
    mv.stop()
    mv.jump(5)
    mv.set(6, false)
    mv.destroy()
    expect(events).toEqual([])
  })
})

describe('staggerContainer preset timing (milliseconds)', () => {
  it('produces a visible stagger and children delay', () => {
    const animate = variantPresets.staggerContainer!.animate as Variant
    const exit = variantPresets.staggerContainer!.exit as Variant
    const enter = calculateStaggerDelays(4, animate.transition!)
    expect(enter[0]!).toBeGreaterThanOrEqual(50)
    for (let i = 1; i < enter.length; i++) {
      expect(enter[i]! - enter[i - 1]!).toBeGreaterThanOrEqual(50)
    }
    const leave = calculateStaggerDelays(4, exit.transition!)
    for (let i = 1; i < leave.length; i++) {
      expect(leave[i - 1]! - leave[i]!).toBeGreaterThanOrEqual(25)
    }
  })
})
