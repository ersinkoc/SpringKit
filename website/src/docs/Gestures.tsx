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
      desc: 'Smooth scrolling with momentum and bounce at edges.',
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
          Add elasticity when dragging beyond bounds:
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
})`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Configuration Options">
        <div className="grid gap-3">
          {[
            { option: 'bounds', desc: 'Constraint boundaries { left, right, top, bottom }' },
            { option: 'rubberBand', desc: 'Enable elastic effect beyond bounds' },
            { option: 'rubberBandFactor', desc: 'Elasticity amount (0-1)' },
            { option: 'momentum', desc: 'Continue motion after release' },
            { option: 'axis', desc: 'Lock to "x" or "y" axis' },
            { option: 'onStart', desc: 'Called when drag starts' },
            { option: 'onUpdate', desc: 'Called on each frame with (x, y)' },
            { option: 'onEnd', desc: 'Called when drag ends' },
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
      description="Smooth scrolling with momentum and bounce physics"
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

      <DocSection title="With Momentum">
        <p className="text-muted-foreground mb-4">
          Add inertia after scroll release:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`const scroll = createScrollSpring(container, {
  momentum: true,
  momentumDecay: 0.95,  // Higher = longer momentum
  onScroll: (scrollX, scrollY) => {
    content.style.transform = \`translateY(\${-scrollY}px)\`
  },
})`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="With Bounce">
        <p className="text-muted-foreground mb-4">
          Add elastic bounce at scroll edges:
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
            { option: 'momentum', desc: 'Enable momentum after release' },
            { option: 'momentumDecay', desc: 'Momentum deceleration rate' },
            { option: 'bounce', desc: 'Enable bounce at edges' },
            { option: 'bounceStiffness', desc: 'Bounce spring stiffness' },
            { option: 'bounceDamping', desc: 'Bounce spring damping' },
            { option: 'axis', desc: 'Lock to "x" or "y" scroll' },
            { option: 'onScroll', desc: 'Called with (scrollX, scrollY)' },
            { option: 'onScrollStart', desc: 'Called when scroll starts' },
            { option: 'onScrollEnd', desc: 'Called when scroll ends' },
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
