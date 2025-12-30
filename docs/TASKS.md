# SpringKit - Implementation Tasks

## Phase 1: Project Setup

### Task 1.1: Initialize Project Structure
- [ ] Create package.json with correct configuration
- [ ] Create tsconfig.json with strict mode
- [ ] Create vitest.config.ts for testing
- [ ] Create tsup.config.ts for bundling
- [ ] Create directory structure
- [ ] Create .gitignore

**Dependencies**: None

---

## Phase 2: Core Utilities (Foundation)

### Task 2.1: Math Utilities (`src/utils/math.ts`)
- [ ] Implement `clamp(value, min, max)`
- [ ] Implement `lerp(a, b, t)`
- [ ] Implement `mapRange(value, inMin, inMax, outMin, outMax)`
- [ ] Write unit tests (100% coverage)

**Dependencies**: Task 1.1

---

### Task 2.2: Color Utilities (`src/utils/color.ts`)
- [ ] Implement `parseColor(color)` for hex, rgb, hsl
- [ ] Implement `rgbToHex(r, g, b)`
- [ ] Implement `hexToRgb(hex)`
- [ ] Implement `hslToRgb(h, s, l)`
- [ ] Implement `rgbToHsl(r, g, b)`
- [ ] Write unit tests (100% coverage)

**Dependencies**: Task 1.1

---

## Phase 3: Core Spring Implementation

### Task 3.1: Spring Physics (`src/core/physics.ts`)
- [ ] Implement `simulateSpring(position, velocity, target, config)`
- [ ] Implement semi-implicit Euler integration
- [ ] Implement rest detection (restSpeed, restDelta)
- [ ] Implement clamping
- [ ] Write unit tests for physics calculations
- [ ] Test edge cases (zero mass, extreme values)

**Dependencies**: Task 2.1

---

### Task 3.2: Animation Loop (`src/animation/loop.ts`)
- [ ] Implement `AnimationLoop` class
- [ ] Implement shared rAF loop
- [ ] Implement animation lifecycle management
- [ ] Create `globalLoop` singleton
- [ ] Write unit tests

**Dependencies**: Task 1.1

---

### Task 3.3: Spring Config & Presets (`src/core/config.ts`)
- [ ] Define `SpringConfig` interface
- [ ] Implement `defaultConfig`
- [ ] Implement `springPresets` (8 presets)
- [ ] Implement `configFromDuration(ms)`
- [ ] Implement `configFromBounce(bounce)`
- [ ] Write unit tests

**Dependencies**: Task 3.1

---

### Task 3.4: Spring Animation (`src/core/spring.ts`)
- [ ] Implement `SpringAnimation` class
- [ ] Implement `start()`, `stop()`, `pause()`, `resume()`
- [ ] Implement `reverse()`, `set(to)`
- [ ] Implement state getters (`isAnimating`, `isPaused`, `isComplete`)
- [ ] Implement `finished` promise
- [ ] Implement `destroy()` cleanup
- [ ] Create `spring()` factory function
- [ ] Write unit tests (100% coverage)

**Dependencies**: Task 3.1, Task 3.2, Task 3.3

---

### Task 3.5: SpringValue (`src/core/spring-value.ts`)
- [ ] Implement `SpringValue` class
- [ ] Implement `get()`, `getVelocity()`
- [ ] Implement `set(to, config)` with interruption
- [ ] Implement `jump(to)` for immediate set
- [ ] Implement `subscribe(callback)` with unsubscribe
- [ ] Implement `isAnimating()` getter
- [ ] Implement `finished` promise
- [ ] Implement `destroy()` cleanup
- [ ] Create `createSpringValue()` factory function
- [ ] Write unit tests (100% coverage)

**Dependencies**: Task 3.4

---

### Task 3.6: SpringGroup (`src/core/spring-group.ts`)
- [ ] Implement `SpringGroup<T>` class
- [ ] Implement `get()` for all values
- [ ] Implement `getValue(key)` for single value
- [ ] Implement `set(values, config)` partial update
- [ ] Implement `jump(values)` immediate set
- [ ] Implement `subscribe(callback)` with unsubscribe
- [ ] Implement `isAnimating()` getter
- [ ] Implement `finished` promise (all animations)
- [ ] Implement `destroy()` cleanup
- [ ] Create `createSpringGroup()` factory function
- [ ] Write unit tests (100% coverage)

**Dependencies**: Task 3.5

---

## Phase 4: Animation Orchestration

### Task 4.1: Sequence (`src/animation/sequence.ts`)
- [ ] Implement `sequence(animations)` function
- [ ] Handle async execution sequentially
- [ ] Handle errors
- [ ] Write unit tests

**Dependencies**: Task 3.4

---

### Task 4.2: Parallel (`src/animation/stagger.ts`)
- [ ] Implement `parallel(animations)` function
- [ ] Handle concurrent execution
- [ ] Wait for all to complete
- [ ] Write unit tests

**Dependencies**: Task 3.4

---

### Task 4.3: Stagger (`src/animation/stagger.ts`)
- [ ] Implement `stagger(items, animate, options)` function
- [ ] Implement delay calculation (fixed and dynamic)
- [ ] Implement `from` options (first, last, center, index)
- [ ] Implement outward spread from start index
- [ ] Write unit tests

**Dependencies**: Task 4.1

---

### Task 4.4: Trail (`src/animation/trail.ts`)
- [ ] Implement `Trail` class
- [ ] Implement leader-follower pattern
- [ ] Implement `followDelay` in frames
- [ ] Implement `set(value)`, `jump(value)`
- [ ] Implement `getValues()`, `subscribe()`
- [ ] Implement `destroy()` cleanup
- [ ] Create `createTrail()` factory function
- [ ] Write unit tests

**Dependencies**: Task 3.5, Task 3.6

---

### Task 4.5: Decay (`src/animation/decay.ts`)
- [ ] Implement `DecayAnimation` class
- [ ] Implement velocity-based deceleration
- [ ] Implement `clamping` support
- [ ] Implement `start()`, `stop()`
- [ ] Implement `finished` promise
- [ ] Create `decay()` factory function
- [ ] Write unit tests

**Dependencies**: Task 2.1

---

## Phase 5: Gesture Support

### Task 5.1: Pointer Event Handling (`src/gesture/pointer.ts`)
- [ ] Implement pointer event utilities
- [ ] Implement velocity calculation
- [ ] Implement delta tracking
- [ ] Write unit tests

**Dependencies**: Task 2.1

---

### Task 5.2: Drag Spring (`src/gesture/drag.ts`)
- [ ] Implement `DragSpring` class
- [ ] Implement pointer capture
- [ ] Implement `axis` constraint (x, y, both)
- [ ] Implement `bounds` checking
- [ ] Implement `rubberBand` effect
- [ ] Implement velocity tracking on release
- [ ] Implement `enable()`, `disable()`, `reset()`
- [ ] Implement `getPosition()`, `setPosition()`
- [ ] Implement `release(velocityX, velocityY)`
- [ ] Implement callbacks (onDragStart, onDrag, onDragEnd)
- [ ] Implement `destroy()` cleanup
- [ ] Create `createDragSpring()` factory function
- [ ] Write unit tests

**Dependencies**: Task 3.5, Task 5.1

---

### Task 5.3: Scroll Spring (`src/gesture/scroll.ts`)
- [ ] Implement `ScrollSpring` class
- [ ] Implement wheel event handling
- [ ] Implement `direction` filtering
- [ ] Implement `momentum` with decay
- [ ] Implement `bounce` at edges
- [ ] Implement `getScroll()`, `scrollTo()`
- [ ] Implement `scrollToElement()`
- [ ] Implement callbacks (onScroll, onScrollStart, onScrollEnd)
- [ ] Implement `destroy()` cleanup
- [ ] Create `createScrollSpring()` factory function
- [ ] Write unit tests

**Dependencies**: Task 3.5

---

## Phase 6: Interpolation

### Task 6.1: Value Interpolation (`src/interpolation/interpolate.ts`)
- [ ] Implement `InterpolationImpl` class
- [ ] Implement multi-point interpolation
- [ ] Implement `clamp` option
- [ ] Implement extrapolation (extend, clamp, identity)
- [ ] Implement left/right extrapolate options
- [ ] Create `interpolate()` factory function
- [ ] Write unit tests

**Dependencies**: Task 3.5

---

### Task 6.2: Color Interpolation (`src/interpolation/color.ts`)
- [ ] Implement `ColorInterpolationImpl` class
- [ ] Implement RGB channel interpolation
- [ ] Support hex, rgb, hsl input colors
- [ ] Create `interpolateColor()` factory function
- [ ] Write unit tests

**Dependencies**: Task 2.2, Task 6.1

---

## Phase 7: Core Module Assembly

### Task 7.1: Type Definitions (`src/types.ts`)
- [ ] Export all public types
- [ ] Organize type exports by category
- [ ] Ensure no internal types leak

**Dependencies**: All previous tasks

---

### Task 7.2: Main Exports (`src/index.ts`)
- [ ] Export factory functions
- [ ] Export classes
- [ ] Export presets
- [ ] Export utilities
- [ ] Re-export types
- [ ] Organize exports

**Dependencies**: Task 7.1

---

### Task 7.3: Integration Tests
- [ ] Test full spring animation flow
- [ ] Test sequence execution
- [ ] Test drag interactions
- [ ] Test interpolation chains
- [ ] Achieve 100% coverage

**Dependencies**: Task 7.2

---

## Phase 8: React Adapter

### Task 8.1: React Setup
- [ ] Create `src/adapters/react/` directory
- [ ] Create React-specific package.json (peer dependencies)
- [ ] Update build config for React output

**Dependencies**: Phase 7 complete

---

### Task 8.2: useSpring Hook (`src/adapters/react/hooks/useSpring.ts`)
- [ ] Implement `useSpring(values, config)` hook
- [ ] Handle value updates
- [ ] Handle config updates
- [ ] Implement cleanup on unmount
- [ ] Write tests with @testing-library/react

**Dependencies**: Task 8.1

---

### Task 8.3: useSpringValue Hook (`src/adapters/react/hooks/useSpringValue.ts`)
- [ ] Implement `useSpringValue(initial, config)` hook
- [ ] Return ref-like object with `get()`, `set()`
- [ ] Write tests

**Dependencies**: Task 8.1

---

### Task 8.4: useSprings Hook (`src/adapters/react/hooks/useSprings.ts`)
- [ ] Implement `useSprings(count, items, config)` hook
- [ ] Handle dynamic count changes
- [ ] Handle item updates
- [ ] Write tests

**Dependencies**: Task 8.2

---

### Task 8.5: useTrail Hook (`src/adapters/react/hooks/useTrail.ts`)
- [ ] Implement `useTrail(count, values, config)` hook
- [ ] Implement cascading delay
- [ ] Write tests

**Dependencies**: Task 8.2, Task 4.4

---

### Task 8.6: useDrag Hook (`src/adapters/react/hooks/useDrag.ts`)
- [ ] Implement `useDrag(config)` hook
- [ ] Return `[position, api]` tuple
- [ ] Implement `bind()` for event handlers
- [ ] Write tests

**Dependencies**: Task 8.1, Task 5.2

---

### Task 8.7: useGesture Hook (`src/adapters/react/hooks/useGesture.ts`)
- [ ] Implement `useGesture(handlers)` hook
- [ ] Support onDrag, onPinch, onRotate
- [ ] Return bind function
- [ ] Write tests

**Dependencies**: Task 8.6

---

### Task 8.8: Spring Component (`src/adapters/react/components/Spring.tsx`)
- [ ] Implement `Spring` component
- [ ] Support `from`, `to`, `config` props
- [ ] Implement render prop pattern
- [ ] Handle prop updates
- [ ] Write tests

**Dependencies**: Task 8.2

---

### Task 8.9: Animated Component (`src/adapters/react/components/Animated.tsx`)
- [ ] Implement `Animated.div`, `span`, `button`, etc.
- [ ] Auto-detect numeric style changes
- [ ] Support `config` prop
- [ ] Forward ref
- [ ] Write tests

**Dependencies**: Task 8.2

---

### Task 8.10: Trail Component (`src/adapters/react/components/Trail.tsx`)
- [ ] Implement `Trail` component
- [ ] Support `items`, `keys`, `from`, `to` props
- [ ] Support `reverse` prop
- [ ] Write tests

**Dependencies**: Task 8.5

---

### Task 8.11: React Module Index (`src/adapters/react/index.ts`)
- [ ] Export all hooks
- [ ] Export all components
- [ ] Re-export from core package
- [ ] Organize exports

**Dependencies**: All React tasks

---

### Task 8.12: React Integration Tests
- [ ] Test hook behavior with rerenders
- [ ] Test component lifecycle
- [ ] Test prop updates
- [ ] Achieve 100% coverage

**Dependencies**: Task 8.11

---

## Phase 9: Build & Bundle

### Task 9.1: Configure Bundle
- [ ] Set up tsup for ESM output
- [ ] Set up tsup for CJS output
- [ ] Generate TypeScript declarations
- [ ] Configure tree-shaking
- [ ] Test bundle size

**Dependencies**: Task 7.2, Task 8.11

---

### Task 9.2: Verify Bundle Size
- [ ] Build production bundle
- [ ] Measure minified size
- [ ] Measure gzipped size
- [ ] Ensure core < 3KB
- [ ] Ensure React < 5KB
- [ ] Optimize if needed

**Dependencies**: Task 9.1

---

## Phase 10: Documentation Website

### Task 10.1: Website Setup
- [ ] Create `website/` directory
- [ ] Initialize Vite + React project
- [ ] Install Tailwind CSS (npm, not CDN)
- [ ] Install shadcn/ui components
- [ ] Set up React Router
- [ ] Configure fonts (JetBrains Mono, Inter)

**Dependencies**: None (parallel track)

---

### Task 10.2: Website Layout
- [ ] Create header with navigation
- [ ] Create sidebar for docs navigation
- [ ] Create footer
- [ ] Implement dark/light mode
- [ ] Set up color theme (orange accent)

**Dependencies**: Task 10.1

---

### Task 10.3: Home Page (`/`)
- [ ] Create hero section
- [ ] Add interactive spring demo
- [ ] Display install command
- [ ] Feature highlights
- [ ] CTA buttons

**Dependencies**: Task 10.2

---

### Task 10.4: Documentation Pages
- [ ] Getting Started (`/docs/getting-started`)
- [ ] Spring Basics (`/docs/spring/*`)
- [ ] Presets (`/docs/presets`)
- [ ] Interpolation (`/docs/interpolation`)
- [ ] Gestures (`/docs/gestures/*`)
- [ ] Orchestration (`/docs/orchestration/*`)
- [ ] API Reference (`/docs/api/*`)
- [ ] React Guide (`/docs/react/*`)

**Dependencies**: Task 10.2

---

### Task 10.5: Examples Page (`/examples`)
- [ ] Card animations
- [ ] Drag & drop
- [ ] Page transitions
- [ ] Gesture interactions
- [ ] Interactive playgrounds

**Dependencies**: Task 10.4

---

### Task 10.6: GitHub Actions
- [ ] Create `.github/workflows/deploy-website.yml`
- [ ] Configure build on push to main
- [ ] Set up GitHub Pages deployment
- [ : Add CNAME file for springkit.oxog.dev

**Dependencies**: Task 10.5

---

## Phase 11: Package Metadata

### Task 11.1: README.md
- [ ] Write package description
- [ ] Add installation instructions
- [ ] Add quick start examples
- [ ] Add feature list
- [ ] Add documentation link

**Dependencies**: Task 9.2

---

### Task 11.2: LICENSE
- [ ] Create MIT license file
- [ ] Add author name

**Dependencies**: None

---

### Task 11.3: CHANGELOG.md
- [ ] Create initial changelog
- [ ] Document v1.0.0 release

**Dependencies**: Task 11.1

---

### Task 11.4: Package.json Final
- [ ] Verify all exports
- [ ] Add keywords
- [ ] Add repository URL
- [ ] Add homepage
- [ ] Verify no runtime dependencies

**Dependencies**: Task 9.2, Task 11.1

---

## Phase 12: Final Testing & Release

### Task 12.1: Full Test Suite
- [ ] Run all tests
- [ ] Verify 100% coverage
- [ ] Verify 100% pass rate
- [ ] Fix any failures

**Dependencies**: All implementation tasks

---

### Task 12.2: Bundle Verification
- [ ] Build production bundles
- [ ] Test ESM import
- [ ] Test CJS require
- [ ] Test React imports
- [ ] Verify tree-shaking works

**Dependencies**: Task 12.1

---

### Task 12.3: Local Testing
- [ ] Create test project
- [ ] Install local package
- [ ] Test all features manually
- [ ] Test in different browsers

**Dependencies**: Task 12.2

---

### Task 12.4: Pre-publish Checklist
- [ ] Verify bundle sizes
- [ ] Verify 100% test coverage
- [ ] Verify all documentation complete
- [ ] Verify website builds and deploys
- [ ] Verify no dependencies in runtime
- [ ] Verify TypeScript strict mode passes

**Dependencies**: Task 12.3

---

### Task 12.5: Publish to NPM
- [ ] Build production bundles
- [ ] Run `npm publish --dry-run`
- [ ] Verify output
- [ ] Publish to NPM
- [ ] Verify on npmjs.com

**Dependencies**: Task 12.4

---

## Task Dependency Graph

```
Phase 1 (Setup)
    ├─> Phase 2 (Utils)
    │       ├─> Phase 3 (Core)
    │       │       ├─> Phase 4 (Animation)
    │       │       ├─> Phase 5 (Gestures)
    │       │       └─> Phase 6 (Interpolation)
    │       └─> Phase 7 (Assembly)
    │               └─> Phase 8 (React)
    │                       └─> Phase 9 (Build)
    │                               ├─> Phase 11 (Metadata)
    │                               └─> Phase 12 (Release)
    │
    └─> Phase 10 (Website) [Parallel]
```

---

## Implementation Order

Execute tasks in numerical order within each phase. Complete all tasks in a phase before moving to the next, unless explicitly marked as parallel.

**Critical Path**: 1 → 2 → 3 → 4 → 7 → 8 → 9 → 11 → 12

**Parallel Track**: Phase 10 can be developed alongside implementation phases.

---

**Tasks Version**: 1.0.0
**Last Updated**: 2025-12-29
