# SpringKit - Package Specification

## 1. Package Identity

| Field | Value |
|-------|-------|
| **Name** | `@oxog/springkit` |
| **Version** | `1.0.0` |
| **Description** | Zero-dependency physics-based spring animation library with gesture support |
| **Author** | Ersin KOÇ |
| **License** | MIT |
| **Repository** | `https://github.com/ersinkoc/springkit` |
| **Documentation** | `https://springkit.oxog.dev` |

## 2. Technical Requirements

### 2.1 Runtime Environment
- **Target**: Modern browsers (ES2020+)
- **Module Formats**: ESM (primary) + CJS (legacy)
- **TypeScript**: Strict mode enabled

### 2.2 Dependencies
```json
{
  "dependencies": {},
  "peerDependencies": {
    "react": ">=18.0.0"
  },
  "devDependencies": {
    "typescript": "^5.7.2",
    "vitest": "^2.1.8",
    "tsup": "^8.3.5",
    "@vitest/coverage-v8": "^2.1.8"
  }
}
```

### 2.3 Bundle Size Targets
| Module | Target | Notes |
|--------|--------|-------|
| Core | < 3KB | Minified + gzipped |
| React Adapter | < 2KB | Additional on top of core |
| Full Bundle | < 5KB | Core + React adapter |

### 2.4 TypeScript Configuration
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

## 3. Core API Specification

### 3.1 Module Structure

```
@oxog/springkit/
├── index.ts                    # Core exports
├── types.ts                    # Shared types
├── core/                       # Core spring functionality
│   ├── spring.ts
│   ├── spring-value.ts
│   ├── spring-group.ts
│   ├── physics.ts
│   └── config.ts
├── animation/                  # Animation orchestration
│   ├── loop.ts
│   ├── sequence.ts
│   ├── stagger.ts
│   ├── trail.ts
│   └── decay.ts
├── gesture/                    # Gesture support
│   ├── drag.ts
│   ├── scroll.ts
│   └── pointer.ts
├── interpolation/              # Interpolation utilities
│   ├── interpolate.ts
│   ├── color.ts
│   └── utils.ts
├── utils/                      # Utilities
│   ├── math.ts
│   ├── color.ts
│   └── helpers.ts
└── presets.ts                  # Spring presets
```

### 3.2 Public Exports

#### Core Module (`@oxog/springkit`)
```typescript
// Factory functions
export function spring(
  from: number,
  to: number,
  config?: SpringConfig
): SpringAnimation

export function createSpringValue(
  initial: number,
  config?: SpringConfig
): SpringValue

export function createSpringGroup<T extends Record<string, number>>(
  initialValues: T,
  config?: SpringConfig
): SpringGroup<T>

// Interpolation
export function interpolate(
  value: SpringValue | (() => number),
  input: number[],
  output: number[],
  options?: InterpolateOptions
): Interpolation

export function interpolateColor(
  value: SpringValue | (() => number),
  input: number[],
  colors: string[],
  options?: InterpolateOptions
): ColorInterpolation

// Orchestration
export function sequence(
  animations: Array<() => SpringAnimation>
): Promise<void>

export function parallel(
  animations: Array<() => SpringAnimation>
): Promise<void>

export function stagger<T>(
  items: T[],
  animate: (item: T, index: number) => SpringAnimation,
  options?: StaggerOptions
): Promise<void>

// Trail
export function createTrail(
  count: number,
  config?: TrailConfig
): Trail

// Decay
export function decay(config: DecayConfig): DecayAnimation

// Gesture
export function createDragSpring(
  element: HTMLElement,
  config?: DragSpringConfig
): DragSpring

export function createScrollSpring(
  container: HTMLElement,
  config?: ScrollSpringConfig
): ScrollSpring

// Presets
export const springPresets: SpringPresets

// Utilities
export function configFromDuration(ms: number): SpringConfig
export function configFromBounce(bounce: number): SpringConfig

export function clamp(value: number, min: number, max: number): number
export function lerp(a: number, b: number, t: number): number
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number
```

#### React Module (`@oxog/springkit/react`)
```typescript
// Hooks
export function useSpring<T extends Record<string, number>>(
  values: T,
  config?: Partial<SpringConfig>
): AnimatedValues<T>

export function useSpringValue(
  initial: number,
  config?: Partial<SpringConfig>
): SpringValue

export function useSprings<T>(
  count: number,
  items: (index: number) => SpringItem<T>,
  config?: Partial<SpringConfig>
): SpringValues<T>[]

export function useTrail<T extends Record<string, number>>(
  count: number,
  values: T,
  config?: Partial<SpringConfig>
): TrailValues<T>[]

export function useDrag(
  config?: DragSpringConfig
): [{ x: number; y: number }, DragAPI]

export function useGesture(handlers: GestureHandlers): GestureBind

// Components
export const Spring: SpringComponent
export const Animated: AnimatedComponent
export const Trail: TrailComponent

// Re-exports
export * from '@oxog/springkit'
```

## 4. Type Definitions

### 4.1 Core Types

```typescript
interface SpringConfig {
  stiffness?: number
  damping?: number
  mass?: number
  velocity?: number
  restSpeed?: number
  restDelta?: number
  clamp?: boolean
  onUpdate?: (value: number) => void
  onStart?: () => void
  onComplete?: () => void
  onRest?: () => void
}

interface SpringAnimation {
  start(): SpringAnimation
  stop(): void
  pause(): void
  resume(): void
  reverse(): void
  set(to: number): void
  isAnimating(): boolean
  isPaused(): boolean
  isComplete(): boolean
  getValue(): number
  getVelocity(): number
  finished: Promise<void>
  destroy(): void
}

interface SpringValue {
  get(): number
  getVelocity(): number
  set(to: number, config?: Partial<SpringConfig>): void
  jump(to: number): void
  subscribe(callback: (value: number) => void): () => void
  isAnimating(): boolean
  finished: Promise<void>
  destroy(): void
}

interface SpringGroup<T extends Record<string, number>> {
  get(): T
  getValue(key: keyof T): number
  set(values: Partial<T>, config?: Partial<SpringConfig>): void
  jump(values: Partial<T>): void
  subscribe(callback: (values: T) => void): () => void
  isAnimating(): boolean
  finished: Promise<void>
  destroy(): void
}
```

### 4.2 Interpolation Types

```typescript
interface InterpolateOptions {
  clamp?: boolean
  extrapolate?: 'extend' | 'clamp' | 'identity'
  extrapolateLeft?: 'extend' | 'clamp' | 'identity'
  extrapolateRight?: 'extend' | 'clamp' | 'identity'
}

interface Interpolation {
  get(): number
}

interface ColorInterpolation {
  get(): string
}
```

### 4.3 Animation Types

```typescript
interface StaggerOptions {
  delay?: number | ((index: number) => number)
  from?: 'first' | 'last' | 'center' | number
}

interface TrailConfig extends SpringConfig {
  followDelay?: number
}

interface Trail {
  set(value: number): void
  jump(value: number): void
  getValues(): number[]
  subscribe(callback: (values: number[]) => void): () => void
  destroy(): void
}

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

### 4.4 Gesture Types

```typescript
interface DragSpringConfig extends SpringConfig {
  axis?: 'x' | 'y' | 'both'
  bounds?: {
    left?: number
    right?: number
    top?: number
    bottom?: number
  }
  rubberBand?: boolean
  rubberBandFactor?: number
  onDragStart?: (event: PointerEvent) => void
  onDrag?: (x: number, y: number, event: PointerEvent) => void
  onDragEnd?: (x: number, y: number, velocity: { x: number; y: number }) => void
  onUpdate?: (x: number, y: number) => void
}

interface DragSpring {
  enable(): void
  disable(): void
  isEnabled(): boolean
  reset(): void
  getPosition(): { x: number; y: number }
  setPosition(x: number, y: number): void
  release(velocityX: number, velocityY: number): void
  destroy(): void
}

interface ScrollSpringConfig extends SpringConfig {
  direction?: 'horizontal' | 'vertical' | 'both'
  momentum?: boolean
  momentumDecay?: number
  bounce?: boolean
  bounceStiffness?: number
  bounceDamping?: number
  onScroll?: (scrollX: number, scrollY: number) => void
  onScrollStart?: () => void
  onScrollEnd?: () => void
}

interface ScrollSpring {
  getScroll(): { x: number; y: number }
  scrollTo(x: number, y: number): void
  scrollToElement(element: HTMLElement, offset?: number): void
  enable(): void
  disable(): void
  destroy(): void
}
```

### 4.5 React Types

```typescript
type AnimatedValues<T extends Record<string, number>> = {
  [K in keyof T]: number
}

interface SpringItem<T> {
  values: T
  from?: Partial<T>
  delay?: number
  config?: Partial<SpringConfig>
}

type TrailValues<T extends Record<string, number>> = AnimatedValues<T>

interface DragAPI {
  bind(): { onPointerDown: (e: React.PointerEvent) => void }
  set(values: { x?: number; y?: number }): void
  reset(): void
}

interface GestureHandlers {
  onDrag?: (state: { x: number; y: number }) => void
  onPinch?: (state: { scale: number }) => void
  onRotate?: (state: { angle: number }) => void
}

interface GestureBind {
  onPointerDown: (e: React.PointerEvent) => void
  onPointerMove: (e: React.PointerEvent) => void
  onPointerUp: (e: React.PointerEvent) => void
  onPointerCancel: (e: React.PointerEvent) => void
}
```

## 5. Spring Presets

```typescript
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
```

## 6. Testing Requirements

### 6.1 Test Coverage
- **Target**: 100% code coverage
- **Tool**: Vitest with coverage-v8
- **All tests must pass**: 100% success rate

### 6.2 Test Structure
```
tests/
├── unit/
│   ├── core/
│   │   ├── spring.test.ts
│   │   ├── spring-value.test.ts
│   │   ├── spring-group.test.ts
│   │   ├── physics.test.ts
│   │   └── config.test.ts
│   ├── animation/
│   │   ├── sequence.test.ts
│   │   ├── stagger.test.ts
│   │   ├── trail.test.ts
│   │   └── decay.test.ts
│   ├── gesture/
│   │   ├── drag.test.ts
│   │   └── scroll.test.ts
│   └── interpolation/
│       ├── interpolate.test.ts
│       └── color.test.ts
├── integration/
│   ├── spring.test.ts
│   ├── sequence.test.ts
│   ├── drag.test.ts
│   └── react.test.tsx
└── fixtures/
```

### 6.3 Test Categories

1. **Unit Tests**
   - Physics calculations
   - Spring behavior
   - Interpolation
   - Color conversion

2. **Integration Tests**
   - End-to-end animations
   - Gesture interactions
   - React integration

3. **Edge Cases**
   - Zero mass/stiffness
   - Extreme values
   - Rapid state changes

## 7. Bundle Configuration

### 7.1 Exports

```json
{
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./react": {
      "import": "./dist/react/index.mjs",
      "require": "./dist/react/index.cjs",
      "types": "./dist/react/index.d.ts"
    }
  }
}
```

### 7.2 Build Output
```
dist/
├── index.mjs           # ESM core
├── index.cjs           # CJS core
├── index.d.ts          # TS declarations
├── react/
│   ├── index.mjs
│   ├── index.cjs
│   └── index.d.ts
└── presets.mjs         # Tree-shakeable
```

## 8. Documentation Website

### 8.1 Technology Stack
| Tech | Purpose |
|------|---------|
| React 18+ | UI framework |
| Vite 5+ | Build tool |
| TypeScript 5+ | Type safety |
| Tailwind CSS 3+ | Styling (npm) |
| shadcn/ui | Components |
| React Router 6+ | Routing |
| Lucide React | Icons |
| Framer Motion | Animations |
| Prism.js | Syntax highlighting |

### 8.2 Pages
| Path | Title |
|------|-------|
| `/` | Home |
| `/docs/getting-started` | Getting Started |
| `/docs/spring/*` | Spring Basics |
| `/docs/presets` | Presets |
| `/docs/interpolation` | Interpolation |
| `/docs/gestures/*` | Gestures |
| `/docs/orchestration/*` | Orchestration |
| `/docs/api/*` | API Reference |
| `/docs/react/*` | React Guide |
| `/examples` | Examples |

### 8.3 Deployment
- **Platform**: GitHub Pages
- **Domain**: springkit.oxog.dev
- **Build**: GitHub Actions (on push to main)

---

**Specification Version**: 1.0.0
**Last Updated**: 2025-12-29
