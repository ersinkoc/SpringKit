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
  const stiffness = positiveOr(config.stiffness, 100)
  const mass = positiveOr(config.mass, 1)
  const damping =
    typeof config.damping === 'number' && Number.isFinite(config.damping) && config.damping >= 0
      ? config.damping
      : 10

  const omega0 = Math.sqrt(stiffness / mass)
  const zeta = damping / (2 * Math.sqrt(stiffness * mass))

  // Near-critical damping is treated as critical: the underdamped formula
  // divides by omegaD, which loses precision as zeta approaches 1.
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
    // Underdamped: oscillates around the target
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
          ((b * omegaD - zeta * omega0 * x0) * cos -
            (x0 * omegaD + zeta * omega0 * b) * sin),
      }
    }
  }

  // Overdamped: slow exponential approach
  const root = omega0 * Math.sqrt(zeta * zeta - 1)
  const r1 = -zeta * omega0 + root
  const r2 = -zeta * omega0 - root
  const c2 = (v0 - r1 * x0) / (r2 - r1)
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
  const restSpeed = config.restSpeed ?? 0.01
  const restDelta = config.restDelta ?? 0.01

  if (Math.abs(target - position) <= restDelta && Math.abs(velocity) <= restSpeed) {
    return { position: target, velocity: 0, isRest: true }
  }
  if (!(dt > 0)) {
    return { position, velocity, isRest: false }
  }

  const state = springMotion(config, position - target, velocity)(dt)
  const newPosition = target + state.position
  const isRest =
    Math.abs(state.position) <= restDelta && Math.abs(state.velocity) <= restSpeed

  return { position: newPosition, velocity: state.velocity, isRest }
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
