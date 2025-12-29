/**
 * Spring configuration interface
 */
export interface SpringConfig {
  /** Spring stiffness (default: 100) */
  stiffness?: number
  /** Damping ratio (default: 10) */
  damping?: number
  /** Mass (default: 1) */
  mass?: number
  /** Initial velocity */
  velocity?: number
  /** Speed threshold for considering spring at rest (default: 0.01) */
  restSpeed?: number
  /** Position threshold for considering spring at rest (default: 0.01) */
  restDelta?: number
  /** Clamp value to [from, to] range */
  clamp?: boolean
  /** Callback called on each update */
  onUpdate?: (value: number) => void
  /** Callback called when animation starts */
  onStart?: () => void
  /** Callback called when animation reaches target */
  onComplete?: () => void
  /** Callback called when spring is at rest */
  onRest?: () => void
}

/**
 * Default spring configuration
 */
export const defaultConfig: SpringConfig = {
  stiffness: 100,
  damping: 10,
  mass: 1,
  velocity: 0,
  restSpeed: 0.01,
  restDelta: 0.01,
  clamp: false,
}

/**
 * Spring presets interface
 */
export interface SpringPresets {
  /** Default spring: { stiffness: 100, damping: 10 } */
  default: SpringConfig
  /** Gentle spring: { stiffness: 120, damping: 14 } */
  gentle: SpringConfig
  /** Wobbly spring: { stiffness: 180, damping: 12 } */
  wobbly: SpringConfig
  /** Stiff spring: { stiffness: 210, damping: 20 } */
  stiff: SpringConfig
  /** Slow spring: { stiffness: 280, damping: 60 } */
  slow: SpringConfig
  /** Molasses spring: { stiffness: 280, damping: 120 } */
  molasses: SpringConfig
  /** Bouncy spring: { stiffness: 200, damping: 8 } */
  bounce: SpringConfig
  /** No wobble spring: { stiffness: 170, damping: 26 } */
  noWobble: SpringConfig
}

/**
 * Built-in spring presets
 */
export const springPresets: SpringPresets = {
  default: { stiffness: 100, damping: 10 },
  gentle: { stiffness: 120, damping: 14 },
  wobbly: { stiffness: 180, damping: 12 },
  stiff: { stiffness: 210, damping: 20 },
  slow: { stiffness: 280, damping: 60 },
  molasses: { stiffness: 280, damping: 120 },
  bounce: { stiffness: 200, damping: 8 },
  noWobble: { stiffness: 170, damping: 26 },
}

/**
 * Create a spring config that settles in approximately the given duration
 * @param ms - Approximate settling time in milliseconds
 * @returns Spring config
 */
export function configFromDuration(ms: number): SpringConfig {
  if (ms < 300) {
    return { stiffness: 170, damping: 26 }
  }
  if (ms < 500) {
    return { stiffness: 100, damping: 20 }
  }
  return { stiffness: 80, damping: 15 }
}

/**
 * Create a spring config with specific bounce amount
 * @param bounce - Bounce factor (0 = no bounce, 0.5 = 50% overshoot)
 * @returns Spring config
 */
export function configFromBounce(bounce: number): SpringConfig {
  if (bounce <= 0) {
    return { stiffness: 170, damping: 26 }
  }
  if (bounce <= 0.25) {
    return { stiffness: 200, damping: 12 }
  }
  return { stiffness: 200, damping: 8 }
}
