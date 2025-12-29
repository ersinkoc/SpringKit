# SpringKit - Physics-Based Spring Animations with Gesture Support

## Package Identity

- **NPM Package**: `@oxog/springkit`
- **GitHub Repository**: `https://github.com/ersinkoc/springkit`
- **Documentation Site**: `https://springkit.oxog.dev`
- **License**: MIT
- **Author**: Ersin KOÇ
- **Created**: 2025-12-29

**NO social media, Discord, email, or external links.**

## Package Description

Zero-dependency physics-based spring animation library with gesture support.

SpringKit is a lightweight library for creating smooth, natural-feeling animations using real spring physics. Features configurable spring physics (stiffness, damping, mass), animated values with subscriptions, spring groups for animating multiple values, built-in animation presets (bounce, gentle, stiff, wobbly), interruptible and reversible animations, value and color interpolation, sequence and parallel animation orchestration, stagger and trail effects, drag spring with rubber band physics, scroll spring with momentum, decay animations, and comprehensive React integration with useSpring, useSpringValue, useSprings, useTrail, useDrag hooks and Spring, Animated, Trail components—all under 3KB with zero runtime dependencies.

---

## NON-NEGOTIABLE RULES

These rules are ABSOLUTE and must be followed without exception:

### 1. ZERO DEPENDENCIES
```json
{
  "dependencies": {}  // MUST BE EMPTY - NO EXCEPTIONS
}
```
Implement EVERYTHING from scratch. No runtime dependencies allowed.

### 2. 100% TEST COVERAGE & 100% SUCCESS RATE
- Every line of code must be tested
- Every branch must be tested
- All tests must pass (100% success rate)
- Use Vitest for testing
- Coverage report must show 100%

### 3. DEVELOPMENT WORKFLOW
Create these documents FIRST, before any code:
1. **SPECIFICATION.md** - Complete package specification
2. **IMPLEMENTATION.md** - Architecture and design decisions
3. **TASKS.md** - Ordered task list with dependencies

Only after these documents are complete, implement the code following TASKS.md sequentially.

### 4. TYPESCRIPT STRICT MODE
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  }
}
```

### 5. NO EXTERNAL LINKS
- ❌ No social media (Twitter, LinkedIn, etc.)
- ❌ No Discord/Slack links
- ❌ No email addresses
- ❌ No donation/sponsor links
- ✅ Only GitHub repo and documentation site allowed

### 6. BUNDLE SIZE TARGET
- Core package: < 3KB minified + gzipped
- With React adapter: < 5KB
- Tree-shakeable

---

## CORE TYPES

```typescript
// ============ SPRING CONFIG ============

interface SpringConfig {
  // Physics parameters
  stiffness?: number      // Spring stiffness (default: 100)
  damping?: number        // Damping ratio (default: 10)
  mass?: number           // Mass (default: 1)
  
  // Initial velocity
  velocity?: number
  
  // Rest thresholds
  restSpeed?: number      // Speed threshold (default: 0.01)
  restDelta?: number      // Position threshold (default: 0.01)
  
  // Behavior
  clamp?: boolean         // Clamp to [from, to] range
  
  // Callbacks
  onUpdate?: (value: number) => void
  onStart?: () => void
  onComplete?: () => void
  onRest?: () => void
}

// ============ SPRING PRESETS ============

interface SpringPresets {
  default: SpringConfig    // { stiffness: 100, damping: 10 }
  gentle: SpringConfig     // { stiffness: 120, damping: 14 }
  wobbly: SpringConfig     // { stiffness: 180, damping: 12 }
  stiff: SpringConfig      // { stiffness: 210, damping: 20 }
  slow: SpringConfig       // { stiffness: 280, damping: 60 }
  molasses: SpringConfig   // { stiffness: 280, damping: 120 }
  bounce: SpringConfig     // { stiffness: 200, damping: 8 }
  noWobble: SpringConfig   // { stiffness: 170, damping: 26 }
}

// ============ SPRING ANIMATION ============

interface SpringAnimation {
  // Control
  start(): SpringAnimation
  stop(): void
  pause(): void
  resume(): void
  reverse(): void
  
  // Update target
  set(to: number): void
  
  // State
  isAnimating(): boolean
  isPaused(): boolean
  isComplete(): boolean
  
  // Current values
  getValue(): number
  getVelocity(): number
  
  // Promise-based completion
  finished: Promise<void>
  
  // Cleanup
  destroy(): void
}

// ============ SPRING VALUE ============

interface SpringValue {
  // Get current value
  get(): number
  
  // Get velocity
  getVelocity(): number
  
  // Animate to value
  set(to: number, config?: Partial<SpringConfig>): void
  
  // Set immediately (no animation)
  jump(to: number): void
  
  // Subscribe to changes
  subscribe(callback: (value: number) => void): () => void
  
  // State
  isAnimating(): boolean
  
  // Promise for current animation
  finished: Promise<void>
  
  // Cleanup
  destroy(): void
}

// ============ SPRING GROUP ============

interface SpringGroup<T extends Record<string, number>> {
  // Get all values
  get(): T
  
  // Get single value
  getValue(key: keyof T): number
  
  // Animate to values
  set(values: Partial<T>, config?: Partial<SpringConfig>): void
  
  // Set immediately
  jump(values: Partial<T>): void
  
  // Subscribe to changes
  subscribe(callback: (values: T) => void): () => void
  
  // State
  isAnimating(): boolean
  
  // Promise for all animations
  finished: Promise<void>
  
  // Cleanup
  destroy(): void
}

// ============ INTERPOLATION ============

interface Interpolation {
  get(): number
}

interface ColorInterpolation {
  get(): string
}

interface InterpolateOptions {
  clamp?: boolean
  extrapolate?: 'extend' | 'clamp' | 'identity'
  extrapolateLeft?: 'extend' | 'clamp' | 'identity'
  extrapolateRight?: 'extend' | 'clamp' | 'identity'
}

// ============ DRAG SPRING ============

interface DragSpringConfig extends SpringConfig {
  // Axis
  axis?: 'x' | 'y' | 'both'
  
  // Bounds
  bounds?: {
    left?: number
    right?: number
    top?: number
    bottom?: number
  }
  
  // Rubber band effect at bounds
  rubberBand?: boolean
  rubberBandFactor?: number
  
  // Callbacks
  onDragStart?: (event: PointerEvent) => void
  onDrag?: (x: number, y: number, event: PointerEvent) => void
  onDragEnd?: (x: number, y: number, velocity: { x: number; y: number }) => void
  onUpdate?: (x: number, y: number) => void
}

interface DragSpring {
  // Enable/disable
  enable(): void
  disable(): void
  isEnabled(): boolean
  
  // Reset position
  reset(): void
  
  // Get position
  getPosition(): { x: number; y: number }
  
  // Set position (animated)
  setPosition(x: number, y: number): void
  
  // Release with velocity
  release(velocityX: number, velocityY: number): void
  
  // Cleanup
  destroy(): void
}

// ============ SCROLL SPRING ============

interface ScrollSpringConfig extends SpringConfig {
  // Direction
  direction?: 'horizontal' | 'vertical' | 'both'
  
  // Momentum
  momentum?: boolean
  momentumDecay?: number
  
  // Bounce at edges
  bounce?: boolean
  bounceStiffness?: number
  bounceDamping?: number
  
  // Callbacks
  onScroll?: (scrollX: number, scrollY: number) => void
  onScrollStart?: () => void
  onScrollEnd?: () => void
}

interface ScrollSpring {
  // Get scroll position
  getScroll(): { x: number; y: number }
  
  // Set scroll (animated)
  scrollTo(x: number, y: number): void
  scrollToElement(element: HTMLElement, offset?: number): void
  
  // Control
  enable(): void
  disable(): void
  
  // Cleanup
  destroy(): void
}

// ============ TRAIL ============

interface TrailConfig extends SpringConfig {
  followDelay?: number  // Frames delay between items
}

interface Trail {
  // Set leader value (others follow)
  set(value: number): void
  
  // Set all immediately
  jump(value: number): void
  
  // Get all values
  getValues(): number[]
  
  // Subscribe
  subscribe(callback: (values: number[]) => void): () => void
  
  // Cleanup
  destroy(): void
}

// ============ DECAY ============

interface DecayConfig {
  velocity: number
  deceleration?: number
  clamp?: [number, number]
  onUpdate?: (value: number) => void
  onComplete?: () => void
}

interface DecayAnimation {
  start(): DecayAnimation
  stop(): void
  finished: Promise<void>
}
```

---

## FACTORY FUNCTION

```typescript
import { spring, springPresets } from '@oxog/springkit'

// ===== BASIC USAGE =====

const anim = spring(0, 100, {
  onUpdate: (value) => {
    element.style.transform = `translateX(${value}px)`
  },
})

anim.start()


// ===== WITH PHYSICS CONFIG =====

const anim = spring(0, 200, {
  stiffness: 200,
  damping: 15,
  mass: 1,
  velocity: 0,
  
  onUpdate: (value) => {
    element.style.transform = `translateX(${value}px)`
  },
  
  onStart: () => {
    console.log('Animation started')
  },
  
  onComplete: () => {
    console.log('Animation complete')
  },
  
  onRest: () => {
    console.log('Spring at rest')
  },
})

anim.start()


// ===== USING PRESETS =====

const anim = spring(0, 100, {
  ...springPresets.bounce,
  onUpdate: (value) => {
    element.style.transform = `scale(${1 + value / 200})`
  },
})

anim.start()


// ===== PROMISE-BASED =====

const anim = spring(0, 100, {
  onUpdate: (value) => {
    element.style.opacity = value / 100
  },
})

await anim.start().finished
console.log('Animation complete!')


// ===== CLAMP VALUES =====

const anim = spring(0, 100, {
  clamp: true,  // Value won't overshoot
  onUpdate: (value) => {
    // value will always be between 0 and 100
  },
})
```

---

## SPRING CONTROL

```typescript
import { spring } from '@oxog/springkit'

const anim = spring(0, 100, {
  onUpdate: (value) => {
    element.style.transform = `translateX(${value}px)`
  },
})


// ============ START ============

anim.start()


// ============ STOP ============

// Stop immediately at current position
anim.stop()


// ============ PAUSE / RESUME ============

anim.pause()
// ...later
anim.resume()


// ============ REVERSE ============

// Reverse direction (swap from/to)
anim.reverse()


// ============ UPDATE TARGET ============

// Change target while animating
anim.set(200)


// ============ STATE ============

anim.isAnimating()  // true if running
anim.isPaused()     // true if paused
anim.isComplete()   // true if finished


// ============ GET VALUES ============

const currentValue = anim.getValue()
const currentVelocity = anim.getVelocity()


// ============ CLEANUP ============

anim.destroy()
```

---

## SPRING VALUE

```typescript
import { createSpringValue } from '@oxog/springkit'


// ============ CREATE SPRING VALUE ============

const x = createSpringValue(0, {
  stiffness: 100,
  damping: 10,
})


// ============ SUBSCRIBE ============

const unsubscribe = x.subscribe((value) => {
  element.style.transform = `translateX(${value}px)`
})

// Later...
unsubscribe()


// ============ ANIMATE TO VALUE ============

x.set(100)

// With custom config
x.set(200, {
  stiffness: 200,
  damping: 20,
})


// ============ SET IMMEDIATELY ============

// No animation, instant change
x.jump(0)


// ============ GET VALUE ============

const current = x.get()
const velocity = x.getVelocity()


// ============ STATE ============

x.isAnimating()  // true if animating


// ============ WAIT FOR COMPLETION ============

x.set(100)
await x.finished
console.log('Reached 100!')


// ============ MULTIPLE VALUES ============

const x = createSpringValue(0)
const y = createSpringValue(0)
const scale = createSpringValue(1)
const rotation = createSpringValue(0)

// Subscribe to each
x.subscribe(updateX)
y.subscribe(updateY)
scale.subscribe(updateScale)
rotation.subscribe(updateRotation)

// Animate
x.set(100)
y.set(50)
scale.set(1.5)
rotation.set(45)
```

---

## SPRING GROUP

```typescript
import { createSpringGroup } from '@oxog/springkit'


// ============ CREATE GROUP ============

const group = createSpringGroup({
  x: 0,
  y: 0,
  scale: 1,
  opacity: 1,
  rotation: 0,
}, {
  stiffness: 100,
  damping: 10,
})


// ============ SUBSCRIBE ============

const unsubscribe = group.subscribe((values) => {
  element.style.transform = `
    translate(${values.x}px, ${values.y}px)
    scale(${values.scale})
    rotate(${values.rotation}deg)
  `
  element.style.opacity = String(values.opacity)
})


// ============ ANIMATE VALUES ============

// Animate all
group.set({
  x: 100,
  y: 50,
  scale: 1.2,
  opacity: 0.8,
  rotation: 45,
})

// Animate some
group.set({
  x: 200,
  rotation: 90,
})


// ============ SET IMMEDIATELY ============

group.jump({
  x: 0,
  y: 0,
  scale: 1,
  opacity: 1,
  rotation: 0,
})


// ============ GET VALUES ============

const all = group.get()
// { x: 100, y: 50, scale: 1.2, opacity: 0.8, rotation: 45 }

const x = group.getValue('x')
// 100


// ============ WAIT FOR COMPLETION ============

group.set({ x: 200, y: 100 })
await group.finished
console.log('All values settled!')
```

---

## INTERPOLATION

```typescript
import { interpolate, interpolateColor } from '@oxog/springkit'


// ============ BASIC INTERPOLATION ============

const x = createSpringValue(0)

// Map 0-100 to 0-1 (opacity)
const opacity = interpolate(x, [0, 100], [0, 1])

x.subscribe(() => {
  element.style.opacity = String(opacity.get())
})

x.set(100)  // opacity animates to 1


// ============ MULTI-POINT INTERPOLATION ============

const progress = createSpringValue(0)

// Scale: starts at 1, peaks at 1.5, returns to 1
const scale = interpolate(progress, [0, 50, 100], [1, 1.5, 1])

progress.subscribe(() => {
  element.style.transform = `scale(${scale.get()})`
})


// ============ CLAMPED INTERPOLATION ============

const scroll = createSpringValue(0)

const headerOpacity = interpolate(
  scroll,
  [0, 100],
  [1, 0],
  { clamp: true }  // Won't go below 0 or above 1
)


// ============ EXTRAPOLATION ============

const value = createSpringValue(0)

const mapped = interpolate(
  value,
  [0, 100],
  [0, 200],
  {
    extrapolateLeft: 'clamp',   // Clamp for values < 0
    extrapolateRight: 'extend', // Extend for values > 100
  }
)


// ============ COLOR INTERPOLATION ============

const progress = createSpringValue(0)

// Interpolate through colors
const color = interpolateColor(
  progress,
  [0, 50, 100],
  ['#ff0000', '#00ff00', '#0000ff']
)

progress.subscribe(() => {
  element.style.backgroundColor = color.get()
})

progress.set(50)  // color is '#00ff00'


// ============ RGB / HSL COLORS ============

const color = interpolateColor(
  progress,
  [0, 100],
  ['rgb(255, 0, 0)', 'rgb(0, 0, 255)']
)

const color = interpolateColor(
  progress,
  [0, 100],
  ['hsl(0, 100%, 50%)', 'hsl(240, 100%, 50%)']
)


// ============ COMPLEX EXAMPLE ============

const scroll = createSpringValue(0)

// Multiple derived values
const headerOpacity = interpolate(scroll, [0, 100], [1, 0])
const headerScale = interpolate(scroll, [0, 100], [1, 0.8])
const headerY = interpolate(scroll, [0, 100], [0, -50])
const bgColor = interpolateColor(scroll, [0, 100], ['#ffffff', '#f0f0f0'])

scroll.subscribe(() => {
  header.style.opacity = String(headerOpacity.get())
  header.style.transform = `
    scale(${headerScale.get()})
    translateY(${headerY.get()}px)
  `
  header.style.backgroundColor = bgColor.get()
})

// Listen to scroll
window.addEventListener('scroll', () => {
  scroll.set(window.scrollY)
})
```

---

## SEQUENCE & STAGGER

```typescript
import { sequence, parallel, stagger } from '@oxog/springkit'


// ============ SEQUENCE ============

// Run animations one after another
await sequence([
  () => spring(0, 100, { onUpdate: (v) => el1.style.opacity = v/100 }).start(),
  () => spring(0, 200, { onUpdate: (v) => el2.style.left = v + 'px' }).start(),
  () => spring(0, 50, { onUpdate: (v) => el3.style.top = v + 'px' }).start(),
])

console.log('All animations complete!')


// ============ PARALLEL ============

// Run animations simultaneously
await parallel([
  () => spring(0, 100, { onUpdate: updateOpacity }).start(),
  () => spring(0, 200, { onUpdate: updateX }).start(),
  () => spring(1, 2, { onUpdate: updateScale }).start(),
])


// ============ MIXED ============

await sequence([
  // First, fade in
  () => spring(0, 1, { onUpdate: updateOpacity }).start(),
  
  // Then, move and scale together
  () => parallel([
    () => spring(0, 100, { onUpdate: updateX }).start(),
    () => spring(1, 1.2, { onUpdate: updateScale }).start(),
  ]),
  
  // Finally, rotate
  () => spring(0, 360, { onUpdate: updateRotation }).start(),
])


// ============ STAGGER ============

const elements = document.querySelectorAll('.item')

// Stagger with fixed delay
await stagger(
  elements,
  (element, index) => {
    return spring(0, 1, {
      onUpdate: (value) => {
        element.style.opacity = String(value)
        element.style.transform = `translateY(${(1 - value) * 20}px)`
      },
    }).start()
  },
  { delay: 50 }  // 50ms between each
)


// ============ STAGGER OPTIONS ============

await stagger(
  elements,
  (element, index) => {
    return spring(0, 100, {
      ...springPresets.gentle,
      onUpdate: (value) => {
        element.style.transform = `translateX(${value}px)`
      },
    }).start()
  },
  {
    // Fixed delay
    delay: 50,
    
    // Or dynamic delay
    delay: (index) => index * 30 + Math.random() * 20,
    
    // Start from
    from: 'first',   // 'first' | 'last' | 'center' | number
  }
)


// ============ STAGGER FROM CENTER ============

await stagger(
  elements,
  animateElement,
  {
    delay: 30,
    from: 'center',  // Items near center start first
  }
)


// ============ STAGGER FROM INDEX ============

await stagger(
  elements,
  animateElement,
  {
    delay: 30,
    from: 2,  // Start from index 2
  }
)
```

---

## TRAIL ANIMATION

```typescript
import { createTrail } from '@oxog/springkit'


// ============ CREATE TRAIL ============

const elements = document.querySelectorAll('.trail-item')

const trail = createTrail(elements.length, {
  stiffness: 120,
  damping: 14,
  followDelay: 2,  // Frames delay between items
})


// ============ SUBSCRIBE ============

trail.subscribe((values) => {
  values.forEach((value, index) => {
    elements[index].style.transform = `translateX(${value}px)`
  })
})


// ============ ANIMATE ============

// First item moves immediately, others follow
trail.set(100)

// All values animate toward 100
// with cascading delay


// ============ JUMP ============

// Set all immediately
trail.jump(0)


// ============ GET VALUES ============

const values = trail.getValues()
// [100, 95, 85, 70, ...] (each following the previous)


// ============ MOUSE FOLLOW EXAMPLE ============

const trail = createTrail(10, {
  stiffness: 200,
  damping: 25,
  followDelay: 3,
})

const dots = document.querySelectorAll('.dot')

trail.subscribe((values) => {
  // Use values for both X and Y
  // This example uses a single dimension
})

document.addEventListener('mousemove', (e) => {
  trail.set(e.clientX)
})
```

---

## DRAG SPRING

```typescript
import { createDragSpring } from '@oxog/springkit'


// ============ BASIC DRAG ============

const drag = createDragSpring(element, {
  onUpdate: (x, y) => {
    element.style.transform = `translate(${x}px, ${y}px)`
  },
})


// ============ WITH BOUNDS ============

const drag = createDragSpring(element, {
  bounds: {
    left: 0,
    right: 500,
    top: 0,
    bottom: 300,
  },
  
  onUpdate: (x, y) => {
    element.style.transform = `translate(${x}px, ${y}px)`
  },
})


// ============ WITH RUBBER BAND ============

const drag = createDragSpring(element, {
  bounds: { left: 0, right: 300, top: 0, bottom: 200 },
  
  // Enable rubber band effect at edges
  rubberBand: true,
  rubberBandFactor: 0.5,  // 0-1, how much stretch
  
  onUpdate: (x, y) => {
    element.style.transform = `translate(${x}px, ${y}px)`
  },
})


// ============ AXIS LOCK ============

// Horizontal only
const drag = createDragSpring(element, {
  axis: 'x',
  onUpdate: (x, y) => {
    element.style.transform = `translateX(${x}px)`
  },
})

// Vertical only
const drag = createDragSpring(element, {
  axis: 'y',
  onUpdate: (x, y) => {
    element.style.transform = `translateY(${y}px)`
  },
})


// ============ CALLBACKS ============

const drag = createDragSpring(element, {
  stiffness: 200,
  damping: 20,
  
  onDragStart: (event) => {
    element.classList.add('dragging')
  },
  
  onDrag: (x, y, event) => {
    console.log('Position:', x, y)
  },
  
  onDragEnd: (x, y, velocity) => {
    element.classList.remove('dragging')
    console.log('Released with velocity:', velocity)
  },
  
  onUpdate: (x, y) => {
    element.style.transform = `translate(${x}px, ${y}px)`
  },
})


// ============ CONTROL ============

// Disable dragging
drag.disable()

// Enable dragging
drag.enable()

// Check state
drag.isEnabled()

// Reset to initial position
drag.reset()

// Get current position
const { x, y } = drag.getPosition()

// Set position (animated)
drag.setPosition(100, 50)

// Simulate throw
drag.release(500, 0)  // velocity x, y


// ============ CLEANUP ============

drag.destroy()
```

---

## SCROLL SPRING

```typescript
import { createScrollSpring } from '@oxog/springkit'


// ============ BASIC SCROLL ============

const scroll = createScrollSpring(container, {
  onScroll: (scrollX, scrollY) => {
    content.style.transform = `translateY(${-scrollY}px)`
  },
})


// ============ WITH MOMENTUM ============

const scroll = createScrollSpring(container, {
  momentum: true,
  momentumDecay: 0.95,
  
  onScroll: (scrollX, scrollY) => {
    content.style.transform = `translateY(${-scrollY}px)`
  },
})


// ============ WITH BOUNCE ============

const scroll = createScrollSpring(container, {
  bounce: true,
  bounceStiffness: 300,
  bounceDamping: 20,
  
  onScroll: (scrollX, scrollY) => {
    content.style.transform = `translateY(${-scrollY}px)`
  },
})


// ============ HORIZONTAL ============

const scroll = createScrollSpring(container, {
  direction: 'horizontal',
  
  onScroll: (scrollX, scrollY) => {
    content.style.transform = `translateX(${-scrollX}px)`
  },
})


// ============ BOTH DIRECTIONS ============

const scroll = createScrollSpring(container, {
  direction: 'both',
  
  onScroll: (scrollX, scrollY) => {
    content.style.transform = `translate(${-scrollX}px, ${-scrollY}px)`
  },
})


// ============ CALLBACKS ============

const scroll = createScrollSpring(container, {
  onScrollStart: () => {
    console.log('Scroll started')
  },
  
  onScroll: (scrollX, scrollY) => {
    console.log('Scrolling:', scrollX, scrollY)
  },
  
  onScrollEnd: () => {
    console.log('Scroll ended')
  },
})


// ============ CONTROL ============

// Get scroll position
const { x, y } = scroll.getScroll()

// Scroll to position
scroll.scrollTo(0, 500)

// Scroll to element
scroll.scrollToElement(targetElement)
scroll.scrollToElement(targetElement, { offset: -100 })

// Enable/disable
scroll.disable()
scroll.enable()


// ============ CLEANUP ============

scroll.destroy()
```

---

## DECAY ANIMATION

```typescript
import { decay } from '@oxog/springkit'


// ============ BASIC DECAY ============

// Natural momentum/deceleration
const anim = decay({
  velocity: 1000,  // Initial velocity
  
  onUpdate: (value) => {
    element.style.transform = `translateX(${value}px)`
  },
  
  onComplete: () => {
    console.log('Decay complete')
  },
})

anim.start()


// ============ WITH DECELERATION ============

const anim = decay({
  velocity: 500,
  deceleration: 0.998,  // 0-1, higher = slower decay
  
  onUpdate: (value) => {
    container.scrollLeft = value
  },
})

anim.start()


// ============ WITH CLAMP ============

const anim = decay({
  velocity: 1000,
  clamp: [0, 500],  // Stop at boundaries
  
  onUpdate: (value) => {
    element.style.transform = `translateX(${value}px)`
  },
})


// ============ CONTROL ============

const anim = decay({ velocity: 500, onUpdate })

anim.start()
anim.stop()

await anim.finished
```

---

## REACT INTEGRATION

```tsx
import {
  // Hooks
  useSpring,
  useSpringValue,
  useSprings,
  useTrail,
  useDrag,
  useGesture,
  
  // Components
  Spring,
  Animated,
  Trail,
  
  // Presets
  springPresets,
} from '@oxog/springkit/react'


// ============ useSpring HOOK ============

function AnimatedBox() {
  const [isOpen, setIsOpen] = useState(false)
  
  const style = useSpring({
    width: isOpen ? 300 : 100,
    height: isOpen ? 200 : 100,
    opacity: isOpen ? 1 : 0.5,
    rotation: isOpen ? 180 : 0,
    scale: isOpen ? 1.2 : 1,
  }, {
    stiffness: 100,
    damping: 10,
  })
  
  return (
    <div
      onClick={() => setIsOpen(!isOpen)}
      style={{
        width: style.width,
        height: style.height,
        opacity: style.opacity,
        transform: `rotate(${style.rotation}deg) scale(${style.scale})`,
        background: '#3b82f6',
        borderRadius: 8,
        cursor: 'pointer',
      }}
    />
  )
}


// ============ useSpring WITH FROM ============

function FadeIn() {
  const style = useSpring(
    { opacity: 1, y: 0 },
    {
      from: { opacity: 0, y: 20 },
      stiffness: 100,
      damping: 15,
    }
  )
  
  return (
    <div
      style={{
        opacity: style.opacity,
        transform: `translateY(${style.y}px)`,
      }}
    >
      Faded in content
    </div>
  )
}


// ============ useSpringValue HOOK ============

function ProgressBar({ value }) {
  const progress = useSpringValue(value, {
    stiffness: 100,
    damping: 20,
  })
  
  return (
    <div className="progress-container">
      <div
        className="progress-bar"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}


// ============ useSprings HOOK ============

function AnimatedList({ items }) {
  const springs = useSprings(
    items.length,
    items.map((item, index) => ({
      opacity: 1,
      y: 0,
      from: { opacity: 0, y: 20 },
      delay: index * 50,
    }))
  )
  
  return (
    <ul>
      {items.map((item, index) => (
        <li
          key={item.id}
          style={{
            opacity: springs[index].opacity,
            transform: `translateY(${springs[index].y}px)`,
          }}
        >
          {item.name}
        </li>
      ))}
    </ul>
  )
}


// ============ useTrail HOOK ============

function TrailList({ items, isVisible }) {
  const trail = useTrail(items.length, {
    opacity: isVisible ? 1 : 0,
    x: isVisible ? 0 : -20,
    config: springPresets.gentle,
  })
  
  return (
    <ul>
      {trail.map((style, index) => (
        <li
          key={items[index].id}
          style={{
            opacity: style.opacity,
            transform: `translateX(${style.x}px)`,
          }}
        >
          {items[index].name}
        </li>
      ))}
    </ul>
  )
}


// ============ useDrag HOOK ============

function DraggableCard() {
  const [{ x, y }, api] = useDrag({
    bounds: { left: 0, right: 300, top: 0, bottom: 200 },
    rubberBand: true,
    config: { stiffness: 200, damping: 20 },
  })
  
  return (
    <div
      {...api.bind()}
      style={{
        transform: `translate(${x}px, ${y}px)`,
        width: 100,
        height: 100,
        background: '#3b82f6',
        borderRadius: 8,
        cursor: 'grab',
        touchAction: 'none',
      }}
    >
      Drag me!
    </div>
  )
}


// ============ useDrag WITH THROW ============

function ThrowableCard() {
  const [{ x, y, scale }, api] = useDrag({
    onDragStart: () => {
      api.set({ scale: 1.1 })
    },
    onDragEnd: (velocity) => {
      api.set({ scale: 1 })
      // Card continues with velocity
    },
  })
  
  return (
    <div
      {...api.bind()}
      style={{
        transform: `translate(${x}px, ${y}px) scale(${scale})`,
      }}
    />
  )
}


// ============ useGesture HOOK ============

function GestureCard() {
  const [style, setStyle] = useState({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
  })
  
  const bind = useGesture({
    onDrag: ({ x, y }) => {
      setStyle(s => ({ ...s, x, y }))
    },
    onPinch: ({ scale }) => {
      setStyle(s => ({ ...s, scale }))
    },
    onRotate: ({ angle }) => {
      setStyle(s => ({ ...s, rotation: angle }))
    },
  })
  
  const spring = useSpring(style, {
    stiffness: 200,
    damping: 20,
  })
  
  return (
    <div
      {...bind()}
      style={{
        transform: `
          translate(${spring.x}px, ${spring.y}px)
          scale(${spring.scale})
          rotate(${spring.rotation}deg)
        `,
        touchAction: 'none',
      }}
    >
      Gesture enabled card
    </div>
  )
}
```

---

## REACT COMPONENTS

```tsx
// ============ Spring COMPONENT ============

// Basic usage
<Spring
  from={{ opacity: 0, y: 20 }}
  to={{ opacity: 1, y: 0 }}
>
  {(style) => (
    <div
      style={{
        opacity: style.opacity,
        transform: `translateY(${style.y}px)`,
      }}
    >
      Animated content
    </div>
  )}
</Spring>

// With config
<Spring
  from={{ scale: 0 }}
  to={{ scale: 1 }}
  config={springPresets.bounce}
  onRest={() => console.log('Animation complete')}
>
  {(style) => (
    <div style={{ transform: `scale(${style.scale})` }}>
      Bouncy!
    </div>
  )}
</Spring>

// Dynamic to value
<Spring
  to={{ opacity: isVisible ? 1 : 0 }}
>
  {(style) => <div style={style}>...</div>}
</Spring>


// ============ Animated COMPONENT ============

// Auto-animate any style changes
<Animated.div
  style={{
    opacity: isVisible ? 1 : 0,
    transform: `translateX(${isOpen ? 100 : 0}px)`,
  }}
  config={springPresets.gentle}
>
  Content automatically animates
</Animated.div>

// Available elements
<Animated.div>...</Animated.div>
<Animated.span>...</Animated.span>
<Animated.button>...</Animated.button>
<Animated.img src="..." />
<Animated.a href="...">...</Animated.a>
<Animated.p>...</Animated.p>
<Animated.h1>...</Animated.h1>
<Animated.ul>...</Animated.ul>
<Animated.li>...</Animated.li>

// With ref
const ref = useRef(null)
<Animated.div ref={ref}>...</Animated.div>


// ============ Trail COMPONENT ============

<Trail
  items={items}
  keys={(item) => item.id}
  from={{ opacity: 0, x: -20 }}
  to={{ opacity: 1, x: 0 }}
  config={springPresets.gentle}
>
  {(style, item, index) => (
    <div
      style={{
        opacity: style.opacity,
        transform: `translateX(${style.x}px)`,
      }}
    >
      {item.name}
    </div>
  )}
</Trail>

// With visibility toggle
<Trail
  items={items}
  keys={(item) => item.id}
  from={{ opacity: 0 }}
  to={{ opacity: isVisible ? 1 : 0 }}
  reverse={!isVisible}
>
  {(style, item) => (
    <div style={style}>{item.name}</div>
  )}
</Trail>
```

---

## UTILITY FUNCTIONS

```typescript
import {
  // Config helpers
  configFromDuration,
  configFromBounce,
  
  // Math utilities
  clamp,
  lerp,
  mapRange,
  
  // Presets
  springPresets,
} from '@oxog/springkit'


// ============ CONFIG FROM DURATION ============

// Create spring config that settles in ~300ms
const config = configFromDuration(300)
// { stiffness: 170, damping: 26 }

// Create config for ~500ms
const config = configFromDuration(500)
// { stiffness: 100, damping: 20 }


// ============ CONFIG FROM BOUNCE ============

// Create config with specific bounce amount
const config = configFromBounce(0)     // No bounce
// { stiffness: 170, damping: 26 }

const config = configFromBounce(0.25)  // 25% overshoot
// { stiffness: 200, damping: 12 }

const config = configFromBounce(0.5)   // 50% overshoot
// { stiffness: 200, damping: 8 }


// ============ MATH UTILITIES ============

// Clamp value to range
clamp(150, 0, 100)  // 100
clamp(-50, 0, 100)  // 0
clamp(50, 0, 100)   // 50

// Linear interpolation
lerp(0, 100, 0)     // 0
lerp(0, 100, 0.5)   // 50
lerp(0, 100, 1)     // 100

// Map value from one range to another
mapRange(50, 0, 100, 0, 1)      // 0.5
mapRange(25, 0, 100, 0, 200)    // 50
mapRange(75, 0, 100, -100, 100) // 50


// ============ PRESETS ============

springPresets.default   // { stiffness: 100, damping: 10 }
springPresets.gentle    // { stiffness: 120, damping: 14 }
springPresets.wobbly    // { stiffness: 180, damping: 12 }
springPresets.stiff     // { stiffness: 210, damping: 20 }
springPresets.slow      // { stiffness: 280, damping: 60 }
springPresets.molasses  // { stiffness: 280, damping: 120 }
springPresets.bounce    // { stiffness: 200, damping: 8 }
springPresets.noWobble  // { stiffness: 170, damping: 26 }
```

---

## TECHNICAL REQUIREMENTS

| Requirement | Value |
|-------------|-------|
| Runtime | Browser |
| Module | ESM + CJS |
| TypeScript | Strict mode |
| Dependencies | ZERO |
| Test Coverage | 100% |
| Bundle Size | < 3KB core |

---

## PROJECT STRUCTURE

```
springkit/
├── src/
│   ├── index.ts                    # Main exports
│   ├── types.ts                    # Type definitions
│   │
│   ├── core/
│   │   ├── spring.ts               # Main spring function
│   │   ├── spring-value.ts         # SpringValue class
│   │   ├── spring-group.ts         # SpringGroup class
│   │   ├── physics.ts              # Physics calculations
│   │   └── config.ts               # Configuration & presets
│   │
│   ├── animation/
│   │   ├── loop.ts                 # Animation loop (rAF)
│   │   ├── sequence.ts             # Sequence animations
│   │   ├── stagger.ts              # Stagger animations
│   │   ├── trail.ts                # Trail effect
│   │   └── decay.ts                # Decay animation
│   │
│   ├── gesture/
│   │   ├── drag.ts                 # Drag spring
│   │   ├── scroll.ts               # Scroll spring
│   │   └── pointer.ts              # Pointer event handling
│   │
│   ├── interpolation/
│   │   ├── interpolate.ts          # Value interpolation
│   │   ├── color.ts                # Color interpolation
│   │   └── utils.ts                # Interpolation utilities
│   │
│   ├── utils/
│   │   ├── math.ts                 # Math utilities
│   │   ├── color.ts                # Color parsing
│   │   └── helpers.ts              # Helper functions
│   │
│   ├── adapters/
│   │   └── react/
│   │       ├── index.ts
│   │       ├── hooks/
│   │       │   ├── useSpring.ts
│   │       │   ├── useSpringValue.ts
│   │       │   ├── useSprings.ts
│   │       │   ├── useTrail.ts
│   │       │   ├── useDrag.ts
│   │       │   └── useGesture.ts
│   │       └── components/
│   │           ├── Spring.tsx
│   │           ├── Animated.tsx
│   │           └── Trail.tsx
│   │
│   └── presets.ts                  # Spring presets
│
├── tests/
│   ├── unit/
│   │   ├── core/
│   │   ├── animation/
│   │   ├── gesture/
│   │   └── interpolation/
│   ├── integration/
│   │   ├── spring.test.ts
│   │   ├── sequence.test.ts
│   │   ├── drag.test.ts
│   │   └── react.test.tsx
│   └── fixtures/
│
├── examples/
│   ├── basic/
│   ├── drag/
│   ├── scroll/
│   ├── trail/
│   ├── interpolation/
│   └── react/
│
├── website/
│   └── [See WEBSITE section]
│
├── .github/
│   └── workflows/
│       └── deploy-website.yml
│
├── SPECIFICATION.md
├── IMPLEMENTATION.md
├── TASKS.md
├── README.md
├── CHANGELOG.md
├── LICENSE
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── vitest.config.ts
```

---

## DOCUMENTATION WEBSITE

Build a modern documentation site using React + Vite.

### Technology Stack (MANDATORY)

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18+ | UI framework |
| **Vite** | 5+ | Build tool |
| **TypeScript** | 5+ | Type safety |
| **Tailwind CSS** | 3+ | Styling (npm, NOT CDN) |
| **shadcn/ui** | Latest | UI components |
| **React Router** | 6+ | Routing |
| **Lucide React** | Latest | Icons |
| **Framer Motion** | Latest | Animations |
| **Prism.js** | Latest | Syntax highlighting |

### Fonts (MANDATORY)

- **JetBrains Mono** - ALL code
- **Inter** - Body text

### Required Pages

1. **Home** (`/`)
   - Hero with spring animation demo
   - Interactive playground
   - Install command
   - Feature highlights

2. **Getting Started** (`/docs/getting-started`)
   - Installation
   - Quick start
   - Basic usage

3. **Spring Basics** (`/docs/spring/*`)
   - Spring function
   - Spring values
   - Spring groups
   - Configuration

4. **Presets** (`/docs/presets`)
   - Built-in presets
   - Creating custom presets

5. **Interpolation** (`/docs/interpolation`)
   - Value interpolation
   - Color interpolation

6. **Gestures** (`/docs/gestures/*`)
   - Drag spring
   - Scroll spring

7. **Orchestration** (`/docs/orchestration/*`)
   - Sequence
   - Parallel
   - Stagger
   - Trail

8. **API Reference** (`/docs/api/*`)
   - spring
   - createSpringValue
   - createSpringGroup
   - interpolate
   - Types

9. **React Guide** (`/docs/react/*`)
   - Hooks
   - Components
   - Examples

10. **Examples** (`/examples`)
    - Card animations
    - Drag & drop
    - Page transitions
    - Gesture interactions

### Design Theme

- Orange/amber accent (#f59e0b) - Spring/bounce theme
- Dark mode default
- Light mode support

### GitHub Actions

```yaml
# .github/workflows/deploy-website.yml
name: Deploy Website

on:
  push:
    branches: [main]
    paths:
      - 'website/**'
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: website/package-lock.json
      - run: cd website && npm ci
      - run: cd website && npm run build
      - run: echo "springkit.oxog.dev" > website/dist/CNAME
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: website/dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

---

## README.md

````markdown
# SpringKit

<div align="center">
  <img src="website/public/logo.svg" alt="SpringKit" width="120" />
  <h3>Physics-based spring animations with gesture support</h3>
  <p>
    <a href="https://springkit.oxog.dev">Documentation</a> •
    <a href="https://springkit.oxog.dev/docs/getting-started">Getting Started</a> •
    <a href="https://springkit.oxog.dev/examples">Examples</a>
  </p>
</div>

<div align="center">

[![npm version](https://img.shields.io/npm/v/@oxog/springkit.svg)](https://www.npmjs.com/package/@oxog/springkit)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@oxog/springkit)](https://bundlephobia.com/package/@oxog/springkit)
[![license](https://img.shields.io/npm/l/@oxog/springkit.svg)](LICENSE)

</div>

---

## Features

- 🎯 **Real Physics** - Spring, damping, mass
- 📊 **Animated Values** - Subscribe to changes
- 🎨 **Interpolation** - Values & colors
- ⏸️ **Interruptible** - Pause, resume, reverse
- 🔗 **Orchestration** - Sequence, parallel, stagger
- 🐛 **Trail Effect** - Follow animations
- 🖱️ **Drag Spring** - Rubber band physics
- 📜 **Scroll Spring** - Momentum & bounce
- ⚡ **Decay** - Natural deceleration
- 🎨 **Presets** - bounce, gentle, stiff...
- ⚛️ **React** - Hooks & components
- 📦 **Zero Dependencies**
- ⚡ **< 3KB** - Tiny bundle

## Installation

```bash
npm install @oxog/springkit
```

## Quick Start

```typescript
import { spring, springPresets } from '@oxog/springkit'

const anim = spring(0, 100, {
  ...springPresets.bounce,
  onUpdate: (value) => {
    element.style.transform = `translateX(${value}px)`
  },
})

anim.start()
```

## React

```tsx
import { useSpring, Animated } from '@oxog/springkit/react'

function Box() {
  const [isOpen, setIsOpen] = useState(false)
  const style = useSpring({
    scale: isOpen ? 1.2 : 1,
    opacity: isOpen ? 1 : 0.5,
  })
  
  return (
    <Animated.div
      onClick={() => setIsOpen(!isOpen)}
      style={{ transform: `scale(${style.scale})`, opacity: style.opacity }}
    />
  )
}
```

## Documentation

Visit [springkit.oxog.dev](https://springkit.oxog.dev) for full documentation.

## License

MIT © [Ersin KOÇ](https://github.com/ersinkoc)
````

---

## IMPLEMENTATION CHECKLIST

### Before Implementation
- [ ] Create SPECIFICATION.md
- [ ] Create IMPLEMENTATION.md
- [ ] Create TASKS.md

### Core
- [ ] Spring physics engine
- [ ] SpringValue class
- [ ] SpringGroup class
- [ ] Animation loop (rAF)

### Animation
- [ ] Sequence
- [ ] Parallel
- [ ] Stagger
- [ ] Trail
- [ ] Decay

### Gestures
- [ ] Drag spring
- [ ] Scroll spring
- [ ] Rubber band effect

### Interpolation
- [ ] Value interpolation
- [ ] Color interpolation

### Config
- [ ] Presets
- [ ] configFromDuration
- [ ] configFromBounce

### React Adapter
- [ ] useSpring
- [ ] useSpringValue
- [ ] useSprings
- [ ] useTrail
- [ ] useDrag
- [ ] useGesture
- [ ] Spring component
- [ ] Animated component
- [ ] Trail component

### Testing
- [ ] 100% coverage
- [ ] All tests passing

### Website
- [ ] React + Vite setup
- [ ] All pages
- [ ] Interactive examples
- [ ] GitHub Actions

---

## BEGIN IMPLEMENTATION

Start by creating SPECIFICATION.md with the complete package specification. Then proceed with IMPLEMENTATION.md and TASKS.md before writing any actual code.

Remember: This package will be published to NPM. It must be production-ready, zero-dependency, fully tested, and professionally documented.

**Date: 2025-12-29**
**Author: Ersin KOÇ**
**Repository: github.com/ersinkoc/springkit**
**Website: springkit.oxog.dev**
