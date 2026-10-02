import { describe, it, expect, afterEach } from 'vitest'
import { createSpringValue } from '../../../src/core/spring-value'
import { createTrail } from '../../../src/animation/trail'
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
