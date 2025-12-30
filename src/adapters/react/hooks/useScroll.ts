import { useRef, useEffect, type RefObject } from 'react'
import { MotionValue, createMotionValue } from '../../../core/MotionValue.js'
import { isBrowser } from '../utils/ssr.js'

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

  // Create MotionValues
  const scrollXRef = useRef<MotionValue<number> | null>(null)
  const scrollYRef = useRef<MotionValue<number> | null>(null)
  const scrollXProgressRef = useRef<MotionValue<number> | null>(null)
  const scrollYProgressRef = useRef<MotionValue<number> | null>(null)

  if (scrollXRef.current === null) {
    scrollXRef.current = createMotionValue(0)
    scrollYRef.current = createMotionValue(0)
    scrollXProgressRef.current = createMotionValue(0)
    scrollYProgressRef.current = createMotionValue(0)
  }

  useEffect(() => {
    if (!isBrowser) return

    const scrollX = scrollXRef.current!
    const scrollY = scrollYRef.current!
    const scrollXProgress = scrollXProgressRef.current!
    const scrollYProgress = scrollYProgressRef.current!

    // Determine scroll container
    const scrollContainer = container?.current ?? (target?.current ?? window)
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
    const calculateTargetProgress = () => {
      const targetEl = target?.current
      if (!targetEl) {
        calculateProgress()
        return
      }

      const position = getScrollPosition()
      scrollX.jump(position.x)
      scrollY.jump(position.y)

      // Get target bounds
      const rect = targetEl.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth

      // Parse offsets
      const [startOffset, endOffset] = offset

      // Calculate start and end points
      // "start end" = when target top hits viewport bottom
      // "end start" = when target bottom hits viewport top
      const startPoint = parseOffset(startOffset, rect, viewportHeight, viewportWidth, 'start')
      const endPoint = parseOffset(endOffset, rect, viewportHeight, viewportWidth, 'end')

      // Current position in the range
      const current = axis === 'y' ? rect.top : rect.left
      const range = endPoint - startPoint

      const progress = range !== 0 ? (startPoint - current) / range : 0
      const clampedProgress = Math.max(0, Math.min(1, progress))

      if (axis === 'y') {
        scrollYProgress.jump(clampedProgress)
      } else {
        scrollXProgress.jump(clampedProgress)
      }
    }

    // Use RAF for smooth updates
    let rafId: number | null = null
    const handleScroll = () => {
      if (rafId !== null) return

      rafId = requestAnimationFrame(() => {
        if (target?.current) {
          calculateTargetProgress()
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

    // Also listen to resize for progress recalculation
    window.addEventListener('resize', handleScroll, { passive: true })

    return () => {
      scrollTarget.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [target, container, offset, axis])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      scrollXRef.current?.destroy()
      scrollYRef.current?.destroy()
      scrollXProgressRef.current?.destroy()
      scrollYProgressRef.current?.destroy()
    }
  }, [])

  return {
    scrollX: scrollXRef.current!,
    scrollY: scrollYRef.current!,
    scrollXProgress: scrollXProgressRef.current!,
    scrollYProgress: scrollYProgressRef.current!,
  }
}

/**
 * Parse offset string like "start end" or "100px"
 */
function parseOffset(
  offset: string,
  rect: DOMRect,
  viewportHeight: number,
  viewportWidth: number,
  type: 'start' | 'end'
): number {
  const parts = offset.split(' ')
  const elementPart = parts[0] || 'start'
  const viewportPart = parts[1] || 'start'

  // Element position
  let elementPos: number
  if (elementPart === 'start') {
    elementPos = type === 'start' ? rect.top : rect.top
  } else if (elementPart === 'center') {
    elementPos = rect.top + rect.height / 2
  } else if (elementPart === 'end') {
    elementPos = rect.bottom
  } else if (elementPart.endsWith('px')) {
    elementPos = rect.top + parseFloat(elementPart)
  } else if (elementPart.endsWith('%')) {
    elementPos = rect.top + (rect.height * parseFloat(elementPart)) / 100
  } else {
    elementPos = rect.top
  }

  // Viewport position
  let viewportPos: number
  if (viewportPart === 'start') {
    viewportPos = 0
  } else if (viewportPart === 'center') {
    viewportPos = viewportHeight / 2
  } else if (viewportPart === 'end') {
    viewportPos = viewportHeight
  } else if (viewportPart.endsWith('px')) {
    viewportPos = parseFloat(viewportPart)
  } else if (viewportPart.endsWith('%')) {
    viewportPos = (viewportHeight * parseFloat(viewportPart)) / 100
  } else {
    viewportPos = 0
  }

  return viewportPos - elementPos
}

/**
 * Simple scroll velocity tracking
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
  const lastScrollRef = useRef(0)
  const lastTimeRef = useRef(Date.now())

  if (velocityRef.current === null) {
    velocityRef.current = createMotionValue(0)
  }

  useEffect(() => {
    if (!isBrowser) return

    const velocity = velocityRef.current!

    const handleScroll = () => {
      const now = Date.now()
      const currentScroll = axis === 'y'
        ? (window.scrollY || window.pageYOffset)
        : (window.scrollX || window.pageXOffset)

      const deltaTime = now - lastTimeRef.current
      const deltaScroll = currentScroll - lastScrollRef.current

      if (deltaTime > 0) {
        velocity.jump(deltaScroll / deltaTime * 1000) // pixels per second
      }

      lastScrollRef.current = currentScroll
      lastTimeRef.current = now
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [axis])

  useEffect(() => {
    return () => {
      velocityRef.current?.destroy()
    }
  }, [])

  return velocityRef.current!
}
