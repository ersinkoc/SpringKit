import type { SpringConfig } from '../core/config.js'
import { springMotion } from '../core/physics.js'
import { perceptualSpringConfig } from '../core/config.js'

/**
 * Physical parameters accepted by the analytic solver.
 * Callbacks and `clamp` from {@link SpringConfig} are ignored.
 */
export type SpringPhysics = Pick<
  SpringConfig,
  'stiffness' | 'damping' | 'mass' | 'velocity' | 'restSpeed' | 'restDelta'
>

/** Position and velocity of a spring at a point in time */
export interface SpringState {
  /** Value at time t */
  value: number
  /** Velocity at time t, in units per second */
  velocity: number
}

/**
 * Closed-form solution of a spring travelling from `from` to `to`.
 *
 * Unlike the frame-driven {@link spring}, a solver is exact, frame-rate
 * independent and random-access: you can ask for the state at any time,
 * which makes springs seekable and scrubbable.
 */
export interface SpringSolver {
  /** State at `t` milliseconds after the start */
  at(t: number): SpringState
  /** Time in milliseconds until the spring comes to rest (capped at 10s) */
  readonly duration: number
  readonly from: number
  readonly to: number
}

/** Longest simulated duration; undamped springs never settle on their own */
const MAX_DURATION_MS = 10_000
/** Resolution used when searching for the settle time */
const SETTLE_STEP_MS = 1

/**
 * Solve a damped harmonic oscillator analytically.
 *
 * `velocity` is in value units per second (same as {@link spring}).
 * `restDelta` / `restSpeed` are in value units; when omitted they scale with
 * the travelled distance so a 0→1 spring and a 0→1000 spring settle at the
 * same visual precision.
 *
 * @example
 * const solver = solveSpring({ stiffness: 170, damping: 26 }, 0, 100)
 * solver.at(120).value // position 120ms in
 * solver.duration      // ms until rest
 */
export function solveSpring(
  config: SpringPhysics = {},
  from = 0,
  to = 1
): SpringSolver {
  const stiffness = positiveOr(config.stiffness, 100)
  const damping = Math.max(0, finiteOr(config.damping, 10))
  const mass = positiveOr(config.mass, 1)
  const v0 = finiteOr(config.velocity, 0)

  const distance = Math.abs(to - from)
  // 0.1% of the travelled distance by default (1px over a 1000px move)
  const scale = distance > 0 ? distance : 1
  const restDelta = positiveOr(config.restDelta, scale * 0.001)
  const restSpeed = positiveOr(config.restSpeed, scale * 0.01)

  const omega0 = Math.sqrt(stiffness / mass)
  const zeta = damping / (2 * Math.sqrt(stiffness * mass))
  // Displacement from the target at t = 0
  const x0 = from - to

  // Near-critical damping is solved as critical (see springMotion)
  const isCritical = Math.abs(zeta - 1) < 1e-6
  const motion = springMotion({ stiffness, damping, mass }, x0, v0)
  const displacement = (t: number): SpringState => {
    const s = motion(t)
    return { value: s.position, velocity: s.velocity }
  }

  const isSettled = (t: number) => {
    const s = displacement(t / 1000)
    return Math.abs(s.value) <= restDelta && Math.abs(s.velocity) <= restSpeed
  }

  // Find the first moment the spring is at rest and stays there. The envelope
  // only decays, so checking one oscillation period ahead rules out a
  // momentary pass through the rest band.
  let duration = 0
  if (distance > 0 || v0 !== 0) {
    duration = MAX_DURATION_MS
    const period = zeta < 1 && !isCritical ? (2 * Math.PI) / (omega0 * Math.sqrt(1 - zeta * zeta)) : 0
    const lookAheadMs = Math.min(MAX_DURATION_MS, Math.max(50, period * 1000))
    for (let t = 0; t <= MAX_DURATION_MS; t += SETTLE_STEP_MS) {
      if (!isSettled(t)) continue
      let stays = true
      for (let u = t; u <= t + lookAheadMs; u += 4) {
        if (!isSettled(u)) {
          stays = false
          break
        }
      }
      if (stays) {
        duration = t
        break
      }
    }
  }

  return {
    from,
    to,
    duration,
    at(t: number): SpringState {
      if (!(t > 0)) return { value: from, velocity: v0 }
      if (t >= duration) return { value: to, velocity: 0 }
      const s = displacement(t / 1000)
      return { value: to + s.value, velocity: s.velocity }
    },
  }
}

/**
 * Options for {@link defineSpring}: a perceptual way to describe a spring.
 */
export interface PerceptualSpringOptions {
  /**
   * Perceived duration in milliseconds — roughly how long the main motion
   * takes. The spring may keep settling slightly longer. Default 500.
   */
  duration?: number
  /**
   * Bounciness from -1 to 1. 0 = critically damped (no overshoot),
   * 0.3 = a noticeable bounce, 1 = undamped. Negative values are
   * overdamped (slower, "heavier" settling). Default 0.
   */
  bounce?: number
  /** Mass (default 1). Stiffness and damping scale with it. */
  mass?: number
}

/**
 * Build a spring from perceptual parameters (duration + bounce) instead of
 * stiffness/damping. Uses the same model as SwiftUI and Jetpack Compose, so
 * designers can reason in milliseconds and bounce percentages.
 *
 * @example
 * spring(0, 100, { ...defineSpring({ duration: 400, bounce: 0.25 }), onUpdate })
 */
export function defineSpring(options: PerceptualSpringOptions = {}): SpringConfig {
  return perceptualSpringConfig(
    options.duration ?? 500,
    options.bounce ?? 0,
    options.mass ?? 1
  )
}

function finiteOr(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function positiveOr(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : fallback
}
