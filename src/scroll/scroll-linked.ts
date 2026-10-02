/**
 * Scroll-linked animations - Bind animations directly to scroll position
 *
 * Unlike spring-based scroll animations, these animations are directly
 * tied to scroll progress (0-1) for precise control.
 */

import { clamp, lerp } from '../utils/math.js'
import { parseColorRGBA, rgbToHex, mixColorsRGBA, formatRGBA, type ColorSpace } from '../utils/color.js'
import { createSpringValue } from '../core/spring-value.js'
import type { SpringConfig } from '../core/config.js'

/**
 * Smoothing option: a 0-1 factor (higher = smoother, 0 = off) or a spring config
 */
export type ScrollSmoothing = number | SpringConfig

/** Largest accepted smoothing factor (~325ms time constant) */
const MAX_SMOOTHING_FACTOR = 0.95

/**
 * Resolve a smoothing option to a spring config, or `null` for no smoothing.
 *
 * A numeric factor `s` keeps the classic "move `1 - s` of the remaining
 * distance per 60fps frame" feel, expressed as a critically damped spring
 * with the same time constant so it runs frame-rate independently on the
 * global animation loop. Progress is 0-1, so the rest thresholds are tighter
 * than the spring defaults (a 1% snap would be visible on large outputs).
 */
function resolveSmoothing(smooth: ScrollSmoothing | undefined): SpringConfig | null {
  const rest = { restDelta: 1e-4, restSpeed: 1e-3 }
  if (typeof smooth === 'number') {
    if (!Number.isFinite(smooth) || smooth <= 0) return null
    const omega = -Math.log(Math.min(smooth, MAX_SMOOTHING_FACTOR)) * 60
    // Scale mass so stiffness stays in a sane range for slow smoothing
    const mass = Math.max(1, 100 / (omega * omega))
    return { ...rest, mass, stiffness: mass * omega * omega, damping: 2 * mass * omega }
  }
  if (smooth && typeof smooth === 'object') return { ...rest, ...smooth }
  return null
}

interface Smoother {
  /** Retarget; the first call jumps straight to the target (without onChange) */
  set(target: number): void
  get(): number
  destroy(): void
}

/**
 * Spring that follows a target value on the global animation loop, so it
 * keeps moving to the exact target after the input (scrolling) stops.
 */
function createSmoother(
  smooth: ScrollSmoothing | undefined,
  onChange: (value: number) => void
): Smoother | null {
  const config = resolveSmoothing(smooth)
  if (!config) return null

  const value = createSpringValue(0, config)
  let initialized = false
  let target = 0
  value.subscribe((v) => {
    if (initialized) onChange(v)
  })

  return {
    set: (next) => {
      if (!Number.isFinite(next)) return
      if (!initialized) {
        target = next
        value.jump(next)
        initialized = true
        return
      }
      if (next === target) return
      target = next
      value.set(next)
    },
    get: () => value.get(),
    destroy: () => value.destroy(),
  }
}

/**
 * Color lerp for scroll-linked animations (alpha-premultiplied).
 * Opaque results keep the hex form, translucent ones use `rgba()` so alpha
 * isn't dropped.
 */
function lerpColor(colorA: string, colorB: string, t: number, space?: ColorSpace): string {
  const mixed = mixColorsRGBA(parseColorRGBA(colorA), parseColorRGBA(colorB), t, space)
  return mixed.a >= 1 ? rgbToHex(mixed.r, mixed.g, mixed.b) : formatRGBA(mixed)
}

const isColorString = (value: unknown): value is string =>
  typeof value === 'string' &&
  (value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl') ||
    value.trim().toLowerCase() === 'transparent')

/**
 * Fraction (0-1) of an element's rect that is inside the viewport.
 * Zero-height elements report 0 instead of NaN.
 */
function getVisibleRatio(rect: DOMRect, windowHeight: number): number {
  if (rect.height <= 0) return 0
  return clamp((Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0)) / rect.height, 0, 1)
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
  /**
   * Scrub animation to scroll (true = instant, number = 0-1 smoothing factor,
   * higher = smoother; the smoothed progress keeps converging after scrolling stops)
   */
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
  /**
   * Smooth the scroll progress with a spring before mapping it through the
   * ranges, so the value eases toward (and settles exactly on) the
   * scroll-derived target, even after scrolling stops. Either a 0-1 factor
   * (higher = smoother, 0 = off, capped at 0.95) or a spring config.
   * Works for numeric and color outputs.
   */
  smooth?: ScrollSmoothing
  /** Easing function */
  easing?: (t: number) => number
  /** Color space for color outputs (default `'srgb'`) */
  colorSpace?: ColorSpace
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
    /**
     * Smoothing: 0-1 factor (higher = smoother) or spring config. The
     * smoothed progress keeps converging after scrolling stops.
     */
    smooth?: ScrollSmoothing
  } = {}
): ScrollProgress {
  const { offset = ['start', 'end'], smooth = 0 } = options

  let progress = 0
  // Start from the current scroll position so the first update doesn't report
  // a huge bogus velocity when the page is already scrolled
  let lastScrollY = typeof window !== 'undefined' ? window.scrollY : 0
  let lastTime = performance.now()
  let velocity = 0
  let direction: -1 | 0 | 1 = 0
  let rafId: number | null = null
  let destroyed = false
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
      const scrollRange = scrollEnd - scrollStart

      newProgress = scrollRange !== 0
        ? clamp((scrollY - scrollStart) / scrollRange, 0, 1)
        : scrollY >= scrollEnd ? 1 : 0

      // Check if in view
      isInView = rect.top < windowHeight && rect.bottom > 0
      visibleRatio = isInView ? getVisibleRatio(rect, windowHeight) : 0
    } else {
      // Track overall page scroll
      const documentHeight = document.documentElement.scrollHeight - windowHeight
      newProgress = documentHeight > 0 ? clamp(scrollY / documentHeight, 0, 1) : 0
    }

    // Apply smoothing: the spring is retargeted and reports its own progress
    if (smoother) {
      smoother.set(newProgress)
      progress = smoother.get()
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
    subscribers.forEach(cb => {
      try {
        cb(info)
      } catch (e) {
        console.error('[SpringKit] ScrollProgress subscriber error:', e)
      }
    })
  }

  // Smoothed progress is driven by a spring on the global animation loop
  const smoother = createSmoother(smooth, (value) => {
    if (destroyed) return
    progress = value
    latestInfo = { ...latestInfo, progress: value }
    notify(latestInfo)
  })

  const onScroll = () => {
    if (rafId || destroyed) return
    rafId = requestAnimationFrame(() => {
      rafId = null
      if (destroyed) return
      latestInfo = calculateProgress()
      notify(latestInfo)
    })
  }

  // Initial calculation - kept up to date so late subscribers get current info
  let latestInfo = calculateProgress()

  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })

  return {
    get: () => progress,
    getInfo: () => calculateProgress(),
    subscribe: (callback) => {
      subscribers.add(callback)
      try {
        callback(latestInfo)
      } catch (e) {
        console.error('[SpringKit] ScrollProgress subscriber error:', e)
      }
      return () => subscribers.delete(callback)
    },
    destroy: () => {
      if (destroyed) return
      destroyed = true
      if (rafId) cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      smoother?.destroy()
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
  let pendingRafId: number | null = null
  let destroyed = false
  // The element's own inline transform, restored on destroy
  const originalTransform = element.style.transform

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
    if (destroyed) return

    if (isInView && pendingRafId === null) {
      pendingRafId = requestAnimationFrame(() => {
        pendingRafId = null
        if (!destroyed) update()
      })
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true })

  return {
    getOffset: () => offset,
    update,
    destroy: () => {
      destroyed = true

      // Cancel pending RAF to prevent memory leak
      if (pendingRafId !== null) {
        cancelAnimationFrame(pendingRafId)
        pendingRafId = null
      }

      observer?.disconnect()
      window.removeEventListener('scroll', onScroll)
      element.style.transform = originalTransform
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
  let rafId: number | null = null
  let destroyed = false
  let latestInfo: ScrollInfo | null = null

  // Numeric scrub: progress follows the scroll with a spring on the global
  // animation loop and keeps reporting until it settles
  const smoother = typeof scrub === 'number'
    ? createSmoother(scrub, (value) => {
      if (destroyed || !latestInfo) return
      progress = value
      latestInfo = { ...latestInfo, progress: value }
      try {
        onProgress?.(latestInfo)
      } catch (e) {
        console.error('[SpringKit] ScrollTrigger onProgress error:', e)
      }
    })
    : null

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

    // Progress runs from 0 when the start marker reaches the bottom of the
    // viewport to 1 when the end marker reaches the top of the viewport.
    // Scrolling moves both markers together, so the distance to scroll is
    // windowHeight + (endPos - startPos).
    const scrolled = windowHeight - startPos
    const scrollDistance = windowHeight + (endPos - startPos)
    const rawProgress = scrollDistance > 0
      ? clamp(scrolled / scrollDistance, 0, 1)
      : scrolled >= 0 ? 1 : 0

    const isInView = rect.top < windowHeight && rect.bottom > 0
    const visibleRatio = isInView ? getVisibleRatio(rect, windowHeight) : 0
    latestInfo = {
      progress: rawProgress,
      scrollY: window.scrollY,
      velocity: 0,
      direction: 0,
      isInView,
      visibleRatio,
    }

    // Apply scrub smoothing (the smoother reports progress while it moves)
    if (smoother) {
      smoother.set(rawProgress)
      progress = smoother.get()
    } else {
      progress = rawProgress
    }

    return {
      progress,
      scrollY: window.scrollY,
      velocity: 0,
      direction: 0,
      isInView,
      visibleRatio,
    }
  }

  const onScroll = () => {
    if (rafId || destroyed) return
    rafId = requestAnimationFrame(() => {
      rafId = null
      if (destroyed) return
      const info = calculateProgress()

      // Check for enter/leave
      const wasActive = isActive
      isActive = info.progress > 0 && info.progress < 1

      if (!wasActive && isActive && (!once || !hasEntered)) {
        hasEntered = true
        try {
          onEnter?.(info)
        } catch (e) {
          console.error('[SpringKit] ScrollTrigger onEnter error:', e)
        }
      }

      if (wasActive && !isActive) {
        try {
          onLeave?.(info)
        } catch (e) {
          console.error('[SpringKit] ScrollTrigger onLeave error:', e)
        }
      }

      if (isActive || scrub) {
        try {
          onProgress?.(info)
        } catch (e) {
          console.error('[SpringKit] ScrollTrigger onProgress error:', e)
        }
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
      destroyed = true
      if (rafId) cancelAnimationFrame(rafId)
      rafId = null
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      smoother?.destroy()
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
  const { inputRange, outputRange, clamp: shouldClamp = true, easing, colorSpace, smooth } = config

  if (inputRange.length !== outputRange.length) {
    throw new Error('inputRange and outputRange must have the same length')
  }

  const firstOutput = outputRange[0]
  const isColorOutput = isColorString(firstOutput)

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
        // Past the last stop, keep using the last segment so unclamped
        // values extrapolate (instead of collapsing onto the last output)
        segmentIndex = Math.min(i + 1, Math.max(inputRange.length - 2, 0))
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
      return lerpColor(startValue, endValue, segmentProgress, colorSpace)
    }

    return lerp(startValue as number, endValue as number, segmentProgress)
  }

  let destroyed = false

  const update = (progress: number) => {
    if (destroyed) return
    currentValue = interpolate(progress)
    subscribers.forEach(cb => {
      try {
        cb(currentValue)
      } catch (e) {
        console.error('[SpringKit] ScrollLinkedValue subscriber error:', e)
      }
    })
  }

  // With `smooth`, the progress follows its scroll-derived target with a
  // spring on the global animation loop and is mapped through the ranges
  // every frame (works for numbers and colors alike)
  const smoother = createSmoother(smooth, update)

  let hasValue = false
  const unsubscribe = scrollProgress.subscribe((info) => {
    if (!smoother) return update(info.progress)
    smoother.set(info.progress)
    // The first progress is applied immediately (no animating in from 0)
    if (!hasValue) {
      hasValue = true
      update(smoother.get())
    }
  })

  return {
    get: () => currentValue,
    subscribe: (callback) => {
      subscribers.add(callback)
      try {
        callback(currentValue)
      } catch (e) {
        console.error('[SpringKit] ScrollLinkedValue subscriber error:', e)
      }
      return () => subscribers.delete(callback)
    },
    destroy: () => {
      destroyed = true
      unsubscribe()
      smoother?.destroy()
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
