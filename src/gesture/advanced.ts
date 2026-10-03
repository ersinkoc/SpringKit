/**
 * Advanced Gesture System - Multi-touch gestures with spring physics
 *
 * Provides pinch, rotate, swipe, and long-press detection with
 * velocity tracking and spring-based animations.
 */

import { createSpringValue, type SpringValue } from '../core/spring-value.js'
import { clamp } from '../utils/math.js'

// ============ Types ============

/**
 * Point in 2D space
 */
export interface Point {
  x: number
  y: number
}

/**
 * Gesture state shared across all gesture types
 */
export interface GestureState {
  /** Whether gesture is active */
  active: boolean
  /** First touch/pointer position */
  first: boolean
  /** Last event in gesture */
  last: boolean
  /** Event that triggered the gesture */
  event: PointerEvent | TouchEvent
  /** Time since gesture started (ms) */
  elapsedTime: number
  /** Gesture was cancelled */
  cancelled: boolean
}

/**
 * Pinch gesture state
 */
export interface PinchState extends GestureState {
  /** Current scale (1 = original) */
  scale: number
  /** Scale velocity */
  velocity: number
  /** Distance between fingers */
  distance: number
  /** Initial distance between fingers */
  initialDistance: number
  /** Center point between fingers */
  origin: Point
  /** Movement delta */
  movement: number
  /** Scale offset from initial */
  offset: number
}

/**
 * Rotate gesture state
 */
export interface RotateState extends GestureState {
  /** Current rotation in degrees */
  angle: number
  /** Angular velocity (degrees/second) */
  velocity: number
  /** Initial angle */
  initialAngle: number
  /** Center point of rotation */
  origin: Point
  /** Rotation movement */
  movement: number
  /**
   * Rotation accumulated by the previous gestures (the `angle` when the
   * current gesture started; updated when a gesture ends)
   */
  offset: number
}

/**
 * Swipe gesture state
 */
export interface SwipeState extends GestureState {
  /** Swipe direction */
  direction: 'up' | 'down' | 'left' | 'right' | null
  /** Swipe velocity (px/s) */
  velocity: Point
  /** Distance swiped */
  distance: Point
  /** Movement from start */
  movement: Point
  /** Swipe duration in ms */
  duration: number
}

/**
 * Long press gesture state
 */
export interface LongPressState extends GestureState {
  /** Press position */
  position: Point
  /** Press duration in ms */
  duration: number
  /** Whether threshold was reached */
  triggered: boolean
}

/**
 * Pinch gesture configuration
 */
export interface PinchConfig {
  /** Minimum scale (default: 0.1) */
  minScale?: number
  /** Maximum scale (default: 10) */
  maxScale?: number
  /** Enable rubber band at limits */
  rubberBand?: boolean
  /** Rubber band factor (0-1) */
  rubberBandFactor?: number
  /** Spring config for release animation */
  spring?: {
    stiffness?: number
    damping?: number
  }
  /** Callback on pinch */
  onPinch?: (state: PinchState) => void
  /** Callback when pinch starts */
  onPinchStart?: (state: PinchState) => void
  /** Callback when pinch ends */
  onPinchEnd?: (state: PinchState) => void
}

/**
 * Rotate gesture configuration
 */
export interface RotateConfig {
  /** Enable rotation (default: true) */
  enabled?: boolean
  /** Minimum rotation threshold in degrees */
  threshold?: number
  /** Callback on rotate */
  onRotate?: (state: RotateState) => void
  /** Callback when rotation starts */
  onRotateStart?: (state: RotateState) => void
  /** Callback when rotation ends */
  onRotateEnd?: (state: RotateState) => void
}

/**
 * Swipe gesture configuration
 */
export interface SwipeConfig {
  /**
   * A swipe is a release that travelled at least `distanceThreshold` px or
   * was at least this fast, in px/s (default 500). A fast release must still
   * have travelled `minDistance` px.
   */
  velocityThreshold?: number
  /** Distance (px) that counts as a swipe at any speed (default 50) */
  distanceThreshold?: number
  /**
   * Minimum travel (px) along the swipe direction for any swipe, including
   * fast ones that pass `velocityThreshold` (default 10), so a quick jitter
   * or tap isn't reported as a swipe
   */
  minDistance?: number
  /** Maximum duration for swipe (ms) */
  maxDuration?: number
  /** Axis constraint */
  axis?: 'x' | 'y' | 'both'
  /** Callback on swipe */
  onSwipe?: (state: SwipeState) => void
  /** Callback when swipe starts */
  onSwipeStart?: (state: SwipeState) => void
  /** Callback when swipe ends */
  onSwipeEnd?: (state: SwipeState) => void
}

/**
 * Long press gesture configuration
 */
export interface LongPressConfig {
  /** Duration to trigger long press (ms, default: 500) */
  threshold?: number
  /** Movement tolerance (pixels) */
  movementTolerance?: number
  /** Callback when long press triggers */
  onLongPress?: (state: LongPressState) => void
  /** Callback on press start */
  onPressStart?: (state: LongPressState) => void
  /** Callback on press end */
  onPressEnd?: (state: LongPressState) => void
}

/**
 * Combined gesture configuration
 */
export interface GestureConfig {
  pinch?: PinchConfig
  rotate?: RotateConfig
  swipe?: SwipeConfig
  longPress?: LongPressConfig
}

/**
 * Gesture controller interface
 */
export interface GestureController {
  /** Enable gestures */
  enable(): void
  /** Disable gestures */
  disable(): void
  /** Check if enabled */
  isEnabled(): boolean
  /** Destroy and cleanup */
  destroy(): void
}

// ============ Utility Functions ============

/**
 * Calculate distance between two points
 */
function getDistance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Calculate angle between two points in degrees
 */
function getAngle(p1: Point, p2: Point): number {
  return (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI
}

/**
 * Get center point between two points
 */
function getCenter(p1: Point, p2: Point): Point {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  }
}

/**
 * Apply rubber band effect - overshoot past a limit is scaled down by `factor`
 * (0 = hard stop, 1 = no resistance). The overshoot is always reduced, never
 * amplified, so the result stays between the limit and the raw value.
 */
function rubberBand(value: number, min: number, max: number, factor: number): number {
  const f = clamp(factor, 0, 1)
  if (value < min) {
    return min - (min - value) * f
  }
  if (value > max) {
    return max + (value - max) * f
  }
  return value
}

/**
 * Normalize an angle difference to the range [-180, 180]
 */
function normalizeAngleDelta(delta: number): number {
  let d = delta % 360
  if (d > 180) d -= 360
  if (d < -180) d += 360
  return d
}

/**
 * Capture a pointer. Capturing can throw (e.g. the pointer is no longer
 * active); the gesture then still works while the pointer is over the element.
 */
function capturePointer(element: HTMLElement, pointerId: number): void {
  try {
    element.setPointerCapture(pointerId)
  } catch {
    // Not capturable: continue without capture
  }
}

/**
 * If the pointer hasn't moved for this long before release, the last
 * measured velocity is considered stale
 */
const VELOCITY_STALE_MS = 100

// ============ Pinch Gesture ============

/**
 * Create pinch gesture handler
 *
 * @example
 * ```ts
 * const pinch = createPinchGesture(element, {
 *   onPinch: (state) => {
 *     element.style.transform = `scale(${state.scale})`
 *   },
 * })
 * ```
 */
export function createPinchGesture(
  element: HTMLElement,
  config: PinchConfig = {}
): GestureController {
  const {
    minScale = 0.1,
    maxScale = 10,
    rubberBand: enableRubberBand = true,
    rubberBandFactor = 0.5,
    spring = { stiffness: 200, damping: 20 },
    onPinch,
    onPinchStart,
    onPinchEnd,
  } = config

  let enabled = true
  let active = false
  let initialDistance = 0
  let initialScale = 1
  let currentScale = 1
  let lastScale = 1
  let velocity = 0
  let startTime = 0
  let lastTime = 0

  const touches = new Map<number, Point>()
  let scaleSpring: SpringValue | null = null

  const createState = (event: TouchEvent, first = false, last = false): PinchState => {
    const touchArray = Array.from(touches.values())
    const p1 = touchArray[0] ?? { x: 0, y: 0 }
    const p2 = touchArray[1] ?? { x: 0, y: 0 }
    const origin = touchArray.length >= 2 ? getCenter(p1, p2) : { x: 0, y: 0 }

    return {
      active,
      first,
      last,
      event,
      elapsedTime: performance.now() - startTime,
      cancelled: false,
      scale: currentScale,
      velocity,
      distance: touchArray.length >= 2 ? getDistance(p1, p2) : 0,
      initialDistance,
      origin,
      movement: currentScale - initialScale,
      offset: currentScale - 1,
    }
  }

  const handleTouchStart = (e: TouchEvent) => {
    if (!enabled) return

    for (const touch of Array.from(e.changedTouches)) {
      touches.set(touch.identifier, { x: touch.clientX, y: touch.clientY })
    }

    if (touches.size === 2) {
      const touchArray = Array.from(touches.values())
      const p1 = touchArray[0]!
      const p2 = touchArray[1]!
      initialDistance = getDistance(p1, p2)
      initialScale = currentScale
      startTime = performance.now()
      lastTime = startTime
      active = true

      // Cancel any spring animation
      scaleSpring?.destroy()
      scaleSpring = null

      onPinchStart?.(createState(e, true, false))
    }
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!enabled || !active) return

    for (const touch of Array.from(e.changedTouches)) {
      if (touches.has(touch.identifier)) {
        touches.set(touch.identifier, { x: touch.clientX, y: touch.clientY })
      }
    }

    if (touches.size >= 2) {
      const touchArray = Array.from(touches.values())
      const p1 = touchArray[0]!
      const p2 = touchArray[1]!
      const currentDistance = getDistance(p1, p2)
      const now = performance.now()
      const dt = now - lastTime

      // Fingers started at the same point - use this as the reference distance
      // instead of dividing by zero
      if (initialDistance === 0) {
        initialDistance = currentDistance
        initialScale = currentScale
        lastTime = now
        return
      }

      // Calculate new scale
      let newScale = initialScale * (currentDistance / initialDistance)

      // Apply rubber band at limits
      if (enableRubberBand) {
        newScale = rubberBand(newScale, minScale, maxScale, rubberBandFactor)
      } else {
        newScale = clamp(newScale, minScale, maxScale)
      }

      // Calculate velocity - update lastScale BEFORE calculating to avoid race condition
      lastScale = currentScale
      currentScale = newScale
      velocity = dt > 0 ? ((currentScale - lastScale) / dt) * 1000 : 0
      lastTime = now

      onPinch?.(createState(e, false, false))
      e.preventDefault()
    }
  }

  const handleTouchEnd = (e: TouchEvent) => {
    for (const touch of Array.from(e.changedTouches)) {
      touches.delete(touch.identifier)
    }

    if (active && touches.size < 2) {
      active = false

      // Spring back to limits if out of bounds
      if (currentScale < minScale || currentScale > maxScale) {
        const targetScale = clamp(currentScale, minScale, maxScale)
        scaleSpring = createSpringValue(currentScale, {
          stiffness: spring.stiffness,
          damping: spring.damping,
        })

        scaleSpring.subscribe(() => {
          currentScale = scaleSpring!.get()
          onPinch?.(createState(e, false, false))
        })

        scaleSpring.set(targetScale)
      }

      onPinchEnd?.(createState(e, false, true))
    } else if (active) {
      // A finger was lifted but two or more remain: the pinching pair may
      // have changed, so continue from the current scale with the remaining
      // pair as the reference (otherwise the scale jumps)
      const touchArray = Array.from(touches.values())
      initialDistance = getDistance(touchArray[0]!, touchArray[1]!)
      initialScale = currentScale
    }
  }

  element.addEventListener('touchstart', handleTouchStart, { passive: false })
  element.addEventListener('touchmove', handleTouchMove, { passive: false })
  element.addEventListener('touchend', handleTouchEnd)
  element.addEventListener('touchcancel', handleTouchEnd)

  return {
    enable: () => { enabled = true },
    disable: () => {
      enabled = false
      // Cancel any active spring animation when disabled
      scaleSpring?.destroy()
      scaleSpring = null
    },
    isEnabled: () => enabled,
    destroy: () => {
      // Remove listeners - note: passive option not needed for removal
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchcancel', handleTouchEnd)
      scaleSpring?.destroy()
      scaleSpring = null
      touches.clear()
    },
  }
}

// ============ Rotate Gesture ============

/**
 * Create rotate gesture handler
 *
 * @example
 * ```ts
 * const rotate = createRotateGesture(element, {
 *   onRotate: (state) => {
 *     element.style.transform = `rotate(${state.angle}deg)`
 *   },
 * })
 * ```
 */
export function createRotateGesture(
  element: HTMLElement,
  config: RotateConfig = {}
): GestureController {
  const {
    enabled: initialEnabled = true,
    threshold = 0,
    onRotate,
    onRotateStart,
    onRotateEnd,
  } = config

  let enabled = initialEnabled
  let active = false
  let initialAngle = 0
  let currentAngle = 0
  let lastAngle = 0
  let velocity = 0
  let startTime = 0
  let lastTime = 0
  let angleOffset = 0
  // Rotation (`angle`) when the current gesture started
  let gestureStartAngle = 0
  // Last raw (wrapped) finger angle and the unwrapped rotation accumulated since start
  let lastRawAngle = 0
  let accumulatedDelta = 0

  const touches = new Map<number, Point>()

  const createState = (event: TouchEvent, first = false, last = false): RotateState => {
    const touchArray = Array.from(touches.values())
    const p1 = touchArray[0] ?? { x: 0, y: 0 }
    const p2 = touchArray[1] ?? { x: 0, y: 0 }
    const origin = touchArray.length >= 2 ? getCenter(p1, p2) : { x: 0, y: 0 }

    return {
      active,
      first,
      last,
      event,
      elapsedTime: performance.now() - startTime,
      cancelled: false,
      angle: currentAngle,
      velocity,
      initialAngle,
      origin,
      // Rotation during this gesture (initialAngle is the raw finger angle,
      // not a rotation, so it can't be subtracted from `angle`)
      movement: currentAngle - gestureStartAngle,
      offset: angleOffset,
    }
  }

  const handleTouchStart = (e: TouchEvent) => {
    if (!enabled) return

    for (const touch of Array.from(e.changedTouches)) {
      touches.set(touch.identifier, { x: touch.clientX, y: touch.clientY })
    }

    if (touches.size === 2) {
      const touchArray = Array.from(touches.values())
      const p1 = touchArray[0]!
      const p2 = touchArray[1]!
      initialAngle = getAngle(p1, p2)
      lastRawAngle = initialAngle
      accumulatedDelta = 0
      startTime = performance.now()
      lastTime = startTime
      lastAngle = currentAngle
      gestureStartAngle = currentAngle
      active = true

      onRotateStart?.(createState(e, true, false))
    }
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!enabled || !active) return

    for (const touch of Array.from(e.changedTouches)) {
      if (touches.has(touch.identifier)) {
        touches.set(touch.identifier, { x: touch.clientX, y: touch.clientY })
      }
    }

    if (touches.size >= 2) {
      const touchArray = Array.from(touches.values())
      const p1 = touchArray[0]!
      const p2 = touchArray[1]!
      const newAngle = getAngle(p1, p2)
      const now = performance.now()
      const dt = now - lastTime

      // Accumulate the per-move change so wrap-around at ±180° is handled
      // and rotations beyond half a turn keep counting instead of flipping sign
      accumulatedDelta += normalizeAngleDelta(newAngle - lastRawAngle)
      lastRawAngle = newAngle
      const angleDelta = accumulatedDelta

      // Apply threshold
      if (Math.abs(angleDelta) >= threshold) {
        currentAngle = angleOffset + angleDelta

        // Calculate velocity
        velocity = dt > 0 ? ((currentAngle - lastAngle) / dt) * 1000 : 0
        lastAngle = currentAngle
        lastTime = now

        onRotate?.(createState(e, false, false))
      }

      e.preventDefault()
    }
  }

  const handleTouchEnd = (e: TouchEvent) => {
    for (const touch of Array.from(e.changedTouches)) {
      touches.delete(touch.identifier)
    }

    if (active && touches.size < 2) {
      active = false
      angleOffset = currentAngle
      onRotateEnd?.(createState(e, false, true))
    } else if (active) {
      // A finger was lifted but two or more remain: measure further rotation
      // from the remaining pair's angle (otherwise the angle jumps)
      const touchArray = Array.from(touches.values())
      lastRawAngle = getAngle(touchArray[0]!, touchArray[1]!)
    }
  }

  element.addEventListener('touchstart', handleTouchStart, { passive: false })
  element.addEventListener('touchmove', handleTouchMove, { passive: false })
  element.addEventListener('touchend', handleTouchEnd)
  element.addEventListener('touchcancel', handleTouchEnd)

  return {
    enable: () => { enabled = true },
    disable: () => { enabled = false },
    isEnabled: () => enabled,
    destroy: () => {
      // Remove listeners - note: passive option not needed for removal
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchcancel', handleTouchEnd)
      touches.clear()
    },
  }
}

// ============ Swipe Gesture ============

/**
 * Create swipe gesture handler
 *
 * @example
 * ```ts
 * const swipe = createSwipeGesture(element, {
 *   onSwipe: (state) => {
 *     if (state.direction === 'left') {
 *       goToNextSlide()
 *     }
 *   },
 * })
 * ```
 */
export function createSwipeGesture(
  element: HTMLElement,
  config: SwipeConfig = {}
): GestureController {
  const {
    velocityThreshold = 500,
    distanceThreshold = 50,
    minDistance = 10,
    maxDuration = 300,
    axis = 'both',
    onSwipe,
    onSwipeStart,
    onSwipeEnd,
  } = config

  let enabled = true
  let active = false
  let startPoint: Point = { x: 0, y: 0 }
  let lastPoint: Point = { x: 0, y: 0 }
  let startTime = 0
  let lastTime = 0
  let pointerId: number | null = null
  // Velocity measured between the last two pointer samples (px/s)
  let moveVelocity: Point = { x: 0, y: 0 }
  // disable() was called during the current gesture: it ends as cancelled
  let cancelledByDisable = false

  const createState = (
    event: PointerEvent,
    first = false,
    last = false,
    direction: SwipeState['direction'] = null,
    point: Point = { x: event.clientX, y: event.clientY },
    velocityOverride?: Point,
    cancelled = false
  ): SwipeState => {
    const now = performance.now()
    const duration = now - startTime
    const dt = now - lastTime

    const movement = {
      x: point.x - startPoint.x,
      y: point.y - startPoint.y,
    }

    // px/s, like every other velocity in SpringKit
    const velocity = velocityOverride ?? {
      x: dt > 0 ? ((point.x - lastPoint.x) / dt) * 1000 : 0,
      y: dt > 0 ? ((point.y - lastPoint.y) / dt) * 1000 : 0,
    }

    return {
      active,
      first,
      last,
      event,
      elapsedTime: duration,
      cancelled,
      direction,
      velocity,
      distance: movement,
      movement,
      duration,
    }
  }

  const detectDirection = (movement: Point, velocity: Point): SwipeState['direction'] => {
    const absX = Math.abs(movement.x)
    const absY = Math.abs(movement.y)
    const velX = Math.abs(velocity.x)
    const velY = Math.abs(velocity.y)

    // Check if meets thresholds (a fast release must still travel minDistance)
    const meetsDistanceX = absX >= distanceThreshold
    const meetsDistanceY = absY >= distanceThreshold
    const meetsVelocityX = velX >= velocityThreshold && absX >= minDistance
    const meetsVelocityY = velY >= velocityThreshold && absY >= minDistance

    // Determine primary direction based on axis constraint
    if (axis === 'x' || (axis === 'both' && absX > absY)) {
      if ((meetsDistanceX || meetsVelocityX)) {
        return movement.x > 0 ? 'right' : 'left'
      }
    }

    if (axis === 'y' || (axis === 'both' && absY > absX)) {
      if ((meetsDistanceY || meetsVelocityY)) {
        return movement.y > 0 ? 'down' : 'up'
      }
    }

    return null
  }

  const handlePointerDown = (e: PointerEvent) => {
    if (!enabled || pointerId !== null) return

    pointerId = e.pointerId
    startPoint = { x: e.clientX, y: e.clientY }
    lastPoint = { ...startPoint }
    startTime = performance.now()
    lastTime = startTime
    moveVelocity = { x: 0, y: 0 }
    cancelledByDisable = false
    active = true

    capturePointer(element, e.pointerId)
    addSwipeEndGuards()
    onSwipeStart?.(createState(e, true, false))
  }

  const handlePointerMove = (e: PointerEvent) => {
    if (!enabled || !active || e.pointerId !== pointerId) return

    const now = performance.now()
    const dt = now - lastTime
    if (dt > 0) {
      moveVelocity = {
        x: ((e.clientX - lastPoint.x) / dt) * 1000,
        y: ((e.clientY - lastPoint.y) / dt) * 1000,
      }
    }
    lastPoint = { x: e.clientX, y: e.clientY }
    lastTime = now
  }

  const handlePointerUp = (e: PointerEvent) => {
    if (!active || e.pointerId !== pointerId) return
    // Disabled during the gesture: it never counts as a swipe
    if (!enabled || cancelledByDisable) {
      handlePointerCancel(e)
      return
    }

    active = false
    pointerId = null
    removeSwipeEndGuards()

    const now = performance.now()
    const duration = now - startTime

    // Only detect swipe if within max duration
    if (duration <= maxDuration) {
      const movement = {
        x: e.clientX - startPoint.x,
        y: e.clientY - startPoint.y,
      }
      // pointerup usually fires at the same position as the last pointermove,
      // so fall back to the velocity measured between the last move samples
      const dt = now - lastTime
      const movedSinceLastSample = e.clientX !== lastPoint.x || e.clientY !== lastPoint.y
      const velocity = movedSinceLastSample && dt > 0
        ? { x: ((e.clientX - lastPoint.x) / dt) * 1000, y: ((e.clientY - lastPoint.y) / dt) * 1000 }
        : dt <= VELOCITY_STALE_MS ? moveVelocity : { x: 0, y: 0 }

      const direction = detectDirection(movement, velocity)
      const state = createState(e, false, true, direction, undefined, velocity)

      if (direction) {
        onSwipe?.(state)
      }
      onSwipeEnd?.(state)
    } else {
      onSwipeEnd?.(createState(e, false, true, null))
    }

    // Safety check: element might be removed from DOM
    try {
      element.releasePointerCapture(e.pointerId)
    } catch {
      // Ignore errors if pointer capture was already released
    }
  }

  // A cancelled pointer (e.g. the browser took over for scrolling) must never
  // be reported as a swipe; its coordinates are not reliable either
  const handlePointerCancel = (e: PointerEvent) => {
    if (!active || e.pointerId !== pointerId) return

    active = false
    pointerId = null
    removeSwipeEndGuards()

    onSwipeEnd?.(createState(e, false, true, null, lastPoint, { x: 0, y: 0 }, true))

    try {
      element.releasePointerCapture(e.pointerId)
    } catch {
      // Ignore errors if pointer capture was already released
    }
  }

  // If the element never receives the pointerup (capture lost because the
  // element was removed, released outside the window, ...) the gesture would
  // stay locked. Listen on window during the gesture and treat a lost capture
  // as a cancel so the state always resets.
  const handleLostCapture = (e: PointerEvent) => handlePointerCancel(e)
  const addSwipeEndGuards = () => {
    element.addEventListener('lostpointercapture', handleLostCapture)
    if (typeof window !== 'undefined') {
      window.addEventListener('pointerup', handlePointerUp)
      window.addEventListener('pointercancel', handlePointerCancel)
    }
  }
  function removeSwipeEndGuards(): void {
    element.removeEventListener('lostpointercapture', handleLostCapture)
    if (typeof window !== 'undefined') {
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerCancel)
    }
  }

  element.addEventListener('pointerdown', handlePointerDown)
  element.addEventListener('pointermove', handlePointerMove)
  element.addEventListener('pointerup', handlePointerUp)
  element.addEventListener('pointercancel', handlePointerCancel)

  return {
    enable: () => { enabled = true },
    disable: () => {
      enabled = false
      if (active) cancelledByDisable = true
    },
    isEnabled: () => enabled,
    destroy: () => {
      element.removeEventListener('pointerdown', handlePointerDown)
      element.removeEventListener('pointermove', handlePointerMove)
      element.removeEventListener('pointerup', handlePointerUp)
      element.removeEventListener('pointercancel', handlePointerCancel)
      removeSwipeEndGuards()
      active = false
      pointerId = null
    },
  }
}

// ============ Long Press Gesture ============

/**
 * Create long press gesture handler
 *
 * @example
 * ```ts
 * const longPress = createLongPressGesture(element, {
 *   threshold: 500,
 *   onLongPress: (state) => {
 *     showContextMenu(state.position)
 *   },
 * })
 * ```
 */
export function createLongPressGesture(
  element: HTMLElement,
  config: LongPressConfig = {}
): GestureController {
  const {
    threshold = 500,
    movementTolerance = 10,
    onLongPress,
    onPressStart,
    onPressEnd,
  } = config

  let enabled = true
  let active = false
  let triggered = false
  let startPoint: Point = { x: 0, y: 0 }
  let startTime = 0
  let timerId: ReturnType<typeof setTimeout> | null = null
  let pointerId: number | null = null

  const createState = (event: PointerEvent, first = false, last = false, cancelled = false): LongPressState => ({
    active,
    first,
    last,
    event,
    elapsedTime: performance.now() - startTime,
    cancelled,
    position: startPoint,
    duration: performance.now() - startTime,
    triggered,
  })

  const handlePointerDown = (e: PointerEvent) => {
    if (!enabled || pointerId !== null) return

    pointerId = e.pointerId
    startPoint = { x: e.clientX, y: e.clientY }
    startTime = performance.now()
    active = true
    triggered = false

    capturePointer(element, e.pointerId)
    addPressEndGuards()
    onPressStart?.(createState(e, true, false))

    // Start timer for long press
    timerId = setTimeout(() => {
      if (active && !triggered) {
        triggered = true
        onLongPress?.(createState(e, false, false))
      }
    }, threshold)
  }

  const handlePointerMove = (e: PointerEvent) => {
    if (!active || e.pointerId !== pointerId) return

    // Check if moved beyond tolerance
    const dx = e.clientX - startPoint.x
    const dy = e.clientY - startPoint.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance > movementTolerance) {
      // Cancel long press
      if (timerId) {
        clearTimeout(timerId)
        timerId = null
      }
    }
  }

  const handlePointerUp = (e: PointerEvent) => {
    if (!active || e.pointerId !== pointerId) return

    active = false
    pointerId = null
    removePressEndGuards()

    if (timerId) {
      clearTimeout(timerId)
      timerId = null
    }

    onPressEnd?.(createState(e, false, true, e.type !== 'pointerup'))

    // Safety check: element might be removed from DOM
    try {
      element.releasePointerCapture(e.pointerId)
    } catch {
      // Ignore errors if pointer capture was already released
    }
  }

  // Reset even when the element never sees the pointerup (see swipe above):
  // window-level up/cancel during the press, and a lost capture cancels it
  const addPressEndGuards = () => {
    element.addEventListener('lostpointercapture', handlePointerUp)
    if (typeof window !== 'undefined') {
      window.addEventListener('pointerup', handlePointerUp)
      window.addEventListener('pointercancel', handlePointerUp)
    }
  }
  function removePressEndGuards(): void {
    element.removeEventListener('lostpointercapture', handlePointerUp)
    if (typeof window !== 'undefined') {
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
  }

  element.addEventListener('pointerdown', handlePointerDown)
  element.addEventListener('pointermove', handlePointerMove)
  element.addEventListener('pointerup', handlePointerUp)
  element.addEventListener('pointercancel', handlePointerUp)

  return {
    enable: () => { enabled = true },
    disable: () => {
      enabled = false
      // Clear timer when disabled to prevent callbacks after disable
      if (timerId) {
        clearTimeout(timerId)
        timerId = null
      }
    },
    isEnabled: () => enabled,
    destroy: () => {
      if (timerId) clearTimeout(timerId)
      timerId = null
      element.removeEventListener('pointerdown', handlePointerDown)
      element.removeEventListener('pointermove', handlePointerMove)
      element.removeEventListener('pointerup', handlePointerUp)
      element.removeEventListener('pointercancel', handlePointerUp)
      removePressEndGuards()
      active = false
      pointerId = null
    },
  }
}

// ============ Combined Gesture Handler ============

/**
 * Create combined gesture handler for multiple gesture types
 *
 * @example
 * ```ts
 * const gestures = createGestures(element, {
 *   pinch: {
 *     onPinch: (state) => console.log('Scale:', state.scale),
 *   },
 *   rotate: {
 *     onRotate: (state) => console.log('Angle:', state.angle),
 *   },
 *   swipe: {
 *     onSwipe: (state) => console.log('Direction:', state.direction),
 *   },
 * })
 * ```
 */
export function createGestures(
  element: HTMLElement,
  config: GestureConfig
): GestureController {
  const controllers: GestureController[] = []

  if (config.pinch) {
    controllers.push(createPinchGesture(element, config.pinch))
  }
  if (config.rotate) {
    controllers.push(createRotateGesture(element, config.rotate))
  }
  if (config.swipe) {
    controllers.push(createSwipeGesture(element, config.swipe))
  }
  if (config.longPress) {
    controllers.push(createLongPressGesture(element, config.longPress))
  }

  return {
    enable: () => controllers.forEach(c => c.enable()),
    disable: () => controllers.forEach(c => c.disable()),
    isEnabled: () => controllers.every(c => c.isEnabled()),
    destroy: () => controllers.forEach(c => c.destroy()),
  }
}
