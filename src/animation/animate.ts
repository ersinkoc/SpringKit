/**
 * Imperative animate function for direct element animation
 *
 * Similar to Framer Motion's animate() function - allows animating elements
 * without React hooks.
 */

import { createSpringValue, type SpringValue } from '../core/spring-value.js'
import { globalLoop } from './loop.js'

export interface AnimateTarget {
  [property: string]: number | string | number[] | string[]
}

export interface AnimateOptions {
  /** Spring stiffness */
  stiffness?: number
  /** Spring damping */
  damping?: number
  /** Spring mass */
  mass?: number
  /** Delay before animation starts (ms of animation time: follows the time scale) */
  delay?: number
  /** Duration hint for non-spring animations */
  duration?: number
  /** Ease function for non-spring animations */
  ease?: (t: number) => number
  /** Called on each frame with current values */
  onUpdate?: (values: Record<string, number>) => void
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

// Transform properties that should be combined
const transformProperties = new Set([
  'x', 'y', 'z',
  'scale', 'scaleX', 'scaleY', 'scaleZ',
  'rotate', 'rotateX', 'rotateY', 'rotateZ',
  'skew', 'skewX', 'skewY',
])

// Properties that need 'px' suffix
const pxProperties = new Set([
  'x', 'y', 'z',
  'width', 'height',
  'top', 'right', 'bottom', 'left',
  'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  'borderWidth', 'borderRadius',
  'fontSize', 'letterSpacing', 'lineHeight',
])

/**
 * Last applied transform values per element. CSS transforms are a single
 * property, so without this a second animate() call (e.g. { scale }) would
 * wipe transforms set by a previous one (e.g. { x }), and transform
 * properties would always restart from their default instead of their
 * current value (the computed matrix is not parsed).
 */
const elementTransforms = new WeakMap<Element, Map<string, number>>()

/**
 * Per element: property -> releases it from the animate() call currently
 * animating it. The latest call owns a property; otherwise an earlier call
 * still in flight would keep writing it and, if it settled last, win.
 */
const propertyOwners = new WeakMap<Element, Map<string, () => void>>()

function buildTransform(values: Map<string, number>): string {
  const parts: string[] = []

  const x = values.get('x')
  const y = values.get('y')
  const z = values.get('z')

  if (x !== undefined || y !== undefined || z !== undefined) {
    parts.push(`translate3d(${x ?? 0}px, ${y ?? 0}px, ${z ?? 0}px)`)
  }

  const scale = values.get('scale')
  const scaleX = values.get('scaleX')
  const scaleY = values.get('scaleY')

  if (scale !== undefined) {
    parts.push(`scale(${scale})`)
  } else if (scaleX !== undefined || scaleY !== undefined) {
    parts.push(`scale(${scaleX ?? 1}, ${scaleY ?? 1})`)
  }
  const scaleZ = values.get('scaleZ')
  if (scaleZ !== undefined) parts.push(`scaleZ(${scaleZ})`)

  const rotate = values.get('rotate') ?? values.get('rotateZ')
  const rotateX = values.get('rotateX')
  const rotateY = values.get('rotateY')

  if (rotateX !== undefined) parts.push(`rotateX(${rotateX}deg)`)
  if (rotateY !== undefined) parts.push(`rotateY(${rotateY}deg)`)
  if (rotate !== undefined) parts.push(`rotate(${rotate}deg)`)

  const skew = values.get('skew')
  if (skew !== undefined) parts.push(`skew(${skew}deg)`)
  const skewX = values.get('skewX')
  const skewY = values.get('skewY')
  if (skewX !== undefined || skewY !== undefined) {
    parts.push(`skew(${skewX ?? 0}deg, ${skewY ?? 0}deg)`)
  }

  return parts.join(' ')
}

function applyStylesToElement(element: Element, values: Map<string, number>): void {
  const el = element as HTMLElement
  const transformValues = new Map<string, number>()
  const styleValues: Record<string, string> = {}

  values.forEach((value, property) => {
    if (transformProperties.has(property)) {
      transformValues.set(property, value)
    } else if (property === 'opacity') {
      styleValues.opacity = String(value)
    } else if (pxProperties.has(property)) {
      styleValues[property] = `${value}px`
    } else {
      styleValues[property] = String(value)
    }
  })

  if (transformValues.size > 0) {
    let stored = elementTransforms.get(element)
    if (!stored) {
      stored = new Map()
      elementTransforms.set(element, stored)
    }
    transformValues.forEach((value, property) => stored!.set(property, value))
    el.style.transform = buildTransform(stored)
  }

  Object.entries(styleValues).forEach(([prop, val]) => {
    el.style.setProperty(prop, val)
  })
}

function parseCurrentValue(element: Element, property: string): number {
  const el = element as HTMLElement
  const computed = getComputedStyle(el)

  if (property === 'opacity') {
    // Note: `|| 1` would turn a legitimate opacity of 0 into 1
    const opacity = parseFloat(computed.opacity)
    return Number.isNaN(opacity) ? 1 : opacity
  }

  if (transformProperties.has(property)) {
    // Prefer the value last applied by animate() on this element
    const stored = elementTransforms.get(element)?.get(property)
    if (stored !== undefined) {
      return stored
    }
    // The computed matrix isn't parsed: start from the identity value
    return property.startsWith('scale') ? 1 : 0
  }

  const value = computed.getPropertyValue(property)
  return parseFloat(value) || 0
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
export function animate(
  elementOrSelector: Element | string,
  target: AnimateTarget,
  options: AnimateOptions = {}
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

  const springs = new Map<string, SpringValue>()
  const currentValues = new Map<string, number>()
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
  // Track RAF IDs for proper cleanup
  const rafIds = new Set<number>()
  // Cancels the pending start delay (loop-driven: follows the time scale)
  let cancelDelay: (() => void) | null = null

  const finished = new Promise<void>((resolve, _reject) => {
    resolveFinished = resolve
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const checkAllComplete = () => {
    let allComplete = true
    springs.forEach((spring) => {
      if (spring.isAnimating()) {
        allComplete = false
      }
    })
    return allComplete
  }

  const startAnimation = () => {
    const entries = Object.entries(target)
    let completedCount = 0
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
      const startValue = hasFrom
        ? toNumber(list[0]!)
        : parseCurrentValue(element, property)

      // Create spring for this property
      const spring = createSpringValue(startValue, {
        stiffness: springConfig.stiffness ?? 100,
        damping: springConfig.damping ?? 10,
        mass: springConfig.mass ?? 1,
      })

      springs.set(property, spring)
      currentValues.set(property, startValue)

      // Take the property over from an earlier call still animating it
      ownedBy.get(property)?.()
      const release = () => {
        released.add(property)
        releasers.delete(property)
        spring.stop()
        currentValues.delete(property)
        currentTargets.delete(property)
      }
      releasers.set(property, release)
      ownedBy.set(property, release)

      // Subscribe to updates
      spring.subscribe((v) => {
        if (!isRunning || isPaused || released.has(property)) return
        currentValues.set(property, v)
        applyStylesToElement(element, currentValues)

        if (onUpdate) {
          const valuesObj: Record<string, number> = {}
          currentValues.forEach((val, key) => {
            valuesObj[key] = val
          })
          onUpdate(valuesObj)
        }
      })

      // Animate through keyframes sequentially
      const animateKeyframes = async () => {
        for (const targetValue of values) {
          // Early exit if stopped or taken over
          if (!isRunning || released.has(property)) break

          const numValue = toNumber(targetValue)

          await new Promise<void>((resolve) => {
            currentTargets.set(property, numValue)
            // If paused, resume() will start the spring toward this target
            if (!isPaused) {
              spring.set(numValue)
            }

            let checkId: number | null = null
            const checkDone = () => {
              // Clear previous ID from tracking
              if (checkId !== null) {
                rafIds.delete(checkId)
              }

              // Stopped: resolve and cleanup. While paused the spring is
              // halted, so don't mistake "not animating" for "done".
              if (
                !isRunning ||
                released.has(property) ||
                (!isPaused && !spring.isAnimating())
              ) {
                resolve()
              } else {
                checkId = requestAnimationFrame(checkDone)
                rafIds.add(checkId)
              }
            }
            // Initial check after one frame
            checkId = requestAnimationFrame(checkDone)
            rafIds.add(checkId)
          })
        }

        disown(property)
        completedCount++
        if (completedCount === totalAnimations && isRunning) {
          isRunning = false
          try {
            onComplete?.()
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
    rafIds.forEach((id) => {
      cancelAnimationFrame(id)
    })
    rafIds.clear()
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
        spring.stop()
      })
    },
    resume: () => {
      if (!isPaused) return
      isPaused = false
      if (!isRunning) return
      // Continue toward the current keyframe target from where we halted,
      // with the velocity it had
      currentTargets.forEach((value, property) => {
        springs.get(property)?.set(value, { velocity: pausedVelocities.get(property) ?? 0 })
      })
      pausedVelocities.clear()
    },
    getProgress: () => {
      // Simplified progress calculation
      let totalProgress = 0
      let count = 0
      springs.forEach((spring) => {
        totalProgress += spring.isAnimating() ? 0.5 : 1
        count++
      })
      return count > 0 ? totalProgress / count : 1
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
export function animateAll(
  selector: string,
  target: AnimateTarget,
  options: AnimateOptions & { stagger?: number } = {}
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
