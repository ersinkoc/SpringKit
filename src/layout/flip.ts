import { createSpringValue } from '../core/spring-value.js'
import type { SpringConfig } from '../types.js'

/**
 * Measured box dimensions
 */
export interface MeasuredBox {
  x: number
  y: number
  width: number
  height: number
}

/**
 * FLIP animation options
 */
export interface FlipOptions {
  /** Spring configuration */
  config?: SpringConfig
  /** Whether to animate position */
  position?: boolean
  /** Whether to animate size */
  size?: boolean
  /** Callback when animation completes */
  onComplete?: () => void
  /** Callback for value updates */
  onUpdate?: (progress: number) => void
  /**
   * Counter-scale the element's (px) border radius while it is scaled, so
   * rounded corners don't stretch into ellipses (default false)
   */
  correctBorderRadius?: boolean
}

/**
 * FLIP animation controller
 */
export interface FlipAnimation {
  /** Play the FLIP animation */
  play: () => Promise<void>
  /** Get current progress (0-1) */
  getProgress: () => number
  /** Cancel the animation */
  cancel: () => void
  /** Check if animating */
  isAnimating: () => boolean
}

/**
 * Measure the bounding box of an element
 */
export function measureElement(element: HTMLElement): MeasuredBox {
  const rect = element.getBoundingClientRect()
  return {
    x: rect.left + window.scrollX,
    y: rect.top + window.scrollY,
    width: rect.width,
    height: rect.height,
  }
}

/**
 * Resolve a CSS transform-origin value to pixels relative to the element's
 * top-left corner. Supports lengths in px, percentages and keywords.
 */
function resolveTransformOrigin(value: string, width: number, height: number): { x: number; y: number } {
  const keywords: Record<string, { axis: 'x' | 'y' | 'any'; ratio: number }> = {
    left: { axis: 'x', ratio: 0 },
    right: { axis: 'x', ratio: 1 },
    top: { axis: 'y', ratio: 0 },
    bottom: { axis: 'y', ratio: 1 },
    center: { axis: 'any', ratio: 0.5 },
  }
  const tokens = value.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const a = tokens[0] ?? '50%'
  const b = tokens[1] ?? 'center'
  // Keyword order may be swapped ("top left"); a lone vertical keyword sets y
  const swapped = keywords[a]?.axis === 'y' || keywords[b]?.axis === 'x'
  const first = swapped ? b : a
  const second = swapped ? a : b

  const resolve = (token: string, size: number): number => {
    const keyword = keywords[token]
    if (keyword) return keyword.ratio * size
    const number = parseFloat(token)
    if (!Number.isFinite(number)) return size / 2
    return token.endsWith('%') ? (number / 100) * size : number
  }

  return { x: resolve(first, width), y: resolve(second, height) }
}

/**
 * Create a FLIP (First, Last, Invert, Play) animation.
 *
 * FLIP is a technique for animating layout changes performantly:
 * 1. First: Measure the element's initial position
 * 2. Last: Apply the change and measure final position
 * 3. Invert: Apply transforms to make it look like it's still in the first position
 * 4. Play: Animate the transforms to zero
 *
 * @example Basic FLIP
 * ```ts
 * // Measure first position
 * const first = measureElement(element)
 *
 * // Make layout change
 * element.classList.toggle('expanded')
 *
 * // Measure last position
 * const last = measureElement(element)
 *
 * // Create and play FLIP animation
 * const flip = createFlip(element, first, last)
 * await flip.play()
 * ```
 *
 * @example With options
 * ```ts
 * const flip = createFlip(element, first, last, {
 *   config: { stiffness: 300, damping: 30 },
 *   position: true,  // Animate position
 *   size: true,      // Animate size
 *   onComplete: () => console.log('Done!'),
 * })
 * ```
 */
export function createFlip(
  element: HTMLElement,
  first: MeasuredBox,
  last: MeasuredBox,
  options: FlipOptions = {}
): FlipAnimation {
  const {
    config = {},
    position = true,
    size = true,
    onComplete,
    onUpdate,
    correctBorderRadius = false,
  } = options

  // Calculate the inversion (how much to transform to get back to "first")
  const deltaX = first.x - last.x
  const deltaY = first.y - last.y
  // Guard against division by zero (zero-sized elements)
  const deltaWidth = last.width === 0 ? 1 : first.width / last.width
  const deltaHeight = last.height === 0 ? 1 : first.height / last.height

  let progress = 0
  let isPlaying = false
  let cancelled = false
  let pendingRafId: number | null = null
  let pendingTimeoutId: ReturnType<typeof setTimeout> | null = null
  let resolvePlay: (() => void) | null = null

  const spring = createSpringValue(0, config)

  // Store original styles
  const originalTransform = element.style.transform
  const originalTransformOrigin = element.style.transformOrigin
  const originalBorderRadius = element.style.borderRadius

  const isScaling = size && (deltaWidth !== 1 || deltaHeight !== 1)

  // The element keeps its own transform-origin (changing it would alter how an
  // existing rotate/scale renders). The scale is compensated with a translation
  // instead, so the invert still maps the "last" box onto the "first" box.
  let origin = { x: 0, y: 0 }
  let borderRadius = 0
  if (isScaling) {
    let computedOrigin = ''
    let computedRadius = ''
    try {
      const styles = getComputedStyle(element)
      computedOrigin = styles.transformOrigin
      computedRadius = styles.borderTopLeftRadius || styles.borderRadius
    } catch {
      // Not attached / no computed styles available
    }
    origin = resolveTransformOrigin(
      computedOrigin || originalTransformOrigin || '50% 50%',
      element.offsetWidth || last.width,
      element.offsetHeight || last.height
    )
    const radiusSource = computedRadius || originalBorderRadius
    // Only px radii can be corrected (percentages scale with the box anyway)
    if (correctBorderRadius && !radiusSource.includes('%')) {
      borderRadius = parseFloat(radiusSource) || 0
    }
  }

  const applyTransform = (t: number) => {
    progress = t
    const invertedT = 1 - t

    const transforms: string[] = []
    const scaleX = isScaling ? 1 + (deltaWidth - 1) * invertedT : 1
    const scaleY = isScaling ? 1 + (deltaHeight - 1) * invertedT : 1

    if (position) {
      transforms.push(`translate(${deltaX * invertedT}px, ${deltaY * invertedT}px)`)
    }

    if (isScaling) {
      // Scale around the element's top-left corner whatever its
      // transform-origin is: translate(-origin) scale() translate(origin)
      // cancels the origin the browser applies around the whole transform
      const hasOrigin = origin.x !== 0 || origin.y !== 0
      if (hasOrigin) {
        transforms.push(`translate(${-origin.x}px, ${-origin.y}px)`)
      }
      transforms.push(`scale(${scaleX}, ${scaleY})`)
      if (hasOrigin) {
        transforms.push(`translate(${origin.x}px, ${origin.y}px)`)
      }

      if (borderRadius > 0) {
        const radiusX = scaleX === 0 ? 0 : borderRadius / scaleX
        const radiusY = scaleY === 0 ? 0 : borderRadius / scaleY
        element.style.borderRadius = radiusX === radiusY ? `${radiusX}px` : `${radiusX}px / ${radiusY}px`
      }
    }

    // Keep the element's own transform (e.g. rotate) - the FLIP offset is
    // applied on top of it in screen space instead of replacing it
    if (originalTransform && originalTransform !== 'none') {
      transforms.push(originalTransform)
    }

    element.style.transform = transforms.length > 0 ? transforms.join(' ') : ''
    try {
      onUpdate?.(t)
    } catch (e) {
      console.error('[SpringKit] FLIP onUpdate error:', e)
    }
  }

  // Apply initial inversion
  applyTransform(0)

  const cleanup = () => {
    // Restore original styles
    element.style.transform = originalTransform
    element.style.transformOrigin = originalTransformOrigin
    if (borderRadius > 0) {
      element.style.borderRadius = originalBorderRadius
    }
  }

  return {
    play: async () => {
      if (cancelled) return

      isPlaying = true

      return new Promise<void>((resolve) => {
        resolvePlay = resolve

        const unsubscribe = spring.subscribe((value) => {
          if (cancelled) {
            unsubscribe()
            resolvePlay = null
            resolve()
            return
          }
          applyTransform(value)
        })

        spring.set(1)

        // Wait for animation to complete
        const checkComplete = () => {
          pendingRafId = null

          if (cancelled) {
            unsubscribe()
            cleanup()
            resolvePlay = null
            resolve()
            return
          }

          if (!spring.isAnimating()) {
            isPlaying = false
            unsubscribe()
            cleanup()
            try {
              onComplete?.()
            } catch (e) {
              console.error('[SpringKit] FLIP onComplete error:', e)
            }
            resolvePlay = null
            resolve()
          } else {
            pendingRafId = requestAnimationFrame(checkComplete)
          }
        }

        pendingTimeoutId = setTimeout(() => {
          pendingTimeoutId = null
          checkComplete()
        }, 16)
      })
    },

    getProgress: () => progress,

    cancel: () => {
      cancelled = true
      isPlaying = false

      // Cancel pending RAF and timeout to prevent memory leak
      if (pendingRafId !== null) {
        cancelAnimationFrame(pendingRafId)
        pendingRafId = null
      }
      if (pendingTimeoutId !== null) {
        clearTimeout(pendingTimeoutId)
        pendingTimeoutId = null
      }

      spring.stop()
      cleanup()

      // Resolve the play promise if it's pending
      if (resolvePlay) {
        resolvePlay()
        resolvePlay = null
      }
    },

    isAnimating: () => isPlaying,
  }
}

/**
 * Higher-level helper that handles the full FLIP flow.
 * Automatically measures before/after states.
 *
 * @example
 * ```ts
 * await flip(element, () => {
 *   element.classList.toggle('expanded')
 * }, { config: { stiffness: 200 } })
 * ```
 */
export async function flip(
  element: HTMLElement,
  mutate: () => void | Promise<void>,
  options: FlipOptions = {}
): Promise<void> {
  // First: measure initial state
  const first = measureElement(element)

  // Last: apply mutation and measure final state
  await mutate()

  // Force layout recalculation
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  element.offsetHeight

  const last = measureElement(element)

  // Invert & Play
  const animation = createFlip(element, first, last, options)
  await animation.play()
}

/**
 * Batch FLIP animations for multiple elements.
 * Useful when multiple elements change position together.
 *
 * @example
 * ```ts
 * await flipBatch(
 *   [card1, card2, card3],
 *   () => container.classList.toggle('grid'),
 *   { config: { stiffness: 150 } }
 * )
 * ```
 */
export async function flipBatch(
  elements: HTMLElement[],
  mutate: () => void | Promise<void>,
  options: FlipOptions = {}
): Promise<void> {
  // First: measure all elements
  const firstStates = elements.map((el) => measureElement(el))

  // Last: apply mutation
  await mutate()

  // Force layout recalculation
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  document.body.offsetHeight

  // Measure all final states and create animations
  const animations = elements.map((element, i) => {
    const last = measureElement(element)
    return createFlip(element, firstStates[i]!, last, options)
  })

  // Play all animations
  await Promise.all(animations.map((anim) => anim.play()))
}
