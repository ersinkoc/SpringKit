# Migrating from SpringKit 1.x to 2.0

Most apps upgrade without code changes. 2.0 is a major version because several
bug fixes change observable behavior. This guide lists each one, who it
affects, and what to change.

```bash
npm install @oxog/springkit@2
```

## Quick checklist

| You use | Check |
|---|---|
| `decay()` | [Velocity is now px/s](#decay-uses-real-units) — multiply 1.x values by 60 |
| `useDrag` / `createDragSpring` velocities, swipe thresholds | [All gesture velocities are px/s](#gesture-velocities-are-pxs) — multiply by 1000 |
| `useDrag` / `createDragSpring` with `momentum` | [Flings glide further](#core-drag-momentum) |
| `createDragSpring` `onSnapComplete` | [Fires when the snap settles](#onsnapcomplete-fires-when-the-snap-settles) |
| `createDragSpring` `dragElastic: { … }` | [Missing edges are not elastic](#dragelastic-object-form) |
| `stagger()` with a number `delay` | [Items are now actually staggered](#stagger-with-a-numeric-delay) |
| `staggerPresets` / stagger pattern defaults | [Values are milliseconds](#stagger-patterns-are-in-milliseconds) |
| `animate(el, { x: [a, b, c] })` | [First entry is the start value](#animate-arrays-start-at-the-first-entry) |
| Spring timings tuned on a 120Hz+ display | [Springs now run at the intended speed](#springs-run-at-the-same-speed-on-every-display) |
| `<Animated onDrag… />` | [Drag callbacks replaced HTML5 drag events](#animated-drag-callbacks) |
| Click handlers on draggable `Animated` elements | [3px drag threshold](#drag-starts-after-a-3px-threshold) |
| `configFromDuration` / `configFromBounce` | [Physically derived configs](#configfromduration-and-configfrombounce) |
| `await spring.finished` after `stop()` | [Now resolves](#stop-resolves-finished) |
| Color output strings | [rgba() for translucent colors](#colors-keep-alpha) |
| `Animated` and users who prefer reduced motion | [OS setting honored without MotionConfig](#animated-honors-prefers-reduced-motion) |
| Tests that fake only `setTimeout` (stagger / delay) | [Delays use the animation clock](#animation-delays-use-the-animation-clock) |
| `useScroll({ target })` reading `scrollY` | [Page scroll position](#usescroll-target) |
| `useMotionValueEvent(v, 'change')` | [No call on mount](#usemotionvalueevent-change) |

## Physics and timing

### Springs run at the same speed on every display

In 1.x a spring advanced a fixed 1/60 s per frame, so it ran 2x too fast at
120Hz, 2.4x at 144Hz and 1.67x at 50Hz. 2.0 integrates real elapsed time with
the exact solution of the spring equation.

**Who is affected:** if you tuned `stiffness`/`damping` by eye on a
high-refresh-rate screen (most recent MacBooks and phones), your animations
were running faster than the numbers say and will now look slower.

**What to do:** re-tune by feel, or describe the spring by its duration:

```ts
import { defineSpring } from '@oxog/springkit'

spring(0, 100, { ...defineSpring({ duration: 350, bounce: 0.2 }), onUpdate })
```

### decay() uses real units

`velocity` is now in units per second and `deceleration` is the fraction of
velocity kept per **millisecond** (the iOS scale: `0.998` normal, `0.99` fast).
In 1.x both were per 60 fps frame, so the documented `velocity: 1000` traveled
about 500,000 px.

```ts
// 1.x
decay({ velocity: 20, deceleration: 0.95 })

// 2.0: px per frame × 60 = px/s; per-frame deceleration d → d ** (1 / 16.67)
decay({ velocity: 1200, deceleration: 0.997 })
```

`info.velocity` from `Animated` drag callbacks is already in px/s and can be
passed to `decay()` directly. `decay()` also gained `from`, `modifyTarget` (snap a fling to a
grid), `getValue()`, `getVelocity()` and `target`.

### Gesture velocities are px/s

Every velocity in 2.0 is in px/s. In 1.x the core drag and swipe gestures
reported and expected px/ms:

| Value | 1.x | 2.0 |
|---|---|---|
| `createDragSpring` / `useDrag` `onDragEnd(x, y, velocity)` | px/ms | px/s |
| `drag.release(vx, vy)` | ≈ px/ms × 16 | px/s |
| `drag.getVelocity()` | px/ms | px/s |
| `snap.velocityThreshold` | px/ms, default 0.5 | px/s, default 500 |
| `createSwipeGesture` `velocityThreshold` | px/ms, default 0.5 | px/s, default 500 |
| swipe `state.velocity` | px/ms | px/s |

```ts
// 1.x
createSwipeGesture(el, { velocityThreshold: 0.3 })
// 2.0
createSwipeGesture(el, { velocityThreshold: 300 })
```

`velocity` from these callbacks can now be passed straight to `decay()`.

### Core drag momentum

With `momentum: true`, 1.x projected a target a few pixels ahead and sprang
to it with a velocity 60x too low, so the element nearly stopped on release.
2.0 continues with the exact release velocity and decays it exponentially. The
glide is much longer: about `v / (60 · −ln(momentumDecay))` px, e.g. ~325 px
for a 1000 px/s fling with the default `momentumDecay: 0.95`. Use `0.9`
(~158 px) or lower for a shorter glide. `onBoundsHit` now also fires when the
glide reaches a bound.

### onSnapComplete fires when the snap settles

1.x called `onSnapComplete` 500ms after a snap started, whether or not the
element had arrived, and even when the snap was interrupted. 2.0 calls it once
the snap spring has come to rest on the point, and not for a snap interrupted
by a drag, `release()`, `jumpTo()` or `animateTo()`.

**Who is affected:** code that relied on the callback arriving after 500ms.
With the default spring a 100px snap now reports after about 1s, and softer
springs take longer.

**What to do:** nothing if you only need "the snap has finished". For an
earlier cue, use `onSnapStart` plus your own timer.

### dragElastic object form

In the object form (`dragElastic: { right: 0.3 }`), an edge left out used to
get 0.5. It is now 0, so that edge is a hard stop, as in Framer Motion and
`Animated`'s `dragElastic`.

**What to do:** list every edge that should stretch, e.g.
`dragElastic: { left: 0.5, right: 0.3, top: 0.5, bottom: 0.5 }`.

### configFromDuration() and configFromBounce()

They returned one of three fixed configs (300 ms and 5 s gave the same
spring). They now compute the config from the perceptual model, the same one
`defineSpring()` uses, so values differ. Prefer `defineSpring({ duration,
bounce })` in new code.

## Orchestration

### stagger() with a numeric delay

```ts
stagger(items, (el) => spring(...), { delay: 50 })
```

1.x started every item after the same 50 ms. 2.0 starts the item `k` steps
away from `from` after `k × 50` ms, which is what the docs always described.
`from: 'center'` now fans out symmetrically. A function `delay` is unchanged.

**What to do:** if you compensated with a function like `delay: (i) => i * 50`,
nothing changes. If you relied on all items starting together, use `delay: 0`
or `parallel()`.

### Stagger patterns are in milliseconds

`staggerPresets.*` and the default `delay` of `linearStagger`, `gridStagger`
and friends were in seconds (`0.05`), while every SpringKit `delay` option is
milliseconds, so combining them produced invisible staggers.

```ts
staggerPresets.cascade(3) // 1.x: [0, 0.05, 0.1]   2.0: [0, 50, 100]
```

If you multiplied preset output by 1000, remove the multiplication. Values you
pass explicitly as `delay` are returned in the same unit as before.

### animate() arrays start at the first entry

```ts
animate(el, { opacity: [0, 1] })
```

1.x sprang from the element's current value through `0` and then `1`. 2.0
treats the array as `[from, ...to]` (Framer Motion convention): it starts at
`0` and springs to `1`.

### Timeline

- Segment values are computed from the playhead, so `seek()` and `reverse()`
  are exact.
- `to()` reads the element's starting values when the segment first plays,
  not when you call `to()`. If you set styles between building and playing a
  timeline, they are now respected.
- Positions remain in **seconds** (`'-=0.2'`, `1.5`), as in 1.x.

### stop() resolves finished

`spring().stop()` and `decay().stop()` resolve the current `finished` promise
instead of leaving it pending forever. Calling `start()` again creates a new
promise. Code awaiting `finished` after `stop()` now continues instead of
hanging.

## React

### Animated drag callbacks

`Animated` gained a full drag API, so `onDrag`, `onDragStart` and `onDragEnd`
are now gesture callbacks with Framer-Motion signatures:

```tsx
<Animated.div
  drag
  onDragEnd={(event, info) => console.log(info.offset, info.velocity)}
/>
```

If you used these props for **native HTML5 drag-and-drop** (`draggable`,
`dataTransfer`), wrap the content in a plain element and put the handlers
there.

### Drag starts after a 3px threshold

A draggable element only starts dragging (`onDragStart`, `whileDrag`) once
the pointer moves 3px, so a plain click fires no drag callbacks. A press that
turns into a drag fires `onTapCancel` instead of `onTap`. To start on
pointerdown as before, set `dragThreshold={0}`.

### AnimatePresence

Children without an exit animation (plain DOM, `useIsPresent` only) are
removed immediately instead of after the 10 s fallback. `mode="popLayout"`
now pops exiting children out of the layout (the child must forward its ref,
e.g. `Animated.div`).

### LazyMotion

Children always render, including on the server. While async features load,
`isLoaded` is `false` and `MotionFeatureGuard` shows its fallback.

### useMomentum, useBounce and useGravity

These hooks integrated their per-frame options once per animation frame, so
they ran twice as fast on 120Hz displays. They now use real elapsed time; the
options keep their meaning ("per 60fps frame"). On 60Hz screens nothing
changes; on faster screens the motion is slower than in 1.x, as intended.

### Animated honors prefers-reduced-motion

Without a `MotionConfig`, `Animated` used to ignore the OS reduced-motion
setting. It now behaves like inside a default
`<MotionConfig reducedMotion="user">`: for users who prefer reduced motion,
values jump to their targets instead of animating (entrances, gestures,
exits). To keep animating regardless, wrap the app in
`<MotionConfig reducedMotion="never">`.

### Animation delays use the animation clock

Stagger and delay timers (`useSprings` `delay`, `useTrail`, `SpringText`,
`useVariants` `staggerChildren` / `delayChildren` / `delay`, `useAnimate`
`delay`, `useChain` step delays) now run on the animation clock, so they
follow `globalLoop.setTimeScale()`. In tests, `vi.useFakeTimers()` with only
the timer functions faked no longer advances them: use
`installTestClock()` from `@oxog/springkit/testing` (or also fake
`requestAnimationFrame` and `performance`).

### useScroll target

`target` is the element whose progress through the viewport is tracked.
Without a `container`, `scrollX` / `scrollY` now report the page scroll; in
1.x they reported the target's own scroll offset (usually 0). To track the
scroll position of a scrollable element, pass it as `container`:

```tsx
const { scrollY } = useScroll({ container: scrollableRef })
```

### useMotionValueEvent change

`useMotionValueEvent(value, 'change', callback)` no longer calls `callback`
when it mounts, only when the value changes. Read `value.get()` on mount if
you relied on the initial call.

### Trail reverse

`reverse` reverses the order in which items animate, and `children` receive
each item's real index (1.x passed the reversed index without changing the
order).

## Output formats

### Colors keep alpha

Translucent colors are mixed with premultiplied alpha and returned as
`rgba(r, g, b, a)` from `interpolateColor`, scroll-linked values and
`useTransform`. Opaque colors from `interpolateColor` are unchanged.
`useTransform` color outputs are always `rgb()`/`rgba()` strings, including at
the end stops. For perceptually even gradients, pass `{ space: 'oklab' }`.

### CSS color names

`'red'`, `'navy'` and the other CSS color names are parsed and interpolated.
In 1.x they silently became black, so a transition from `'red'` to `'blue'`
was black to black. Unknown strings still fall back to black, now with a
development warning. Use `isColorString(value)` to check input.

### Scroll trigger progress and swipes

`createScrollTrigger` progress now grows from 0 to 1 as the element crosses
the viewport (1.x reported 0 while the element was in view). Swipe gestures no
longer fire when the pointer is cancelled.

## Packaging

- `@oxog/springkit/react` no longer bundles its own copy of the core, so the
  two entries share one animation loop. No action needed.
- The published files are no longer minified and have no source maps.
- New entry point: `@oxog/springkit/testing` (`installTestClock()`) for
  deterministic animation tests. Prefer it over `vi.useFakeTimers()`, which
  doesn't advance `performance.now()` by default and so no longer moves
  springs.
