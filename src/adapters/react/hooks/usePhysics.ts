/**
 * Advanced Physics Hooks - SpringKit Exclusive
 *
 * These hooks provide advanced physics simulations that go beyond
 * simple spring animations.
 */

import { useRef, useEffect, useCallback, useState } from 'react'
import { createMotionValue, MotionValue } from '../../../core/MotionValue.js'
import { createSpringValue } from '../../../core/spring-value.js'
import type { SpringConfig } from '../../../types.js'

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

  // Initialize spring
  if (springRef.current === null) {
    springRef.current = createSpringValue(initial, {
      ...springConfig,
      onUpdate: (value) => {
        setState(value)
        onChange?.(value)
      },
    })
  }

  // Create motion value wrapper
  // Recreate if destroyed (happens with React StrictMode double-mount)
  if (motionValueRef.current === null || motionValueRef.current.isDestroyed()) {
    motionValueRef.current = createMotionValue(initial)
  }

  // Sync motion value with spring
  useEffect(() => {
    const unsub = springRef.current?.subscribe((v) => {
      motionValueRef.current?.jump(v)
    })
    return () => unsub?.()
  }, [])

  // Cleanup: stop animations but don't destroy (reused across StrictMode remounts)
  useEffect(() => {
    return () => {
      springRef.current?.stop()
    }
  }, [])

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

  // Recreate if destroyed (happens with React StrictMode double-mount)
  if (valueRef.current === null || valueRef.current.isDestroyed()) {
    valueRef.current = createMotionValue(0)
  }
  if (velocityRef.current === null || velocityRef.current.isDestroyed()) {
    velocityRef.current = createMotionValue(0)
  }

  const applyBounds = useCallback((val: number) => {
    if (!bounds) return val
    let result = val
    if (bounds.min !== undefined) result = Math.max(bounds.min, result)
    if (bounds.max !== undefined) result = Math.min(bounds.max, result)
    return result
  }, [bounds])

  const tick = useCallback(() => {
    if (!isActiveRef.current) return

    const currentVelocity = velocityRef.current?.get() ?? 0
    const currentValue = valueRef.current?.get() ?? 0

    // Apply friction
    const newVelocity = currentVelocity * friction

    // Update value
    const newValue = applyBounds(currentValue + newVelocity)
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
  }, [friction, minVelocity, bounds, applyBounds, onRest])

  const push = useCallback((velocity: number) => {
    // Validate velocity
    if (!Number.isFinite(velocity)) return

    velocityRef.current?.jump(velocity)
    isActiveRef.current = true
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
  if (springRef.current === null) {
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
  const motionValueRef = useRef<MotionValue<number> | null>(null)
  if (motionValueRef.current === null) {
    motionValueRef.current = createMotionValue(ceiling)
  }
  const motionValue = motionValueRef.current
  const velocityRef = useRef(0)
  const frameRef = useRef<number | null>(null)
  const isActiveRef = useRef(false)

  const tick = useCallback(() => {
    if (!isActiveRef.current) return

    const currentValue = motionValue.get()

    // Apply gravity
    velocityRef.current += gravity

    // Apply air resistance
    velocityRef.current *= (1 - dampening)

    // Update position
    let newValue = currentValue + velocityRef.current

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
  }, [motionValue, gravity, dampening, floor, ceiling, restitution])

  const drop = useCallback((fromY: number = ceiling, initialVelocity: number = 0) => {
    // Validate inputs
    const safeFromY = Number.isFinite(fromY) ? fromY : ceiling
    const safeVelocity = Number.isFinite(initialVelocity) ? initialVelocity : 0

    motionValue.jump(safeFromY)
    velocityRef.current = safeVelocity
    isActiveRef.current = true
    // Cancel any existing frame before starting new one
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    frameRef.current = requestAnimationFrame(tick)
  }, [motionValue, ceiling, tick])

  const bounce = useCallback((velocity: number) => {
    // Validate velocity
    if (!Number.isFinite(velocity)) return

    velocityRef.current = velocity
    isActiveRef.current = true
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

  const tick = useCallback(() => {
    if (!isActiveRef.current) return

    const currentX = xMotion.get()
    const currentY = yMotion.get()

    // Apply gravity (F = m * g, but we simplify to just g since mass affects velocity change)
    velocityRef.current.x += gravity.x
    velocityRef.current.y += gravity.y

    // Apply drag
    velocityRef.current.x *= (1 - drag)
    velocityRef.current.y *= (1 - drag)

    // Update position
    let newX = currentX + velocityRef.current.x
    let newY = currentY + velocityRef.current.y

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

    // Continue if there's still movement
    const totalVelocity = Math.abs(velocityRef.current.x) + Math.abs(velocityRef.current.y)
    if (totalVelocity > 0.01 || gravity.x !== 0 || gravity.y !== 0) {
      frameRef.current = requestAnimationFrame(tick)
    } else {
      isActiveRef.current = false
    }
  }, [xMotion, yMotion, gravity, drag, bounds, bounciness])

  const launch = useCallback((velocity: { x: number; y: number }) => {
    // Validate velocities
    const safeX = Number.isFinite(velocity.x) ? velocity.x : 0
    const safeY = Number.isFinite(velocity.y) ? velocity.y : 0

    velocityRef.current = { x: safeX, y: safeY }
    isActiveRef.current = true
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
  const timeoutRef = useRef<number | null>(null)

  // Initialize values from steps
  useEffect(() => {
    const allKeys = new Set<string>()
    steps.forEach((step) => {
      Object.keys(step.to).forEach((key) => allKeys.add(key))
    })

    allKeys.forEach((key) => {
      // Recreate if destroyed (happens with React StrictMode double-mount)
      if (!valuesRef.current[key] || valuesRef.current[key].isDestroyed()) {
        const initial = initialValues[key] ?? 0
        valuesRef.current[key] = createMotionValue(initial)
        springsRef.current[key] = createSpringValue(initial, {
          onUpdate: (v) => valuesRef.current[key]?.jump(v),
        })
      }
    })

    // Cleanup: stop springs but don't destroy MotionValues
    // (They are reused across React StrictMode remounts)
    return () => {
      Object.values(springsRef.current).forEach((s) => s.stop())
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
    // Mount only - steps and initialValues used for initialization
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const runStep = useCallback((stepIndex: number) => {
    if (stepIndex >= steps.length) {
      setIsPlaying(false)
      setCurrentStep(-1)
      return
    }

    const step = steps[stepIndex]
    if (!step) return

    const execute = () => {
      setCurrentStep(stepIndex)

      // Animate to step values
      Object.entries(step.to).forEach(([key, value]) => {
        const spring = springsRef.current[key]
        if (spring) {
          if (step.config) {
            spring.setConfig(step.config)
          }
          spring.set(value)
        }
      })

      // Wait for animations to complete then run next step
      // For simplicity, we estimate based on spring settings
      const estimatedDuration = step.config?.stiffness
        ? Math.max(300, 1000 / (step.config.stiffness / 100))
        : 500

      timeoutRef.current = window.setTimeout(() => {
        runStep(stepIndex + 1)
      }, estimatedDuration)
    }

    if (step.delay && step.delay > 0) {
      timeoutRef.current = window.setTimeout(execute, step.delay)
    } else {
      execute()
    }
  }, [steps])

  const play = useCallback(() => {
    if (isPlaying) return
    setIsPlaying(true)
    runStep(0)
  }, [isPlaying, runStep])

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsPlaying(false)
    setCurrentStep(-1)

    // Reset all values to initial
    Object.keys(valuesRef.current).forEach((key) => {
      const initial = initialValues[key] ?? 0
      springsRef.current[key]?.jump(initial)
    })
  }, [initialValues])

  const stop = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsPlaying(false)
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
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
  /** Smooth the pointer movement */
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

  useEffect(() => {
    const element = target?.current ?? window

    const handleMove = (e: MouseEvent | PointerEvent) => {
      let newX: number
      let newY: number

      if (target?.current) {
        const rect = target.current.getBoundingClientRect()
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

    // Smoothing loop
    if (smooth > 0) {
      const smoothLoop = () => {
        const currentX = xRef.current?.get() ?? 0
        const currentY = yRef.current?.get() ?? 0
        const newX = currentX + (rawXRef.current - currentX) * smooth
        const newY = currentY + (rawYRef.current - currentY) * smooth
        xRef.current?.jump(newX)
        yRef.current?.jump(newY)
        frameRef.current = requestAnimationFrame(smoothLoop)
      }
      frameRef.current = requestAnimationFrame(smoothLoop)
    }

    if (hoverOnly && target?.current) {
      target.current.addEventListener('pointermove', handleMove as EventListener)
      target.current.addEventListener('pointerenter', handleEnter)
      target.current.addEventListener('pointerleave', handleLeave)
    } else {
      (element as Window | HTMLElement).addEventListener('pointermove', handleMove as EventListener)
      if (target?.current) {
        target.current.addEventListener('pointerenter', handleEnter)
        target.current.addEventListener('pointerleave', handleLeave)
      }
    }

    // Capture target ref at effect creation time for cleanup
    const targetElement = target?.current

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
  }, [target, smooth, hoverOnly])

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
  /** Smooth the values */
  smooth?: number
}

/**
 * Track device orientation/gyroscope as MotionValues
 *
 * Falls back to pointer position on desktop.
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

    // Smoothing loop
    const smoothLoop = () => {
      const currentX = tiltXRef.current?.get() ?? 0
      const currentY = tiltYRef.current?.get() ?? 0
      const newX = currentX + (rawXRef.current - currentX) * smooth
      const newY = currentY + (rawYRef.current - currentY) * smooth
      tiltXRef.current?.jump(newX)
      tiltYRef.current?.jump(newY)
      frameRef.current = requestAnimationFrame(smoothLoop)
    }
    frameRef.current = requestAnimationFrame(smoothLoop)

    if (hasOrientation) {
      const handleOrientation = (e: DeviceOrientationEvent) => {
        setIsSupported(true)
        // gamma: left/right tilt (-90 to 90)
        // beta: front/back tilt (-180 to 180)
        rawXRef.current = clampValue(e.gamma ?? 0)
        rawYRef.current = clampValue(e.beta ?? 0)
      }

      window.addEventListener('deviceorientation', handleOrientation)

      return () => {
        if (frameRef.current) cancelAnimationFrame(frameRef.current)
        window.removeEventListener('deviceorientation', handleOrientation)
      }
    } else {
      // Fallback to mouse position
      const handleMouse = (e: MouseEvent) => {
        const centerX = window.innerWidth / 2
        const centerY = window.innerHeight / 2
        rawXRef.current = clampValue((e.clientX - centerX) / centerX * 45)
        rawYRef.current = clampValue((e.clientY - centerY) / centerY * 45)
      }

      window.addEventListener('mousemove', handleMouse)

      return () => {
        if (frameRef.current) cancelAnimationFrame(frameRef.current)
        window.removeEventListener('mousemove', handleMouse)
      }
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
