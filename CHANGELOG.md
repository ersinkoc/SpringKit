# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
