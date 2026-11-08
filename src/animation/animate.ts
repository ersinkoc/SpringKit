/**
 * Imperative animate function for direct element animation
 *
 * Similar to Framer Motion's animate() function - allows animating elements
 * without React hooks.
 */

import { createSpringValue, type SpringValue } from '../core/spring-value.js'
import { globalLoop } from './loop.js'
import { readStyle, writeStyle } from '../dom/style.js'
import { parseAnimatableValue, composeAnimatableValue, type ParsedValue } from '../dom/values.js'
import { createTweenValue, type TimedValue } from './tween-value.js'

export interface AnimateTarget {
  [property: string]: number | string | number[] | string[]
}

export type AnimatedTargetValues<T extends AnimateTarget> = {
  [K in keyof T]: T[K] extends number | number[] ? number : T[K] extends string | string[] ? string : number | string
}

export interface AnimateOptions<Values = Record<string, number>> {
  /** Spring stiffness */
  stiffness?: number
  /** Spring damping */
  damping?: number
  /** Spring mass */
  mass?: number
  /** Delay before animation starts (ms of animation time: follows the time scale) */
  delay?: number
  /** Total duration in milliseconds; when set, uses timed interpolation instead of a spring. */
  duration?: number
  /** Ease function for non-spring animations */
  ease?: (t: number) => number
  /** Called on each frame with current values */
  onUpdate?(values: Values): void
  /** Called when animation completes */
  onComplete?: () => void
}

export interface AnimateControls {
  /** Stop the animation */
  stop: () => void
  /** Pause the animation */
  pause: () => void
  /** Resume a paused animation */
  resume: () => void
  /** Get current progress (0-1) */
  getProgress: () => number
  /** Check if animation is running */
  isAnimating: () => boolean
  /** Promise that resolves when animation completes */
  finished: Promise<void>
}

const propertyOwners = new WeakMap<Element, Map<string, () => void>>()

function parseCurrentValue(element: Element, property: string): number {
  const raw = readStyle(element, property)
  const value = typeof raw === 'number' ? raw : parseFloat(raw)
  return Number.isFinite(value) ? value : property === 'opacity' ? 1 : 0
}

/**
 * Animate an element or selector with spring physics
 *
 * @example Basic usage
 * ```ts
 * import { animate } from '@oxog/springkit'
 *
 * // Animate a single element
 * const controls = animate(element, { x: 100, opacity: 0.5 })
 *
 * // Wait for completion
 * await controls.finished
 * ```
 *
 * @example With selector
 * ```ts
 * animate('.box', { scale: 1.2, rotate: 45 }, {
 *   stiffness: 300,
 *   damping: 20,
 *   onComplete: () => console.log('Done!')
 * })
 * ```
 *
 * @example Keyframes
 * ```ts
 * // An array is `[from, ...keyframes]`: the property jumps to the FIRST
 * // entry, then springs through the remaining entries in order
 * // (here 0 -> 1 -> 0.5 -> 1). A single-entry array is a plain target.
 * animate(element, { opacity: [0, 1, 0.5, 1] })
 * ```
 *
 * @example Control animation
 * ```ts
 * const controls = animate(element, { x: 200 })
 * controls.pause()
 * controls.resume()
 * controls.stop()
 * ```
 */
export function animate<T extends AnimateTarget>(
  elementOrSelector: Element | string,
  target: T,
  options: AnimateOptions<AnimatedTargetValues<T>> = {}
): AnimateControls {
  const { delay = 0, onUpdate, onComplete, ...springConfig } = options

  // Resolve element
  const element = typeof elementOrSelector === 'string'
    ? document.querySelector(elementOrSelector)
    : elementOrSelector

  if (!element) {
    console.warn('animate: Element not found')
    return createNoopControls()
  }

  const springs = new Map<string, SpringValue | TimedValue>()
  const currentValues = new Map<string, number | string>()
  const transitions = new Map<string, { from: ParsedValue; to: ParsedValue }>()
  // Current keyframe target per property (used to resume after pause)
  const currentTargets = new Map<string, number>()
  // Spring velocities at pause(), restored by resume()
  const pausedVelocities = new Map<string, number>()
  // Properties taken over by a later animate() call on the same element
  const released = new Set<string>()
  const ownedBy = propertyOwners.get(element) ?? new Map<string, () => void>()
  propertyOwners.set(element, ownedBy)
  const releasers = new Map<string, () => void>()
  /** Give up ownership records this call still holds */
  const disown = (property: string) => {
    const release = releasers.get(property)
    if (release && ownedBy.get(property) === release) ownedBy.delete(property)
    releasers.delete(property)
  }
  let isRunning = true
  let isPaused = false
  let resolveFinished: () => void
  const waiters = new Set<() => void>()
  const wake = () => { for (const resolve of waiters) resolve(); waiters.clear() }
  const progress = new Map<string, number>()
  const segments = new Map<string, { from: number; to: number; index: number; total: number }>()
  // Cancels the pending start delay (loop-driven: follows the time scale)
  let cancelDelay: (() => void) | null = null

  const finished = new Promise<void>((resolve, _reject) => {
    resolveFinished = resolve
  })

  const startAnimation = () => {
    const entries = Object.entries(target)
    let completedCount = 0
    let completedNaturally = 0
    const totalAnimations = entries.length

    // Nothing to animate: complete immediately instead of never resolving
    if (totalAnimations === 0) {
      if (isRunning) {
        isRunning = false
        try {
          onComplete?.()
        } catch {
          // Ignore callback errors
        }
        resolveFinished()
      }
      return
    }

    const toNumber = (v: number | string) =>
      typeof v === 'string' ? parseFloat(v) || 0 : v

    entries.forEach(([property, value]) => {
      // `[from, ...rest]`: a multi-entry array starts at its first entry
      // (applied immediately) and springs through the rest
      const list: Array<number | string> = Array.isArray(value) ? value : [value]
      const hasFrom = list.length > 1
      const values = hasFrom ? list.slice(1) : list
      const rawStart = hasFrom ? list[0]! : typeof list[0] === 'string' ? String(readStyle(element, property)) : parseCurrentValue(element, property)
      const startValue = typeof rawStart === 'number' ? rawStart : 0

      // Create spring for this property
      const timed = (typeof options.duration === 'number' && Number.isFinite(options.duration)) || options.ease !== undefined
      const spring = timed
        ? createTweenValue(startValue, Math.max(0, Number.isFinite(options.duration) ? options.duration! : 300) / Math.max(1, values.length), options.ease)
        : createSpringValue(startValue, {
        stiffness: springConfig.stiffness ?? 100,
        damping: springConfig.damping ?? 10,
        mass: springConfig.mass ?? 1,
      })

      springs.set(property, spring)
      currentValues.set(property, rawStart)

      // Take the property over from an earlier call still animating it
      ownedBy.get(property)?.()
      const release = () => {
        released.add(property)
        releasers.delete(property)
        spring.stop()
        wake()
        currentValues.delete(property)
        currentTargets.delete(property)
      }
      releasers.set(property, release)
      ownedBy.set(property, release)

      // Subscribe to updates
      spring.subscribe((v) => {
        if (!isRunning || isPaused || released.has(property)) return
        const transition = transitions.get(property)
        const segment = segments.get(property)
        if (segment) {
          const fraction = segment.to === segment.from ? 1 : (v - segment.from) / (segment.to - segment.from)
          progress.set(property, (segment.index + Math.max(0, Math.min(1, fraction))) / segment.total)
        }
        const rendered = transition
          ? composeAnimatableValue(transition.to, transition.from.channels.map((from, i) => from + (transition.to.channels[i]! - from) * v))
          : typeof rawStart === 'string' && !currentTargets.has(property) ? rawStart : v
        currentValues.set(property, rendered)
        writeStyle(element, property, rendered)

        if (onUpdate) {
          const valuesObj: Record<string, number | string> = {}
          currentValues.forEach((val, key) => {
            valuesObj[key] = val
          })
          onUpdate(valuesObj as AnimatedTargetValues<T>)
        }
      })

      // Animate through keyframes sequentially
      const animateKeyframes = async () => {
        for (let index = 0; index < values.length; index++) {
          const targetValue = values[index]!
          // Early exit if stopped or taken over
          if (!isRunning || released.has(property)) break

          let numValue = toNumber(targetValue)
          if (typeof targetValue === 'string') {
            const from = parseAnimatableValue(currentValues.get(property) ?? rawStart)
            const to = parseAnimatableValue(targetValue)
            if (from.template.id !== to.template.id || to.template.size === 0) {
              currentValues.set(property, targetValue)
              writeStyle(element, property, targetValue)
              progress.set(property, (index + 1) / values.length)
              await Promise.resolve()
              continue
            }
            spring.jump(0)
            transitions.set(property, { from, to })
            numValue = 1
          } else {
            transitions.delete(property)
          }

          currentTargets.set(property, numValue)
          segments.set(property, { from: spring.get(), to: numValue, index, total: values.length })
          if (!isPaused) spring.set(numValue)
          else if ('pause' in spring && typeof spring.pause === 'function') {
            // A delayed timed driver can be created after pause() was called.
            // Initialize its run before pausing so resume() has a target/clock.
            spring.set(numValue)
            spring.pause()
          }
          // The value's own completion is authoritative. A pause settles the
          // halted run; wait for resume and then await the replacement run.
          while (isRunning && !released.has(property)) {
            if (isPaused) {
              await new Promise<void>(resolve => waiters.add(resolve))
            } else {
              await spring.finished
              if (!isPaused && !spring.isAnimating()) break
            }
          }
          progress.set(property, (index + 1) / values.length)

        }

        // Taken over by a later call: interrupted, not completed
        const superseded = released.has(property)
        disown(property)
        // A settled property must not be restarted by resume()
        currentTargets.delete(property)
        if (!superseded) completedNaturally++
        completedCount++
        if (completedCount === totalAnimations && isRunning) {
          isRunning = false
          try {
            // Like stop(), a call whose properties were all taken over does
            // not report completion (`finished` still settles)
            if (completedNaturally > 0) onComplete?.()
          } catch {
            // Ignore callback errors
          }
          resolveFinished()
        }
      }

      animateKeyframes()
    })
  }

  // Start with delay
  if (delay > 0) {
    cancelDelay = globalLoop.delay(delay, () => {
      cancelDelay = null
      startAnimation()
    })
  } else {
    startAnimation()
  }

  // Cleanup function to cancel all pending RAF and timeouts
  const cleanup = () => {
    wake()
    cancelDelay?.()
    cancelDelay = null
  }

  return {
    stop: () => {
      isRunning = false
      cleanup()
      for (const property of [...releasers.keys()]) disown(property)
      springs.forEach((spring) => spring.stop())
      resolveFinished()
    },
    pause: () => {
      if (!isRunning || isPaused) return
      isPaused = true
      // Halt the springs at their current position (SpringValue has no
      // pause), remembering their velocity for resume()
      springs.forEach((spring, property) => {
        pausedVelocities.set(property, spring.getVelocity())
        if ('pause' in spring) spring.pause()
        else spring.stop()
      })
    },
    resume: () => {
      if (!isPaused) return
      isPaused = false
      if (!isRunning) return
      // Continue toward the current keyframe target from where we halted,
      // with the velocity it had
      currentTargets.forEach((value, property) => {
        const spring = springs.get(property)
        if (spring && 'resume' in spring) spring.resume()
        else spring?.set(value, { velocity: pausedVelocities.get(property) ?? 0 })
      })
      pausedVelocities.clear()
      wake()
    },
    getProgress: () => {
      if (!isRunning) return 1
      const keys = Object.keys(target)
      return keys.length ? keys.reduce((sum, key) => sum + (progress.get(key) ?? 0), 0) / keys.length : 1
    },
    isAnimating: () => isRunning && !isPaused,
    finished,
  }
}

function createNoopControls(): AnimateControls {
  return {
    stop: () => {},
    pause: () => {},
    resume: () => {},
    getProgress: () => 1,
    isAnimating: () => false,
    finished: Promise.resolve(),
  }
}

/**
 * Animate multiple elements with staggered timing
 *
 * @example
 * ```ts
 * import { animateAll } from '@oxog/springkit'
 *
 * animateAll('.item', { opacity: 1, y: 0 }, {
 *   stagger: 50,
 *   stiffness: 200,
 * })
 * ```
 */
export function animateAll<T extends AnimateTarget>(
  selector: string,
  target: T,
  options: AnimateOptions<AnimatedTargetValues<T>> & { stagger?: number } = {}
): AnimateControls[] {
  const { stagger = 0, ...animateOptions } = options
  const elements = document.querySelectorAll(selector)

  return Array.from(elements).map((element, index) => {
    return animate(element, target, {
      ...animateOptions,
      delay: (animateOptions.delay ?? 0) + (stagger * index),
    })
  })
}
