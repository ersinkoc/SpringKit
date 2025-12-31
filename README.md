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
- **Keyframes** - Multi-value animations with per-keyframe spring configs

### Orchestration
- **Sequence** - Run animations one after another
- **Parallel** - Run multiple animations simultaneously
- **Stagger** - Run animations with customizable delay patterns
- **Trail Effect** - Follow animations with staggered delays
- **Decay** - Natural momentum deceleration with velocity

### Interpolation
- **Value Interpolation** - Map values between input/output ranges
- **Color Interpolation** - Smooth transitions between colors (hex, rgb, hsl)
- **Extrapolation** - Clamp, extend, or identity modes for out-of-range values

### Gestures
- **Drag Spring** - Rubber band physics with bounds and release momentum
- **Scroll Spring** - Momentum scrolling with bounce and snap points
- **Gesture Props** - `whileHover`, `whileTap`, `whileFocus`, `whileInView`, `whileDrag`

### SVG Animations
- **Path Animation** - `createPathAnimation()` for line drawing effects
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

## Documentation

Visit [springkit.oxog.dev](https://springkit.oxog.dev) for full documentation.

## License

MIT © [Ersin KOÇ](https://github.com/ersinkoc)
