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

- **Real Physics** - Spring, damping, mass with configurable parameters
- **Memory Safe** - WeakRef-based tracking, automatic garbage collection
- **Frame-drop Resilient** - Delta time clamping prevents animation jumps
- **Animated Values** - Subscribe to changes with `onFrame` callbacks
- **Interpolation** - Values & colors with extrapolation modes
- **Interruptible** - Pause, resume, reverse with velocity preservation
- **Orchestration** - Sequence, parallel, stagger with promises
- **Trail Effect** - Follow animations with staggered delays
- **Drag Spring** - Rubber band physics with bounds
- **Scroll Spring** - Momentum & bounce with snap points
- **Decay** - Natural deceleration with velocity
- **Presets** - bounce, gentle, stiff, wobbly...
- **Physics Utils** - `calculateDampingRatio`, `isUnderdamped`, `isOverdamped`
- **React** - Hooks & components (`useSpring`, `useTrail`, `useDrag`)
- **Zero Dependencies** - No runtime dependencies
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
