import { Routes, Route, Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { DocLayout, DocSection, CodeBlock } from '@/components/docs'
import { Wand2, ArrowRight, Layers, GitBranch, TrendingDown } from 'lucide-react'

export function Orchestration() {
  return (
    <Routes>
      <Route path="/" element={<OrchestrationIndex />} />
      <Route path="/sequence" element={<SequenceParallel />} />
      <Route path="/stagger" element={<Stagger />} />
      <Route path="/trail" element={<Trail />} />
      <Route path="/decay" element={<Decay />} />
    </Routes>
  )
}

function OrchestrationIndex() {
  const topics = [
    {
      title: 'Sequence & Parallel',
      href: '/docs/orchestration/sequence',
      desc: 'Run animations one after another or simultaneously.',
      icon: ArrowRight,
    },
    {
      title: 'Stagger',
      href: '/docs/orchestration/stagger',
      desc: 'Delay animations with configurable timing patterns.',
      icon: Layers,
    },
    {
      title: 'Trail',
      href: '/docs/orchestration/trail',
      desc: 'Create follow effects where elements trail behind a leader.',
      icon: GitBranch,
    },
    {
      title: 'Decay',
      href: '/docs/orchestration/decay',
      desc: 'Natural momentum-based deceleration animations.',
      icon: TrendingDown,
    },
  ]

  return (
    <DocLayout
      title="Animation Orchestration"
      description="Coordinate multiple animations with sequence, parallel, stagger, and more"
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

function SequenceParallel() {
  return (
    <DocLayout
      title="Sequence & Parallel"
      description="Control when animations start relative to each other"
      icon={ArrowRight}
    >
      <DocSection title="Sequence">
        <p className="text-muted-foreground mb-4">
          Run animations one after another:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { sequence } from '@oxog/springkit'

await sequence([
  () => spring(0, 100, { onUpdate: updateOpacity }).start(),
  () => spring(0, 200, { onUpdate: updateX }).start(),
  () => spring(0, 50, { onUpdate: updateY }).start(),
])

console.log('All complete!')`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Parallel">
        <p className="text-muted-foreground mb-4">
          Run animations simultaneously:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { parallel } from '@oxog/springkit'

await parallel([
  () => spring(0, 100, { onUpdate: updateOpacity }).start(),
  () => spring(0, 200, { onUpdate: updateX }).start(),
  () => spring(1, 2, { onUpdate: updateScale }).start(),
])`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Mixed">
        <p className="text-muted-foreground mb-4">
          Combine sequence and parallel for complex choreography:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`await sequence([
  // First, fade in
  () => spring(0, 1, { onUpdate: updateOpacity }).start(),

  // Then, move and scale together
  () => parallel([
    () => spring(0, 100, { onUpdate: updateX }).start(),
    () => spring(1, 1.2, { onUpdate: updateScale }).start(),
  ]),

  // Finally, rotate
  () => spring(0, 360, { onUpdate: updateRotation }).start(),
])`} />
          </CardContent>
        </Card>
      </DocSection>
    </DocLayout>
  )
}

function Stagger() {
  return (
    <DocLayout
      title="Stagger"
      description="Delay animations with configurable timing patterns"
      icon={Layers}
    >
      <DocSection title="Basic Stagger">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { spring, stagger } from '@oxog/springkit'

const elements = Array.from(document.querySelectorAll<HTMLElement>('.item'))

await stagger(
  elements,
  (element, index) => {
    // Return the animation WITHOUT calling start():
    // stagger() starts each one after its delay
    return spring(0, 1, {
      onUpdate: (value) => {
        element.style.opacity = String(value)
      },
    })
  },
  { delay: (i) => i * 50 }  // item i starts after i * 50ms
)`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Stagger from Center">
        <p className="text-muted-foreground mb-4">
          Start animation from center elements:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`await stagger(
  elements,
  animateElement,
  {
    delay: (i) => i * 30,
    from: 'center',  // Items near center start first
  }
)`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Dynamic Delay">
        <p className="text-muted-foreground mb-4">
          Use a function for custom delay patterns:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`await stagger(
  elements,
  animateElement,
  {
    delay: (index) => index * 30 + Math.random() * 20,
  }
)`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Options">
        <div className="grid gap-3">
          {[
            { option: 'delay', desc: 'Start delay in ms: (i) => ms, where i is the start order; a number delays every item equally' },
            { option: 'from', desc: '"first" | "last" | "center" | index (default "first")' },
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

function Trail() {
  return (
    <DocLayout
      title="Trail"
      description="Create follow effects where each element trails behind the previous one"
      icon={GitBranch}
    >
      <DocSection title="Basic Trail">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { createTrail } from '@oxog/springkit'

const trail = createTrail(5, {
  stiffness: 120,
  damping: 14,
  followDelay: 2,  // Frames delay between items
})

trail.subscribe((values) => {
  values.forEach((value, index) => {
    elements[index].style.transform = \`translateX(\${value}px)\`
  })
})

trail.set(100)  // First item moves immediately, others follow`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Trail with Multiple Properties">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`const trail = createTrail(5, {
  stiffness: 100,
  damping: 10,
})

// Each item follows the previous
trail.subscribe((values) => {
  values.forEach((value, index) => {
    const scale = 1 - (index * 0.1)  // Each item slightly smaller
    elements[index].style.transform = \`
      translateX(\${value}px)
      scale(\${scale})
    \`
    elements[index].style.opacity = String(1 - (index * 0.15))
  })
})`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Options">
        <div className="grid gap-3">
          {[
            { option: 'followDelay', desc: 'Frames of delay between items' },
            { option: 'stiffness', desc: 'Spring stiffness for all items' },
            { option: 'damping', desc: 'Spring damping for all items' },
            { option: 'mass', desc: 'Spring mass for all items' },
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

function Decay() {
  return (
    <DocLayout
      title="Decay"
      description="Natural momentum-based deceleration for swipe/fling animations"
      icon={TrendingDown}
    >
      <DocSection title="Basic Decay">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { decay } from '@oxog/springkit'

const anim = decay({
  velocity: 1000,  // px/s, e.g. the release velocity of a drag
  onUpdate: (value) => {
    element.style.transform = \`translateX(\${value}px)\`
  },
})

anim.start()`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="With Deceleration">
        <p className="text-muted-foreground mb-4">
          Control how quickly the motion slows down:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`const anim = decay({
  from: container.scrollLeft,
  velocity: 500,
  deceleration: 0.998,  // velocity kept per ms: 0.998 normal, 0.99 fast (iOS scale)
  onUpdate: (value) => {
    container.scrollLeft = value
  },
})`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Snapping a Fling">
        <p className="text-muted-foreground mb-4">
          <code>modifyTarget</code> receives the natural resting value. The decay is rescaled to land
          exactly on the value you return, so the motion still feels like momentum:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`const anim = decay({
  from: x,
  velocity: releaseVelocity,                       // px/s
  modifyTarget: (t) => Math.round(t / 320) * 320,  // snap to 320px pages
  onUpdate: (value) => { track.style.transform = \`translateX(\${value}px)\` },
}).start()

anim.target // where it will come to rest`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="With Clamp">
        <p className="text-muted-foreground mb-4">
          Stop at boundaries:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`const anim = decay({
  velocity: 1000,
  clamp: [0, 500],  // Stop at min/max boundaries
  onUpdate: (value) => {
    element.style.transform = \`translateX(\${value}px)\`
  },
})`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Options">
        <div className="grid gap-3">
          {[
            { option: 'velocity', desc: 'Initial velocity in units per second (required)' },
            { option: 'from', desc: 'Starting value (default 0)' },
            { option: 'deceleration', desc: 'Fraction of velocity kept per millisecond (default 0.998)' },
            { option: 'clamp', desc: '[min, max] boundaries; motion stops at a boundary' },
            { option: 'modifyTarget', desc: 'Adjust the resting value, e.g. snap to a grid; lands exactly on it' },
            { option: 'restDelta', desc: 'Remaining distance at which the motion ends (default 0.5)' },
            { option: 'onUpdate', desc: 'Called with current value' },
            { option: 'onComplete', desc: 'Called when motion stops' },
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
