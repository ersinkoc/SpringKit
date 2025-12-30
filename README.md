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
- **Components** - `<Spring>`, `<Animated>`, `<Trail>`

### Technical
- **Memory Safe** - WeakRef-based tracking, automatic garbage collection
- **Frame-drop Resilient** - Delta time clamping prevents animation jumps
- **Zero Dependencies** - No runtime dependencies
- **TypeScript** - Full type definitions included
- **~7KB gzipped** - Tiny bundle size

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
