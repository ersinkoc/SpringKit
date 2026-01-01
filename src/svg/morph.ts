/**
 * SVG Morphing - Smooth path shape interpolation with spring physics
 *
 * Enables morphing between SVG paths with automatic path normalization
 * and spring-based animation.
 */

import { createSpringValue } from '../core/spring-value.js'
import type { SpringConfig } from '../core/config.js'
import { lerp, clamp } from '../utils/math.js'

// ============ Types ============

/**
 * SVG path command types
 */
type CommandType = 'M' | 'L' | 'C' | 'Q' | 'A' | 'Z' | 'H' | 'V' | 'S' | 'T'

/**
 * Parsed path command
 */
interface PathCommand {
  type: CommandType
  values: number[]
}

/**
 * Normalized point with control points
 */
interface NormalizedPoint {
  x: number
  y: number
  cp1x?: number
  cp1y?: number
  cp2x?: number
  cp2y?: number
}

/**
 * Morph configuration
 */
export interface MorphConfig {
  /** Spring configuration */
  spring?: SpringConfig
  /** Number of samples for path normalization (higher = smoother) */
  samples?: number
  /** Callback on progress update */
  onProgress?: (progress: number) => void
  /** Callback when morph completes */
  onComplete?: () => void
}

/**
 * Morph controller interface
 */
export interface MorphController {
  /** Get current morphed path */
  getPath(): string
  /** Get current progress (0-1) */
  getProgress(): number
  /** Morph to a new path */
  morphTo(path: string): void
  /** Set progress directly (0-1) */
  setProgress(progress: number): void
  /** Subscribe to path changes */
  subscribe(callback: (path: string) => void): () => void
  /** Destroy and cleanup */
  destroy(): void
}

// ============ Path Parsing ============

/**
 * Parse SVG path string into commands
 */
function parsePath(d: string): PathCommand[] {
  const commands: PathCommand[] = []
  const regex = /([MLCQAZHVST])([^MLCQAZHVST]*)/gi

  // Use matchAll instead of regex.exec for safer iteration
  const matches = d.matchAll(regex)

  for (const matchItem of matches) {
    const typeChar = matchItem[1]
    const valuesStr = matchItem[2]
    if (!typeChar || valuesStr === undefined) continue

    const type = typeChar.toUpperCase() as CommandType
    const values = valuesStr
      .trim()
      .split(/[\s,]+/)
      .filter(v => v !== '')
      .map(parseFloat)
      .filter(v => !isNaN(v))

    commands.push({ type, values })
  }

  return commands
}

/**
 * Convert path commands to absolute coordinates
 */
function toAbsolute(commands: PathCommand[]): PathCommand[] {
  let currentX = 0
  let currentY = 0
  let startX = 0
  let startY = 0

  return commands.map(cmd => {
    const { type, values } = cmd
    const absValues = [...values]

    switch (type) {
      case 'M':
        currentX = values[0] ?? 0
        currentY = values[1] ?? 0
        startX = currentX
        startY = currentY
        break

      case 'L':
        currentX = values[0] ?? 0
        currentY = values[1] ?? 0
        break

      case 'H':
        absValues[0] = values[0] ?? 0
        currentX = values[0] ?? 0
        break

      case 'V':
        absValues[0] = values[0] ?? 0
        currentY = values[0] ?? 0
        break

      case 'C':
        currentX = values[4] ?? 0
        currentY = values[5] ?? 0
        break

      case 'Q':
        currentX = values[2] ?? 0
        currentY = values[3] ?? 0
        break

      case 'A':
        currentX = values[5] ?? 0
        currentY = values[6] ?? 0
        break

      case 'Z':
        currentX = startX
        currentY = startY
        break
    }

    return { type, values: absValues }
  })
}

/**
 * Sample points along a path at regular intervals
 */
function samplePath(commands: PathCommand[], samples: number): NormalizedPoint[] {
  const points: NormalizedPoint[] = []

  // Check if we're in browser
  if (typeof document === 'undefined') {
    // Server-side fallback - simple linear sampling
    for (const cmd of commands) {
      if (cmd.type === 'M' || cmd.type === 'L') {
        points.push({ x: cmd.values[0] ?? 0, y: cmd.values[1] ?? 0 })
      } else if (cmd.type === 'C') {
        points.push({
          x: cmd.values[4] ?? 0,
          y: cmd.values[5] ?? 0,
          cp1x: cmd.values[0] ?? 0,
          cp1y: cmd.values[1] ?? 0,
          cp2x: cmd.values[2] ?? 0,
          cp2y: cmd.values[3] ?? 0,
        })
      }
    }
    return points
  }

  const svgNS = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(svgNS, 'svg')
  const path = document.createElementNS(svgNS, 'path')

  // Build path string
  let d = ''
  for (const cmd of commands) {
    d += cmd.type + cmd.values.join(' ')
  }
  path.setAttribute('d', d)
  svg.appendChild(path)
  document.body.appendChild(svg)

  try {
    const totalLength = path.getTotalLength()
    const step = totalLength / (samples - 1)

    for (let i = 0; i < samples; i++) {
      const point = path.getPointAtLength(i * step)
      points.push({ x: point.x, y: point.y })
    }
  } finally {
    document.body.removeChild(svg)
  }

  return points
}

/**
 * Interpolate between two points
 */
function interpolatePoint(p1: NormalizedPoint, p2: NormalizedPoint, t: number): NormalizedPoint {
  return {
    x: lerp(p1.x, p2.x, t),
    y: lerp(p1.y, p2.y, t),
  }
}

/**
 * Convert normalized points back to path string
 */
function pointsToPath(points: NormalizedPoint[]): string {
  if (points.length === 0) return ''

  const firstPoint = points[0]!
  let d = `M ${firstPoint.x} ${firstPoint.y}`

  for (let i = 1; i < points.length; i++) {
    const point = points[i]!
    d += ` L ${point.x} ${point.y}`
  }

  return d
}

// ============ Morph Implementation ============

/**
 * Create SVG path morph controller
 *
 * @example
 * ```ts
 * const morph = createMorph(circlePath, {
 *   spring: { stiffness: 120, damping: 14 },
 *   onProgress: (p) => console.log('Progress:', p),
 * })
 *
 * morph.subscribe((path) => {
 *   element.setAttribute('d', path)
 * })
 *
 * morph.morphTo(starPath)
 * ```
 */
export function createMorph(
  initialPath: string,
  config: MorphConfig = {}
): MorphController {
  const {
    spring: springConfig = { stiffness: 120, damping: 14 },
    samples = 100,
    onProgress,
    onComplete,
  } = config

  let currentPath = initialPath
  let fromPoints: NormalizedPoint[] = []
  let toPoints: NormalizedPoint[] = []
  let currentPoints: NormalizedPoint[] = []

  const subscribers = new Set<(path: string) => void>()

  // Parse initial path
  const initialCommands = parsePath(initialPath)
  fromPoints = samplePath(toAbsolute(initialCommands), samples)
  currentPoints = [...fromPoints]
  toPoints = [...fromPoints]

  // Create spring for progress
  const progressSpring = createSpringValue(0, springConfig)

  progressSpring.subscribe(() => {
    const progress = progressSpring.get()
    onProgress?.(progress)

    // Interpolate points
    currentPoints = fromPoints.map((from, i) =>
      interpolatePoint(from, toPoints[i] ?? from, progress)
    )

    currentPath = pointsToPath(currentPoints)
    subscribers.forEach(cb => cb(currentPath))

    if (progress >= 0.999) {
      onComplete?.()
    }
  })

  return {
    getPath: () => currentPath,
    getProgress: () => progressSpring.get(),

    morphTo(path: string) {
      // Normalize paths
      const targetCommands = parsePath(path)
      const targetPoints = samplePath(toAbsolute(targetCommands), samples)

      fromPoints = [...currentPoints]
      toPoints = targetPoints

      // Ensure same number of points
      while (fromPoints.length < toPoints.length) {
        fromPoints.push(fromPoints[fromPoints.length - 1] || { x: 0, y: 0 })
      }
      while (toPoints.length < fromPoints.length) {
        toPoints.push(toPoints[toPoints.length - 1] || { x: 0, y: 0 })
      }

      // Reset and animate
      progressSpring.jump(0)
      progressSpring.set(1)
    },

    setProgress(progress: number) {
      const p = clamp(progress, 0, 1)
      progressSpring.jump(p)

      currentPoints = fromPoints.map((from, i) =>
        interpolatePoint(from, toPoints[i] ?? from, p)
      )

      currentPath = pointsToPath(currentPoints)
      subscribers.forEach(cb => cb(currentPath))
    },

    subscribe(callback) {
      subscribers.add(callback)
      callback(currentPath)
      return () => subscribers.delete(callback)
    },

    destroy() {
      progressSpring.destroy()
      subscribers.clear()
    },
  }
}

/**
 * Create a morph between multiple paths (morphing sequence)
 *
 * @example
 * ```ts
 * const sequence = createMorphSequence([
 *   circlePath,
 *   squarePath,
 *   starPath,
 * ])
 *
 * sequence.subscribe((path) => {
 *   element.setAttribute('d', path)
 * })
 *
 * sequence.morphToIndex(2) // Morph to star
 * ```
 */
export function createMorphSequence(
  paths: string[],
  config: MorphConfig = {}
): {
  getPath(): string
  getCurrentIndex(): number
  morphToIndex(index: number): void
  morphToNext(): void
  morphToPrevious(): void
  subscribe(callback: (path: string) => void): () => void
  destroy(): void
} {
  if (paths.length === 0) {
    throw new Error('At least one path is required')
  }

  let currentIndex = 0
  const firstPath = paths[0]!
  const morph = createMorph(firstPath, config)

  return {
    getPath: () => morph.getPath(),
    getCurrentIndex: () => currentIndex,

    morphToIndex(index: number) {
      const targetIndex = clamp(index, 0, paths.length - 1)
      if (targetIndex !== currentIndex) {
        currentIndex = targetIndex
        const targetPath = paths[targetIndex]!
        morph.morphTo(targetPath)
      }
    },

    morphToNext() {
      this.morphToIndex((currentIndex + 1) % paths.length)
    },

    morphToPrevious() {
      this.morphToIndex((currentIndex - 1 + paths.length) % paths.length)
    },

    subscribe: (callback) => morph.subscribe(callback),
    destroy: () => morph.destroy(),
  }
}

// ============ Preset Shapes ============

/**
 * Generate common SVG shape paths
 */
export const shapes = {
  /**
   * Generate circle path
   */
  circle(cx: number, cy: number, r: number): string {
    return `M ${cx - r} ${cy}
            A ${r} ${r} 0 1 1 ${cx + r} ${cy}
            A ${r} ${r} 0 1 1 ${cx - r} ${cy}`
  },

  /**
   * Generate rectangle path
   */
  rect(x: number, y: number, width: number, height: number, rx = 0): string {
    if (rx === 0) {
      return `M ${x} ${y}
              L ${x + width} ${y}
              L ${x + width} ${y + height}
              L ${x} ${y + height}
              Z`
    }

    return `M ${x + rx} ${y}
            L ${x + width - rx} ${y}
            Q ${x + width} ${y} ${x + width} ${y + rx}
            L ${x + width} ${y + height - rx}
            Q ${x + width} ${y + height} ${x + width - rx} ${y + height}
            L ${x + rx} ${y + height}
            Q ${x} ${y + height} ${x} ${y + height - rx}
            L ${x} ${y + rx}
            Q ${x} ${y} ${x + rx} ${y}
            Z`
  },

  /**
   * Generate polygon path
   */
  polygon(cx: number, cy: number, r: number, sides: number): string {
    const points: string[] = []

    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2 - Math.PI / 2
      const x = cx + r * Math.cos(angle)
      const y = cy + r * Math.sin(angle)
      points.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`)
    }

    return points.join(' ') + ' Z'
  },

  /**
   * Generate star path
   */
  star(cx: number, cy: number, outerR: number, innerR: number, points: number): string {
    const path: string[] = []
    const step = Math.PI / points

    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR
      const angle = i * step - Math.PI / 2
      const x = cx + r * Math.cos(angle)
      const y = cy + r * Math.sin(angle)
      path.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`)
    }

    return path.join(' ') + ' Z'
  },

  /**
   * Generate heart path
   */
  heart(cx: number, cy: number, size: number): string {
    const d = size / 4
    return `M ${cx} ${cy + d}
            C ${cx} ${cy} ${cx - 2 * d} ${cy} ${cx - 2 * d} ${cy - d}
            C ${cx - 2 * d} ${cy - 2 * d} ${cx} ${cy - 2 * d} ${cx} ${cy - d}
            C ${cx} ${cy - 2 * d} ${cx + 2 * d} ${cy - 2 * d} ${cx + 2 * d} ${cy - d}
            C ${cx + 2 * d} ${cy} ${cx} ${cy} ${cx} ${cy + d}
            Z`
  },

  /**
   * Generate arrow path
   */
  arrow(x: number, y: number, width: number, height: number, direction: 'up' | 'down' | 'left' | 'right' = 'right'): string {
    const hw = width / 2
    const hh = height / 2

    switch (direction) {
      case 'right':
        return `M ${x} ${y - hh} L ${x + width} ${y} L ${x} ${y + hh} Z`
      case 'left':
        return `M ${x + width} ${y - hh} L ${x} ${y} L ${x + width} ${y + hh} Z`
      case 'up':
        return `M ${x - hw} ${y + height} L ${x} ${y} L ${x + hw} ${y + height} Z`
      case 'down':
        return `M ${x - hw} ${y} L ${x} ${y + height} L ${x + hw} ${y} Z`
    }
  },
}
