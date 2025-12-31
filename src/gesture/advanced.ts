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
  /** Rotation offset from initial */
  offset: number
}

/**
 * Swipe gesture state
 */
export interface SwipeState extends GestureState {
  /** Swipe direction */
  direction: 'up' | 'down' | 'left' | 'right' | null
  /** Swipe velocity */
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
  /** Minimum velocity to trigger swipe (pixels/ms) */
  velocityThreshold?: number
  /** Minimum distance to trigger swipe (pixels) */
  distanceThreshold?: number
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
 * Apply rubber band effect
 */
function rubberBand(value: number, min: number, max: number, factor: number): number {
  if (value < min) {
    return min - Math.pow(min - value, factor)
  }
  if (value > max) {
    return max + Math.pow(value - max, factor)
  }
  return value
}

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

      // Calculate new scale
      let newScale = initialScale * (currentDistance / initialDistance)

      // Apply rubber band at limits
      if (enableRubberBand) {
        newScale = rubberBand(newScale, minScale, maxScale, rubberBandFactor)
      } else {
        newScale = clamp(newScale, minScale, maxScale)
      }

      // Calculate velocity
      velocity = dt > 0 ? ((newScale - lastScale) / dt) * 1000 : 0
      lastScale = currentScale
      currentScale = newScale
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
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchcancel', handleTouchEnd)
      scaleSpring?.destroy()
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
      movement: currentAngle - initialAngle,
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
      startTime = performance.now()
      lastTime = startTime
      lastAngle = currentAngle
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

      // Calculate angle delta (handle wrap-around)
      let angleDelta = newAngle - initialAngle
      if (angleDelta > 180) angleDelta -= 360
      if (angleDelta < -180) angleDelta += 360

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
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchcancel', handleTouchEnd)
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
    velocityThreshold = 0.5,
    distanceThreshold = 50,
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

  const createState = (
    event: PointerEvent,
    first = false,
    last = false,
    direction: SwipeState['direction'] = null
  ): SwipeState => {
    const now = performance.now()
    const duration = now - startTime
    const dt = now - lastTime

    const movement = {
      x: event.clientX - startPoint.x,
      y: event.clientY - startPoint.y,
    }

    const velocity = {
      x: dt > 0 ? (event.clientX - lastPoint.x) / dt : 0,
      y: dt > 0 ? (event.clientY - lastPoint.y) / dt : 0,
    }

    return {
      active,
      first,
      last,
      event,
      elapsedTime: duration,
      cancelled: false,
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

    // Check if meets thresholds
    const meetsDistanceX = absX >= distanceThreshold
    const meetsDistanceY = absY >= distanceThreshold
    const meetsVelocityX = velX >= velocityThreshold
    const meetsVelocityY = velY >= velocityThreshold

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
    active = true

    element.setPointerCapture(e.pointerId)
    onSwipeStart?.(createState(e, true, false))
  }

  const handlePointerMove = (e: PointerEvent) => {
    if (!enabled || !active || e.pointerId !== pointerId) return

    const now = performance.now()
    lastPoint = { x: e.clientX, y: e.clientY }
    lastTime = now
  }

  const handlePointerUp = (e: PointerEvent) => {
    if (!active || e.pointerId !== pointerId) return

    active = false
    pointerId = null

    const duration = performance.now() - startTime

    // Only detect swipe if within max duration
    if (duration <= maxDuration) {
      const movement = {
        x: e.clientX - startPoint.x,
        y: e.clientY - startPoint.y,
      }
      const dt = performance.now() - lastTime
      const velocity = {
        x: dt > 0 ? (e.clientX - lastPoint.x) / dt : 0,
        y: dt > 0 ? (e.clientY - lastPoint.y) / dt : 0,
      }

      const direction = detectDirection(movement, velocity)
      const state = createState(e, false, true, direction)

      if (direction) {
        onSwipe?.(state)
      }
      onSwipeEnd?.(state)
    } else {
      onSwipeEnd?.(createState(e, false, true, null))
    }

    element.releasePointerCapture(e.pointerId)
  }

  element.addEventListener('pointerdown', handlePointerDown)
  element.addEventListener('pointermove', handlePointerMove)
  element.addEventListener('pointerup', handlePointerUp)
  element.addEventListener('pointercancel', handlePointerUp)

  return {
    enable: () => { enabled = true },
    disable: () => { enabled = false },
    isEnabled: () => enabled,
    destroy: () => {
      element.removeEventListener('pointerdown', handlePointerDown)
      element.removeEventListener('pointermove', handlePointerMove)
      element.removeEventListener('pointerup', handlePointerUp)
      element.removeEventListener('pointercancel', handlePointerUp)
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

  const createState = (event: PointerEvent, first = false, last = false): LongPressState => ({
    active,
    first,
    last,
    event,
    elapsedTime: performance.now() - startTime,
    cancelled: false,
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

    element.setPointerCapture(e.pointerId)
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

    if (timerId) {
      clearTimeout(timerId)
      timerId = null
    }

    onPressEnd?.(createState(e, false, true))
    element.releasePointerCapture(e.pointerId)
  }

  element.addEventListener('pointerdown', handlePointerDown)
  element.addEventListener('pointermove', handlePointerMove)
  element.addEventListener('pointerup', handlePointerUp)
  element.addEventListener('pointercancel', handlePointerUp)

  return {
    enable: () => { enabled = true },
    disable: () => { enabled = false },
    isEnabled: () => enabled,
    destroy: () => {
      if (timerId) clearTimeout(timerId)
      element.removeEventListener('pointerdown', handlePointerDown)
      element.removeEventListener('pointermove', handlePointerMove)
      element.removeEventListener('pointerup', handlePointerUp)
      element.removeEventListener('pointercancel', handlePointerUp)
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
