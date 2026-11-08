# API support and contracts

SpringKit has a dependency-free core, optional React bindings and a small DOM binding entry. The following contracts apply to the current 2.x maintenance changes.

| Entry | Purpose | React required |
| --- | --- | --- |
| `@oxog/springkit` | Physics, values, DOM animation, gestures, layout and SVG utilities | No |
| `@oxog/springkit/react` | Hooks, Animated elements, presence and ready-made components | React 18 or 19 |
| `@oxog/springkit/dom` | `bindStyle`, `bindAttribute` and shared value/style utilities | No |
| `@oxog/springkit/testing` | Deterministic RAF, time and optional timers | No |

## Values

| API | Numbers | Colors | Units and complex strings |
| --- | --- | --- | --- |
| `spring`, `SpringValue`, numeric `MotionValue` | Yes | Use a derived value | Use a derived value |
| `animate` | Yes | Yes, premultiplied alpha | Same-template strings interpolate; incompatible templates jump |
| `Animated`, `useVariants` | Yes | Yes, premultiplied alpha | Same-template strings interpolate; incompatible templates jump |
| `useTransform` | Yes | Yes; optional color spaces | Matching string templates |
| Timeline | Numeric properties and object fields | No | No |
| `animateNative` | Browser keyframes | Browser support | Browser-supported keyframes |

Numbers used as CSS lengths receive pixels. Unitless properties such as opacity, lineHeight, fontWeight and zIndex stay unitless; CSS custom properties retain their numeric value without pixels. Transform numbers use pixels/degrees, and strings keep authored units.

Examples: `10px` to `50px` interpolates, a red color to a blue color interpolates, and `auto` to `100px` or `20%` to `100px` jumps. Cross-unit conversion and measuring `auto` dimensions are not implicit.

`animate` arrays are `[from, ...targets]`. A single-entry array is a target. Without `duration`, transitions use springs. With a finite `duration`, the total milliseconds are split across the property's transitions and `ease` maps progress. Providing `ease` alone selects a 300ms timed animation. Colors and units use the same timed or spring driver as numbers. `onUpdate` infers numeric/string values from the target.

`getProgress()` describes the clamped visual progress across property/keyframe segments, averaged across properties. Spring overshoot can make visual progress non-monotonic. It is not a timeline playhead.

## Clocks and lifecycle

| Surface | Time unit | Start | Stop/cleanup | Completion |
| --- | --- | --- | --- | --- |
| Spring, decay | ms through the animation clock | `start()` | `stop()` / `destroy()` | Current `finished` resolves on completion or interruption |
| SpringValue, MotionValue | ms through the animation clock | `set()` | `stop()` / `destroy()` | Current `finished`; MotionValue also has completion/cancel events |
| `animate` | ms | Starts immediately or after delay | `stop()` | `finished` resolves; `onComplete` only for natural completion |
| Keyframes, SVG path drawing | ms | `play()` | Stop/reset/destroy methods of the controller | Promise returned by play |
| Timeline | **seconds** | `play()` | `kill()` | Timeline/segment callbacks |
| Trail | `followDelay` is a number of reference 60fps frames | `set()` | `destroy()` | Subscription-driven |

Pause preserves a pending completion and resumes motion; interruption settles the old work. MotionValue completion comes from the underlying spring, and variant completion comes from the actual spring group rather than a distance-independent timer. Subscription handles own their registrations independently.

`globalLoop.setTimeScale(0)` freezes loop-driven animation time. Scales such as 0.1, 1, 2, 5 and 10 preserve equivalent elapsed animation time. The global loop owns the real-time suspension clamp; individual drivers must not clamp the scaled delta again.

## DOM binding and React rendering

```tsx
import { createMotionValue } from '@oxog/springkit'
import { bindStyle } from '@oxog/springkit/dom'

const opacity = createMotionValue(0)
const detach = bindStyle(document.querySelector('.card')!, { opacity })
opacity.set(1)
// Cleanup when the element is no longer owned:
detach()
opacity.destroy()
```

`Animated` accepts live values in `style`, including transform shorthands. It renders initial styles for SSR and writes animation frames directly to the DOM. React still renders target/gesture/presence changes. `useSpring` and `useMotionValueState` deliberately return renderable state and therefore update their React consumers; use live style bindings for high-frequency drawing.

## Accessibility and browser boundaries

`MotionConfig` and the OS preference control reduced motion in Animated, drag release, Magnetic, Parallax, text/number/typewriter components and Reorder transitions. Essential pointer movement stays direct. The typewriter cursor is decorative and hidden from accessibility APIs. Reorder supports keyboard movement and exposes list positions.

Native springs feature-detect WAAPI and CSS linear easing. Unsupported WAAPI falls back to the final style; unsupported linear easing uses a cubic easing. Off-main-thread execution depends on browser version, property and compositing eligibility. A supported CSS syntax alone does not guarantee compositor execution.

SVG morphing samples geometry into a polyline. Simple shapes are supported; separate subpaths, holes, winding correspondence and arbitrary topology changes need application-specific preparation. The no-SVG-geometry fallback approximates paths and is not a pixel-equivalent browser renderer.

## Legacy and advanced surfaces

- `LazyMotion` is a feature-flag provider and optional async flag loader. `MotionFeatureGuard` reads those flags. It does not split Animated code; `strict` is a legacy no-op.
- React `VariantProvider` indexes direct children. `afterChildren` is not implemented in the React adapter; do not infer it from the core orchestration helper's support. `beforeChildren` uses the configured parent settle estimate because a plain provider is not itself an animated parent.
- `createScrollSpring` momentum options are deprecated no-ops: wheel/trackpad input already contains OS inertia.
- `useGravity.mass` is reserved/unused; gravity options describe acceleration. Do not use mass to tune the current hook.
- `simulateSpring` is an Euler step; `stepSpring` and `springMotion` are analytic. They are distinct tools with different numerical contracts.
- Low-level value templates exported from the DOM entry are advanced utilities; application code should usually use `bindStyle` and `bindAttribute`.

2.x retains existing method names and legacy options. Removal, renamed time units or changed defaults require a major version and migration notes. New framework adapters, automatic native-engine selection, ScrollTimeline/ViewTimeline, auto-size conversion and topology-aware morphing are separate product expansions.
