# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
