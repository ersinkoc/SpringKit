import { describe, it, expect, afterEach } from 'vitest'
import { decay } from '../../../src/animation/decay'
import { installTestClock, type TestClock } from '../../../src/testing/index'

let clock: TestClock | null = null
afterEach(() => {
  clock?.uninstall()
  clock = null
})

describe('decay() physics', () => {
  it('treats velocity as units per second and deceleration per millisecond', () => {
    clock = installTestClock()
    const anim = decay({ velocity: 1000 })
    // natural rest point: v0/1000 / -ln(0.998) ≈ 499.5
    expect(anim.target).toBeCloseTo(0.001 * 1000 / -Math.log(0.998), 6)
    anim.start()
    const elapsed = clock.runAll()
    expect(anim.getValue()).toBeCloseTo(anim.target, 6)
    // a 1000px/s fling settles within a few seconds, not minutes
    expect(elapsed).toBeLessThan(5000)
  })

  it('starts from `from`', () => {
    clock = installTestClock()
    const values: number[] = []
    const anim = decay({ from: 300, velocity: -500, onUpdate: (v) => values.push(v) })
    anim.start()
    clock.nextFrame()
    expect(values[values.length - 1]!).toBeLessThan(300)
    expect(values[values.length - 1]!).toBeGreaterThan(290)
    clock.runAll()
    expect(anim.getValue()).toBeCloseTo(300 - 0.5 / -Math.log(0.998), 6)
  })

  it('lands exactly on the value returned by modifyTarget', async () => {
    clock = installTestClock()
    const anim = decay({
      from: 20,
      velocity: 900,
      modifyTarget: (t) => Math.round(t / 100) * 100,
    })
    expect(anim.target).toBe(500)
    anim.start()
    clock.runAll()
    expect(anim.getValue()).toBe(500)
    await expect(anim.finished).resolves.toBeUndefined()
  })

  it('reports a decaying velocity in units per second', () => {
    clock = installTestClock()
    const anim = decay({ velocity: 800 })
    expect(anim.getVelocity()).toBeCloseTo(800, 6)
    anim.start()
    clock.advance(100)
    expect(anim.getVelocity()).toBeCloseTo(800 * Math.pow(0.998, 100), 3)
    clock.runAll()
    expect(anim.getVelocity()).toBe(0)
  })

  it('stops at a clamp boundary and completes', async () => {
    clock = installTestClock()
    let completed = 0
    const anim = decay({ velocity: 2000, clamp: [0, 120], onComplete: () => completed++ })
    anim.start()
    clock.runAll()
    expect(anim.getValue()).toBe(120)
    expect(completed).toBe(1)
    await expect(anim.finished).resolves.toBeUndefined()
  })

  it('completes immediately with zero velocity', () => {
    clock = installTestClock()
    const anim = decay({ from: 7, velocity: 0 })
    anim.start()
    clock.nextFrame()
    expect(anim.getValue()).toBe(7)
  })

  it('is independent of the refresh rate (exact at every frame)', () => {
    const exact = (t: number) => (1.5 * (Math.pow(0.996, t) - 1)) / Math.log(0.996)
    for (const frameRate of [30, 60, 120, 144]) {
      const c = installTestClock({ frameRate })
      try {
        const t0 = c.now()
        const samples: Array<[number, number]> = []
        const anim = decay({
          velocity: 1500,
          deceleration: 0.996,
          onUpdate: (v) => samples.push([performance.now() - t0, v]),
        })
        anim.start()
        c.advance(400)
        anim.destroy()
        expect(samples.length).toBeGreaterThan(5)
        for (const [t, v] of samples) expect(Math.abs(v - exact(t))).toBeLessThan(1e-6)
      } finally {
        c.uninstall()
      }
    }
  })
})
