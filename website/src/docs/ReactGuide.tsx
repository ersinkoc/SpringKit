import { Routes, Route } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ReactGuide() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-4">React Integration</h1>
        <p className="text-xl text-muted-foreground">
          Use SpringKit with React using hooks and components.
        </p>
      </div>

      <Routes>
        <Route path="/" element={<ReactIndex />} />
        <Route path="/hooks" element={<ReactHooks />} />
        <Route path="/components" element={<ReactComponents />} />
        <Route path="/examples" element={<ReactExamples />} />
      </Routes>
    </div>
  )
}

function ReactIndex() {
  const guides = [
    { name: 'Hooks', path: '/docs/react/hooks', desc: 'useSpring, useSpringValue, useSprings, etc.' },
    { name: 'Components', path: '/docs/react/components', desc: 'Spring, Animated, Trail components' },
    { name: 'Examples', path: '/docs/react/examples', desc: 'React examples and patterns' },
  ]

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {guides.map((guide) => (
        <a key={guide.path} href={guide.path}>
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardContent className="pt-6">
              <h3 className="text-xl font-bold mb-2">{guide.name}</h3>
              <p className="text-muted-foreground">{guide.desc}</p>
            </CardContent>
          </Card>
        </a>
      ))}
    </div>
  )
}

function ReactHooks() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">React Hooks</h2>
      <p className="text-muted-foreground">
        Import hooks from <code>@oxog/springkit/react</code>.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>useSpring</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm">
            <code>{`import { useSpring } from '@oxog/springkit/react'

function Box() {
  const [isOpen, setIsOpen] = useState(false)
  const style = useSpring({
    width: isOpen ? 300 : 100,
    height: isOpen ? 200 : 100,
    opacity: isOpen ? 1 : 0.5,
  })

  return (
    <div
      onClick={() => setIsOpen(!isOpen)}
      style={{
        width: style.width,
        height: style.height,
        opacity: style.opacity,
      }}
    />
  )
}`}</code>
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>useSpringValue</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm">
            <code>{`import { useSpringValue } from '@oxog/springkit/react'

function ProgressBar({ value }) {
  const progress = useSpringValue(value)

  useEffect(() => {
    progress.set(value)
  }, [value])

  return (
    <div className="w-full bg-gray-200 rounded-full">
      <div
        className="bg-primary h-2 rounded-full"
        style={{ width: \`\${progress.get()}%\` }}
      />
    </div>
  )
}`}</code>
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>useSprings</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm">
            <code>{`import { useSprings } from '@oxog/springkit/react'

function AnimatedList({ items }) {
  const springs = useSprings(
    items.length,
    (index) => ({
      values: { opacity: 1, y: 0 },
      from: { opacity: 0, y: 20 },
      delay: index * 50,
    })
  )

  return (
    <ul>
      {items.map((item, index) => (
        <li
          key={item.id}
          style={{
            opacity: springs[index].opacity,
            transform: \`translateY(\${springs[index].y}px)\`,
          }}
        >
          {item.name}
        </li>
      ))}
    </ul>
  )
}`}</code>
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>useTrail</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm">
            <code>{`import { useTrail } from '@oxog/springkit/react'

function TrailList({ items, isVisible }) {
  const trail = useTrail(items.length, {
    opacity: isVisible ? 1 : 0,
    x: isVisible ? 0 : -20,
  })

  return (
    <ul>
      {trail.map((style, index) => (
        <li
          key={items[index].id}
          style={{
            opacity: style.opacity,
            transform: \`translateX(\${style.x}px)\`,
          }}
        >
          {items[index].name}
        </li>
      ))}
    </ul>
  )
}`}</code>
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>useDrag</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm">
            <code>{`import { useDrag } from '@oxog/springkit/react'

function DraggableCard() {
  const [{ x, y }, api] = useDrag({
    bounds: { left: 0, right: 300, top: 0, bottom: 200 },
    rubberBand: true,
  })

  return (
    <div
      {...api.bind()}
      style={{
        transform: \`translate(\${x}px, \${y}px)\`,
        width: 100,
        height: 100,
        background: '#3b82f6',
      }}
    >
      Drag me!
    </div>
  )
}`}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}

function ReactComponents() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">React Components</h2>
      <p className="text-muted-foreground">
        Declarative components for common animation patterns.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Spring</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm">
            <code>{`import { Spring } from '@oxog/springkit/react'

// Basic usage
<Spring
  from={{ opacity: 0, y: 20 }}
  to={{ opacity: 1, y: 0 }}
>
  {(style) => (
    <div
      style={{
        opacity: style.opacity,
        transform: \`translateY(\${style.y}px)\`,
      }}
    >
      Animated content
    </div>
  )}
</Spring>`}</code>
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Animated</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm">
            <code>{`import { Animated } from '@oxog/springkit/react'

// Auto-animate any style changes
<Animated.div
  style={{
    opacity: isVisible ? 1 : 0,
    transform: \`translateX(\${isOpen ? 100 : 0}px)\`,
  }}
>
  Content automatically animates
</Animated.div>

// Available elements
<Animated.div />
<Animated.span />
<Animated.button />
<Animated.img />
<Animated.a />
<Animated.p />
<Animated.h1 />
<Animated.ul />
<Animated.li />`}</code>
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trail</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm">
            <code>{`import { Trail } from '@oxog/springkit/react'

<Trail
  items={items}
  keys={(item) => item.id}
  from={{ opacity: 0, x: -20 }}
  to={{ opacity: 1, x: 0 }}
>
  {(style, item, index) => (
    <div
      key={item.id}
      style={{
        opacity: style.opacity,
        transform: \`translateX(\${style.x}px)\`,
      }}
    >
      {item.name}
    </div>
  )}
</Trail>`}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}

function ReactExamples() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">React Examples</h2>

      <Card>
        <CardHeader>
          <CardTitle>Animated Modal</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm">
            <code>{`function Modal({ isOpen, onClose }) {
  const style = useSpring({
    opacity: isOpen ? 1 : 0,
    scale: isOpen ? 1 : 0.9,
  })

  if (!isOpen && style.opacity < 0.01) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ opacity: style.opacity }}
      onClick={onClose}
    >
      <Animated.div
        className="bg-white rounded-lg p-6"
        style={{ transform: \`scale(\${style.scale})\` }}
        onClick={(e) => e.stopPropagation()}
      >
        Modal content
      </Animated.div>
    </div>
  )
}`}</code>
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Animated List Items</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm">
            <code>{`function AnimatedList({ items }) {
  const trail = useTrail(items.length, {
    opacity: 1,
    x: 0,
    from: { opacity: 0, x: -20 },
    delay: 50,
  })

  return (
    <ul>
      {items.map((item, index) => (
        <li
          key={item.id}
          style={{
            opacity: trail[index].opacity,
            transform: \`translateX(\${trail[index].x}px)\`,
          }}
        >
          {item.name}
        </li>
      ))}
    </ul>
  )
}`}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
