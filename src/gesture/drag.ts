import { createSpringValue, type SpringValue } from '../core/spring-value.js'
import { clamp } from '../utils/math.js'

/**
 * Snap point configuration
 */
export interface SnapPoint {
  x: number
  y: number
  /** Attraction radius (pixels) */
  radius?: number
}

/**
 * Snap configuration
 */
export interface SnapConfig {
  /** Array of snap points */
  points?: SnapPoint[]
  /** Snap to grid with given cell size */
  grid?: { x: number; y: number }
  /** Velocity threshold to snap (lower = snap more easily) */
  velocityThreshold?: number
  /** Whether to snap only on release */
  snapOnRelease?: boolean
}

/**
 * Constraint configuration - supports multiple constraint types
 */
export interface DragConstraints {
  /** Simple box bounds */
  bounds?: {
    left?: number
    right?: number
    top?: number
    bottom?: number
  }
  /** Constrain to parent element */
  constrainToParent?: boolean
  /** Constrain to specific element */
  constrainToElement?: HTMLElement
  /** Padding when constrained to element */
  constraintPadding?: number | { top?: number; right?: number; bottom?: number; left?: number }
  /** Lock to specific axis */
  lockAxis?: 'x' | 'y' | null
  /** Lock to 45-degree diagonal lines */
  lockToDiagonal?: boolean
}

/**
 * Drag spring configuration interface
 */
export interface DragSpringConfig {
  /** Spring stiffness (default: 100) */
  stiffness?: number
  /** Damping ratio (default: 10) */
  damping?: number
  /** Mass (default: 1) */
  mass?: number
  /** Initial velocity */
  velocity?: number
  /** Speed threshold for considering spring at rest (default: 0.01) */
  restSpeed?: number
  /** Position threshold for considering spring at rest (default: 0.01) */
  restDelta?: number
  /** Clamp value to [from, to] range */
  clamp?: boolean
  /** Axis constraint (deprecated, use constraints.lockAxis) */
  axis?: 'x' | 'y' | 'both'
  /** Boundary constraints (deprecated, use constraints.bounds) */
  bounds?: {
    left?: number
    right?: number
    top?: number
    bottom?: number
  }
  /** Enhanced constraint configuration */
  constraints?: DragConstraints
  /** Snap configuration */
  snap?: SnapConfig
  /** Enable rubber band effect at bounds */
  rubberBand?: boolean
  /** Rubber band stretch factor (0-1, default: 0.5) */
  rubberBandFactor?: number
  /** Elastic bounce power (0-1, default: 0.3) */
  elasticBounce?: number
  /** Momentum after release (true = continue with velocity) */
  momentum?: boolean
  /** Deceleration rate for momentum (0-1, default: 0.95) */
  momentumDecay?: number
  /** Elastic factor (0-1) - how much element can be dragged outside bounds */
  dragElastic?: number | boolean | { top?: number; right?: number; bottom?: number; left?: number }
  /** Modify the target position during inertia (useful for snap-to-grid) */
  modifyTarget?: (target: { x: number; y: number }) => { x: number; y: number }
  /** Callback called when drag starts */
  onDragStart?: (event: PointerEvent) => void
  /** Callback called during drag */
  onDrag?: (x: number, y: number, event: PointerEvent) => void
  /** Callback called when drag ends */
  onDragEnd?: (x: number, y: number, velocity: { x: number; y: number }) => void
  /** Callback called on position update */
  onUpdate?: (x: number, y: number) => void
  /** Callback when snapping to a point */
  onSnapStart?: (point: SnapPoint) => void
  /** Callback when snap animation completes */
  onSnapComplete?: (point: SnapPoint) => void
  /** Callback when hitting bounds */
  onBoundsHit?: (edge: 'left' | 'right' | 'top' | 'bottom') => void
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
  /** Check if currently dragging */
  isDragging(): boolean
  /** Reset to initial position */
  reset(): void
  /** Get current position */
  getPosition(): { x: number; y: number }
  /** Get current velocity */
  getVelocity(): { x: number; y: number }
  /** Set position instantly */
  setPosition(x: number, y: number): void
  /** Jump to position (instant, alias for setPosition) */
  jumpTo(x: number, y: number): void
  /** Animate to position with spring physics */
  animateTo(x: number, y: number): void
  /** Release with velocity */
  release(velocityX: number, velocityY: number): void
  /** Snap to nearest point */
  snapToNearest(): void
  /** Snap to specific point */
  snapTo(point: SnapPoint): void
  /** Update constraints dynamically */
  setConstraints(constraints: DragConstraints): void
  /** Update snap configuration dynamically */
  setSnap(snap: SnapConfig): void
  /** Clean up resources */
  destroy(): void
}

/**
 * Default drag spring configuration
 */
const defaultDragConfig = {
  axis: 'both' as const,
  rubberBand: false,
  rubberBandFactor: 0.5,
  elasticBounce: 0.3,
  momentum: true,
  momentumDecay: 0.95,
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
  private _isDragging = false
  private startPosition = { x: 0, y: 0 }
  private pointerStart = { x: 0, y: 0 }
  private lastPosition = { x: 0, y: 0 }
  private lastTime = 0
  private velocity = { x: 0, y: 0 }
  private currentSnap: SnapPoint | null = null
  private snapTimeoutId: ReturnType<typeof setTimeout> | null = null
  private destroyed = false

  // Springs for each axis
  private springX: SpringValue
  private springY: SpringValue

  constructor(element: HTMLElement, config: DragSpringConfig = {}) {
    this.element = element
    this.config = { ...defaultDragConfig, ...config }

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
      if (!this._isDragging) {
        this.position.x = this.springX.get()
        if (this.config.onUpdate) {
          this.config.onUpdate(this.position.x, this.position.y)
        }
      }
    })

    this.springY.subscribe(() => {
      if (!this._isDragging) {
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

    this._isDragging = true
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

    // Calculate instant velocity with minimum dt to prevent spikes
    // Use at least 16ms (one frame) to avoid unrealistic velocity on first move
    const safeDt = Math.max(dt, 16)
    const instantVelocity = {
      x: (e.clientX - this.lastPosition.x) / safeDt,
      y: (e.clientY - this.lastPosition.y) / safeDt,
    }

    // Smooth velocity using exponential moving average to prevent jarring animations
    // This prevents velocity spikes on quick movements or first move events
    const smoothingFactor = 0.2
    this.velocity = {
      x: this.velocity.x * (1 - smoothingFactor) + instantVelocity.x * smoothingFactor,
      y: this.velocity.y * (1 - smoothingFactor) + instantVelocity.y * smoothingFactor,
    }

    this.lastPosition = { x: e.clientX, y: e.clientY }
    this.lastTime = now

    // Calculate new position
    let newX = this.startPosition.x + (e.clientX - this.pointerStart.x)
    let newY = this.startPosition.y + (e.clientY - this.pointerStart.y)

    // Apply bounds with elastic effect
    if (this.config.bounds) {
      newX = this.applyBounds(
        newX,
        this.config.bounds.left ?? -Infinity,
        this.config.bounds.right ?? Infinity,
        'x'
      )
      newY = this.applyBounds(
        newY,
        this.config.bounds.top ?? -Infinity,
        this.config.bounds.bottom ?? Infinity,
        'y'
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

  private getElasticFactor(edge: 'left' | 'right' | 'top' | 'bottom'): number {
    const dragElastic = this.config.dragElastic

    // If not specified, use rubberBand settings
    if (dragElastic === undefined) {
      if (this.config.rubberBand) {
        return this.config.rubberBandFactor ?? 0.5
      }
      return 0 // No elasticity
    }

    // Boolean: true = 0.5, false = 0
    if (typeof dragElastic === 'boolean') {
      return dragElastic ? 0.5 : 0
    }

    // Number: use directly
    if (typeof dragElastic === 'number') {
      return clamp(dragElastic, 0, 1)
    }

    // Object: per-edge configuration
    return clamp(dragElastic[edge] ?? 0.5, 0, 1)
  }

  private applyBounds(value: number, min: number, max: number, axis: 'x' | 'y' = 'x'): number {
    if (!isFinite(min) && !isFinite(max)) return value

    const actualMin = isFinite(min) ? min : -Infinity
    const actualMax = isFinite(max) ? max : Infinity

    // Determine elastic factor based on which edge
    const hasElastic = this.config.dragElastic !== undefined || this.config.rubberBand

    if (hasElastic) {
      if (value < actualMin) {
        const elasticFactor = this.getElasticFactor(axis === 'x' ? 'left' : 'top')
        return actualMin - (actualMin - value) * elasticFactor
      }
      if (value > actualMax) {
        const elasticFactor = this.getElasticFactor(axis === 'x' ? 'right' : 'bottom')
        return actualMax + (value - actualMax) * elasticFactor
      }
    }

    return clamp(value, actualMin, actualMax)
  }

  private onPointerUp = (e: PointerEvent): void => {
    this._isDragging = false

    // Safety check: element might be removed from DOM during drag
    if (this.element && document.contains(this.element)) {
      try {
        this.element.releasePointerCapture(e.pointerId)
      } catch {
        // Ignore errors if pointer capture was already released
      }
      this.element.removeEventListener('pointermove', this.onPointerMove)
      this.element.removeEventListener('pointerup', this.onPointerUp)
      this.element.removeEventListener('pointercancel', this.onPointerUp)
    }

    // Check for snap points first
    if (this.config.snap?.snapOnRelease !== false) {
      const snapPoint = this.findNearestSnapPoint()
      if (snapPoint) {
        this.snapTo(snapPoint)
        if (this.config.onDragEnd) {
          this.config.onDragEnd(this.position.x, this.position.y, this.velocity)
        }
        return
      }
    }

    // Scale velocity for spring (convert from pixels/ms to more reasonable units)
    this.release(this.velocity.x * 16, this.velocity.y * 16)

    if (this.config.onDragEnd) {
      this.config.onDragEnd(this.position.x, this.position.y, this.velocity)
    }
  }

  private findNearestSnapPoint(): SnapPoint | null {
    const snap = this.config.snap
    if (!snap) return null

    // Check grid snapping first
    if (snap.grid) {
      const gridX = Math.round(this.position.x / snap.grid.x) * snap.grid.x
      const gridY = Math.round(this.position.y / snap.grid.y) * snap.grid.y
      return { x: gridX, y: gridY }
    }

    // Check snap points
    if (snap.points && snap.points.length > 0) {
      const velocityMagnitude = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2)
      const threshold = snap.velocityThreshold ?? 0.5

      // Don't snap if moving too fast
      if (velocityMagnitude > threshold) return null

      let nearestPoint: SnapPoint | null = null
      let nearestDistance = Infinity

      for (const point of snap.points) {
        const dx = this.position.x - point.x
        const dy = this.position.y - point.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const radius = point.radius ?? 50

        if (distance < radius && distance < nearestDistance) {
          nearestDistance = distance
          nearestPoint = point
        }
      }

      return nearestPoint
    }

    return null
  }

  private getEffectiveBounds(): { left: number; right: number; top: number; bottom: number } {
    // Start with explicit bounds
    const bounds = {
      left: this.config.bounds?.left ?? this.config.constraints?.bounds?.left ?? -Infinity,
      right: this.config.bounds?.right ?? this.config.constraints?.bounds?.right ?? Infinity,
      top: this.config.bounds?.top ?? this.config.constraints?.bounds?.top ?? -Infinity,
      bottom: this.config.bounds?.bottom ?? this.config.constraints?.bounds?.bottom ?? Infinity,
    }

    const constraints = this.config.constraints

    // Handle constrainToParent
    if (constraints?.constrainToParent && this.element.parentElement) {
      const parent = this.element.parentElement
      const parentRect = parent.getBoundingClientRect()
      const elementRect = this.element.getBoundingClientRect()

      const padding = this.normalizePadding(constraints.constraintPadding)

      bounds.left = Math.max(bounds.left, padding.left)
      bounds.right = Math.min(bounds.right, parentRect.width - elementRect.width - padding.right)
      bounds.top = Math.max(bounds.top, padding.top)
      bounds.bottom = Math.min(bounds.bottom, parentRect.height - elementRect.height - padding.bottom)
    }

    // Handle constrainToElement
    if (constraints?.constrainToElement) {
      const constraintRect = constraints.constrainToElement.getBoundingClientRect()
      const elementRect = this.element.getBoundingClientRect()
      const parentRect = this.element.parentElement?.getBoundingClientRect() ?? { left: 0, top: 0 }

      const padding = this.normalizePadding(constraints.constraintPadding)

      const offsetX = constraintRect.left - parentRect.left
      const offsetY = constraintRect.top - parentRect.top

      bounds.left = Math.max(bounds.left, offsetX + padding.left)
      bounds.right = Math.min(bounds.right, offsetX + constraintRect.width - elementRect.width - padding.right)
      bounds.top = Math.max(bounds.top, offsetY + padding.top)
      bounds.bottom = Math.min(bounds.bottom, offsetY + constraintRect.height - elementRect.height - padding.bottom)
    }

    return bounds
  }

  private normalizePadding(padding: number | { top?: number; right?: number; bottom?: number; left?: number } | undefined): { top: number; right: number; bottom: number; left: number } {
    if (typeof padding === 'number') {
      return { top: padding, right: padding, bottom: padding, left: padding }
    }
    return {
      top: padding?.top ?? 0,
      right: padding?.right ?? 0,
      bottom: padding?.bottom ?? 0,
      left: padding?.left ?? 0,
    }
  }

  enable(): void {
    this.enabled = true
  }

  disable(): void {
    this.enabled = false
    if (this._isDragging) {
      this._isDragging = false
    }
  }

  isEnabled(): boolean {
    return this.enabled
  }

  isDragging(): boolean {
    return this._isDragging
  }

  reset(): void {
    this.springX.jump(0)
    this.springY.jump(0)
    this.position = { x: 0, y: 0 }
    this.velocity = { x: 0, y: 0 }
    this.currentSnap = null
    // Explicit if for better branch coverage
    if (this.config.onUpdate) {
      this.config.onUpdate(0, 0)
    }
  }

  getPosition(): { x: number; y: number } {
    return { ...this.position }
  }

  getVelocity(): { x: number; y: number } {
    return { ...this.velocity }
  }

  setPosition(x: number, y: number): void {
    // Instant position change (same as jumpTo for backwards compatibility)
    this.position = { x, y }
    this.springX.jump(x)
    this.springY.jump(y)
  }

  jumpTo(x: number, y: number): void {
    // Update position immediately for synchronous access
    this.position = { x, y }
    this.springX.jump(x)
    this.springY.jump(y)
    if (this.config.onUpdate) {
      this.config.onUpdate(x, y)
    }
  }

  animateTo(x: number, y: number): void {
    // Animate to the position with spring physics
    this.springX.set(x)
    this.springY.set(y)
  }

  release(velocityX: number, velocityY: number): void {
    const bounds = this.getEffectiveBounds()
    const { left, right, top, bottom } = bounds

    let targetX = this.position.x
    let targetY = this.position.y

    // Apply momentum if enabled
    if (this.config.momentum) {
      // Clamp decay to valid range [0, 0.99] to prevent division by zero
      const rawDecay = this.config.momentumDecay ?? 0.95
      const decay = Math.max(0, Math.min(0.99, rawDecay))
      const decayFactor = decay < 1 ? (1 / (1 - decay)) : 100 // Fallback for edge case
      const momentumX = velocityX * decayFactor * 0.1
      const momentumY = velocityY * decayFactor * 0.1
      targetX += momentumX
      targetY += momentumY
    }

    // Apply modifyTarget for snap-to-grid or custom modifications
    if (this.config.modifyTarget) {
      const modified = this.config.modifyTarget({ x: targetX, y: targetY })
      targetX = modified.x
      targetY = modified.y
    }

    // Clamp to bounds
    targetX = clamp(targetX, left, right)
    targetY = clamp(targetY, top, bottom)

    // Notify bounds hit
    if (this.config.onBoundsHit) {
      if (this.position.x < left) this.config.onBoundsHit('left')
      if (this.position.x > right) this.config.onBoundsHit('right')
      if (this.position.y < top) this.config.onBoundsHit('top')
      if (this.position.y > bottom) this.config.onBoundsHit('bottom')
    }

    // Animate to target with elastic bounce
    if (targetX !== this.position.x || this.position.x < left || this.position.x > right) {
      this.springX.set(targetX, { velocity: velocityX })
    }
    if (targetY !== this.position.y || this.position.y < top || this.position.y > bottom) {
      this.springY.set(targetY, { velocity: velocityY })
    }
  }

  snapToNearest(): void {
    const snapPoint = this.findNearestSnapPoint()
    if (snapPoint) {
      this.snapTo(snapPoint)
    }
  }

  snapTo(point: SnapPoint): void {
    this.currentSnap = point
    if (this.config.onSnapStart) {
      this.config.onSnapStart(point)
    }

    this.springX.set(point.x)
    this.springY.set(point.y)

    // Cancel previous snap timeout to prevent memory leak
    if (this.snapTimeoutId !== null) {
      clearTimeout(this.snapTimeoutId)
    }

    // Simple completion detection with tracked timeout
    this.snapTimeoutId = setTimeout(() => {
      this.snapTimeoutId = null
      if (!this.destroyed && this.currentSnap === point && this.config.onSnapComplete) {
        this.config.onSnapComplete(point)
      }
    }, 500)
  }

  setConstraints(constraints: DragConstraints): void {
    this.config.constraints = constraints
  }

  setSnap(snap: SnapConfig): void {
    this.config.snap = snap
  }

  destroy(): void {
    this.destroyed = true

    // Cancel any pending snap timeout
    if (this.snapTimeoutId !== null) {
      clearTimeout(this.snapTimeoutId)
      this.snapTimeoutId = null
    }

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
