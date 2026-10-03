import { describe, it, expect, afterEach } from 'vitest'
import { createSpringValue } from '../../../src/core/spring-value'
import { createTrail } from '../../../src/animation/trail'
import { createSpringGroup } from '../../../src/core/spring-group'
import { installTestClock, type TestClock } from '../../../src/testing/index'

let clock: TestClock | null = null
afterEach(() => {
  clock?.uninstall()
  clock = null
})

describe('SpringValue retargeted from another animation every frame', () => {
  it('keeps advancing when driven by a leader spring subscriber', () => {
    clock = installTestClock()
    const leader = createSpringValue(0, { stiffness: 200, damping: 25 })
    const follower = createSpringValue(0, { stiffness: 200, damping: 25 })
    leader.subscribe((v) => follower.set(v))
    leader.set(100)
    clock.advance(200)
    expect(follower.get()).toBeGreaterThan(20)
    clock.runAll()
    expect(follower.get()).toBe(100)
    leader.destroy()
    follower.destroy()
  })

  it('resolves the finished promise of the latest set() when it settles', async () => {
    clock = installTestClock()
    const value = createSpringValue(0, { stiffness: 300, damping: 30 })
    value.set(50)
    const first = value.finished
    clock.advance(50)
    value.set(100)
    const second = value.finished
    await expect(first).resolves.toBeUndefined()
    let settled = false
    void second.then(() => (settled = true))
    await Promise.resolve()
    expect(settled).toBe(false)
    clock.runAll()
    await second
    expect(value.get()).toBe(100)
    value.destroy()
  })

  it('a trail with followDelay 0 follows its leader', () => {
    clock = installTestClock()
    const trail = createTrail(3, { followDelay: 0, stiffness: 200, damping: 25 })
    trail.set(100)
    clock.advance(300)
    for (const v of trail.getValues()) expect(v).toBeGreaterThan(30)
    clock.runAll()
    expect(trail.getValues()).toEqual([100, 100, 100])
    trail.destroy()
  })
})

describe('SpringValue setConfig while animating', () => {
  it('a set() after setConfig() uses the new config even if a spring is running', () => {
    clock = installTestClock()
    // Two values in the same state; one gets a much stiffer config mid-flight
    const a = createSpringValue(0, { stiffness: 50, damping: 20 })
    const b = createSpringValue(0, { stiffness: 50, damping: 20 })
    a.set(100)
    b.set(100)
    clock.advance(50)
    b.setConfig({ stiffness: 2000, damping: 80 })
    a.set(200)
    b.set(200)
    clock.advance(100)
    // b must be retargeted with its new, much stiffer config
    expect(b.get()).toBeGreaterThan(a.get() + 20)
    a.destroy()
    b.destroy()
  })
})

describe('SpringGroup.finished', () => {
  it('resolves only once every animating key has settled, not just the keys of the last set()', async () => {
    clock = installTestClock()
    const group = createSpringGroup({ x: 0, y: 0 }, { stiffness: 300, damping: 30 })
    group.set({ x: 100 }, { stiffness: 20, damping: 9 }) // slow
    group.set({ y: 10 }) // fast
    let settled = false
    void group.finished.then(() => (settled = true))
    clock.advance(1000) // y has settled, x hasn't
    for (let i = 0; i < 10; i++) await Promise.resolve()
    expect(group.isAnimating()).toBe(true)
    expect(settled).toBe(false)
    clock.runAll()
    await group.finished
    expect(group.getValue('x')).toBe(100)
    group.destroy()
  })
})
