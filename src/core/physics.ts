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
 * @returns Simulation result with new position, velocity, and rest state
 */
export function simulateSpring(
  position: number,
  velocity: number,
  target: number,
  config: SpringConfig
): SimulationResult {
  const {
    stiffness = 100,
    damping = 10,
    mass = 1,
    restSpeed = 0.01,
    restDelta = 0.01,
  } = config

  // Time step for 60fps animation
  // This ensures the spring simulation is stable with typical stiffness values
  const dt = 1 / 60

  // Calculate displacement from target
  const displacement = target - position

  // Calculate spring force (Hooke's law: F = -k * x)
  const springForce = stiffness * displacement

  // Calculate damping force (opposes velocity: F = -c * v)
  const dampingForce = damping * velocity

  // Calculate total force and acceleration (Newton's second law: a = F/m)
  const acceleration = (springForce - dampingForce) / mass

  // Semi-implicit Euler integration
  // Update velocity first, then use new velocity to update position
  // This provides better energy conservation than standard Euler
  const newVelocity = velocity + acceleration * dt
  const newPosition = position + newVelocity * dt

  // Check if spring is at rest
  // Spring is at rest when:
  // 1. Close to target position (displacement < restDelta)
  // 2. Moving slowly (velocity < restSpeed)
  const isRest =
    Math.abs(displacement) <= restDelta &&
    Math.abs(newVelocity) <= restSpeed

  return {
    position: newPosition,
    velocity: newVelocity,
    isRest,
  }
}

/**
 * Calculate the period of oscillation for a spring
 * @param stiffness - Spring stiffness
 * @param mass - Spring mass
 * @returns Period in seconds
 */
export function calculatePeriod(stiffness: number, mass: number): number {
  return 2 * Math.PI * Math.sqrt(mass / stiffness)
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
  return damping / (2 * Math.sqrt(stiffness * mass))
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
