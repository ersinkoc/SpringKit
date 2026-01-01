/**
 * Scroll-linked animations - Bind animations directly to scroll position
 *
 * Unlike spring-based scroll animations, these animations are directly
 * tied to scroll progress (0-1) for precise control.
 */

import { clamp, lerp } from '../utils/math.js'
import { parseColor, rgbToHex } from '../utils/color.js'

/**
 * Simple color lerp for scroll-linked animations
 */
function lerpColor(colorA: string, colorB: string, t: number): string {
  const a = parseColor(colorA)
  const b = parseColor(colorB)
  return rgbToHex(
    Math.round(lerp(a.r, b.r, t)),
    Math.round(lerp(a.g, b.g, t)),
    Math.round(lerp(a.b, b.b, t))
  )
}

/**
 * Scroll progress info passed to callbacks
 */
export interface ScrollInfo {
  /** Progress from 0 to 1 */
  progress: number
  /** Absolute scroll position in pixels */
  scrollY: number
  /** Scroll velocity in pixels per second */
  velocity: number
  /** Scroll direction: 1 = down, -1 = up, 0 = stationary */
  direction: -1 | 0 | 1
  /** Whether element is in viewport */
  isInView: boolean
  /** How much of the element is visible (0-1) */
  visibleRatio: number
}

/**
 * Scroll trigger configuration
 */
export interface ScrollTriggerConfig {
  /** Start trigger position: 'top', 'center', 'bottom', or pixel value */
  start?: 'top' | 'center' | 'bottom' | number
  /** End trigger position: 'top', 'center', 'bottom', or pixel value */
  end?: 'top' | 'center' | 'bottom' | number
  /** Offset from start position in pixels */
  startOffset?: number
  /** Offset from end position in pixels */
  endOffset?: number
  /** Callback when entering viewport */
  onEnter?: (info: ScrollInfo) => void
  /** Callback when leaving viewport */
  onLeave?: (info: ScrollInfo) => void
  /** Callback on progress update */
  onProgress?: (info: ScrollInfo) => void
  /** Only trigger once */
  once?: boolean
  /** Scrub animation to scroll (true = instant, number = smoothing factor) */
  scrub?: boolean | number
}

/**
 * Parallax configuration
 */
export interface ParallaxConfig {
  /** Speed multiplier (negative = opposite direction) */
  speed?: number
  /** Direction of parallax effect */
  direction?: 'vertical' | 'horizontal'
  /** Easing function */
  easing?: (t: number) => number
  /** Root margin for intersection observer */
  rootMargin?: string
}

/**
 * Scroll-linked value configuration
 */
export interface ScrollLinkedConfig {
  /** Input range (scroll positions or progress values) */
  inputRange: number[]
  /** Output range (values to interpolate between) */
  outputRange: (number | string)[]
  /** Clamp output to range */
  clamp?: boolean
  /** Use smooth interpolation */
  smooth?: number
  /** Easing function */
  easing?: (t: number) => number
}

/**
 * Scroll progress tracker
 */
export interface ScrollProgress {
  /** Get current progress (0-1) */
  get(): number
  /** Get current scroll info */
  getInfo(): ScrollInfo
  /** Subscribe to progress changes */
  subscribe(callback: (info: ScrollInfo) => void): () => void
  /** Destroy and cleanup */
  destroy(): void
}

/**
 * Parallax controller
 */
export interface Parallax {
  /** Get current offset */
  getOffset(): number
  /** Update parallax (call on scroll) */
  update(): void
  /** Destroy and cleanup */
  destroy(): void
}

/**
 * Scroll trigger controller
 */
export interface ScrollTrigger {
  /** Check if currently active */
  isActive(): boolean
  /** Get current progress within trigger range */
  getProgress(): number
  /** Refresh trigger calculations */
  refresh(): void
  /** Destroy and cleanup */
  destroy(): void
}

/**
 * Scroll-linked value controller
 */
export interface ScrollLinkedValue {
  /** Get current interpolated value */
  get(): number | string
  /** Subscribe to value changes */
  subscribe(callback: (value: number | string) => void): () => void
  /** Destroy and cleanup */
  destroy(): void
}

// ============ Implementation ============

/**
 * Create scroll progress tracker for an element
 */
export function createScrollProgress(
  element?: HTMLElement | null,
  options: {
    offset?: ['start' | 'center' | 'end', 'start' | 'center' | 'end']
    smooth?: number
  } = {}
): ScrollProgress {
  const { offset = ['start', 'end'], smooth = 0 } = options

  let progress = 0
  let smoothedProgress = 0
  let lastScrollY = 0
  let lastTime = performance.now()
  let velocity = 0
  let direction: -1 | 0 | 1 = 0
  let rafId: number | null = null
  const subscribers = new Set<(info: ScrollInfo) => void>()

  const calculateProgress = (): ScrollInfo => {
    const scrollY = window.scrollY
    const windowHeight = window.innerHeight
    const now = performance.now()
    const dt = Math.max(now - lastTime, 1)

    // Calculate velocity and direction
    velocity = ((scrollY - lastScrollY) / dt) * 1000
    direction = scrollY > lastScrollY ? 1 : scrollY < lastScrollY ? -1 : 0
    lastScrollY = scrollY
    lastTime = now

    let newProgress: number
    let isInView = true
    let visibleRatio = 1

    if (element) {
      const rect = element.getBoundingClientRect()
      const elementTop = rect.top + scrollY
      const elementHeight = rect.height

      // Calculate start and end points based on offset
      const startPoint = offset[0] === 'start' ? elementTop :
                        offset[0] === 'center' ? elementTop + elementHeight / 2 :
                        elementTop + elementHeight

      const endPoint = offset[1] === 'start' ? windowHeight :
                      offset[1] === 'center' ? windowHeight / 2 :
                      0

      const scrollStart = startPoint - windowHeight
      const scrollEnd = startPoint - endPoint

      newProgress = clamp((scrollY - scrollStart) / (scrollEnd - scrollStart), 0, 1)

      // Check if in view
      isInView = rect.top < windowHeight && rect.bottom > 0
      visibleRatio = isInView ?
        clamp((Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0)) / rect.height, 0, 1) : 0
    } else {
      // Track overall page scroll
      const documentHeight = document.documentElement.scrollHeight - windowHeight
      newProgress = documentHeight > 0 ? clamp(scrollY / documentHeight, 0, 1) : 0
    }

    // Apply smoothing
    if (smooth > 0) {
      smoothedProgress = lerp(smoothedProgress, newProgress, 1 - smooth)
      progress = smoothedProgress
    } else {
      progress = newProgress
    }

    return {
      progress,
      scrollY,
      velocity,
      direction,
      isInView,
      visibleRatio,
    }
  }

  const notify = (info: ScrollInfo) => {
    subscribers.forEach(cb => cb(info))
  }

  const onScroll = () => {
    if (rafId) return
    rafId = requestAnimationFrame(() => {
      rafId = null
      const info = calculateProgress()
      notify(info)
    })
  }

  // Initial calculation
  const initialInfo = calculateProgress()

  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })

  return {
    get: () => progress,
    getInfo: () => calculateProgress(),
    subscribe: (callback) => {
      subscribers.add(callback)
      callback(initialInfo)
      return () => subscribers.delete(callback)
    },
    destroy: () => {
      if (rafId) cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      subscribers.clear()
    },
  }
}

/**
 * Create parallax effect for an element
 *
 * @example
 * ```ts
 * const parallax = createParallax(element, { speed: 0.5 })
 * // Element moves at 50% scroll speed
 * ```
 */
export function createParallax(
  element: HTMLElement,
  config: ParallaxConfig = {}
): Parallax {
  const {
    speed = 0.5,
    direction = 'vertical',
    easing = (t: number) => t,
    rootMargin = '0px',
  } = config

  let offset = 0
  let isInView = false
  let observer: IntersectionObserver | null = null

  const update = () => {
    if (!isInView) return

    const rect = element.getBoundingClientRect()
    const windowHeight = window.innerHeight

    // Calculate how far through the viewport the element is
    const elementCenter = rect.top + rect.height / 2
    const viewportCenter = windowHeight / 2
    const distanceFromCenter = elementCenter - viewportCenter

    // Apply speed and easing
    const normalizedDistance = distanceFromCenter / windowHeight
    const easedDistance = easing(Math.abs(normalizedDistance)) * Math.sign(normalizedDistance)
    offset = easedDistance * speed * 100

    // Apply transform
    if (direction === 'vertical') {
      element.style.transform = `translate3d(0, ${offset}px, 0)`
    } else {
      element.style.transform = `translate3d(${offset}px, 0, 0)`
    }
  }

  // Use IntersectionObserver for performance
  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (entry) {
        isInView = entry.isIntersecting
        if (isInView) update()
      }
    },
    { rootMargin }
  )
  observer.observe(element)

  const onScroll = () => {
    if (isInView) {
      requestAnimationFrame(update)
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true })

  return {
    getOffset: () => offset,
    update,
    destroy: () => {
      observer?.disconnect()
      window.removeEventListener('scroll', onScroll)
      element.style.transform = ''
    },
  }
}

/**
 * Create scroll trigger for precise scroll-based animations
 *
 * @example
 * ```ts
 * const trigger = createScrollTrigger(element, {
 *   start: 'top',
 *   end: 'bottom',
 *   onProgress: (info) => {
 *     element.style.opacity = String(info.progress)
 *   },
 * })
 * ```
 */
export function createScrollTrigger(
  element: HTMLElement,
  config: ScrollTriggerConfig = {}
): ScrollTrigger {
  const {
    start = 'top',
    end = 'bottom',
    startOffset = 0,
    endOffset = 0,
    onEnter,
    onLeave,
    onProgress,
    once = false,
    scrub = false,
  } = config

  let isActive = false
  let progress = 0
  let hasEntered = false
  let smoothedProgress = 0
  let rafId: number | null = null

  const getPosition = (pos: 'top' | 'center' | 'bottom' | number, rect: DOMRect): number => {
    if (typeof pos === 'number') return pos
    switch (pos) {
      case 'top': return rect.top
      case 'center': return rect.top + rect.height / 2
      case 'bottom': return rect.bottom
    }
  }

  const calculateProgress = (): ScrollInfo => {
    const rect = element.getBoundingClientRect()
    const windowHeight = window.innerHeight

    const startPos = getPosition(start, rect) + startOffset
    const endPos = getPosition(end, rect) + endOffset

    // Calculate progress based on viewport position
    const triggerStart = windowHeight
    const triggerEnd = 0

    const startProgress = (triggerStart - startPos) / (triggerStart - triggerEnd)
    const endProgress = (triggerStart - endPos) / (triggerStart - triggerEnd)

    const rawProgress = clamp(startProgress / (endProgress || 1), 0, 1)

    // Apply scrub smoothing
    if (typeof scrub === 'number' && scrub > 0) {
      smoothedProgress = lerp(smoothedProgress, rawProgress, 1 - scrub)
      progress = smoothedProgress
    } else {
      progress = rawProgress
    }

    const isInView = rect.top < windowHeight && rect.bottom > 0

    return {
      progress,
      scrollY: window.scrollY,
      velocity: 0,
      direction: 0,
      isInView,
      visibleRatio: isInView ? clamp((Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0)) / rect.height, 0, 1) : 0,
    }
  }

  const onScroll = () => {
    if (rafId) return
    rafId = requestAnimationFrame(() => {
      rafId = null
      const info = calculateProgress()

      // Check for enter/leave
      const wasActive = isActive
      isActive = info.progress > 0 && info.progress < 1

      if (!wasActive && isActive && (!once || !hasEntered)) {
        hasEntered = true
        onEnter?.(info)
      }

      if (wasActive && !isActive) {
        onLeave?.(info)
      }

      if (isActive || scrub) {
        onProgress?.(info)
      }
    })
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })

  // Initial check
  onScroll()

  return {
    isActive: () => isActive,
    getProgress: () => progress,
    refresh: () => {
      calculateProgress()
    },
    destroy: () => {
      if (rafId) cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    },
  }
}

/**
 * Create a scroll-linked interpolated value
 *
 * @example
 * ```ts
 * const opacity = createScrollLinkedValue(scrollProgress, {
 *   inputRange: [0, 0.5, 1],
 *   outputRange: [0, 1, 0],
 * })
 *
 * opacity.subscribe((value) => {
 *   element.style.opacity = String(value)
 * })
 * ```
 */
export function createScrollLinkedValue(
  scrollProgress: ScrollProgress,
  config: ScrollLinkedConfig
): ScrollLinkedValue {
  const { inputRange, outputRange, clamp: shouldClamp = true, easing } = config

  if (inputRange.length !== outputRange.length) {
    throw new Error('inputRange and outputRange must have the same length')
  }

  const firstOutput = outputRange[0]
  const isColorOutput = typeof firstOutput === 'string' &&
    (firstOutput.startsWith('#') || firstOutput.startsWith('rgb') || firstOutput.startsWith('hsl'))

  let currentValue: number | string = firstOutput ?? 0
  const subscribers = new Set<(value: number | string) => void>()

  const interpolate = (progress: number): number | string => {
    let p = progress
    if (easing) p = easing(p)
    const firstInput = inputRange[0] ?? 0
    const lastInput = inputRange[inputRange.length - 1] ?? 1
    if (shouldClamp) p = clamp(p, firstInput, lastInput)

    // Find the segment
    let segmentIndex = 0
    for (let i = 0; i < inputRange.length - 1; i++) {
      const curr = inputRange[i] ?? 0
      const next = inputRange[i + 1] ?? 1
      if (p >= curr && p <= next) {
        segmentIndex = i
        break
      }
      if (p > next) {
        segmentIndex = i + 1
      }
    }

    const segmentStart = inputRange[segmentIndex] ?? 0
    const segmentEnd = inputRange[segmentIndex + 1] ?? segmentStart
    const segmentProgress = segmentEnd !== segmentStart
      ? (p - segmentStart) / (segmentEnd - segmentStart)
      : 0

    const startValue = outputRange[segmentIndex] ?? 0
    const endValue = outputRange[segmentIndex + 1] ?? startValue

    if (isColorOutput && typeof startValue === 'string' && typeof endValue === 'string') {
      return lerpColor(startValue, endValue, segmentProgress)
    }

    return lerp(startValue as number, endValue as number, segmentProgress)
  }

  const unsubscribe = scrollProgress.subscribe((info) => {
    currentValue = interpolate(info.progress)
    subscribers.forEach(cb => cb(currentValue))
  })

  return {
    get: () => currentValue,
    subscribe: (callback) => {
      subscribers.add(callback)
      callback(currentValue)
      return () => subscribers.delete(callback)
    },
    destroy: () => {
      unsubscribe()
      subscribers.clear()
    },
  }
}

/**
 * Easing functions for scroll-linked animations
 */
export const scrollEasings = {
  linear: (t: number) => t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => t * (2 - t),
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => (--t) * t * t + 1,
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInQuart: (t: number) => t * t * t * t,
  easeOutQuart: (t: number) => 1 - (--t) * t * t * t,
  easeInOutQuart: (t: number) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
}
