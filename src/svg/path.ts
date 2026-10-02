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
  /**
   * Animate to target (default 1). Resolves when the animation comes to rest,
   * or when it is stopped by reset(), an instant set() or destroy()
   */
  play: (target?: number) => Promise<void>
  /** Reverse the animation */
  reverse: () => Promise<void>
  /** Set path length directly (0-1) */
  set: (value: number, animate?: boolean) => void
  /** Get current path length */
  get: () => number
  /** Pause the animation (pending play()/reverse() promises stay pending) */
  pause: () => void
  /** Resume the animation */
  resume: () => void
  /** Stop and reset (resolves pending promises without calling onComplete) */
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
  // Last animation target, so resume() can continue towards it after pause()
  let targetValue = 0
  let destroyed = false
  let paused = false
  let pendingRafId: number | null = null
  let pendingTimeoutId: ReturnType<typeof setTimeout> | null = null
  // Resolvers of play()/reverse() promises waiting for the animation to finish
  const waiters = new Set<() => void>()
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

  const cancelWatch = () => {
    if (pendingRafId !== null) {
      cancelAnimationFrame(pendingRafId)
      pendingRafId = null
    }
    if (pendingTimeoutId !== null) {
      clearTimeout(pendingTimeoutId)
      pendingTimeoutId = null
    }
  }

  /**
   * Resolve every pending play()/reverse() promise. `completed` is true when
   * the animation came to rest on its own (fires onComplete once), false when
   * it was stopped (reset, instant set, destroy).
   */
  const settle = (completed: boolean) => {
    cancelWatch()
    if (waiters.size === 0) return
    const resolvers = [...waiters]
    waiters.clear()
    resolvers.forEach((resolve) => resolve())
    if (completed) {
      try {
        onComplete?.()
      } catch (e) {
        console.error('[SpringKit] Path animation onComplete error:', e)
      }
    }
  }

  // Single completion watcher shared by all pending promises. pause() stops it
  // without resolving; resume() restarts it.
  const watch = () => {
    if (pendingRafId !== null || pendingTimeoutId !== null) return

    const check = () => {
      pendingRafId = null
      if (destroyed || paused) return

      if (!spring.isAnimating()) {
        settle(true)
      } else {
        pendingRafId = requestAnimationFrame(check)
      }
    }
    pendingTimeoutId = setTimeout(() => {
      pendingTimeoutId = null
      check()
    }, 16)
  }

  const animateTo = (target: number): Promise<void> => {
    targetValue = target
    paused = false
    spring.set(target)
    return new Promise<void>((resolve) => {
      waiters.add(resolve)
      watch()
    })
  }

  const animation: PathAnimation = {
    play: async (target = 1) => {
      if (destroyed) return
      await animateTo(target)
    },

    reverse: async () => {
      if (destroyed) return
      await animateTo(0)
    },

    set: (value: number, animate = false) => {
      if (destroyed) return

      targetValue = value
      paused = false
      if (animate) {
        spring.set(value)
        if (waiters.size > 0) watch()
      } else {
        spring.jump(value)
        currentValue = value
        const offset = totalLength * (1 - value)
        element.style.strokeDashoffset = String(offset)
        // Jumping interrupts the animation: settle pending promises
        settle(false)
      }
    },

    get: () => currentValue,

    pause: () => {
      if (destroyed) return
      // Pending play() promises stay pending until the animation finishes
      paused = true
      cancelWatch()
      spring.stop()
    },

    resume: () => {
      if (destroyed) return
      paused = false
      // Resume by animating towards the target that was interrupted by pause()
      spring.set(targetValue)
      if (waiters.size > 0) watch()
    },

    reset: () => {
      if (destroyed) return
      paused = false
      spring.jump(0)
      currentValue = 0
      targetValue = 0
      element.style.strokeDashoffset = String(totalLength)
      // Stop resolves pending promises (without onComplete)
      settle(false)
    },

    isAnimating: () => spring.isAnimating(),

    destroy: () => {
      if (destroyed) return
      destroyed = true
      // Cancel pending RAF/timeout and settle pending promises so awaiting
      // code doesn't hang
      settle(false)
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
