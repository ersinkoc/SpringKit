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

## Why SpringKit

- **Springs that run off the main thread.** `springEasing()` compiles real spring physics into a CSS `linear()` easing. CSS transitions and `element.animate()` then play it on the compositor, so a busy main thread doesn't make `transform`/`opacity` springs stutter, and no JavaScript runs per frame.
- **Exact, seekable physics.** `solveSpring()` is a closed-form solver, so you can read the spring's position and velocity at any millisecond. That makes springs scrubbable and frame-rate independent.
- **Exact physics everywhere.** `spring()` advances with the closed-form solution of the spring equation, so motion is identical at 30, 60, 120 or 144 Hz and never accumulates integration error. `decay()` uses the iOS momentum model in real units (px/s).
- **Animations you can test.** `@oxog/springkit/testing` installs a virtual clock, so tests run frame-perfect and instantly with no flaky timeouts.
- **Design in milliseconds, not stiffness.** `defineSpring({ duration: 400, bounce: 0.2 })` uses the same perceptual model as SwiftUI and Jetpack Compose.
- **Small where it counts.** The `<Animated>` component (gestures, drag, presence, variants) is ~16 KB min+gzip including the physics core, compared with ~41 KB for Framer Motion's `motion` component (esbuild, React external, framer-motion 13.5, measured October 2026).
- **Fast.** The per-frame path allocates nothing and shares spring constants between springs; `npm run bench` measures 100 / 1,000 / 10,000 concurrent springs.
- **SSR-safe.** Every React export is tested with `renderToString` in Node and with hydration in the browser.
- **Framework-agnostic core, first-class React.** Zero dependencies and tree-shakeable. The React entry shares the core's single animation loop and works with Server Components.

## Features

### Native (Compositor) Springs
- **`springEasing(config)`** - Compile a spring to a CSS `linear()` easing + duration
- **`springTransition(props, config)`** - Ready-made `transition` value
- **`animateNative(el, keyframes, config)`** - WAAPI spring animation; respects `prefers-reduced-motion` and commits final styles
- **`solveSpring(config, from, to)`** - Analytic solver: `.at(ms)` gives value + velocity, `.duration` gives the settle time
- **`defineSpring({ duration, bounce })`** - Perceptual spring parameters

### Core Animation
- **Real Physics** - Spring, damping, mass with configurable parameters
- **Spring Values** - Create updatable animated values with `createSpringValue()`
- **Spring Groups** - Animate multiple values together with `createSpringGroup()`
- **Interruptible** - Pause, resume, reverse with velocity preservation
- **Presets** - bounce, gentle, stiff, wobbly, slow, molasses...
- **Physics Presets** - 38 semantic presets: button, modalEnter, toast, dragRelease, jelly...
- **Keyframes** - Multi-value animations with per-keyframe spring configs
- **Timeline API** - Complex choreographed animations with labels and controls

### Orchestration
- **Sequence** - Run animations one after another
- **Parallel** - Run multiple animations simultaneously
- **Stagger** - Run animations with customizable delay patterns
- **Stagger Patterns** - linear, center, wave, spiral, grid, random stagger functions
- **Trail Effect** - Follow animations with staggered delays
- **Decay** - iOS-style momentum in real units (px/s), with `from`, `modifyTarget` snapping and clamping

### Interpolation
- **Value Interpolation** - Map values between input/output ranges
- **Color Interpolation** - Smooth transitions between colors (hex, rgb, hsl, alpha), with premultiplied alpha and an optional perceptual `space: 'oklab'`
- **Extrapolation** - Clamp, extend, or identity modes for out-of-range values

### Gestures
- **Drag Spring** - Rubber band physics with bounds and release momentum
- **Snap Points** - Snap to grid or custom points on release
- **Drag Constraints** - Parent/element constraints, elastic bounds, momentum
- **Scroll Spring** - Momentum scrolling with edge bounce
- **Gesture Props** - `whileHover`, `whileTap`, `whileFocus`, `whileInView`, `whileDrag`

### SVG Animations
- **Path Animation** - `createPathAnimation()` for line drawing effects
- **SVG Morphing** - `createMorph()` for shape-to-shape transitions
- **Shape Library** - Built-in shapes: circle, rect, polygon, star, heart, arrow
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
- **Slow motion** - `globalLoop.setTimeScale(0.1)` slows every spring, decay, timeline, native animation and animation delay down for inspection; `0` freezes them. `delay(ms, cb)` is a `setTimeout` on that clock
- **Animation States** - `AnimationState` enum (Idle, Running, Paused, Complete)

### Math & Color Utilities
- **Math** - `clamp()`, `lerp()`, `mapRange()`, `degToRad()`, `radToDeg()`
- **Color** - `parseColor()`, `rgbToHex()`, `hexToRgb()`, `hslToRgb()`, `rgbToHsl()`

### React Integration
- **Hooks** - `useSpring`, `useSpringValue`, `useSprings`, `useTrail`, `useDrag`, `useGesture`
- **Motion Hooks** - `useMotionValue`, `useTransform`, `useInView`, `useScroll`, `useAnimate`
- **Variants System** - Declarative animation states with `useVariants`, `VariantProvider`
- **Accessibility** - `Animated`, drag, `Magnetic` and `Parallax` honor `prefers-reduced-motion` by default; `useReducedMotion`, `<MotionConfig reducedMotion>`
- **Any CSS value** - `<Animated>` springs numbers, colors (`'#f00'`, `'rebeccapurple'`, `transparent`), units (`'50%'`, `'2rem'`) and complex strings (`boxShadow`, `filter`)
- **Components** - `<Spring>`, `<Animated>`, `<Trail>`, `<AnimatePresence>` (`sync`, `wait`, `popLayout`), `<MotionConfig>`
- **Drag** - `<Animated drag>` with constraints, elasticity, momentum, snap-to-origin, `dragControls` and `onDragStart`/`onDrag`/`onDragEnd`
- **Motion components** - `createMotionComponent('li', { variants })` with automatic stagger under `<VariantProvider>`
- **Exit Animations** - `<AnimatePresence>` for unmounting component animations
- **Server Components ready** - The React entry ships with `"use client"`, so it works in the Next.js App Router

### Technical
- **Memory Safe** - WeakRef-based tracking, automatic garbage collection
- **Frame-drop Resilient** - Delta time clamping prevents animation jumps
- **Zero Dependencies** - No runtime dependencies
- **TypeScript** - Full type definitions included
- **Tree-shakeable** - ~3 KB min+gzip for `spring()` or `animateNative()` alone, ~31 KB for the entire core
- **ESM + CJS** - Dual package with correct types for every module resolution mode
- **95%+ Test Coverage** - Comprehensive test suite

## Installation

```bash
npm install @oxog/springkit
```

React bindings live in the `@oxog/springkit/react` entry point and require React 18 or newer. The core entry has no React dependency, and both entries share one animation loop.

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

### Compositor springs (no per-frame JavaScript)

```typescript
import { animateNative, springTransition, defineSpring } from '@oxog/springkit'

const pop = defineSpring({ duration: 450, bounce: 0.3 })

// Web Animations API, played by the browser
await animateNative(card, {
  transform: ['scale(0.9) translateY(20px)', 'none'],
  opacity: [0, 1],
}, pop).finished

// Or as a plain CSS transition
button.style.transition = springTransition(['transform', 'box-shadow'], pop)
```

In React, use it directly in `style`:

```tsx
<div style={{
  transform: open ? 'none' : 'translateX(-100%)',
  transition: springTransition('transform', defineSpring({ bounce: 0.2 })),
}} />
```

### Seekable springs

```typescript
import { solveSpring } from '@oxog/springkit'

const s = solveSpring({ stiffness: 260, damping: 18 }, 0, 300)
slider.oninput = () => {
  const { value } = s.at(slider.valueAsNumber * s.duration)
  el.style.transform = `translateX(${value}px)`
}
```

### Testing animations

```typescript
import { spring } from '@oxog/springkit'
import { installTestClock } from '@oxog/springkit/testing'

const clock = installTestClock()          // virtual rAF + performance.now
const anim = spring(0, 100).start()
clock.advance(100)                        // exactly 6 frames at 60fps
clock.runAll()                            // until everything is at rest
expect(anim.getValue()).toBe(100)
clock.uninstall()
```

Pass `{ timers: true }` to also virtualize `setTimeout`/`setInterval`, and `{ frameRate: 120 }` to simulate a high refresh rate display.

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
const faster = adjustSpeed(physicsPresets.modalEnter, 1.5)
const bouncier = adjustBounce(physicsPresets.button, 0.8)
```

### Variants System (v1.3.0)

```tsx
import { useVariants } from '@oxog/springkit/react'

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, scale: 1 },
  hover: { opacity: 1, y: 0, scale: 1.05 },
}

function Card() {
  const { values, setVariant } = useVariants({
    variants: cardVariants,
    initial: 'hidden',
    animate: 'visible',
  })

  return (
    <div
      style={{
        opacity: values.opacity as number,
        transform: `translateY(${values.y}px) scale(${values.scale})`,
      }}
      onMouseEnter={() => setVariant('hover')}
      onMouseLeave={() => setVariant('visible')}
    />
  )
}
```

### SVG Morphing (v1.3.0)

```typescript
import { createMorph, shapes } from '@oxog/springkit'

const circle = shapes.circle(50, 50, 40)
const star = shapes.star(50, 50, 40, 20, 5)

const morph = createMorph(circle, {
  spring: { stiffness: 120, damping: 14 },
})

// Render every intermediate path
morph.subscribe((d) => pathElement.setAttribute('d', d))

morph.morphTo(star)   // Morph from circle to star
morph.morphTo(circle) // Morph back
```

### Staggered lists with variants

```tsx
import { createMotionComponent, VariantProvider } from '@oxog/springkit/react'

const MotionLi = createMotionComponent('li', {
  variants: { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } },
})

<ul>
  <VariantProvider variant="visible" transition={{ staggerChildren: 60 }}>
    {items.map((item) => <MotionLi key={item.id} initial="hidden">{item.label}</MotionLi>)}
  </VariantProvider>
</ul>
```

### Draggable with momentum and constraints

```tsx
import { useRef } from 'react'
import { Animated } from '@oxog/springkit/react'

function Sheet() {
  const bounds = useRef<HTMLDivElement>(null)
  return (
    <div ref={bounds} className="area">
      <Animated.div
        drag
        dragConstraints={bounds}
        dragElastic={0.2}
        whileDrag={{ scale: 1.05 }}
        onDragEnd={(e, info) => console.log(info.velocity)} // px/s
      />
    </div>
  )
}
```

### Slow-motion debugging

```typescript
import { globalLoop } from '@oxog/springkit'

globalLoop.setTimeScale(0.1) // every animation at 10% speed
globalLoop.setTimeScale(1)   // back to normal
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

- **Upgrading from 1.x?** See the [migration guide](docs/MIGRATION-2.0.md) and the [changelog](CHANGELOG.md).
- **Using an AI coding assistant?** [`llms.txt`](llms.txt) is a compact, accurate API reference with units and conventions (also shipped in the npm package and served at [springkit.oxog.dev/llms.txt](https://springkit.oxog.dev/llms.txt)).

## License

MIT © [Ersin KOÇ](https://github.com/ersinkoc)
