import { Routes, Route, Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { DocLayout, DocSection, CodeBlock } from '@/components/docs'
import { Clock, Shapes, MoveVertical, Layers, Grid3X3, Wand2, Sparkles, Cpu, FlaskConical, Gauge } from 'lucide-react'
import { TimeScaleDoc } from './TimeScale'

export function AdvancedFeatures() {
  return (
    <Routes>
      <Route path="/" element={<AdvancedIndex />} />
      <Route path="/native-springs" element={<NativeSpringsDoc />} />
      <Route path="/testing" element={<TestingDoc />} />
      <Route path="/time-scale" element={<TimeScaleDoc />} />
      <Route path="/variants" element={<VariantsDoc />} />
      <Route path="/timeline" element={<TimelineDoc />} />
      <Route path="/morph" element={<MorphDoc />} />
      <Route path="/scroll-linked" element={<ScrollLinkedDoc />} />
      <Route path="/flip" element={<FlipDoc />} />
      <Route path="/stagger-patterns" element={<StaggerPatternsDoc />} />
    </Routes>
  )
}

function AdvancedIndex() {
  const topics = [
    {
      title: 'Native Springs',
      href: '/docs/advanced/native-springs',
      desc: 'Spring physics compiled to CSS linear(), run on the compositor, exactly seekable.',
      icon: Cpu,
    },
    {
      title: 'Testing Animations',
      href: '/docs/advanced/testing',
      desc: 'A virtual clock that makes animation tests deterministic and instant.',
      icon: FlaskConical,
    },
    {
      title: 'Slow Motion',
      href: '/docs/advanced/time-scale',
      desc: 'globalLoop.setTimeScale(): slow down or freeze every animation while debugging.',
      icon: Gauge,
    },
    {
      title: 'Variants System',
      href: '/docs/advanced/variants',
      desc: 'Declarative animation states with cascading and orchestration.',
      icon: Sparkles,
    },
    {
      title: 'Timeline API',
      href: '/docs/advanced/timeline',
      desc: 'GSAP-style timeline for complex animation sequences.',
      icon: Clock,
    },
    {
      title: 'SVG Morphing',
      href: '/docs/advanced/morph',
      desc: 'Smooth shape-to-shape transitions with spring physics.',
      icon: Shapes,
    },
    {
      title: 'Scroll-Linked',
      href: '/docs/advanced/scroll-linked',
      desc: 'Animations driven by scroll position and progress.',
      icon: MoveVertical,
    },
    {
      title: 'FLIP Layout',
      href: '/docs/advanced/flip',
      desc: 'First-Last-Invert-Play for smooth layout transitions.',
      icon: Layers,
    },
    {
      title: 'Stagger Patterns',
      href: '/docs/advanced/stagger-patterns',
      desc: 'Advanced timing patterns for grid and list animations.',
      icon: Grid3X3,
    },
  ]

  return (
    <DocLayout
      title="Advanced Features"
      description="Powerful animation capabilities for complex interactions"
      icon={Wand2}
    >
      <div className="grid md:grid-cols-2 gap-6">
        {topics.map((topic) => (
          <Link key={topic.href} to={topic.href}>
            <Card className="h-full group cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                    <topic.icon className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-white group-hover:text-orange-300 transition-colors">
                      {topic.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">{topic.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </DocLayout>
  )
}

function NativeSpringsDoc() {
  return (
    <DocLayout
      title="Native Springs"
      description="Spring physics compiled to CSS and played by the browser"
      icon={Cpu}
    >
      <DocSection title="Overview">
        <p className="text-muted-foreground mb-4">
          <code>springEasing()</code> solves the spring equation exactly and compiles the curve to a
          CSS <code>linear()</code> easing. CSS transitions and the Web Animations API can then play
          real spring motion without running JavaScript on every frame. For <code>transform</code>,{' '}
          <code>opacity</code> and <code>filter</code>, browsers run these animations on the
          compositor thread, so they stay smooth while the main thread is busy rendering or parsing.
        </p>
        <p className="text-muted-foreground">
          Use native springs for enter/exit and other fire-and-forget motion. Use{' '}
          <code>spring()</code> / <code>createSpringValue()</code> when you need per-frame values,
          for example to follow a gesture or interpolate non-CSS values.
        </p>
      </DocSection>

      <DocSection title="Perceptual springs: defineSpring()">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { defineSpring } from '@oxog/springkit'

// Same model as SwiftUI / Jetpack Compose
const snappy = defineSpring({ duration: 300 })               // bounce 0: no overshoot
const playful = defineSpring({ duration: 500, bounce: 0.35 }) // visible bounce
const heavy = defineSpring({ duration: 700, bounce: -0.3 })   // overdamped

// Returns a regular SpringConfig, usable everywhere
spring(0, 100, { ...playful, onUpdate })`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="animateNative()">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { animateNative, defineSpring } from '@oxog/springkit'

const controls = animateNative(
  element,
  { transform: ['translateY(24px) scale(0.96)', 'none'], opacity: [0, 1] },
  { ...defineSpring({ duration: 450, bounce: 0.2 }), delay: 50 }
)

await controls.finished // resolves on finish or cancel
controls.pause(); controls.play(); controls.reverse()
controls.seek(120)      // jump to 120ms`} />
            <ul className="list-disc pl-5 mt-4 space-y-1 text-muted-foreground text-sm">
              <li>Respects <code>prefers-reduced-motion</code> by default (<code>respectReducedMotion: false</code> to opt out).</li>
              <li>On finish, the end state is committed to inline style and the animation is released (<code>persist: false</code> to opt out).</li>
              <li>Falls back to a no-overshoot ease-out where <code>linear()</code> is unsupported, and applies the end state directly when WAAPI is unavailable.</li>
            </ul>
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="CSS transitions">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { springEasing, springTransition } from '@oxog/springkit'

const { easing, duration } = springEasing({ stiffness: 300, damping: 22 })
// easing: "linear(0, 0.0123 2.1%, ... , 1)", duration: ms

el.style.transition = springTransition(['transform', 'opacity'], { stiffness: 300, damping: 22 })

// React: no hooks needed
<div style={{
  transform: open ? 'none' : 'translateX(-100%)',
  transition: springTransition('transform', defineSpring({ bounce: 0.2 })),
}} />`} />
            <p className="text-muted-foreground text-sm mt-4">
              Results are cached per configuration, and <code>precision</code> (default 0.002) trades
              accuracy against string length.
            </p>
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Seekable springs: solveSpring()">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { solveSpring } from '@oxog/springkit'

const s = solveSpring({ stiffness: 260, damping: 18, velocity: 0 }, 0, 300)
s.duration          // ms until rest
s.at(120)           // { value, velocity } at 120ms — exact, frame-rate independent

// Scrub a spring with a slider
slider.oninput = () => render(s.at(slider.valueAsNumber * s.duration).value)`} />
          </CardContent>
        </Card>
      </DocSection>
    </DocLayout>
  )
}

function TestingDoc() {
  return (
    <DocLayout
      title="Testing Animations"
      description="Deterministic, instant animation tests with a virtual clock"
      icon={FlaskConical}
    >
      <DocSection title="Overview">
        <p className="text-muted-foreground mb-4">
          <code>@oxog/springkit/testing</code> provides <code>installTestClock()</code>. It replaces{' '}
          <code>requestAnimationFrame</code>, <code>cancelAnimationFrame</code> and{' '}
          <code>performance.now</code> (and optionally the timer functions) with a virtual timeline
          that only moves when you advance it. Every SpringKit API, your own code and React hooks then
          run frame-perfect and instantly, at whatever refresh rate you choose.
        </p>
        <p className="text-muted-foreground mb-4">
          Animation delays (<code>animate()</code> / <code>stagger()</code> / trail / timeline repeat
          delays, React variant staggers, <code>useSprings</code> and <code>useAnimate</code> delays) run
          on the animation clock through <code>delay()</code>, not <code>setTimeout</code>. Tests that
          fake only timers (<code>vi.useFakeTimers()</code>) won't fire them; use the test clock.
        </p>
      </DocSection>

      <DocSection title="Basic Usage">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { installTestClock } from '@oxog/springkit/testing'
import { spring } from '@oxog/springkit'

let clock
beforeEach(() => { clock = installTestClock() })
afterEach(() => clock.uninstall())

test('settles at the target', () => {
  const anim = spring(0, 100, { stiffness: 300, damping: 30 })
  anim.start()

  clock.advance(100)                  // exactly 6 frames at 60fps
  expect(anim.getValue()).toBeLessThan(100)

  const ms = clock.runAll()           // run until every animation is at rest
  expect(anim.getValue()).toBe(100)
  expect(ms).toBeLessThan(600)
})`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="React">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { act, render } from '@testing-library/react'

const clock = installTestClock({ timers: true })   // also virtualize setTimeout
render(<Toast />)
act(() => clock.runAll())
expect(screen.getByRole('status')).toHaveStyle({ opacity: '1' })
clock.uninstall()`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="API">
        <div className="grid gap-3">
          {[
            { option: 'installTestClock({ frameRate, timers, startTime })', desc: 'Install the virtual clock. frameRate defaults to 60; timers: true also virtualizes setTimeout/setInterval.' },
            { option: 'clock.advance(ms)', desc: 'Move time forward, running every frame and timer that falls due, in order.' },
            { option: 'clock.nextFrame()', desc: 'Run exactly one animation frame.' },
            { option: 'clock.runAll(limitMs?)', desc: 'Run until nothing is pending; throws if animations never settle (e.g. zero damping).' },
            { option: 'clock.now()', desc: 'Current virtual time.' },
            { option: 'clock.uninstall()', desc: 'Restore the real clock. Pending frames and timeouts are handed over, not dropped.' },
          ].map((item) => (
            <div key={item.option} className="flex flex-col sm:flex-row sm:items-start gap-2 p-3 rounded-lg bg-white/5">
              <code className="text-orange-300 text-sm shrink-0">{item.option}</code>
              <span className="text-muted-foreground text-sm">{item.desc}</span>
            </div>
          ))}
        </div>
      </DocSection>
    </DocLayout>
  )
}

function VariantsDoc() {
  return (
    <DocLayout
      title="Variants System"
      description="Declarative animation states with cascading and orchestration"
      icon={Sparkles}
    >
      <DocSection title="Overview">
        <p className="text-muted-foreground mb-4">
          The Variants System provides a powerful, declarative way to define animation states
          and orchestrate animations across component hierarchies. Inspired by Framer Motion's
          variants but with SpringKit's physics-first approach.
        </p>
      </DocSection>

      <DocSection title="Basic Usage">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { useVariants } from '@oxog/springkit/react'

const variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { spring: { stiffness: 300, damping: 20 } }
  },
  exit: { opacity: 0, y: -10 }
}

function MyComponent() {
  const { values, setVariant, currentVariant } = useVariants({
    variants,
    animate: 'visible',
    initial: 'hidden',
  })

  return (
    <div style={{
      opacity: values.opacity,
      transform: \`translateY(\${values.y}px)\`
    }}>
      Content
    </div>
  )
}`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Variant Provider & Context">
        <p className="text-muted-foreground mb-4">
          Use VariantProvider to cascade variants to children:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { VariantProvider, useVariantContext } from '@oxog/springkit/react'

function Parent() {
  const [variant, setVariant] = useState('hidden')

  return (
    <VariantProvider variant={variant}>
      <button onClick={() => setVariant('visible')}>
        Animate
      </button>
      <ChildComponent />
      <ChildComponent />
    </VariantProvider>
  )
}

function ChildComponent() {
  const context = useVariantContext()
  const { values } = useVariants({
    variants: {
      hidden: { opacity: 0, scale: 0.9 },
      visible: { opacity: 1, scale: 1 },
    },
    inherit: true, // Inherits variant from parent
  })

  return <div style={{ opacity: values.opacity }} />
}`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Stagger Children">
        <p className="text-muted-foreground mb-4">
          Create staggered animations for lists:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { useStaggerChildren, useVariants } from '@oxog/springkit/react'

function List({ items }) {
  const { getDelay, delays } = useStaggerChildren({
    count: items.length,
    staggerChildren: 100, // 100ms between each
    delayChildren: 50,    // Initial delay
    staggerDirection: 1,  // 1 or -1 for reverse
  })

  return (
    <div>
      {items.map((item, i) => (
        <ListItem key={item.id} delay={getDelay(i)} />
      ))}
    </div>
  )
}

function ListItem({ delay }) {
  const { values } = useVariants({
    variants: {
      hidden: { opacity: 0, x: -20 },
      visible: {
        opacity: 1,
        x: 0,
        transition: { delay }
      },
    },
    animate: 'visible',
    initial: 'hidden',
  })

  // ...
}`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Variant Presets">
        <p className="text-muted-foreground mb-4">
          SpringKit includes common animation presets:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { variantPresets } from '@oxog/springkit'

// Available presets:
// fadeIn, fadeInUp, fadeInDown, fadeInLeft, fadeInRight
// scaleIn, popIn
// slideUp, slideDown, slideLeft, slideRight
// staggerContainer, staggerItem

const { values } = useVariants({
  variants: variantPresets.fadeInUp,
  animate: 'animate',
  initial: 'initial',
})`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Transition Options">
        <div className="grid gap-3">
          {[
            { option: 'spring', desc: 'Spring configuration { stiffness, damping, mass }' },
            { option: 'delay', desc: 'Delay before animation starts (ms)' },
            { option: 'staggerChildren', desc: 'Delay between child animations (ms); applies to children whose context provides staggerIndex' },
            { option: 'delayChildren', desc: 'Initial delay before first child (ms)' },
            { option: 'when', desc: '"beforeChildren" | "afterChildren" | false. createOrchestration() supports both; in React, a VariantProvider transition supports "beforeChildren" (children wait for delay + the settle time of spring) and treats "afterChildren" like false' },
            { option: 'staggerDirection', desc: '1 for normal, -1 for reverse order' },
          ].map((item) => (
            <div key={item.option} className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10">
              <code className="text-orange-300 font-mono text-sm">{item.option}</code>
              <span className="text-muted-foreground text-sm">{item.desc}</span>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="Dynamic Variants">
        <p className="text-muted-foreground mb-4">
          Use custom data to create dynamic variants:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`const variants = {
  hidden: { opacity: 0 },
  visible: (custom) => ({
    opacity: 1,
    y: custom.offset,
    transition: {
      delay: custom.index * 100,
    },
  }),
}

function Item({ index }) {
  const { values } = useVariants({
    variants,
    animate: 'visible',
    initial: 'hidden',
    custom: { index, offset: 20 * index },
  })
}`} />
          </CardContent>
        </Card>
      </DocSection>
    </DocLayout>
  )
}

function TimelineDoc() {
  return (
    <DocLayout
      title="Timeline API"
      description="GSAP-style timeline for complex animation sequences"
      icon={Clock}
    >
      <DocSection title="Overview">
        <p className="text-muted-foreground mb-4">
          The Timeline API provides a powerful way to orchestrate complex animation sequences
          with precise timing control. Similar to GSAP's timeline, it supports chaining,
          labels, and relative positioning. Like GSAP, timeline times (positions,{' '}
          <code>duration</code>, <code>delay</code>, <code>seek()</code>) are in seconds; each
          segment lasts 0.5s unless you pass a <code>duration</code>.
        </p>
      </DocSection>

      <DocSection title="Basic Usage">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { createTimeline } from '@oxog/springkit'

const tl = createTimeline({
  defaults: { stiffness: 200, damping: 20 },  // spring shape of every segment
  onUpdate: (progress) => console.log(\`Progress: \${progress}\`),
  onComplete: () => console.log('Done!'),
})

// Chain animations (each segment lasts 0.5s by default)
tl.to(element1, { x: 100, opacity: 1 })
  .to(element2, { x: 100, opacity: 1, duration: 0.8 })
  .to(element3, { scale: 1.2 })

// Start the timeline
tl.play()`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Relative Positioning">
        <p className="text-muted-foreground mb-4">
          Control when animations start relative to each other:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`// Overlap with previous animation
tl.to(element1, { x: 100 })
  .to(element2, { x: 100 }, '-=0.3') // Start 0.3s before previous ends

// Delay after previous animation
tl.to(element3, { x: 100 }, '+=0.5') // Start 0.5s after previous ends

// Start together with the previous animation
tl.to(element4, { y: 50 }, '<')

// Start at an absolute time
tl.to(element5, { x: 100 }, 2) // Start at 2s`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Labels">
        <p className="text-muted-foreground mb-4">
          Use labels to create named positions in your timeline:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`tl.addLabel('start')
  .to(element1, { x: 100 })
  .addLabel('middle')
  .to(element2, { y: 100 })
  .to(element3, { opacity: 1 }, 'start') // Jump back to start label
  .to(element4, { scale: 1.5 }, 'middle') // Insert at middle label`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Control Methods">
        <div className="grid gap-3">
          {[
            { method: 'play()', desc: 'Start or resume the timeline' },
            { method: 'pause()', desc: 'Pause the timeline' },
            { method: 'resume()', desc: 'Resume from paused state' },
            { method: 'reverse()', desc: 'Play the timeline in reverse' },
            { method: 'restart()', desc: 'Restart from the beginning' },
            { method: 'seek(time | label)', desc: 'Jump to a time in seconds or to a label' },
            { method: 'seekProgress(progress)', desc: 'Jump to a progress (0-1) — useTimeline() hook only' },
            { method: 'kill()', desc: 'Stop and destroy the timeline' },
          ].map((item) => (
            <div key={item.method} className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10">
              <code className="text-orange-300 font-mono text-sm">{item.method}</code>
              <span className="text-muted-foreground text-sm">{item.desc}</span>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="React Hook">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { useTimeline } from '@oxog/springkit/react'

function AnimatedSequence() {
  const box1 = useRef<HTMLDivElement>(null)
  const box2 = useRef<HTMLDivElement>(null)

  // Timelines don't autoplay unless you pass { autoplay: true }
  const { timeline, play, pause, reverse, seekProgress } = useTimeline({
    onComplete: () => console.log('Done!'),
  })

  useEffect(() => {
    if (timeline && box1.current && box2.current) {
      timeline
        .to(box1.current, { x: 100, opacity: 1 })
        .to(box2.current, { x: 100, opacity: 1 }, '-=0.2')
    }
  }, [timeline])

  return (
    <>
      <button onClick={play}>Play</button>
      <button onClick={pause}>Pause</button>
      <button onClick={reverse}>Reverse</button>
      <input type="range" min={0} max={1} step={0.01}
        onChange={(e) => seekProgress(e.target.valueAsNumber)} />
      <div ref={box1}>Box 1</div>
      <div ref={box2}>Box 2</div>
    </>
  )
}`} />
          </CardContent>
        </Card>
      </DocSection>
    </DocLayout>
  )
}

function MorphDoc() {
  return (
    <DocLayout
      title="SVG Morphing"
      description="Smooth shape-to-shape transitions with spring physics"
      icon={Shapes}
    >
      <DocSection title="Overview">
        <p className="text-muted-foreground mb-4">
          SVG Morphing allows you to animate between different SVG paths with smooth
          spring-based transitions. Perfect for icons, illustrations, and creative animations.
        </p>
      </DocSection>

      <DocSection title="Basic Usage">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { createMorph, shapes } from '@oxog/springkit'

const pathElement = document.querySelector('path')

// createMorph takes the starting path string
const morph = createMorph(shapes.circle(50, 50, 40), {
  spring: { stiffness: 150, damping: 15 },
  onComplete: () => console.log('Morph complete'),
})

// Render every intermediate path
morph.subscribe((d) => pathElement.setAttribute('d', d))

// Morph to a new shape
morph.morphTo(shapes.star(50, 50, 40, 20, 5))`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Built-in Shapes">
        <p className="text-muted-foreground mb-4">
          SpringKit provides helper functions for common shapes:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { shapes } from '@oxog/springkit'

// Circle
const circle = shapes.circle(cx, cy, radius)

// Rectangle with optional rounded corners
const rect = shapes.rect(x, y, width, height, borderRadius?)

// Star with inner and outer radius
const star = shapes.star(cx, cy, outerRadius, innerRadius, points)

// Heart shape
const heart = shapes.heart(cx, cy, size)

// Polygon
const polygon = shapes.polygon(cx, cy, radius, sides)

// Arrow
const arrow = shapes.arrow(x, y, width, height, 'right') // 'up' | 'down' | 'left' | 'right'`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Morph Sequence">
        <p className="text-muted-foreground mb-4">
          Animate through multiple shapes in sequence:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { createMorphSequence, shapes } from '@oxog/springkit'

const sequence = createMorphSequence([
  shapes.circle(50, 50, 40),
  shapes.star(50, 50, 45, 20, 5),
  shapes.heart(50, 50, 40),
], {
  spring: { stiffness: 120, damping: 12 },
})

sequence.subscribe((d) => pathElement.setAttribute('d', d))

sequence.morphToNext()      // wraps around after the last shape
sequence.morphToPrevious()
sequence.morphToIndex(2)    // jump to the heart`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="React Hook">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { useMorph, shapes } from '@oxog/springkit/react'

const circle = shapes.circle(50, 50, 40)
const star = shapes.star(50, 50, 45, 20, 5)

function MorphingShape() {
  const { path, progress, morphTo } = useMorph(circle, {
    spring: { stiffness: 150, damping: 15 },
  })

  return (
    <svg viewBox="0 0 100 100" onClick={() => morphTo(star)}>
      <path d={path} fill="currentColor" />
    </svg>
  )
}

// Also available: useMorphSequence(paths, options) and
// useMorphRef(initialPath, options) -> { pathRef, morphTo, ... }`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Options">
        <div className="grid gap-3">
          {[
            { option: 'spring', desc: 'Spring configuration (default { stiffness: 120, damping: 14 })' },
            { option: 'samples', desc: 'Points used to normalize the paths (default 100, higher = smoother)' },
            { option: 'onProgress', desc: 'Called with the morph progress (0-1)' },
            { option: 'onComplete', desc: 'Called when morph animation completes' },
          ].map((item) => (
            <div key={item.option} className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10">
              <code className="text-orange-300 font-mono text-sm">{item.option}</code>
              <span className="text-muted-foreground text-sm">{item.desc}</span>
            </div>
          ))}
        </div>
      </DocSection>
    </DocLayout>
  )
}

function ScrollLinkedDoc() {
  return (
    <DocLayout
      title="Scroll-Linked Animations"
      description="Animations driven by scroll position and progress"
      icon={MoveVertical}
    >
      <DocSection title="Overview">
        <p className="text-muted-foreground mb-4">
          Scroll-linked animations allow you to tie animation progress directly to scroll
          position. Create parallax effects, progress indicators, and scroll-triggered animations.
        </p>
      </DocSection>

      <DocSection title="Scroll Progress">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { createScrollProgress } from '@oxog/springkit'

// Progress of an element through the viewport (omit it for the whole page)
const scrollProgress = createScrollProgress(sectionElement)

const unsubscribe = scrollProgress.subscribe((info) => {
  // info.progress is 0-1; also scrollY, velocity, direction, isInView
  element.style.opacity = String(info.progress)
  element.style.transform = \`translateX(\${info.progress * 100}px)\`
})

scrollProgress.get() // current progress

// Clean up
unsubscribe()
scrollProgress.destroy()`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Parallax Effects">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { createParallax } from '@oxog/springkit'

const parallax = createParallax(element, {
  speed: 0.5, // Move at half scroll speed (negative = opposite direction)
  direction: 'vertical', // or 'horizontal'
})

parallax.getOffset() // current offset in pixels

// Clean up when done
parallax.destroy()`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Scroll Triggers">
        <p className="text-muted-foreground mb-4">
          Trigger animations when elements enter or leave the viewport:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { createScrollTrigger } from '@oxog/springkit'

const trigger = createScrollTrigger(element, {
  start: 'bottom', // 'top' | 'center' | 'bottom' | pixels
  end: 'top',
  startOffset: -100, // pixel offsets from start / end
  once: false,
  onEnter: (info) => console.log('Element entered'),
  onLeave: (info) => console.log('Element left'),
  onProgress: (info) => {
    // Animate based on info.progress (0-1) through the trigger zone
    element.style.opacity = String(info.progress)
  },
})

trigger.isActive()
trigger.destroy()`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Scroll-Linked Values">
        <p className="text-muted-foreground mb-4">
          Map scroll position to animated values with interpolation:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { createScrollLinkedValue } from '@oxog/springkit'

import { createScrollProgress, createScrollLinkedValue } from '@oxog/springkit'

const progress = createScrollProgress() // page scroll

const scrollValue = createScrollLinkedValue(progress, {
  inputRange: [0, 0.5, 1], // Scroll progress points
  outputRange: [0, 100, 50], // Corresponding values (colors work too)
  smooth: 0.2, // optional spring smoothing
})

scrollValue.subscribe((value) => {
  element.style.transform = \`translateX(\${value}px)\`
})`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="React Hooks">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import {
  useScrollProgress,
  useParallax,
  useScrollTrigger,
} from '@oxog/springkit/react'

function ScrollAnimation() {
  const containerRef = useRef<HTMLDivElement>(null)

  // Track scroll progress of an element (omit target for the page)
  const { progress } = useScrollProgress({ target: containerRef })

  // Create parallax effect
  const { ref: parallaxRef } = useParallax({ speed: 0.5 })

  // Trigger on scroll
  const { ref: triggerRef, isActive, hasEntered, progress: triggerProgress } =
    useScrollTrigger({ start: 'bottom', end: 'center' })

  return (
    <div ref={containerRef}>
      <p>{Math.round(progress * 100)}%</p>
      <div ref={parallaxRef}>Parallax content</div>
      <div ref={triggerRef} style={{ opacity: triggerProgress }}>
        {hasEntered ? 'Visible!' : 'Not visible yet'}
      </div>
    </div>
  )
}`} />
          </CardContent>
        </Card>
      </DocSection>
    </DocLayout>
  )
}

function FlipDoc() {
  return (
    <DocLayout
      title="FLIP Layout Animations"
      description="First-Last-Invert-Play for smooth layout transitions"
      icon={Layers}
    >
      <DocSection title="Overview">
        <p className="text-muted-foreground mb-4">
          FLIP (First, Last, Invert, Play) is a technique for creating smooth animations
          when elements change position in the DOM. SpringKit makes FLIP animations easy
          with spring physics.
        </p>
      </DocSection>

      <DocSection title="Basic FLIP">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { flip } from '@oxog/springkit'

const element = document.querySelector('.card')

// Animate from current position to new position
await flip(element, () => {
  // This function makes the DOM change
  element.classList.toggle('expanded')
}, {
  config: { stiffness: 300, damping: 25 },
})`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Layout Groups">
        <p className="text-muted-foreground mb-4">
          Animate multiple elements that share layout IDs:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { createLayoutGroup } from '@oxog/springkit'

const group = createLayoutGroup({
  spring: { stiffness: 200, damping: 20 },
})

// Register elements with layout IDs
group.register('card-1', element1)
group.register('card-2', element2)

// Trigger layout update after DOM changes
function handleReorder() {
  // Reorder items in the DOM...
  group.update() // Animates all registered elements
}

// Clean up
group.destroy()`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Shared Layout">
        <p className="text-muted-foreground mb-4">
          Create hero animations between different views:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { createSharedLayoutContext } from '@oxog/springkit'

const sharedLayout = createSharedLayoutContext()
const heroGroup = sharedLayout.createGroup('hero')

// In list view
heroGroup.register('hero-image', listImageElement)

// When transitioning to detail view: the last position of the
// unregistered element is remembered...
heroGroup.unregister('hero-image', listImageElement)
heroGroup.register('hero-image', detailImageElement)

// ...and the new element animates from it
heroGroup.update()

// Update every group after a route change
sharedLayout.updateAll()`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Auto Layout">
        <p className="text-muted-foreground mb-4">
          Automatically animate children when container changes:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { createAutoLayout } from '@oxog/springkit'

// <div data-layout-id="card-1">...</div>
const autoLayout = createAutoLayout({
  spring: { stiffness: 150, damping: 15 },
  root: listElement,            // default: document.body
  attribute: 'data-layout-id',  // default
})

// Elements with data-layout-id animate when the DOM changes
// (a MutationObserver watches the root)

autoLayout.destroy()`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="React Hooks">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import {
  useFlip,
  useLayoutGroup,
  LayoutGroupProvider,
} from '@oxog/springkit/react'

function ExpandableCard({ isExpanded }) {
  const { ref, flip: flipAnim } = useFlip({ config: { stiffness: 300, damping: 25 } })

  useEffect(() => {
    flipAnim()
  }, [isExpanded, flipAnim])

  return (
    <div
      ref={ref}
      className={isExpanded ? 'expanded' : 'collapsed'}
    >
      Content
    </div>
  )
}

// For shared layouts across multiple components
function App() {
  return (
    <LayoutGroupProvider>
      <ListView />
      <DetailView />
    </LayoutGroupProvider>
  )
}`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Options">
        <div className="grid gap-3">
          {[
            { option: 'spring', desc: 'Layout groups / auto layout: spring configuration' },
            { option: 'onAnimationStart', desc: 'Layout groups: called with the layout id when an element starts animating' },
            { option: 'onAnimationComplete', desc: 'Layout groups: called with the layout id when it settles' },
            { option: 'crossfade', desc: 'Layout groups: crossfade elements sharing an id' },
            { option: 'config', desc: 'flip() / useFlip(): spring configuration' },
            { option: 'position / size', desc: 'flip() / useFlip(): animate position and/or size (default both)' },
            { option: 'onUpdate / onComplete', desc: 'flip() / useFlip(): progress callback and completion' },
          ].map((item) => (
            <div key={item.option} className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10">
              <code className="text-orange-300 font-mono text-sm">{item.option}</code>
              <span className="text-muted-foreground text-sm">{item.desc}</span>
            </div>
          ))}
        </div>
      </DocSection>
    </DocLayout>
  )
}

function StaggerPatternsDoc() {
  return (
    <DocLayout
      title="Stagger Patterns"
      description="Advanced timing patterns for grid and list animations"
      icon={Grid3X3}
    >
      <DocSection title="Overview">
        <p className="text-muted-foreground mb-4">
          Stagger patterns provide sophisticated timing functions for animating multiple
          elements. Go beyond simple linear delays with patterns like center-out, wave,
          spiral, and random. Every pattern takes a config object with the item{' '}
          <code>count</code> and a base <code>delay</code> per step, and returns one delay per item
          in the same unit as <code>delay</code>. Use milliseconds, like every other SpringKit delay
          option; the default step and the presets are in milliseconds (e.g. <code>100</code>).
        </p>
      </DocSection>

      <DocSection title="Linear Stagger">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { linearStagger, applyStagger } from '@oxog/springkit'

const items = document.querySelectorAll('.item')

// Get delay array for linear pattern: [0, 50, 100, ...]
const delays = linearStagger({ count: items.length, delay: 50 })

// Apply delays to animations
items.forEach((item, i) => {
  setTimeout(() => {
    spring(0, 1, { onUpdate: v => item.style.opacity = String(v) }).start()
  }, delays[i])
})

// Or add them to the delay of existing option objects
const options = applyStagger(Array.from(items, () => ({ delay: 100 })), delays)
// [{ delay: 100 }, { delay: 150 }, { delay: 200 }, ...]`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Center Stagger">
        <p className="text-muted-foreground mb-4">
          Items animate outward from the center:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { centerStagger, edgeStagger } from '@oxog/springkit'

// Center items animate first, edges last
const delays = centerStagger({ count: items.length, delay: 50 })

// Edges first, center last
const edgeDelays = edgeStagger({ count: items.length, delay: 50 })`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Wave Stagger">
        <p className="text-muted-foreground mb-4">
          Creates a wave-like animation pattern:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { waveStagger } from '@oxog/springkit'

const delays = waveStagger({
  count: items.length,
  delay: 50,
  direction: 'horizontal', // 'horizontal' | 'vertical' | 'diagonal'
  frequency: 2, // Number of wave cycles
  amplitude: 0.5, // Wave intensity (default 0.5)
})`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Grid Stagger">
        <p className="text-muted-foreground mb-4">
          Animate items based on grid position (diagonal pattern):
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { gridStagger } from '@oxog/springkit'

const delays = gridStagger({
  count: 16, // 16 items in a 4x4 grid
  columns: 4,
  delay: 50,
  origin: 'top-left', // 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  direction: 'radial', // 'row' | 'column' | 'diagonal' (default) | 'radial'
})`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Spiral Stagger">
        <p className="text-muted-foreground mb-4">
          Animate items in a spiral pattern from center:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { spiralStagger } from '@oxog/springkit'

const delays = spiralStagger({
  count: items.length,
  columns: 4, // Grid columns for calculating spiral
  delay: 30,
  direction: 'clockwise', // or 'counter-clockwise'
  startFrom: 'edge', // or 'center'
})`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Random Stagger">
        <p className="text-muted-foreground mb-4">
          Randomized delays for organic-feeling animations:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { randomStagger } from '@oxog/springkit'

// Each delay is random in [minMultiplier, maxMultiplier] * delay * (count - 1)
const delays = randomStagger({
  count: items.length,
  delay: 50,
  minMultiplier: 0,
  maxMultiplier: 1,
  seed: 42, // Optional seed for reproducible randomness
})`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Custom Stagger">
        <p className="text-muted-foreground mb-4">
          Create your own stagger pattern with a custom function:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { customStagger } from '@oxog/springkit'

// Return 0-1 for each item; it is scaled by delay * (count - 1)
const delays = customStagger({ count: items.length, delay: 30 }, (index, total) => {
  return Math.pow(index / (total - 1), 1.5) // exponential ease-in
})`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Stagger Presets">
        <p className="text-muted-foreground mb-4">
          Use built-in presets for common patterns:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { staggerPresets } from '@oxog/springkit'

// Presets return delays in milliseconds
staggerPresets.cascade(items.length)    // quick linear cascade (50ms steps)
staggerPresets.reveal(items.length)     // slow linear reveal (150ms steps)
staggerPresets.pop(items.length)        // from the center outward
staggerPresets.ripple(items.length)     // from the edges inward
staggerPresets.scatter(items.length)    // seeded random

// Grid presets also take the column count
staggerPresets.gridWave(16, 4)
staggerPresets.gridRadial(16, 4)
staggerPresets.spiralIn(16, 4)
staggerPresets.spiralOut(16, 4)

const delaysMs = staggerPresets.cascade(items.length).map((s) => s * 1000)`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="All Pattern Functions">
        <div className="grid gap-3">
          {[
            { fn: 'linearStagger({ count, delay, easing? })', desc: 'Simple linear delay progression' },
            { fn: 'reverseStagger({ count, delay })', desc: 'Reverse linear (last to first)' },
            { fn: 'centerStagger({ count, delay })', desc: 'Center-out animation' },
            { fn: 'edgeStagger({ count, delay })', desc: 'Edges-in animation' },
            { fn: 'gridStagger({ count, columns, origin?, direction? })', desc: 'Grid-aware pattern (diagonal by default)' },
            { fn: 'waveStagger({ count, frequency?, amplitude? })', desc: 'Sinusoidal wave pattern' },
            { fn: 'spiralStagger({ count, columns, direction?, startFrom? })', desc: 'Spiral from the edge or center' },
            { fn: 'randomStagger({ count, seed?, minMultiplier?, maxMultiplier? })', desc: 'Randomized delays' },
            { fn: 'customStagger({ count, delay }, (i, total) => 0..1)', desc: 'Custom delay function' },
            { fn: 'applyStagger(options, delays)', desc: 'Add delays to the delay of option objects' },
          ].map((item) => (
            <div key={item.fn} className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10">
              <code className="text-orange-300 font-mono text-sm whitespace-nowrap">{item.fn}</code>
              <span className="text-muted-foreground text-sm">{item.desc}</span>
            </div>
          ))}
        </div>
      </DocSection>
    </DocLayout>
  )
}
