import { Routes, Route, Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { DocLayout, DocSection, CodeBlock } from '@/components/docs'
import { Clock, Shapes, MoveVertical, Layers, Grid3X3, Wand2 } from 'lucide-react'

export function AdvancedFeatures() {
  return (
    <Routes>
      <Route path="/" element={<AdvancedIndex />} />
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
          labels, and relative positioning.
        </p>
      </DocSection>

      <DocSection title="Basic Usage">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { createTimeline } from '@oxog/springkit'

const tl = createTimeline({
  onUpdate: (progress) => console.log(\`Progress: \${progress}\`),
  onComplete: () => console.log('Done!'),
})

// Chain animations
tl.to(element1, { x: 100, opacity: 1 })
  .to(element2, { x: 100, opacity: 1 })
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
  .to(element2, { x: 100 }, '-=300') // Start 300ms before previous ends

// Delay after previous animation
tl.to(element3, { x: 100 }, '+=500') // Start 500ms after previous ends

// Start at specific time
tl.to(element4, { x: 100 }, '2000') // Start at 2000ms`} />
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
            { method: 'seek(progress)', desc: 'Jump to a specific progress (0-1)' },
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

  const { timeline, play, pause, reverse } = useTimeline({
    paused: true,
    onComplete: () => console.log('Done!'),
  })

  useEffect(() => {
    if (timeline && box1.current && box2.current) {
      timeline
        .to(box1.current, { x: 100, opacity: 1 })
        .to(box2.current, { x: 100, opacity: 1 }, '-=200')
    }
  }, [timeline])

  return (
    <>
      <button onClick={play}>Play</button>
      <button onClick={pause}>Pause</button>
      <button onClick={reverse}>Reverse</button>
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

const morph = createMorph(pathElement, {
  config: { stiffness: 150, damping: 15 },
})

// Morph to a new shape
await morph.to(shapes.star(50, 50, 40, 20, 5))`} />
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
const polygon = shapes.polygon(cx, cy, radius, sides)`} />
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

const sequence = createMorphSequence(pathElement, [
  shapes.circle(50, 50, 40),
  shapes.star(50, 50, 45, 20, 5),
  shapes.heart(50, 50, 40),
], {
  config: { stiffness: 120, damping: 12 },
  loop: true,
  duration: 1000, // Time between morphs
})

sequence.play()`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="React Hook">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { useMorph, shapes } from '@oxog/springkit/react'

function MorphingShape() {
  const { ref, morph } = useMorph({
    config: { stiffness: 150, damping: 15 },
  })

  const handleMorph = async () => {
    await morph(shapes.star(50, 50, 45, 20, 5))
  }

  return (
    <svg viewBox="0 0 100 100">
      <path
        ref={ref}
        d={shapes.circle(50, 50, 40)}
        fill="currentColor"
      />
    </svg>
  )
}`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Options">
        <div className="grid gap-3">
          {[
            { option: 'config', desc: 'Spring configuration (stiffness, damping, mass)' },
            { option: 'onUpdate', desc: 'Callback with current path string' },
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

const scrollProgress = createScrollProgress(containerElement, {
  onProgress: (progress) => {
    // progress is 0-1 based on scroll position
    element.style.opacity = String(progress)
    element.style.transform = \`translateX(\${progress * 100}px)\`
  },
})

// Clean up
scrollProgress.destroy()`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Parallax Effects">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { createParallax } from '@oxog/springkit'

const parallax = createParallax(element, {
  speed: 0.5, // Move at half scroll speed
  direction: 'vertical', // or 'horizontal'
  range: [-100, 100], // Movement range in pixels
})

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
  start: 'top 80%', // When top of element hits 80% of viewport
  end: 'bottom 20%', // When bottom hits 20% of viewport
  onEnter: () => console.log('Element entered'),
  onLeave: () => console.log('Element left'),
  onProgress: (progress) => {
    // Animate based on progress through trigger zone
  },
})`} />
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

const scrollValue = createScrollLinkedValue(container, {
  inputRange: [0, 0.5, 1], // Scroll progress points
  outputRange: [0, 100, 50], // Corresponding values
  onValue: (value) => {
    element.style.transform = \`translateX(\${value}px)\`
  },
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

  // Track scroll progress
  const { progress } = useScrollProgress(containerRef)

  // Create parallax effect
  const { ref: parallaxRef } = useParallax({ speed: 0.5 })

  // Trigger on scroll
  const { ref: triggerRef, isInView } = useScrollTrigger({
    threshold: 0.5,
  })

  return (
    <div ref={containerRef}>
      <div ref={parallaxRef}>Parallax content</div>
      <div ref={triggerRef}>
        {isInView ? 'Visible!' : 'Not visible'}
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
  config: { stiffness: 200, damping: 20 },
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

// In list view
sharedLayout.register('hero-image', listImageElement)

// When transitioning to detail view
sharedLayout.unregister('hero-image', listImageElement)
sharedLayout.register('hero-image', detailImageElement)

// The image animates between positions automatically`} />
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

const autoLayout = createAutoLayout({
  config: { stiffness: 150, damping: 15 },
})

// Items automatically animate when added/removed/reordered`} />
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
  const { ref, flip: flipAnim } = useFlip()

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
            { option: 'config', desc: 'Spring configuration for the animation' },
            { option: 'duration', desc: 'Max animation duration (optional)' },
            { option: 'onStart', desc: 'Called when animation starts' },
            { option: 'onComplete', desc: 'Called when animation completes' },
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
          spiral, and random.
        </p>
      </DocSection>

      <DocSection title="Linear Stagger">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { linearStagger, applyStagger } from '@oxog/springkit'

const items = document.querySelectorAll('.item')

// Get delay array for linear pattern
const delays = linearStagger(items.length, 50) // 50ms base delay

// Apply delays to animations
items.forEach((item, i) => {
  setTimeout(() => {
    spring(0, 1, { onUpdate: v => item.style.opacity = String(v) }).start()
  }, delays[i])
})`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Center Stagger">
        <p className="text-muted-foreground mb-4">
          Items animate outward from the center:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { centerStagger } from '@oxog/springkit'

// Center items animate first, edges last
const delays = centerStagger(items.length, 50)`} />
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

const delays = waveStagger(items.length, {
  delay: 50,
  frequency: 2, // Number of wave cycles
  amplitude: 1, // Wave intensity
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

const delays = gridStagger(16, { // 16 items in a 4x4 grid
  delay: 50,
  columns: 4,
  from: 'topLeft', // 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'center'
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

const delays = spiralStagger(items.length, {
  delay: 30,
  columns: 4, // Grid columns for calculating spiral
  clockwise: true,
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

const delays = randomStagger(items.length, {
  minDelay: 0,
  maxDelay: 500,
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

// Exponential delay pattern
const delays = customStagger(items.length, (index, total) => {
  return Math.pow(index, 1.5) * 30
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

// Quick cascade
const quickDelays = staggerPresets.quick(items.length)

// Slow reveal
const slowDelays = staggerPresets.slow(items.length)

// Bouncy entrance
const bouncyDelays = staggerPresets.bouncy(items.length)`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="All Pattern Functions">
        <div className="grid gap-3">
          {[
            { fn: 'linearStagger(count, delay)', desc: 'Simple linear delay progression' },
            { fn: 'reverseStagger(count, delay)', desc: 'Reverse linear (last to first)' },
            { fn: 'centerStagger(count, delay)', desc: 'Center-out animation' },
            { fn: 'edgeStagger(count, delay)', desc: 'Edges-in animation' },
            { fn: 'gridStagger(count, options)', desc: 'Grid-aware diagonal pattern' },
            { fn: 'waveStagger(count, options)', desc: 'Sinusoidal wave pattern' },
            { fn: 'spiralStagger(count, options)', desc: 'Spiral from center' },
            { fn: 'randomStagger(count, options)', desc: 'Randomized delays' },
            { fn: 'customStagger(count, fn)', desc: 'Custom delay function' },
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
