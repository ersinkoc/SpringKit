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

// ============ Semantic Physics Presets ============

/**
 * Physics presets with semantic, use-case oriented names
 * These presets are designed for specific UI interactions and feel natural
 */
export const physicsPresets = {
  // ---- UI Interactions ----

  /** Button press/release - snappy response */
  button: { stiffness: 400, damping: 30, mass: 1 },

  /** Toggle switch - quick but smooth */
  toggle: { stiffness: 500, damping: 35, mass: 0.8 },

  /** Checkbox/Radio - instant feedback */
  checkbox: { stiffness: 600, damping: 40, mass: 0.5 },

  /** Hover state - subtle and responsive */
  hover: { stiffness: 300, damping: 25, mass: 0.8 },

  /** Focus ring - gentle attention */
  focus: { stiffness: 200, damping: 20, mass: 1 },

  // ---- Layout & Navigation ----

  /** Page transitions - smooth and professional */
  pageTransition: { stiffness: 100, damping: 20, mass: 1.5 },

  /** Modal/Dialog entry - dramatic but controlled */
  modalEnter: { stiffness: 300, damping: 25, mass: 1 },

  /** Modal/Dialog exit - quick departure */
  modalExit: { stiffness: 400, damping: 35, mass: 0.8 },

  /** Sidebar slide - smooth glide */
  sidebar: { stiffness: 200, damping: 28, mass: 1.2 },

  /** Dropdown menu - snappy reveal */
  dropdown: { stiffness: 400, damping: 30, mass: 0.8 },

  /** Toast notification - attention-grabbing */
  toast: { stiffness: 350, damping: 25, mass: 0.9 },

  /** Tooltip - quick and subtle */
  tooltip: { stiffness: 500, damping: 40, mass: 0.6 },

  // ---- Gestures & Drag ----

  /** Drag release - momentum with settle */
  dragRelease: { stiffness: 150, damping: 20, mass: 1 },

  /** Swipe action - decisive movement */
  swipe: { stiffness: 250, damping: 22, mass: 0.9 },

  /** Pull to refresh - elastic and responsive */
  pullToRefresh: { stiffness: 180, damping: 18, mass: 1.2 },

  /** Snap to position - magnetic feel */
  snap: { stiffness: 400, damping: 35, mass: 0.8 },

  /** Rubber band - iOS-style overscroll */
  rubberBand: { stiffness: 300, damping: 15, mass: 0.8 },

  // ---- Cards & Items ----

  /** Card flip - dramatic reveal */
  cardFlip: { stiffness: 150, damping: 18, mass: 1.5 },

  /** Card hover lift - subtle elevation */
  cardHover: { stiffness: 400, damping: 30, mass: 0.7 },

  /** List item enter - staggered animation */
  listItem: { stiffness: 300, damping: 28, mass: 0.9 },

  /** Accordion expand - smooth reveal */
  accordion: { stiffness: 200, damping: 25, mass: 1.1 },

  // ---- Loading & Progress ----

  /** Skeleton shimmer - continuous flow */
  skeleton: { stiffness: 80, damping: 15, mass: 2 },

  /** Progress bar - steady advancement */
  progress: { stiffness: 150, damping: 25, mass: 1 },

  /** Spinner rotation - smooth continuous */
  spinner: { stiffness: 100, damping: 12, mass: 1.5 },

  // ---- Emphasis & Attention ----

  /** Pulse effect - gentle attention */
  pulse: { stiffness: 120, damping: 10, mass: 1.2 },

  /** Shake effect - error emphasis */
  shake: { stiffness: 500, damping: 15, mass: 0.6 },

  /** Bounce effect - playful emphasis */
  bounceAttention: { stiffness: 400, damping: 10, mass: 0.7 },

  /** Pop effect - sudden appearance */
  pop: { stiffness: 500, damping: 20, mass: 0.6 },

  /** Wiggle effect - playful motion */
  wiggle: { stiffness: 300, damping: 8, mass: 0.8 },

  // ---- Mobile-Specific ----

  /** iOS spring - Apple-like feel */
  ios: { stiffness: 300, damping: 20, mass: 1 },

  /** Android spring - Material Design feel */
  android: { stiffness: 350, damping: 25, mass: 0.9 },

  /** Haptic feedback - quick micro-interaction */
  haptic: { stiffness: 600, damping: 45, mass: 0.4 },

  // ---- Natural Physics ----

  /** Pendulum - gravity-like swing */
  pendulum: { stiffness: 50, damping: 5, mass: 2 },

  /** Jelly - soft and wobbly */
  jelly: { stiffness: 150, damping: 8, mass: 1.5 },

  /** Elastic - stretchy rubber */
  elastic: { stiffness: 200, damping: 10, mass: 1.2 },

  /** Heavy - weighted and deliberate */
  heavy: { stiffness: 150, damping: 30, mass: 3 },

  /** Light - airy and quick */
  light: { stiffness: 400, damping: 25, mass: 0.5 },

  /** Liquid - fluid motion */
  liquid: { stiffness: 100, damping: 20, mass: 2 },

} as const

export type PhysicsPresetName = keyof typeof physicsPresets

/**
 * Get a physics preset by name
 */
export function getPhysicsPreset(name: PhysicsPresetName): SpringConfig {
  return { ...physicsPresets[name] }
}

/**
 * Create a custom preset based on a semantic description
 * @param feeling - How the animation should feel
 */
export function createFeeling(feeling: 'snappy' | 'smooth' | 'bouncy' | 'heavy' | 'light' | 'elastic'): SpringConfig {
  switch (feeling) {
    case 'snappy':
      return { stiffness: 400, damping: 30, mass: 0.8 }
    case 'smooth':
      return { stiffness: 150, damping: 25, mass: 1.2 }
    case 'bouncy':
      return { stiffness: 300, damping: 12, mass: 1 }
    case 'heavy':
      return { stiffness: 100, damping: 30, mass: 2.5 }
    case 'light':
      return { stiffness: 400, damping: 25, mass: 0.5 }
    case 'elastic':
      return { stiffness: 200, damping: 10, mass: 1.2 }
    default:
      return { stiffness: 100, damping: 10, mass: 1 }
  }
}

/**
 * Adjust a preset for speed
 * @param preset - Base preset config
 * @param speed - Speed multiplier (0.5 = half speed, 2 = double speed)
 */
export function adjustSpeed(preset: SpringConfig, speed: number): SpringConfig {
  const stiffness = (preset.stiffness ?? 100) * speed
  const damping = (preset.damping ?? 10) * Math.sqrt(speed)
  return { ...preset, stiffness, damping }
}

/**
 * Adjust a preset for bounciness
 * @param preset - Base preset config
 * @param bounce - Bounce factor (0 = no bounce, 1 = very bouncy)
 */
export function adjustBounce(preset: SpringConfig, bounce: number): SpringConfig {
  const minDamping = 5
  const maxDamping = 40
  const damping = maxDamping - (bounce * (maxDamping - minDamping))
  return { ...preset, damping: Math.max(minDamping, Math.min(maxDamping, damping)) }
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
