# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- `createMorph` called `onProgress(0)` when the morph was created, although
  nothing had moved. A "busy" flag set from `onProgress` (e.g. to disable
  buttons while morphing) stayed on until the first morph finished, and
  `useMorphRef` re-rendered once on mount. `onProgress` now only reports real
  progress updates (`morphTo()` frames and `setProgress()`).

### Website
- New "Migrating to 2.0" page; the home page, examples and presets docs no
  longer advertise 1.x versions. The SVG Morph example's shape buttons were
  disabled on load (see above); the site has a favicon.

## [2.0.0] - 2026-10-02

This release fixes about 190 bugs (each with a regression test),
makes the physics exact and refresh-rate independent, and adds compositor
springs, a test clock and a Framer-Motion-style drag API. Some fixes change
observable behavior; see **Breaking changes** and the
[migration guide](docs/MIGRATION-2.0.md).

### Breaking changes

Physics and timing:
- **Springs run at the same speed on every display.** In 1.x they ran 2x
  faster at 120Hz, 2.4x at 144Hz and 1.67x at 50Hz. `spring()` now advances
  with the exact closed-form solution, so timings tuned on a 120Hz screen
  will feel slower.
- **`decay()` uses real units:** `velocity` is in units per second and
  `deceleration` is the fraction kept per millisecond (iOS scale: 0.998
  normal, 0.99 fast). Multiply 1.x velocities by 60.
- **`configFromDuration()` / `configFromBounce()`** return physically derived
  configs instead of three fixed buckets.
- **All gesture velocities are px/s.** `createDragSpring` / `useDrag`:
  `onDragEnd` velocity, `release(vx, vy)`, `getVelocity()` and
  `snap.velocityThreshold` (default 500) were px/ms; swipe `velocityThreshold`
  (default 500) and `state.velocity` too. Multiply 1.x values by 1000.
- **Core drag momentum is a real decay.** The release velocity carries over
  without a stall, and a 1000 px/s fling glides ~325 px with the default
  `momentumDecay: 0.95` (per-frame factor; distance ≈ v / (60·−ln d)) instead
  of ~32 px. Lower `momentumDecay` for a shorter glide. `onBoundsHit` also
  fires when momentum reaches a bound.

Gestures:
- **`onSnapComplete` fires when the snap spring settles** instead of a fixed
  500ms after the snap started (soft springs report later), and not at all
  for a snap interrupted by a drag, `release()`, `jumpTo()` or `animateTo()`.
- **`momentum: false` releases keep the release velocity**: a fast release
  overshoots the drop point and springs back instead of stopping dead.
- **`dragElastic` object form:** an edge left out is not elastic (0, as in
  Framer Motion); it was 0.5.
- **`constrainToParent`** keeps the element inside the parent's padding box;
  the parent's borders no longer count as room.
- **Swipes need at least `minDistance` of travel** (new option, default
  10px), even when faster than `velocityThreshold`, so taps and quick jitters
  are no longer swipes.
- **`createScrollSpring({ bounce: true })` uses an iOS-style rubber band:**
  overscroll moves ~0.55x and never more than the container size (the 1.x
  curve amplified small overscrolls, e.g. 1px became 10px).
  `bounceStiffness` / `bounceDamping` now drive the spring back; they had no
  effect.

Orchestration:
- **`stagger()` with a numeric `delay`** starts item k after `k * delay`
  (1.x gave every item the same delay); `from: 'center'` fans out
  symmetrically.
- **Stagger pattern presets and defaults are in milliseconds**
  (`staggerPresets.cascade(3)` → `[0, 50, 100]`); they were seconds.
- **`animate()` arrays mean `[from, ...to]`**: the first entry is the start
  value.
- **Timeline** segments are a function of playhead time, and `to()` reads its
  start values when the segment first plays, not when it is defined.
- **`spring().stop()` / `decay().stop()` resolve `finished`**; each run gets a
  new `finished` promise. `createSpringGroup().finished` resolves once every
  animating key has settled, not only the keys of the last `set()`.

React:
- **`Animated` `onDrag` / `onDragStart` / `onDragEnd`** are drag-gesture
  callbacks `(event, info)`, no longer the native HTML5 drag events.
- **Drag starts after a 3px threshold**, so a click on a draggable element
  fires no drag callbacks; a press that becomes a drag fires `onTapCancel`
  instead of `onTap`. `dragThreshold={0}` restores the old start.
- **`AnimatePresence`** removes children that have no exit animation
  immediately instead of after the 10s fallback.
- **`LazyMotion`** always renders its children; `isLoaded` is false while
  async features load.
- **`Trail` `reverse`** reverses the stagger order and passes the real index
  to `children`.
- **`Animated` honors the OS `prefers-reduced-motion` setting without a
  `MotionConfig`**, like inside a default `<MotionConfig reducedMotion="user">`
  (and like `Magnetic`, `Parallax` and drag already did): it jumps instead of
  animating. Use `<MotionConfig reducedMotion="never">` to opt out.
- **Animation delays run on the animation clock**: `useSprings` `delay`,
  `useTrail` / `SpringText` / `useVariants` staggers, `delayChildren`,
  `useAnimate` `delay` and `useChain` step delays follow
  `globalLoop.setTimeScale()` and the test clock instead of `setTimeout`.
  Tests that only fake `setTimeout` must use `installTestClock()`.
- **`useScroll({ target })` without a `container`**: `scrollX` / `scrollY`
  are the page scroll; they were the target's own scroll offset (usually 0).
  Track a scrollable element with `container`.
- **`useMotionValueEvent(value, 'change', cb)`** only fires on changes; it
  also fired on mount (twice under StrictMode).
- **`usePointer` / `useGyroscope` `smooth`** is applied per 60fps frame over
  real elapsed time, so smoothing no longer speeds up on 120Hz+ displays.
- **`useChain`** starts each step once the previous one has settled (it
  used a fixed estimate per step).
- **`useVariants` keeps non-px `x` / `y` strings**: `'50%'` stays `'50%'`
  (1.x animated it as 50 px). Plain px strings like `'12px'` still come back
  as numbers.

Output formats:
- **Colors keep alpha**: translucent results are `rgba(...)`, mixed with
  premultiplied alpha. `useTransform` color outputs are `rgb()`/`rgba()`.
- **CSS color names are parsed** (`'red'`, `'rebeccapurple'`); in 1.x they
  silently became black. Unrecognized colors still resolve to black but log a
  development warning.
- **`useMomentum`, `useBounce`, `useGravity`** integrate real elapsed time
  (options stay "per 60fps frame"), so they no longer run faster on 120Hz+
  displays, and they follow `globalLoop.setTimeScale()`.
- **`createScrollTrigger`** progress grows 0→1 as the element crosses the
  viewport; swipes no longer fire on `pointercancel`.

### Highlights
- **Compositor springs.** `springEasing()` compiles a spring to a CSS
  `linear()` easing; `springTransition()` builds `transition` values;
  `animateNative()` plays springs with the Web Animations API (off the main
  thread for transform/opacity, respects `prefers-reduced-motion`).
- **Exact, seekable physics.** `solveSpring(config, from, to)` returns
  `.at(ms)` → `{ value, velocity }` and `.duration`. `defineSpring({ duration,
  bounce })` describes springs in milliseconds and bounce (SwiftUI model).
- **Deterministic tests.** `@oxog/springkit/testing` → `installTestClock()`
  virtualizes `requestAnimationFrame`, `performance.now` and optionally timers
  (`advance()`, `nextFrame()`, `runAll()`).
- **Slow-motion debugging.** `globalLoop.setTimeScale(0.1)` slows every
  spring, decay, timeline, keyframes and native animation, and the `animate`,
  `stagger`, trail and timeline repeat delays; `0` freezes them.
- **Drag for `Animated`.** `drag`, `dragConstraints` (box or ref),
  `dragElastic`, `dragMomentum`, `dragTransition`, `dragSnapToOrigin`,
  `dragDirectionLock`, `dragThreshold`, `dragControls` (`start`/`stop`/
  `cancel`, handles), `onDragStart`/`onDrag`/`onDragEnd` with `{ point, delta,
  offset, velocity }`, `onDragTransitionEnd`.
- **Perceptual color mixing.** `interpolateColor(value, input, colors, { space: 'oklab' })`
  (also `'linear'`), plus `rgbToOklab()`, `oklabToRgb()`, `srgbToLinear()`,
  `linearToSrgb()`, `mixColorsRGBA()`, `formatRGBA()`, `parseColorRGBA()`.
- **Variants.** `createMotionComponent(tag, { variants, spring })` (threw "not
  implemented" in 1.x); `VariantProvider` indexes its children so
  `staggerChildren` works.
- **Colors, units and complex strings animate in `Animated` and variants.**
  `animate={{ backgroundColor: '#f00', width: '20rem', x: '50%', boxShadow:
  '0 8px 24px rgba(0,0,0,.3)' }}` springs every number and color (premultiplied,
  so fades from `transparent` don't go gray) through the same spring as
  numeric keys: retargeting keeps velocity, and `while*`, `exit`, reduced
  motion all apply. Settled values are exactly the strings you wrote. In 1.x
  string values in `initial`/`animate`/`exit` were not rendered at all, and
  `while*` strings jumped. Values whose shape differs (`'auto'` → `'100px'`,
  `'%'` → `'px'`) still jump.
- **`AnimatePresence mode="popLayout"`.**

### Added
- `decay()`: `from`, `modifyTarget` (lands exactly on the returned value),
  `restDelta`, `getValue()`, `getVelocity()`, `target`.
- `keyframes({ duration })` honors `times`; timeline object targets;
  `useTimeline().seekProgress()`; MotionValue `animationComplete` /
  `animationCancel` events.
- `useTransform` interpolates colors, unit values and complex strings (`space`
  option); `ScrollLinkedConfig.smooth` accepts a factor or a spring config.
- FLIP `correctBorderRadius`; core drag `lockToDiagonal` and `elasticBounce`;
  `createSharedLayoutContext().createGroup(id, config)`.
- `simulateSpring(..., timeStep?)`, `stepSpring()`, `springMotion()`.
- `delay(ms, callback)` / `globalLoop.delay()`: a `setTimeout` on the
  animation clock (follows the time scale and the test clock); returns a
  cancel function.
- `isColorString(value)`: hex, `rgb()`, `hsl()`, `transparent` or a CSS color
  name. `useTransform` and scroll-linked values interpolate named colors.
- Variants: `transition.when: 'beforeChildren'` on `VariantProvider` (children
  start after the parent's spring settles). `'afterChildren'` is not supported.
- `useGesture` `onPinch` / `onRotate` (they were typed and documented but
  never called): `scale`, `angle` and midpoint movement of two pointers.
- Types: `RGBA`, `OKLab`, `ColorSpace`, `ColorInterpolateOptions`,
  `ScrollSmoothing`, `PanInfo` and the drag types, `MotionComponentProps`,
  `FinishableAnimation`, `StartableAnimation`, `VariantResolver`,
  `VariantPreset`.

### Deprecated
- `createScrollSpring` options `momentum` and `momentumDecay` never had an
  effect (wheel and trackpad events already carry the OS's inertia); they are
  now marked `@deprecated`.

### Performance
- The per-frame path allocates nothing and shares spring constants between
  springs with the same config: 2-3x less time per frame at 1,000+ running
  springs, with bit-identical results. `npm run bench` measures it.

### Fixed
- **Animation loop:** running animations were held only by `WeakRef`, so a
  fire-and-forget `spring(...).start()` could be garbage-collected mid-flight;
  one throwing `update()` froze every animation; re-entrant ticks spawned a
  second RAF chain.
- **Springs and values:** velocity was lost on retarget; a value retargeted
  every frame from another animation (trails, linked values) never advanced;
  `finished` never resolved in several cases; throwing callbacks stopped
  completion; `MotionValue.set(v, false)` desynced its spring.
- **Timeline:** `call()` and `addPause()` almost never fired; `onComplete` of
  non-last segments never fired; seeking backwards didn't replay; `play()`
  twice ran two loops.
- **animate / keyframes / trail / stagger / variants:** opacity 0 was read as
  1; a second `animate()` wiped other transforms; `pause()` didn't pause;
  `createTrail({ followDelay: 0 })` never moved; the radial grid stagger gave
  all-zero delays; the `staggerContainer` preset used seconds.
- **Gestures:** multi-touch hijacked drags; snapping jumped after a drag;
  bounds weren't applied while dragging; rotation flipped at 180°; swipe
  velocity was ~0; wheel `deltaMode` was ignored; swipe and long-press got
  stuck after a lost `pointerup`. A lost pointer capture left a core drag
  active; `disable()` during a drag left the element outside its bounds and
  never called `onDragEnd` (it now ends the drag, calls `onDragEnd` and
  springs back inside the bounds, without momentum); a throwing
  `setPointerCapture` left drag, swipe and long-press half-started;
  `disable()` during a swipe still reported it; lifting one of three fingers
  made pinch and rotate jump; rotate `movement` was measured from the finger
  angle instead of the gesture start; overscroll on content shorter than its
  container was lopsided.
- **Color and interpolation:** 4/8-digit hex, `hsla()` and space-separated
  `rgb()` weren't parsed; descending input ranges and short output ranges
  produced wrong values or NaN.
- **Layout, SVG, scroll:** FLIP replaced existing transforms and
  `transform-origin`; relative SVG path commands were treated as absolute;
  `path.pause()` resolved `play()`; shared layout wiped the user's inline
  styles; scroll smoothing never settled on its target. A second FLIP on an
  element mid-animation left it permanently offset (a new FLIP now takes over
  the running one); FLIP size changes misplaced elements with their own
  transform (e.g. `rotate`). `createScrollTrigger` with a numeric `scrub`
  fired `onEnter` late and never `onLeave` after a fast scroll (enter/leave
  now follow the scroll position, not the smoothed progress); descending
  multi-stop `createScrollLinkedValue` ranges picked the wrong segment;
  `createScrollProgress().getInfo()` reset the velocity baseline and the
  smoothing target. Compact SVG arc flags (`a10 10 0 0120 20`) weren't
  parsed; `createMorph().setProgress()` notified subscribers twice.
- **React hooks:** many hooks returned destroyed instances under
  `React.StrictMode` (Next.js dev mode); `useInView` / `useScroll` ignored
  elements that mount later; `useSprings` re-created springs every render;
  `useTimeline` never exposed its timeline; `useInViewMultiple` hit "Maximum
  update depth exceeded"; `useAnimate` started `scale` at 0.
- **React components:** inline `config={{...}}` restarted springs every frame,
  so `Magnetic`, `Parallax`, `TiltCard`, `SpringText`, `Spring` and `Trail`
  barely moved with default settings. `AnimatePresence` remounted exiting
  children and ignored `initial={false}`. `Animated` didn't animate keys that
  only appear in `whileHover`/`whileTap`, wrote `x`/`y` as invalid CSS,
  dropped user event handlers and ignored `MotionConfig`. `Reorder` never
  reordered. `SpringText` split emoji.
- **SSR and accessibility:** `MotionConfig` caused a hydration mismatch for
  users who prefer reduced motion; `Animated` played its entrance when that
  preference arrived after hydration; `useInView`, `Parallax` and
  `whileInView` crashed without `IntersectionObserver`; `useReducedMotion`
  crashed without `matchMedia`.
- **More React fixes:** hooks returned destroyed instances after a
  hidden `<Activity>` was shown again (React 19.2); `useSprings`, `useTrail`
  and `Trail` restarted every item (and returned too few items for a render)
  when items were added; `AnimatePresence mode="wait"` remounted siblings
  that stayed in the list; a second finger took over an `Animated` drag (and
  ended it without `onDragEnd`); `onDragEnd` didn't fire when `drag` was
  turned off mid-gesture; a constraints container mounted after the element
  was never re-measured on resize; `dragControls.isDragging()` turned false
  while another element was still dragging; `Animated` completed exits up to
  50ms+ late (now on the frame the spring settles); `<Spring onRest>` fired
  once per key, the first time before everything settled; turning reduced
  motion on left `Magnetic`, `Parallax`, `MouseParallax` and `TiltCard`
  displaced; `Reorder` items slid back from their displaced offset after a
  drop; `useTransform` with `clamp` and `ease` mapped out-of-range values
  inside the range (or to NaN), and descending ranges with 3+ stops picked the
  wrong segment; `useScrollTrigger`, `useParallax` and `useScrollProgress`
  ignored elements that mount later; `ParallaxLayer` ignored `pages` (so
  `speed={0}` wasn't fixed) and `sticky` never followed the scroll; `useDrag`
  ignored option changes after mount and reset the position when its element
  changed; `useChain` returned no values on the first render and its
  `reset()` didn't reset them; `useGesture` restarted the drag when a second
  finger touched; `useReducedMotion()` returned `false` on the first
  client-only render. `LazyMotion` docs described `m` / `motion` components
  that don't exist (`strict` is a no-op).
- **Variants:** `useVariants` `onAnimationComplete` never fired when passed as
  an inline function (the usual case): every animation frame re-rendered and
  cancelled its timer. It now fires once the spring has actually settled
  (exact settle time instead of a damping-based guess).
- `globalLoop.setTimeScale(NaN | Infinity)` froze every animation; non-finite
  values are now ignored with a development warning.
- Development diagnostics: invalid animation values (NaN/Infinity) logged an
  error on every call, now once per message; `smooth: 0.95` triggered a
  spurious "high mass" warning.
- **Types:** timeline options (`spring`, `ease`, callbacks), function variants,
  `variantPresets.*`, `sequence`/`stagger` items and `MotionValue<number>`
  assignability were rejected by the published types.

### Packaging and tooling
- **The React entry bundled a second copy of the core**, so apps using both
  entries ran two `globalLoop`s and `instanceof MotionValue` failed across
  them. It now imports `@oxog/springkit`.
- **CommonJS types** resolved to the ESM declarations; `exports` now has
  separate `import`/`require` types. publint and arethetypeswrong pass for
  node10, node16 and bundler resolution.
- The React entry starts with `"use client"` (Next.js App Router) and its
  types no longer need `esModuleInterop`.
- Output is no longer minified and ships without source maps: the tarball
  dropped from 758 kB to about 300 kB.
- `prepare` (build + tests on every install) was replaced by
  `prepublishOnly`. New scripts: `lint:package`, `bench`. `typecheck` and
  `lint` cover the tests. CI runs everything on Node 22/24 and Windows.
- `npm run build` builds its targets one after another: building them in
  parallel intermittently crashed Node on Windows (`0xC0000374`) and left an
  incomplete `dist/`.

### Website
- New: Native Springs and Drag example pages; docs for Native Springs,
  Testing, Time Scale, Drag (`Animated`), Presence & Variants and color
  spaces; measured bundle-size comparison; `/llms.txt`. Pages no longer scroll
  sideways on phones. Dozens of code samples that used non-existent APIs
  were corrected against the real exports.

## [1.3.6] - 2026-02-28

### Internal
- Edge-case tests for `animate`, `decay`, `keyframes`, timeline and layout.

## [1.3.5] - 2026-02-28

### Fixed
- React StrictMode: `useSpring` syncs with the spring's state on mount;
  destroyed-instance checks in `useSpringState`, `useElastic`, `useScroll` and
  `useScrollVelocity`; `useVariants` initial animation.
- `useGravity` rest detection; `useTrail` reacts to config changes.

### Changed
- `SpringGroup` batches notifications in a microtask instead of a frame.

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
