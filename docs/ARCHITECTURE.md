# Animation architecture

The core owns numerical values, physics and animation time. React owns component lifecycle, targets and interactions. The DOM layer owns value parsing and style serialization.

| Owner | Source | Responsibility |
| --- | --- | --- |
| Animation clock | `src/animation/loop.ts` | Real-time clamping, time scale, active work and delays |
| Physical integration | `src/core/physics.ts` | Shared coefficients and exact spring stepping |
| Values | `src/core/spring-value.ts`, `MotionValue.ts` | Target changes, subscriptions and real completion |
| Shared value channels | `src/dom/values.ts` | Number/string/color templates, premultiplied alpha and reconstruction |
| CSS metadata and binding | `src/dom/style.ts` | Units, transforms, live HTML/SVG style/attribute bindings |
| Imperative animation | `src/animation/animate.ts`, `tween-value.ts` | Property ownership, keyframes, spring/timed drivers and controls |
| React drawing | `src/adapters/react/components/Animated.tsx` | SSR initial styles, frame writes, gesture/presence composition |
| React variants | `useVariants.ts`, `useAnimatableValues.ts` | Target identity and actual group completion |

Running work is held strongly until removed/completed. Finalization notifications are debugging aids, not an ownership or timely-cleanup mechanism. Every owned listener, subscription, observer and animation must have explicit cleanup.

MotionValue and imperative animation use their drivers' completion signals instead of a per-value RAF polling chain. Animate prevents an older call from overwriting a property taken by a newer call. Deferred callbacks must verify their target generation/liveness before publishing.

React frame state lives in refs. Animated writes styles without scheduling a React render per animation frame; its next parent render reads the latest frame so it does not overwrite motion with stale initial styles. Live-value subscriptions detach on unmount. Drag offsets use the same direct writer, while drag start/end update interaction state.

The React bundle imports the core and DOM entry by package name. Do not import relative core implementations into React: that could embed a second animation loop or MotionValue constructor. ESM and CJS are independently built formats; keep a consumer's import mode consistent.

Use the test clock for ordering, rest and pause assertions. Use browser tests for CSS, native animation and SVG geometry. Bundle size checks are stable CI gates; wall-clock benchmarks are measured locally and should be compared on equivalent hardware/load.
