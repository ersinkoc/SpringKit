import { createSpringValue } from '../core/spring-value.js'
import type { SpringConfig } from '../types.js'

/**
 * Options for path animation
 */
export interface PathAnimationOptions {
  /** Spring configuration */
  config?: SpringConfig
  /** Whether to auto-play on creation */
  autoPlay?: boolean
  /** Callback for value updates */
  onUpdate?: (value: number) => void
  /** Callback when animation completes */
  onComplete?: () => void
}

/**
 * Path animation controller
 */
export interface PathAnimation {
  /** Start the animation from 0 to target */
  play: (target?: number) => Promise<void>
  /** Reverse the animation */
  reverse: () => Promise<void>
  /** Set path length directly (0-1) */
  set: (value: number, animate?: boolean) => void
  /** Get current path length */
  get: () => number
  /** Pause the animation */
  pause: () => void
  /** Resume the animation */
  resume: () => void
  /** Stop and reset */
  reset: () => void
  /** Check if animating */
  isAnimating: () => boolean
  /** Destroy and cleanup */
  destroy: () => void
}

/**
 * Create a path length animation for SVG stroke drawing effects.
 * Animates stroke-dashoffset to reveal/hide a path.
 *
 * @example Basic path drawing
 * ```ts
 * const pathAnim = createPathAnimation(pathElement, {
 *   config: { stiffness: 100, damping: 15 },
 * })
 *
 * // Draw the path
 * await pathAnim.play()
 *
 * // Erase the path
 * await pathAnim.reverse()
 * ```
 *
 * @example With offset control
 * ```ts
 * const anim = createPathAnimation(path)
 *
 * // Draw 50% of the path
 * anim.set(0.5)
 *
 * // Draw full path with animation
 * anim.set(1, true)
 * ```
 */
export function createPathAnimation(
  element: SVGPathElement | SVGCircleElement | SVGRectElement | SVGLineElement | SVGPolylineElement | SVGPolygonElement | SVGEllipseElement,
  options: PathAnimationOptions = {}
): PathAnimation {
  const {
    config = {},
    autoPlay = false,
    onUpdate,
    onComplete,
  } = options

  // Get total path length
  const totalLength = element.getTotalLength?.() ?? 0

  // Set initial stroke properties
  element.style.strokeDasharray = String(totalLength)
  element.style.strokeDashoffset = String(totalLength)

  let currentValue = 0
  let destroyed = false
  let pendingRafId: number | null = null
  let pendingTimeoutId: ReturnType<typeof setTimeout> | null = null
  const spring = createSpringValue(0, config)

  // Subscribe to updates
  const unsubscribe = spring.subscribe((value) => {
    if (destroyed) return

    currentValue = value
    // Convert 0-1 to offset (1 = hidden, 0 = visible)
    const offset = totalLength * (1 - value)
    element.style.strokeDashoffset = String(offset)
    onUpdate?.(value)
  })

  const waitForRest = (): Promise<void> => {
    return new Promise((resolve) => {
      const check = () => {
        pendingRafId = null

        if (destroyed || !spring.isAnimating()) {
          resolve()
        } else {
          pendingRafId = requestAnimationFrame(check)
        }
      }
      pendingTimeoutId = setTimeout(() => {
        pendingTimeoutId = null
        check()
      }, 16)
    })
  }

  const animation: PathAnimation = {
    play: async (target = 1) => {
      if (destroyed) return
      spring.set(target)
      await waitForRest()
      onComplete?.()
    },

    reverse: async () => {
      if (destroyed) return
      spring.set(0)
      await waitForRest()
      onComplete?.()
    },

    set: (value: number, animate = false) => {
      if (destroyed) return

      if (animate) {
        spring.set(value)
      } else {
        spring.jump(value)
        currentValue = value
        const offset = totalLength * (1 - value)
        element.style.strokeDashoffset = String(offset)
      }
    },

    get: () => currentValue,

    pause: () => {
      if (destroyed) return
      spring.stop()
    },

    resume: () => {
      if (destroyed) return
      // Resume by re-setting target
      spring.set(currentValue)
    },

    reset: () => {
      if (destroyed) return
      spring.jump(0)
      currentValue = 0
      element.style.strokeDashoffset = String(totalLength)
    },

    isAnimating: () => spring.isAnimating(),

    destroy: () => {
      destroyed = true
      // Cancel pending RAF and timeout to prevent memory leaks
      if (pendingRafId !== null) {
        cancelAnimationFrame(pendingRafId)
        pendingRafId = null
      }
      if (pendingTimeoutId !== null) {
        clearTimeout(pendingTimeoutId)
        pendingTimeoutId = null
      }
      unsubscribe()
      spring.destroy()
    },
  }

  if (autoPlay) {
    animation.play()
  }

  return animation
}

/**
 * Get the total length of an SVG path element
 */
export function getPathLength(
  element: SVGPathElement | SVGCircleElement | SVGRectElement | SVGLineElement | SVGPolylineElement | SVGPolygonElement | SVGEllipseElement
): number {
  return element.getTotalLength?.() ?? 0
}

/**
 * Set up an element for path animation (sets dasharray and dashoffset)
 */
export function preparePathForAnimation(
  element: SVGPathElement | SVGCircleElement | SVGRectElement | SVGLineElement | SVGPolylineElement | SVGPolygonElement | SVGEllipseElement,
  initialProgress = 0
): void {
  const length = element.getTotalLength?.() ?? 0
  element.style.strokeDasharray = String(length)
  element.style.strokeDashoffset = String(length * (1 - initialProgress))
}

/**
 * Calculate the point on a path at a given percentage
 */
export function getPointAtProgress(
  path: SVGPathElement,
  progress: number
): DOMPoint | null {
  try {
    const length = path.getTotalLength()
    return path.getPointAtLength(length * Math.max(0, Math.min(1, progress)))
  } catch {
    return null
  }
}
