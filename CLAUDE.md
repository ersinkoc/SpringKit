# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Build library (outputs to dist/)
npm run build

# Run all tests
npm run test:all

# Run main tests only (faster)
npm run test

# Run React-specific tests
npm run test:react

# Run single test file
npx vitest run tests/unit/core/spring.test.ts

# Run tests in watch mode
npm run test:watch

# Type checking
npm run typecheck

# Linting
npm run lint

# Build + test before publish
npm run prepublishOnly
```

## Architecture Overview

SpringKit is a zero-dependency physics-based spring animation library with optional React bindings.

### Dual Package Structure

```
src/
├── index.ts           → dist/index.{mjs,cjs}     # Core library (no React)
└── adapters/react/
    └── index.ts       → dist/react/index.{mjs,cjs}  # React adapter
```

- **Core** (`@oxog/springkit`): Framework-agnostic animation primitives
- **React** (`@oxog/springkit/react`): Hooks and components for React 18+

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

### React Integration Patterns

**Hooks** (`src/adapters/react/hooks/`):
- Return refs + controls pattern (e.g., `useDrag` returns `[position, api]`)
- Use `useIsomorphicLayoutEffect` for SSR safety
- Track RAF/timeout IDs in refs for cleanup

**Components** (`src/adapters/react/components/`):
- `Animated.tsx`: Base animated element with gesture props (`whileHover`, `whileTap`, etc.)
- `AnimatePresence.tsx` + `PresenceChild.tsx`: Exit animation coordination

### Test Configuration

Two Vitest configs:
- `vitest.config.ts`: Main tests (jsdom environment)
- `vitest.config.react.mts`: React tests with single fork pool

Test setup (`tests/setup.ts`) provides polyfills for:
- `IntersectionObserver`
- `ResizeObserver`
- `PointerEvent`

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

## Website

The `website/` folder contains the documentation site (Vite + React + Tailwind). It copies the library dist files via `npm run copy:springkit` before building.
