import { solveSpring, type SpringPhysics } from './solver.js'

/** A spring compiled to a CSS easing function */
export interface SpringEasing {
  /** CSS `linear()` easing function, usable in CSS and the Web Animations API */
  readonly easing: string
  /** Duration in milliseconds the easing must be played over */
  readonly duration: number
  /** `"<duration>ms <easing>"` — drop-in value for `transition` / `animation` */
  toString(): string
}

export interface SpringEasingOptions extends SpringPhysics {
  /**
   * Maximum deviation from the true spring curve, in progress units (0-1).
   * Smaller is more accurate but produces a longer `linear()` string.
   * Default 0.002 (0.2%).
   */
  precision?: number
}

const MAX_CACHE_SIZE = 64
const cache = new Map<string, SpringEasing>()

/**
 * Compile spring physics into a CSS `linear()` easing.
 *
 * The result runs entirely in the browser's animation engine: CSS
 * transitions/animations and `element.animate()` play it on the compositor
 * thread, so `transform` and `opacity` springs stay smooth even while the
 * main thread is busy — no JavaScript runs per frame.
 *
 * `velocity` is in progress units per second (1 = the full distance per
 * second), because an easing has no notion of absolute values.
 *
 * @example
 * const { easing, duration } = springEasing({ stiffness: 300, damping: 20 })
 * el.animate({ transform: ['scale(0.8)', 'scale(1)'] }, { duration, easing })
 *
 * @example
 * el.style.transition = `transform ${springEasing(defineSpring({ bounce: 0.3 }))}`
 */
export function springEasing(options: SpringEasingOptions = {}): SpringEasing {
  const precision =
    options.precision !== undefined && options.precision > 0
      ? options.precision
      : 0.002

  const key = [
    options.stiffness,
    options.damping,
    options.mass,
    options.velocity,
    options.restSpeed,
    options.restDelta,
    precision,
  ].join('|')
  const cached = cache.get(key)
  if (cached) return cached

  const solver = solveSpring(options, 0, 1)
  const duration = Math.max(1, Math.round(solver.duration))

  // Sample densely (every ~2ms, at least 64 samples), then keep only the
  // points needed to stay within `precision` of the true curve.
  const sampleCount = Math.min(2000, Math.max(64, Math.ceil(duration / 2)))
  const samples: Array<[number, number]> = []
  for (let i = 0; i <= sampleCount; i++) {
    const progress = i / sampleCount
    samples.push([progress, solver.at(progress * duration).value])
  }
  samples[sampleCount] = [1, 1]

  const points = simplify(samples, precision)
  const easing = `linear(${points
    .map(([t, v], i) =>
      i === 0 || i === points.length - 1
        ? round(v, 4)
        : `${round(v, 4)} ${round(t * 100, 2)}%`
    )
    .join(', ')})`

  const result: SpringEasing = {
    easing,
    duration,
    toString: () => `${duration}ms ${easing}`,
  }

  if (cache.size >= MAX_CACHE_SIZE) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
  cache.set(key, result)
  return result
}

/**
 * Build a CSS `transition` value that animates the given properties with a
 * spring.
 *
 * @example
 * el.style.transition = springTransition(['transform', 'opacity'], { bounce: 0.2 })
 */
export function springTransition(
  properties: string | readonly string[],
  options: SpringEasingOptions = {}
): string {
  const { easing, duration } = springEasing(options)
  const list = typeof properties === 'string' ? [properties] : properties
  return list.map((property) => `${property} ${duration}ms ${easing}`).join(', ')
}

let linearSupport: boolean | undefined

/**
 * Whether the current browser understands the CSS `linear()` easing
 * (Chrome 113+, Firefox 112+, Safari 17.2+). Always false outside a browser.
 */
export function supportsLinearEasing(): boolean {
  if (linearSupport === undefined) {
    try {
      linearSupport =
        typeof CSS !== 'undefined' &&
        typeof CSS.supports === 'function' &&
        CSS.supports('transition-timing-function', 'linear(0, 1)')
    } catch {
      linearSupport = false
    }
  }
  return linearSupport
}

/** Ramer–Douglas–Peucker simplification on (time, value) samples */
function simplify(
  points: Array<[number, number]>,
  tolerance: number
): Array<[number, number]> {
  const keep = new Uint8Array(points.length)
  keep[0] = 1
  keep[points.length - 1] = 1
  const stack: Array<[number, number]> = [[0, points.length - 1]]

  while (stack.length > 0) {
    const [start, end] = stack.pop()!
    const [t0, v0] = points[start]!
    const [t1, v1] = points[end]!
    let maxError = 0
    let index = -1
    for (let i = start + 1; i < end; i++) {
      const [t, v] = points[i]!
      // Vertical error: the browser interpolates linearly in time between stops
      const expected = t1 === t0 ? v0 : v0 + ((v1 - v0) * (t - t0)) / (t1 - t0)
      const error = Math.abs(v - expected)
      if (error > maxError) {
        maxError = error
        index = i
      }
    }
    if (maxError > tolerance && index !== -1) {
      keep[index] = 1
      stack.push([start, index], [index, end])
    }
  }

  return points.filter((_, i) => keep[i] === 1)
}

function round(value: number, digits: number): number {
  const factor = Math.pow(10, digits)
  const rounded = Math.round(value * factor) / factor
  return Object.is(rounded, -0) ? 0 : rounded
}
