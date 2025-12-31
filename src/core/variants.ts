/**
 * Variants System - Named animation states with cascading support
 *
 * Provides a declarative way to define and orchestrate animations
 * across component hierarchies.
 */

import type { SpringConfig } from './config.js'

// ============ Types ============

/**
 * Animation values that can be animated
 */
export interface AnimationValues {
  x?: number | string
  y?: number | string
  scale?: number
  scaleX?: number
  scaleY?: number
  rotate?: number
  rotateX?: number
  rotateY?: number
  rotateZ?: number
  skewX?: number
  skewY?: number
  opacity?: number
  width?: number | string
  height?: number | string
  backgroundColor?: string
  borderRadius?: number | string
  borderColor?: string
  boxShadow?: string
  color?: string
  [key: string]: number | string | VariantTransition | undefined
}

/**
 * Transition configuration for a variant
 */
export interface VariantTransition {
  /** Spring configuration */
  spring?: SpringConfig
  /** Delay before animation starts (ms) */
  delay?: number
  /** Stagger children by this amount (ms) */
  staggerChildren?: number
  /** Delay children by this amount (ms) */
  delayChildren?: number
  /** Animate children before or after parent */
  when?: 'beforeChildren' | 'afterChildren' | false
  /** Custom stagger direction */
  staggerDirection?: 1 | -1
  /** Duration override for non-spring animations */
  duration?: number
  /** Easing function */
  ease?: (t: number) => number
}

/**
 * A single variant definition
 */
export interface Variant extends AnimationValues {
  transition?: VariantTransition
}

/**
 * Map of variant names to their definitions
 */
export interface Variants {
  [key: string]: Variant | ((custom?: unknown) => Variant)
}

/**
 * Orchestration options for variant animations
 */
export interface OrchestrationOptions {
  /** Delay before starting */
  delay?: number
  /** Animate children before or after */
  when?: 'beforeChildren' | 'afterChildren' | false
  /** Stagger children animations */
  staggerChildren?: number
  /** Delay before children start */
  delayChildren?: number
  /** Direction of stagger (-1 for reverse) */
  staggerDirection?: 1 | -1
}

/**
 * Resolved variant with all values computed
 */
export interface ResolvedVariant {
  values: AnimationValues
  transition: VariantTransition
}

// ============ Variant Resolution ============

/**
 * Resolve a variant definition to concrete values
 */
export function resolveVariant(
  variant: Variant | ((custom?: unknown) => Variant) | undefined,
  custom?: unknown
): ResolvedVariant {
  if (!variant) {
    return { values: {}, transition: {} }
  }

  // Handle function variants
  const resolved = typeof variant === 'function' ? variant(custom) : variant

  // Extract transition from values
  const { transition = {}, ...values } = resolved

  return { values, transition }
}

/**
 * Get variant from variants object by name
 */
export function getVariant(
  variants: Variants | undefined,
  name: string | undefined,
  custom?: unknown
): ResolvedVariant {
  if (!variants || !name) {
    return { values: {}, transition: {} }
  }

  return resolveVariant(variants[name], custom)
}

/**
 * Merge multiple variants together
 */
export function mergeVariants(...variants: (Variant | undefined)[]): Variant {
  const merged: Variant = {}

  for (const variant of variants) {
    if (variant) {
      Object.assign(merged, variant)
      // Merge transitions
      if (variant.transition) {
        merged.transition = { ...merged.transition, ...variant.transition }
      }
    }
  }

  return merged
}

// ============ Animation Value Helpers ============

/**
 * Check if a value is a transform property
 */
export function isTransformProperty(key: string): boolean {
  return [
    'x', 'y', 'z',
    'scale', 'scaleX', 'scaleY', 'scaleZ',
    'rotate', 'rotateX', 'rotateY', 'rotateZ',
    'skew', 'skewX', 'skewY',
    'perspective',
    'transformOrigin',
  ].includes(key)
}

/**
 * Check if a value is animatable
 */
export function isAnimatable(value: unknown): value is number | string {
  return typeof value === 'number' || typeof value === 'string'
}

/**
 * Parse a value with unit (e.g., "100px" -> { value: 100, unit: "px" })
 */
export function parseValueWithUnit(value: string | number): { value: number; unit: string } {
  if (typeof value === 'number') {
    return { value, unit: '' }
  }

  const match = value.match(/^(-?[\d.]+)(.*)$/)
  if (match && match[1]) {
    return { value: parseFloat(match[1]), unit: match[2] || '' }
  }

  return { value: 0, unit: '' }
}

/**
 * Build transform string from values
 */
export function buildTransformString(values: AnimationValues): string {
  const transforms: string[] = []

  if (values.x !== undefined || values.y !== undefined) {
    const x = values.x ?? 0
    const y = values.y ?? 0
    transforms.push(`translate(${x}px, ${y}px)`)
  }

  if (values.scale !== undefined) {
    transforms.push(`scale(${values.scale})`)
  } else {
    if (values.scaleX !== undefined) {
      transforms.push(`scaleX(${values.scaleX})`)
    }
    if (values.scaleY !== undefined) {
      transforms.push(`scaleY(${values.scaleY})`)
    }
  }

  if (values.rotate !== undefined) {
    transforms.push(`rotate(${values.rotate}deg)`)
  }
  if (values.rotateX !== undefined) {
    transforms.push(`rotateX(${values.rotateX}deg)`)
  }
  if (values.rotateY !== undefined) {
    transforms.push(`rotateY(${values.rotateY}deg)`)
  }
  if (values.rotateZ !== undefined) {
    transforms.push(`rotateZ(${values.rotateZ}deg)`)
  }

  if (values.skewX !== undefined) {
    transforms.push(`skewX(${values.skewX}deg)`)
  }
  if (values.skewY !== undefined) {
    transforms.push(`skewY(${values.skewY}deg)`)
  }

  return transforms.join(' ')
}

/**
 * Apply animation values to an element's style
 */
export function applyValuesToElement(element: HTMLElement, values: AnimationValues): void {
  const transform = buildTransformString(values)
  if (transform) {
    element.style.transform = transform
  }

  // Apply non-transform properties
  if (values.opacity !== undefined) {
    element.style.opacity = String(values.opacity)
  }
  if (values.backgroundColor !== undefined) {
    element.style.backgroundColor = values.backgroundColor
  }
  if (values.borderRadius !== undefined) {
    element.style.borderRadius =
      typeof values.borderRadius === 'number' ? `${values.borderRadius}px` : values.borderRadius
  }
  if (values.borderColor !== undefined) {
    element.style.borderColor = values.borderColor
  }
  if (values.boxShadow !== undefined) {
    element.style.boxShadow = values.boxShadow
  }
  if (values.color !== undefined) {
    element.style.color = values.color
  }
  if (values.width !== undefined) {
    element.style.width =
      typeof values.width === 'number' ? `${values.width}px` : values.width
  }
  if (values.height !== undefined) {
    element.style.height =
      typeof values.height === 'number' ? `${values.height}px` : values.height
  }
}

// ============ Orchestration ============

/**
 * Calculate stagger delays for children
 */
export function calculateStaggerDelays(
  count: number,
  options: OrchestrationOptions
): number[] {
  const { staggerChildren = 0, staggerDirection = 1, delayChildren = 0 } = options

  const delays: number[] = []
  for (let i = 0; i < count; i++) {
    const index = staggerDirection === -1 ? count - 1 - i : i
    delays.push(delayChildren + index * staggerChildren)
  }

  return delays
}

/**
 * Create an orchestrated animation sequence
 */
export interface OrchestrationSequence {
  /** Execute parent animation */
  parent: () => Promise<void>
  /** Execute children animations */
  children: () => Promise<void>
  /** Execute all with proper ordering */
  execute: () => Promise<void>
}

export function createOrchestration(
  parentAnim: () => Promise<void>,
  childrenAnims: (() => Promise<void>)[],
  options: OrchestrationOptions = {}
): OrchestrationSequence {
  const { when = false, delay = 0 } = options
  const delays = calculateStaggerDelays(childrenAnims.length, options)

  const parent = async () => {
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
    await parentAnim()
  }

  const children = async () => {
    await Promise.all(
      childrenAnims.map((anim, i) =>
        new Promise<void>((resolve) => {
          setTimeout(async () => {
            await anim()
            resolve()
          }, delays[i])
        })
      )
    )
  }

  const execute = async () => {
    switch (when) {
      case 'beforeChildren':
        await parent()
        await children()
        break
      case 'afterChildren':
        await children()
        await parent()
        break
      default:
        // Run in parallel
        await Promise.all([parent(), children()])
    }
  }

  return { parent, children, execute }
}

// ============ Variant Presets ============

/**
 * Common animation presets
 */
export const variantPresets: Record<string, { initial: Variant; animate: Variant; exit: Variant }> = {
  /** Fade in from invisible */
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },

  /** Fade in and slide up */
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },

  /** Fade in and slide down */
  fadeInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },

  /** Fade in and slide from left */
  fadeInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },

  /** Fade in and slide from right */
  fadeInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },

  /** Scale up from small */
  scaleIn: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
  },

  /** Pop in with overshoot */
  popIn: {
    initial: { opacity: 0, scale: 0.5 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: { spring: { stiffness: 400, damping: 15 } },
    },
    exit: { opacity: 0, scale: 0.5 },
  },

  /** Slide in from bottom (percentage-based) */
  slideUp: {
    initial: { y: 100, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 100, opacity: 0 },
  },

  /** Slide in from top */
  slideDown: {
    initial: { y: -100, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -100, opacity: 0 },
  },

  /** Slide in from left */
  slideLeft: {
    initial: { x: -100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -100, opacity: 0 },
  },

  /** Slide in from right */
  slideRight: {
    initial: { x: 100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 100, opacity: 0 },
  },

  /** Container with staggered children */
  staggerContainer: {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
    exit: {
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1,
      },
    },
  },

  /** Item for staggered lists */
  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
}

/**
 * Create a custom variant preset
 */
export function createVariantPreset(
  initial: Variant,
  animate: Variant,
  exit?: Variant
): { initial: Variant; animate: Variant; exit: Variant } {
  return {
    initial,
    animate,
    exit: exit || initial,
  }
}

// ============ Type Guards ============

/**
 * Check if a value is a Variants object
 */
export function isVariants(value: unknown): value is Variants {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every(
      (v) => typeof v === 'object' || typeof v === 'function'
    )
  )
}

/**
 * Check if a value is a Variant
 */
export function isVariant(value: unknown): value is Variant {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
