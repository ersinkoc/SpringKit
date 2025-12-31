/**
 * Enhanced Stagger Patterns - Advanced staggering for complex animations
 *
 * Provides grid, spiral, wave, and custom stagger patterns for
 * sophisticated animation orchestration.
 */

import { clamp } from '../utils/math.js'

// ============ Types ============

/**
 * Stagger pattern configuration
 */
export interface StaggerPatternConfig {
  /** Total number of items */
  count: number
  /** Base delay between items (seconds) */
  delay?: number
  /** Easing function for delay distribution */
  easing?: (t: number) => number
}

/**
 * Grid stagger configuration
 */
export interface GridStaggerConfig extends StaggerPatternConfig {
  /** Number of columns */
  columns: number
  /** Grid origin for stagger direction */
  origin?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  /** Direction of stagger flow */
  direction?: 'row' | 'column' | 'diagonal' | 'radial'
}

/**
 * Wave stagger configuration
 */
export interface WaveStaggerConfig extends StaggerPatternConfig {
  /** Wave direction */
  direction?: 'horizontal' | 'vertical' | 'diagonal'
  /** Wave frequency (number of waves) */
  frequency?: number
  /** Wave amplitude (affects delay variation) */
  amplitude?: number
}

/**
 * Spiral stagger configuration
 */
export interface SpiralStaggerConfig extends StaggerPatternConfig {
  /** Number of columns for grid layout */
  columns: number
  /** Spiral direction */
  direction?: 'clockwise' | 'counter-clockwise'
  /** Start from center or edge */
  startFrom?: 'center' | 'edge'
}

/**
 * Random stagger configuration
 */
export interface RandomStaggerConfig extends StaggerPatternConfig {
  /** Seed for reproducible randomness */
  seed?: number
  /** Minimum delay multiplier */
  minMultiplier?: number
  /** Maximum delay multiplier */
  maxMultiplier?: number
}

/**
 * Custom stagger function
 */
export type CustomStaggerFn = (index: number, total: number) => number

// ============ Utility Functions ============

/**
 * Seeded random number generator for reproducible results
 */
function seededRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff
    return state / 0x7fffffff
  }
}

/**
 * Calculate distance from origin in a grid
 */
function gridDistance(
  index: number,
  columns: number,
  rows: number,
  origin: GridStaggerConfig['origin']
): number {
  const col = index % columns
  const row = Math.floor(index / columns)

  let originCol: number
  let originRow: number

  switch (origin) {
    case 'top-left':
      originCol = 0
      originRow = 0
      break
    case 'top-right':
      originCol = columns - 1
      originRow = 0
      break
    case 'bottom-left':
      originCol = 0
      originRow = rows - 1
      break
    case 'bottom-right':
      originCol = columns - 1
      originRow = rows - 1
      break
    case 'center':
    default:
      originCol = (columns - 1) / 2
      originRow = (rows - 1) / 2
      break
  }

  const dx = col - originCol
  const dy = row - originRow
  return Math.sqrt(dx * dx + dy * dy)
}

// ============ Stagger Pattern Functions ============

/**
 * Create linear stagger delays
 *
 * @example
 * ```ts
 * const delays = linearStagger({ count: 10, delay: 0.1 })
 * // [0, 0.1, 0.2, 0.3, ...]
 * ```
 */
export function linearStagger(config: StaggerPatternConfig): number[] {
  const { count, delay = 0.1, easing = (t) => t } = config
  const delays: number[] = []

  for (let i = 0; i < count; i++) {
    const t = count > 1 ? i / (count - 1) : 0
    delays.push(easing(t) * delay * (count - 1))
  }

  return delays
}

/**
 * Create reverse stagger delays (last to first)
 */
export function reverseStagger(config: StaggerPatternConfig): number[] {
  return linearStagger(config).reverse()
}

/**
 * Create center-out stagger delays
 *
 * @example
 * ```ts
 * const delays = centerStagger({ count: 5, delay: 0.1 })
 * // Center items animate first, edges last
 * ```
 */
export function centerStagger(config: StaggerPatternConfig): number[] {
  const { count, delay = 0.1, easing = (t) => t } = config
  const delays: number[] = []
  const center = (count - 1) / 2

  for (let i = 0; i < count; i++) {
    const distanceFromCenter = Math.abs(i - center)
    const maxDistance = center
    const t = maxDistance > 0 ? distanceFromCenter / maxDistance : 0
    delays.push(easing(t) * delay * maxDistance)
  }

  return delays
}

/**
 * Create edge-in stagger delays (edges first, center last)
 */
export function edgeStagger(config: StaggerPatternConfig): number[] {
  const { count, delay = 0.1, easing = (t) => t } = config
  const delays: number[] = []
  const center = (count - 1) / 2
  const maxDelay = delay * center

  for (let i = 0; i < count; i++) {
    const distanceFromCenter = Math.abs(i - center)
    const maxDistance = center
    const t = maxDistance > 0 ? 1 - distanceFromCenter / maxDistance : 0
    delays.push(easing(t) * maxDelay)
  }

  return delays
}

/**
 * Create grid-based stagger delays
 *
 * @example
 * ```ts
 * const delays = gridStagger({
 *   count: 12,
 *   columns: 4,
 *   origin: 'center',
 *   direction: 'radial',
 *   delay: 0.05,
 * })
 * ```
 */
export function gridStagger(config: GridStaggerConfig): number[] {
  const {
    count,
    columns,
    origin = 'top-left',
    direction = 'diagonal',
    delay = 0.1,
    easing = (t) => t,
  } = config

  const rows = Math.ceil(count / columns)
  const delays: number[] = []

  for (let i = 0; i < count; i++) {
    const col = i % columns
    const row = Math.floor(i / columns)

    let t: number

    switch (direction) {
      case 'row':
        // Row by row
        t = row / Math.max(rows - 1, 1)
        break

      case 'column':
        // Column by column
        t = col / Math.max(columns - 1, 1)
        break

      case 'diagonal':
        // Diagonal wave
        t = (col + row) / (columns + rows - 2)
        break

      case 'radial':
      default:
        // Distance from origin
        const maxDistance = gridDistance(
          origin === 'center' ? 0 : count - 1,
          columns,
          rows,
          origin === 'center' ? 'top-left' : origin
        )
        const distance = gridDistance(i, columns, rows, origin)
        t = maxDistance > 0 ? distance / maxDistance : 0
        break
    }

    delays.push(easing(clamp(t, 0, 1)) * delay * Math.max(columns, rows))
  }

  return delays
}

/**
 * Create wave-based stagger delays
 *
 * @example
 * ```ts
 * const delays = waveStagger({
 *   count: 20,
 *   direction: 'horizontal',
 *   frequency: 2,
 *   amplitude: 0.5,
 *   delay: 0.1,
 * })
 * ```
 */
export function waveStagger(config: WaveStaggerConfig): number[] {
  const {
    count,
    direction = 'horizontal',
    frequency = 1,
    amplitude = 0.5,
    delay = 0.1,
    easing = (t) => t,
  } = config

  const delays: number[] = []

  for (let i = 0; i < count; i++) {
    const t = count > 1 ? i / (count - 1) : 0

    // Base linear delay
    let d = t

    // Add wave modulation
    const waveOffset = Math.sin(t * Math.PI * 2 * frequency) * amplitude

    // Apply wave based on direction
    switch (direction) {
      case 'horizontal':
        d = t + waveOffset * 0.5
        break
      case 'vertical':
        d = t + Math.abs(waveOffset)
        break
      case 'diagonal':
        d = t + waveOffset
        break
    }

    delays.push(easing(clamp(d, 0, 1.5)) * delay * (count - 1))
  }

  return delays
}

/**
 * Create spiral stagger delays for grid layouts
 *
 * @example
 * ```ts
 * const delays = spiralStagger({
 *   count: 16,
 *   columns: 4,
 *   direction: 'clockwise',
 *   startFrom: 'edge',
 *   delay: 0.1,
 * })
 * ```
 */
export function spiralStagger(config: SpiralStaggerConfig): number[] {
  const {
    count,
    columns,
    direction = 'clockwise',
    startFrom = 'edge',
    delay = 0.1,
    easing = (t) => t,
  } = config

  const rows = Math.ceil(count / columns)
  const spiral: number[] = []
  const visited = new Set<string>()

  let top = 0
  let bottom = rows - 1
  let left = 0
  let right = columns - 1

  // Generate spiral order
  while (top <= bottom && left <= right) {
    // Top row
    for (let col = left; col <= right; col++) {
      const idx = top * columns + col
      if (idx < count && !visited.has(`${top},${col}`)) {
        spiral.push(idx)
        visited.add(`${top},${col}`)
      }
    }
    top++

    // Right column
    for (let row = top; row <= bottom; row++) {
      const idx = row * columns + right
      if (idx < count && !visited.has(`${row},${right}`)) {
        spiral.push(idx)
        visited.add(`${row},${right}`)
      }
    }
    right--

    // Bottom row
    if (top <= bottom) {
      for (let col = right; col >= left; col--) {
        const idx = bottom * columns + col
        if (idx < count && !visited.has(`${bottom},${col}`)) {
          spiral.push(idx)
          visited.add(`${bottom},${col}`)
        }
      }
      bottom--
    }

    // Left column
    if (left <= right) {
      for (let row = bottom; row >= top; row--) {
        const idx = row * columns + left
        if (idx < count && !visited.has(`${row},${left}`)) {
          spiral.push(idx)
          visited.add(`${row},${left}`)
        }
      }
      left++
    }
  }

  // Reverse for center start or counter-clockwise
  if (startFrom === 'center') {
    spiral.reverse()
  }
  if (direction === 'counter-clockwise') {
    spiral.reverse()
  }

  // Create delay array
  const delays = new Array(count).fill(0)
  const maxDelay = delay * (spiral.length - 1)

  spiral.forEach((originalIndex, spiralPosition) => {
    const t = spiral.length > 1 ? spiralPosition / (spiral.length - 1) : 0
    delays[originalIndex] = easing(t) * maxDelay
  })

  return delays
}

/**
 * Create random stagger delays
 *
 * @example
 * ```ts
 * const delays = randomStagger({
 *   count: 10,
 *   seed: 12345, // Reproducible
 *   delay: 0.1,
 *   minMultiplier: 0,
 *   maxMultiplier: 1,
 * })
 * ```
 */
export function randomStagger(config: RandomStaggerConfig): number[] {
  const {
    count,
    seed = Date.now(),
    delay = 0.1,
    minMultiplier = 0,
    maxMultiplier = 1,
    easing = (t) => t,
  } = config

  const random = seededRandom(seed)
  const delays: number[] = []
  const maxDelay = delay * (count - 1)

  for (let i = 0; i < count; i++) {
    const r = random()
    const multiplier = minMultiplier + r * (maxMultiplier - minMultiplier)
    delays.push(easing(multiplier) * maxDelay)
  }

  return delays
}

/**
 * Create custom stagger delays using a function
 *
 * @example
 * ```ts
 * const delays = customStagger({
 *   count: 10,
 *   delay: 0.1,
 * }, (index, total) => {
 *   // Custom pattern: faster in middle
 *   const center = (total - 1) / 2
 *   return 1 - Math.abs(index - center) / center
 * })
 * ```
 */
export function customStagger(
  config: StaggerPatternConfig,
  fn: CustomStaggerFn
): number[] {
  const { count, delay = 0.1 } = config
  const delays: number[] = []
  const maxDelay = delay * (count - 1)

  for (let i = 0; i < count; i++) {
    const t = fn(i, count)
    delays.push(clamp(t, 0, 1) * maxDelay)
  }

  return delays
}

// ============ Stagger Utilities ============

/**
 * Apply stagger delays to animation options
 *
 * @example
 * ```ts
 * const items = document.querySelectorAll('.item')
 * const delays = gridStagger({ count: items.length, columns: 4 })
 *
 * items.forEach((item, i) => {
 *   spring(item, { opacity: 1 }, { delay: delays[i] })
 * })
 * ```
 */
export function applyStagger<T extends { delay?: number }>(
  options: T[],
  delays: number[]
): T[] {
  return options.map((opt, i) => ({
    ...opt,
    delay: (opt.delay ?? 0) + (delays[i] ?? 0),
  }))
}

/**
 * Stagger pattern presets
 */
export const staggerPresets = {
  /** Quick cascade from first to last */
  cascade: (count: number) => linearStagger({ count, delay: 0.05 }),

  /** Slow reveal from first to last */
  reveal: (count: number) => linearStagger({ count, delay: 0.15 }),

  /** Pop from center outward */
  pop: (count: number) => centerStagger({ count, delay: 0.08 }),

  /** Ripple from edges to center */
  ripple: (count: number) => edgeStagger({ count, delay: 0.08 }),

  /** Random scatter effect */
  scatter: (count: number) => randomStagger({ count, delay: 0.1, seed: 42 }),

  /** Grid diagonal wave */
  gridWave: (count: number, columns: number) =>
    gridStagger({ count, columns, direction: 'diagonal', delay: 0.05 }),

  /** Grid radial from center */
  gridRadial: (count: number, columns: number) =>
    gridStagger({ count, columns, origin: 'center', direction: 'radial', delay: 0.05 }),

  /** Spiral inward */
  spiralIn: (count: number, columns: number) =>
    spiralStagger({ count, columns, startFrom: 'edge', delay: 0.05 }),

  /** Spiral outward */
  spiralOut: (count: number, columns: number) =>
    spiralStagger({ count, columns, startFrom: 'center', delay: 0.05 }),
}
