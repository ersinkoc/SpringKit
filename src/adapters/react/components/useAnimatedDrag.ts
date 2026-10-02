import * as React from 'react'
import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { decay, spring } from '@oxog/springkit'
import { isBrowser } from '../utils/ssr.js'
import { MotionContext } from './MotionConfig.js'
import type { DragControls, DragStartOptions } from '../hooks/useDragControls.js'

// ============ Public types ============

/** A 2D point / vector */
export interface DragPoint {
  x: number
  y: number
}

/**
 * Pointer information passed to `onDragStart`, `onDrag` and `onDragEnd`
 * (same shape as Framer Motion's `PanInfo`)
 */
export interface PanInfo {
  /** Pointer position in viewport coordinates (clientX / clientY) */
  point: DragPoint
  /** Pointer movement since the previous event */
  delta: DragPoint
  /** Pointer movement since the pointerdown that started the gesture */
  offset: DragPoint
  /** Pointer velocity in px/s, from the samples of the last ~100ms */
  velocity: DragPoint
}

/**
 * Drag boundaries in px, relative to the element's resting position
 * (its position without any drag offset). Missing sides are unbounded.
 */
export interface DragConstraintsBox {
  top?: number
  left?: number
  right?: number
  bottom?: number
}

/**
 * Either a box (see `DragConstraintsBox`) or a ref to a container element
 * whose box the dragged element must stay inside
 */
export type DragConstraints = DragConstraintsBox | React.RefObject<Element | null>

/**
 * How far the element can be pulled beyond its constraints, from 0 (not at
 * all) to 1 (freely). `true` = 0.5, `false` = 0. Can be set per side.
 */
export type DragElastic = number | boolean | DragConstraintsBox

/** Tuning for the release (momentum / bounce) animation */
export interface DragTransition {
  /**
   * Fraction of velocity kept per millisecond during momentum, in (0, 1)
   * (default 0.998). Higher glides further. See `decay()`.
   */
  deceleration?: number
  /** Adjust where momentum comes to rest, per axis (e.g. snap to a grid) */
  modifyTarget?: (target: number) => number
  /** Stiffness of the spring that returns the element to a boundary / origin (default 200) */
  bounceStiffness?: number
  /** Damping of the spring that returns the element to a boundary / origin (default 40) */
  bounceDamping?: number
}

/** Drag props understood by Animated elements */
export interface AnimatedDragProps {
  /**
   * Make the element draggable: `true` / `'both'` for both axes, `'x'` or `'y'`
   * to lock to one axis. The drag offset is applied as a translation on top of
   * the animated transform and kept after release. `whileDrag` is active while
   * dragging.
   */
  drag?: boolean | 'x' | 'y' | 'both'
  /**
   * Controls from `useDragControls()` to start a drag from another element
   * (e.g. a handle): `onPointerDown={(e) => controls.start(e)}`. Requires `drag`.
   */
  dragControls?: DragControls
  /**
   * Whether a pointerdown on the element itself starts a drag (default true).
   * Set to false to only start drags through `dragControls`.
   */
  dragListener?: boolean
  /**
   * Limit dragging to a box `{ top, left, right, bottom }` (px, relative to the
   * element's resting position) or to the box of a container element (ref).
   * A container ref is re-measured when the window, the container or the
   * element resizes; an idle element left outside springs back inside.
   */
  dragConstraints?: DragConstraints
  /** Resistance beyond `dragConstraints`, 0..1 (default 0.5) */
  dragElastic?: DragElastic
  /** Keep moving with the release velocity and slow down (default true) */
  dragMomentum?: boolean
  /** Tune the momentum deceleration and the bounce spring */
  dragTransition?: DragTransition
  /** Spring back to the resting position (0, 0) on release (default false) */
  dragSnapToOrigin?: boolean
  /**
   * With `drag` on both axes: lock to the axis the pointer first moves along
   * (default false). Reported through `onDirectionLock`.
   */
  dragDirectionLock?: boolean
  /**
   * Distance (px) the pointer must move after pointerdown before the drag
   * starts (`onDragStart`, `whileDrag`), so a click on a draggable element is
   * not a drag (default 3). `0` starts the drag on pointerdown.
   */
  dragThreshold?: number
  /** Called once the drag direction is locked (`dragDirectionLock`) */
  onDirectionLock?: (axis: 'x' | 'y') => void
  /**
   * Called when a drag starts: once the pointer has moved `dragThreshold` px
   * (with the move event that crossed it), or on pointerdown when the
   * threshold is 0
   */
  onDragStart?: (event: PointerEvent, info: PanInfo) => void
  /** Called on every pointer move while dragging */
  onDrag?: (event: PointerEvent, info: PanInfo) => void
  /**
   * Called when a drag ends (release, pointercancel, `dragControls.stop()` /
   * `cancel()`). Not called for a press that never crossed `dragThreshold`.
   */
  onDragEnd?: (event: PointerEvent, info: PanInfo) => void
  /**
   * Called once the release animation (momentum, bounce or snap back) after a
   * drag has settled — right after `onDragEnd` when there is nothing to
   * animate. Not called when the animation is interrupted (a new pointerdown,
   * `dragControls.stop()` / `cancel()`, disabling drag or unmounting).
   */
  onDragTransitionEnd?: () => void
}

// ============ Internals ============

/** Handlers an Animated element registers with its `dragControls` */
interface DragControlsSubscriber {
  start: (event: PointerEvent, options?: DragStartOptions) => void
  stop: () => void
  cancel: () => void
}

/** Internal registration API of the object returned by useDragControls() */
interface DragControlsInternal extends DragControls {
  _subscribe?: (subscriber: DragControlsSubscriber) => () => void
  _setDragHandler?: (handler: ((event: PointerEvent, options?: DragStartOptions) => void) | null) => void
  _setStopHandler?: (handler: (() => void) | null) => void
  _notifyDragStart?: () => void
  _notifyDragEnd?: () => void
}

type Axis = 'x' | 'y'
type Range = [min: number, max: number]
interface Bounds { x: Range; y: Range }
interface Elastic { x: Range; y: Range }

interface Sample { x: number; y: number; t: number }

interface ActiveDrag {
  /** The pointerdown event that started this gesture */
  startEvent: PointerEvent
  /** Whether the pointer moved past `dragThreshold` (drag callbacks fired) */
  started: boolean
  removeListeners: () => void
  lastEvent: PointerEvent
  lastInfo: PanInfo
}

/**
 * A release animation: the axes still animating. Fires onDragTransitionEnd
 * when empty, once armed (after onDragEnd), unless replaced / interrupted.
 */
interface ReleaseTransition {
  axes: Set<Axis>
  armed: boolean
}

interface AxisAnimation {
  animation: { destroy(): void; getVelocity(): number }
  /** Release transition this animation belongs to */
  token: ReleaseTransition | null
  /** Target of a spring (undefined for momentum) */
  target?: number
}

type EndMode = 'release' | 'cancel' | 'stop'

const ZERO: DragPoint = { x: 0, y: 0 }
const UNBOUNDED: Range = [-Infinity, Infinity]
const DEFAULT_ELASTIC = 0.5
/** Velocity is measured over this window; older samples are ignored */
const VELOCITY_WINDOW_MS = 100
/** Pointer movement (px) needed before `dragDirectionLock` picks an axis */
const DIRECTION_LOCK_THRESHOLD = 3
/** Default pointer movement (px) before a press becomes a drag */
const DEFAULT_DRAG_THRESHOLD = 3
const DEFAULT_BOUNCE_STIFFNESS = 200
const DEFAULT_BOUNCE_DAMPING = 40
/** Window listeners run in the capture phase so stopPropagation() can't strand a drag */
const LISTENER_OPTIONS: AddEventListenerOptions = { capture: true }

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

/** OS `prefers-reduced-motion`, read on demand (no listener per element) */
function prefersReducedMotion(): boolean {
  if (!isBrowser || typeof window.matchMedia !== 'function') return false
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

function finiteOr(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function clampValue(value: number, [min, max]: Range): number {
  return value < min ? min : value > max ? max : value
}

function clampElastic(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value
}

function resolveElastic(elastic: DragElastic | undefined): Elastic {
  if (elastic === undefined || elastic === true) {
    return { x: [DEFAULT_ELASTIC, DEFAULT_ELASTIC], y: [DEFAULT_ELASTIC, DEFAULT_ELASTIC] }
  }
  if (elastic === false) return { x: [0, 0], y: [0, 0] }
  if (typeof elastic === 'number') {
    const e = clampElastic(finiteOr(elastic, DEFAULT_ELASTIC))
    return { x: [e, e], y: [e, e] }
  }
  const side = (value: number | undefined) => clampElastic(finiteOr(value, 0))
  return {
    x: [side(elastic.left), side(elastic.right)],
    y: [side(elastic.top), side(elastic.bottom)],
  }
}

function orderedRange(min: number, max: number): Range {
  return min > max ? [max, min] : [min, max]
}

function isRefConstraints(constraints: DragConstraints): constraints is React.RefObject<Element | null> {
  return 'current' in constraints
}

/**
 * Resolve constraints to offset ranges. `offset` is the element's current
 * drag offset (already included in its measured box).
 */
function resolveBounds(
  constraints: DragConstraints | undefined,
  element: HTMLElement | null,
  offset: DragPoint
): Bounds {
  if (!constraints) return { x: UNBOUNDED, y: UNBOUNDED }

  if (!isRefConstraints(constraints)) {
    return {
      x: orderedRange(finiteOr(constraints.left, -Infinity), finiteOr(constraints.right, Infinity)),
      y: orderedRange(finiteOr(constraints.top, -Infinity), finiteOr(constraints.bottom, Infinity)),
    }
  }

  const container = constraints.current
  if (!container || !element) return { x: UNBOUNDED, y: UNBOUNDED }
  const box = element.getBoundingClientRect()
  const area = container.getBoundingClientRect()
  // The element's box at offset (0, 0)
  const left = box.left - offset.x
  const top = box.top - offset.y
  const axisRange = (areaMin: number, areaMax: number, min: number, size: number): Range => {
    const lower = areaMin - min
    const upper = areaMax - (min + size)
    // Larger than the container: it may move until its edges reach the container's
    return upper < lower ? [upper, lower] : [lower, upper]
  }
  return {
    x: axisRange(area.left, area.right, left, box.width),
    y: axisRange(area.top, area.bottom, top, box.height),
  }
}

/** Apply elastic resistance to a value beyond its range */
function applyElastic(value: number, [min, max]: Range, [eMin, eMax]: Range): number {
  if (value < min) return min + (value - min) * eMin
  if (value > max) return max + (value - max) * eMax
  return value
}

/** Inverse of applyElastic: the unconstrained value that produced `value` */
function removeElastic(value: number, [min, max]: Range, [eMin, eMax]: Range): number {
  if (value < min && eMin > 0) return min + (value - min) / eMin
  if (value > max && eMax > 0) return max + (value - max) / eMax
  return value
}

/** Velocity (px/s) from the samples of the last VELOCITY_WINDOW_MS */
function computeVelocity(samples: Sample[], time: number): DragPoint {
  const last = samples[samples.length - 1]
  // The pointer stood still before release
  if (!last || time - last.t > VELOCITY_WINDOW_MS) return ZERO
  let base = last
  for (let i = samples.length - 2; i >= 0; i--) {
    const sample = samples[i]!
    if (last.t - sample.t > VELOCITY_WINDOW_MS) break
    base = sample
  }
  const dt = last.t - base.t
  if (dt <= 0) return ZERO
  const vx = ((last.x - base.x) / dt) * 1000
  const vy = ((last.y - base.y) / dt) * 1000
  return { x: Number.isFinite(vx) ? vx : 0, y: Number.isFinite(vy) ? vy : 0 }
}

function safeCall<A extends unknown[]>(fn: ((...args: A) => void) | undefined, ...args: A): void {
  if (!fn) return
  try {
    fn(...args)
  } catch (error) {
    console.error('[SpringKit] Error in drag callback:', error)
  }
}

/** Element to capture the pointer on, if it supports pointer capture */
function captureTargetOf(target: EventTarget | null | undefined): Element | null {
  if (!target || typeof (target as Element).setPointerCapture !== 'function') return null
  return target as Element
}

/** setPointerCapture, ignoring failures (inactive pointer, detached element) */
function capturePointer(target: Element | null, pointerId: number | undefined): (() => void) | null {
  if (!target || typeof pointerId !== 'number') return null
  try {
    target.setPointerCapture(pointerId)
  } catch {
    return null
  }
  return () => {
    try {
      const has = typeof target.hasPointerCapture === 'function' ? target.hasPointerCapture(pointerId) : true
      if (has && typeof target.releasePointerCapture === 'function') target.releasePointerCapture(pointerId)
    } catch {
      // The pointer is already gone
    }
  }
}

export interface AnimatedDragState {
  /** Current drag offset (render it as a translation) */
  dragOffset: DragPoint
  /** Whether a drag gesture is active (for `whileDrag`) */
  isDragging: boolean
  /** Start a drag gesture from a native pointerdown event (the element's own listener) */
  startDrag: (event: PointerEvent, options?: DragStartOptions) => void
  /**
   * Number of drags that crossed `dragThreshold` so far: compare the values at
   * pointerdown and pointerup to tell a tap from a drag
   */
  getDragCount: () => number
}

/**
 * Drag gesture of Animated elements: pointer tracking with a start threshold,
 * pointer capture, constraints with elastic resistance (re-measured on
 * resize), momentum (core `decay()`), bounce / snap-back springs, release
 * transition tracking and `dragControls` integration.
 */
export function useAnimatedDrag(
  props: AnimatedDragProps,
  elementRef: React.RefObject<HTMLElement | null>
): AnimatedDragState {
  const { drag, dragControls, dragConstraints } = props
  const motionConfig = useContext(MotionContext)

  const [dragOffset, setDragOffset] = useState<DragPoint>(ZERO)
  const [isDragging, setIsDragging] = useState(false)
  const offsetRef = useRef<DragPoint>(ZERO)
  const activeRef = useRef<ActiveDrag | null>(null)
  const animationsRef = useRef<Record<Axis, AxisAnimation | null>>({ x: null, y: null })
  const boundsRef = useRef<Bounds>({ x: UNBOUNDED, y: UNBOUNDED })
  const lockedAxisRef = useRef<Axis | null>(null)
  const transitionRef = useRef<ReleaseTransition | null>(null)
  const dragCountRef = useRef(0)
  const mountedRef = useRef(false)

  // Latest props, read from event handlers and animation callbacks
  const propsRef = useRef(props)
  propsRef.current = props
  const motionConfigRef = useRef(motionConfig)
  motionConfigRef.current = motionConfig

  /** MotionConfig reducedMotion ('always' / 'never' / 'user' = OS setting) */
  const shouldReduceMotion = useCallback((): boolean => {
    const config = motionConfigRef.current
    if (config.reducedMotion === 'always') return true
    if (config.reducedMotion === 'never') return false
    return config.isReducedMotion || prefersReducedMotion()
  }, [])

  const setOffset = useCallback((next: DragPoint) => {
    offsetRef.current = next
    if (mountedRef.current) setDragOffset(next)
  }, [])

  const setAxis = useCallback((axis: Axis, value: number) => {
    if (offsetRef.current[axis] === value) return
    setOffset({ ...offsetRef.current, [axis]: value })
  }, [setOffset])

  const stopAnimation = useCallback((axis: Axis) => {
    const entry = animationsRef.current[axis]
    animationsRef.current[axis] = null
    entry?.animation.destroy()
  }, [])

  const stopAnimations = useCallback(() => {
    stopAnimation('x')
    stopAnimation('y')
  }, [stopAnimation])

  /** Fire onDragTransitionEnd if `token` is the current, armed and finished transition */
  const checkTransition = useCallback((token: ReleaseTransition) => {
    if (transitionRef.current !== token || !token.armed || token.axes.size > 0) return
    transitionRef.current = null
    safeCall(propsRef.current.onDragTransitionEnd)
  }, [])

  /** An axis of a release transition came to rest */
  const completeAxis = useCallback((token: ReleaseTransition | null, axis: Axis) => {
    if (!token) return
    token.axes.delete(axis)
    checkTransition(token)
  }, [checkTransition])

  /** Remove the listeners / pointer capture of the active drag (no callbacks) */
  const detach = useCallback((): ActiveDrag | null => {
    const active = activeRef.current
    if (!active) return null
    activeRef.current = null
    active.removeListeners()
    if (mountedRef.current) setIsDragging(false)
    ;(propsRef.current.dragControls as DragControlsInternal | undefined)?._notifyDragEnd?.()
    return active
  }, [])

  /** Axes the element may move along */
  const getAxes = useCallback((): Axis[] => {
    const axis = propsRef.current.drag
    if (!axis) return []
    if (axis === 'x' || axis === 'y') return [axis]
    return ['x', 'y']
  }, [])

  /** Spring an axis to `to` (the bounce / snap-back spring) */
  const springAxis = useCallback((
    axis: Axis,
    from: number,
    to: number,
    velocity: number,
    token: ReleaseTransition | null
  ) => {
    const transition = propsRef.current.dragTransition
    token?.axes.add(axis)
    // Starting an idle loop may run a synchronous, (almost) zero-length tick:
    // ignore its update so the offset stays exactly where the drag left it
    // until the next frame
    let starting = true
    const animation = spring(from, to, {
      stiffness: finiteOr(transition?.bounceStiffness, DEFAULT_BOUNCE_STIFFNESS),
      damping: finiteOr(transition?.bounceDamping, DEFAULT_BOUNCE_DAMPING),
      velocity,
      restDelta: 0.1,
      restSpeed: 1,
      onUpdate: (value) => {
        if (!starting && animationsRef.current[axis] === entry) setAxis(axis, value)
      },
      onComplete: () => {
        if (animationsRef.current[axis] !== entry) return
        animationsRef.current[axis] = null
        // Also covers a spring that settled within its starting tick
        setAxis(axis, to)
        completeAxis(token, axis)
      },
    })
    const entry: AxisAnimation = { animation, token, target: to }
    animationsRef.current[axis] = entry
    animation.start()
    starting = false
  }, [setAxis, completeAxis])

  /** Momentum: decay from the current offset, bouncing off the (live) constraints */
  const decayAxis = useCallback((
    axis: Axis,
    from: number,
    velocity: number,
    elastic: Range,
    token: ReleaseTransition | null
  ) => {
    const transition = propsRef.current.dragTransition
    token?.axes.add(axis)
    let starting = true // see springAxis

    /** Apply a momentum value; returns false once the decay handed off / ended */
    const apply = (value: number): boolean => {
      const range = boundsRef.current[axis]
      if (value >= range[0] && value <= range[1]) {
        setAxis(axis, value)
        return true
      }
      // Crossed a boundary: stop there, or overshoot and spring back
      const boundary = value < range[0] ? range[0] : range[1]
      const sideElastic = value < range[0] ? elastic[0] : elastic[1]
      const currentVelocity = animation.getVelocity()
      animationsRef.current[axis] = null
      animation.destroy()
      if (sideElastic > 0 && !shouldReduceMotion()) {
        setAxis(axis, value)
        springAxis(axis, value, boundary, currentVelocity, token)
      } else {
        setAxis(axis, boundary)
        completeAxis(token, axis)
      }
      return false
    }

    const animation = decay({
      from,
      velocity,
      deceleration: transition?.deceleration,
      modifyTarget: transition?.modifyTarget,
      onUpdate: (value) => {
        if (starting || animationsRef.current[axis] !== entry) return
        apply(value)
      },
      onComplete: () => {
        if (animationsRef.current[axis] !== entry) return
        // A decay that ended within its starting tick skipped its update
        if (starting && !apply(animation.getValue())) return
        animationsRef.current[axis] = null
        completeAxis(token, axis)
      },
    })
    const entry: AxisAnimation = { animation, token }
    animationsRef.current[axis] = entry
    animation.start()
    starting = false
  }, [setAxis, springAxis, completeAxis, shouldReduceMotion])

  /**
   * Move every draggable axis to its resting position after a drag:
   * snap to origin, return inside the constraints, or continue with momentum.
   * Animations are tracked by `token` (the release transition), if any.
   */
  const settle = useCallback((
    velocity: DragPoint,
    allowMomentum: boolean,
    allowAnimation: boolean,
    token: ReleaseTransition | null
  ) => {
    const { dragSnapToOrigin, dragMomentum = true, dragTransition, dragElastic } = propsRef.current
    const bounds = boundsRef.current
    const elastic = resolveElastic(dragElastic)
    const animate = allowAnimation && !shouldReduceMotion()
    const lockedAxis = lockedAxisRef.current

    for (const axis of getAxes()) {
      stopAnimation(axis)
      const from = offsetRef.current[axis]
      const range = bounds[axis]
      const axisVelocity = lockedAxis && lockedAxis !== axis ? 0 : velocity[axis]

      let target: number | null = null
      if (dragSnapToOrigin) {
        target = 0
      } else if (from < range[0] || from > range[1]) {
        target = clampValue(from, range)
      } else if (allowMomentum && dragMomentum && axisVelocity !== 0) {
        if (animate) {
          decayAxis(axis, from, axisVelocity, elastic[axis], token)
          continue
        }
        // Reduced motion: jump to where the momentum would come to rest
        const probe = decay({
          from,
          velocity: axisVelocity,
          deceleration: dragTransition?.deceleration,
          modifyTarget: dragTransition?.modifyTarget,
        })
        target = clampValue(probe.target, range)
        probe.destroy()
      }

      if (target === null || target === from) continue
      if (animate) {
        springAxis(axis, from, target, axisVelocity, token)
      } else {
        setAxis(axis, target)
      }
    }
  }, [getAxes, stopAnimation, decayAxis, springAxis, setAxis, shouldReduceMotion])

  /**
   * End the active gesture.
   * - release: continue with momentum, then settle (onDragTransitionEnd)
   * - cancel: no momentum, animate back inside the constraints
   * - stop: no momentum, jump to the resting position
   * A press that never crossed the threshold ends without drag callbacks.
   */
  const finishDrag = useCallback((event: PointerEvent | null, info: PanInfo | null, mode: EndMode) => {
    const active = detach()
    if (!active) return
    if (!active.started) {
      // The pointerdown stopped any release animation: bring the element back
      // to rest (e.g. inside the constraints) without notifying a drag
      settle(ZERO, false, mode !== 'stop', null)
      return
    }
    const endInfo: PanInfo = info ?? { ...active.lastInfo, delta: ZERO, velocity: ZERO }
    const token: ReleaseTransition = { axes: new Set(), armed: false }
    transitionRef.current = token
    settle(endInfo.velocity, mode === 'release', mode !== 'stop', token)
    safeCall(propsRef.current.onDragEnd, event ?? active.lastEvent, endInfo)
    token.armed = true
    checkTransition(token)
  }, [detach, settle, checkTransition])

  const startDrag = useCallback((
    event: PointerEvent,
    options?: DragStartOptions,
    fromControls = false
  ) => {
    const axisProp = propsRef.current.drag
    if (!axisProp || !isBrowser) return
    // Already started by this pointerdown (e.g. a dragControls handle inside
    // the element, whose event then bubbles to the element's own listener)
    if (activeRef.current?.startEvent === event) return
    // A new gesture replaces any active one (without callbacks) and
    // interrupts the release animation
    detach()
    transitionRef.current = null
    stopAnimations()

    const axes = getAxes()
    const element = elementRef.current
    const { dragConstraints: constraints, dragElastic, dragDirectionLock, dragThreshold } = propsRef.current
    const elastic = resolveElastic(dragElastic)
    boundsRef.current = resolveBounds(constraints, element, offsetRef.current)
    const startBounds = boundsRef.current
    lockedAxisRef.current = null
    const useDirectionLock = Boolean(dragDirectionLock) && axes.length === 2
    const threshold = Math.max(0, finiteOr(dragThreshold, DEFAULT_DRAG_THRESHOLD))
    // dragControls: capture on the pressed element (e.g. the handle), so it
    // keeps receiving its own pointer events; otherwise on the dragged element
    const captureTarget = captureTargetOf(fromControls ? event.target : null) ?? captureTargetOf(element)

    let origin = offsetRef.current
    if (options?.snapToCursor && element) {
      // Move the element so its center (plus cursorOffset) is under the pointer
      const rect = element.getBoundingClientRect()
      const dx = event.clientX - (options.cursorOffset?.x ?? 0) - (rect.left + rect.width / 2)
      const dy = event.clientY - (options.cursorOffset?.y ?? 0) - (rect.top + rect.height / 2)
      origin = {
        x: axes.includes('x') ? applyElastic(origin.x + dx, startBounds.x, elastic.x) : origin.x,
        y: axes.includes('y') ? applyElastic(origin.y + dy, startBounds.y, elastic.y) : origin.y,
      }
      setOffset(origin)
    }
    // Unconstrained origin, so a drag that starts beyond a boundary doesn't jump
    const rawOrigin = {
      x: removeElastic(origin.x, startBounds.x, elastic.x),
      y: removeElastic(origin.y, startBounds.y, elastic.y),
    }

    const startX = event.clientX
    const startY = event.clientY
    const pointerId = event.pointerId
    const samples: Sample[] = [{ x: startX, y: startY, t: now() }]
    let lastPoint: DragPoint = { x: startX, y: startY }
    let releaseCapture: (() => void) | null = null

    const isOtherPointer = (e: PointerEvent) =>
      pointerId !== undefined && e.pointerId !== undefined && e.pointerId !== pointerId

    const makeInfo = (point: DragPoint, time: number): PanInfo => {
      const info: PanInfo = {
        point,
        delta: { x: point.x - lastPoint.x, y: point.y - lastPoint.y },
        offset: { x: point.x - startX, y: point.y - startY },
        velocity: computeVelocity(samples, time),
      }
      lastPoint = point
      return info
    }

    const record = (point: DragPoint, time: number) => {
      const last = samples[samples.length - 1]
      if (last && last.x === point.x && last.y === point.y) return
      samples.push({ x: point.x, y: point.y, t: time })
      // Only the velocity window is needed
      while (samples.length > 2 && time - samples[0]!.t > VELOCITY_WINDOW_MS * 2) samples.shift()
    }

    /** The press becomes a drag: capture the pointer, whileDrag, onDragStart */
    const begin = (active: ActiveDrag, e: PointerEvent, info: PanInfo) => {
      active.started = true
      dragCountRef.current++
      releaseCapture = capturePointer(captureTarget, pointerId)
      if (mountedRef.current) setIsDragging(true)
      safeCall(propsRef.current.onDragStart, e, info)
    }

    const handleMove = (e: PointerEvent) => {
      const active = activeRef.current
      if (!active || isOtherPointer(e)) return
      const time = now()
      const point = { x: e.clientX, y: e.clientY }
      record(point, time)
      const info = makeInfo(point, time)
      active.lastEvent = e
      active.lastInfo = info

      if (!active.started) {
        if (Math.hypot(info.offset.x, info.offset.y) < threshold) return
        begin(active, e, info)
        // onDragStart may have ended the drag (e.g. dragControls.stop())
        if (activeRef.current !== active) return
      }

      if (useDirectionLock && lockedAxisRef.current === null) {
        const ax = Math.abs(info.offset.x)
        const ay = Math.abs(info.offset.y)
        if (Math.max(ax, ay) <= DIRECTION_LOCK_THRESHOLD) return
        const locked: Axis = ay > ax ? 'y' : 'x'
        lockedAxisRef.current = locked
        safeCall(propsRef.current.onDirectionLock, locked)
      }

      const locked = lockedAxisRef.current
      const move = (axis: Axis): boolean => axes.includes(axis) && (!locked || locked === axis)
      const currentElastic = resolveElastic(propsRef.current.dragElastic)
      // Constraints may be re-measured mid-drag (resize)
      const bounds = boundsRef.current
      setOffset({
        x: move('x')
          ? applyElastic(rawOrigin.x + info.offset.x, bounds.x, currentElastic.x)
          : offsetRef.current.x,
        y: move('y')
          ? applyElastic(rawOrigin.y + info.offset.y, bounds.y, currentElastic.y)
          : offsetRef.current.y,
      })
      safeCall(propsRef.current.onDrag, e, info)
    }

    const handleUp = (e: PointerEvent) => {
      const active = activeRef.current
      if (!active || isOtherPointer(e)) return
      const time = now()
      const point = { x: e.clientX, y: e.clientY }
      let info: PanInfo
      if (Number.isFinite(point.x) && Number.isFinite(point.y)) {
        // The release position is part of the gesture
        record(point, time)
        info = makeInfo(point, time)
      } else {
        info = { ...active.lastInfo, delta: ZERO, velocity: computeVelocity(samples, time) }
      }
      finishDrag(e, info, 'release')
    }

    const handleCancel = (e: PointerEvent) => {
      const active = activeRef.current
      if (!active || isOtherPointer(e)) return
      finishDrag(e, { ...active.lastInfo, delta: ZERO, velocity: ZERO }, 'cancel')
    }

    // Window listeners also track the pointer when capture is unavailable
    window.addEventListener('pointermove', handleMove, LISTENER_OPTIONS)
    window.addEventListener('pointerup', handleUp, LISTENER_OPTIONS)
    window.addEventListener('pointercancel', handleCancel, LISTENER_OPTIONS)

    const startInfo: PanInfo = {
      point: { x: startX, y: startY },
      delta: ZERO,
      offset: ZERO,
      velocity: ZERO,
    }
    const active: ActiveDrag = {
      startEvent: event,
      started: false,
      removeListeners: () => {
        window.removeEventListener('pointermove', handleMove, LISTENER_OPTIONS)
        window.removeEventListener('pointerup', handleUp, LISTENER_OPTIONS)
        window.removeEventListener('pointercancel', handleCancel, LISTENER_OPTIONS)
        releaseCapture?.()
        releaseCapture = null
      },
      lastEvent: event,
      lastInfo: startInfo,
    }
    activeRef.current = active
    ;(propsRef.current.dragControls as DragControlsInternal | undefined)?._notifyDragStart?.()
    if (threshold <= 0) begin(active, event, startInfo)
  }, [detach, stopAnimations, getAxes, elementRef, setOffset, finishDrag])

  /**
   * dragControls.stop(): end the drag (or interrupt a running release
   * animation) without momentum; the element jumps to its resting position
   * (inside the constraints, or the origin with dragSnapToOrigin)
   */
  const stopDrag = useCallback(() => {
    if (activeRef.current) {
      finishDrag(null, null, 'stop')
    } else {
      transitionRef.current = null
      settle(ZERO, false, false, null)
    }
  }, [finishDrag, settle])

  /**
   * dragControls.cancel(): end the drag without momentum (onDragEnd with zero
   * velocity) and animate back inside the constraints. While idle, it
   * interrupts a running release animation the same way (no callbacks).
   */
  const cancelDrag = useCallback(() => {
    if (activeRef.current) {
      finishDrag(null, null, 'cancel')
    } else {
      transitionRef.current = null
      settle(ZERO, false, true, null)
    }
  }, [finishDrag, settle])

  /**
   * Re-measure ref constraints (resize). An idle element left outside them
   * springs back inside; an active drag uses them from its next move.
   */
  const remeasure = useCallback(() => {
    const { dragConstraints: constraints, dragSnapToOrigin } = propsRef.current
    if (!constraints || !isRefConstraints(constraints)) return
    const element = elementRef.current
    if (!element || !constraints.current) return
    const bounds = resolveBounds(constraints, element, offsetRef.current)
    boundsRef.current = bounds
    // Snap-to-origin elements rest at the origin, not inside the constraints
    if (activeRef.current || dragSnapToOrigin) return

    for (const axis of getAxes()) {
      const range = bounds[axis]
      const value = offsetRef.current[axis]
      const entry = animationsRef.current[axis]
      let target: number
      if (entry) {
        // Momentum reads the live constraints itself
        if (entry.target === undefined) continue
        // A spring heading for a point that is now outside the constraints
        target = clampValue(entry.target, range)
        if (target === entry.target) continue
      } else {
        target = clampValue(value, range)
        if (target === value) continue
      }

      const token = entry?.token && entry.token === transitionRef.current ? entry.token : null
      const velocity = entry ? entry.animation.getVelocity() : 0
      stopAnimation(axis)
      if (shouldReduceMotion() || target === value) {
        setAxis(axis, target)
        completeAxis(token, axis)
      } else {
        springAxis(axis, value, target, velocity, token)
      }
    }
  }, [elementRef, getAxes, stopAnimation, shouldReduceMotion, setAxis, completeAxis, springAxis])

  // Track mount state (StrictMode re-runs this effect) and clean up on unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      detach()
      transitionRef.current = null
      stopAnimations()
    }
  }, [detach, stopAnimations])

  // Disabling drag ends an active drag and stops release animations
  const isDragEnabled = Boolean(drag)
  useEffect(() => {
    if (isDragEnabled) return
    detach()
    transitionRef.current = null
    stopAnimations()
  }, [isDragEnabled, detach, stopAnimations])

  // Let dragControls.start() / stop() / cancel() drive this element
  useEffect(() => {
    const controls = dragControls as DragControlsInternal | undefined
    if (!controls || !isDragEnabled) return
    const start = (event: PointerEvent, options?: DragStartOptions) => startDrag(event, options, true)
    if (typeof controls._subscribe === 'function') {
      return controls._subscribe({ start, stop: stopDrag, cancel: cancelDrag })
    }
    // Controls objects without subscriptions (single element)
    controls._setDragHandler?.(start)
    controls._setStopHandler?.(stopDrag)
    return () => {
      controls._setDragHandler?.(null)
      controls._setStopHandler?.(null)
    }
  }, [dragControls, isDragEnabled, startDrag, stopDrag, cancelDrag])

  // Re-measure container constraints when the window, the container or the
  // element resizes
  const constraintsRef = dragConstraints && isRefConstraints(dragConstraints) ? dragConstraints : null
  useEffect(() => {
    if (!isDragEnabled || !constraintsRef || !isBrowser) return
    const handleResize = () => remeasure()
    window.addEventListener('resize', handleResize)
    let observer: ResizeObserver | null = null
    if (typeof ResizeObserver === 'function') {
      try {
        observer = new ResizeObserver(handleResize)
        const container = constraintsRef.current
        const element = elementRef.current
        if (container) observer.observe(container)
        if (element) observer.observe(element)
      } catch {
        observer = null
      }
    }
    return () => {
      window.removeEventListener('resize', handleResize)
      observer?.disconnect()
    }
  }, [isDragEnabled, constraintsRef, elementRef, remeasure])

  const getDragCount = useCallback(() => dragCountRef.current, [])

  return { dragOffset, isDragging, startDrag, getDragCount }
}
