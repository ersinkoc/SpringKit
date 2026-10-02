# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- **React adapter bundled a second copy of the core**: `@oxog/springkit/react`
  inlined the whole core library instead of importing it, so apps using both
  entry points loaded the core twice and ran two independent `globalLoop`s
  (pausing or configuring the core loop did not affect React animations), and
  `instanceof MotionValue` failed across entries. The React entry now imports
  `@oxog/springkit` as an external dependency, in both the JS and the type
  declarations, so `MotionValue` and friends are the same class and type everywhere
- **CommonJS type resolution**: `require` resolved the ESM `.d.ts`
  ("masquerading as ESM"). `exports` now has separate `import`/`require`
  conditions pointing at `.d.ts`/`.d.cts`; `publint --strict` and
  `@arethetypeswrong/cli` pass for node10, node16 (CJS + ESM) and bundler
- **Next.js App Router**: the React entry now starts with `"use client"`
- **Types without `esModuleInterop`**: React declarations used
  `import React from 'react'`, which failed to typecheck for consumers without
  `esModuleInterop`; sources now use `import * as React from 'react'`
- **Flaky build**: building the core and React targets in parallel started two
  DTS worker threads at once and intermittently crashed Node on Windows with
  `STATUS_HEAP_CORRUPTION` (0xC0000374), exiting before writing `dist/` and
  without an error message. `npm run build` now builds the targets one after
  another (`scripts/build.mjs`). The config is also kept function-free, since
  function options cannot be structured-cloned into the DTS worker

### Changed
- Published output is no longer minified and ships without source maps
  (consumers' bundlers minify; readable output gives better stack traces).
  Tarball size dropped from 758 kB to 224 kB (unpacked: 3.3 MB to 1.1 MB)
- `prepare` (which ran build + tests on every `npm install`) is replaced by
  `prepublishOnly`, which runs typecheck, lint, build and all tests
- Added `lint:package` (publint + arethetypeswrong) and a CI workflow that runs
  typecheck, lint, build, tests and package checks on Node 22/24 and on Windows
- Added `bugs`, a `./package.json` export and `typesVersions` (for
  `moduleResolution: node` consumers of `@oxog/springkit/react`)
- README: the "~7KB gzipped" claim was replaced with measured sizes
  (~2 KB min+gzip for `spring()` alone, ~24 KB for the whole core)

### Previously unreleased
- **Build**: tsup config made function-free (function options cannot be
  structured-cloned into the DTS worker thread)
- **Timeline**: `onUpdate` progress emitted `NaN` for empty timelines
  (`0 / 0` division) — now returns a guarded 0-1 value
- **React hooks**: `useHover`/`useTap`/`useGestureState` event handlers are now
  typed with React's native handler types (new `GestureHandlers` interface), so
  they can be spread onto JSX elements *and* invoked manually with the event

### Website Examples
- **TimelineDemo**: scrub bar passed a 0-1 fraction to `seek()` which expects a
  time position — scrubbing now maps fraction to `duration()`
- **StaggerPatternsDemo**: stagger timeouts are tracked and cancelled on
  unmount/reset; empty-item guard added
- **SVGMorphDemo**: guarded `randomMorph` against an undefined selection;
  color fallback for unknown shapes
- **GesturesDemo**: hover card is keyboard accessible (`role`, `tabIndex`,
  Enter/Space activation, `aria-label`)
- **Keyboard shortcuts**: global keydown handlers in demos now ignore events
  originating from form controls and contentEditable elements
- **Home**: `AnimatedNumber` cancels its RAF loop and disconnects its observer
  on unmount
- **Examples catalog**: card-stack rotation hardened against empty decks;
  inline stagger demo timeouts tracked
- Replaced `NodeJS.Timeout` usages with `ReturnType<typeof setInterval>` and
  removed the deprecated `baseUrl` from the website tsconfig

## [1.3.4] - 2026-01-08

### Added
- **CLAUDE.md**: Added AI assistant guidance file for Claude Code with build commands, architecture overview, and key conventions

### Documentation
- Improved developer onboarding with comprehensive codebase documentation

## [1.3.3] - 2026-01-08

### Fixed
- **useBounce Hook**: Added missing `isDestroyed()` check for MotionValue initialization, ensuring consistency with other physics hooks (`useMomentum`, `useElastic`, `useGravity`, `usePointer`, `useGyroscope`, `useChain`) and proper handling when MotionValue is externally destroyed

### Internal
- Comprehensive codebase audit (70+ files analyzed)
- All 931 tests passing
- Zero security vulnerabilities confirmed

## [1.3.2] - 2026-01-07

### Fixed
- **React StrictMode**: Improved compatibility for spring hooks with React StrictMode double-mounting behavior

## [1.3.1] - 2026-01-06

### Added
- Comprehensive unit tests for gesture, layout, scroll, and SVG morph functionalities

### Changed
- Adjusted test coverage thresholds for better accuracy

## [1.3.0] - 2026-01-05

### Added
- **SVG Morphing**: `createMorph()`, `createMorphSequence()` for spring-physics shape transitions
- **Shape Library**: Built-in shapes - `shapes.circle()`, `shapes.star()`, `shapes.heart()`, `shapes.triangle()`, etc.
- **Variants System**: `useVariants`, `VariantProvider` for declarative animation states
- **Variant Presets**: `variantPresets` with common animation patterns (fadeIn, slideUp, scale, etc.)
- **Physics Presets**: 40+ semantic presets (`physicsPresets.button`, `modal`, `toast`, `dragRelease`, `jelly`, etc.)
- **Feeling Configs**: `createFeeling()` for quick spring configuration (snappy, smooth, bouncy, heavy, light, elastic)
- **Preset Adjusters**: `adjustSpeed()`, `adjustBounce()` for fine-tuning presets
- **Advanced Physics Hooks**: `useBounce`, `useElastic`, `useMomentum`, `useGravity`, `useChain`, `usePointer`, `useGyroscope`
- **Text Animation Components**: `SpringText`, `SpringNumber`, `TypeWriter`, `SplitText`
- **Magnetic Components**: `Magnetic`, `MagneticGroup`, `MagneticCursor`, `useMagnetic`
- **Parallax Components**: `Parallax`, `MouseParallax`, `TiltCard`, `ParallaxContainer`, `ParallaxLayer`
- **Reorder Component**: Drag-to-reorder list with keyboard accessibility
- **Stagger Patterns**: `linearStagger`, `centerStagger`, `waveStagger`, `spiralStagger`, `gridStagger`, `randomStagger`
- **Shared Layout**: `createSharedLayoutContext`, `createLayoutGroup`, `createAutoLayout`
- **Scroll-Linked**: `createScrollProgress`, `createParallax`, `createScrollTrigger`, `scrollEasings`

### Performance
- 931 tests with comprehensive coverage
- Zero runtime dependencies maintained
- ~7KB gzipped core, ~6KB gzipped React adapter

## [1.2.0] - 2025-12-31

### Added
- **AnimatePresence**: Exit animations support for unmounting components with `<AnimatePresence>` component
- **Gesture Props**: `whileHover`, `whileTap`, `whileFocus`, `whileInView`, `whileDrag` on Animated components
- **Keyframes Animation**: `keyframes()` function for multi-value spring animations with per-keyframe configs
- **SVG Path Animations**: `createPathAnimation()`, `getPathLength()`, `preparePathForAnimation()`, `getPointAtProgress()` for line drawing effects
- **FLIP Layout Animations**: `createFlip()`, `flip()`, `flipBatch()`, `measureElement()` for smooth layout transitions
- **useAnimate Hook**: Imperative animation control with scoped selectors and timeline support
- **MotionConfig Component**: Context-based config inheritance with `reducedMotion` support
- **usePresence Hook**: Manual exit animation control for custom implementations
- **MotionValue Class**: Performant animated values without React re-renders
- **useMotionValue Hook**: React hook for MotionValue with lifecycle management
- **useTransform Hook**: Range-based and function-based value transformations
- **useInView Hook**: IntersectionObserver-based viewport visibility detection
- **useScroll Hook**: Scroll progress tracking with element and container targeting
- **useReducedMotion Hook**: Accessibility support for users preferring reduced motion

### Changed
- Enhanced `Animated` components with gesture prop support
- Improved TypeScript types for all new features
- Better tree-shaking with modular exports

### Performance
- ~7KB gzipped core bundle
- ~6KB gzipped React adapter
- Zero runtime dependencies maintained
- 95%+ test coverage on all metrics

## [1.1.0] - 2025-12-30

### Added
- **Memory Safety**: WeakRef-based animation tracking for automatic garbage collection
- **FinalizationRegistry**: Automatic cleanup callbacks when animations are garbage collected
- **Frame-drop Resilience**: Delta time clamping (max 100ms) prevents animation jumps after tab switches or lag spikes
- **onFrame Callback**: Global loop `onFrame(callback)` for per-frame updates with delta time
- **Animation ID Tracking**: `globalLoop.add()` now returns unique animation IDs for tracking
- **getFPS()**: Real-time FPS monitoring via `globalLoop.getFPS()`
- **getAliveCount()**: Track active animation count via `globalLoop.getAliveCount()`
- **Physics Utilities Export**: `calculateDampingRatio`, `isUnderdamped`, `isOverdamped`, `isCriticallyDamped`

### Changed
- Build target updated to ES2021 for WeakRef/FinalizationRegistry support
- Improved animation loop stability during browser throttling
- Better cleanup of completed animations from the global loop

### Fixed
- Animation state inconsistencies during rapid start/stop cycles
- Memory leaks from orphaned animation callbacks
- Frame timing issues when browser tab is inactive

### Performance
- ~7KB gzipped core bundle (unchanged)
- ~5.4KB gzipped React adapter
- Zero runtime dependencies maintained

## [1.0.0] - 2025-12-29

### Added
- Initial release of SpringKit
- Core spring physics engine with configurable stiffness, damping, and mass
- SpringValue for animating individual values
- SpringGroup for coordinating multiple values
- Animation orchestration (sequence, parallel, stagger)
- Trail effect for follow animations
- Decay animation for momentum
- Drag spring with rubber band physics
- Scroll spring with momentum and bounce
- Value and color interpolation
- React hooks (useSpring, useSpringValue, useSprings, useTrail, useDrag, useGesture)
- React components (Spring, Animated, Trail)
- 8 built-in spring presets (default, gentle, wobbly, stiff, slow, molasses, bounce, noWobble)
- Zero runtime dependencies
- Full TypeScript support
- 100% test coverage

### Features
- Physics-based animations using real spring equations
- Interruptible and reversible animations
- Promise-based completion handling
- Configurable rest thresholds
- Value clamping support
- Multi-point interpolation
- Extrapolation modes (extend, clamp, identity)
- Color interpolation (hex, rgb, hsl)
- Gesture support (drag, scroll)
- Rubber band effect at bounds
- Scroll momentum
- Comprehensive React integration
