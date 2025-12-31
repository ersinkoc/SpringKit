/**
 * React hooks for scroll-linked animations
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import {
  createScrollProgress,
  createParallax,
  createScrollTrigger,
  createScrollLinkedValue,
  type ScrollInfo,
  type ScrollProgress,
  type ParallaxConfig,
  type ScrollTriggerConfig,
  type ScrollLinkedConfig,
} from '../../../index.js'
import { useIsomorphicLayoutEffect } from '../utils/ssr.js'

// ============ useScrollProgress ============

export interface UseScrollProgressOptions {
  /** Target element ref (uses page scroll if not provided) */
  target?: React.RefObject<HTMLElement>
  /** Scroll offset configuration */
  offset?: ['start' | 'center' | 'end', 'start' | 'center' | 'end']
  /** Smoothing factor (0-1, higher = smoother) */
  smooth?: number
}

export interface UseScrollProgressReturn {
  /** Current scroll progress (0-1) */
  progress: number
  /** Full scroll info object */
  info: ScrollInfo
  /** The scroll progress controller */
  scrollProgress: ScrollProgress | null
}

/**
 * Track scroll progress for an element or the page
 *
 * @example
 * ```tsx
 * function ScrollIndicator() {
 *   const { progress } = useScrollProgress()
 *   return <div style={{ width: `${progress * 100}%` }} />
 * }
 *
 * function SectionProgress() {
 *   const ref = useRef<HTMLDivElement>(null)
 *   const { progress } = useScrollProgress({ target: ref })
 *   return <div ref={ref}>{Math.round(progress * 100)}%</div>
 * }
 * ```
 */
export function useScrollProgress(
  options: UseScrollProgressOptions = {}
): UseScrollProgressReturn {
  const { target, offset, smooth } = options

  const [progress, setProgress] = useState(0)
  const [info, setInfo] = useState<ScrollInfo>({
    progress: 0,
    scrollY: 0,
    velocity: 0,
    direction: 0,
    isInView: true,
    visibleRatio: 1,
  })
  const scrollProgressRef = useRef<ScrollProgress | null>(null)

  useIsomorphicLayoutEffect(() => {
    const element = target?.current ?? null
    const scrollProgress = createScrollProgress(element, { offset, smooth })
    scrollProgressRef.current = scrollProgress

    const unsubscribe = scrollProgress.subscribe((scrollInfo) => {
      setProgress(scrollInfo.progress)
      setInfo(scrollInfo)
    })

    return () => {
      unsubscribe()
      scrollProgress.destroy()
    }
  }, [target?.current, offset?.[0], offset?.[1], smooth])

  return {
    progress,
    info,
    scrollProgress: scrollProgressRef.current,
  }
}

// ============ useParallax ============

export interface UseParallaxOptions extends Omit<ParallaxConfig, 'easing'> {
  /** Easing function */
  easing?: (t: number) => number
}

export interface UseParallaxReturn {
  /** Ref to attach to the element */
  ref: React.RefObject<HTMLElement>
  /** Current offset value */
  offset: number
}

/**
 * Create a parallax effect for an element
 *
 * @example
 * ```tsx
 * function ParallaxImage() {
 *   const { ref } = useParallax({ speed: 0.5 })
 *   return <img ref={ref} src="..." />
 * }
 * ```
 */
export function useParallax(
  options: UseParallaxOptions = {}
): UseParallaxReturn {
  const ref = useRef<HTMLElement>(null)
  const [offset, setOffset] = useState(0)

  useIsomorphicLayoutEffect(() => {
    if (!ref.current) return

    const parallax = createParallax(ref.current, options)

    // Update offset periodically
    const intervalId = setInterval(() => {
      setOffset(parallax.getOffset())
    }, 16) // ~60fps

    return () => {
      clearInterval(intervalId)
      parallax.destroy()
    }
  }, [options.speed, options.direction, options.rootMargin])

  return { ref: ref as React.RefObject<HTMLElement>, offset }
}

// ============ useScrollTrigger ============

export interface UseScrollTriggerOptions
  extends Omit<ScrollTriggerConfig, 'onEnter' | 'onLeave' | 'onProgress'> {}

export interface UseScrollTriggerReturn {
  /** Ref to attach to the element */
  ref: React.RefObject<HTMLElement>
  /** Whether the trigger is currently active */
  isActive: boolean
  /** Current progress within the trigger range */
  progress: number
  /** Whether element has entered the trigger zone */
  hasEntered: boolean
}

/**
 * Create a scroll trigger for animations
 *
 * @example
 * ```tsx
 * function FadeInSection() {
 *   const { ref, isActive, progress } = useScrollTrigger({
 *     start: 'top',
 *     end: 'center',
 *   })
 *
 *   return (
 *     <div ref={ref} style={{ opacity: progress }}>
 *       Content fades in as you scroll
 *     </div>
 *   )
 * }
 * ```
 */
export function useScrollTrigger(
  options: UseScrollTriggerOptions = {}
): UseScrollTriggerReturn {
  const ref = useRef<HTMLElement>(null)
  const [isActive, setIsActive] = useState(false)
  const [progress, setProgress] = useState(0)
  const [hasEntered, setHasEntered] = useState(false)

  useIsomorphicLayoutEffect(() => {
    if (!ref.current) return

    const trigger = createScrollTrigger(ref.current, {
      ...options,
      onEnter: () => setHasEntered(true),
      onProgress: (info) => {
        setIsActive(info.progress > 0 && info.progress < 1)
        setProgress(info.progress)
      },
    })

    return () => trigger.destroy()
  }, [
    options.start,
    options.end,
    options.startOffset,
    options.endOffset,
    options.once,
    options.scrub,
  ])

  return { ref: ref as React.RefObject<HTMLElement>, isActive, progress, hasEntered }
}

// ============ useScrollLinkedValue ============

export interface UseScrollLinkedValueOptions extends ScrollLinkedConfig {}

/**
 * Create a scroll-linked interpolated value
 *
 * @example
 * ```tsx
 * function ColorTransition() {
 *   const { progress } = useScrollProgress()
 *   const color = useScrollLinkedValue(progress, {
 *     inputRange: [0, 0.5, 1],
 *     outputRange: ['#ff0000', '#00ff00', '#0000ff'],
 *   })
 *
 *   return <div style={{ backgroundColor: color }}>...</div>
 * }
 * ```
 */
export function useScrollLinkedValue(
  scrollProgress: ScrollProgress | null,
  config: UseScrollLinkedValueOptions
): number | string {
  const [value, setValue] = useState<number | string>(config.outputRange[0] ?? 0)

  useIsomorphicLayoutEffect(() => {
    if (!scrollProgress) return

    const linkedValue = createScrollLinkedValue(scrollProgress, config)

    const unsubscribe = linkedValue.subscribe((newValue) => {
      setValue(newValue)
    })

    return () => {
      unsubscribe()
      linkedValue.destroy()
    }
  }, [scrollProgress, config.inputRange, config.outputRange, config.clamp, config.smooth])

  return value
}
