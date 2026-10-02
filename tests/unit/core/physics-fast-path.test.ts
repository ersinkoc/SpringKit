import { describe, it, expect } from 'vitest'
import {
  springMotion,
  stepSpring,
  stepSpringInto,
  springCoefficients,
  evalSpringMotion,
  type SimulationResult,
} from '../../../src/core/physics'
import { spring } from '../../../src/core/spring'
import { installTestClock } from '../../../src/testing/index'
import type { SpringConfig } from '../../../src/core/config'

/**
 * Frozen copy of the closed form as it was before coefficients were cached
 * and the per-frame path became allocation-free. The optimized code must
 * reproduce it bit for bit.
 */
function referenceMotion(
  config: Pick<SpringConfig, 'stiffness' | 'damping' | 'mass'>,
  x0: number,
  v0: number
): (t: number) => { position: number; velocity: number } {
  const positiveOr = (value: number | undefined, fallback: number) =>
    typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback
  const stiffness = positiveOr(config.stiffness, 100)
  const mass = positiveOr(config.mass, 1)
  const damping =
    typeof config.damping === 'number' && Number.isFinite(config.damping) && config.damping >= 0
      ? config.damping
      : 10
  const omega0 = Math.sqrt(stiffness / mass)
  const zeta = damping / (2 * Math.sqrt(stiffness * mass))
  if (Math.abs(zeta - 1) < 1e-6) {
    const b = v0 + omega0 * x0
    return (t) => {
      const envelope = Math.exp(-omega0 * t)
      return {
        position: envelope * (x0 + b * t),
        velocity: envelope * (b - omega0 * (x0 + b * t)),
      }
    }
  }
  if (zeta < 1) {
    const omegaD = omega0 * Math.sqrt(1 - zeta * zeta)
    const b = (v0 + zeta * omega0 * x0) / omegaD
    return (t) => {
      const envelope = Math.exp(-zeta * omega0 * t)
      const cos = Math.cos(omegaD * t)
      const sin = Math.sin(omegaD * t)
      return {
        position: envelope * (x0 * cos + b * sin),
        velocity:
          envelope *
          ((b * omegaD - zeta * omega0 * x0) * cos - (x0 * omegaD + zeta * omega0 * b) * sin),
      }
    }
  }
  const root = omega0 * Math.sqrt(zeta * zeta - 1)
  const r1 = -zeta * omega0 + root
  const r2 = -zeta * omega0 - root
  const c2 = (v0 - r1 * x0) / (r2 - r1)
  const c1 = x0 - c2
  return (t) => {
    const e1 = Math.exp(r1 * t)
    const e2 = Math.exp(r2 * t)
    return { position: c1 * e1 + c2 * e2, velocity: c1 * r1 * e1 + c2 * r2 * e2 }
  }
}

function referenceStep(
  position: number,
  velocity: number,
  target: number,
  config: SpringConfig,
  dt: number
): SimulationResult {
  const restSpeed = config.restSpeed ?? 0.01
  const restDelta = config.restDelta ?? 0.01
  if (Math.abs(target - position) <= restDelta && Math.abs(velocity) <= restSpeed) {
    return { position: target, velocity: 0, isRest: true }
  }
  if (!(dt > 0)) return { position, velocity, isRest: false }
  const state = referenceMotion(config, position - target, velocity)(dt)
  return {
    position: target + state.position,
    velocity: state.velocity,
    isRest: Math.abs(state.position) <= restDelta && Math.abs(state.velocity) <= restSpeed,
  }
}

const CONFIGS: SpringConfig[] = [
  { stiffness: 100, damping: 10, mass: 1 }, // underdamped
  { stiffness: 100, damping: 0, mass: 1 }, // undamped
  { stiffness: 100, damping: 20, mass: 1 }, // critical
  { stiffness: 100, damping: 20.0000001, mass: 1 }, // near-critical
  { stiffness: 100, damping: 50, mass: 1 }, // overdamped
  { stiffness: 380, damping: 7, mass: 2.5 },
  { stiffness: -5, damping: Number.NaN, mass: 0 }, // invalid -> defaults
  { stiffness: 100, damping: -0, mass: 1 }, // signed zero damping
  {}, // all defaults
]
const STATES: Array<[number, number]> = [
  [-100, 0],
  [1, 0],
  [0, 50],
  [1234.5, -321.25],
  [1e-3, 3.3],
  [-0.004, 0.002],
]
const TIMES = [0.001, 1 / 60, 1 / 30, 1 / 15, 0.25, 2, 10]

describe('closed-form fast path', () => {
  it('springMotion matches the reference bit for bit', () => {
    for (const config of CONFIGS) {
      for (const [x0, v0] of STATES) {
        const motion = springMotion(config, x0, v0)
        const reference = referenceMotion(config, x0, v0)
        // Evaluate each time twice: the second hits the cached exp/cos/sin
        for (const t of [...TIMES, ...TIMES]) {
          const actual = motion(t)
          const expected = reference(t)
          expect(Object.is(actual.position, expected.position)).toBe(true)
          expect(Object.is(actual.velocity, expected.velocity)).toBe(true)
        }
      }
    }
  })

  it('stepSpring and stepSpringInto match the reference bit for bit', () => {
    const out: SimulationResult = { position: 0, velocity: 0, isRest: false }
    for (const config of CONFIGS) {
      const c = springCoefficients(config)
      for (const [position, velocity] of STATES) {
        for (const target of [0, 10, -0.0049]) {
          for (const dt of [...TIMES, 0, -1, Number.NaN]) {
            const expected = referenceStep(position, velocity, target, config, dt)
            expect(stepSpring(position, velocity, target, config, dt)).toEqual(expected)
            stepSpringInto(
              out,
              position,
              velocity,
              target,
              c,
              config.restSpeed ?? 0.01,
              config.restDelta ?? 0.01,
              dt
            )
            expect(Object.is(out.position, expected.position)).toBe(true)
            expect(Object.is(out.velocity, expected.velocity)).toBe(true)
            expect(out.isRest).toBe(expected.isRest)
          }
        }
      }
    }
  })

  it('shares coefficients between equal configs and keeps the cache coherent', () => {
    const a = springCoefficients({ stiffness: 170, damping: 26 })
    expect(springCoefficients({ stiffness: 170, damping: 26, mass: 1 })).toBe(a)
    expect(springCoefficients({ stiffness: 171, damping: 26 })).not.toBe(a)

    // Interleaving times and states through the shared cache never mixes them up
    const out = { position: 0, velocity: 0 }
    for (let i = 0; i < 50; i++) {
      const t = i % 3 === 0 ? 1 / 60 : (i % 7) / 100
      const x0 = i - 25
      const expected = referenceMotion({ stiffness: 170, damping: 26 }, x0, i)(t)
      evalSpringMotion(a, x0, i, t, out)
      expect(Object.is(out.position, expected.position)).toBe(true)
      expect(Object.is(out.velocity, expected.velocity)).toBe(true)
    }
  })

  it('evicts old coefficients without affecting springs that hold them', () => {
    const first = springCoefficients({ stiffness: 1000.5, damping: 3 })
    for (let i = 0; i < 100; i++) springCoefficients({ stiffness: 2000 + i, damping: 3 })
    // Evicted: a new (equal) object is created on the next request
    expect(springCoefficients({ stiffness: 1000.5, damping: 3 })).not.toBe(first)
    const expected = referenceMotion({ stiffness: 1000.5, damping: 3 }, 5, 1)(0.1)
    const out = evalSpringMotion(first, 5, 1, 0.1, { position: 0, velocity: 0 })
    expect(out).toEqual(expected)
  })

  it('spring() follows the reference stepping exactly, for mixed configs in one loop', () => {
    const clock = installTestClock({ startTime: 1000 })
    try {
      const configs: SpringConfig[] = [
        { stiffness: 100, damping: 10 },
        { stiffness: 100, damping: 10 }, // shares coefficients with the first
        { stiffness: 100, damping: 20 },
        { stiffness: 100, damping: 50, mass: 2 },
      ]
      const traces = configs.map(() => [] as number[])
      configs.forEach((config, i) => {
        spring(0, 100 + i, {
          ...config,
          onUpdate: (v) => traces[i]!.push(v),
        }).start()
      })
      clock.runAll()

      // Replay: the first spring starts the idle loop, whose synchronous
      // start tick is zero-length; after that every frame advances 1/60s
      configs.forEach((config, i) => {
        const trace = traces[i]!
        const full: SpringConfig = { restSpeed: 0.01, restDelta: 0.01, ...config }
        let position = 0
        let velocity = 0
        let rest = false
        let k = 0
        for (; k < trace.length && !rest; k++) {
          const dt = k === 0 && i === 0 ? 0 : 1 / 60
          const r = referenceStep(position, velocity, 100 + i, full, dt)
          position = r.position
          velocity = r.velocity
          rest = r.isRest
          // Frame times from the loop's accumulated clock differ from 1/60 by
          // a few ulps; allow 1e-9 instead of demanding identical dt
          expect(Math.abs(trace[k]! - position)).toBeLessThan(1e-9)
        }
        expect(rest).toBe(true)
        expect(trace[trace.length - 1]).toBe(100 + i)
      })
    } finally {
      clock.uninstall()
    }
  })
})
