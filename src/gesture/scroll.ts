import { defaultConfig } from '../core/config.js'
import { createSpringValue, type SpringValue } from '../core/spring-value.js'

/**
 * Scroll spring configuration interface
 */
export interface ScrollSpringConfig {
  /** Spring stiffness (default: 100) */
  stiffness?: number
  /** Damping ratio (default: 10) */
  damping?: number
  /** Mass (default: 1) */
  mass?: number
  /** Speed threshold for considering spring at rest (default: 0.01) */
  restSpeed?: number
  /** Position threshold for considering spring at rest (default: 0.01) */
  restDelta?: number
  /** Clamp value to [from, to] range */
  clamp?: boolean
  /** Scroll direction */
  direction?: 'horizontal' | 'vertical' | 'both'
  /** Enable momentum/inertia */
  momentum?: boolean
  /** Momentum decay factor (0-1) */
  momentumDecay?: number
  /** Enable bounce at edges */
  bounce?: boolean
  /** Bounce spring stiffness */
  bounceStiffness?: number
  /** Bounce spring damping */
  bounceDamping?: number
  /** Callback called on scroll */
  onScroll?: (scrollX: number, scrollY: number) => void
  /** Callback called when scroll starts */
  onScrollStart?: () => void
  /** Callback called when scroll ends */
  onScrollEnd?: () => void
}

/**
 * Scroll spring interface
 */
export interface ScrollSpring {
  /** Get current scroll position */
  getScroll(): { x: number; y: number }
  /** Scroll to position */
  scrollTo(x: number, y: number): void
  /** Scroll to element */
  scrollToElement(element: HTMLElement, offset?: number): void
  /** Enable scroll handling */
  enable(): void
  /** Disable scroll handling */
  disable(): void
  /** Clean up resources */
  destroy(): void
}

/**
 * Default scroll spring configuration
 */
const defaultScrollConfig: Required<
  Omit<
    ScrollSpringConfig,
    | 'onScroll'
    | 'onScrollStart'
    | 'onScrollEnd'
    | 'bounceStiffness'
    | 'bounceDamping'
    | 'velocity'
  >
> = {
  direction: 'vertical',
  momentum: false,
  momentumDecay: 0.95,
  bounce: false,
  stiffness: 100,
  damping: 10,
  mass: 1,
  restSpeed: 0.01,
  restDelta: 0.01,
  clamp: false,
}

/**
 * Scroll spring implementation
 */
class ScrollSpringImpl implements ScrollSpring {
  private container: HTMLElement
  private config: ScrollSpringConfig
  private scroll = { x: 0, y: 0 }
  private target = { x: 0, y: 0 }
  private isScrolling = false
  private isEnabled = true

  private springX: SpringValue
  private springY: SpringValue

  constructor(container: HTMLElement, config: ScrollSpringConfig = {}) {
    this.container = container
    this.config = { ...defaultScrollConfig, ...config }

    // Extract only spring physics config for createSpringValue
    const springConfig = {
      stiffness: this.config.stiffness,
      damping: this.config.damping,
      mass: this.config.mass,
      restSpeed: this.config.restSpeed,
      restDelta: this.config.restDelta,
      clamp: this.config.clamp,
    }

    this.springX = createSpringValue(0, springConfig)
    this.springY = createSpringValue(0, springConfig)

    // Subscribe to spring updates
    this.springX.subscribe(() => {
      this.scroll.x = this.springX.get()
      this.config.onScroll?.(this.scroll.x, this.scroll.y)
    })

    this.springY.subscribe(() => {
      this.scroll.y = this.springY.get()
      this.config.onScroll?.(this.scroll.x, this.scroll.y)
    })

    this.setupScrollEvents()
  }

  private setupScrollEvents(): void {
    this.container.addEventListener('wheel', this.onWheel, { passive: false })
  }

  private onWheel = (e: WheelEvent): void => {
    if (!this.isEnabled) return

    if (!this.isScrolling) {
      this.isScrolling = true
      this.config.onScrollStart?.()
    }

    // Apply direction filter
    let deltaX = e.deltaX
    let deltaY = e.deltaY

    if (this.config.direction === 'horizontal') {
      deltaY = 0
    } else if (this.config.direction === 'vertical') {
      deltaX = 0
    }

    // Apply bounce at edges
    if (this.config.bounce) {
      const maxScrollX = this.container.scrollWidth - this.container.clientWidth
      const maxScrollY = this.container.scrollHeight - this.container.clientHeight

      this.target.x += deltaX
      this.target.y += deltaY

      // Apply rubber band at edges
      if (this.target.x < 0) {
        this.target.x = -Math.sqrt(-this.target.x) * 10
      } else if (this.target.x > maxScrollX) {
        this.target.x = maxScrollX + Math.sqrt(this.target.x - maxScrollX) * 10
      }

      if (this.target.y < 0) {
        this.target.y = -Math.sqrt(-this.target.y) * 10
      } else if (this.target.y > maxScrollY) {
        this.target.y = maxScrollY + Math.sqrt(this.target.y - maxScrollY) * 10
      }

      // Prevent default to handle scroll ourselves
      e.preventDefault()
    } else {
      this.target.x += deltaX
      this.target.y += deltaY

      // Clamp to bounds
      const maxScrollX = this.container.scrollWidth - this.container.clientWidth
      const maxScrollY = this.container.scrollHeight - this.container.clientHeight

      this.target.x = Math.max(0, Math.min(this.target.x, maxScrollX))
      this.target.y = Math.max(0, Math.min(this.target.y, maxScrollY))
    }

    this.startScrollLoop()
  }

  private startScrollLoop(): void {
    // Update springs towards target
    this.springX.set(this.target.x)
    this.springY.set(this.target.y)

    // Check for scroll end
    const checkEnd = () => {
      const settled =
        Math.abs(this.scroll.x - this.target.x) < 0.1 &&
        Math.abs(this.scroll.y - this.target.y) < 0.1 &&
        !this.springX.isAnimating() &&
        !this.springY.isAnimating()

      if (settled && this.isScrolling) {
        this.isScrolling = false
        this.config.onScrollEnd?.()
      } else if (this.isScrolling) {
        requestAnimationFrame(checkEnd)
      }
    }

    checkEnd()
  }

  getScroll(): { x: number; y: number } {
    return { ...this.scroll }
  }

  scrollTo(x: number, y: number): void {
    this.target = { x, y }
    this.springX.set(x)
    this.springY.set(y)
  }

  scrollToElement(element: HTMLElement, offset = 0): void {
    const containerRect = this.container.getBoundingClientRect()
    const elementRect = element.getBoundingClientRect()

    const x = elementRect.left - containerRect.left + this.scroll.x + offset
    const y = elementRect.top - containerRect.top + this.scroll.y + offset

    this.scrollTo(x, y)
  }

  enable(): void {
    this.isEnabled = true
  }

  disable(): void {
    this.isEnabled = false
  }

  destroy(): void {
    this.container.removeEventListener('wheel', this.onWheel)
    this.springX.destroy()
    this.springY.destroy()
  }
}

/**
 * Create a scroll spring
 *
 * @param container - Scrollable container element
 * @param config - Scroll spring configuration
 * @returns Scroll spring controller
 *
 * @example
 * ```ts
 * const scroll = createScrollSpring(container, {
 *   onScroll: (x, y) => {
 *     content.style.transform = `translate(${-x}px, ${-y}px)`
 *   },
 * })
 * ```
 */
export function createScrollSpring(
  container: HTMLElement,
  config?: ScrollSpringConfig
): ScrollSpring {
  return new ScrollSpringImpl(container, config)
}
