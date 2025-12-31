# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
