import { useRef, useEffect, type RefObject } from 'react'
import { MotionValue, createMotionValue } from '@oxog/springkit'
import { isBrowser } from '../utils/ssr.js'
import { useDestroyOnUnmount } from './useDestroyOnUnmount.js'
import { useElementEffect } from './useElementEffect.js'

export interface UseScrollOptions {
  /**
   * Target element to track scroll of
   * If not provided, tracks window/document scroll
   */
  target?: RefObject<HTMLElement | null>

  /**
   * Container element for scroll tracking
   * Used for calculating progress of target within container
   */
  container?: RefObject<HTMLElement | null>

  /**
   * Offset for start/end of scroll tracking
   * Format: ["start end", "end start"]
   *
   * Values can be:
   * - "start", "center", "end" (of element)
   * - Pixels: "100px"
   * - Percentage: "50%"
   *
   * @default ["start start", "end end"]
   */
  offset?: [string, string]

  /**
   * Axis to track
   * @default "y"
   */
  axis?: 'x' | 'y'
}

export interface UseScrollReturn {
  /** Absolute scroll position X */
  scrollX: MotionValue<number>
  /** Absolute scroll position Y */
  scrollY: MotionValue<number>
  /** Scroll progress X (0-1) */
  scrollXProgress: MotionValue<number>
  /** Scroll progress Y (0-1) */
  scrollYProgress: MotionValue<number>
}

/**
 * Track scroll position and progress with MotionValues
 *
 * Returns MotionValues that update without React re-renders,
 * making it perfect for scroll-linked animations.
 *
 * @example Window scroll
 * ```tsx
 * function ScrollProgress() {
 *   const { scrollYProgress } = useScroll()
 *
 *   useEffect(() => {
 *     return scrollYProgress.subscribe((progress) => {
 *       progressBar.style.scaleX = progress
 *     })
 *   }, [scrollYProgress])
 * }
 * ```
 *
 * @example Element scroll
 * ```tsx
 * function ScrollableContainer() {
 *   const containerRef = useRef(null)
 *   const { scrollY } = useScroll({ target: containerRef })
 *
 *   return (
 *     <div ref={containerRef} style={{ overflow: 'auto' }}>
 *       ...
 *     </div>
 *   )
 * }
 * ```
 *
 * @example Scroll-linked animation
 * ```tsx
 * function ParallaxImage() {
 *   const ref = useRef(null)
 *   const { scrollYProgress } = useScroll({
 *     target: ref,
 *     offset: ["start end", "end start"]
 *   })
 *   const y = useTransform(scrollYProgress, [0, 1], ["-50%", "50%"])
 *
 *   return (
 *     <div ref={ref}>
 *       <img style={{ transform: `translateY(${y.get()})` }} />
 *     </div>
 *   )
 * }
 * ```
 */
export function useScroll(options: UseScrollOptions = {}): UseScrollReturn {
  const { target, container, offset = ['start start', 'end end'], axis = 'y' } = options
  // The offset tuple is usually an inline array (and the default is a new array
  // each render): depend on its contents so the listeners aren't re-attached
  // on every render
  const [offsetStart, offsetEnd] = offset

  // Create MotionValues
  const scrollXRef = useRef<MotionValue<number> | null>(null)
  const scrollYRef = useRef<MotionValue<number> | null>(null)
  const scrollXProgressRef = useRef<MotionValue<number> | null>(null)
  const scrollYProgressRef = useRef<MotionValue<number> | null>(null)

  if (scrollXRef.current === null || scrollXRef.current.isDestroyed()) {
    scrollXRef.current = createMotionValue(0)
    scrollYRef.current = createMotionValue(0)
    scrollXProgressRef.current = createMotionValue(0)
    scrollYProgressRef.current = createMotionValue(0)
  }

  // Re-attaches when the container/target element changes - including
  // elements that mount after the hook first ran (conditional rendering)
  useElementEffect(() => {
    if (!isBrowser) return

    const scrollX = scrollXRef.current!
    const scrollY = scrollYRef.current!
    const scrollXProgress = scrollXProgressRef.current!
    const scrollYProgress = scrollYProgressRef.current!

    const containerEl = container?.current ?? null
    const targetEl = target?.current ?? null

    // Determine scroll container
    const scrollContainer: HTMLElement | Window = containerEl ?? targetEl ?? window
    const isWindow = scrollContainer === window

    const getScrollPosition = () => {
      if (isWindow) {
        return {
          x: window.scrollX || window.pageXOffset,
          y: window.scrollY || window.pageYOffset,
        }
      }
      const el = scrollContainer as HTMLElement
      return {
        x: el.scrollLeft,
        y: el.scrollTop,
      }
    }

    const getScrollSize = () => {
      if (isWindow) {
        return {
          width: document.documentElement.scrollWidth - window.innerWidth,
          height: document.documentElement.scrollHeight - window.innerHeight,
        }
      }
      const el = scrollContainer as HTMLElement
      return {
        width: el.scrollWidth - el.clientWidth,
        height: el.scrollHeight - el.clientHeight,
      }
    }

    const calculateProgress = () => {
      const position = getScrollPosition()
      const size = getScrollSize()

      // Update absolute positions
      scrollX.jump(position.x)
      scrollY.jump(position.y)

      // Update progress (0-1)
      scrollXProgress.jump(size.width > 0 ? position.x / size.width : 0)
      scrollYProgress.jump(size.height > 0 ? position.y / size.height : 0)
    }

    // Target element progress (element visibility in viewport)
    const calculateTargetProgress = (targetEl: HTMLElement) => {
      const position = getScrollPosition()
      scrollX.jump(position.x)
      scrollY.jump(position.y)

      // Get target bounds
      const rect = targetEl.getBoundingClientRect()

      // The "viewport" is the container when one is given, the window otherwise
      let viewStart = 0
      let viewSize = axis === 'x' ? window.innerWidth : window.innerHeight
      if (containerEl) {
        const containerRect = containerEl.getBoundingClientRect()
        viewStart = axis === 'x' ? containerRect.left : containerRect.top
        viewSize = axis === 'x' ? containerEl.clientWidth : containerEl.clientHeight
      }

      // Calculate start and end points
      // "start end" = when target top hits viewport bottom
      // "end start" = when target bottom hits viewport top
      // Each point is the remaining distance (viewport point - element point):
      // it grows by exactly the scrolled amount and is 0 when the points meet.
      const startPoint = parseOffset(offsetStart, rect, viewStart, viewSize, axis)
      const endPoint = parseOffset(offsetEnd, rect, viewStart, viewSize, axis)

      // 0 when the start condition is met, 1 when the end condition is met
      const range = startPoint - endPoint

      const progress = range !== 0 ? startPoint / range : 0
      const clampedProgress = Math.max(0, Math.min(1, progress))

      if (axis === 'y') {
        scrollYProgress.jump(clampedProgress)
      } else {
        scrollXProgress.jump(clampedProgress)
      }
    }

    // Use RAF for smooth updates
    let rafId: number | null = null
    let isActive = true

    const handleScroll = () => {
      if (rafId !== null) return

      rafId = requestAnimationFrame(() => {
        if (!isActive) return
        if (targetEl) {
          calculateTargetProgress(targetEl)
        } else {
          calculateProgress()
        }
        rafId = null
      })
    }

    // Initial calculation
    handleScroll()

    // Add scroll listener
    const scrollTarget = isWindow ? window : scrollContainer
    scrollTarget.addEventListener('scroll', handleScroll, { passive: true })

    // Target progress (no explicit container) depends on the target's position
    // in the viewport, which changes when the page scrolls - scroll events of
    // the page don't reach a listener on the target element itself
    const listenToWindowScroll = !isWindow && !containerEl && !!targetEl
    if (listenToWindowScroll) {
      window.addEventListener('scroll', handleScroll, { passive: true })
    }

    // Also listen to resize for progress recalculation
    window.addEventListener('resize', handleScroll, { passive: true })

    return () => {
      isActive = false
      scrollTarget.removeEventListener('scroll', handleScroll)
      if (listenToWindowScroll) {
        window.removeEventListener('scroll', handleScroll)
      }
      window.removeEventListener('resize', handleScroll)
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
    }
  }, () => [container?.current ?? null, target?.current ?? null, offsetStart, offsetEnd, axis])

  // Cleanup on unmount (deferred so StrictMode's simulated remount keeps them alive)
  useDestroyOnUnmount(() => {
    scrollXRef.current?.destroy()
    scrollYRef.current?.destroy()
    scrollXProgressRef.current?.destroy()
    scrollYProgressRef.current?.destroy()
  })

  return {
    scrollX: scrollXRef.current!,
    scrollY: scrollYRef.current!,
    scrollXProgress: scrollXProgressRef.current!,
    scrollYProgress: scrollYProgressRef.current!,
  }
}

/**
 * Parse offset string like "start end" or "100px"
 *
 * Returns the distance (along `axis`) between the viewport point and the
 * element point. The viewport spans `viewStart`..`viewStart + viewSize` in
 * client coordinates (the window, or the scroll container).
 */
function parseOffset(
  offset: string,
  rect: DOMRect,
  viewStart: number,
  viewSize: number,
  axis: 'x' | 'y'
): number {
  const parts = offset.split(' ')
  const elementPart = parts[0] || 'start'
  const viewportPart = parts[1] || 'start'

  const elementStart = axis === 'x' ? rect.left : rect.top
  const elementSize = axis === 'x' ? rect.width : rect.height

  // Element position
  let elementPos: number
  if (elementPart === 'start') {
    elementPos = elementStart
  } else if (elementPart === 'center') {
    elementPos = elementStart + elementSize / 2
  } else if (elementPart === 'end') {
    elementPos = elementStart + elementSize
  } else if (elementPart.endsWith('px')) {
    elementPos = elementStart + parseFloat(elementPart)
  } else if (elementPart.endsWith('%')) {
    elementPos = elementStart + (elementSize * parseFloat(elementPart)) / 100
  } else {
    elementPos = elementStart
  }

  // Viewport position
  let viewportPos: number
  if (viewportPart === 'start') {
    viewportPos = 0
  } else if (viewportPart === 'center') {
    viewportPos = viewSize / 2
  } else if (viewportPart === 'end') {
    viewportPos = viewSize
  } else if (viewportPart.endsWith('px')) {
    viewportPos = parseFloat(viewportPart)
  } else if (viewportPart.endsWith('%')) {
    viewportPos = (viewSize * parseFloat(viewportPart)) / 100
  } else {
    viewportPos = 0
  }

  return viewStart + viewportPos - elementPos
}

/**
 * Simple scroll velocity tracking (window scroll, pixels per second)
 *
 * Decays back to 0 once no scroll event arrived for ~100ms.
 *
 * @example
 * ```tsx
 * function ScrollVelocityText() {
 *   const velocity = useScrollVelocity()
 *
 *   return (
 *     <div style={{
 *       transform: `skewY(${velocity.get() * 0.01}deg)`
 *     }}>
 *       Skews based on scroll speed
 *     </div>
 *   )
 * }
 * ```
 */
export function useScrollVelocity(axis: 'x' | 'y' = 'y'): MotionValue<number> {
  const velocityRef = useRef<MotionValue<number> | null>(null)

  if (velocityRef.current === null || velocityRef.current.isDestroyed()) {
    velocityRef.current = createMotionValue(0)
  }

  useEffect(() => {
    if (!isBrowser) return

    const velocity = velocityRef.current!

    const readScroll = () =>
      axis === 'y'
        ? (window.scrollY || window.pageYOffset)
        : (window.scrollX || window.pageXOffset)

    // Start from the current position: the first event must not report the
    // initial page offset as movement
    let lastScroll = readScroll()
    let lastTime = performance.now()
    let idleTimer: ReturnType<typeof setTimeout> | null = null

    const handleScroll = () => {
      const now = performance.now()
      const currentScroll = readScroll()

      const deltaTime = now - lastTime
      const deltaScroll = currentScroll - lastScroll

      if (deltaTime > 0) {
        velocity.jump(deltaScroll / deltaTime * 1000) // pixels per second
      }

      lastScroll = currentScroll
      lastTime = now

      // No scroll events while the page is at rest: settle back to 0
      if (idleTimer !== null) clearTimeout(idleTimer)
      idleTimer = setTimeout(() => {
        idleTimer = null
        velocity.jump(0)
      }, SCROLL_VELOCITY_IDLE_MS)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (idleTimer !== null) clearTimeout(idleTimer)
    }
  }, [axis])

  useDestroyOnUnmount(() => {
    velocityRef.current?.destroy()
  })

  return velocityRef.current!
}

/** Time without scroll events after which useScrollVelocity reports 0 */
const SCROLL_VELOCITY_IDLE_MS = 100
