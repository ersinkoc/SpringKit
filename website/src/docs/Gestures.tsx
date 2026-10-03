import { Routes, Route, Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { DocLayout, DocSection, CodeBlock } from '@/components/docs'
import { Hand, Move, ScrollText } from 'lucide-react'

export function Gestures() {
  return (
    <Routes>
      <Route path="/" element={<GesturesIndex />} />
      <Route path="/drag" element={<DragSpring />} />
      <Route path="/scroll" element={<ScrollSpring />} />
    </Routes>
  )
}

function GesturesIndex() {
  const gestures = [
    {
      title: 'Drag Spring',
      href: '/docs/gestures/drag',
      desc: 'Create draggable elements with rubber band physics and bounds.',
      icon: Move,
    },
    {
      title: 'Scroll Spring',
      href: '/docs/gestures/scroll',
      desc: 'Spring-smoothed wheel scrolling with bounce at the edges.',
      icon: ScrollText,
    },
  ]

  return (
    <DocLayout
      title="Gestures"
      description="Built-in support for drag and scroll interactions with spring physics"
      icon={Hand}
    >
      <div className="grid md:grid-cols-2 gap-6">
        {gestures.map((gesture) => (
          <Link key={gesture.href} to={gesture.href}>
            <Card className="h-full group cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                    <gesture.icon className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-white group-hover:text-orange-300 transition-colors">
                      {gesture.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">{gesture.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <DocSection title="Swipe Gesture">
        <p className="text-muted-foreground mb-4">
          <code>createSwipeGesture()</code> reports a direction once a pointer gesture is far enough{' '}
          <em>or</em> fast enough. Like every velocity in SpringKit, thresholds and the reported
          velocity are in px/s. Every swipe, even one faster than <code>velocityThreshold</code>, must
          also travel at least <code>minDistance</code> (default 10px) along its direction, so taps and
          quick jitters are not reported as swipes.
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { createSwipeGesture } from '@oxog/springkit'

const swipe = createSwipeGesture(carousel, {
  velocityThreshold: 500, // px/s (default 500)
  distanceThreshold: 50,  // px (default 50): a swipe at any speed
  minDistance: 10,        // px (default 10): required travel, even for fast swipes
  maxDuration: 300,       // ms (default 300)
  axis: 'x',              // 'x' | 'y' | 'both' (default)
  onSwipe: (state) => {
    // state.direction: 'left' | 'right' | 'up' | 'down' | null
    // state.velocity: { x, y } in px/s, state.distance / state.movement in px
    if (state.direction === 'left') next()
    if (state.direction === 'right') previous()
  },
})

swipe.destroy() // remove listeners`} />
          </CardContent>
        </Card>
      </DocSection>
    </DocLayout>
  )
}

function DragSpring() {
  return (
    <DocLayout
      title="Drag Spring"
      description="Create draggable elements with physics-based feedback"
      icon={Move}
    >
      <DocSection title="Basic Drag">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { createDragSpring } from '@oxog/springkit'

const drag = createDragSpring(element, {
  onUpdate: (x, y) => {
    element.style.transform = \`translate(\${x}px, \${y}px)\`
  },
})`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="With Bounds">
        <p className="text-muted-foreground mb-4">
          Constrain dragging to a specific area:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`const drag = createDragSpring(element, {
  bounds: {
    left: 0,
    right: 300,
    top: 0,
    bottom: 200,
  },
  onUpdate: (x, y) => {
    element.style.transform = \`translate(\${x}px, \${y}px)\`
  },
})`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Rubber Band Effect">
        <p className="text-muted-foreground mb-4">
          Add elasticity when dragging beyond bounds with <code>rubberBand</code>, or per edge with{' '}
          <code>dragElastic</code> (<code>true</code> = 0.5, <code>false</code> = 0). In the object form
          an edge you leave out is not elastic (0, as in Framer Motion; 1.x used 0.5):
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`const drag = createDragSpring(element, {
  bounds: { left: 0, right: 300, top: 0, bottom: 200 },
  rubberBand: true,
  rubberBandFactor: 0.5,  // 0-1, lower = more resistance
  onUpdate: (x, y) => {
    element.style.transform = \`translate(\${x}px, \${y}px)\`
  },
})

// Per edge: only the right edge stretches (left, top and bottom are 0)
const sheet = createDragSpring(element, {
  bounds: { left: 0, right: 300 },
  dragElastic: { right: 0.4 },
})`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Snapping">
        <p className="text-muted-foreground mb-4">
          <code>snap.points</code> (with an optional attraction <code>radius</code>) or{' '}
          <code>snap.grid</code> pull a release onto a point. <code>onSnapStart</code> fires when the
          snap spring starts; <code>onSnapComplete</code> fires when that spring has settled on the
          point, so a soft spring reports later than a stiff one. A snap interrupted by a new drag,{' '}
          <code>release()</code>, <code>jumpTo()</code> or <code>animateTo()</code> never reports
          completion.
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`const drag = createDragSpring(element, {
  stiffness: 200,
  damping: 20,
  snap: {
    points: [{ x: 0, y: 0 }, { x: 240, y: 0, radius: 120 }],
    velocityThreshold: 500, // px/s: faster releases glide instead of snapping
  },
  onSnapStart: (point) => element.classList.add('snapping'),
  onSnapComplete: (point) => {
    // the spring is at rest on point.x / point.y
    element.classList.remove('snapping')
  },
  onUpdate: (x, y) => {
    element.style.transform = \`translate(\${x}px, \${y}px)\`
  },
})`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Momentum & Release Velocity">
        <p className="text-muted-foreground mb-4">
          Every velocity is in <strong>px/s</strong> (since 2.0; 1.x used px/ms). On release the element
          keeps moving and slows down exponentially. <code>momentumDecay</code> is the fraction of
          velocity kept per 60fps frame (default 0.95, clamped to 0.01–0.99) and is frame-rate
          independent: a release at <code>v</code> px/s glides about{' '}
          <code>v / (60 · −ln(momentumDecay))</code> px, so a 1000 px/s fling travels ~325px with the
          default. Momentum stops at the bounds, or bounces back with <code>rubberBand</code> /{' '}
          <code>elasticBounce</code>; <code>modifyTarget</code> makes the glide land exactly on the point
          you return.
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`const drag = createDragSpring(element, {
  bounds: { left: 0, right: 960 },
  momentumDecay: 0.95,  // kept per 60fps frame: 1000 px/s → ~325px glide
  elasticBounce: 0.3,   // 0 = no overshoot at a bound, 1 = very bouncy
  modifyTarget: ({ x, y }) => ({ x: Math.round(x / 320) * 320, y }), // land on pages
  snap: { points: [{ x: 0, y: 0 }], velocityThreshold: 500 }, // px/s
  onDragEnd: (x, y, velocity) => {
    console.log(velocity.x) // px/s, measured over the last 100ms
  },
  onUpdate: (x, y) => {
    element.style.transform = \`translate(\${x}px, \${y}px)\`
  },
})

drag.release(1200, 0)  // fling programmatically at 1200 px/s
drag.getVelocity()     // { x, y } in px/s`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Configuration Options">
        <div className="grid gap-3">
          {[
            { option: 'bounds', desc: 'Constraint boundaries { left, right, top, bottom }' },
            { option: 'rubberBand', desc: 'Enable elastic effect beyond bounds' },
            { option: 'rubberBandFactor', desc: 'Elasticity amount (0-1)' },
            { option: 'dragElastic', desc: 'number | boolean | { top, right, bottom, left }: elasticity past the bounds; true = 0.5, false = 0, an edge missing from the object is 0' },
            { option: 'elasticBounce', desc: 'Bounciness (0-1) of the spring when a release hits a bound' },
            { option: 'momentum', desc: 'Keep gliding with the release velocity after release (default true)' },
            { option: 'momentumDecay', desc: 'Fraction of velocity kept per 60fps frame (default 0.95, clamped 0.01-0.99); glide ≈ v / (60 · −ln(decay)) px' },
            { option: 'modifyTarget', desc: '({ x, y }) => ({ x, y }): change where a release comes to rest; the glide lands exactly on it' },
            { option: 'axis', desc: 'Lock to "x" or "y" axis (or use constraints.lockAxis)' },
            { option: 'constraints', desc: 'bounds, constrainToParent (inside the parent padding box), constrainToElement, constraintPadding, lockAxis, lockToDiagonal' },
            { option: 'snap', desc: 'Snap points / grid: { points, grid, snapOnRelease, velocityThreshold } (threshold in px/s, default 500)' },
            { option: 'onDragStart', desc: 'Called when drag starts with (event)' },
            { option: 'onDrag', desc: 'Called while dragging with (x, y, event)' },
            { option: 'onUpdate', desc: 'Called on each frame with (x, y)' },
            { option: 'onDragEnd', desc: 'Called when drag ends with (x, y, velocity); velocity in px/s' },
            { option: 'onSnapStart', desc: 'Called with the snap point when a snap animation starts' },
            { option: 'onSnapComplete', desc: 'Called with the snap point once the snap spring has settled (not for an interrupted snap)' },
            { option: 'onBoundsHit', desc: "Called with 'left' | 'right' | 'top' | 'bottom' when a release ends outside the bounds or momentum reaches a bound" },
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

function ScrollSpring() {
  return (
    <DocLayout
      title="Scroll Spring"
      description="Spring-smoothed wheel scrolling with bounce at the edges"
      icon={ScrollText}
    >
      <DocSection title="Basic Scroll">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { createScrollSpring } from '@oxog/springkit'

const scroll = createScrollSpring(container, {
  onScroll: (scrollX, scrollY) => {
    content.style.transform = \`translateY(\${-scrollY}px)\`
  },
})`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="With Bounce">
        <p className="text-muted-foreground mb-4">
          With <code>bounce: true</code>, scrolling past an edge is resisted with an iOS-style rubber
          band: small overscrolls move about 0.55× the input and the overscroll never exceeds the
          container size, however far you push. Once the input stops, a spring brings the content back
          to the edge; <code>bounceStiffness</code> / <code>bounceDamping</code> tune that spring
          (defaults: the scroll spring's own <code>stiffness</code> / <code>damping</code>).
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`const scroll = createScrollSpring(container, {
  bounce: true,
  bounceStiffness: 300,
  bounceDamping: 20,
  onScroll: (scrollX, scrollY) => {
    content.style.transform = \`translateY(\${-scrollY}px)\`
  },
})`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Configuration Options">
        <div className="grid gap-3">
          {[
            { option: 'bounce', desc: 'iOS-style rubber band past the edges (~0.55×, never more than the container size), then spring back' },
            { option: 'bounceStiffness', desc: 'Stiffness of the spring back to the edge (default: stiffness)' },
            { option: 'bounceDamping', desc: 'Damping of the spring back to the edge (default: damping)' },
            { option: 'stiffness, damping, mass', desc: 'Scroll smoothing spring (default 100 / 10 / 1)' },
            { option: 'direction', desc: '"vertical" (default), "horizontal" or "both"' },
            { option: 'onScroll', desc: 'Called with (scrollX, scrollY)' },
            { option: 'onScrollStart', desc: 'Called when scroll starts' },
            { option: 'onScrollEnd', desc: 'Called when scroll ends' },
            { option: 'momentum, momentumDecay', desc: 'Deprecated, no effect: wheel and trackpad events already carry the OS inertia' },
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
