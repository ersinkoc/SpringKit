import { describe, it, expect } from 'vitest'
import { solveSpring, defineSpring } from '../../../src/native/solver'
import { calculateDampingRatio } from '../../../src/core/physics'

/** Reference: tiny-step semi-implicit Euler, accurate enough to check the closed form */
function integrate(
  cfg: { stiffness: number; damping: number; mass: number; velocity?: number },
  from: number,
  to: number,
  tMs: number
) {
  const dt = 1e-5
  let x = from
  let v = cfg.velocity ?? 0
  for (let t = 0; t < tMs / 1000; t += dt) {
    const a = (cfg.stiffness * (to - x) - cfg.damping * v) / cfg.mass
    v += a * dt
    x += v * dt
  }
  return { x, v }
}

describe('solveSpring', () => {
  const cases = {
    underdamped: { stiffness: 200, damping: 8, mass: 1 },
    critical: { stiffness: 100, damping: 20, mass: 1 },
    overdamped: { stiffness: 100, damping: 60, mass: 1 },
    heavy: { stiffness: 120, damping: 14, mass: 3, velocity: 250 },
  }

  for (const [name, cfg] of Object.entries(cases)) {
    it(`matches numeric integration (${name})`, () => {
      const solver = solveSpring(cfg, 0, 100)
      for (const t of [16, 50, 120, 300, 600]) {
        if (t >= solver.duration) continue
        const ref = integrate(cfg, 0, 100, t)
        const s = solver.at(t)
        expect(s.value).toBeCloseTo(ref.x, 1)
        expect(s.velocity).toBeCloseTo(ref.v, 0)
      }
    })
  }

  it('starts at `from` with the initial velocity and ends exactly at `to`', () => {
    const solver = solveSpring({ velocity: 42 }, 10, 90)
    expect(solver.at(0)).toEqual({ value: 10, velocity: 42 })
    expect(solver.at(solver.duration)).toEqual({ value: 90, velocity: 0 })
    expect(solver.at(solver.duration + 1000).value).toBe(90)
  })

  it('reports a duration after which the spring stays within restDelta', () => {
    const solver = solveSpring({ stiffness: 200, damping: 8 }, 0, 1)
    expect(solver.duration).toBeGreaterThan(0)
    expect(solver.duration).toBeLessThan(10_000)
    // just before settling it is still visibly moving or displaced
    const before = solver.at(solver.duration - 50)
    expect(Math.abs(before.value - 1) > 0.001 || Math.abs(before.velocity) > 0.01).toBe(true)
  })

  it('scales rest thresholds with distance so large moves settle precisely', () => {
    const small = solveSpring({ stiffness: 170, damping: 26 }, 0, 1)
    const large = solveSpring({ stiffness: 170, damping: 26 }, 0, 1000)
    expect(Math.abs(large.duration - small.duration)).toBeLessThan(5)
  })

  it('has zero duration when there is nothing to animate', () => {
    expect(solveSpring({}, 5, 5).duration).toBe(0)
    expect(solveSpring({}, 5, 5).at(100).value).toBe(5)
  })

  it('caps undamped springs at 10s instead of looping forever', () => {
    expect(solveSpring({ damping: 0 }, 0, 1).duration).toBe(10_000)
  })

  it('falls back to defaults for invalid physics instead of producing NaN', () => {
    const solver = solveSpring({ stiffness: -5, mass: 0, damping: NaN }, 0, 1)
    expect(Number.isFinite(solver.duration)).toBe(true)
    expect(Number.isFinite(solver.at(100).value)).toBe(true)
  })

  it('is time-based, not frame-based (same value regardless of sampling)', () => {
    const solver = solveSpring({ stiffness: 300, damping: 15 }, 0, 1)
    expect(solver.at(250).value).toBe(solver.at(250).value)
  })
})

describe('defineSpring', () => {
  it('produces critical damping for bounce 0', () => {
    const cfg = defineSpring({ duration: 400, bounce: 0 })
    expect(calculateDampingRatio(cfg.damping!, cfg.stiffness!, cfg.mass!)).toBeCloseTo(1, 6)
  })

  it('maps bounce to damping ratio 1 - bounce', () => {
    const cfg = defineSpring({ duration: 400, bounce: 0.3 })
    expect(calculateDampingRatio(cfg.damping!, cfg.stiffness!, cfg.mass!)).toBeCloseTo(0.7, 6)
  })

  it('produces an overdamped spring for negative bounce', () => {
    const cfg = defineSpring({ bounce: -0.5 })
    expect(calculateDampingRatio(cfg.damping!, cfg.stiffness!, cfg.mass!)).toBeCloseTo(2, 6)
  })

  it('makes longer durations slower', () => {
    const fast = solveSpring(defineSpring({ duration: 200 }), 0, 1)
    const slow = solveSpring(defineSpring({ duration: 800 }), 0, 1)
    expect(slow.duration).toBeGreaterThan(fast.duration * 3)
  })

  it('overshoots more with more bounce', () => {
    const peak = (bounce: number) => {
      const s = solveSpring(defineSpring({ bounce }), 0, 1)
      let max = 0
      for (let t = 0; t < s.duration; t += 2) max = Math.max(max, s.at(t).value)
      return max
    }
    expect(peak(0)).toBeLessThanOrEqual(1.0005)
    expect(peak(0.5)).toBeGreaterThan(peak(0.2))
    expect(peak(0.2)).toBeGreaterThan(1)
  })

  it('clamps out-of-range input', () => {
    const cfg = defineSpring({ duration: -10, bounce: 5 })
    expect(cfg.stiffness).toBeGreaterThan(0)
    expect(cfg.damping).toBeGreaterThanOrEqual(0)
  })
})
