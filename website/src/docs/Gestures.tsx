import { Routes, Route } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function Gestures() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-4">Gestures</h1>
        <p className="text-xl text-muted-foreground">
          Built-in support for drag and scroll interactions with spring physics.
        </p>
      </div>

      <Routes>
        <Route path="/" element={<GesturesIndex />} />
        <Route path="/drag" element={<DragSpring />} />
        <Route path="/scroll" element={<ScrollSpring />} />
      </Routes>
    </div>
  )
}

function GesturesIndex() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <a href="/docs/gestures/drag">
        <Card className="hover:border-primary transition-colors cursor-pointer h-full">
          <CardContent className="pt-6">
            <h3 className="text-xl font-bold mb-2">Drag Spring</h3>
            <p className="text-muted-foreground">
              Create draggable elements with rubber band physics and bounds.
            </p>
          </CardContent>
        </Card>
      </a>

      <a href="/docs/gestures/scroll">
        <Card className="hover:border-primary transition-colors cursor-pointer h-full">
          <CardContent className="pt-6">
            <h3 className="text-xl font-bold mb-2">Scroll Spring</h3>
            <p className="text-muted-foreground">
              Smooth scrolling with momentum and bounce at edges.
            </p>
          </CardContent>
        </Card>
      </a>
    </div>
  )
}

function DragSpring() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Drag Spring</h2>
      <p className="text-muted-foreground">
        Create draggable elements with physics-based feedback.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Basic Drag</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm">
            <code>{`import { createDragSpring } from '@oxog/springkit'

const drag = createDragSpring(element, {
  onUpdate: (x, y) => {
    element.style.transform = \`translate(\${x}px, \${y}px)\`
  },
})`}</code>
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>With Bounds</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm">
            <code>{`const drag = createDragSpring(element, {
  bounds: {
    left: 0,
    right: 300,
    top: 0,
    bottom: 200,
  },
  onUpdate: (x, y) => {
    element.style.transform = \`translate(\${x}px, \${y}px)\`
  },
})`}</code>
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rubber Band Effect</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm">
            <code>{`const drag = createDragSpring(element, {
  bounds: { left: 0, right: 300, top: 0, bottom: 200 },
  rubberBand: true,
  rubberBandFactor: 0.5,
  onUpdate: (x, y) => {
    element.style.transform = \`translate(\${x}px, \${y}px)\`
  },
})`}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}

function ScrollSpring() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Scroll Spring</h2>
      <p className="text-muted-foreground">
        Smooth scrolling with momentum and bounce physics.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Basic Scroll</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm">
            <code>{`import { createScrollSpring } from '@oxog/springkit'

const scroll = createScrollSpring(container, {
  onScroll: (scrollX, scrollY) => {
    content.style.transform = \`translateY(${-scrollY}px)\`
  },
})`}</code>
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>With Momentum</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm">
            <code>{`const scroll = createScrollSpring(container, {
  momentum: true,
  momentumDecay: 0.95,
  onScroll: (scrollX, scrollY) => {
    content.style.transform = \`translateY(${-scrollY}px)\`
  },
})`}</code>
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>With Bounce</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm">
            <code>{`const scroll = createScrollSpring(container, {
  bounce: true,
  bounceStiffness: 300,
  bounceDamping: 20,
  onScroll: (scrollX, scrollY) => {
    content.style.transform = \`translateY(${-scrollY}px)\`
  },
})`}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
