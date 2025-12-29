import { Routes, Route, Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { DocLayout, DocSection, CodeBlock } from '@/components/docs'
import { Atom, Code2, Box, Sparkles } from 'lucide-react'

export function ReactGuide() {
  return (
    <Routes>
      <Route path="/" element={<ReactIndex />} />
      <Route path="/hooks" element={<ReactHooks />} />
      <Route path="/components" element={<ReactComponents />} />
      <Route path="/examples" element={<ReactExamples />} />
    </Routes>
  )
}

function ReactIndex() {
  const guides = [
    { title: 'Hooks', href: '/docs/react/hooks', desc: 'useSpring, useSpringValue, useSprings, and more', icon: Code2 },
    { title: 'Components', href: '/docs/react/components', desc: 'Spring, Animated, Trail components', icon: Box },
    { title: 'Examples', href: '/docs/react/examples', desc: 'React examples and patterns', icon: Sparkles },
  ]

  return (
    <DocLayout
      title="React Integration"
      description="Use SpringKit with React using hooks and components"
      icon={Atom}
    >
      <div className="grid md:grid-cols-3 gap-6">
        {guides.map((guide) => (
          <Link key={guide.href} to={guide.href}>
            <Card className="h-full group cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                    <guide.icon className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-white group-hover:text-orange-300 transition-colors">
                      {guide.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">{guide.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <DocSection title="Quick Start">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { useSpring, Animated } from '@oxog/springkit/react'

function AnimatedBox() {
  const [isOpen, setIsOpen] = useState(false)

  const style = useSpring({
    scale: isOpen ? 1.2 : 1,
    opacity: isOpen ? 1 : 0.5,
  })

  return (
    <Animated.div
      onClick={() => setIsOpen(!isOpen)}
      style={{
        transform: \`scale(\${style.scale})\`,
        opacity: style.opacity,
      }}
    >
      Click me!
    </Animated.div>
  )
}`} />
          </CardContent>
        </Card>
      </DocSection>
    </DocLayout>
  )
}

function ReactHooks() {
  return (
    <DocLayout
      title="React Hooks"
      description="Import hooks from @oxog/springkit/react"
      icon={Code2}
    >
      <DocSection title="useSpring">
        <p className="text-muted-foreground mb-4">
          Animate multiple values based on state:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { useSpring } from '@oxog/springkit/react'

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
}`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="useSpringValue">
        <p className="text-muted-foreground mb-4">
          Animate a single value imperatively:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { useSpringValue } from '@oxog/springkit/react'

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
}`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="useSprings">
        <p className="text-muted-foreground mb-4">
          Animate a list of items:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { useSprings } from '@oxog/springkit/react'

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
}`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="useTrail">
        <p className="text-muted-foreground mb-4">
          Create staggered animations:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { useTrail } from '@oxog/springkit/react'

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
}`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="useDrag">
        <p className="text-muted-foreground mb-4">
          Add drag interactions:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { useDrag } from '@oxog/springkit/react'

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
        background: '#f97316',
      }}
    >
      Drag me!
    </div>
  )
}`} />
          </CardContent>
        </Card>
      </DocSection>
    </DocLayout>
  )
}

function ReactComponents() {
  return (
    <DocLayout
      title="React Components"
      description="Declarative components for common animation patterns"
      icon={Box}
    >
      <DocSection title="Spring">
        <p className="text-muted-foreground mb-4">
          Render prop component for spring animations:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { Spring } from '@oxog/springkit/react'

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
</Spring>`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Animated">
        <p className="text-muted-foreground mb-4">
          Auto-animate any style changes:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { Animated } from '@oxog/springkit/react'

// Style changes are automatically animated
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
<Animated.li />`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Trail">
        <p className="text-muted-foreground mb-4">
          Animate list items with stagger:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { Trail } from '@oxog/springkit/react'

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
</Trail>`} />
          </CardContent>
        </Card>
      </DocSection>
    </DocLayout>
  )
}

function ReactExamples() {
  return (
    <DocLayout
      title="React Examples"
      description="Common patterns and recipes"
      icon={Sparkles}
    >
      <DocSection title="Animated Modal">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`function Modal({ isOpen, onClose }) {
  const style = useSpring({
    opacity: isOpen ? 1 : 0,
    scale: isOpen ? 1 : 0.9,
  })

  if (!isOpen && style.opacity < 0.01) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50"
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
}`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Animated List Items">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`function AnimatedList({ items }) {
  const trail = useTrail(items.length, {
    opacity: 1,
    x: 0,
    from: { opacity: 0, x: -20 },
    delay: 50,
  })

  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li
          key={item.id}
          className="p-4 bg-white rounded-lg shadow"
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
}`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Hover Card">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`function HoverCard({ children }) {
  const [isHovered, setIsHovered] = useState(false)

  const style = useSpring({
    scale: isHovered ? 1.05 : 1,
    y: isHovered ? -5 : 0,
    shadow: isHovered ? 20 : 5,
  })

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: \`scale(\${style.scale}) translateY(\${style.y}px)\`,
        boxShadow: \`0 \${style.shadow}px \${style.shadow * 2}px rgba(0,0,0,0.1)\`,
      }}
      className="p-6 bg-white rounded-xl cursor-pointer"
    >
      {children}
    </div>
  )
}`} />
          </CardContent>
        </Card>
      </DocSection>
    </DocLayout>
  )
}
