import { createSpringValue, type SpringValue } from '../core/spring-value.js'
import { decay, type DecayAnimation } from '../animation/decay.js'
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
  /**
   * Snap points are only used when the release speed (magnitude of the
   * release velocity) is at or below this value, in px/s (default 500).
   * Lower = a slower release is needed to snap. Grid snapping ignores it.
   *
   * @remarks Since 2.0 this is in px/s (it was px/ms, default 0.5):
   * multiply 1.x values by 1000.
   */
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
  /**
   * Constrain to the parent element's padding box (inside its borders).
   * Bounds are relative to the element's own layout position inside the
   * parent (the drag position is a translate offset).
   */
  constrainToParent?: boolean
  /** Constrain to specific element */
  constrainToElement?: HTMLElement
  /** Padding when constrained to element */
  constraintPadding?: number | { top?: number; right?: number; bottom?: number; left?: number }
  /** Lock to specific axis */
  lockAxis?: 'x' | 'y' | null
  /**
   * Lock movement to the 45-degree diagonals through the drag start point
   * (the pointer delta is projected onto the nearest diagonal)
   */
  lockToDiagonal?: boolean
}

/**
 * Drag spring configuration interface
 */
export interface DragSpringConfig {
  /** Spring stiffness (default: 200) */
  stiffness?: number
  /** Spring damping (default: 20) */
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
  /**
   * Bounciness (0-1) of the spring when a release hits a bound or returns from
   * outside the bounds: 0 = no overshoot (critically damped), 1 = very bouncy.
   * When unset, the regular spring damping is used.
   */
  elasticBounce?: number
  /**
   * Momentum after release (default true): the element keeps moving with the
   * release velocity and slows down exponentially (a core `decay()`) until it
   * rests at the projected point (see `momentumDecay`). When false, a release
   * springs to the current position (after `modifyTarget`, kept inside the
   * bounds), starting with the release velocity: a fast release overshoots
   * and settles back.
   */
  momentum?: boolean
  /**
   * Fraction of the momentum velocity kept per 60fps frame (1000/60 ms),
   * in (0, 1), clamped to [0.01, 0.99] (default 0.95). Higher = glides
   * further. Frame-rate independent: applied as the per-millisecond
   * deceleration `momentumDecay^(60/1000)` of a core `decay()`.
   *
   * A release at `v` px/s comes to rest `v / (60 * -ln(momentumDecay))` px
   * further, with a time constant of `1 / (60 * -ln(momentumDecay))` s.
   * With the default 0.95 that is ~0.325 s: a 1000 px/s fling travels ~325px.
   */
  momentumDecay?: number
  /**
   * Elastic factor (0-1): how much the element can be dragged outside the
   * bounds. `true` = 0.5, `false` = 0. In the object form an edge that is not
   * given is not elastic (0).
   */
  dragElastic?: number | boolean | { top?: number; right?: number; bottom?: number; left?: number }
  /**
   * Adjust where a release comes to rest (useful for snap-to-grid). Receives
   * the projected rest point (position + momentum travel) and returns the new
   * one; the momentum velocity is rescaled so the motion lands exactly on it.
   * The result is still kept inside the bounds.
   */
  modifyTarget?: (target: { x: number; y: number }) => { x: number; y: number }
  /** Callback called when drag starts */
  onDragStart?: (event: PointerEvent) => void
  /** Callback called during drag */
  onDrag?: (x: number, y: number, event: PointerEvent) => void
  /**
   * Callback called when drag ends, with the release velocity of the element
   * in px/s (measured over the last 100ms of the drag; zero if the pointer
   * was held still for 100ms before release).
   *
   * @remarks Since 2.0 `velocity` is in px/s (it was px/ms).
   */
  onDragEnd?: (x: number, y: number, velocity: { x: number; y: number }) => void
  /** Callback called on position update */
  onUpdate?: (x: number, y: number) => void
  /** Callback when snapping to a point */
  onSnapStart?: (point: SnapPoint) => void
  /**
   * Callback when the snap animation comes to rest on the point (not called
   * when the snap is interrupted by a drag, release, jump or animateTo)
   */
  onSnapComplete?: (point: SnapPoint) => void
  /**
   * Callback when hitting bounds: on a release outside the bounds, or when
   * the momentum reaches a bound
   */
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
  /**
   * Current velocity in px/s: the tracked drag velocity while dragging,
   * otherwise the velocity of the running release / snap animation (0 at rest)
   */
  getVelocity(): { x: number; y: number }
  /** Set position instantly */
  setPosition(x: number, y: number): void
  /** Jump to position (instant, alias for setPosition) */
  jumpTo(x: number, y: number): void
  /** Animate to position with spring physics */
  animateTo(x: number, y: number): void
  /**
   * Release with a velocity in px/s, as if a drag ended at that speed: glide
   * with momentum (if enabled), honoring `modifyTarget` and the bounds. The
   * velocity is the exact initial velocity of the release motion.
   *
   * @remarks Since 2.0 the velocity is in px/s (1.x expected px/ms * 16).
   */
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
 * The drag velocity is measured over this window. If the pointer hasn't moved
 * for this long before release, the velocity is considered stale and the
 * release has no momentum.
 */
const VELOCITY_WINDOW_MS = 100

/** Default snap `velocityThreshold` (px/s) */
const DEFAULT_SNAP_VELOCITY_THRESHOLD = 500

/** Duration of a 60fps frame (ms): `momentumDecay` is defined per frame */
const FRAME_MS = 1000 / 60

/** Clamp range of `momentumDecay` (per frame) */
const MIN_MOMENTUM_DECAY = 0.01
const MAX_MOMENTUM_DECAY = 0.99

interface VelocitySample {
  x: number
  y: number
  t: number
}

/**
 * Velocity (px/s) from the samples of the last VELOCITY_WINDOW_MS
 * (the same estimate as the React `Animated` drag)
 */
function computeVelocity(samples: VelocitySample[], time: number): { x: number; y: number } {
  const last = samples[samples.length - 1]
  // Held still before `time`
  if (!last || time - last.t > VELOCITY_WINDOW_MS) return { x: 0, y: 0 }
  let base = last
  for (let i = samples.length - 2; i >= 0; i--) {
    const sample = samples[i]!
    if (last.t - sample.t > VELOCITY_WINDOW_MS) break
    base = sample
  }
  const dt = last.t - base.t
  if (dt <= 0) return { x: 0, y: 0 }
  const vx = ((last.x - base.x) / dt) * 1000
  const vy = ((last.y - base.y) / dt) * 1000
  return { x: Number.isFinite(vx) ? vx : 0, y: Number.isFinite(vy) ? vy : 0 }
}

/**
 * Project a movement onto the nearest 45-degree diagonal
 */
function projectOnDiagonal(dx: number, dy: number): { x: number; y: number } {
  // Diagonal direction (1, sign) with sign chosen by the quadrant
  const sign = dx * dy < 0 ? -1 : 1
  const amount = (dx + sign * dy) / 2
  return { x: amount, y: sign * amount }
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
  /** Element positions during the drag, for the velocity estimate */
  private samples: VelocitySample[] = []
  /** Drag velocity of the element (px/s) */
  private velocity = { x: 0, y: 0 }
  /** Running momentum animations, per axis */
  private momentum: { x: DecayAnimation | null; y: DecayAnimation | null } = { x: null, y: null }
  private currentSnap: SnapPoint | null = null
  private snapGeneration = 0
  private destroyed = false
  /** Pointer that owns the current drag (other pointers are ignored) */
  private activePointerId: number | null = null
  /** Bounds resolved at drag start (explicit bounds + element constraints) */
  private dragBounds = { left: -Infinity, right: Infinity, top: -Infinity, bottom: Infinity }

  // Springs for each axis
  private springX: SpringValue
  private springY: SpringValue

  constructor(element: HTMLElement, config: DragSpringConfig = {}) {
    this.element = element
    // Deep clone config to prevent mutation of external objects
    this.config = {
      ...defaultDragConfig,
      ...config,
      // Deep clone bounds if provided
      bounds: config.bounds ? { ...config.bounds } : undefined,
    }

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

    if (this._isDragging) {
      // Ignore additional pointers (multi-touch) while the active pointer still owns the drag
      const activeId = this.activePointerId
      if (activeId !== null && e.pointerId !== activeId && (this.element.hasPointerCapture?.(activeId) ?? true)) {
        return
      }
      // The previous pointer's up/cancel was lost - discard the stale drag
      this.endDrag(activeId)
    }

    this._isDragging = true
    this.activePointerId = e.pointerId
    // Stop any running release/snap animation and sync the springs with the
    // current position (subscribers ignore updates while dragging)
    this.stopMomentum()
    this.cancelSnap()
    this.springX.jump(this.position.x)
    this.springY.jump(this.position.y)
    this.dragBounds = this.getEffectiveBounds()
    this.startPosition = { ...this.position }
    this.pointerStart = { x: e.clientX, y: e.clientY }
    this.samples = [{ x: this.position.x, y: this.position.y, t: performance.now() }]
    this.velocity = { x: 0, y: 0 }

    try {
      this.element.setPointerCapture(e.pointerId)
    } catch {
      // Capture can fail (e.g. the pointer is no longer active): the drag still
      // works while the pointer is over the element
    }
    this.element.addEventListener('pointermove', this.onPointerMove)
    this.element.addEventListener('pointerup', this.onPointerUp)
    this.element.addEventListener('pointercancel', this.onPointerUp)
    // The capture can be lost without a pointerup (element removed, capture
    // released elsewhere...): end the drag like a pointerup then
    this.element.addEventListener('lostpointercapture', this.onPointerUp)

    // Explicit if for better branch coverage
    if (this.config.onDragStart) {
      this.config.onDragStart(e)
    }
  }

  private onPointerMove = (e: PointerEvent): void => {
    if (!this._isDragging || e.pointerId !== this.activePointerId) return

    // Calculate new position
    let deltaX = e.clientX - this.pointerStart.x
    let deltaY = e.clientY - this.pointerStart.y

    // Project the movement onto the nearest 45-degree diagonal
    if (this.config.constraints?.lockToDiagonal) {
      const diagonal = projectOnDiagonal(deltaX, deltaY)
      deltaX = diagonal.x
      deltaY = diagonal.y
    }

    let newX = this.startPosition.x + deltaX
    let newY = this.startPosition.y + deltaY

    // Apply bounds (explicit bounds and element constraints) with elastic effect
    newX = this.applyBounds(newX, this.dragBounds.left, this.dragBounds.right, 'x')
    newY = this.applyBounds(newY, this.dragBounds.top, this.dragBounds.bottom, 'y')

    // Apply axis constraint - keep the locked axis where it was, not at 0
    const lockAxis = this.config.constraints?.lockAxis
    if (lockAxis === 'x' || this.config.axis === 'x') {
      newY = this.startPosition.y
    } else if (lockAxis === 'y' || this.config.axis === 'y') {
      newX = this.startPosition.x
    }

    this.position = { x: newX, y: newY }
    this.recordSample(performance.now())
    if (this.config.onDrag) {
      this.config.onDrag(newX, newY, e)
    }
    if (this.config.onUpdate) {
      this.config.onUpdate(newX, newY)
    }
  }

  /**
   * Track the element position for the velocity estimate. This is the
   * velocity of the element (after axis / diagonal lock and bounds), so the
   * release motion continues exactly as the element was moving.
   */
  private recordSample(time: number): void {
    const last = this.samples[this.samples.length - 1]
    if (!last || last.x !== this.position.x || last.y !== this.position.y) {
      this.samples.push({ x: this.position.x, y: this.position.y, t: time })
      // Only the velocity window is needed
      while (this.samples.length > 2 && time - this.samples[0]!.t > VELOCITY_WINDOW_MS * 2) {
        this.samples.shift()
      }
    }
    this.velocity = computeVelocity(this.samples, time)
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

    // Object: per-edge configuration; a missing edge is not elastic
    // (like Framer Motion)
    return clamp(dragElastic[edge] ?? 0, 0, 1)
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
    if (!this._isDragging || e.pointerId !== this.activePointerId) return

    // Sync springs with the dragged position before leaving drag mode so the
    // release/snap animation starts from where the element actually is
    // (subscribers ignore this jump because we're still dragging)
    this.springX.jump(this.position.x)
    this.springY.jump(this.position.y)

    // Release velocity (px/s); zero if the pointer was held still before release
    this.velocity = computeVelocity(this.samples, performance.now())
    this.samples = []

    this.endDrag(e.pointerId)

    // Check for snap points first
    if (this.config.snap?.snapOnRelease !== false) {
      const snapPoint = this.findNearestSnapPoint()
      if (snapPoint) {
        // The snap spring starts with the release velocity (continuous motion)
        this.startSnap(snapPoint, this.velocity)
        if (this.config.onDragEnd) {
          this.config.onDragEnd(this.position.x, this.position.y, this.velocity)
        }
        return
      }
    }

    this.release(this.velocity.x, this.velocity.y)

    if (this.config.onDragEnd) {
      this.config.onDragEnd(this.position.x, this.position.y, this.velocity)
    }
  }

  /**
   * Leave drag mode: release pointer capture and remove move/up listeners
   */
  private endDrag(pointerId: number | null): void {
    this._isDragging = false
    this.activePointerId = null
    // Removed before releasing the capture, which fires lostpointercapture
    this.element.removeEventListener('lostpointercapture', this.onPointerUp)

    if (pointerId !== null) {
      try {
        this.element.releasePointerCapture(pointerId)
      } catch {
        // Ignore errors if pointer capture was already released or element was removed
      }
    }
    this.element.removeEventListener('pointermove', this.onPointerMove)
    this.element.removeEventListener('pointerup', this.onPointerUp)
    this.element.removeEventListener('pointercancel', this.onPointerUp)
  }

  private findNearestSnapPoint(): SnapPoint | null {
    const snap = this.config.snap
    if (!snap) return null

    // Check grid snapping first
    if (snap.grid) {
      // Guard against division by zero (a 0 cell size disables snapping on that axis)
      const gridX = snap.grid.x === 0 ? this.position.x : Math.round(this.position.x / snap.grid.x) * snap.grid.x
      const gridY = snap.grid.y === 0 ? this.position.y : Math.round(this.position.y / snap.grid.y) * snap.grid.y
      return { x: gridX, y: gridY }
    }

    // Check snap points
    if (snap.points && snap.points.length > 0) {
      const velocityMagnitude = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2)
      const threshold = snap.velocityThreshold ?? DEFAULT_SNAP_VELOCITY_THRESHOLD

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

    // The element's rect includes the current drag offset; subtract it to get
    // where the element sits in the layout (drag position 0, 0)
    const layoutOrigin = (): { left: number; top: number; width: number; height: number } => {
      const elementRect = this.element.getBoundingClientRect()
      return {
        left: elementRect.left - this.position.x,
        top: elementRect.top - this.position.y,
        width: elementRect.width,
        height: elementRect.height,
      }
    }

    // Handle constrainToParent
    if (constraints?.constrainToParent && this.element.parentElement) {
      const parent = this.element.parentElement
      const parentRect = parent.getBoundingClientRect()
      const element = layoutOrigin()

      const padding = this.normalizePadding(constraints.constraintPadding)

      // The parent's padding box (inside its borders). Elements without a
      // client box (inline, or no layout) report 0 sizes: use the border box.
      const hasClientBox = parent.clientWidth > 0 || parent.clientHeight > 0
      const boxLeft = parentRect.left + (hasClientBox ? parent.clientLeft : 0)
      const boxTop = parentRect.top + (hasClientBox ? parent.clientTop : 0)
      const boxWidth = hasClientBox ? parent.clientWidth : parentRect.width
      const boxHeight = hasClientBox ? parent.clientHeight : parentRect.height

      // Offset of the element's layout box inside the parent's padding box
      const offsetX = element.left - boxLeft
      const offsetY = element.top - boxTop

      bounds.left = Math.max(bounds.left, padding.left - offsetX)
      bounds.right = Math.min(bounds.right, boxWidth - element.width - padding.right - offsetX)
      bounds.top = Math.max(bounds.top, padding.top - offsetY)
      bounds.bottom = Math.min(bounds.bottom, boxHeight - element.height - padding.bottom - offsetY)
    }

    // Handle constrainToElement
    if (constraints?.constrainToElement) {
      const constraintRect = constraints.constrainToElement.getBoundingClientRect()
      const elementRect = layoutOrigin()

      const padding = this.normalizePadding(constraints.constraintPadding)

      // Constraint box relative to the element's layout position
      const offsetX = constraintRect.left - elementRect.left
      const offsetY = constraintRect.top - elementRect.top

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
      // Fully end the drag so later pointer moves no longer move the element.
      // The drag is cancelled without momentum: the element stays where it
      // is, or springs back inside the bounds if it was dragged past them.
      this.springX.jump(this.position.x)
      this.springY.jump(this.position.y)
      this.samples = []
      this.velocity = { x: 0, y: 0 }
      this.endDrag(this.activePointerId)

      const { left, right, top, bottom } = this.getEffectiveBounds()
      const targetX = clamp(this.position.x, left, right)
      const targetY = clamp(this.position.y, top, bottom)
      if (targetX !== this.position.x) this.springAxis('x', targetX, 0, this.getBounceConfig())
      if (targetY !== this.position.y) this.springAxis('y', targetY, 0, this.getBounceConfig())

      if (this.config.onDragEnd) {
        this.config.onDragEnd(this.position.x, this.position.y, { x: 0, y: 0 })
      }
    }
  }

  isEnabled(): boolean {
    return this.enabled
  }

  isDragging(): boolean {
    return this._isDragging
  }

  reset(): void {
    this.stopMomentum()
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
    if (this._isDragging) return { ...this.velocity }
    return {
      x: this.momentum.x ? this.momentum.x.getVelocity() : this.springX.getVelocity(),
      y: this.momentum.y ? this.momentum.y.getVelocity() : this.springY.getVelocity(),
    }
  }

  setPosition(x: number, y: number): void {
    // Guard against destroyed state and invalid values
    if (this.destroyed) return
    const safeX = Number.isFinite(x) ? x : this.position.x
    const safeY = Number.isFinite(y) ? y : this.position.y

    // Instant position change (same as jumpTo for backwards compatibility)
    this.stopMomentum()
    this.cancelSnap()
    this.position = { x: safeX, y: safeY }
    this.springX.jump(safeX)
    this.springY.jump(safeY)
  }

  jumpTo(x: number, y: number): void {
    // Guard against destroyed state and invalid values
    if (this.destroyed) return
    const safeX = Number.isFinite(x) ? x : this.position.x
    const safeY = Number.isFinite(y) ? y : this.position.y

    // Update position immediately for synchronous access
    this.stopMomentum()
    this.cancelSnap()
    this.position = { x: safeX, y: safeY }
    this.springX.jump(safeX)
    this.springY.jump(safeY)
    if (this.config.onUpdate) {
      this.config.onUpdate(safeX, safeY)
    }
  }

  animateTo(x: number, y: number): void {
    // Guard against destroyed state and invalid values
    if (this.destroyed) return
    const safeX = Number.isFinite(x) ? x : this.position.x
    const safeY = Number.isFinite(y) ? y : this.position.y

    // Animate to the position with spring physics; a running momentum hands
    // its velocity over to the spring (a running spring keeps its own)
    const velocity = this.stopMomentum()
    this.cancelSnap()
    this.springAxis('x', safeX, velocity.x)
    this.springAxis('y', safeY, velocity.y)
  }

  /**
   * Release model (velocities in px/s):
   *
   * - Inside the bounds, with momentum: each axis runs a core `decay()` that
   *   starts at exactly the release velocity and slows down exponentially
   *   (per-ms deceleration d = momentumDecay^(60/1000)), coming to rest at
   *   `position + v/1000 / -ln(d)`. `modifyTarget` receives that 2D rest
   *   point; the decay then lands exactly on the modified point. If the
   *   motion reaches a bound it stops there, or — with elasticity
   *   (`rubberBand` / `dragElastic`) or `elasticBounce` — hands its current
   *   velocity over to a bounce spring that settles on the bound (like the
   *   React `Animated` drag).
   *
   *   A spring towards the projected rest point is deliberately NOT used: it
   *   is pulled by stiffness * distance from the first frame (e.g. 200 *
   *   325px = 65000 px/s², +1000 px/s within one frame), so the element
   *   would jump in speed at release and overshoot the rest point. The decay
   *   keeps the velocity continuous and lands without overshoot.
   * - Outside the bounds: spring back to the nearest bound, starting with the
   *   release velocity (bounce per `elasticBounce`).
   * - Without momentum (or zero velocity): spring to the current position
   *   after `modifyTarget` (clamped to the bounds), starting with the release
   *   velocity.
   */
  release(velocityX: number, velocityY: number): void {
    if (this.destroyed) return
    let vx = Number.isFinite(velocityX) ? velocityX : 0
    let vy = Number.isFinite(velocityY) ? velocityY : 0

    // Keep the momentum on the diagonal too
    if (this.config.constraints?.lockToDiagonal) {
      const diagonal = projectOnDiagonal(vx, vy)
      vx = diagonal.x
      vy = diagonal.y
    }
    // No motion along a locked axis
    const lockAxis = this.config.constraints?.lockAxis
    if (lockAxis === 'x' || this.config.axis === 'x') vy = 0
    else if (lockAxis === 'y' || this.config.axis === 'y') vx = 0

    this.stopMomentum()
    this.cancelSnap()

    const { left, right, top, bottom } = this.getEffectiveBounds()
    const useMomentum = this.config.momentum !== false
    const deceleration = this.getMomentumDeceleration()
    // Travel until rest per px/s of release velocity: 1/1000 / -ln(d)
    const travelPerVelocity = useMomentum ? 1 / (1000 * -Math.log(deceleration)) : 0

    // Projected rest point
    let restX = this.position.x + vx * travelPerVelocity
    let restY = this.position.y + vy * travelPerVelocity

    // Apply modifyTarget for snap-to-grid or custom modifications
    if (this.config.modifyTarget) {
      const modified = this.config.modifyTarget({ x: restX, y: restY })
      if (Number.isFinite(modified?.x)) restX = modified.x
      if (Number.isFinite(modified?.y)) restY = modified.y
    }

    // Notify bounds hit (released outside the bounds)
    if (this.config.onBoundsHit) {
      if (this.position.x < left) this.config.onBoundsHit('left')
      if (this.position.x > right) this.config.onBoundsHit('right')
      if (this.position.y < top) this.config.onBoundsHit('top')
      if (this.position.y > bottom) this.config.onBoundsHit('bottom')
    }

    this.releaseAxis('x', vx, restX, left, right, useMomentum, deceleration)
    this.releaseAxis('y', vy, restY, top, bottom, useMomentum, deceleration)
  }

  /** Release one axis (see `release`) */
  private releaseAxis(
    axis: 'x' | 'y',
    velocity: number,
    rest: number,
    min: number,
    max: number,
    useMomentum: boolean,
    deceleration: number
  ): void {
    const from = this.position[axis]

    if (from < min || from > max) {
      // Outside the bounds: spring back, bouncing per elasticBounce
      this.springAxis(axis, clamp(from, min, max), velocity, this.getBounceConfig())
      return
    }

    if (useMomentum && velocity !== 0) {
      this.startMomentum(axis, from, velocity, rest, deceleration, min, max)
      return
    }

    const target = clamp(rest, min, max)
    // Also with target === from: the spring starts with the release velocity
    if (target !== from || velocity !== 0) {
      this.springAxis(axis, target, velocity, target !== rest ? this.getBounceConfig() : {})
    }
  }

  /**
   * Spring an axis to `to`. A given velocity (px/s) is the spring's initial
   * velocity; otherwise a running spring keeps its own.
   */
  private springAxis(
    axis: 'x' | 'y',
    to: number,
    velocity: number | undefined,
    extra: { damping?: number } = {}
  ): void {
    const springValue = axis === 'x' ? this.springX : this.springY
    if (velocity === undefined && extra.damping === undefined) {
      springValue.set(to)
    } else {
      springValue.set(to, { ...(velocity === undefined ? {} : { velocity }), ...extra })
    }
  }

  /**
   * Stop the momentum animations, syncing the springs with the current
   * position. Returns the velocity (px/s) of each stopped axis (undefined for
   * an axis without momentum).
   */
  private stopMomentum(): { x: number | undefined; y: number | undefined } {
    const stopped: { x: number | undefined; y: number | undefined } = { x: undefined, y: undefined }
    for (const axis of ['x', 'y'] as const) {
      const animation = this.momentum[axis]
      if (!animation) continue
      this.momentum[axis] = null
      stopped[axis] = animation.getVelocity()
      animation.destroy()
      // The spring was left where the momentum started
      ;(axis === 'x' ? this.springX : this.springY).jump(this.position[axis])
    }
    return stopped
  }

  /**
   * Momentum along one axis: exponential decay from `from` at `velocity`
   * (px/s) that comes to rest exactly at `target`. On reaching a bound it
   * stops there, or (with elasticity / elasticBounce) hands its current
   * velocity over to a bounce spring that settles on the bound.
   */
  private startMomentum(
    axis: 'x' | 'y',
    from: number,
    velocity: number,
    target: number,
    deceleration: number,
    min: number,
    max: number
  ): void {
    const springValue = axis === 'x' ? this.springX : this.springY
    // Stop a running spring on this axis (e.g. from a previous release)
    if (springValue.isAnimating() || springValue.get() !== from) springValue.jump(from)

    const animation: DecayAnimation = decay({
      from,
      velocity,
      deceleration,
      // Land exactly on the (possibly modified) rest point
      modifyTarget: () => target,
      onUpdate: (value) => {
        if (this.momentum[axis] !== animation) return
        if (value >= min && value <= max) {
          this.position[axis] = value
          this.config.onUpdate?.(this.position.x, this.position.y)
          return
        }
        // Reached a bound: stop there, or bounce off it
        const edge = value < min
          ? (axis === 'x' ? 'left' : 'top')
          : (axis === 'x' ? 'right' : 'bottom')
        const bound = value < min ? min : max
        const boundVelocity = animation.getVelocity()
        this.momentum[axis] = null
        animation.destroy()
        this.config.onBoundsHit?.(edge)
        const elastic = this.config.dragElastic !== undefined || this.config.rubberBand
          ? this.getElasticFactor(edge)
          : 0
        if (elastic > 0 || this.config.elasticBounce !== undefined) {
          // Spring subscribers update the position (and call onUpdate)
          springValue.jump(value)
          springValue.set(bound, { velocity: boundVelocity, ...this.getBounceConfig() })
        } else {
          springValue.jump(bound)
        }
      },
      onComplete: () => {
        if (this.momentum[axis] !== animation) return
        this.momentum[axis] = null
        // Keep the spring in sync with where the momentum came to rest
        springValue.jump(this.position[axis])
      },
    })
    this.momentum[axis] = animation
    animation.start()
  }

  /** Per-millisecond `decay()` deceleration from the per-frame `momentumDecay` */
  private getMomentumDeceleration(): number {
    const raw = this.config.momentumDecay
    const perFrame = raw !== undefined && Number.isFinite(raw)
      ? clamp(raw, MIN_MOMENTUM_DECAY, MAX_MOMENTUM_DECAY)
      : defaultDragConfig.momentumDecay
    return Math.pow(perFrame, 1 / FRAME_MS)
  }

  /**
   * Damping override for bound hits derived from `elasticBounce`
   * (0 = critically damped, 1 = barely damped). Empty when unset.
   */
  private getBounceConfig(): { damping?: number } {
    const bounce = this.config.elasticBounce
    if (bounce === undefined || !Number.isFinite(bounce)) return {}
    const stiffness = this.config.stiffness ?? defaultDragConfig.stiffness
    const mass = this.config.mass ?? defaultDragConfig.mass
    const dampingRatio = Math.max(0.05, 1 - clamp(bounce, 0, 1))
    return { damping: 2 * Math.sqrt(stiffness * mass) * dampingRatio }
  }

  snapToNearest(): void {
    const snapPoint = this.findNearestSnapPoint()
    if (snapPoint) {
      this.snapTo(snapPoint)
    }
  }

  snapTo(point: SnapPoint): void {
    if (this.destroyed) return
    // A running momentum hands its velocity over to the snap spring
    this.startSnap(point, this.stopMomentum())
  }

  /**
   * Spring to a snap point. A given velocity (px/s) is the initial velocity
   * of the snap spring; otherwise a running spring keeps its own.
   */
  private startSnap(point: SnapPoint, velocity: { x: number | undefined; y: number | undefined }): void {
    this.stopMomentum()
    this.currentSnap = point
    if (this.config.onSnapStart) {
      this.config.onSnapStart(point)
    }

    this.springAxis('x', point.x, velocity.x)
    this.springAxis('y', point.y, velocity.y)

    // Complete once both springs have settled. `finished` also settles when a
    // spring is interrupted; the generation / currentSnap check filters that
    // out (every interruption calls cancelSnap or starts a new snap).
    const generation = ++this.snapGeneration
    void Promise.all([this.springX.finished, this.springY.finished]).then(() => {
      if (!this.destroyed && generation === this.snapGeneration && this.currentSnap === point) {
        this.currentSnap = null
        this.config.onSnapComplete?.(point)
      }
    })
  }

  /**
   * Forget a running snap (it was interrupted by a drag, release, jump or
   * animateTo), so its onSnapComplete doesn't fire
   */
  private cancelSnap(): void {
    this.snapGeneration++
    this.currentSnap = null
  }

  setConstraints(constraints: DragConstraints): void {
    this.config.constraints = constraints
  }

  setSnap(snap: SnapConfig): void {
    this.config.snap = snap
  }

  destroy(): void {
    this.destroyed = true

    // Stop the momentum animations
    for (const axis of ['x', 'y'] as const) {
      this.momentum[axis]?.destroy()
      this.momentum[axis] = null
    }

    // Remove all event listeners (and release pointer capture if mid-drag)
    this.element.removeEventListener('pointerdown', this.onPointerDown)
    this.endDrag(this._isDragging ? this.activePointerId : null)

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
