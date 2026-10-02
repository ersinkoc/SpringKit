import { createSpringValue } from '../core/spring-value.js'
import type { SpringConfig } from '../types.js'
import { globalLoop } from './loop.js'

/** Longest frame (ms) counted by the timed schedule, mirrors the global loop */
const MAX_FRAME_MS = 64
/** Tolerance for comparing schedule times (ms) */
const TIME_EPSILON = 1e-6

/**
 * Keyframe definition with optional per-keyframe config
 */
export interface Keyframe<T = number> {
  /** Target value at this keyframe */
  value: T
  /**
   * Time position (0-1, as a fraction of `KeyframesOptions.duration`) at
   * which this keyframe is due. If not provided, evenly distributed.
   * See {@link keyframes} for how positions are timed.
   */
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
  /**
   * Time positions for keyframes (0-1, as fractions of `duration`). Length
   * must match values array. See {@link keyframes} for how they are timed.
   */
  times?: number[]
  /**
   * Total duration (ms) over which the keyframe positions are laid out.
   * When set, keyframe timing is honored; when omitted, each transition
   * starts as soon as the previous one has settled and positions only
   * determine the order.
   */
  duration?: number
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
 * **Timing.** Without `duration`, each transition starts when the previous
 * spring has settled, and `times` / `at` only order the keyframes. With
 * `duration` (ms), keyframe `i` is due at `times[i] * duration` (positions
 * default to evenly distributed): the value holds the first keyframe until
 * its time, and the spring leaves keyframe `i` for keyframe `i + 1` at
 * keyframe `i`'s time, retargeting with its current velocity if it hasn't
 * settled yet. A spring can't be forced to arrive at an exact time, so a
 * keyframe is reached around its time depending on the spring config. The
 * animation completes once the last spring settles (never before the last
 * keyframe's time). The schedule follows `globalLoop`'s time scale and
 * doesn't advance while paused.
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
 *   times: [0, 0.3, 1], // head for 100 right away, leave it for 0 at 300ms
 *   duration: 1000,
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
    duration,
    onKeyframe,
    onComplete,
    onUpdate,
  } = options

  // Honor keyframe times only when there is a duration to lay them out on
  const totalDuration =
    typeof duration === 'number' && Number.isFinite(duration) && duration > 0 ? duration : 0
  const timed = totalDuration > 0

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

  // Playback time (ms) at which each keyframe is due (timed mode only)
  const dueTimes = normalizedKeyframes.map((kf) => Math.max(0, kf.at ?? 0) * totalDuration)

  // State
  let currentIndex = 0
  let isPlaying = false
  let isPaused = false
  let spring: ReturnType<typeof createSpringValue> | null = null
  let currentValue = normalizedKeyframes[0]?.value ?? 0
  let destroyed = false
  // Track pending RAF and timeout IDs for cleanup
  let pendingRafId: number | null = null
  let pendingTimeoutId: ReturnType<typeof setTimeout> | null = null
  // Resolver of the transition currently being awaited (settled on cancel)
  let pendingResolve: (() => void) | null = null
  // Incremented whenever playback is started, paused, stopped or destroyed.
  // A playback loop only continues while its run id is still current, so a
  // stale loop can never keep advancing keyframes after stop()/pause().
  let runId = 0
  // Set when pause() interrupts a transition before it settled, so resume()
  // finishes that keyframe instead of skipping to the next one.
  let interrupted = false
  // Timed mode: playback time (ms, time-scaled, excludes pauses) and the
  // timestamp it was last advanced at (null while not playing)
  let elapsed = 0
  let lastFrameTime: number | null = null

  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

  /** Advance the timed-mode playback clock to `timestamp` */
  const advanceClock = (timestamp: number) => {
    if (lastFrameTime !== null) {
      const delta = Math.min(Math.max(timestamp - lastFrameTime, 0), MAX_FRAME_MS)
      elapsed += delta * globalLoop.getTimeScale()
    }
    lastFrameTime = timestamp
  }

  /** Resolve once `done()` holds, checking once per animation frame */
  const waitUntil = (done: () => boolean, id: number): Promise<void> =>
    new Promise<void>((resolve) => {
      if (done()) {
        resolve()
        return
      }
      pendingResolve = resolve
      const finish = () => {
        pendingResolve = null
        resolve()
      }
      const frame = (timestamp: number) => {
        pendingRafId = null
        if (destroyed || id !== runId) {
          finish()
          return
        }
        advanceClock(timestamp)
        if (done()) {
          finish()
        } else {
          pendingRafId = requestAnimationFrame(frame)
        }
      }
      pendingRafId = requestAnimationFrame(frame)
    })

  const createSpring = () => {
    if (spring) {
      spring.destroy()
    }

    spring = createSpringValue(currentValue, config)
    spring.subscribe((value) => {
      currentValue = value
      onUpdate?.(value)
    })
  }

  /** Cancel the transition wait in progress and settle its promise */
  const cancelWait = () => {
    if (pendingRafId !== null) {
      cancelAnimationFrame(pendingRafId)
      pendingRafId = null
    }
    if (pendingTimeoutId !== null) {
      clearTimeout(pendingTimeoutId)
      pendingTimeoutId = null
    }
    const resolve = pendingResolve
    pendingResolve = null
    resolve?.()
  }

  /** Animate to a keyframe and wait for the spring to settle */
  const transitionTo = async (targetKf: Keyframe<number>, id: number): Promise<void> => {
    if (!spring) return

    // Per-keyframe config applies only to the transition INTO that keyframe;
    // other transitions fall back to the default config.
    spring.set(targetKf.value, targetKf.config ?? config)

    if (timed) {
      // The next transition starts at this keyframe's time (see
      // animateToNext); only the last one waits here, for its spring to
      // settle and its time to come
      if (currentIndex < normalizedKeyframes.length - 1) return
      const due = dueTimes[currentIndex] ?? 0
      await waitUntil(
        () => elapsed >= due - TIME_EPSILON && !(spring?.isAnimating() ?? false),
        id
      )
      return
    }

    await new Promise<void>((resolve) => {
      pendingResolve = resolve
      const finish = () => {
        pendingResolve = null
        resolve()
      }
      const checkComplete = () => {
        pendingRafId = null

        if (destroyed || id !== runId) {
          finish()
          return
        }

        if (spring && !spring.isAnimating()) {
          finish()
        } else {
          pendingRafId = requestAnimationFrame(checkComplete)
        }
      }
      // Give spring time to start
      pendingTimeoutId = setTimeout(() => {
        pendingTimeoutId = null
        checkComplete()
      }, 16)
    })
  }

  const animateToNext = async (id: number): Promise<boolean> => {
    if (destroyed || isPaused || id !== runId) return false
    if (currentIndex >= normalizedKeyframes.length - 1) return false

    if (timed) {
      // Leave the current keyframe at its time
      const due = dueTimes[currentIndex] ?? 0
      await waitUntil(() => elapsed >= due - TIME_EPSILON, id)
      if (destroyed || isPaused || id !== runId) return false
    }

    currentIndex++
    const targetKf = normalizedKeyframes[currentIndex]
    if (!targetKf) return false

    onKeyframe?.(currentIndex)

    await transitionTo(targetKf, id)

    return id === runId && !destroyed && !isPaused
  }

  /** Playback loop shared by play() and resume() */
  const run = async (id: number): Promise<void> => {
    if (interrupted) {
      interrupted = false
      const targetKf = normalizedKeyframes[currentIndex]
      if (targetKf) {
        await transitionTo(targetKf, id)
      }
    }

    while (await animateToNext(id)) {
      // Continue to next keyframe
    }

    if (id === runId && !isPaused && !destroyed) {
      isPlaying = false
      onComplete?.()
    }
  }

  const animation: KeyframesAnimation = {
    play: async () => {
      if (destroyed) return
      if (isPlaying) return

      cancelWait()
      const id = ++runId
      isPlaying = true
      isPaused = false

      // Reset if at end
      if (currentIndex >= normalizedKeyframes.length - 1) {
        currentIndex = 0
        currentValue = normalizedKeyframes[0]?.value ?? 0
        interrupted = false
        elapsed = 0
      }
      lastFrameTime = now()

      createSpring()
      onKeyframe?.(currentIndex)

      // Animate through all keyframes
      await run(id)
    },

    pause: () => {
      if (destroyed) return
      if (isPlaying) {
        // A transition still in flight must be finished on resume
        interrupted = spring?.isAnimating() ?? false
      }
      isPaused = true
      isPlaying = false
      runId++
      // Count playback time up to now; paused time doesn't advance the schedule
      if (lastFrameTime !== null) advanceClock(now())
      lastFrameTime = null
      if (spring) {
        spring.stop()
      }
      cancelWait()
    },

    resume: () => {
      if (!isPaused || destroyed) return
      isPaused = false
      isPlaying = true

      // Continue from current position
      cancelWait()
      lastFrameTime = now()
      const id = ++runId
      void run(id)
    },

    stop: () => {
      runId++
      isPaused = false
      isPlaying = false
      interrupted = false
      currentIndex = 0
      currentValue = normalizedKeyframes[0]?.value ?? 0
      elapsed = 0
      lastFrameTime = null

      if (spring) {
        spring.jump(currentValue)
      }
      cancelWait()
    },

    get: () => currentValue,

    getCurrentKeyframe: () => currentIndex,

    isPlaying: () => isPlaying,

    jumpTo: (index: number) => {
      if (index < 0 || index >= normalizedKeyframes.length) return

      currentIndex = index
      interrupted = false
      elapsed = dueTimes[index] ?? 0
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
      runId++

      // Cancel pending RAF and timeout to prevent memory leaks, and settle
      // the awaited transition so a pending play() promise resolves
      cancelWait()

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
