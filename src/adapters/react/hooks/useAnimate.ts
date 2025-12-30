import { useRef, useCallback, useEffect } from 'react'
import { createSpringValue } from '../../../core/spring-value.js'
import type { SpringConfig } from '../../../types.js'

/**
 * Animation target - either a CSS property object or a keyframe array
 */
export interface AnimationTarget {
  [property: string]: number | number[]
}

/**
 * Animation options for useAnimate
 */
export interface AnimateOptions {
  /** Spring configuration */
  config?: SpringConfig
  /** Delay before animation starts (ms) */
  delay?: number
  /** Callback when animation completes */
  onComplete?: () => void
}

/**
 * Animate function returned by useAnimate
 */
export type AnimateFunction = (
  target: AnimationTarget,
  options?: AnimateOptions
) => Promise<void>

/**
 * Animation controls for managing animations
 */
export interface AnimationControls {
  /** Stop all running animations */
  stop: () => void
  /** Get current value of a property */
  get: (property: string) => number | undefined
  /** Check if any animation is running */
  isAnimating: () => boolean
}

/**
 * Return type of useAnimate hook
 */
export type UseAnimateReturn = [
  React.RefObject<HTMLElement | null>,
  AnimateFunction,
  AnimationControls
]

/**
 * Imperative animation hook for programmatic control.
 * Returns a ref to attach to elements and an animate function.
 *
 * @example Basic usage
 * ```tsx
 * function Component() {
 *   const [scope, animate, controls] = useAnimate()
 *
 *   const handleClick = async () => {
 *     await animate({ opacity: 1, x: 100 })
 *     await animate({ scale: 1.2 })
 *     await animate({ scale: 1, opacity: 0.5 })
 *   }
 *
 *   return (
 *     <div ref={scope} onClick={handleClick}>
 *       Animate me
 *     </div>
 *   )
 * }
 * ```
 *
 * @example With options
 * ```tsx
 * const [scope, animate] = useAnimate()
 *
 * await animate(
 *   { x: 200, rotation: 45 },
 *   { config: { stiffness: 300, damping: 20 }, delay: 100 }
 * )
 * ```
 *
 * @example Keyframe animation
 * ```tsx
 * const [scope, animate] = useAnimate()
 *
 * // Animate through multiple values
 * await animate({ opacity: [0, 1, 0.5, 1] })
 * ```
 */
export function useAnimate(): UseAnimateReturn {
  const scopeRef = useRef<HTMLElement | null>(null)
  const springsRef = useRef<Map<string, ReturnType<typeof createSpringValue>>>(new Map())
  const valuesRef = useRef<Map<string, number>>(new Map())
  const isAnimatingRef = useRef(false)
  const cleanupRef = useRef<(() => void)[]>([])

  // Map CSS property names to transform functions
  const getPropertyStyle = useCallback((property: string, value: number): string | null => {
    const transforms = ['x', 'y', 'z', 'scale', 'scaleX', 'scaleY', 'rotate', 'rotateX', 'rotateY', 'rotateZ']

    if (transforms.includes(property)) {
      return null // Handle transforms separately
    }

    return null // Direct style property
  }, [])

  const applyStyles = useCallback(() => {
    const element = scopeRef.current
    if (!element) return

    const transforms: string[] = []
    const styles: Record<string, string> = {}

    valuesRef.current.forEach((value, property) => {
      switch (property) {
        case 'x':
          transforms.push(`translateX(${value}px)`)
          break
        case 'y':
          transforms.push(`translateY(${value}px)`)
          break
        case 'z':
          transforms.push(`translateZ(${value}px)`)
          break
        case 'scale':
          transforms.push(`scale(${value})`)
          break
        case 'scaleX':
          transforms.push(`scaleX(${value})`)
          break
        case 'scaleY':
          transforms.push(`scaleY(${value})`)
          break
        case 'rotate':
        case 'rotateZ':
          transforms.push(`rotate(${value}deg)`)
          break
        case 'rotateX':
          transforms.push(`rotateX(${value}deg)`)
          break
        case 'rotateY':
          transforms.push(`rotateY(${value}deg)`)
          break
        case 'opacity':
          styles.opacity = String(value)
          break
        default:
          // Assume pixel values for other properties
          styles[property] = `${value}px`
      }
    })

    if (transforms.length > 0) {
      element.style.transform = transforms.join(' ')
    }

    Object.entries(styles).forEach(([prop, val]) => {
      element.style.setProperty(prop, val)
    })
  }, [])

  const animate: AnimateFunction = useCallback(async (target, options = {}) => {
    const { config = {}, delay = 0, onComplete } = options

    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay))
    }

    isAnimatingRef.current = true

    const promises: Promise<void>[] = []

    for (const [property, value] of Object.entries(target)) {
      const targetValues = Array.isArray(value) ? value : [value]
      const currentValue = valuesRef.current.get(property) ?? 0

      // Animate through each value in sequence
      let animationPromise = Promise.resolve()

      for (const targetValue of targetValues) {
        animationPromise = animationPromise.then(() => {
          return new Promise<void>((resolve) => {
            // Get or create spring for this property
            let spring = springsRef.current.get(property)

            if (!spring) {
              spring = createSpringValue(valuesRef.current.get(property) ?? 0, config)
              springsRef.current.set(property, spring)

              const unsubscribe = spring.subscribe((v) => {
                valuesRef.current.set(property, v)
                applyStyles()
              })

              cleanupRef.current.push(unsubscribe)
            }

            // Update config if provided
            if (config.stiffness || config.damping || config.mass) {
              spring.setConfig(config)
            }

            spring.set(targetValue)

            // Wait for animation to complete
            const checkComplete = () => {
              if (spring && !spring.isAnimating()) {
                resolve()
              } else {
                requestAnimationFrame(checkComplete)
              }
            }

            setTimeout(checkComplete, 16)
          })
        })
      }

      promises.push(animationPromise)
    }

    await Promise.all(promises)

    isAnimatingRef.current = false
    onComplete?.()
  }, [applyStyles])

  const controls: AnimationControls = {
    stop: useCallback(() => {
      springsRef.current.forEach((spring) => {
        spring.stop()
      })
      isAnimatingRef.current = false
    }, []),

    get: useCallback((property: string) => {
      return valuesRef.current.get(property)
    }, []),

    isAnimating: useCallback(() => {
      return isAnimatingRef.current
    }, []),
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRef.current.forEach((cleanup) => cleanup())
      springsRef.current.forEach((spring) => spring.destroy())
      springsRef.current.clear()
    }
  }, [])

  return [scopeRef, animate, controls]
}
