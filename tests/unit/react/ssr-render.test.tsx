// @vitest-environment node
/**
 * Server-side rendering tests for the React adapter.
 *
 * Runs in a plain Node environment (no window / document / matchMedia /
 * IntersectionObserver / ResizeObserver / requestAnimationFrame), exactly like
 * Next.js App Router, Remix or a bare `react-dom/server` render.
 *
 * Every component and hook exported from the React entry is rendered with
 * `renderToString`. The test fails when an export has no SSR case, so new
 * exports must be added here.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as React from 'react'
import { renderToString } from 'react-dom/server'
import * as SpringKitReact from '../../../src/adapters/react/index'
import { globalLoop } from '../../../src/index'
import {
  // Core hooks
  useSpring,
  useSpringValue,
  useSprings,
  useTrail,
  useDrag,
  useGesture,
  usePresence,
  useIsPresent,
  usePresenceCustom,
  useAnimate,
  // MotionValue hooks
  useMotionValue,
  useMotionValueState,
  useMotionValueSync,
  useMotionValues,
  useTransform,
  useCombinedTransform,
  useVelocityTransform,
  useSpringTransform,
  useVelocity,
  useMotionValueEvent,
  useMotionTemplate,
  useTime,
  useAnimationFrame,
  useWillChange,
  useSum,
  useProduct,
  useDifference,
  useClamp,
  useSnap,
  useSmooth,
  useDelay,
  useDragControls,
  useInstantTransition,
  useForceUpdate,
  useLayoutMeasure,
  // Viewport & scroll
  useInView,
  useInViewCallback,
  useInViewMultiple,
  useScroll,
  useScrollVelocity,
  // Gesture state
  useGestureState,
  useHover,
  useTap,
  useFocus,
  useInteractionState,
  useGestureAnimation,
  // Accessibility
  useReducedMotion,
  getReducedMotionPreference,
  useReducedMotionConfig,
  useShouldAnimate,
  useReducedMotionValue,
  // Scroll-linked
  useScrollProgress,
  useParallax,
  useScrollTrigger,
  useScrollLinkedValue,
  // Timeline
  useTimeline,
  useTimelineState,
  // SVG
  useMorph,
  useMorphSequence,
  useMorphRef,
  // Layout
  useLayoutGroup,
  useLayoutId,
  useFlip,
  useAutoLayout,
  LayoutGroupProvider,
  SharedLayoutProvider,
  LayoutGroupContext,
  SharedLayoutContextReact,
  // Variants
  useVariants,
  useVariantContext,
  useStaggerChildren,
  VariantProvider,
  VariantContext,
  createMotionComponent,
  // Physics
  useSpringState,
  useMomentum,
  useElastic,
  useBounce,
  useGravity,
  useChain,
  usePointer,
  useGyroscope,
  // Components
  Spring,
  Animated,
  Trail,
  AnimatePresence,
  PresenceChild,
  MotionConfig,
  useMotionConfig,
  Reorder,
  SpringText,
  SpringNumber,
  TypeWriter,
  SplitText,
  Magnetic,
  MagneticGroup,
  MagneticCursor,
  useMagnetic,
  Parallax,
  MouseParallax,
  TiltCard,
  ParallaxContainer,
  ParallaxLayer,
  useParallaxContext,
  LazyMotion,
  useLazyMotion,
  useMotionFeature,
  domAnimation,
  domMax,
  domMin,
  MotionFeatureGuard,
  createAsyncFeatures,
  mergeFeatures,
  PresenceContext,
  isBrowser,
  isServer,
  useIsomorphicLayoutEffect,
  shouldSkipAnimation,
  safeRequestAnimationFrame,
  safeCancelAnimationFrame,
  MotionValue,
  createMotionValue,
  transformValue,
  mapRange,
} from '../../../src/adapters/react/index'

// ============ Helpers ============

let errorSpy: ReturnType<typeof vi.spyOn>
let warnSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  errorSpy.mockRestore()
  warnSpy.mockRestore()
})

function formatCalls(spy: ReturnType<typeof vi.spyOn>): string {
  return spy.mock.calls.map((args) => args.map(String).join(' ')).join('\n')
}

/** Render on the server and assert that nothing was logged */
function ssr(element: React.ReactElement): string {
  const html = renderToString(element)
  expect(formatCalls(errorSpy), 'console.error during SSR').toBe('')
  expect(formatCalls(warnSpy), 'console.warn during SSR').toBe('')
  return html
}

/** Render a hook inside a tiny component; `render` turns its result into markup */
function hookCase<R>(useHook: () => R, render?: (result: R) => React.ReactNode): () => React.ReactElement {
  function HookHost() {
    const result = useHook()
    return <div data-hook="">{render ? render(result) : null}</div>
  }
  return () => <HookHost />
}

const PATH_A = 'M 0 0 L 10 0 L 10 10 Z'
const PATH_B = 'M 0 0 L 20 0 L 20 20 Z'

// ============ Environment sanity ============

describe('SSR environment', () => {
  it('runs without DOM globals', () => {
    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')
    expect(typeof (globalThis as { matchMedia?: unknown }).matchMedia).toBe('undefined')
    expect(typeof (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver).toBe('undefined')
    expect(typeof (globalThis as { ResizeObserver?: unknown }).ResizeObserver).toBe('undefined')
    expect(typeof (globalThis as { requestAnimationFrame?: unknown }).requestAnimationFrame).toBe('undefined')
  })

  it('SSR utilities report a server environment', () => {
    expect(isBrowser).toBe(false)
    expect(isServer).toBe(true)
    expect(shouldSkipAnimation()).toBe(true)
    expect(safeRequestAnimationFrame(() => {})).toBe(0)
    expect(() => safeCancelAnimationFrame(0)).not.toThrow()
    expect(getReducedMotionPreference()).toBe(false)
  })
})

describe('module scope', () => {
  it('importing the core and React entries in Node touches no browser globals', async () => {
    vi.resetModules()
    const timeoutSpy = vi.spyOn(globalThis, 'setTimeout')
    const intervalSpy = vi.spyOn(globalThis, 'setInterval')
    try {
      // A bare `window.x` / `document.x` / `matchMedia()` at module scope would throw here
      const core = await import('../../../src/index')
      const react = await import('../../../src/adapters/react/index')
      expect(typeof core.spring).toBe('function')
      expect(typeof react.Animated.div).toBe('object')
      // Nothing scheduled at import time (no animation loop / timers started)
      expect(timeoutSpy).not.toHaveBeenCalled()
      expect(intervalSpy).not.toHaveBeenCalled()
    } finally {
      timeoutSpy.mockRestore()
      intervalSpy.mockRestore()
    }
    // Importing must not define browser globals either
    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')
  })
})

// ============ Every export ============

/**
 * Exports that are not components or hooks (constants, contexts, utilities,
 * classes). They are still exercised by the cases below where relevant.
 */
const NON_RENDERABLE = new Set([
  'domAnimation', 'domMax', 'domMin', 'createAsyncFeatures', 'mergeFeatures',
  'PresenceContext', 'LayoutGroupContext', 'SharedLayoutContextReact', 'VariantContext',
  'isBrowser', 'isServer', 'shouldSkipAnimation', 'safeRequestAnimationFrame',
  'safeCancelAnimationFrame', 'getReducedMotionPreference',
  'MotionValue', 'createMotionValue', 'transformValue', 'mapRange',
])

const MotionLi = createMotionComponent('li', {
  variants: { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } },
})

/** One SSR case per export (Animated / Reorder namespaces are tested separately) */
const cases: Record<string, () => React.ReactElement> = {
  // ---- Core hooks
  useSpring: hookCase(() => useSpring({ x: 10, opacity: 0.5 }), (v) => `${v.x}|${v.opacity}`),
  useSpringValue: hookCase(() => useSpringValue(5), (s) => s.get()),
  useSprings: hookCase(
    () => useSprings(3, (i) => ({ values: { x: i * 10 } })),
    (r) => JSON.stringify(Array.isArray(r) ? r[0] : r)
  ),
  useTrail: hookCase(() => useTrail(3, { x: 1 }), (v) => v.length),
  useDrag: hookCase(() => useDrag(), ([pos]) => `${pos.x},${pos.y}`),
  useGesture: hookCase(() => useGesture({ onDrag: () => {} }), () => 'gesture'),
  usePresence: hookCase(() => usePresence(), ([present]) => String(present)),
  useIsPresent: hookCase(() => useIsPresent(), (p) => String(p)),
  usePresenceCustom: hookCase(() => usePresenceCustom<string>(), (c) => String(c)),
  useAnimate: hookCase(() => useAnimate(), () => 'animate'),

  // ---- MotionValue hooks
  useMotionValue: hookCase(() => useMotionValue(7), (mv) => mv.get()),
  useMotionValueState: hookCase(() => {
    const mv = useMotionValue(3)
    return useMotionValueState(mv)
  }, (v) => String(v)),
  useMotionValueSync: hookCase(() => useMotionValueSync(4), (mv) => mv.get()),
  useMotionValues: hookCase(() => useMotionValues({ a: 1, b: 2 }), (mvs) => mvs.a.get() + mvs.b.get()),
  useTransform: hookCase(() => {
    const mv = useMotionValue(0.5)
    return useTransform(mv, [0, 1], [0, 100])
  }, (mv) => mv.get()),
  useCombinedTransform: hookCase(() => {
    const a = useMotionValue(1)
    const b = useMotionValue(2)
    return useCombinedTransform([a, b], ([x, y]) => x + y)
  }, (mv) => mv.get()),
  useVelocityTransform: hookCase(() => {
    const mv = useMotionValue(0)
    return useVelocityTransform(mv, (v) => v * 2)
  }, (mv) => mv.get()),
  useSpringTransform: hookCase(() => {
    const mv = useMotionValue(0.5)
    return useSpringTransform(mv, [0, 1], [0, 100])
  }, (mv) => mv.get()),
  useVelocity: hookCase(() => {
    const mv = useMotionValue(0)
    return useVelocity(mv)
  }, (mv) => mv.get()),
  useMotionValueEvent: hookCase(() => {
    const mv = useMotionValue(0)
    useMotionValueEvent(mv, 'change', () => {})
    return mv
  }, (mv) => mv.get()),
  useMotionTemplate: hookCase(() => {
    const x = useMotionValue(10)
    return useMotionTemplate`translateX(${x}px)`
  }, (mv) => mv.get()),
  useTime: hookCase(() => useTime(), (mv) => typeof mv.get()),
  useAnimationFrame: hookCase(() => useAnimationFrame(() => {}), () => 'frame'),
  useWillChange: hookCase(() => {
    const mv = useMotionValue(0)
    return useWillChange([mv])
  }, (mv) => mv.get()),
  useSum: hookCase(() => {
    const a = useMotionValue(1)
    const b = useMotionValue(2)
    return useSum(a, b)
  }, (mv) => mv.get()),
  useProduct: hookCase(() => {
    const a = useMotionValue(2)
    const b = useMotionValue(3)
    return useProduct(a, b)
  }, (mv) => mv.get()),
  useDifference: hookCase(() => {
    const a = useMotionValue(5)
    const b = useMotionValue(3)
    return useDifference(a, b)
  }, (mv) => mv.get()),
  useClamp: hookCase(() => {
    const a = useMotionValue(50)
    return useClamp(a, 0, 10)
  }, (mv) => mv.get()),
  useSnap: hookCase(() => {
    const a = useMotionValue(12)
    return useSnap(a, 5)
  }, (mv) => mv.get()),
  useSmooth: hookCase(() => {
    const a = useMotionValue(12)
    return useSmooth(a)
  }, (mv) => mv.get()),
  useDelay: hookCase(() => {
    const a = useMotionValue(12)
    return useDelay(a, 2)
  }, (mv) => mv.get()),

  // ---- Drag controls / transitions
  useDragControls: hookCase(() => useDragControls(), () => 'controls'),
  useInstantTransition: hookCase(() => useInstantTransition(), ([, pending]) => String(pending)),
  useForceUpdate: hookCase(() => useForceUpdate(), () => 'force'),
  useLayoutMeasure: hookCase(() => useLayoutMeasure(), () => 'measure'),

  // ---- Viewport & scroll
  useInView: hookCase(() => useInView(), ({ inView }) => `inView:${inView}`),
  useInViewCallback: hookCase(() => useInViewCallback(() => {}), () => 'cb'),
  useInViewMultiple: hookCase(() => useInViewMultiple(), ({ getInView }) => String(getInView('a'))),
  useScroll: hookCase(() => useScroll(), ({ scrollY, scrollYProgress }) => `${scrollY.get()}|${scrollYProgress.get()}`),
  useScrollVelocity: hookCase(() => useScrollVelocity(), (mv) => mv.get()),

  // ---- Gesture state
  useGestureState: hookCase(() => useGestureState(), ({ isHovered }) => String(isHovered)),
  useHover: hookCase(() => useHover(), () => 'hover'),
  useTap: hookCase(() => useTap(), () => 'tap'),
  useFocus: hookCase(() => useFocus(), () => 'focus'),
  useInteractionState: hookCase(() => useInteractionState(), () => 'interaction'),
  useGestureAnimation: hookCase(
    () => useGestureAnimation({ default: { scale: 1 }, hover: { scale: 1.1 } }),
    () => 'gesture-animation'
  ),

  // ---- Accessibility
  useReducedMotion: hookCase(() => useReducedMotion(), (r) => `reduced:${r}`),
  useReducedMotionConfig: hookCase(
    () => useReducedMotionConfig({ default: 'full', reduced: 'reduced' }),
    (c) => c
  ),
  useShouldAnimate: hookCase(() => useShouldAnimate(), (s) => `animate:${s}`),
  useReducedMotionValue: hookCase(() => useReducedMotionValue(0, 100), (v) => v),

  // ---- Scroll-linked
  useScrollProgress: hookCase(() => useScrollProgress(), () => 'progress'),
  useParallax: hookCase(() => useParallax(), () => 'parallax'),
  useScrollTrigger: hookCase(() => useScrollTrigger(), () => 'trigger'),
  useScrollLinkedValue: hookCase(
    () => useScrollLinkedValue(null, { inputRange: [0, 1], outputRange: [0, 100] }),
    (v) => String(v)
  ),

  // ---- Timeline
  useTimeline: hookCase(() => useTimeline(), () => 'timeline'),
  useTimelineState: hookCase(() => useTimelineState(null), (s) => JSON.stringify(s)),

  // ---- SVG morph
  useMorph: hookCase(() => useMorph(PATH_A), ({ path }) => <svg><path d={path} /></svg>),
  useMorphSequence: hookCase(() => useMorphSequence([PATH_A, PATH_B]), ({ path }) => <svg><path d={path} /></svg>),
  useMorphRef: hookCase(() => useMorphRef(PATH_A), ({ pathRef }) => <svg><path ref={pathRef} d={PATH_A} /></svg>),

  // ---- Layout
  useLayoutGroup: hookCase(() => useLayoutGroup(), () => 'layout-group'),
  useLayoutId: hookCase(() => useLayoutId('card'), () => 'layout-id'),
  useFlip: hookCase(() => useFlip(), () => 'flip'),
  useAutoLayout: hookCase(() => useAutoLayout(), () => 'auto-layout'),
  LayoutGroupProvider: () => (
    <LayoutGroupProvider><span>layout-group-child</span></LayoutGroupProvider>
  ),
  SharedLayoutProvider: () => (
    <SharedLayoutProvider><span>shared-layout-child</span></SharedLayoutProvider>
  ),

  // ---- Variants
  useVariants: hookCase(
    () => useVariants({
      variants: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
      initial: 'hidden',
      animate: 'visible',
    }),
    ({ values }) => `opacity:${String(values.opacity)}`
  ),
  useVariantContext: hookCase(() => useVariantContext(), () => 'variant-context'),
  useStaggerChildren: hookCase(() => useStaggerChildren({ count: 3 }), () => 'stagger'),
  VariantProvider: () => (
    <VariantProvider variant="visible"><span>variant-child</span></VariantProvider>
  ),
  createMotionComponent: () => (
    <ul><MotionLi initial="hidden" animate="visible">motion-li</MotionLi></ul>
  ),

  // ---- Physics
  useSpringState: hookCase(() => useSpringState(3), ([value]) => value),
  useMomentum: hookCase(() => useMomentum(), () => 'momentum'),
  useElastic: hookCase(() => useElastic(), () => 'elastic'),
  useBounce: hookCase(() => useBounce(), () => 'bounce'),
  useGravity: hookCase(() => useGravity(), () => 'gravity'),
  useChain: hookCase(() => useChain([{ to: { x: 10 } }], { x: 0 }), () => 'chain'),
  usePointer: hookCase(() => usePointer(), () => 'pointer'),
  useGyroscope: hookCase(() => useGyroscope(), () => 'gyroscope'),

  // ---- Components
  Spring: () => (
    <Spring from={{ opacity: 0 }} to={{ opacity: 1 }}>
      {(v) => <div style={{ opacity: v.opacity }}>spring-child</div>}
    </Spring>
  ),
  Animated: () => <Animated.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>animated</Animated.div>,
  Trail: () => (
    <Trail items={['a', 'b']} keys={(i) => i} from={{ opacity: 0 }} to={{ opacity: 1 }}>
      {(v, item) => <span style={{ opacity: v.opacity }}>{item}</span>}
    </Trail>
  ),
  AnimatePresence: () => (
    <AnimatePresence>
      <Animated.div key="a" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>presence</Animated.div>
    </AnimatePresence>
  ),
  PresenceChild: () => (
    <PresenceChild id="x" isPresent onExitComplete={() => {}}>
      <span>presence-child</span>
    </PresenceChild>
  ),
  MotionConfig: () => (
    <MotionConfig config={{ stiffness: 200 }}>
      <Animated.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>motion-config</Animated.div>
    </MotionConfig>
  ),
  useMotionConfig: hookCase(() => useMotionConfig(), (c) => `reduced:${c.isReducedMotion}`),
  Reorder: () => (
    <Reorder.Group values={['a', 'b']} onReorder={() => {}}>
      <Reorder.Item value="a">item-a</Reorder.Item>
      <Reorder.Item value="b">item-b</Reorder.Item>
    </Reorder.Group>
  ),
  SpringText: () => <SpringText>Hello</SpringText>,
  SpringNumber: () => <SpringNumber value={42} decimals={1} prefix="$" />,
  TypeWriter: () => <TypeWriter>typed text</TypeWriter>,
  SplitText: () => <SplitText render={(el) => <b>{el}</b>}>ab</SplitText>,
  Magnetic: () => <Magnetic><button type="button">magnetic</button></Magnetic>,
  MagneticGroup: () => <MagneticGroup><span>magnetic-group</span></MagneticGroup>,
  MagneticCursor: () => <MagneticCursor><span>cursor</span></MagneticCursor>,
  useMagnetic: hookCase(() => useMagnetic(), () => 'use-magnetic'),
  Parallax: () => <Parallax><span>parallax</span></Parallax>,
  MouseParallax: () => <MouseParallax><span>mouse-parallax</span></MouseParallax>,
  TiltCard: () => <TiltCard glare><span>tilt</span></TiltCard>,
  ParallaxContainer: () => (
    <ParallaxContainer pages={2}>
      <ParallaxLayer offset={1} speed={0.5}><span>layer</span></ParallaxLayer>
    </ParallaxContainer>
  ),
  ParallaxLayer: () => (
    <ParallaxContainer><ParallaxLayer><span>layer-only</span></ParallaxLayer></ParallaxContainer>
  ),
  useParallaxContext: hookCase(() => useParallaxContext(), () => 'parallax-context'),
  LazyMotion: () => (
    <LazyMotion features={domAnimation}><span>lazy</span></LazyMotion>
  ),
  useLazyMotion: hookCase(() => useLazyMotion(), ({ isLoaded }) => `loaded:${isLoaded}`),
  useMotionFeature: hookCase(() => useMotionFeature('animations'), (f) => `feature:${f}`),
  MotionFeatureGuard: () => (
    <LazyMotion features={domMin}>
      <MotionFeatureGuard feature="layout" fallback={<span>no-layout</span>}>
        <span>layout</span>
      </MotionFeatureGuard>
    </LazyMotion>
  ),
  useIsomorphicLayoutEffect: hookCase(() => useIsomorphicLayoutEffect(() => {}, []), () => 'iso'),
}

describe('every React export renders on the server', () => {
  it('has an SSR case for every export', () => {
    const missing = Object.keys(SpringKitReact).filter(
      (name) => !(name in cases) && !NON_RENDERABLE.has(name)
    )
    expect(missing).toEqual([])
  })

  it('non-renderable exports are usable on the server', () => {
    expect(mergeFeatures(domMin, { layout: true })).toEqual({ animations: true, layout: true })
    expect(typeof createAsyncFeatures({ layout: true })).toBe('function')
    expect(domAnimation.animations).toBe(true)
    expect(domMax.layout).toBe(true)
    const mv = createMotionValue(1)
    expect(mv).toBeInstanceOf(MotionValue)
    expect(mv.get()).toBe(1)
    const doubled = transformValue(mv, (v) => v * 2)
    expect(doubled.get()).toBe(2)
    const mapped = mapRange(mv, [0, 2], [0, 100])
    expect(mapped.get()).toBe(50)
    mapped.destroy()
    doubled.destroy()
    mv.destroy()
    for (const ctx of [PresenceContext, LayoutGroupContext, SharedLayoutContextReact, VariantContext]) {
      expect(ctx).toBeDefined()
    }
  })

  for (const [name, render] of Object.entries(cases)) {
    it(`${name} renders without errors`, () => {
      const html = ssr(render())
      expect(html.length).toBeGreaterThan(0)
    })
  }
})

// ============ Markup ============

const ANIMATED_TAGS = Object.keys(Animated) as Array<keyof typeof Animated>

describe('markup', () => {
  it.each(ANIMATED_TAGS)('Animated.%s renders its element with the initial style', (tag) => {
    const Component = Animated[tag] as React.ComponentType<Record<string, unknown>>
    const html = ssr(<Component initial={{ opacity: 0 }} animate={{ opacity: 1 }} />)
    const tagName = String(tag)
    expect(html.startsWith(`<${tagName}`)).toBe(true)
    expect(html).toContain('style="opacity:0"')
  })

  it('Animated uses initial transform values', () => {
    const html = ssr(
      <Animated.div initial={{ x: -20, scale: 0.5 }} animate={{ x: 0, scale: 1 }}>x</Animated.div>
    )
    expect(html).toContain('transform:translateX(-20px) scale(0.5)')
  })

  it('Animated with initial={false} renders the animate state', () => {
    const html = ssr(<Animated.div initial={false} animate={{ opacity: 0.5 }}>x</Animated.div>)
    expect(html).toContain('opacity:0.5')
  })

  it('Animated keeps static styles and string values', () => {
    const html = ssr(
      <Animated.div style={{ color: 'red' }} initial={{ opacity: 0 }} animate={{ opacity: 1, backgroundColor: 'blue' }}>x</Animated.div>
    )
    expect(html).toContain('color:red')
    expect(html).toContain('opacity:0')
  })

  it('Animated with gesture / viewport / drag props renders the resting state', () => {
    const html = ssr(
      <Animated.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        whileFocus={{ opacity: 0.8 }}
        whileInView={{ y: 0 }}
        whileDrag={{ scale: 1.2 }}
        drag
      >
        press
      </Animated.button>
    )
    expect(html).toContain('opacity:0')
    expect(html).toContain('press')
  })

  it('MotionConfig initial={false} skips the initial state', () => {
    const html = ssr(
      <MotionConfig initial={false}>
        <Animated.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>x</Animated.div>
      </MotionConfig>
    )
    expect(html).toContain('opacity:1')
  })

  it('MotionConfig reducedMotion="user" renders the same as no preference', () => {
    const html = ssr(
      <MotionConfig reducedMotion="user">
        <Animated.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>x</Animated.div>
      </MotionConfig>
    )
    expect(html).toContain('opacity:0')
  })

  it('MotionConfig reducedMotion="always" renders the final state', () => {
    const html = ssr(
      <MotionConfig reducedMotion="always">
        <Animated.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>x</Animated.div>
      </MotionConfig>
    )
    expect(html).toContain('opacity:1')
  })

  it.each(['sync', 'wait', 'popLayout'] as const)('AnimatePresence mode="%s" renders its children', (mode) => {
    const html = ssr(
      <AnimatePresence mode={mode}>
        <Animated.div key="a" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>first</Animated.div>
        <Animated.div key="b" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>second</Animated.div>
      </AnimatePresence>
    )
    expect(html).toContain('first')
    expect(html).toContain('second')
    expect(html).toContain('opacity:0')
  })

  it('AnimatePresence initial={false} renders children in their animate state', () => {
    const html = ssr(
      <AnimatePresence initial={false}>
        <Animated.div key="a" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>x</Animated.div>
      </AnimatePresence>
    )
    expect(html).toContain('opacity:1')
  })

  it('AnimatePresence renders nothing for no children', () => {
    expect(ssr(<AnimatePresence>{null}</AnimatePresence>)).toBe('')
  })

  it('SpringText renders its text (hidden, ready to animate)', () => {
    const html = ssr(<SpringText>Hi there</SpringText>)
    for (const char of 'Hithere') expect(html).toContain(`>${char}</span>`)
    expect(html).toContain('opacity:0')
  })

  it('SpringText with animateOnMount={false} renders the final state', () => {
    const html = ssr(<SpringText animateOnMount={false} mode="words">Hi there</SpringText>)
    expect(html).toContain('>Hi</span>')
    expect(html).toContain('>there</span>')
    expect(html).toContain('opacity:1')
  })

  it('SpringNumber renders the formatted value', () => {
    expect(ssr(<SpringNumber value={42} decimals={1} prefix="$" suffix="!" />)).toContain('$<!-- -->42.0<!-- -->!')
  })

  it('SplitText renders every element', () => {
    const html = ssr(<SplitText mode="words" render={(el, i) => <i data-i={i}>{el}</i>}>a b</SplitText>)
    expect(html).toContain('<i data-i="0">a</i>')
    expect(html).toContain('<i data-i="2">b</i>')
  })

  it('Spring renders its `from` values', () => {
    const html = ssr(
      <Spring from={{ opacity: 0 }} to={{ opacity: 1 }}>
        {(v) => <div style={{ opacity: v.opacity }} />}
      </Spring>
    )
    expect(html).toBe('<div style="opacity:0"></div>')
  })

  it('Trail renders every item at its `from` values', () => {
    const html = ssr(
      <Trail items={['a', 'b', 'c']} keys={(i) => i} from={{ opacity: 0 }} to={{ opacity: 1 }}>
        {(v, item) => <span style={{ opacity: v.opacity }}>{item}</span>}
      </Trail>
    )
    expect(html).toBe('<span style="opacity:0">a</span><span style="opacity:0">b</span><span style="opacity:0">c</span>')
  })

  it('Reorder renders the group and items with the requested tags', () => {
    const html = ssr(
      <Reorder.Group as="ol" values={[1, 2]} onReorder={() => {}}>
        <Reorder.Item as="li" value={1}>one</Reorder.Item>
        <Reorder.Item as="li" value={2}>two</Reorder.Item>
      </Reorder.Group>
    )
    expect(html.startsWith('<ol')).toBe(true)
    expect(html).toContain('one')
    expect(html).toContain('two')
    expect(html.match(/<li/g)?.length).toBe(2)
  })

  it('LazyMotion with sync features renders its children', () => {
    expect(ssr(<LazyMotion features={domMax}><span>child</span></LazyMotion>)).toBe('<span>child</span>')
  })

  it('LazyMotion with async features still renders its children on the server', () => {
    const html = ssr(
      <LazyMotion features={() => Promise.resolve(domMax)}>
        <span>content</span>
        <MotionFeatureGuard feature="layout" fallback={<span>fallback</span>}>
          <span>layout</span>
        </MotionFeatureGuard>
      </LazyMotion>
    )
    expect(html).toContain('<span>content</span>')
    expect(html).toContain('<span>fallback</span>')
    expect(html).not.toContain('<span>layout</span>')
  })

  it('Magnetic / Parallax / TiltCard render their children at rest', () => {
    expect(ssr(<Magnetic><span>m</span></Magnetic>)).toContain('<span>m</span>')
    expect(ssr(<Parallax><span>p</span></Parallax>)).toContain('translateY(0px)')
    expect(ssr(<MouseParallax><span>mp</span></MouseParallax>)).toContain('translate(0px, 0px)')
    expect(ssr(<TiltCard><span>t</span></TiltCard>)).toContain('rotateX(0deg) rotateY(0deg) scale(1)')
  })

  it('createMotionComponent renders the initial variant', () => {
    const html = ssr(<ul><MotionLi initial="hidden" animate="visible">item</MotionLi></ul>)
    expect(html).toContain('<li')
    expect(html).toContain('opacity:0')
  })

  it('hooks with viewport / preference state default to the client-safe value', () => {
    expect(ssr(cases.useInView!())).toContain('inView:false')
    expect(ssr(cases.useReducedMotion!())).toContain('reduced:false')
    expect(ssr(cases.useShouldAnimate!())).toContain('animate:true')
    expect(ssr(cases.useMotionConfig!())).toContain('reduced:false')
  })

  it('rendering many times on the server does not schedule work', () => {
    const timeoutSpy = vi.spyOn(globalThis, 'setTimeout')
    const intervalSpy = vi.spyOn(globalThis, 'setInterval')
    try {
      for (const render of Object.values(cases)) renderToString(render())
      expect(intervalSpy).not.toHaveBeenCalled()
      expect(timeoutSpy).not.toHaveBeenCalled()
      // No animation was registered with the (requestAnimationFrame-driven) loop
      expect(globalLoop.getAliveCount()).toBe(0)
    } finally {
      timeoutSpy.mockRestore()
      intervalSpy.mockRestore()
    }
  })
})
