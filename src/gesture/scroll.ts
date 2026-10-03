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
  /**
   * @deprecated Has no effect: wheel and trackpad events already include the
   * operating system's inertial scrolling. Will be removed in a future major.
   */
  momentum?: boolean
  /**
   * @deprecated Has no effect (see `momentum`). Will be removed in a future
   * major.
   */
  momentumDecay?: number
  /**
   * Enable bounce at edges: scrolling past an edge is resisted with an
   * iOS-style rubber band (~0.55x for small overscrolls, never more than the
   * container size), and the content springs back once the input stops
   */
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

/** Pixels per line for WheelEvent.DOM_DELTA_LINE */
const LINE_HEIGHT_PX = 16
/** Pixels per page for WheelEvent.DOM_DELTA_PAGE when the container has no height */
const PAGE_HEIGHT_FALLBACK_PX = 800

/** Rubber band stiffness (iOS UIScrollView uses 0.55) */
const RUBBER_BAND_COEFFICIENT = 0.55

/**
 * iOS-style rubber band: the displayed overscroll for a raw `overscroll` (px)
 * beyond the edge. Never amplifies: ~`overscroll * 0.55` for small values,
 * approaching `dimension` (the container size) asymptotically.
 */
function rubberBand(overscroll: number, dimension: number): number {
  return (1 - 1 / ((overscroll * RUBBER_BAND_COEFFICIENT) / dimension + 1)) * dimension
}

/**
 * Scroll spring implementation
 */
class ScrollSpringImpl implements ScrollSpring {
  private container: HTMLElement
  private config: ScrollSpringConfig
  private scroll = { x: 0, y: 0 }
  private target = { x: 0, y: 0 }
  /**
   * Scroll position the wheel input asks for, without the rubber band; the
   * spring target is this position with the overscroll rubber-banded
   */
  private rawTarget = { x: 0, y: 0 }
  private isScrolling = false
  private isEnabled = true
  private pendingRafId: number | null = null
  private destroyed = false

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

    // Normalize delta to pixels (Firefox and some mice report lines or pages)
    const deltaScale =
      e.deltaMode === 1 ? LINE_HEIGHT_PX
        : e.deltaMode === 2 ? (this.container.clientHeight || PAGE_HEIGHT_FALLBACK_PX)
          : 1

    // Apply direction filter
    let deltaX = e.deltaX * deltaScale
    let deltaY = e.deltaY * deltaScale

    if (this.config.direction === 'horizontal') {
      deltaY = 0
    } else if (this.config.direction === 'vertical') {
      deltaX = 0
    }

    // Apply bounce at edges
    if (this.config.bounce) {
      // Content shorter than the container can't scroll: its range is [0, 0]
      // (as in clampTargetToBounds), not [0, negative]
      const maxScrollX = Math.max(0, this.container.scrollWidth - this.container.clientWidth)
      const maxScrollY = Math.max(0, this.container.scrollHeight - this.container.clientHeight)

      // Accumulate the raw position, then rubber-band the part beyond the
      // edges (scrolling back out of an overscroll follows the same curve)
      this.rawTarget.x += deltaX
      this.rawTarget.y += deltaY
      this.target = {
        x: this.applyRubberBand(this.rawTarget.x, maxScrollX, this.container.clientWidth),
        y: this.applyRubberBand(this.rawTarget.y, maxScrollY, this.container.clientHeight),
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
      this.rawTarget = { ...this.target }
    }

    this.startScrollLoop()
  }

  private startScrollLoop(): void {
    // Update springs towards target
    this.springX.set(this.target.x)
    this.springY.set(this.target.y)

    // Only one end-check loop may run at a time - every wheel event used to
    // start an additional, untracked RAF chain
    if (this.pendingRafId !== null) {
      cancelAnimationFrame(this.pendingRafId)
      this.pendingRafId = null
    }

    // Check for scroll end
    const checkEnd = () => {
      this.pendingRafId = null

      if (this.destroyed) return

      const settled =
        Math.abs(this.scroll.x - this.target.x) < 0.1 &&
        Math.abs(this.scroll.y - this.target.y) < 0.1 &&
        !this.springX.isAnimating() &&
        !this.springY.isAnimating()

      // Once the overscroll has settled, bounce back to the nearest edge
      if (settled && this.isScrolling && this.config.bounce && this.clampTargetToBounds()) {
        const bounceConfig = this.getBounceConfig()
        this.springX.set(this.target.x, bounceConfig)
        this.springY.set(this.target.y, bounceConfig)
        this.pendingRafId = requestAnimationFrame(checkEnd)
        return
      }

      if (settled && this.isScrolling) {
        this.isScrolling = false
        this.config.onScrollEnd?.()
      } else if (this.isScrolling) {
        this.pendingRafId = requestAnimationFrame(checkEnd)
      }
    }

    checkEnd()
  }

  /** Spring config of the bounce back from an overscroll (bounceStiffness / bounceDamping) */
  private getBounceConfig(): { stiffness?: number; damping?: number } {
    const config: { stiffness?: number; damping?: number } = {}
    const { bounceStiffness, bounceDamping } = this.config
    if (bounceStiffness !== undefined && Number.isFinite(bounceStiffness)) config.stiffness = bounceStiffness
    if (bounceDamping !== undefined && Number.isFinite(bounceDamping)) config.damping = bounceDamping
    return config
  }

  /** Rubber-band the part of `raw` outside [0, max] (`dimension` = container size) */
  private applyRubberBand(raw: number, max: number, dimension: number): number {
    const size = dimension > 0 ? dimension : PAGE_HEIGHT_FALLBACK_PX
    if (raw < 0) return -rubberBand(-raw, size)
    if (raw > max) return max + rubberBand(raw - max, size)
    return raw
  }

  /**
   * Clamp the scroll target into the scrollable range.
   * @returns true if the target was outside the range
   */
  private clampTargetToBounds(): boolean {
    const maxScrollX = Math.max(0, this.container.scrollWidth - this.container.clientWidth)
    const maxScrollY = Math.max(0, this.container.scrollHeight - this.container.clientHeight)
    const x = Math.max(0, Math.min(this.target.x, maxScrollX))
    const y = Math.max(0, Math.min(this.target.y, maxScrollY))
    const changed = x !== this.target.x || y !== this.target.y
    this.target = { x, y }
    this.rawTarget = { x, y }
    return changed
  }

  getScroll(): { x: number; y: number } {
    return { ...this.scroll }
  }

  scrollTo(x: number, y: number): void {
    this.target = { x, y }
    this.rawTarget = { x, y }
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
    // Cancel any pending RAF to prevent callbacks after disable
    if (this.pendingRafId !== null) {
      cancelAnimationFrame(this.pendingRafId)
      this.pendingRafId = null
    }
    // Call onScrollEnd if we were scrolling
    if (this.isScrolling) {
      this.isScrolling = false
      this.config.onScrollEnd?.()
    }
  }

  destroy(): void {
    this.destroyed = true

    // Cancel any pending RAF to prevent memory leak
    if (this.pendingRafId !== null) {
      cancelAnimationFrame(this.pendingRafId)
      this.pendingRafId = null
    }

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
