/**
 * Advanced Physics Hooks - SpringKit Exclusive
 *
 * These hooks provide advanced physics simulations that go beyond
 * simple spring animations.
 */

import { useRef, useEffect, useCallback, useState } from 'react'
import { createMotionValue, MotionValue, globalLoop, delay } from '@oxog/springkit'
import { createSpringValue } from '@oxog/springkit'
import type { SpringConfig } from '@oxog/springkit'
import { useDestroyOnUnmount } from './useDestroyOnUnmount.js'
import { useElementEffect } from './useElementEffect.js'

/** Reference frame the per-frame options (friction, gravity, drag) are expressed in */
const FRAME_MS = 1000 / 60
/** Cap per tick so a suspended tab doesn't make the simulation explode */
const MAX_FRAMES_PER_TICK = 4

/**
 * Frames (of 1/60 s) elapsed since the previous tick, scaled by the global
 * time scale. The physics hooks integrate per-frame options with this so they
 * run at the same speed on every display (and follow slow motion).
 */
function elapsedFrames(lastTimeRef: { current: number | null }, now: number | undefined): number {
  const time = typeof now === 'number' ? now : performance.now()
  const last = lastTimeRef.current
  lastTimeRef.current = time
  const frames = last === null ? 1 : Math.min(Math.max((time - last) / FRAME_MS, 0), MAX_FRAMES_PER_TICK)
  return frames * globalLoop.getTimeScale()
}

/**
 * Fraction of the remaining distance an exponential smoothing covers in
 * `frames` frames when it covers `perFrame` of it per 60fps frame
 */
function smoothingFactor(perFrame: number, frames: number): number {
  const f = Math.min(Math.max(perFrame, 0), 1)
  return 1 - Math.pow(1 - f, frames)
}

// ============ useSpringState ============

export interface UseSpringStateOptions extends SpringConfig {
  /** Initial value */
  initial?: number
  /** Callback on value change */
  onChange?: (value: number) => void
}

/**
 * Spring-animated state that syncs with React state
 *
 * Unlike useMotionValue, this triggers React re-renders and can be
 * used directly in JSX. Best for values that need to be reactive.
 *
 * @example
 * ```tsx
 * function Counter() {
 *   const [count, setCount, springValue] = useSpringState(0)
 *
 *   return (
 *     <div>
 *       <span>{Math.round(count)}</span>
 *       <button onClick={() => setCount(count + 1)}>+</button>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example With config
 * ```tsx
 * const [progress, setProgress] = useSpringState(0, {
 *   stiffness: 300,
 *   damping: 30,
 *   onChange: (v) => console.log('Progress:', v)
 * })
 * ```
 */
export function useSpringState(
  initialValue: number = 0,
  options: UseSpringStateOptions = {}
): [number, (value: number) => void, MotionValue<number>] {
  const { initial = initialValue, onChange, ...springConfig } = options

  const [state, setState] = useState(initial)
  const springRef = useRef<ReturnType<typeof createSpringValue> | null>(null)
  const motionValueRef = useRef<MotionValue<number> | null>(null)
  // Always call the latest onChange (avoid stale closure from first render)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // Initialize spring
  // Recreate if destroyed (happens with React StrictMode double-mount)
  if (springRef.current === null || springRef.current.isDestroyed()) {
    // `state` is `initial` on mount, and the last value when the spring is
    // recreated after a hidden <Activity> destroyed it
    springRef.current = createSpringValue(state, {
      ...springConfig,
      onUpdate: (value) => {
        setState(value)
        onChangeRef.current?.(value)
      },
    })
  }

  // Create motion value wrapper
  // Recreate if destroyed (happens with React StrictMode double-mount)
  if (motionValueRef.current === null || motionValueRef.current.isDestroyed()) {
    motionValueRef.current = createMotionValue(initial)
  }

  // Sync motion value with spring (again when the spring is recreated)
  const springValue = springRef.current
  useEffect(() => {
    const unsub = springValue.subscribe((v) => {
      motionValueRef.current?.jump(v)
    })
    return () => unsub()
  }, [springValue])

  // Cleanup: destroy spring to prevent memory leaks
  // (deferred so StrictMode's simulated remount keeps the same live spring)
  useDestroyOnUnmount(() => {
    springRef.current?.destroy()
    springRef.current = null
  })

  const setValue = useCallback((value: number) => {
    springRef.current?.set(value)
  }, [])

  return [state, setValue, motionValueRef.current]
}

// ============ useMomentum ============

export interface UseMomentumOptions {
  /** Friction coefficient (0-1, lower = more friction) */
  friction?: number
  /** Minimum velocity before stopping */
  minVelocity?: number
  /** Bounds to clamp the value */
  bounds?: { min?: number; max?: number }
  /** Callback when momentum stops */
  onRest?: () => void
}

/**
 * Physics-based momentum tracking
 *
 * Tracks velocity and applies momentum/friction physics. Great for
 * creating inertial scrolling, throwable elements, etc.
 *
 * @example
 * ```tsx
 * function ThrowableCard() {
 *   const { value, velocity, push, stop } = useMomentum({
 *     friction: 0.95,
 *     bounds: { min: 0, max: 500 }
 *   })
 *
 *   const handleDragEnd = (e) => {
 *     push(dragVelocity) // Apply velocity on release
 *   }
 *
 *   return <div style={{ x: value.get() }} />
 * }
 * ```
 */
export function useMomentum(options: UseMomentumOptions = {}) {
  const {
    friction = 0.95,
    minVelocity = 0.01,
    bounds,
    onRest,
  } = options

  const valueRef = useRef<MotionValue<number> | null>(null)
  const velocityRef = useRef<MotionValue<number> | null>(null)
  const frameRef = useRef<number | null>(null)
  const isActiveRef = useRef(false)
  // The running frame loop reads the latest options (and onRest) from here,
  // not the ones captured when push() started it
  const optionsRef = useRef({ friction, minVelocity, bounds, onRest })
  optionsRef.current = { friction, minVelocity, bounds, onRest }

  // Recreate if destroyed (happens with React StrictMode double-mount)
  if (valueRef.current === null || valueRef.current.isDestroyed()) {
    valueRef.current = createMotionValue(0)
  }
  if (velocityRef.current === null || velocityRef.current.isDestroyed()) {
    velocityRef.current = createMotionValue(0)
  }

  const applyBounds = useCallback((val: number) => {
    const { bounds } = optionsRef.current
    if (!bounds) return val
    let result = val
    if (bounds.min !== undefined) result = Math.max(bounds.min, result)
    if (bounds.max !== undefined) result = Math.min(bounds.max, result)
    return result
  }, [])

  const lastTimeRef = useRef<number | null>(null)

  const tick = useCallback((now?: number) => {
    if (!isActiveRef.current) return
    const { friction, minVelocity, bounds, onRest } = optionsRef.current
    const frames = elapsedFrames(lastTimeRef, now)

    const currentVelocity = velocityRef.current?.get() ?? 0
    const currentValue = valueRef.current?.get() ?? 0

    // Apply friction (per 60fps frame, scaled to the real elapsed time)
    const newVelocity = currentVelocity * Math.pow(friction, frames)

    // Update value
    const newValue = applyBounds(currentValue + newVelocity * frames)
    valueRef.current?.jump(newValue)
    velocityRef.current?.jump(newVelocity)

    // Check if should stop
    if (Math.abs(newVelocity) < minVelocity) {
      isActiveRef.current = false
      velocityRef.current?.jump(0)
      onRest?.()
      return
    }

    // Check bounds collision
    if (bounds) {
      if (
        (bounds.min !== undefined && newValue <= bounds.min) ||
        (bounds.max !== undefined && newValue >= bounds.max)
      ) {
        isActiveRef.current = false
        velocityRef.current?.jump(0)
        onRest?.()
        return
      }
    }

    frameRef.current = requestAnimationFrame(tick)
  }, [applyBounds])

  const push = useCallback((velocity: number) => {
    // Validate velocity
    if (!Number.isFinite(velocity)) return

    velocityRef.current?.jump(velocity)
    isActiveRef.current = true
    lastTimeRef.current = null // first tick counts as one frame
    // Cancel any existing frame before starting new one
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    frameRef.current = requestAnimationFrame(tick)
  }, [tick])

  const stop = useCallback(() => {
    isActiveRef.current = false
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current)
    }
    velocityRef.current?.jump(0)
  }, [])

  const set = useCallback((value: number) => {
    // Validate value
    if (!Number.isFinite(value)) return
    valueRef.current?.jump(applyBounds(value))
  }, [applyBounds])

  // Cleanup: cancel animations but don't destroy MotionValues
  // (MotionValues are reused across React StrictMode remounts)
  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      isActiveRef.current = false
    }
  }, [])

  return {
    value: valueRef.current,
    velocity: velocityRef.current,
    push,
    stop,
    set,
    isActive: () => isActiveRef.current,
  }
}

// ============ useElastic ============

export interface UseElasticOptions {
  /** Elasticity factor (0-1, higher = more stretch) */
  elasticity?: number
  /** Maximum stretch distance */
  maxStretch?: number
  /** Spring config for return animation */
  spring?: SpringConfig
}

/**
 * Rubber band / elastic effect
 *
 * Creates an elastic resistance effect, like stretching a rubber band.
 * Perfect for over-scroll effects, pull-to-refresh, etc.
 *
 * @example
 * ```tsx
 * function PullToRefresh() {
 *   const { value, stretch, release } = useElastic({
 *     elasticity: 0.5,
 *     maxStretch: 100
 *   })
 *
 *   const handleDrag = (offset) => stretch(offset)
 *   const handleRelease = () => release()
 *
 *   return <div style={{ y: value.get() }} />
 * }
 * ```
 */
export function useElastic(options: UseElasticOptions = {}) {
  const {
    elasticity = 0.5,
    maxStretch = 100,
    spring = { stiffness: 300, damping: 30 },
  } = options

  // Use useRef for motion values to avoid hook order issues
  const motionValueRef = useRef<MotionValue<number> | null>(null)
  const springRef = useRef<ReturnType<typeof createSpringValue> | null>(null)

  // Initialize refs only once
  // Recreate if destroyed (happens with React StrictMode double-mount)
  if (motionValueRef.current === null || motionValueRef.current.isDestroyed()) {
    motionValueRef.current = createMotionValue(0)
  }
  if (springRef.current === null || springRef.current.isDestroyed()) {
    springRef.current = createSpringValue(0, {
      ...spring,
      onUpdate: (v) => motionValueRef.current?.jump(v),
    })
  }
  const rawValueRef = useRef(0)

  // Rubber band formula: x * (1 - x / (maxStretch * 2))
  const applyElasticity = useCallback((input: number) => {
    const sign = input >= 0 ? 1 : -1
    const absInput = Math.abs(input)
    const factor = 1 - (absInput / (maxStretch * 2)) * (1 - elasticity)
    return sign * absInput * Math.max(0.1, factor)
  }, [elasticity, maxStretch])

  const stretch = useCallback((amount: number) => {
    // Validate amount
    if (!Number.isFinite(amount)) return

    rawValueRef.current = amount
    const elasticValue = applyElasticity(amount)
    motionValueRef.current?.jump(elasticValue)
  }, [applyElasticity])

  const release = useCallback(() => {
    rawValueRef.current = 0
    springRef.current?.set(0)
  }, [])

  const set = useCallback((value: number) => {
    // Validate value
    if (!Number.isFinite(value)) return

    rawValueRef.current = value
    springRef.current?.set(value)
  }, [])

  // Cleanup: don't destroy MotionValues/springs
  // (They are reused across React StrictMode remounts)
  useEffect(() => {
    return () => {
      springRef.current?.stop()
    }
  }, [])

  return {
    value: motionValueRef.current,
    stretch,
    release,
    set,
    getRaw: () => rawValueRef.current,
  }
}

// ============ useBounce ============

export interface UseBounceOptions {
  /** Bounce dampening (0-1, lower = more bouncy) */
  dampening?: number
  /** Gravity strength */
  gravity?: number
  /** Ground level */
  floor?: number
  /** Ceiling level */
  ceiling?: number
  /** Coefficient of restitution (bounciness) */
  restitution?: number
}

/**
 * Bounce physics simulation
 *
 * Simulates a bouncing ball with gravity, floor, and dampening.
 *
 * @example
 * ```tsx
 * function BouncingBall() {
 *   const { value, drop, bounce, stop } = useBounce({
 *     gravity: 0.5,
 *     floor: 300,
 *     restitution: 0.7
 *   })
 *
 *   return (
 *     <div
 *       style={{ y: value.get() }}
 *       onClick={() => drop(0)}
 *     />
 *   )
 * }
 * ```
 */
export function useBounce(options: UseBounceOptions = {}) {
  const {
    dampening = 0.02,
    gravity = 0.5,
    floor = 300,
    ceiling = 0,
    restitution = 0.7,
  } = options

  // Use useRef for motion value to avoid hook order issues
  // Recreate if destroyed (happens with React StrictMode double-mount)
  const motionValueRef = useRef<MotionValue<number> | null>(null)
  if (motionValueRef.current === null || motionValueRef.current.isDestroyed()) {
    motionValueRef.current = createMotionValue(ceiling)
  }
  const motionValue = motionValueRef.current
  const velocityRef = useRef(0)
  const frameRef = useRef<number | null>(null)
  const isActiveRef = useRef(false)
  // The running frame loop reads the latest options from here, not the ones
  // captured when drop()/bounce() started it
  const optionsRef = useRef({ dampening, gravity, floor, ceiling, restitution })
  optionsRef.current = { dampening, gravity, floor, ceiling, restitution }

  const lastTimeRef = useRef<number | null>(null)

  const tick = useCallback((now?: number) => {
    if (!isActiveRef.current) return
    const { dampening, gravity, floor, ceiling, restitution } = optionsRef.current
    const frames = elapsedFrames(lastTimeRef, now)

    const currentValue = motionValue.get()

    // Apply gravity (per 60fps frame, scaled to the real elapsed time)
    velocityRef.current += gravity * frames

    // Apply air resistance
    velocityRef.current *= Math.pow(1 - dampening, frames)

    // Update position
    let newValue = currentValue + velocityRef.current * frames

    // Check floor collision
    if (newValue >= floor) {
      newValue = floor
      velocityRef.current = -velocityRef.current * restitution

      // Stop if velocity is very low
      if (Math.abs(velocityRef.current) < 0.5) {
        isActiveRef.current = false
        velocityRef.current = 0
        motionValue.jump(floor)
        return
      }
    }

    // Check ceiling collision
    if (newValue <= ceiling) {
      newValue = ceiling
      velocityRef.current = -velocityRef.current * restitution
    }

    motionValue.jump(newValue)
    frameRef.current = requestAnimationFrame(tick)
  }, [motionValue])

  const drop = useCallback((fromY: number = ceiling, initialVelocity: number = 0) => {
    // Validate inputs
    const safeFromY = Number.isFinite(fromY) ? fromY : ceiling
    const safeVelocity = Number.isFinite(initialVelocity) ? initialVelocity : 0

    motionValue.jump(safeFromY)
    velocityRef.current = safeVelocity
    isActiveRef.current = true
    lastTimeRef.current = null // first tick counts as one frame
    // Cancel any existing frame before starting new one
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    frameRef.current = requestAnimationFrame(tick)
  }, [motionValue, ceiling, tick])

  const bounce = useCallback((velocity: number) => {
    // Validate velocity
    if (!Number.isFinite(velocity)) return

    velocityRef.current = velocity
    isActiveRef.current = true
    lastTimeRef.current = null // first tick counts as one frame
    // Cancel any existing frame before starting new one
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    frameRef.current = requestAnimationFrame(tick)
  }, [tick])

  const stop = useCallback(() => {
    isActiveRef.current = false
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    velocityRef.current = 0
  }, [])

  // Cleanup: cancel animations but don't destroy MotionValue
  // (MotionValue is reused across StrictMode remounts)
  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      isActiveRef.current = false
    }
  }, [])

  return {
    value: motionValue,
    drop,
    bounce,
    stop,
    isActive: () => isActiveRef.current,
    getVelocity: () => velocityRef.current,
  }
}

// ============ useGravity ============

export interface UseGravityOptions {
  /** Gravity vector */
  gravity?: { x: number; y: number }
  /** Mass of the object */
  mass?: number
  /** Air resistance */
  drag?: number
  /** Bounds for the object */
  bounds?: {
    left?: number
    right?: number
    top?: number
    bottom?: number
  }
  /** Bounciness when hitting bounds */
  bounciness?: number
}

/**
 * 2D gravity simulation
 *
 * Simulates an object affected by gravity in 2D space with
 * optional bounds and bouncing.
 *
 * @example
 * ```tsx
 * function FallingObject() {
 *   const { x, y, launch, stop } = useGravity({
 *     gravity: { x: 0, y: 0.5 },
 *     bounds: { left: 0, right: 400, top: 0, bottom: 400 },
 *     bounciness: 0.6
 *   })
 *
 *   return (
 *     <div
 *       style={{ x: x.get(), y: y.get() }}
 *       onClick={() => launch({ x: 5, y: -10 })}
 *     />
 *   )
 * }
 * ```
 */
export function useGravity(options: UseGravityOptions = {}) {
  const {
    gravity = { x: 0, y: 0.5 },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mass: _mass = 1,
    drag = 0.01,
    bounds,
    bounciness = 0.7,
  } = options

  // Use useRef for motion values to avoid hook order issues
  // Recreate if destroyed (happens with React StrictMode double-mount)
  const xRef = useRef<MotionValue<number> | null>(null)
  const yRef = useRef<MotionValue<number> | null>(null)
  if (xRef.current === null || xRef.current.isDestroyed()) {
    xRef.current = createMotionValue(0)
  }
  if (yRef.current === null || yRef.current.isDestroyed()) {
    yRef.current = createMotionValue(0)
  }
  const xMotion = xRef.current
  const yMotion = yRef.current
  const velocityRef = useRef({ x: 0, y: 0 })
  const frameRef = useRef<number | null>(null)
  const isActiveRef = useRef(false)
  // The running frame loop reads the latest options from here, not the ones
  // captured when launch()/start() started it
  const optionsRef = useRef({ gravity, drag, bounds, bounciness })
  optionsRef.current = { gravity, drag, bounds, bounciness }

  const lastTimeRef = useRef<number | null>(null)

  const tick = useCallback((now?: number) => {
    if (!isActiveRef.current) return
    const { gravity, drag, bounds, bounciness } = optionsRef.current
    const frames = elapsedFrames(lastTimeRef, now)

    const currentX = xMotion.get()
    const currentY = yMotion.get()

    // Apply gravity (per 60fps frame, scaled to the real elapsed time)
    velocityRef.current.x += gravity.x * frames
    velocityRef.current.y += gravity.y * frames

    // Apply drag
    const dragFactor = Math.pow(1 - drag, frames)
    velocityRef.current.x *= dragFactor
    velocityRef.current.y *= dragFactor

    // Update position
    let newX = currentX + velocityRef.current.x * frames
    let newY = currentY + velocityRef.current.y * frames

    // Check bounds
    if (bounds) {
      if (bounds.left !== undefined && newX <= bounds.left) {
        newX = bounds.left
        velocityRef.current.x = -velocityRef.current.x * bounciness
      }
      if (bounds.right !== undefined && newX >= bounds.right) {
        newX = bounds.right
        velocityRef.current.x = -velocityRef.current.x * bounciness
      }
      if (bounds.top !== undefined && newY <= bounds.top) {
        newY = bounds.top
        velocityRef.current.y = -velocityRef.current.y * bounciness
      }
      if (bounds.bottom !== undefined && newY >= bounds.bottom) {
        newY = bounds.bottom
        velocityRef.current.y = -velocityRef.current.y * bounciness

        // Stop if velocity is very low at bottom
        if (Math.abs(velocityRef.current.y) < 0.5 && Math.abs(velocityRef.current.x) < 0.1) {
          velocityRef.current.y = 0
        }
      }
    }

    xMotion.jump(newX)
    yMotion.jump(newY)

    // Continue if there's still movement or if gravity is active
    const totalVelocity = Math.abs(velocityRef.current.x) + Math.abs(velocityRef.current.y)
    // Keep animating if there's significant velocity OR if we're not at rest on the ground
    const isAtRestOnGround = bounds?.bottom !== undefined &&
      Math.abs(newY - bounds.bottom) < 0.5 &&
      totalVelocity < 0.01

    if (totalVelocity > 0.01 || !isAtRestOnGround) {
      frameRef.current = requestAnimationFrame(tick)
    } else {
      isActiveRef.current = false
    }
  }, [xMotion, yMotion])

  const launch = useCallback((velocity: { x: number; y: number }) => {
    // Validate velocities
    const safeX = Number.isFinite(velocity.x) ? velocity.x : 0
    const safeY = Number.isFinite(velocity.y) ? velocity.y : 0

    velocityRef.current = { x: safeX, y: safeY }
    isActiveRef.current = true
    lastTimeRef.current = null // first tick counts as one frame
    // Cancel any existing frame before starting new one
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    frameRef.current = requestAnimationFrame(tick)
  }, [tick])

  const setPosition = useCallback((pos: { x: number; y: number }) => {
    // Validate positions
    const safeX = Number.isFinite(pos.x) ? pos.x : xMotion.get()
    const safeY = Number.isFinite(pos.y) ? pos.y : yMotion.get()

    xMotion.jump(safeX)
    yMotion.jump(safeY)
  }, [xMotion, yMotion])

  const stop = useCallback(() => {
    isActiveRef.current = false
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
    velocityRef.current = { x: 0, y: 0 }
  }, [])

  const start = useCallback(() => {
    if (!isActiveRef.current) {
      isActiveRef.current = true
      lastTimeRef.current = null // first tick counts as one frame
      // Cancel any existing frame before starting new one
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      frameRef.current = requestAnimationFrame(tick)
    }
  }, [tick])

  // Cleanup: cancel animations but don't destroy MotionValues
  // (MotionValues are reused across React StrictMode remounts)
  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      isActiveRef.current = false
    }
  }, [])

  return {
    x: xMotion,
    y: yMotion,
    launch,
    setPosition,
    stop,
    start,
    isActive: () => isActiveRef.current,
    getVelocity: () => ({ ...velocityRef.current }),
  }
}

// ============ useChain ============

export interface ChainStep {
  /** Target values */
  to: Record<string, number>
  /** Spring config for this step */
  config?: SpringConfig
  /** Delay before this step (ms) */
  delay?: number
}

/**
 * Chain multiple animations in sequence
 *
 * Unlike sequence() which is for orchestrating separate springs,
 * useChain manages a single set of values through multiple steps.
 *
 * @example
 * ```tsx
 * function AnimatedElement() {
 *   const { values, play, reset, isPlaying } = useChain([
 *     { to: { opacity: 1, scale: 1.2 }, config: { stiffness: 300 } },
 *     { to: { scale: 1 }, delay: 100 },
 *     { to: { x: 100 }, config: { stiffness: 200, damping: 20 } },
 *   ])
 *
 *   return (
 *     <div
 *       style={{
 *         opacity: values.opacity?.get(),
 *         transform: `scale(${values.scale?.get()}) translateX(${values.x?.get()}px)`
 *       }}
 *       onClick={() => play()}
 *     />
 *   )
 * }
 * ```
 */
export function useChain(
  steps: ChainStep[],
  initialValues: Record<string, number> = {}
) {
  const valuesRef = useRef<Record<string, MotionValue<number>>>({})
  const springsRef = useRef<Record<string, ReturnType<typeof createSpringValue>>>({})
  const [currentStep, setCurrentStep] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  // Latest steps / initial values (an inline array must not restart anything)
  const stepsRef = useRef(steps)
  stepsRef.current = steps
  const initialValuesRef = useRef(initialValues)
  initialValuesRef.current = initialValues
  // Bumped by play / stop / reset: callbacks of an older run are ignored
  const runIdRef = useRef(0)
  const cancelDelayRef = useRef<(() => void) | null>(null)

  // One MotionValue per key of any step, created during the first render so
  // `values` is complete (and stable) right away
  for (const step of steps) {
    for (const key of Object.keys(step.to)) {
      const existing = valuesRef.current[key]
      if (!existing || existing.isDestroyed()) {
        valuesRef.current[key] = createMotionValue(initialValues[key] ?? 0)
      }
    }
  }

  // Springs driving the values (destroyed by the cleanup, so they are
  // recreated when StrictMode re-runs the effect; the MotionValues survive)
  useEffect(() => {
    const springs = springsRef.current
    const runId = runIdRef
    for (const key of Object.keys(valuesRef.current)) {
      const existing = springs[key]
      if (!existing || existing.isDestroyed()) {
        springs[key] = createSpringValue(valuesRef.current[key]!.get(), {
          onUpdate: (v) => valuesRef.current[key]?.jump(v),
        })
      }
    }

    return () => {
      // Ignore callbacks of a run that was in progress
      runId.current++
      cancelDelayRef.current?.()
      cancelDelayRef.current = null
      Object.values(springs).forEach((s) => s.destroy())
    }
  }, [])

  const runStep = useCallback((stepIndex: number, runId: number) => {
    if (runIdRef.current !== runId) return
    const step = stepsRef.current[stepIndex]
    if (!step) {
      setIsPlaying(false)
      setCurrentStep(-1)
      return
    }

    const execute = () => {
      cancelDelayRef.current = null
      if (runIdRef.current !== runId) return
      setCurrentStep(stepIndex)

      // Animate to the step's values, then run the next step once every
      // value of this one has come to rest
      const finished: Promise<void>[] = []
      for (const [key, value] of Object.entries(step.to)) {
        const spring = springsRef.current[key]
        if (!spring || spring.isDestroyed()) continue
        if (step.config) spring.setConfig(step.config)
        spring.set(value)
        finished.push(spring.finished)
      }
      void Promise.all(finished).then(() => runStep(stepIndex + 1, runId))
    }

    // Animation time (follows the time scale and the test clock)
    if (step.delay && step.delay > 0) {
      cancelDelayRef.current = delay(step.delay, execute)
    } else {
      execute()
    }
  }, [])

  const play = useCallback(() => {
    if (isPlaying) return
    setIsPlaying(true)
    runStep(0, ++runIdRef.current)
  }, [isPlaying, runStep])

  const reset = useCallback(() => {
    runIdRef.current++
    cancelDelayRef.current?.()
    cancelDelayRef.current = null
    setIsPlaying(false)
    setCurrentStep(-1)

    // Reset all values to initial
    Object.keys(valuesRef.current).forEach((key) => {
      const initial = initialValuesRef.current[key] ?? 0
      springsRef.current[key]?.jump(initial)
      // jump() doesn't call the spring's onUpdate
      valuesRef.current[key]?.jump(initial)
    })
  }, [])

  const stop = useCallback(() => {
    runIdRef.current++
    cancelDelayRef.current?.()
    cancelDelayRef.current = null
    setIsPlaying(false)
  }, [])

  return {
    values: valuesRef.current,
    play,
    reset,
    stop,
    isPlaying,
    currentStep,
  }
}

// ============ usePointer ============

export interface UsePointerOptions {
  /** Target element ref (defaults to window) */
  target?: React.RefObject<HTMLElement>
  /**
   * Smooth the pointer movement: the fraction (0-1) of the remaining distance
   * covered per 60fps frame, independent of the display's refresh rate
   * (0 = no smoothing)
   */
  smooth?: number
  /** Track while element is hovered only */
  hoverOnly?: boolean
}

/**
 * Track pointer/mouse position as MotionValues
 *
 * @example
 * ```tsx
 * function FollowCursor() {
 *   const { x, y, isHovering } = usePointer({ smooth: 0.1 })
 *
 *   return (
 *     <div
 *       style={{
 *         position: 'fixed',
 *         left: x.get(),
 *         top: y.get(),
 *       }}
 *     />
 *   )
 * }
 * ```
 *
 * @example Relative to element
 * ```tsx
 * function HoverEffect() {
 *   const ref = useRef(null)
 *   const { x, y } = usePointer({ target: ref, hoverOnly: true })
 *
 *   // x, y are relative to element
 *   const rotateX = useTransform(y, [0, 300], [10, -10])
 *   const rotateY = useTransform(x, [0, 300], [-10, 10])
 *
 *   return <div ref={ref} style={{ rotateX, rotateY }} />
 * }
 * ```
 */
export function usePointer(options: UsePointerOptions = {}) {
  const { target, smooth = 0, hoverOnly = false } = options

  const xRef = useRef<MotionValue<number> | null>(null)
  const yRef = useRef<MotionValue<number> | null>(null)
  const rawXRef = useRef(0)
  const rawYRef = useRef(0)
  const [isHovering, setIsHovering] = useState(false)
  const frameRef = useRef<number | null>(null)

  // Recreate if destroyed (happens with React StrictMode double-mount)
  if (xRef.current === null || xRef.current.isDestroyed()) xRef.current = createMotionValue(0)
  if (yRef.current === null || yRef.current.isDestroyed()) yRef.current = createMotionValue(0)

  // Re-attaches when the target element changes - including a target that
  // mounts after the hook first ran (conditional rendering)
  useElementEffect(() => {
    const targetElement = target?.current ?? null
    const element = targetElement ?? window

    const handleMove = (e: MouseEvent | PointerEvent) => {
      let newX: number
      let newY: number

      if (targetElement) {
        const rect = targetElement.getBoundingClientRect()
        newX = e.clientX - rect.left
        newY = e.clientY - rect.top
      } else {
        newX = e.clientX
        newY = e.clientY
      }

      rawXRef.current = newX
      rawYRef.current = newY

      if (smooth === 0) {
        xRef.current?.jump(newX)
        yRef.current?.jump(newY)
      }
    }

    const handleEnter = () => setIsHovering(true)
    const handleLeave = () => setIsHovering(false)

    // Smoothing loop: `smooth` is the fraction of the remaining distance
    // covered per 60fps frame, applied for the real elapsed time
    if (smooth > 0) {
      const lastTime = { current: null as number | null }
      const smoothLoop = (now?: number) => {
        const k = smoothingFactor(smooth, elapsedFrames(lastTime, now))
        const currentX = xRef.current?.get() ?? 0
        const currentY = yRef.current?.get() ?? 0
        const newX = currentX + (rawXRef.current - currentX) * k
        const newY = currentY + (rawYRef.current - currentY) * k
        xRef.current?.jump(newX)
        yRef.current?.jump(newY)
        frameRef.current = requestAnimationFrame(smoothLoop)
      }
      frameRef.current = requestAnimationFrame(smoothLoop)
    }

    if (hoverOnly && targetElement) {
      targetElement.addEventListener('pointermove', handleMove as EventListener)
      targetElement.addEventListener('pointerenter', handleEnter)
      targetElement.addEventListener('pointerleave', handleLeave)
    } else {
      (element as Window | HTMLElement).addEventListener('pointermove', handleMove as EventListener)
      if (targetElement) {
        targetElement.addEventListener('pointerenter', handleEnter)
        targetElement.addEventListener('pointerleave', handleLeave)
      }
    }

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      if (hoverOnly && targetElement) {
        targetElement.removeEventListener('pointermove', handleMove as EventListener)
        targetElement.removeEventListener('pointerenter', handleEnter)
        targetElement.removeEventListener('pointerleave', handleLeave)
      } else {
        (element as Window | HTMLElement).removeEventListener('pointermove', handleMove as EventListener)
        if (targetElement) {
          targetElement.removeEventListener('pointerenter', handleEnter)
          targetElement.removeEventListener('pointerleave', handleLeave)
        }
      }
    }
  }, () => [target?.current ?? null, smooth, hoverOnly])

  // Cleanup: don't destroy MotionValues
  // (They are reused across React StrictMode remounts)
  useEffect(() => {
    return () => {
      xRef.current?.stop()
      yRef.current?.stop()
    }
  }, [])

  return {
    x: xRef.current,
    y: yRef.current,
    isHovering,
  }
}

// ============ useGyroscope ============

export interface UseGyroscopeOptions {
  /** Multiply the tilt values */
  multiplier?: number
  /** Clamp tilt to this range */
  clamp?: number
  /**
   * Smoothing: the fraction (0-1) of the remaining distance covered per 60fps
   * frame, independent of the display's refresh rate
   */
  smooth?: number
}

/**
 * Track device orientation/gyroscope as MotionValues
 *
 * Falls back to the mouse position on desktop: when `DeviceOrientationEvent`
 * is missing, or when no event with real values arrives within 500ms (desktop
 * Chrome defines the event but never reports orientation). `isSupported` only
 * becomes true once real orientation data arrives.
 *
 * @example
 * ```tsx
 * function TiltCard() {
 *   const { tiltX, tiltY, isSupported } = useGyroscope({
 *     multiplier: 0.5,
 *     clamp: 15
 *   })
 *
 *   return (
 *     <div
 *       style={{
 *         transform: `perspective(1000px) rotateX(${tiltY.get()}deg) rotateY(${tiltX.get()}deg)`
 *       }}
 *     />
 *   )
 * }
 * ```
 */
export function useGyroscope(options: UseGyroscopeOptions = {}) {
  const { multiplier = 1, clamp = 45, smooth = 0.1 } = options

  const tiltXRef = useRef<MotionValue<number> | null>(null)
  const tiltYRef = useRef<MotionValue<number> | null>(null)
  const rawXRef = useRef(0)
  const rawYRef = useRef(0)
  const [isSupported, setIsSupported] = useState(false)
  const frameRef = useRef<number | null>(null)

  // Recreate if destroyed (happens with React StrictMode double-mount)
  if (tiltXRef.current === null || tiltXRef.current.isDestroyed()) tiltXRef.current = createMotionValue(0)
  if (tiltYRef.current === null || tiltYRef.current.isDestroyed()) tiltYRef.current = createMotionValue(0)

  const clampValue = useCallback((value: number) => {
    return Math.max(-clamp, Math.min(clamp, value * multiplier))
  }, [clamp, multiplier])

  useEffect(() => {
    const hasOrientation = 'DeviceOrientationEvent' in window

    // Smoothing loop (per 60fps frame, applied for the real elapsed time)
    const lastTime = { current: null as number | null }
    const smoothLoop = (now?: number) => {
      const k = smoothingFactor(smooth, elapsedFrames(lastTime, now))
      const currentX = tiltXRef.current?.get() ?? 0
      const currentY = tiltYRef.current?.get() ?? 0
      const newX = currentX + (rawXRef.current - currentX) * k
      const newY = currentY + (rawYRef.current - currentY) * k
      tiltXRef.current?.jump(newX)
      tiltYRef.current?.jump(newY)
      frameRef.current = requestAnimationFrame(smoothLoop)
    }
    frameRef.current = requestAnimationFrame(smoothLoop)

    // Mouse position fallback (desktop)
    const handleMouse = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight / 2
      rawXRef.current = clampValue((e.clientX - centerX) / centerX * 45)
      rawYRef.current = clampValue((e.clientY - centerY) / centerY * 45)
    }
    let usingMouse = false
    const enableMouseFallback = () => {
      if (usingMouse) return
      usingMouse = true
      window.addEventListener('mousemove', handleMouse)
    }

    let fallbackTimer: ReturnType<typeof setTimeout> | null = null
    let handleOrientation: ((e: DeviceOrientationEvent) => void) | null = null

    if (hasOrientation) {
      handleOrientation = (e: DeviceOrientationEvent) => {
        // Desktop browsers may define DeviceOrientationEvent and fire a single
        // event with null values without having a sensor: ignore those
        if (e.gamma == null || e.beta == null) return
        if (fallbackTimer !== null) {
          clearTimeout(fallbackTimer)
          fallbackTimer = null
        }
        if (usingMouse) {
          usingMouse = false
          window.removeEventListener('mousemove', handleMouse)
        }
        setIsSupported(true)
        // gamma: left/right tilt (-90 to 90)
        // beta: front/back tilt (-180 to 180)
        rawXRef.current = clampValue(e.gamma)
        rawYRef.current = clampValue(e.beta)
      }

      window.addEventListener('deviceorientation', handleOrientation)
      // No real orientation data shortly after mounting: fall back to the mouse
      fallbackTimer = setTimeout(() => {
        fallbackTimer = null
        enableMouseFallback()
      }, GYROSCOPE_FALLBACK_MS)
    } else {
      enableMouseFallback()
    }

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      if (fallbackTimer !== null) clearTimeout(fallbackTimer)
      if (handleOrientation) window.removeEventListener('deviceorientation', handleOrientation)
      if (usingMouse) window.removeEventListener('mousemove', handleMouse)
    }
  }, [clampValue, smooth])

  // Cleanup: don't destroy MotionValues
  // (They are reused across React StrictMode remounts)
  useEffect(() => {
    return () => {
      tiltXRef.current?.stop()
      tiltYRef.current?.stop()
    }
  }, [])

  return {
    tiltX: tiltXRef.current,
    tiltY: tiltYRef.current,
    isSupported,
  }
}

/**
 * How long useGyroscope waits for a deviceorientation event with real values
 * before falling back to the mouse
 */
const GYROSCOPE_FALLBACK_MS = 500
