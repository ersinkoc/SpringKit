/**
 * Development mode warnings for SpringKit
 * These warnings help developers avoid common configuration mistakes
 */

const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production'
const warnedMessages = new Set<string>()

/**
 * Log a warning message once (won't repeat the same message)
 */
function warnOnce(message: string): void {
  if (!isDev || warnedMessages.has(message)) return
  warnedMessages.add(message)
  console.warn(`[SpringKit] ${message}`)
}

/**
 * Validate spring configuration and warn about potential issues
 */
export function validateSpringConfig(config: {
  stiffness?: number
  damping?: number
  mass?: number
}): void {
  if (!isDev) return

  const { stiffness = 100, damping = 10, mass = 1 } = config

  // Check for extreme stiffness with low damping (unstable oscillation)
  if (stiffness > 400 && damping < 10) {
    warnOnce(
      `High stiffness (${stiffness}) with low damping (${damping}) may cause excessive oscillation. ` +
      `Consider increasing damping to at least ${Math.round(stiffness / 20)} for smoother animation.`
    )
  }

  // Check for very low stiffness (sluggish animation)
  if (stiffness < 20) {
    warnOnce(
      `Very low stiffness (${stiffness}) will result in sluggish animation. ` +
      `Consider using stiffness >= 50 for more responsive feel.`
    )
  }

  // Check for very high damping (overdamped, no spring feel)
  if (damping > stiffness) {
    warnOnce(
      `Damping (${damping}) is higher than stiffness (${stiffness}), ` +
      `which removes the "springy" feel. Consider reducing damping for bouncier animation.`
    )
  }

  // Check for zero or negative mass
  if (mass <= 0) {
    warnOnce(
      `Mass must be positive. Got ${mass}. Using default mass of 1.`
    )
  }

  // Check for very high mass (slow animation)
  if (mass > 10) {
    warnOnce(
      `High mass (${mass}) will make the animation very slow. ` +
      `Consider mass between 0.5 and 5 for typical use cases.`
    )
  }
}

/**
 * Validate drag configuration
 */
export function validateDragConfig(config: {
  rubberBandFactor?: number
  bounds?: {
    left?: number
    right?: number
    top?: number
    bottom?: number
  }
}): void {
  if (!isDev) return

  const { rubberBandFactor, bounds } = config

  // Check rubber band factor range
  if (rubberBandFactor !== undefined && (rubberBandFactor < 0 || rubberBandFactor > 1)) {
    warnOnce(
      `rubberBandFactor should be between 0 and 1. Got ${rubberBandFactor}. ` +
      `Values outside this range may cause unexpected behavior.`
    )
  }

  // Check for inverted bounds
  if (bounds) {
    if (bounds.left !== undefined && bounds.right !== undefined && bounds.left > bounds.right) {
      warnOnce(
        `Drag bounds are inverted: left (${bounds.left}) > right (${bounds.right}). ` +
        `This may cause unexpected behavior.`
      )
    }
    if (bounds.top !== undefined && bounds.bottom !== undefined && bounds.top > bounds.bottom) {
      warnOnce(
        `Drag bounds are inverted: top (${bounds.top}) > bottom (${bounds.bottom}). ` +
        `This may cause unexpected behavior.`
      )
    }
  }
}

/**
 * Validate decay configuration
 */
export function validateDecayConfig(config: {
  velocity: number
  deceleration?: number
}): void {
  if (!isDev) return

  const { velocity, deceleration = 0.998 } = config

  // Check for zero velocity
  if (velocity === 0) {
    warnOnce(
      `Decay animation started with zero velocity. ` +
      `The animation will complete immediately.`
    )
  }

  // Check deceleration range
  if (deceleration <= 0 || deceleration >= 1) {
    warnOnce(
      `Deceleration should be between 0 and 1 (exclusive). Got ${deceleration}. ` +
      `Typical values are 0.99-0.999.`
    )
  }
}

/**
 * Validate a numeric value, checking for NaN and Infinity
 * Returns a safe default value if invalid
 */
export function validateNumber(
  value: number,
  name: string,
  defaultValue: number = 0
): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    if (isDev) {
      warnOnce(`${name} received NaN, using ${defaultValue} instead.`)
    }
    return defaultValue
  }

  if (!Number.isFinite(value)) {
    if (isDev) {
      warnOnce(`${name} received Infinity, using ${defaultValue} instead.`)
    }
    return defaultValue
  }

  return value
}

/**
 * Validate animation target value
 * Throws in development, returns safe value in production
 */
export function validateAnimationValue(value: number, context: string): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    const message = `Invalid animation value in ${context}: expected number, got ${value}`
    if (isDev) {
      console.error(`[SpringKit] ${message}`)
    }
    return 0
  }

  if (!Number.isFinite(value)) {
    const message = `Invalid animation value in ${context}: Infinity is not supported`
    if (isDev) {
      console.error(`[SpringKit] ${message}`)
    }
    return 0
  }

  return value
}

/**
 * Clear warned messages (useful for testing)
 */
export function clearWarnings(): void {
  warnedMessages.clear()
}
