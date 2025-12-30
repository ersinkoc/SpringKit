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
  } = options

  // Calculate the inversion (how much to transform to get back to "first")
  const deltaX = first.x - last.x
  const deltaY = first.y - last.y
  const deltaWidth = first.width / last.width
  const deltaHeight = first.height / last.height

  let progress = 0
  let isPlaying = false
  let cancelled = false

  const spring = createSpringValue(0, config)

  // Store original transform
  const originalTransform = element.style.transform
  const originalTransformOrigin = element.style.transformOrigin

  // Set transform origin to top-left for size animations
  if (size) {
    element.style.transformOrigin = '0 0'
  }

  const applyTransform = (t: number) => {
    progress = t
    const invertedT = 1 - t

    const transforms: string[] = []

    if (position) {
      transforms.push(`translate(${deltaX * invertedT}px, ${deltaY * invertedT}px)`)
    }

    if (size && (deltaWidth !== 1 || deltaHeight !== 1)) {
      const scaleX = 1 + (deltaWidth - 1) * invertedT
      const scaleY = 1 + (deltaHeight - 1) * invertedT
      transforms.push(`scale(${scaleX}, ${scaleY})`)
    }

    element.style.transform = transforms.length > 0 ? transforms.join(' ') : ''
    onUpdate?.(t)
  }

  // Apply initial inversion
  applyTransform(0)

  const cleanup = () => {
    // Restore original styles
    element.style.transform = originalTransform
    element.style.transformOrigin = originalTransformOrigin
  }

  return {
    play: async () => {
      if (cancelled) return

      isPlaying = true

      return new Promise<void>((resolve) => {
        const unsubscribe = spring.subscribe((value) => {
          if (cancelled) {
            unsubscribe()
            resolve()
            return
          }
          applyTransform(value)
        })

        spring.set(1)

        // Wait for animation to complete
        const checkComplete = () => {
          if (cancelled) {
            unsubscribe()
            cleanup()
            resolve()
            return
          }

          if (!spring.isAnimating()) {
            isPlaying = false
            unsubscribe()
            cleanup()
            onComplete?.()
            resolve()
          } else {
            requestAnimationFrame(checkComplete)
          }
        }

        setTimeout(checkComplete, 16)
      })
    },

    getProgress: () => progress,

    cancel: () => {
      cancelled = true
      isPlaying = false
      spring.stop()
      cleanup()
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
