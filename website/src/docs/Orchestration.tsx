import { Routes, Route } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function Orchestration() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-4">Animation Orchestration</h1>
        <p className="text-xl text-muted-foreground">
          Coordinate multiple animations with sequence, parallel, stagger, and more.
        </p>
      </div>

      <Routes>
        <Route path="/" element={<OrchestrationIndex />} />
        <Route path="/sequence" element={<SequenceParallel />} />
        <Route path="/stagger" element={<Stagger />} />
        <Route path="/trail" element={<Trail />} />
        <Route path="/decay" element={<Decay />} />
      </Routes>
    </div>
  )
}

function OrchestrationIndex() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <a href="/docs/orchestration/sequence">
        <Card className="hover:border-primary transition-colors cursor-pointer h-full">
          <CardContent className="pt-6">
            <h3 className="text-xl font-bold mb-2">Sequence & Parallel</h3>
            <p className="text-muted-foreground">
              Run animations one after another or simultaneously.
            </p>
          </CardContent>
        </Card>
      </a>

      <a href="/docs/orchestration/stagger">
        <Card className="hover:border-primary transition-colors cursor-pointer h-full">
          <CardContent className="pt-6">
            <h3 className="text-xl font-bold mb-2">Stagger</h3>
            <p className="text-muted-foreground">
              Delay animations with configurable timing patterns.
            </p>
          </CardContent>
        </Card>
      </a>

      <a href="/docs/orchestration/trail">
        <Card className="hover:border-primary transition-colors cursor-pointer h-full">
          <CardContent className="pt-6">
            <h3 className="text-xl font-bold mb-2">Trail</h3>
            <p className="text-muted-foreground">
              Create follow effects where elements trail behind a leader.
            </p>
          </CardContent>
        </Card>
      </a>

      <a href="/docs/orchestration/decay">
        <Card className="hover:border-primary transition-colors cursor-pointer h-full">
          <CardContent className="pt-6">
            <h3 className="text-xl font-bold mb-2">Decay</h3>
            <p className="text-muted-foreground">
              Natural momentum-based deceleration animations.
            </p>
          </CardContent>
        </Card>
      </a>
    </div>
  )
}

function SequenceParallel() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Sequence & Parallel</h2>
      <p className="text-muted-foreground">
        Control when animations start relative to each other.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Sequence</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm">
            <code>{`import { sequence } from '@oxog/springkit'

await sequence([
  () => spring(0, 100, { onUpdate: updateOpacity }).start(),
  () => spring(0, 200, { onUpdate: updateX }).start(),
  () => spring(0, 50, { onUpdate: updateY }).start(),
])

console.log('All complete!')`}</code>
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Parallel</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm">
            <code>{`import { parallel } from '@oxog/springkit'

await parallel([
  () => spring(0, 100, { onUpdate: updateOpacity }).start(),
  () => spring(0, 200, { onUpdate: updateX }).start(),
  () => spring(1, 2, { onUpdate: updateScale }).start(),
])`}</code>
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mixed</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm">
            <code>{`await sequence([
  // First, fade in
  () => spring(0, 1, { onUpdate: updateOpacity }).start(),

  // Then, move and scale together
  () => parallel([
    () => spring(0, 100, { onUpdate: updateX }).start(),
    () => spring(1, 1.2, { onUpdate: updateScale }).start(),
  ]),

  // Finally, rotate
  () => spring(0, 360, { onUpdate: updateRotation }).start(),
])`}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}

function Stagger() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Stagger</h2>
      <p className="text-muted-foreground">
        Delay animations with configurable timing patterns.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Basic Stagger</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm">
            <code>{`import { stagger } from '@oxog/springkit'

const elements = document.querySelectorAll('.item')

await stagger(
  elements,
  (element, index) => {
    return spring(0, 1, {
      onUpdate: (value) => {
        element.style.opacity = String(value)
      },
    }).start()
  },
  { delay: 50 }  // 50ms between each
)`}</code>
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stagger from Center</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm">
            <code>{`await stagger(
  elements,
  animateElement,
  {
    delay: 30,
    from: 'center',  // Items near center start first
  }
)`}</code>
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dynamic Delay</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm">
            <code>{`await stagger(
  elements,
  animateElement,
  {
    delay: (index) => index * 30 + Math.random() * 20,
  }
)`}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}

function Trail() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Trail</h2>
      <p className="text-muted-foreground">
        Create follow effects where each element trails behind the previous one.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Basic Trail</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm">
            <code>{`import { createTrail } from '@oxog/springkit'

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

trail.set(100)  // First item moves immediately, others follow`}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}

function Decay() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Decay</h2>
      <p className="text-muted-foreground">
        Natural momentum-based deceleration for swipe/fling animations.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Basic Decay</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm">
            <code>{`import { decay } from '@oxog/springkit'

const anim = decay({
  velocity: 1000,  // Initial velocity
  onUpdate: (value) => {
    element.style.transform = \`translateX(\${value}px)\`
  },
})

anim.start()`}</code>
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>With Deceleration</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm">
            <code>{`const anim = decay({
  velocity: 500,
  deceleration: 0.998,  // Higher = slower decay
  onUpdate: (value) => {
    container.scrollLeft = value
  },
})`}</code>
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>With Clamp</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm">
            <code>{`const anim = decay({
  velocity: 1000,
  clamp: [0, 500],  // Stop at boundaries
  onUpdate: (value) => {
    element.style.transform = \`translateX(\${value}px)\`
  },
})`}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
