import type { SpringConfig } from '../core/config.js'
import { defaultConfig } from '../core/config.js'
import { createSpringValue, type SpringValue } from '../core/spring-value.js'
import { clamp } from '../utils/math.js'

/**
 * Drag spring configuration interface
 */
export interface DragSpringConfig extends SpringConfig {
  /** Axis constraint */
  axis?: 'x' | 'y' | 'both'
  /** Boundary constraints */
  bounds?: {
    left?: number
    right?: number
    top?: number
    bottom?: number
  }
  /** Enable rubber band effect at bounds */
  rubberBand?: boolean
  /** Rubber band stretch factor (0-1) */
  rubberBandFactor?: number
  /** Callback called when drag starts */
  onDragStart?: (event: PointerEvent) => void
  /** Callback called during drag */
  onDrag?: (x: number, y: number, event: PointerEvent) => void
  /** Callback called when drag ends */
  onDragEnd?: (x: number, y: number, velocity: { x: number; y: number }) => void
  /** Callback called on position update */
  onUpdate?: (x: number, y: number) => void
}

/**
 * Drag spring interface
 */
export interface DragSpring {
  /** Enable drag interaction */
  enable(): void
  /** Disable drag interaction */
  disable(): void
  /** Check if currently enabled */
  isEnabled(): boolean
  /** Reset to initial position */
  reset(): void
  /** Get current position */
  getPosition(): { x: number; y: number }
  /** Set position (animated) */
  setPosition(x: number, y: number): void
  /** Release with velocity */
  release(velocityX: number, velocityY: number): void
  /** Clean up resources */
  destroy(): void
}

/**
 * Default drag spring configuration
 */
const defaultDragConfig: Required<Omit<DragSpringConfig, 'onDragStart' | 'onDrag' | 'onDragEnd' | 'onUpdate' | 'velocity'>> = {
  axis: 'both',
  rubberBand: false,
  rubberBandFactor: 0.5,
  stiffness: 200,
  damping: 20,
  mass: 1,
  restSpeed: 0.01,
  restDelta: 0.01,
  clamp: false,
}

/**
 * Drag spring implementation
 */
class DragSpringImpl implements DragSpring {
  private element: HTMLElement
  private config: DragSpringConfig
  private enabled = true
  private position = { x: 0, y: 0 }
  private isDragging = false
  private startPosition = { x: 0, y: 0 }
  private pointerStart = { x: 0, y: 0 }
  private lastPosition = { x: 0, y: 0 }
  private lastTime = 0
  private velocity = { x: 0, y: 0 }

  // Springs for each axis
  private springX: SpringValue
  private springY: SpringValue

  constructor(element: HTMLElement, config: DragSpringConfig = {}) {
    this.element = element
    this.config = { ...defaultDragConfig, ...config }

    this.springX = createSpringValue(0, this.config)
    this.springY = createSpringValue(0, this.config)

    // Subscribe to spring updates
    this.springX.subscribe(() => {
      if (!this.isDragging) {
        this.position.x = this.springX.get()
        if (this.config.onUpdate) {
          this.config.onUpdate(this.position.x, this.position.y)
        }
      }
    })

    this.springY.subscribe(() => {
      if (!this.isDragging) {
        this.position.y = this.springY.get()
        if (this.config.onUpdate) {
          this.config.onUpdate(this.position.x, this.position.y)
        }
      }
    })

    this.setupPointerEvents()
  }

  private setupPointerEvents(): void {
    this.element.addEventListener('pointerdown', this.onPointerDown)
  }

  private onPointerDown = (e: PointerEvent): void => {
    if (!this.enabled || e.button !== 0) return

    this.isDragging = true
    this.startPosition = { ...this.position }
    this.pointerStart = { x: e.clientX, y: e.clientY }
    this.lastPosition = { x: e.clientX, y: e.clientY }
    this.lastTime = performance.now()
    this.velocity = { x: 0, y: 0 }

    this.element.setPointerCapture(e.pointerId)
    this.element.addEventListener('pointermove', this.onPointerMove)
    this.element.addEventListener('pointerup', this.onPointerUp)
    this.element.addEventListener('pointercancel', this.onPointerUp)

    // Explicit if for better branch coverage
    if (this.config.onDragStart) {
      this.config.onDragStart(e)
    }
  }

  private onPointerMove = (e: PointerEvent): void => {
    const now = performance.now()
    const dt = now - this.lastTime

    // Calculate velocity (pixels per ms, scaled to pixels per second)
    this.velocity = {
      x: (e.clientX - this.lastPosition.x) / Math.max(dt, 1),
      y: (e.clientY - this.lastPosition.y) / Math.max(dt, 1),
    }

    this.lastPosition = { x: e.clientX, y: e.clientY }
    this.lastTime = now

    // Calculate new position
    let newX = this.startPosition.x + (e.clientX - this.pointerStart.x)
    let newY = this.startPosition.y + (e.clientY - this.pointerStart.y)

    // Apply bounds with rubber band
    if (this.config.bounds) {
      newX = this.applyBounds(
        newX,
        this.config.bounds.left ?? -Infinity,
        this.config.bounds.right ?? Infinity
      )
      newY = this.applyBounds(
        newY,
        this.config.bounds.top ?? -Infinity,
        this.config.bounds.bottom ?? Infinity
      )
    }

    // Apply axis constraint
    if (this.config.axis === 'x') {
      newY = 0
    } else if (this.config.axis === 'y') {
      newX = 0
    }

    this.position = { x: newX, y: newY }
    if (this.config.onDrag) {
      this.config.onDrag(newX, newY, e)
    }
    if (this.config.onUpdate) {
      this.config.onUpdate(newX, newY)
    }
  }

  private applyBounds(value: number, min: number, max: number): number {
    if (!isFinite(min) && !isFinite(max)) return value

    const actualMin = isFinite(min) ? min : -Infinity
    const actualMax = isFinite(max) ? max : Infinity

    if (this.config.rubberBand) {
      const factor = this.config.rubberBandFactor || 0.5
      if (value < actualMin) {
        return actualMin - (actualMin - value) * factor
      }
      if (value > actualMax) {
        return actualMax + (value - actualMax) * factor
      }
    }

    return clamp(value, actualMin, actualMax)
  }

  private onPointerUp = (e: PointerEvent): void => {
    this.isDragging = false

    this.element.releasePointerCapture(e.pointerId)
    this.element.removeEventListener('pointermove', this.onPointerMove)
    this.element.removeEventListener('pointerup', this.onPointerUp)
    this.element.removeEventListener('pointercancel', this.onPointerUp)

    // Scale velocity for spring (convert from pixels/ms to more reasonable units)
    this.release(this.velocity.x * 16, this.velocity.y * 16)

    if (this.config.onDragEnd) {
      this.config.onDragEnd(this.position.x, this.position.y, this.velocity)
    }
  }

  enable(): void {
    this.enabled = true
  }

  disable(): void {
    this.enabled = false
    if (this.isDragging) {
      this.isDragging = false
    }
  }

  isEnabled(): boolean {
    return this.enabled
  }

  reset(): void {
    this.springX.jump(0)
    this.springY.jump(0)
    this.position = { x: 0, y: 0 }
    // Explicit if for better branch coverage
    if (this.config.onUpdate) {
      this.config.onUpdate(0, 0)
    }
  }

  getPosition(): { x: number; y: number } {
    return { ...this.position }
  }

  setPosition(x: number, y: number): void {
    // Update position immediately for synchronous access
    this.position = { x, y }
    // Animate to the new position
    this.springX.jump(x)
    this.springY.jump(y)
  }

  release(velocityX: number, velocityY: number): void {
    // Animate back to bounds if outside
    if (this.config.bounds) {
      const {
        left = -Infinity,
        right = Infinity,
        top = -Infinity,
        bottom = Infinity,
      } = this.config.bounds

      const targetX = clamp(this.position.x, left, right)
      const targetY = clamp(this.position.y, top, bottom)

      if (targetX !== this.position.x) {
        this.springX.set(targetX, { velocity: velocityX })
      }
      if (targetY !== this.position.y) {
        this.springY.set(targetY, { velocity: velocityY })
      }
    }
  }

  destroy(): void {
    this.element.removeEventListener('pointerdown', this.onPointerDown)
    this.springX.destroy()
    this.springY.destroy()
  }
}

/**
 * Create a drag spring
 *
 * @param element - HTML element to make draggable
 * @param config - Drag spring configuration
 * @returns Drag spring controller
 *
 * @example
 * ```ts
 * const drag = createDragSpring(element, {
 *   onUpdate: (x, y) => {
 *     element.style.transform = `translate(${x}px, ${y}px)`
 *   },
 * })
 * ```
 */
export function createDragSpring(
  element: HTMLElement,
  config?: DragSpringConfig
): DragSpring {
  return new DragSpringImpl(element, config)
}
