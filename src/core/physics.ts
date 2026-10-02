import type { SpringConfig } from './config.js'

/**
 * Result of a spring physics simulation step
 */
export interface SimulationResult {
  /** New position */
  position: number
  /** New velocity */
  velocity: number
  /** Whether the spring is at rest */
  isRest: boolean
}

/** Fixed sub-step for consistent physics (60fps) */
const FIXED_TIME_STEP = 1 / 60

/**
 * Simulate one step of spring physics using semi-implicit Euler integration
 *
 * The spring follows the damped harmonic oscillator equation:
 * F = -k * x - c * v
 * a = F / m
 *
 * Where:
 * - k = stiffness (spring constant)
 * - c = damping coefficient
 * - m = mass
 * - x = displacement from rest (target - position)
 * - v = velocity
 * - a = acceleration
 * - dt = time step (1/60 for 60fps animation)
 *
 * @param position - Current position
 * @param velocity - Current velocity
 * @param target - Target position (rest position)
 * @param config - Spring configuration
 * @param timeStep - Integration step in seconds (default: 1/60). Callers that
 *   sub-step a variable frame time should pass the real sub-step duration so
 *   the simulation speed does not depend on the display refresh rate.
 * @returns Simulation result with new position, velocity, and rest state
 */
export function simulateSpring(
  position: number,
  velocity: number,
  target: number,
  config: SpringConfig,
  timeStep: number = FIXED_TIME_STEP
): SimulationResult {
  const {
    stiffness = 100,
    damping = 10,
    mass = 1,
    restSpeed = 0.01,
    restDelta = 0.01,
  } = config

  // Calculate displacement from target (cached for reuse)
  const displacement = target - position
  const absDisplacement = Math.abs(displacement)
  const absVelocity = Math.abs(velocity)

  // Early exit optimization: if already at rest, skip expensive calculations
  // This significantly improves performance for springs that have settled
  if (absDisplacement <= restDelta && absVelocity <= restSpeed) {
    return {
      position: target, // Snap to exact target
      velocity: 0,
      isRest: true,
    }
  }

  // Integration step (seconds). Guard against NaN/Infinity/negative input.
  const dt = Number.isFinite(timeStep) && timeStep >= 0 ? timeStep : FIXED_TIME_STEP

  // Calculate spring force (Hooke's law: F = -k * x)
  const springForce = stiffness * displacement

  // Calculate damping force (opposes velocity: F = -c * v)
  // Optimization: skip multiplication if velocity is negligible
  const dampingForce = absVelocity > 0.0001 ? damping * velocity : 0

  // Calculate total force and acceleration (Newton's second law: a = F/m)
  // Protect against division by zero - use minimum mass of 0.001
  const safeMass = mass === 0 ? 0.001 : mass
  const acceleration = (springForce - dampingForce) / safeMass

  // Semi-implicit Euler integration
  // Update velocity first, then use new velocity to update position
  // This provides better energy conservation than standard Euler
  const newVelocity = velocity + acceleration * dt
  const newPosition = position + newVelocity * dt

  // Check if spring is at rest
  // Spring is at rest when:
  // 1. Close to target position (new displacement < restDelta)
  // 2. Moving slowly (new velocity < restSpeed)
  // Use NEW position to calculate displacement for accurate rest detection
  const newDisplacement = Math.abs(target - newPosition)
  const isRest =
    newDisplacement <= restDelta &&
    Math.abs(newVelocity) <= restSpeed

  return {
    position: newPosition,
    velocity: newVelocity,
    isRest,
  }
}

/**
 * Constants of a spring's closed-form solution that depend only on its
 * physical parameters. Computing them once per config instead of once per
 * frame removes three square roots and every allocation from the hot path.
 *
 * Instances are shared by all springs with the same parameters (see
 * {@link springCoefficients}), so they also share the time-dependent terms
 * (`exp`, `cos`, `sin` of `t`) of the last evaluated time: springs of one
 * config advanced by the same frame time evaluate those only once.
 *
 * @internal
 */
export interface SpringCoefficients {
  /** 0 = critically damped, 1 = underdamped, 2 = overdamped */
  readonly regime: 0 | 1 | 2
  readonly stiffness: number
  readonly damping: number
  readonly mass: number
  /** Undamped angular frequency */
  readonly omega0: number
  /** Damping ratio */
  readonly zeta: number
  /** zeta * omega0 */
  readonly zw: number
  /** Damped angular frequency (underdamped only) */
  readonly omegaD: number
  /** Characteristic roots and r2 - r1 (overdamped only) */
  readonly r1: number
  readonly r2: number
  readonly dr: number
  /** Time the cached terms below were computed for (NaN = none) */
  t: number
  /** exp(-zw t) / exp(-omega0 t), or exp(r1 t) when overdamped */
  e1: number
  /** cos(omegaD t), or exp(r2 t) when overdamped */
  e2: number
  /** sin(omegaD t) */
  e3: number
}

/** Mutable displacement/velocity pair written by {@link evalSpringMotion} */
export interface MotionState {
  position: number
  velocity: number
}

/** Interned coefficients (oldest first). Apps use a handful of configs. */
const coefficientCache: SpringCoefficients[] = []
const COEFFICIENT_CACHE_SIZE = 32

/**
 * Shared closed-form constants for a spring config. Invalid physics
 * (non-positive stiffness or mass, negative damping) fall back to the
 * defaults instead of producing NaN.
 *
 * @internal
 */
export function springCoefficients(
  config: Pick<SpringConfig, 'stiffness' | 'damping' | 'mass'>
): SpringCoefficients {
  const stiffness = positiveOr(config.stiffness, 100)
  const mass = positiveOr(config.mass, 1)
  const damping =
    typeof config.damping === 'number' && Number.isFinite(config.damping) && config.damping >= 0
      ? config.damping
      : 10

  for (let i = coefficientCache.length - 1; i >= 0; i--) {
    const c = coefficientCache[i]!
    // Object.is: keep -0 damping distinct so results stay bit-identical
    if (c.stiffness === stiffness && Object.is(c.damping, damping) && c.mass === mass) return c
  }

  const c = createCoefficients(stiffness, damping, mass)
  if (coefficientCache.length >= COEFFICIENT_CACHE_SIZE) coefficientCache.shift()
  coefficientCache.push(c)
  return c
}

function createCoefficients(stiffness: number, damping: number, mass: number): SpringCoefficients {
  const omega0 = Math.sqrt(stiffness / mass)
  const zeta = damping / (2 * Math.sqrt(stiffness * mass))
  // Negation is exact in IEEE 754, so -zw === -zeta * omega0 bit for bit
  const zw = zeta * omega0

  let regime: 0 | 1 | 2
  let omegaD = 0
  let r1 = 0
  let r2 = 0
  // Near-critical damping is treated as critical: the underdamped formula
  // divides by omegaD, which loses precision as zeta approaches 1.
  if (Math.abs(zeta - 1) < 1e-6) {
    regime = 0
  } else if (zeta < 1) {
    // Underdamped: oscillates around the target
    regime = 1
    omegaD = omega0 * Math.sqrt(1 - zeta * zeta)
  } else {
    // Overdamped: slow exponential approach
    regime = 2
    const root = omega0 * Math.sqrt(zeta * zeta - 1)
    r1 = -zw + root
    r2 = -zw - root
  }

  return {
    regime,
    stiffness,
    damping,
    mass,
    omega0,
    zeta,
    zw,
    omegaD,
    r1,
    r2,
    dr: r2 - r1,
    t: NaN,
    e1: 0,
    e2: 0,
    e3: 0,
  }
}

/**
 * Allocation-free closed form: writes into `out` the displacement from the
 * target, and its velocity, `t` seconds after starting with displacement
 * `x0` and velocity `v0`. Same operations, in the same order, as
 * {@link springMotion}, so results are bit-for-bit identical.
 *
 * @internal
 */
export function evalSpringMotion(
  c: SpringCoefficients,
  x0: number,
  v0: number,
  t: number,
  out: MotionState
): MotionState {
  if (c.regime === 1) {
    const zw = c.zw
    const omegaD = c.omegaD
    if (t !== c.t) {
      c.e1 = Math.exp(-zw * t)
      c.e2 = Math.cos(omegaD * t)
      c.e3 = Math.sin(omegaD * t)
      c.t = t
    }
    const envelope = c.e1
    const cos = c.e2
    const sin = c.e3
    const b = (v0 + zw * x0) / omegaD
    out.position = envelope * (x0 * cos + b * sin)
    out.velocity = envelope * ((b * omegaD - zw * x0) * cos - (x0 * omegaD + zw * b) * sin)
    return out
  }

  if (c.regime === 0) {
    const omega0 = c.omega0
    if (t !== c.t) {
      c.e1 = Math.exp(-omega0 * t)
      c.t = t
    }
    const envelope = c.e1
    const b = v0 + omega0 * x0
    out.position = envelope * (x0 + b * t)
    out.velocity = envelope * (b - omega0 * (x0 + b * t))
    return out
  }

  const r1 = c.r1
  const r2 = c.r2
  if (t !== c.t) {
    c.e1 = Math.exp(r1 * t)
    c.e2 = Math.exp(r2 * t)
    c.t = t
  }
  const e1 = c.e1
  const e2 = c.e2
  const c2 = (v0 - r1 * x0) / c.dr
  const c1 = x0 - c2
  out.position = c1 * e1 + c2 * e2
  out.velocity = c1 * r1 * e1 + c2 * r2 * e2
  return out
}

/**
 * Closed-form motion of a damped harmonic oscillator.
 *
 * Returns a function giving the displacement from the target, and its
 * velocity, `t` seconds after starting with displacement `x0` and velocity
 * `v0`. Exact for any `t`, so stepping with it is independent of frame rate
 * and never accumulates integration error.
 *
 * Invalid physics (non-positive stiffness or mass, negative damping) fall
 * back to the defaults instead of producing NaN.
 */
export function springMotion(
  config: Pick<SpringConfig, 'stiffness' | 'damping' | 'mass'>,
  x0: number,
  v0: number
): (t: number) => { position: number; velocity: number } {
  // Callers sample one motion at many different times (settle searches,
  // timeline curves): precompute the state-dependent terms once and skip the
  // per-time cache of evalSpringMotion, which would never hit here.
  const c = springCoefficients(config)
  const omega0 = c.omega0
  const zw = c.zw

  if (c.regime === 0) {
    const b = v0 + omega0 * x0
    return (t) => {
      const envelope = Math.exp(-omega0 * t)
      return {
        position: envelope * (x0 + b * t),
        velocity: envelope * (b - omega0 * (x0 + b * t)),
      }
    }
  }

  if (c.regime === 1) {
    const omegaD = c.omegaD
    const b = (v0 + zw * x0) / omegaD
    return (t) => {
      const envelope = Math.exp(-zw * t)
      const cos = Math.cos(omegaD * t)
      const sin = Math.sin(omegaD * t)
      return {
        position: envelope * (x0 * cos + b * sin),
        velocity: envelope * ((b * omegaD - zw * x0) * cos - (x0 * omegaD + zw * b) * sin),
      }
    }
  }

  const r1 = c.r1
  const r2 = c.r2
  const c2 = (v0 - r1 * x0) / c.dr
  const c1 = x0 - c2
  return (t) => {
    const e1 = Math.exp(r1 * t)
    const e2 = Math.exp(r2 * t)
    return {
      position: c1 * e1 + c2 * e2,
      velocity: c1 * r1 * e1 + c2 * r2 * e2,
    }
  }
}

/**
 * Advance a spring by `dt` seconds using the exact closed-form solution.
 * Drop-in alternative to {@link simulateSpring} that is accurate at any
 * frame rate and time step.
 */
export function stepSpring(
  position: number,
  velocity: number,
  target: number,
  config: SpringConfig,
  dt: number
): SimulationResult {
  return stepSpringInto(
    { position: 0, velocity: 0, isRest: false },
    position,
    velocity,
    target,
    springCoefficients(config),
    config.restSpeed ?? 0.01,
    config.restDelta ?? 0.01,
    dt
  )
}

/**
 * Allocation-free {@link stepSpring} for the per-frame hot path: takes
 * precomputed coefficients and rest thresholds and writes the result into
 * `out` (which is returned).
 *
 * @internal
 */
export function stepSpringInto(
  out: SimulationResult,
  position: number,
  velocity: number,
  target: number,
  c: SpringCoefficients,
  restSpeed: number,
  restDelta: number,
  dt: number
): SimulationResult {
  if (Math.abs(target - position) <= restDelta && Math.abs(velocity) <= restSpeed) {
    out.position = target
    out.velocity = 0
    out.isRest = true
    return out
  }
  if (!(dt > 0)) {
    out.position = position
    out.velocity = velocity
    out.isRest = false
    return out
  }

  // `out` doubles as the displacement/velocity scratch
  evalSpringMotion(c, position - target, velocity, dt, out)
  const displacement = out.position
  out.position = target + displacement
  out.isRest = Math.abs(displacement) <= restDelta && Math.abs(out.velocity) <= restSpeed
  return out
}

function positiveOr(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback
}

/**
 * Calculate the period of oscillation for a spring
 * @param stiffness - Spring stiffness
 * @param mass - Spring mass
 * @returns Period in seconds
 */
export function calculatePeriod(stiffness: number, mass: number): number {
  // Protect against division by zero and negative stiffness
  const safeStiffness = stiffness <= 0 ? 0.001 : stiffness
  return 2 * Math.PI * Math.sqrt(mass / safeStiffness)
}

/**
 * Calculate the damping ratio for a spring
 * @param damping - Damping coefficient
 * @param stiffness - Spring stiffness
 * @param mass - Spring mass
 * @returns Damping ratio
 */
export function calculateDampingRatio(
  damping: number,
  stiffness: number,
  mass: number
): number {
  // Protect against division by zero and invalid inputs
  const safeStiffness = stiffness <= 0 ? 0.001 : stiffness
  const safeMass = mass <= 0 ? 0.001 : mass
  return damping / (2 * Math.sqrt(safeStiffness * safeMass))
}

/**
 * Check if a spring is underdamped (will oscillate)
 * @param config - Spring configuration
 * @returns True if underdamped
 */
export function isUnderdamped(config: SpringConfig): boolean {
  const { stiffness = 100, damping = 10, mass = 1 } = config
  const ratio = calculateDampingRatio(damping, stiffness, mass)
  return ratio < 1
}

/**
 * Check if a spring is critically damped (fastest return to rest without oscillation)
 * @param config - Spring configuration
 * @returns True if critically damped
 */
export function isCriticallyDamped(config: SpringConfig): boolean {
  const { stiffness = 100, damping = 10, mass = 1 } = config
  const ratio = calculateDampingRatio(damping, stiffness, mass)
  return Math.abs(ratio - 1) < 0.001
}

/**
 * Check if a spring is overdamped (slow return to rest without oscillation)
 * @param config - Spring configuration
 * @returns True if overdamped
 */
export function isOverdamped(config: SpringConfig): boolean {
  const { stiffness = 100, damping = 10, mass = 1 } = config
  const ratio = calculateDampingRatio(damping, stiffness, mass)
  return ratio > 1
}
