/**
 * Anything exposing a `finished` promise (a spring animation, keyframes,
 * decay, an `animate()` control, ...). Used by sequence() and parallel(),
 * which only await `finished`.
 */
export interface FinishableAnimation {
  readonly finished: PromiseLike<unknown>
}

/**
 * An animation that stagger() can start after its delay and then await.
 * SpringAnimation (from `spring()`) satisfies this.
 */
export interface StartableAnimation extends FinishableAnimation {
  start(): unknown
}

/**
 * Stagger options interface
 */
export interface StaggerOptions {
  /**
   * Delay between consecutive items in ms (item k steps away from `from`
   * starts after k * delay), or a function receiving the item's position in
   * start order and returning its delay
   */
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
  animations: ReadonlyArray<() => FinishableAnimation>
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
  animations: ReadonlyArray<() => FinishableAnimation>
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
 * @param animate - Function that creates an animation for each item. Return
 *   it *without* calling `start()`: stagger() starts each one after its delay
 *   (an already started animation ignores the delay).
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
 *     })
 *   },
 *   { delay: 50 }
 * )
 * ```
 */
export async function stagger<T>(
  items: readonly T[],
  animate: (item: T, index: number) => StartableAnimation,
  options: StaggerOptions = {}
): Promise<void> {
  const { delay = 0, from = 'first' } = options

  // Nothing to animate
  if (items.length === 0) return

  // Calculate start index based on 'from' option
  let startIndex = 0
  if (from === 'last') startIndex = items.length - 1
  else if (from === 'center') startIndex = Math.floor(items.length / 2)
  else if (typeof from === 'number') {
    // Clamp to a valid integer index; an out-of-range start would skip items
    // and call animate() with undefined
    startIndex = Number.isFinite(from)
      ? Math.min(Math.max(Math.round(from), 0), items.length - 1)
      : 0
  }

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
  // A number is the delay *between* items: scale it by the distance from the
  // start index, so 'center' fans out symmetrically
  const getDelay =
    typeof delay === 'function'
      ? (i: number) => delay(i)
      : (i: number) => Math.abs(indices[i]! - startIndex) * delay
  const animations: StartableAnimation[] = []
  const timeoutIds: ReturnType<typeof setTimeout>[] = []

  for (let i = 0; i < indices.length; i++) {
    const index = indices[i]!
    const anim = animate(items[index]!, index)
    animations.push(anim)

    const delayMs = getDelay(i)

    if (delayMs > 0) {
      const timeoutId = setTimeout(() => {
        anim.start()
      }, delayMs)
      timeoutIds.push(timeoutId)
    } else {
      anim.start()
    }
  }

  try {
    await Promise.all(animations.map((a) => a.finished))
  } finally {
    // Clear any remaining timeouts on completion or error
    timeoutIds.forEach(clearTimeout)
  }
}
