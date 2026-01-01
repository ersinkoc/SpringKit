# SpringKit

<div align="center">
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

### Core Animation
- **Real Physics** - Spring, damping, mass with configurable parameters
- **Spring Values** - Create updatable animated values with `createSpringValue()`
- **Spring Groups** - Animate multiple values together with `createSpringGroup()`
- **Interruptible** - Pause, resume, reverse with velocity preservation
- **Presets** - bounce, gentle, stiff, wobbly, slow, molasses...
- **Physics Presets** - 40+ semantic presets: button, modal, toast, dragRelease, jelly...
- **Keyframes** - Multi-value animations with per-keyframe spring configs
- **Timeline API** - Complex choreographed animations with labels and controls

### Orchestration
- **Sequence** - Run animations one after another
- **Parallel** - Run multiple animations simultaneously
- **Stagger** - Run animations with customizable delay patterns
- **Stagger Patterns** - linear, center, wave, spiral, grid, random stagger functions
- **Trail Effect** - Follow animations with staggered delays
- **Decay** - Natural momentum deceleration with velocity

### Interpolation
- **Value Interpolation** - Map values between input/output ranges
- **Color Interpolation** - Smooth transitions between colors (hex, rgb, hsl)
- **Extrapolation** - Clamp, extend, or identity modes for out-of-range values

### Gestures
- **Drag Spring** - Rubber band physics with bounds and release momentum
- **Snap Points** - Snap to grid or custom points on release
- **Drag Constraints** - Parent/element constraints, elastic bounds, momentum
- **Scroll Spring** - Momentum scrolling with bounce and snap points
- **Gesture Props** - `whileHover`, `whileTap`, `whileFocus`, `whileInView`, `whileDrag`

### SVG Animations
- **Path Animation** - `createPathAnimation()` for line drawing effects
- **SVG Morphing** - `createMorph()` for shape-to-shape transitions
- **Shape Library** - Built-in shapes: circle, square, star, heart, triangle...
- **Path Utilities** - `getPathLength()`, `preparePathForAnimation()`, `getPointAtProgress()`

### Layout Animations (FLIP)
- **FLIP Technique** - Smooth layout change animations
- **Helper Functions** - `flip()`, `flipBatch()`, `measureElement()`

### Physics Utilities
- **Simulation** - `simulateSpring()` to preview animation over time
- **Analysis** - `calculatePeriod()`, `calculateDampingRatio()`
- **Damping Detection** - `isUnderdamped()`, `isCriticallyDamped()`, `isOverdamped()`

### Global Loop
- **Animation Manager** - `globalLoop` for FPS monitoring and animation tracking
- **Animation States** - `AnimationState` enum (Idle, Running, Paused, Complete)

### Math & Color Utilities
- **Math** - `clamp()`, `lerp()`, `mapRange()`, `degToRad()`, `radToDeg()`
- **Color** - `parseColor()`, `rgbToHex()`, `hexToRgb()`, `hslToRgb()`, `rgbToHsl()`

### React Integration
- **Hooks** - `useSpring`, `useSpringValue`, `useSprings`, `useTrail`, `useDrag`, `useGesture`
- **Motion Hooks** - `useMotionValue`, `useTransform`, `useInView`, `useScroll`, `useAnimate`
- **Variants System** - Declarative animation states with `useVariants`, `VariantProvider`
- **Accessibility** - `useReducedMotion` for motion-sensitive users
- **Components** - `<Spring>`, `<Animated>`, `<Trail>`, `<AnimatePresence>`, `<MotionConfig>`
- **Exit Animations** - `<AnimatePresence>` for unmounting component animations

### Technical
- **Memory Safe** - WeakRef-based tracking, automatic garbage collection
- **Frame-drop Resilient** - Delta time clamping prevents animation jumps
- **Zero Dependencies** - No runtime dependencies
- **TypeScript** - Full type definitions included
- **~7KB gzipped** - Tiny bundle size
- **95%+ Test Coverage** - Comprehensive test suite

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

### Basic Spring Animation

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

### Gesture Props

```tsx
import { Animated } from '@oxog/springkit/react'

function InteractiveButton() {
  return (
    <Animated.button
      whileHover={{ scale: 1.05, backgroundColor: '#3b82f6' }}
      whileTap={{ scale: 0.95 }}
      whileFocus={{ boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.5)' }}
    >
      Click Me
    </Animated.button>
  )
}
```

### Exit Animations

```tsx
import { AnimatePresence, Animated } from '@oxog/springkit/react'

function Modal({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <Animated.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={onClose}
        >
          Modal Content
        </Animated.div>
      )}
    </AnimatePresence>
  )
}
```

### SVG Path Animation

```tsx
import { createPathAnimation } from '@oxog/springkit'

const pathAnim = createPathAnimation(pathElement, {
  config: { stiffness: 100, damping: 15 },
})

// Draw the path
await pathAnim.play()

// Reverse (erase)
await pathAnim.reverse()
```

### Keyframes Animation

```typescript
import { keyframes } from '@oxog/springkit'

const anim = keyframes([0, 100, 50, 100], {
  config: { stiffness: 200, damping: 20 },
  onUpdate: (value) => {
    element.style.opacity = String(value / 100)
  },
})

await anim.play()
```

### FLIP Layout Animation

```typescript
import { flip } from '@oxog/springkit'

// Animate layout change
await flip(element, () => {
  element.classList.toggle('expanded')
}, {
  config: { stiffness: 300, damping: 25 }
})
```

### Physics Presets (v1.3.0)

```typescript
import { physicsPresets, getPhysicsPreset, createFeeling } from '@oxog/springkit'

// Use semantic presets directly
const anim = spring(0, 100, {
  ...physicsPresets.button, // Quick, responsive
  onUpdate: (v) => element.style.transform = `scale(${1 + v * 0.1})`
})

// Or use "feelings" for quick configuration
const config = createFeeling('bouncy') // snappy, smooth, bouncy, heavy, light, elastic

// Adjust presets
import { adjustSpeed, adjustBounce } from '@oxog/springkit'
const faster = adjustSpeed(physicsPresets.modal, 1.5)
const bouncier = adjustBounce(physicsPresets.button, 0.8)
```

### Variants System (v1.3.0)

```tsx
import { useVariants, VariantProvider } from '@oxog/springkit/react'

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  hover: { scale: 1.05 },
}

function Card() {
  const { variant, setVariant, style } = useVariants(cardVariants, 'initial')

  return (
    <div
      style={style}
      onMouseEnter={() => setVariant('hover')}
      onMouseLeave={() => setVariant('visible')}
    />
  )
}
```

### SVG Morphing (v1.3.0)

```typescript
import { createMorph, shapes } from '@oxog/springkit'

const morph = createMorph(pathElement, {
  from: shapes.circle(50, 50, 40),
  to: shapes.star(50, 50, 40, 20, 5),
})

await morph.play() // Morph from circle to star
await morph.reverse() // Morph back
```

### Drag with Snap Points (v1.3.0)

```tsx
import { useDrag } from '@oxog/springkit/react'

function DraggableCard() {
  const [pos, api] = useDrag({
    bounds: { left: -100, right: 100, top: -50, bottom: 50 },
    snap: {
      grid: { x: 50, y: 50 }, // Snap to grid
      snapOnRelease: true,
    },
  })

  return <div ref={api.ref} style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }} />
}
```

## Documentation

Visit [springkit.oxog.dev](https://springkit.oxog.dev) for full documentation.

## License

MIT © [Ersin KOÇ](https://github.com/ersinkoc)
