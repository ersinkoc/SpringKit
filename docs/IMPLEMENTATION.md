# SpringKit - Implementation Guide

## 1. Architecture Overview

### 1.1 Design Principles

1. **Zero Dependencies**: All functionality implemented from scratch
2. **Tree-Shakeable**: Use ES modules, export named functions
3. **Type Safety**: Strict TypeScript with comprehensive types
4. **Performance**: Use requestAnimationFrame, minimize allocations
5. **API Ergonomics**: Fluent, chainable, intuitive API

### 1.2 Module Architecture

```
                    ┌─────────────────────┐
                    │    index.ts         │
                    │   (Public API)      │
                    └──────────┬──────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌───────────────┐    ┌────────────────┐    ┌──────────────┐
│     Core      │    │   Animation    │    │  Interpolation│
│               │    │                │    │              │
│ - spring      │    │ - sequence     │    │ - interpolate │
│ - springValue │    │ - parallel     │    │ - color       │
│ - springGroup │    │ - stagger      │    │              │
│ - physics     │    │ - trail        │    └──────────────┘
│ - config      │    │ - decay        │
└───────────────┘    └────────────────┘
        │                      │
        └──────────┬───────────┘
                   │
                   ▼
          ┌────────────────┐
          │    Gesture     │
          │                │
          │ - drag         │
          │ - scroll       │
          │ - pointer      │
          └────────────────┘
```

## 2. Core Implementation Details

### 2.1 Spring Physics Engine

The spring animation is based on the **damped harmonic oscillator** equation:

```
F = -k * x - c * v
a = F / m
```

Where:
- `k` = stiffness (spring constant)
- `c` = damping coefficient
- `m` = mass
- `x` = displacement from rest
- `v` = velocity
- `a` = acceleration

#### Implementation Approach

```typescript
// physics.ts
export function simulateSpring(
  position: number,
  velocity: number,
  target: number,
  config: SpringConfig
): { position: number; velocity: number; isRest: boolean } {
  const {
    stiffness = 100,
    damping = 10,
    mass = 1,
    restSpeed = 0.01,
    restDelta = 0.01,
  } = config

  // Calculate spring force
  const displacement = target - position
  const springForce = stiffness * displacement

  // Calculate damping force (opposes velocity)
  const dampingForce = damping * velocity

  // Calculate acceleration (F = ma, so a = F/m)
  const acceleration = (springForce - dampingForce) / mass

  // Update velocity and position using semi-implicit Euler integration
  const newVelocity = velocity + acceleration
  const newPosition = position + newVelocity

  // Check if at rest
  const isRest =
    Math.abs(displacement) < restDelta &&
    Math.abs(newVelocity) < restSpeed

  return {
    position: newPosition,
    velocity: newVelocity,
    isRest,
  }
}
```

### 2.2 Animation Loop

A single shared animation loop using `requestAnimationFrame`:

```typescript
// loop.ts
class AnimationLoop {
  private animations = new Set<Animation>()
  private rafId: number | null = null

  add(animation: Animation) {
    this.animations.add(animation)
    this.start()
  }

  remove(animation: Animation) {
    this.animations.delete(animation)
    if (this.animations.size === 0) {
      this.stop()
    }
  }

  private start() {
    if (this.rafId !== null) return
    this.tick()
  }

  private stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  private tick = () => {
    const now = performance.now()

    for (const animation of this.animations) {
      animation.update(now)
    }

    // Clean up completed animations
    for (const animation of this.animations) {
      if (animation.isComplete()) {
        this.animations.delete(animation)
      }
    }

    if (this.animations.size > 0) {
      this.rafId = requestAnimationFrame(this.tick)
    } else {
      this.rafId = null
    }
  }
}

export const globalLoop = new AnimationLoop()
```

### 2.3 Spring Animation Class

```typescript
// spring.ts
export class SpringAnimation implements SpringAnimation {
  private position: number
  private velocity: number
  private target: number
  private config: SpringConfig
  private state: 'idle' | 'running' | 'paused' | 'complete'
  private resolveComplete: (() => void) | null = null
  private startTime: number | null = null
  private from: number
  private to: number

  finished: Promise<void>

  constructor(
    from: number,
    to: number,
    config: SpringConfig = {}
  ) {
    this.from = from
    this.to = to
    this.position = from
    this.velocity = config.velocity ?? 0
    this.target = to
    this.config = { ...defaultConfig, ...config }
    this.state = 'idle'

    this.finished = new Promise((resolve) => {
      this.resolveComplete = resolve
    })
  }

  start(): SpringAnimation {
    if (this.state === 'running') return this

    this.state = 'running'
    this.startTime = performance.now()
    this.config.onStart?.()
    globalLoop.add(this)
    return this
  }

  stop(): void {
    this.state = 'idle'
    globalLoop.remove(this)
  }

  pause(): void {
    if (this.state === 'running') {
      this.state = 'paused'
      globalLoop.remove(this)
    }
  }

  resume(): void {
    if (this.state === 'paused') {
      this.state = 'running'
      globalLoop.add(this)
    }
  }

  reverse(): void {
    const temp = this.from
    this.from = this.to
    this.to = temp
    this.target = this.to
  }

  set(to: number): void {
    this.to = to
    this.target = to
  }

  update(_now: number): void {
    if (this.state !== 'running') return

    const result = simulateSpring(
      this.position,
      this.velocity,
      this.target,
      this.config
    )

    this.position = result.position
    this.velocity = result.velocity

    // Handle clamping
    if (this.config.clamp) {
      const min = Math.min(this.from, this.to)
      const max = Math.max(this.from, this.to)
      this.position = clamp(this.position, min, max)
    }

    // Emit update
    this.config.onUpdate?.(this.position)

    // Check rest state
    if (result.isRest) {
      this.state = 'complete'
      globalLoop.remove(this)
      this.config.onComplete?.()
      this.config.onRest?.()
      this.resolveComplete?.()
    }
  }

  isAnimating(): boolean {
    return this.state === 'running'
  }

  isPaused(): boolean {
    return this.state === 'paused'
  }

  isComplete(): boolean {
    return this.state === 'complete'
  }

  getValue(): number {
    return this.position
  }

  getVelocity(): number {
    return this.velocity
  }

  destroy(): void {
    this.stop()
    this.config.onUpdate = undefined
    this.config.onStart = undefined
    this.config.onComplete = undefined
    this.config.onRest = undefined
  }
}
```

### 2.4 SpringValue Class

```typescript
// spring-value.ts
export class SpringValue implements SpringValue {
  private value: number
  private config: SpringConfig
  private currentAnimation: SpringAnimation | null = null
  private subscribers = new Set<(value: number) => void>()
  private resolveComplete: (() => void) | null = null

  finished: Promise<void>

  constructor(initial: number, config: SpringConfig = {}) {
    this.value = initial
    this.config = { ...defaultConfig, ...config }

    this.finished = new Promise((resolve) => {
      this.resolveComplete = resolve
    })
  }

  get(): number {
    return this.value
  }

  getVelocity(): number {
    return this.currentAnimation?.getVelocity() ?? 0
  }

  set(to: number, config: Partial<SpringConfig> = {}): void {
    // Cancel existing animation
    if (this.currentAnimation) {
      this.currentAnimation.destroy()
    }

    // Create new animation
    this.currentAnimation = new SpringAnimation(this.value, to, {
      ...this.config,
      ...config,
      onUpdate: (value) => {
        this.value = value
        this.notify()
      },
      onComplete: () => {
        this.resolveComplete?.()
        // Reset promise for next animation
        this.finished = new Promise((resolve) => {
          this.resolveComplete = resolve
        })
      },
    })

    this.currentAnimation.start()
  }

  jump(to: number): void {
    if (this.currentAnimation) {
      this.currentAnimation.destroy()
      this.currentAnimation = null
    }
    this.value = to
    this.notify()
  }

  subscribe(callback: (value: number) => void): () => void {
    this.subscribers.add(callback)

    // Immediately call with current value
    callback(this.value)

    return () => {
      this.subscribers.delete(callback)
    }
  }

  isAnimating(): boolean {
    return this.currentAnimation?.isAnimating() ?? false
  }

  private notify(): void {
    for (const subscriber of this.subscribers) {
      subscriber(this.value)
    }
  }

  destroy(): void {
    this.currentAnimation?.destroy()
    this.subscribers.clear()
  }
}
```

### 2.5 SpringGroup Class

```typescript
// spring-group.ts
export class SpringGroup<T extends Record<string, number>> {
  private values: Map<keyof T, SpringValue>
  private config: SpringConfig
  private subscribers = new Set<(values: T) => void>()
  private resolveComplete: (() => void) | null = null

  finished: Promise<void>

  constructor(initialValues: T, config: SpringConfig = {}) {
    this.config = { ...defaultConfig, ...config }

    // Create SpringValue for each key
    this.values = new Map()
    for (const [key, value] of Object.entries(initialValues)) {
      const springValue = new SpringValue(value, this.config)
      springValue.subscribe(() => this.notify())
      this.values.set(key as keyof T, springValue)
    }

    this.finished = Promise.resolve()
  }

  get(): T {
    const result = {} as T
    for (const [key, springValue] of this.values) {
      result[key] = springValue.get()
    }
    return result
  }

  getValue(key: keyof T): number {
    return this.values.get(key)?.get() ?? 0
  }

  set(values: Partial<T>, config: Partial<SpringConfig> = {}): void {
    const promises: Promise<void>[] = []

    for (const [key, value] of Object.entries(values)) {
      const springValue = this.values.get(key as keyof T)
      if (springValue) {
        springValue.set(value, config)
        promises.push(springValue.finished)
      }
    }

    this.finished = Promise.all(promises).then(() => {})
  }

  jump(values: Partial<T>): void {
    for (const [key, value] of Object.entries(values)) {
      const springValue = this.values.get(key as keyof T)
      if (springValue) {
        springValue.jump(value)
      }
    }
    this.notify()
  }

  subscribe(callback: (values: T) => void): () => void {
    this.subscribers.add(callback)
    callback(this.get())
    return () => this.subscribers.delete(callback)
  }

  isAnimating(): boolean {
    for (const springValue of this.values.values()) {
      if (springValue.isAnimating()) return true
    }
    return false
  }

  private notify(): void {
    const values = this.get()
    for (const subscriber of this.subscribers) {
      subscriber(values)
    }
  }

  destroy(): void {
    for (const springValue of this.values.values()) {
      springValue.destroy()
    }
    this.subscribers.clear()
  }
}
```

## 3. Animation Orchestration

### 3.1 Sequence

```typescript
// sequence.ts
export async function sequence(
  animations: Array<() => SpringAnimation>
): Promise<void> {
  for (const createAnimation of animations) {
    const anim = createAnimation()
    await anim.finished
  }
}
```

### 3.2 Parallel

```typescript
// stagger.ts
export async function parallel(
  animations: Array<() => SpringAnimation>
): Promise<void> {
  const promises = animations.map((createAnimation) => {
    const anim = createAnimation()
    return anim.finished
  })
  await Promise.all(promises)
}
```

### 3.3 Stagger

```typescript
// stagger.ts
export async function stagger<T>(
  items: T[],
  animate: (item: T, index: number) => SpringAnimation,
  options: StaggerOptions = {}
): Promise<void> {
  const { delay = 0, from = 'first' } = options

  // Calculate start index based on 'from'
  let startIndex = 0
  if (from === 'last') startIndex = items.length - 1
  else if (from === 'center') startIndex = Math.floor(items.length / 2)
  else if (typeof from === 'number') startIndex = from

  const animations: SpringAnimation[] = []
  const indices: number[] = []

  // Build index order from start point outward
  const used = new Set<number>()
  indices.push(startIndex)
  used.add(startIndex)

  for (let offset = 1; offset < items.length; offset++) {
    const left = startIndex - offset
    const right = startIndex + offset

    if (right < items.length && !used.has(right)) {
      indices.push(right)
      used.add(right)
    }
    if (left >= 0 && !used.has(left)) {
      indices.push(left)
      used.add(left)
    }
  }

  // Start animations with delay
  const getDelay = typeof delay === 'function' ? delay : () => delay

  for (let i = 0; i < indices.length; i++) {
    const index = indices[i]
    const anim = animate(items[index], index)
    animations.push(anim)

    setTimeout(() => {
      anim.start()
    }, getDelay(i))
  }

  await Promise.all(animations.map((a) => a.finished))
}
```

### 3.4 Trail

```typescript
// trail.ts
export class Trail implements Trail {
  private springs: SpringValue[]
  private leader: SpringValue
  private followDelay: number
  private subscribers = new Set<(values: number[]) => void>()
  private frameCount: number = 0

  constructor(count: number, config: TrailConfig = {}) {
    const { followDelay = 2, ...springConfig } = config

    this.followDelay = followDelay

    // Create leader
    this.leader = new SpringValue(0, springConfig)

    // Create followers
    this.springs = []
    for (let i = 0; i < count; i++) {
      const spring = new SpringValue(0, springConfig)
      this.springs.push(spring)
    }

    // Connect leader to followers with delay
    this.leader.subscribe(() => {
      this.frameCount++
      const targetFrame = this.frameCount + this.followDelay

      // Schedule each follower to update after delay
      this.springs.forEach((spring, index) => {
        const delayFrames = (index + 1) * this.followDelay
        const targetValue = this.leader.get()

        // Use a frame counter to delay updates
        const startFrame = this.frameCount
        const checkFrame = () => {
          if (this.frameCount - startFrame >= delayFrames) {
            spring.set(targetValue)
          } else {
            requestAnimationFrame(checkFrame)
          }
        }
        checkFrame()
      })

      this.notify()
    })
  }

  set(value: number): void {
    this.leader.set(value)
  }

  jump(value: number): void {
    this.leader.jump(value)
    for (const spring of this.springs) {
      spring.jump(value)
    }
  }

  getValues(): number[] {
    return this.springs.map((s) => s.get())
  }

  subscribe(callback: (values: number[]) => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  private notify(): void {
    const values = this.getValues()
    for (const subscriber of this.subscribers) {
      subscriber(values)
    }
  }

  destroy(): void {
    this.leader.destroy()
    for (const spring of this.springs) {
      spring.destroy()
    }
    this.subscribers.clear()
  }
}
```

### 3.5 Decay

```typescript
// decay.ts
export class DecayAnimation implements DecayAnimation {
  private value: number
  private velocity: number
  private deceleration: number
  private clamp: [number, number] | undefined
  private state: 'idle' | 'running' | 'complete'
  private rafId: number | null = null
  private resolveComplete: (() => void) | null = null
  private config: DecayConfig

  finished: Promise<void>

  constructor(config: DecayConfig) {
    this.value = 0
    this.velocity = config.velocity
    this.deceleration = config.deceleration ?? 0.998
    this.clamp = config.clamp
    this.state = 'idle'
    this.config = config

    this.finished = new Promise((resolve) => {
      this.resolveComplete = resolve
    })
  }

  start(): DecayAnimation {
    if (this.state === 'running') return this
    this.state = 'running'
    this.tick()
    return this
  }

  stop(): void {
    this.state = 'idle'
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  private tick = () => {
    if (this.state !== 'running') return

    // Apply deceleration
    this.velocity *= this.deceleration
    this.value += this.velocity

    // Apply clamp
    if (this.clamp) {
      const [min, max] = this.clamp
      this.value = clamp(this.value, min, max)
    }

    this.config.onUpdate?.(this.value)

    // Check if stopped
    if (Math.abs(this.velocity) < 0.01) {
      this.state = 'complete'
      this.config.onComplete?.()
      this.resolveComplete?.()
      return
    }

    this.rafId = requestAnimationFrame(this.tick)
  }
}
```

## 4. Gesture Implementation

### 4.1 Drag Spring

```typescript
// drag.ts
export class DragSpring implements DragSpring {
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

    this.springX = new SpringValue(0, this.config)
    this.springY = new SpringValue(0, this.config)

    this.setupPointerEvents()
  }

  private setupPointerEvents(): void {
    this.element.addEventListener('pointerdown', this.onPointerDown)
  }

  private onPointerDown = (e: PointerEvent) => {
    if (!this.enabled) return

    this.isDragging = true
    this.startPosition = { ...this.position }
    this.pointerStart = { x: e.clientX, y: e.clientY }
    this.lastPosition = { x: e.clientX, y: e.clientY }
    this.lastTime = performance.now()

    this.element.setPointerCapture(e.pointerId)
    this.element.addEventListener('pointermove', this.onPointerMove)
    this.element.addEventListener('pointerup', this.onPointerUp)
    this.element.addEventListener('pointercancel', this.onPointerUp)

    this.config.onDragStart?.(e)
  }

  private onPointerMove = (e: PointerEvent) => {
    if (!this.isDragging) return

    const now = performance.now()
    const dt = now - this.lastTime

    // Calculate velocity
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
      newX = this.applyBounds(newX, 'x', this.config.bounds.left, this.config.bounds.right)
      newY = this.applyBounds(newY, 'y', this.config.bounds.top, this.config.bounds.bottom)
    }

    // Apply axis constraint
    if (this.config.axis === 'x') newY = 0
    if (this.config.axis === 'y') newX = 0

    this.position = { x: newX, y: newY }
    this.config.onDrag?.(newX, newY, e)
    this.config.onUpdate?.(newX, newY)
  }

  private applyBounds(
    value: number,
    axis: 'x' | 'y',
    min: number | undefined,
    max: number | undefined
  ): number {
    if (min === undefined && max === undefined) return value

    const actualMin = min ?? -Infinity
    const actualMax = max ?? Infinity

    if (this.config.rubberBand) {
      const factor = this.config.rubberBandFactor ?? 0.5
      if (value < actualMin) {
        return actualMin - (actualMin - value) * factor
      }
      if (value > actualMax) {
        return actualMax + (value - actualMax) * factor
      }
    }

    return clamp(value, actualMin, actualMax)
  }

  private onPointerUp = (e: PointerEvent) => {
    if (!this.isDragging) return

    this.isDragging = false

    this.element.releasePointerCapture(e.pointerId)
    this.element.removeEventListener('pointermove', this.onPointerMove)
    this.element.removeEventListener('pointerup', this.onPointerUp)
    this.element.removeEventListener('pointercancel', this.onPointerUp)

    // Release with velocity
    this.release(this.velocity.x * 1000, this.velocity.y * 1000)

    this.config.onDragEnd?.(this.position.x, this.position.y, this.velocity)
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
  }

  getPosition(): { x: number; y: number } {
    return this.position
  }

  setPosition(x: number, y: number): void {
    this.springX.set(x)
    this.springY.set(y)
    this.position = { x, y }
  }

  release(velocityX: number, velocityY: number): void {
    // Animate back to bounds if outside
    if (this.config.bounds) {
      const { left = -Infinity, right = Infinity, top = -Infinity, bottom = Infinity } = this.config.bounds

      const targetX = clamp(this.position.x, left, right)
      const targetY = clamp(this.position.y, top, bottom)

      if (targetX !== this.position.x || targetY !== this.position.y) {
        this.springX.set(targetX, { velocity: velocityX })
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
```

### 4.2 Scroll Spring

```typescript
// scroll.ts
export class ScrollSpring implements ScrollSpring {
  private container: HTMLElement
  private config: ScrollSpringConfig
  private scroll = { x: 0, y: 0 }
  private target = { x: 0, y: 0 }
  private momentum = { x: 0, y: 0 }
  private isScrolling = false
  private lastScroll = { x: 0, y: 0 }
  private lastTime = 0

  private springX: SpringValue
  private springY: SpringValue
  private rafId: number | null = null

  constructor(container: HTMLElement, config: ScrollSpringConfig = {}) {
    this.container = container
    this.config = { ...defaultScrollConfig, ...config }

    this.springX = new SpringValue(0, this.config)
    this.springY = new SpringValue(0, this.config)

    this.setupScrollEvents()
  }

  private setupScrollEvents(): void {
    this.container.addEventListener('scroll', this.onScroll, { passive: true })
    this.container.addEventListener('wheel', this.onWheel, { passive: false })
    this.container.addEventListener('pointerdown', this.onPointerDown)
  }

  private onScroll = () => {
    // Handled by wheel/pointer for momentum
  }

  private onWheel = (e: WheelEvent) => {
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

    this.target.x += deltaX
    this.target.y += deltaY

    // Apply bounce at edges
    if (this.config.bounce) {
      this.applyBounce()
    }

    this.startScrollLoop()
  }

  private applyBounce(): void {
    const maxScrollX = this.container.scrollWidth - this.container.clientWidth
    const maxScrollY = this.container.scrollHeight - this.container.clientHeight

    if (this.target.x < 0) {
      this.target.x = -Math.pow(-this.target.x, 0.5) * 10
    } else if (this.target.x > maxScrollX) {
      this.target.x = maxScrollX + Math.pow(this.target.x - maxScrollX, 0.5) * 10
    }

    if (this.target.y < 0) {
      this.target.y = -Math.pow(-this.target.y, 0.5) * 10
    } else if (this.target.y > maxScrollY) {
      this.target.y = maxScrollY + Math.pow(this.target.y - maxScrollY, 0.5) * 10
    }
  }

  private startScrollLoop(): void {
    if (this.rafId !== null) return

    const loop = () => {
      this.lastTime = performance.now()

      // Update with momentum
      if (this.config.momentum) {
        const decay = this.config.momentumDecay ?? 0.95
        this.momentum.x *= decay
        this.momentum.y *= decay

        if (Math.abs(this.momentum.x) < 0.1) this.momentum.x = 0
        if (Math.abs(this.momentum.y) < 0.1) this.momentum.y = 0
      }

      // Apply springs
      this.springX.set(this.target.x)
      this.springY.set(this.target.y)

      this.scroll.x = this.springX.get()
      this.scroll.y = this.springY.get()

      this.config.onScroll?.(this.scroll.x, this.scroll.y)

      // Check if settled
      const settled =
        Math.abs(this.scroll.x - this.target.x) < 0.1 &&
        Math.abs(this.scroll.y - this.target.y) < 0.1 &&
        this.momentum.x === 0 &&
        this.momentum.y === 0

      if (settied) {
        this.isScrolling = false
        this.config.onScrollEnd?.()
        this.rafId = null
      } else {
        this.rafId = requestAnimationFrame(loop)
      }
    }

    this.rafId = requestAnimationFrame(loop)
  }

  private onPointerDown = () => {
    // Cancel momentum on touch
    this.momentum = { x: 0, y: 0 }
  }

  getScroll(): { x: number; y: number } {
    return this.scroll
  }

  scrollTo(x: number, y: number): void {
    this.target = { x, y }
    this.springX.set(x)
    this.springY.set(y)
  }

  scrollToElement(element: HTMLElement, offset = 0): void {
    const rect = element.getBoundingClientRect()
    const containerRect = this.container.getBoundingClientRect()

    const x = rect.left - containerRect.left + offset
    const y = rect.top - containerRect.top + offset

    this.scrollTo(x, y)
  }

  enable(): void {
    // Re-enable scroll handling
  }

  disable(): void {
    // Disable scroll handling
  }

  destroy(): void {
    this.container.removeEventListener('scroll', this.onScroll)
    this.container.removeEventListener('wheel', this.onWheel)
    this.container.removeEventListener('pointerdown', this.onPointerDown)
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
    }
    this.springX.destroy()
    this.springY.destroy()
  }
}
```

## 5. Interpolation

### 5.1 Value Interpolation

```typescript
// interpolate.ts
export class InterpolationImpl implements Interpolation {
  private source: SpringValue | (() => number)
  private input: number[]
  private output: number[]
  private options: InterpolateOptions

  constructor(
    source: SpringValue | (() => number),
    input: number[],
    output: number[],
    options: InterpolateOptions = {}
  ) {
    this.source = source
    this.input = input
    this.output = output
    this.options = { ...defaultInterpolateOptions, ...options }
  }

  get(): number {
    const value = typeof this.source === 'function' ? this.source() : this.source.get()
    return this.interpolate(value)
  }

  private interpolate(value: number): number {
    const { input, output } = this
    const { extrapolate, extrapolateLeft, extrapolateRight, clamp } = this.options

    // Find the segment
    let i = 1
    while (i < input.length - 1 && value > input[i]) {
      i++
    }

    // Handle extrapolation
    if (value < input[0]) {
      const mode = extrapolateLeft || extrapolate || 'extend'
      if (mode === 'clamp') value = input[0]
      else if (mode === 'identity') return value
    } else if (value > input[input.length - 1]) {
      const mode = extrapolateRight || extrapolate || 'extend'
      if (mode === 'clamp') value = input[input.length - 1]
      else if (mode === 'identity') return value
    }

    // Interpolate within segment
    const ratio = (value - input[i - 1]) / (input[i] - input[i - 1])
    const result = output[i - 1] + ratio * (output[i] - output[i - 1])

    if (clamp) {
      const min = Math.min(...output)
      const max = Math.max(...output)
      return Math.max(min, Math.min(max, result))
    }

    return result
  }
}
```

### 5.2 Color Interpolation

```typescript
// color.ts
export class ColorInterpolationImpl implements ColorInterpolation {
  private source: SpringValue | (() => number)
  private input: number[]
  private colors: [number, number, number][]
  private options: InterpolateOptions

  constructor(
    source: SpringValue | (() => number),
    input: number[],
    colorStrings: string[],
    options: InterpolateOptions = {}
  ) {
    this.source = source
    this.input = input
    this.colors = colorStrings.map(parseColor)
    this.options = options
  }

  get(): string {
    const value = typeof this.source === 'function' ? this.source() : this.source.get()

    // Interpolate each RGB channel
    const r = this.interpolateChannel(value, 0)
    const g = this.interpolateChannel(value, 1)
    const b = this.interpolateChannel(value, 2)

    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
  }

  private interpolateChannel(value: number, channel: number): number {
    // Same interpolation logic as value interpolation
    // but applied to a single color channel
    const input = this.input
    let i = 1
    while (i < input.length - 1 && value > input[i]) {
      i++
    }

    const ratio = (value - input[i - 1]) / (input[i] - input[i - 1])
    const c1 = this.colors[i - 1][channel]
    const c2 = this.colors[i][channel]

    return c1 + ratio * (c2 - c1)
  }
}

function parseColor(color: string): [number, number, number] {
  // Parse hex, rgb, or named colors
  const ctx = document.createElement('canvas').getContext('2d')
  ctx.fillStyle = color
  const computed = ctx.fillStyle

  // Extract RGB from computed hex
  const r = parseInt(computed.slice(1, 3), 16)
  const g = parseInt(computed.slice(3, 5), 16)
  const b = parseInt(computed.slice(5, 7), 16)

  return [r, g, b]
}
```

## 6. React Integration

### 6.1 useSpring Hook

```typescript
// useSpring.ts
export function useSpring<T extends Record<string, number>>(
  values: T,
  config: Partial<SpringConfig> = {}
): AnimatedValues<T> {
  const springRef = useRef<SpringGroup<T> | null>(null)
  const [, forceUpdate] = useState({})

  // Initialize spring group
  if (!springRef.current) {
    const initialValues = Object.fromEntries(
      Object.entries(values).map(([k, v]) => [k, 0])
    ) as T

    springRef.current = new SpringGroup(initialValues, config)
    springRef.current.subscribe(() => forceUpdate({}))
  }

  // Update when values change
  useEffect(() => {
    springRef.current?.set(values, config)
  }, [values, config])

  // Cleanup
  useEffect(() => {
    return () => springRef.current?.destroy()
  }, [])

  return springRef.current.get()
}
```

### 6.2 Spring Component

```typescript
// Spring.tsx
export const Spring: SpringComponent = ({
  from,
  to,
  config = {},
  children,
  onRest,
}) => {
  const springRef = useRef<SpringGroup | null>(null)
  const [values, setValues] = useState(from)

  useEffect(() => {
    springRef.current = new SpringGroup(from, config)
    springRef.current.subscribe(setValues)

    // Start animation
    requestAnimationFrame(() => {
      springRef.current?.set(to, config)
    })

    return () => springRef.current?.destroy()
  }, [])

  useEffect(() => {
    springRef.current?.set(to, { ...config, onRest })
  }, [to, config])

  return children(values)
}
```

### 6.3 Animated Component

```typescript
// Animated.tsx
function createAnimatedComponent(tag: string) {
  return React.forwardRef<
    HTMLElement,
    React.HTMLAttributes<HTMLElement> & { config?: Partial<SpringConfig> }
  >(({ children, style = {}, config = {}, ...props }, ref) => {
    const springRef = useRef<SpringGroup | null>(null)
    const [currentStyle, setCurrentStyle] = useState<React.CSSProperties>({})

    useEffect(() => {
      springRef.current = new SpringGroup(
        Object.fromEntries(
          Object.entries(style).filter(([_, v]) => typeof v === 'number')
        ).map(([k, v]) => [k, 0]),
        config
      )
      springRef.current.subscribe((values) => {
        setCurrentStyle((prev) => ({ ...prev, ...values }))
      })

      return () => springRef.current?.destroy()
    }, [])

    useEffect(() => {
      const numericStyle = Object.fromEntries(
        Object.entries(style).filter(([_, v]) => typeof v === 'number')
      )
      springRef.current?.set(numericStyle, config)
    }, [style, config])

    return React.createElement(
      tag,
      { ...props, ref, style: { ...style, ...currentStyle } },
      children
    )
  })
}

export const Animated = {
  div: createAnimatedComponent('div'),
  span: createAnimatedComponent('span'),
  button: createAnimatedComponent('button'),
  // ... more elements
}
```

---

**Implementation Version**: 1.0.0
**Last Updated**: 2025-12-29
