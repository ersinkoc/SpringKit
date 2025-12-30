import { createSpringValue } from '../core/spring-value.js'
import type { SpringConfig } from '../types.js'

/**
 * Keyframe definition with optional per-keyframe config
 */
export interface Keyframe<T = number> {
  /** Target value at this keyframe */
  value: T
  /** Time position (0-1) for this keyframe. If not provided, evenly distributed */
  at?: number
  /** Spring config override for transition TO this keyframe */
  config?: SpringConfig
}

/**
 * Options for keyframe animation
 */
export interface KeyframesOptions {
  /** Default spring configuration */
  config?: SpringConfig
  /** Time positions for keyframes (0-1). Length must match values array */
  times?: number[]
  /** Callback for each keyframe transition start */
  onKeyframe?: (index: number) => void
  /** Callback when all keyframes complete */
  onComplete?: () => void
  /** Callback for value updates */
  onUpdate?: (value: number) => void
}

/**
 * Keyframes animation controller
 */
export interface KeyframesAnimation {
  /** Start the animation */
  play: () => Promise<void>
  /** Pause the animation */
  pause: () => void
  /** Resume a paused animation */
  resume: () => void
  /** Stop and reset to initial value */
  stop: () => void
  /** Get current value */
  get: () => number
  /** Get current keyframe index */
  getCurrentKeyframe: () => number
  /** Check if animation is playing */
  isPlaying: () => boolean
  /** Jump to specific keyframe */
  jumpTo: (index: number) => void
  /** Destroy and cleanup */
  destroy: () => void
}

/**
 * Create a keyframe-based spring animation.
 * Animates through a sequence of values using spring physics.
 *
 * @example Basic keyframes
 * ```ts
 * const anim = keyframes([0, 100, 50, 100], {
 *   config: { stiffness: 200, damping: 20 },
 *   onUpdate: (value) => element.style.opacity = value / 100,
 * })
 * await anim.play()
 * ```
 *
 * @example With time positions
 * ```ts
 * const anim = keyframes([0, 100, 0], {
 *   times: [0, 0.3, 1], // 100 at 30%, back to 0 at 100%
 *   onUpdate: (value) => console.log(value),
 * })
 * ```
 *
 * @example With per-keyframe configs
 * ```ts
 * const anim = keyframes([
 *   { value: 0 },
 *   { value: 100, config: { stiffness: 500 } }, // Quick to 100
 *   { value: 50, config: { stiffness: 100 } },  // Slow to 50
 * ])
 * ```
 */
export function keyframes(
  values: (number | Keyframe<number>)[],
  options: KeyframesOptions = {}
): KeyframesAnimation {
  const {
    config = {},
    times,
    onKeyframe,
    onComplete,
    onUpdate,
  } = options

  // Normalize keyframes
  const normalizedKeyframes = values.map((v, i): Keyframe<number> => {
    if (typeof v === 'number') {
      return {
        value: v,
        at: times?.[i],
      }
    }
    return { ...v, at: v.at ?? times?.[i] }
  })

  // Fill in missing time positions (evenly distributed)
  const keyframeCount = normalizedKeyframes.length
  normalizedKeyframes.forEach((kf, i) => {
    if (kf.at === undefined) {
      kf.at = keyframeCount > 1 ? i / (keyframeCount - 1) : 0
    }
  })

  // Sort by time position
  normalizedKeyframes.sort((a, b) => (a.at ?? 0) - (b.at ?? 0))

  // State
  let currentIndex = 0
  let isPlaying = false
  let isPaused = false
  let spring: ReturnType<typeof createSpringValue> | null = null
  let currentValue = normalizedKeyframes[0]?.value ?? 0
  let destroyed = false

  const createSpring = () => {
    if (spring) {
      spring.destroy()
    }

    const currentKf = normalizedKeyframes[currentIndex]
    const springConfig = currentKf?.config ?? config

    spring = createSpringValue(currentValue, springConfig)
    spring.subscribe((value) => {
      currentValue = value
      onUpdate?.(value)
    })
  }

  const animateToNext = async (): Promise<boolean> => {
    if (destroyed || isPaused) return false
    if (currentIndex >= normalizedKeyframes.length - 1) return false

    currentIndex++
    const targetKf = normalizedKeyframes[currentIndex]
    if (!targetKf) return false

    // Create new spring with keyframe-specific config if needed
    if (targetKf.config) {
      createSpring()
    }

    onKeyframe?.(currentIndex)

    if (spring) {
      spring.set(targetKf.value)

      // Wait for spring to settle
      await new Promise<void>((resolve) => {
        const checkComplete = () => {
          if (destroyed || isPaused) {
            resolve()
            return
          }

          if (spring && !spring.isAnimating()) {
            resolve()
          } else {
            requestAnimationFrame(checkComplete)
          }
        }
        // Give spring time to start
        setTimeout(checkComplete, 16)
      })
    }

    return true
  }

  const animation: KeyframesAnimation = {
    play: async () => {
      if (destroyed) return
      if (isPlaying) return

      isPlaying = true
      isPaused = false

      // Reset if at end
      if (currentIndex >= normalizedKeyframes.length - 1) {
        currentIndex = 0
        currentValue = normalizedKeyframes[0]?.value ?? 0
      }

      createSpring()
      onKeyframe?.(0)

      // Animate through all keyframes
      while (await animateToNext()) {
        // Continue to next keyframe
      }

      if (!isPaused && !destroyed) {
        isPlaying = false
        onComplete?.()
      }
    },

    pause: () => {
      isPaused = true
      isPlaying = false
      if (spring) {
        spring.stop()
      }
    },

    resume: () => {
      if (!isPaused || destroyed) return
      isPaused = false
      isPlaying = true

      // Continue from current position
      const continueAnimation = async () => {
        while (await animateToNext()) {
          // Continue to next keyframe
        }

        if (!isPaused && !destroyed) {
          isPlaying = false
          onComplete?.()
        }
      }

      continueAnimation()
    },

    stop: () => {
      isPaused = false
      isPlaying = false
      currentIndex = 0
      currentValue = normalizedKeyframes[0]?.value ?? 0

      if (spring) {
        spring.jump(currentValue)
      }
    },

    get: () => currentValue,

    getCurrentKeyframe: () => currentIndex,

    isPlaying: () => isPlaying,

    jumpTo: (index: number) => {
      if (index < 0 || index >= normalizedKeyframes.length) return

      currentIndex = index
      const targetValue = normalizedKeyframes[index]?.value ?? 0
      currentValue = targetValue

      if (spring) {
        spring.jump(targetValue)
      }

      onUpdate?.(targetValue)
      onKeyframe?.(index)
    },

    destroy: () => {
      destroyed = true
      isPlaying = false
      isPaused = false

      if (spring) {
        spring.destroy()
        spring = null
      }
    },
  }

  return animation
}

/**
 * Helper to create a keyframe sequence from an array shorthand
 *
 * @example
 * ```ts
 * // Equivalent to: keyframes([0, 100, 50])
 * const values = parseKeyframeArray([0, 100, 50])
 * ```
 */
export function parseKeyframeArray(
  values: number[],
  times?: number[]
): Keyframe<number>[] {
  return values.map((value, index) => ({
    value,
    at: times?.[index],
  }))
}

/**
 * Check if a value is a keyframe array (for animate prop detection)
 */
export function isKeyframeArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'number')
}
