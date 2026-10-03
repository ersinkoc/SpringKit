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
 * The FLIP animation currently applied to each element. A new FLIP on the
 * same element cancels it first, so the new one starts from (and finally
 * restores) the element's own inline styles instead of the in-flight FLIP
 * transform.
 */
const activeFlips = new WeakMap<HTMLElement, FlipAnimation>()

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
 * The 2D affine part [a, b, c, d, e, f] of a computed CSS transform
 * (`matrix(...)` or `matrix3d(...)`), or null for `none` / anything else
 */
function parseComputedMatrix(value: string): [number, number, number, number, number, number] | null {
  const match = /^matrix(3d)?\(([^)]*)\)$/.exec(value.trim())
  if (!match) return null
  const v = match[2]!.split(',').map((n) => parseFloat(n))
  const m = match[1]
    ? [v[0], v[1], v[4], v[5], v[12], v[13]]
    : v
  if (m.length < 6 || m.slice(0, 6).some((n) => n === undefined || !Number.isFinite(n))) return null
  return m.slice(0, 6) as [number, number, number, number, number, number]
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
 * The element's own inline `transform` (e.g. a rotate) and `transform-origin`
 * are kept: the FLIP is applied on top of them in screen space, and a size
 * change scales the rendered box from its top-left corner. A transform set
 * only in a stylesheet is overridden by the inline FLIP transform while it
 * runs, and 3D transforms are treated by their 2D part. A new FLIP on the
 * same element cancels the running one.
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

  // Take over from a FLIP still running on this element: cancelling it
  // restores the element's own styles before they are stored below
  activeFlips.get(element)?.cancel()

  // Store original styles
  const originalTransform = element.style.transform
  const originalTransformOrigin = element.style.transformOrigin
  const originalBorderRadius = element.style.borderRadius

  const isScaling = size && (deltaWidth !== 1 || deltaHeight !== 1)

  // The element keeps its own transform-origin (changing it would alter how an
  // existing rotate/scale renders). The scale is compensated with a translation
  // instead, so the invert still maps the "last" box onto the "first" box.
  let origin = { x: 0, y: 0 }
  // Top-left corner of the element's rendered box relative to its layout box
  // (non-zero with an own transform such as rotate): the scale is anchored
  // there, so the measured "last" box scales onto the "first" box
  let anchor = { x: 0, y: 0 }
  let borderRadius = 0
  if (isScaling) {
    let computedOrigin = ''
    let computedRadius = ''
    let computedTransform = ''
    try {
      const styles = getComputedStyle(element)
      computedOrigin = styles.transformOrigin
      computedRadius = styles.borderTopLeftRadius || styles.borderRadius
      computedTransform = styles.transform
    } catch {
      // Not attached / no computed styles available
    }
    const layoutWidth = element.offsetWidth || last.width
    const layoutHeight = element.offsetHeight || last.height
    origin = resolveTransformOrigin(
      computedOrigin || originalTransformOrigin || '50% 50%',
      layoutWidth,
      layoutHeight
    )
    // Only the inline transform stays applied during the FLIP
    const matrix = originalTransform && originalTransform !== 'none'
      ? parseComputedMatrix(computedTransform || '')
      : null
    if (matrix) {
      const [a, b, c, d, e, f] = matrix
      const corners = [[0, 0], [layoutWidth, 0], [0, layoutHeight], [layoutWidth, layoutHeight]].map(([px, py]) => {
        const x = px! - origin.x
        const y = py! - origin.y
        return { x: origin.x + a * x + c * y + e, y: origin.y + b * x + d * y + f }
      })
      anchor = {
        x: Math.min(...corners.map((p) => p.x)),
        y: Math.min(...corners.map((p) => p.y)),
      }
    }
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
      // Keep the rendered box's top-left corner (anchor) fixed by the scale
      if (anchor.x !== 0 || anchor.y !== 0) {
        transforms.push(`translate(${(1 - scaleX) * anchor.x}px, ${(1 - scaleY) * anchor.y}px)`)
      }
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

  // Original styles are restored once (on completion or cancel); a later
  // cancel() must not undo a FLIP that took over the element since
  let restored = false
  const cleanup = () => {
    if (restored) return
    restored = true
    if (activeFlips.get(element) === animation) activeFlips.delete(element)
    // Restore original styles
    element.style.transform = originalTransform
    element.style.transformOrigin = originalTransformOrigin
    if (borderRadius > 0) {
      element.style.borderRadius = originalBorderRadius
    }
  }

  const animation: FlipAnimation = {
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
  activeFlips.set(element, animation)
  return animation
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
  // First: measure initial state (where a running FLIP currently shows it)
  const first = measureElement(element)
  // Stop that FLIP so the last state is measured without its transform
  activeFlips.get(element)?.cancel()

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
  // Stop running FLIPs so the last states are measured without them
  elements.forEach((el) => activeFlips.get(el)?.cancel())

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
