# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Build library (outputs to dist/)
npm run build

# Build in watch mode for development
npm run dev

# Run all tests (core + React)
npm run test:all

# Run core tests only (faster, excludes React adapter tests)
npm run test

# Run React-specific tests (uses separate vitest config with forks pool)
npm run test:react

# Run single test file
npx vitest run tests/unit/core/spring.test.ts

# Run tests in watch mode
npm run test:watch

# Type checking (src via tsconfig.json + tests via tsconfig.test.json)
npm run typecheck

# Linting (flat ESLint config, src + tests)
npm run lint

# Validate published package shape (publint + arethetypeswrong; needs a build)
npm run lint:package

# Per-frame benchmark (100 / 1k / 10k springs; needs a build)
npm run bench

# Typecheck + lint + build + all tests (runs automatically on publish)
npm run prepublishOnly
```

`npm run build` cleans `dist/` and runs `scripts/build.mjs`, which builds the core and React targets **one at a time** (`SPRINGKIT_BUILD=core|react`). Do not switch back to plain `tsup`: building both targets in parallel intermittently crashes Node on Windows (`0xC0000374`) with no error message and an incomplete `dist/`.

## Architecture Overview

SpringKit is a zero-dependency physics-based spring animation library with optional React bindings.

### Dual Package Structure

```
src/
├── index.ts           → dist/index.{js,cjs}      # Core library (no React)
└── adapters/react/
    └── index.ts       → dist/react/index.{js,cjs}   # React adapter
```

- **Core** (`@oxog/springkit`): Framework-agnostic animation primitives
- **React** (`@oxog/springkit/react`): Hooks and components for React 18+ (peer dep, optional)

The React adapter must import core code **only** via `'@oxog/springkit'` (never relative paths like `'../../../core/...'`). That specifier is external in the React build, so both entry points share one core instance (one `globalLoop`, one `MotionValue` class). `tsconfig.json` `paths` and the Vitest aliases map it to `src/` during development. Anything the adapter needs from core must therefore be exported from `src/index.ts`. Import React as `import * as React from 'react'` (no default import, so consumers without `esModuleInterop` can typecheck). The React bundle gets a `"use client"` banner.

### Source Modules

```
src/
├── core/           # Spring physics: spring, spring-value, spring-group, MotionValue
├── animation/      # Orchestration: animate, sequence, timeline, stagger, keyframes, decay, trail
├── gesture/        # Gesture primitives: drag, scroll, advanced (pinch, rotate, swipe, longPress)
├── interpolation/  # Value and color interpolation
├── layout/         # FLIP layout animations
├── scroll/         # Scroll-linked animations (parallax, scroll-trigger, scroll-progress)
├── svg/            # SVG morph and path animations
├── utils/          # Math helpers, color parsing, input validation/warnings
├── types.ts        # Shared type definitions
└── adapters/react/ # React hooks (24), components (11+), context, SSR utils
```

### Core Animation System

**Global Animation Loop** (`src/animation/loop.ts`):
- Singleton `globalLoop` manages all animations via RAF
- Uses `WeakRef` for memory-safe animation tracking
- Delta time clamping (`MAX_DELTA_TIME = 64ms`) prevents physics explosions after tab suspension

**Spring Physics** (`src/core/`):
- `spring.ts`: Single value animation with physics simulation
- `spring-value.ts`: Updatable animated value with subscribers
- `spring-group.ts`: Synchronized multiple values
- `MotionValue.ts`: High-performance value without React re-renders

**Key Pattern - isDestroyed Check**:
All MotionValue-based hooks must check `isDestroyed()` for React StrictMode compatibility:
```typescript
if (valueRef.current === null || valueRef.current.isDestroyed()) {
  valueRef.current = createMotionValue(0)
}
```
Destroy such instances via `hooks/useDestroyOnUnmount.ts` (defers destroy by a microtask and skips it when StrictMode re-runs the effect) — never destroy in a plain effect cleanup while the instance lives in a ref created during render.

**Physics & time** (see `src/core/physics.ts`):
- `spring()` advances with `stepSpring()` (closed-form solution) — exact and refresh-rate independent. Never integrate with a fixed per-frame step; anything time-based must use real elapsed time (the loop passes `deltaTime` to `Animatable.update(now, deltaTime)`).
- `decay()` velocity is units/second, `deceleration` is per millisecond (iOS scale).
- The loop holds running animations strongly (fire-and-forget animations must not be GC'd) and isolates errors per animation.
- The loop owns the animation clock: it passes `animationTime` (advanced by real delta × `globalLoop.getTimeScale()`) to `update(now, deltaTime)`. Never call `performance.now()` inside an Animatable; modules with their own RAF loop (e.g. timeline) must multiply their delta by the time scale. Don't drive `update()` manually in tests with arbitrary timestamps — use the test clock.
- The loop re-schedules its pending frame if the global `requestAnimationFrame` changes (test clock installed/removed).

**Native springs** (`src/native/`): `solveSpring()` / `springEasing()` / `animateNative()` compile springs to CSS `linear()` for the compositor. `springMotion()` in core is the shared closed form.

**Testing animations**: use `installTestClock()` from `src/testing/` (published as `@oxog/springkit/testing`) instead of `vi.useFakeTimers()` — it virtualizes rAF + `performance.now` (and timers with `{ timers: true }`). Always `uninstall()` in `afterEach`. Compare values against the time of the frame they were produced at (frames land on multiples of 1000/frameRate), not the `advance()` target.

### React Integration Patterns

**Hooks** (`src/adapters/react/hooks/`):
- Return refs + controls pattern (e.g., `useDrag` returns `[position, api]`)
- Use `useIsomorphicLayoutEffect` for SSR safety
- Track RAF/timeout IDs in refs for cleanup
- Never put a spring config object (or any object/array prop with an inline default) directly in effect deps — inline `config={{...}}` is new every render and restarts springs every frame. Use `useStableSpringConfig` (`utils/config.ts`) or depend on primitive fields

**Components** (`src/adapters/react/components/`):
- `Animated.tsx`: Base animated element with gesture props (`whileHover`, `whileTap`, etc.)
- `AnimatePresence.tsx` + `PresenceChild.tsx`: Exit animation coordination

### SSR

`tests/unit/react/ssr-render.test.tsx` (`// @vitest-environment node`) renders every React export with `renderToString` and fails if a new export has no SSR case — add one when adding an export. `ssr-hydration.test.tsx` hydrates in jsdom. Browser APIs (window, matchMedia, IntersectionObserver, ResizeObserver, rAF) only inside effects/handlers, and guard for their absence; server and first client render must match.

### Test Configuration

Two Vitest configs:
- `vitest.config.ts`: Main tests (jsdom environment, excludes `src/adapters/react/`)
- `vitest.config.react.mts`: React tests with `forks` pool + `singleFork: true` for isolation

Coverage thresholds: 80% minimum (lines, functions, branches, statements).

Test setup (`tests/setup.ts`) provides polyfills for:
- `IntersectionObserver`
- `ResizeObserver`
- `PointerEvent`

Path aliases in test configs: `@oxog/springkit` → `src/`, `@oxog/springkit/react` → `src/adapters/react/`.

## Key Conventions

### Cleanup Patterns

Always track and cleanup:
```typescript
// RAF tracking
const rafIdsRef = useRef(new Set<number>())
rafIdsRef.current.add(requestAnimationFrame(tick))
// In cleanup: rafIdsRef.current.forEach(id => cancelAnimationFrame(id))

// Timeout tracking
const timeoutIdsRef = useRef(new Set<ReturnType<typeof setTimeout>>())
```

### Error Isolation

Wrap subscriber callbacks in try-catch:
```typescript
subscribers.forEach(cb => {
  try { cb(value) }
  catch (e) { console.error('[SpringKit]', e) }
})
```

### Input Validation

Use `validateAnimationValue()` from `utils/warnings.ts` for NaN/Infinity protection.

### Division by Zero Protection

```typescript
const ratio = denominator === 0 ? 0 : value / denominator
```

### TypeScript Strictness

`noUncheckedIndexedAccess` is enabled — array/object index access returns `T | undefined`. Always handle the `undefined` case or use non-null assertion (`!`) only when the index is guaranteed valid.

### ESLint Rules

Flat config (`eslint.config.js`). Key rules:
- Unused vars error (prefix with `_` to ignore)
- `no-console` warns (only `console.warn`/`console.error` allowed)
- `react-hooks/exhaustive-deps` warns
- `@typescript-eslint/no-explicit-any` warns

## Website

The `website/` folder contains the documentation site (Vite + React + Tailwind). Before building the website, run `npm run copy:springkit` from the website directory to copy the built library into `website/public/springkit/`. The website imports from these copied bundles, not directly from `src/`.
