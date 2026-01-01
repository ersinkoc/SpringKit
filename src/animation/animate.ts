/**
 * Imperative animate function for direct element animation
 *
 * Similar to Framer Motion's animate() function - allows animating elements
 * without React hooks.
 */

import { createSpringValue, type SpringValue } from '../core/spring-value.js'

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
  /** Delay before animation starts (ms) */
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

  const rotate = values.get('rotate') ?? values.get('rotateZ')
  const rotateX = values.get('rotateX')
  const rotateY = values.get('rotateY')

  if (rotateX !== undefined) parts.push(`rotateX(${rotateX}deg)`)
  if (rotateY !== undefined) parts.push(`rotateY(${rotateY}deg)`)
  if (rotate !== undefined) parts.push(`rotate(${rotate}deg)`)

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
    el.style.transform = buildTransform(transformValues)
  }

  Object.entries(styleValues).forEach(([prop, val]) => {
    el.style.setProperty(prop, val)
  })
}

function parseCurrentValue(element: Element, property: string): number {
  const el = element as HTMLElement
  const computed = getComputedStyle(el)

  if (property === 'opacity') {
    return parseFloat(computed.opacity) || 1
  }

  if (transformProperties.has(property)) {
    // Parse from transform matrix - simplified, return 0 as default
    const transform = computed.transform
    if (transform === 'none') {
      if (property === 'scale' || property === 'scaleX' || property === 'scaleY') {
        return 1
      }
      return 0
    }
    // For complex parsing, return sensible defaults
    if (property === 'scale' || property === 'scaleX' || property === 'scaleY') {
      return 1
    }
    return 0
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
  let isRunning = true
  let isPaused = false
  let resolveFinished: () => void
  // Track RAF IDs and timeout IDs separately for proper cleanup
  const rafIds = new Set<number>()
  const timeoutIds = new Set<ReturnType<typeof setTimeout>>()
  let delayTimeoutId: ReturnType<typeof setTimeout> | null = null

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

    entries.forEach(([property, value]) => {
      const values = Array.isArray(value) ? value : [value]
      const startValue = parseCurrentValue(element, property)

      // Create spring for this property
      const spring = createSpringValue(startValue, {
        stiffness: springConfig.stiffness ?? 100,
        damping: springConfig.damping ?? 10,
        mass: springConfig.mass ?? 1,
      })

      springs.set(property, spring)
      currentValues.set(property, startValue)

      // Subscribe to updates
      spring.subscribe((v) => {
        if (!isRunning || isPaused) return
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
          // Early exit if stopped
          if (!isRunning) break

          const numValue = typeof targetValue === 'string'
            ? parseFloat(targetValue) || 0
            : targetValue

          await new Promise<void>((resolve) => {
            spring.set(numValue)

            const checkDone = () => {
              // If stopped or animation complete, resolve and cleanup
              if (!isRunning || !spring.isAnimating()) {
                resolve()
              } else if (!isPaused) {
                const rafId = requestAnimationFrame(checkDone)
                rafIds.add(rafId)
              } else {
                // If paused, schedule check later instead of RAF loop
                const timeoutId = setTimeout(() => {
                  timeoutIds.delete(timeoutId)
                  checkDone()
                }, 100)
                timeoutIds.add(timeoutId)
              }
            }
            // Initial check after one frame
            const initialRafId = requestAnimationFrame(checkDone)
            rafIds.add(initialRafId)
          })
        }

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
    delayTimeoutId = setTimeout(startAnimation, delay)
  } else {
    startAnimation()
  }

  // Cleanup function to cancel all pending RAF and timeouts
  const cleanup = () => {
    rafIds.forEach((id) => {
      cancelAnimationFrame(id)
    })
    rafIds.clear()
    timeoutIds.forEach((id) => {
      clearTimeout(id)
    })
    timeoutIds.clear()
    if (delayTimeoutId !== null) {
      clearTimeout(delayTimeoutId)
      delayTimeoutId = null
    }
  }

  return {
    stop: () => {
      isRunning = false
      cleanup()
      springs.forEach((spring) => spring.stop())
      resolveFinished()
    },
    pause: () => {
      isPaused = true
      // Note: SpringValue doesn't have pause, we just set flag to skip updates
    },
    resume: () => {
      isPaused = false
      // Resume by allowing updates to continue
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
