import type { SpringAnimation } from '../core/spring.js'

/**
 * Stagger options interface
 */
export interface StaggerOptions {
  /** Delay between animations (ms) or function returning delay */
  delay?: number | ((index: number) => number)
  /** Where to start staggering from */
  from?: 'first' | 'last' | 'center' | number
}

/**
 * Run animations one after another (sequentially)
 *
 * @param animations - Array of functions that create animations
 * @returns Promise that resolves when all animations complete
 *
 * @example
 * ```ts
 * await sequence([
 *   () => spring(0, 100, { onUpdate: updateOpacity }).start(),
 *   () => spring(0, 200, { onUpdate: updateX }).start(),
 *   () => spring(0, 50, { onUpdate: updateY }).start(),
 * ])
 *
 * console.log('All animations complete!')
 * ```
 */
export async function sequence(
  animations: Array<() => SpringAnimation>
): Promise<void> {
  for (const createAnimation of animations) {
    const anim = createAnimation()
    await anim.finished
  }
}

/**
 * Run animations simultaneously (in parallel)
 *
 * @param animations - Array of functions that create animations
 * @returns Promise that resolves when all animations complete
 *
 * @example
 * ```ts
 * await parallel([
 *   () => spring(0, 100, { onUpdate: updateOpacity }).start(),
 *   () => spring(0, 200, { onUpdate: updateX }).start(),
 *   () => spring(1, 2, { onUpdate: updateScale }).start(),
 * ])
 *
 * console.log('All animations complete!')
 * ```
 */
export async function parallel(
  animations: Array<() => SpringAnimation>
): Promise<void> {
  const promises = animations.map((createAnimation) => {
    const anim = createAnimation()
    return anim.finished
  })
  await Promise.all(promises)
}

/**
 * Run animations with staggered delays
 *
 * @param items - Array of items to animate
 * @param animate - Function that creates an animation for each item
 * @param options - Stagger options
 * @returns Promise that resolves when all animations complete
 *
 * @example
 * ```ts
 * const elements = document.querySelectorAll('.item')
 *
 * await stagger(
 *   elements,
 *   (element, index) => {
 *     return spring(0, 1, {
 *       onUpdate: (value) => {
 *         element.style.opacity = String(value)
 *       },
 *     }).start()
 *   },
 *   { delay: 50 }
 * )
 * ```
 */
export async function stagger<T>(
  items: T[],
  animate: (item: T, index: number) => SpringAnimation,
  options: StaggerOptions = {}
): Promise<void> {
  const { delay = 0, from = 'first' } = options

  // Calculate start index based on 'from' option
  let startIndex = 0
  if (from === 'last') startIndex = items.length - 1
  else if (from === 'center') startIndex = Math.floor(items.length / 2)
  else if (typeof from === 'number') startIndex = from

  // Build index order from start point outward
  const indices: number[] = []
  const used = new Set<number>()

  indices.push(startIndex)
  used.add(startIndex)

  for (let offset = 1; offset < items.length; offset++) {
    const left = startIndex - offset
    const right = startIndex + offset

    // Add right first if it exists
    if (right < items.length && !used.has(right)) {
      indices.push(right)
      used.add(right)
    }

    // Then add left if it exists
    if (left >= 0 && !used.has(left)) {
      indices.push(left)
      used.add(left)
    }
  }

  // All indices are already added by the main loop above
  // No need for defensive fallback as the logic is complete

  // Start animations with delay
  const getDelay = typeof delay === 'function' ? delay : (_i: number) => delay
  const animations: SpringAnimation[] = []

  for (let i = 0; i < indices.length; i++) {
    const index = indices[i]!
    const anim = animate(items[index]!, index)
    animations.push(anim)

    const delayMs = getDelay(i)

    if (delayMs > 0) {
      setTimeout(() => {
        anim.start()
      }, delayMs)
    } else {
      anim.start()
    }
  }

  await Promise.all(animations.map((a) => a.finished))
}
