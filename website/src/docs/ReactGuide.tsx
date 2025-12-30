import { Routes, Route, Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { DocLayout, DocSection, CodeBlock } from '@/components/docs'
import { Atom, Code2, Box, Sparkles, Heart, Star, Zap, RotateCcw, GripVertical, Target, ArrowRight, Check } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useSpring, useDrag, useTrail } from '@oxog/springkit/react'
import { createSpringValue } from '@oxog/springkit'

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
    { title: 'Hooks', href: '/docs/react/hooks', desc: 'useSpring, useMotionValue, useInView, useScroll, and more', icon: Code2 },
    { title: 'Components', href: '/docs/react/components', desc: 'Spring, Animated, Trail, AnimatePresence', icon: Box },
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

      <DocSection title="useMotionValue">
        <p className="text-muted-foreground mb-4">
          High-performance animations without React re-renders:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { useMotionValue, useTransform } from '@oxog/springkit/react'

function MotionBox() {
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Derive new values from motion values
  const rotate = useTransform(x, [-150, 0, 150], [-45, 0, 45])
  const scale = useTransform(x, [-150, 0, 150], [0.8, 1, 0.8])

  return (
    <div
      onMouseMove={(e) => {
        x.set(e.clientX - 150)
        y.set(e.clientY - 100)
      }}
      ref={(el) => {
        if (!el) return
        x.subscribe((xVal) => {
          el.style.transform = \`translateX(\${xVal}px) rotate(\${rotate.get()}deg)\`
        })
      }}
    />
  )
}`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="useInView">
        <p className="text-muted-foreground mb-4">
          Detect when elements enter the viewport:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { useInView } from '@oxog/springkit/react'

function RevealOnScroll() {
  const { ref, isInView, progress } = useInView({
    amount: 0.5,  // 50% visible
    once: true,   // Only trigger once
  })

  return (
    <div
      ref={ref}
      style={{
        opacity: isInView ? 1 : 0,
        transform: \`translateY(\${isInView ? 0 : 50}px)\`,
        transition: 'all 0.6s ease-out',
      }}
    >
      Revealed when scrolled into view!
      Progress: {(progress * 100).toFixed(0)}%
    </div>
  )
}`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="useScroll">
        <p className="text-muted-foreground mb-4">
          Track scroll position and progress:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { useScroll, useTransform, useMotionValueState } from '@oxog/springkit/react'

function ScrollProgress() {
  const { scrollY, scrollYProgress } = useScroll()

  // Get reactive state for rendering
  const progress = useMotionValueState(scrollYProgress)

  // Or derive new values
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.8])

  return (
    <div>
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200">
        <div
          className="h-full bg-orange-500"
          style={{ width: \`\${progress * 100}%\` }}
        />
      </div>
    </div>
  )
}`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="useReducedMotion">
        <p className="text-muted-foreground mb-4">
          Respect user's motion preferences for accessibility:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { useReducedMotion, useShouldAnimate } from '@oxog/springkit/react'

function AccessibleAnimation() {
  const prefersReducedMotion = useReducedMotion()
  const shouldAnimate = useShouldAnimate()

  return (
    <div
      style={{
        // Skip animations for users who prefer reduced motion
        transition: shouldAnimate ? 'transform 0.5s ease' : 'none',
        transform: isOpen ? 'translateX(100px)' : 'translateX(0)',
      }}
    >
      {prefersReducedMotion
        ? 'Animations disabled'
        : 'Animations enabled'
      }
    </div>
  )
}`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Gesture Hooks">
        <p className="text-muted-foreground mb-4">
          Track hover, tap, and focus states:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { useHover, useTap, useFocus } from '@oxog/springkit/react'

function InteractiveButton() {
  const hover = useHover()
  const tap = useTap()
  const focus = useFocus()

  return (
    <button
      ref={hover.ref}
      {...hover.handlers}
      {...tap.handlers}
      {...focus.handlers}
      style={{
        transform: tap.isPressed
          ? 'scale(0.95)'
          : hover.isHovered
            ? 'scale(1.05)'
            : 'scale(1)',
        boxShadow: focus.isFocused
          ? '0 0 0 3px rgba(249,115,22,0.5)'
          : 'none',
      }}
    >
      {hover.isHovered ? 'Hovering!' : 'Hover me'}
    </button>
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

      <DocSection title="AnimatePresence">
        <p className="text-muted-foreground mb-4">
          Animate components as they mount and unmount:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { AnimatePresence, Animated } from '@oxog/springkit/react'

function Modal({ isOpen, onClose, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <Animated.div
          key="modal"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          config={{ stiffness: 300, damping: 25 }}
          className="fixed inset-0 flex items-center justify-center"
        >
          <div className="bg-white rounded-xl p-6">
            {children}
          </div>
        </Animated.div>
      )}
    </AnimatePresence>
  )
}

// List with exit animations
function AnimatedList({ items, onRemove }) {
  return (
    <AnimatePresence mode="popLayout">
      {items.map((item) => (
        <Animated.div
          key={item.id}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          onClick={() => onRemove(item.id)}
        >
          {item.text}
        </Animated.div>
      ))}
    </AnimatePresence>
  )
}`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="usePresence">
        <p className="text-muted-foreground mb-4">
          Control exit animations manually:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { AnimatePresence, usePresence } from '@oxog/springkit/react'

function FadeOut() {
  const { isPresent, onExitComplete } = usePresence()

  useEffect(() => {
    if (!isPresent) {
      // Element is exiting, play animation then call onExitComplete
      const timeout = setTimeout(() => {
        onExitComplete()
      }, 500)
      return () => clearTimeout(timeout)
    }
  }, [isPresent])

  return (
    <div style={{ opacity: isPresent ? 1 : 0, transition: '0.5s' }}>
      Custom exit animation
    </div>
  )
}`} />
          </CardContent>
        </Card>
      </DocSection>
    </DocLayout>
  )
}

// ============================================================================
// INTERACTIVE DEMO COMPONENTS
// ============================================================================

// Demo: useSpring with toggle
function UseSpringDemo() {
  const [isOpen, setIsOpen] = useState(false)
  const style = useSpring({
    scale: isOpen ? 1.2 : 1,
    rotate: isOpen ? 180 : 0,
    borderRadius: isOpen ? 50 : 12,
  }, { stiffness: 200, damping: 15 })

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-24 h-24 bg-gradient-to-br from-orange-500 to-amber-500 cursor-pointer flex items-center justify-center shadow-lg"
        style={{
          transform: `scale(${style.scale}) rotate(${style.rotate}deg)`,
          borderRadius: `${style.borderRadius}%`,
        }}
      >
        <Sparkles className="w-10 h-10 text-white" />
      </div>
      <p className="text-sm text-white/50">Click to toggle</p>
    </div>
  )
}

// Demo: useDrag
function UseDragDemo() {
  const [pos, api] = useDrag({
    bounds: { left: -100, right: 100, top: -50, bottom: 50 },
    rubberBand: true,
    rubberBandFactor: 0.2,
  })

  return (
    <div className="relative h-40 bg-black/20 rounded-xl overflow-hidden">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-28 border border-dashed border-white/20 rounded-lg" />
      <div
        ref={api.ref}
        className="absolute w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl cursor-grab active:cursor-grabbing flex items-center justify-center shadow-lg"
        style={{
          left: '50%',
          top: '50%',
          transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
        }}
      >
        <GripVertical className="w-6 h-6 text-white" />
      </div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-white/40 font-mono">
        x: {pos.x.toFixed(0)} y: {pos.y.toFixed(0)}
      </div>
    </div>
  )
}

// Demo: useTrail
function UseTrailDemo() {
  const [show, setShow] = useState(true)
  const items = ['useSpring', 'useDrag', 'useTrail', 'useGesture']

  const trail = useTrail(items.length, {
    opacity: show ? 1 : 0,
    x: show ? 0 : -30,
    scale: show ? 1 : 0.8,
  }, { stiffness: 200, damping: 20 })

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShow(!show)}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          show ? 'bg-violet-500 text-white' : 'bg-white/10 text-white/70'
        }`}
      >
        {show ? 'Hide' : 'Show'}
      </button>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={item}
            className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
            style={{
              opacity: trail[i]?.opacity ?? 0,
              transform: `translateX(${trail[i]?.x ?? -30}px) scale(${trail[i]?.scale ?? 0.8})`,
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ background: `linear-gradient(135deg, hsl(${260 + i * 25}, 70%, 50%), hsl(${280 + i * 25}, 70%, 40%))` }}
            >
              {i + 1}
            </div>
            <span className="text-white font-medium">{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Demo: Hover Cards
function HoverCardsDemo() {
  const cards = [
    { icon: Heart, color: 'from-pink-500 to-rose-500', label: 'Like' },
    { icon: Star, color: 'from-amber-500 to-yellow-500', label: 'Star' },
    { icon: Zap, color: 'from-violet-500 to-purple-500', label: 'Boost' },
  ]

  return (
    <div className="flex justify-center gap-4">
      {cards.map((card) => (
        <HoverCard key={card.label} icon={card.icon} color={card.color} label={card.label} />
      ))}
    </div>
  )
}

function HoverCard({ icon: Icon, color, label }: { icon: React.ElementType; color: string; label: string }) {
  const [isHovered, setIsHovered] = useState(false)
  const style = useSpring({
    scale: isHovered ? 1.1 : 1,
    y: isHovered ? -8 : 0,
    rotate: isHovered ? -5 : 0,
  }, { stiffness: 300, damping: 20 })

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`w-20 h-24 bg-gradient-to-br ${color} rounded-xl cursor-pointer flex flex-col items-center justify-center gap-2 shadow-lg`}
      style={{
        transform: `scale(${style.scale}) translateY(${style.y}px) rotate(${style.rotate}deg)`,
      }}
    >
      <Icon className="w-8 h-8 text-white" />
      <span className="text-white text-xs font-medium">{label}</span>
    </div>
  )
}

// Demo: Animated Counter
function AnimatedCounterDemo() {
  const [count, setCount] = useState(0)
  const displayValue = useSpring({ value: count }, { stiffness: 100, damping: 20 })

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-5xl font-bold text-white font-mono">
        {Math.round(displayValue.value)}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setCount(c => c - 10)}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
        >
          -10
        </button>
        <button
          onClick={() => setCount(c => c + 10)}
          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg"
        >
          +10
        </button>
        <button
          onClick={() => setCount(0)}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Demo: Magnetic Button
function MagneticButtonDemo() {
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const springXRef = useRef<ReturnType<typeof createSpringValue> | null>(null)
  const springYRef = useRef<ReturnType<typeof createSpringValue> | null>(null)

  useEffect(() => {
    springXRef.current = createSpringValue(0, { stiffness: 150, damping: 15, onUpdate: (v) => setOffset(o => ({ ...o, x: v })) })
    springYRef.current = createSpringValue(0, { stiffness: 150, damping: 15, onUpdate: (v) => setOffset(o => ({ ...o, y: v })) })
    return () => {
      springXRef.current?.destroy()
      springYRef.current?.destroy()
    }
  }, [])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    springXRef.current?.set(x * 0.3)
    springYRef.current?.set(y * 0.3)
  }

  const handleMouseLeave = () => {
    springXRef.current?.set(0)
    springYRef.current?.set(0)
  }

  return (
    <div className="flex justify-center py-8">
      <button
        ref={buttonRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-500/30"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      >
        <span className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Magnetic Button
        </span>
      </button>
    </div>
  )
}

// Demo: Accordion
function AccordionDemo() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const items = [
    { title: 'What is SpringKit?', content: 'SpringKit is a physics-based animation library that provides natural, fluid animations using real spring physics calculations.' },
    { title: 'Why use springs?', content: 'Springs provide natural motion that feels responsive and organic. Unlike duration-based animations, springs can be interrupted and redirected smoothly.' },
    { title: 'How does it work?', content: 'SpringKit uses the harmonic oscillator equation to calculate position and velocity on each frame, creating realistic spring motion.' },
  ]

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <AccordionItem
          key={i}
          title={item.title}
          content={item.content}
          isOpen={openIndex === i}
          onClick={() => setOpenIndex(openIndex === i ? null : i)}
        />
      ))}
    </div>
  )
}

function AccordionItem({ title, content, isOpen, onClick }: { title: string; content: string; isOpen: boolean; onClick: () => void }) {
  const style = useSpring({
    height: isOpen ? 80 : 0,
    opacity: isOpen ? 1 : 0,
    rotate: isOpen ? 90 : 0,
  }, { stiffness: 200, damping: 20 })

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
      <button onClick={onClick} className="w-full px-4 py-3 flex items-center justify-between text-left">
        <span className="text-white font-medium">{title}</span>
        <ArrowRight className="w-4 h-4 text-white/50" style={{ transform: `rotate(${style.rotate}deg)` }} />
      </button>
      <div className="overflow-hidden" style={{ height: style.height, opacity: style.opacity }}>
        <p className="px-4 pb-3 text-white/60 text-sm">{content}</p>
      </div>
    </div>
  )
}

// Demo: Checkbox Animation
function CheckboxDemo() {
  const [checked, setChecked] = useState(false)
  const style = useSpring({
    scale: checked ? 1 : 0,
    rotate: checked ? 0 : -90,
    bgOpacity: checked ? 1 : 0,
  }, { stiffness: 300, damping: 20 })

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={() => setChecked(!checked)}
        className="w-8 h-8 rounded-lg border-2 border-white/30 flex items-center justify-center transition-colors"
        style={{ backgroundColor: `rgba(34, 197, 94, ${style.bgOpacity})` }}
      >
        <Check
          className="w-5 h-5 text-white"
          style={{ transform: `scale(${style.scale}) rotate(${style.rotate}deg)` }}
        />
      </button>
      <span className="text-white/70">Click the checkbox</span>
    </div>
  )
}

// Demo: Loading Spinner
function LoadingSpinnerDemo() {
  const [isLoading, setIsLoading] = useState(true)
  const dots = [0, 1, 2]

  const trail = useTrail(dots.length, {
    y: isLoading ? -10 : 0,
    opacity: isLoading ? 1 : 0.3,
  }, { stiffness: 300, damping: 15 })

  useEffect(() => {
    if (!isLoading) return
    const interval = setInterval(() => {
      // Just trigger re-render to update animation
    }, 200)
    return () => clearInterval(interval)
  }, [isLoading])

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-2">
        {dots.map((_, i) => (
          <div
            key={i}
            className="w-4 h-4 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full"
            style={{
              transform: `translateY(${Math.sin(Date.now() / 200 + i * 0.5) * (isLoading ? 10 : 0)}px)`,
              opacity: trail[i]?.opacity ?? 1,
            }}
          />
        ))}
      </div>
      <button
        onClick={() => setIsLoading(!isLoading)}
        className={`px-4 py-2 rounded-lg text-sm font-medium ${
          isLoading ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/70'
        }`}
      >
        {isLoading ? 'Stop' : 'Start'}
      </button>
    </div>
  )
}

function ReactExamples() {
  return (
    <DocLayout
      title="React Examples"
      description="Interactive demos and common patterns"
      icon={Sparkles}
    >
      <DocSection title="useSpring - Toggle Animation">
        <p className="text-muted-foreground mb-4">
          Click the box to see spring-based scale, rotation and border-radius animations:
        </p>
        <Card>
          <CardContent className="pt-6">
            <UseSpringDemo />
          </CardContent>
        </Card>
        <Card className="mt-4">
          <CardContent className="pt-6">
            <CodeBlock code={`const [isOpen, setIsOpen] = useState(false)
const style = useSpring({
  scale: isOpen ? 1.2 : 1,
  rotate: isOpen ? 180 : 0,
  borderRadius: isOpen ? 50 : 12,
}, { stiffness: 200, damping: 15 })`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="useDrag - Draggable Element">
        <p className="text-muted-foreground mb-4">
          Drag the box around. Notice the rubber band effect when you drag beyond bounds:
        </p>
        <Card>
          <CardContent className="pt-6">
            <UseDragDemo />
          </CardContent>
        </Card>
        <Card className="mt-4">
          <CardContent className="pt-6">
            <CodeBlock code={`const [pos, api] = useDrag({
  bounds: { left: -100, right: 100, top: -50, bottom: 50 },
  rubberBand: true,
  rubberBandFactor: 0.2,
})`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="useTrail - Staggered List">
        <p className="text-muted-foreground mb-4">
          Toggle visibility to see staggered enter/exit animations:
        </p>
        <Card>
          <CardContent className="pt-6">
            <UseTrailDemo />
          </CardContent>
        </Card>
        <Card className="mt-4">
          <CardContent className="pt-6">
            <CodeBlock code={`const trail = useTrail(items.length, {
  opacity: show ? 1 : 0,
  x: show ? 0 : -30,
  scale: show ? 1 : 0.8,
}, { stiffness: 200, damping: 20 })`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Hover Cards">
        <p className="text-muted-foreground mb-4">
          Hover over the cards to see interactive spring animations:
        </p>
        <Card>
          <CardContent className="pt-6">
            <HoverCardsDemo />
          </CardContent>
        </Card>
        <Card className="mt-4">
          <CardContent className="pt-6">
            <CodeBlock code={`const style = useSpring({
  scale: isHovered ? 1.1 : 1,
  y: isHovered ? -8 : 0,
  rotate: isHovered ? -5 : 0,
}, { stiffness: 300, damping: 20 })`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Animated Counter">
        <p className="text-muted-foreground mb-4">
          Click the buttons to see smooth number transitions:
        </p>
        <Card>
          <CardContent className="pt-6">
            <AnimatedCounterDemo />
          </CardContent>
        </Card>
        <Card className="mt-4">
          <CardContent className="pt-6">
            <CodeBlock code={`const [count, setCount] = useState(0)
const displayValue = useSpring({ value: count }, { stiffness: 100, damping: 20 })

// In render:
<div>{Math.round(displayValue.value)}</div>`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Magnetic Button">
        <p className="text-muted-foreground mb-4">
          Move your mouse over the button to feel the magnetic attraction:
        </p>
        <Card>
          <CardContent className="pt-6">
            <MagneticButtonDemo />
          </CardContent>
        </Card>
        <Card className="mt-4">
          <CardContent className="pt-6">
            <CodeBlock code={`const springX = createSpringValue(0, {
  stiffness: 150,
  damping: 15,
  onUpdate: (v) => setOffset({ x: v })
})

const handleMouseMove = (e) => {
  const x = e.clientX - rect.left - rect.width / 2
  springX.set(x * 0.3)
}`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Animated Accordion">
        <p className="text-muted-foreground mb-4">
          Click items to expand/collapse with smooth spring animations:
        </p>
        <Card>
          <CardContent className="pt-6">
            <AccordionDemo />
          </CardContent>
        </Card>
        <Card className="mt-4">
          <CardContent className="pt-6">
            <CodeBlock code={`const style = useSpring({
  height: isOpen ? 80 : 0,
  opacity: isOpen ? 1 : 0,
  rotate: isOpen ? 90 : 0,
}, { stiffness: 200, damping: 20 })`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Animated Checkbox">
        <p className="text-muted-foreground mb-4">
          Click the checkbox to see a satisfying check animation:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CheckboxDemo />
          </CardContent>
        </Card>
        <Card className="mt-4">
          <CardContent className="pt-6">
            <CodeBlock code={`const style = useSpring({
  scale: checked ? 1 : 0,
  rotate: checked ? 0 : -90,
  bgOpacity: checked ? 1 : 0,
}, { stiffness: 300, damping: 20 })`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Loading Animation">
        <p className="text-muted-foreground mb-4">
          Simple bouncing dots loading indicator:
        </p>
        <Card>
          <CardContent className="pt-6">
            <LoadingSpinnerDemo />
          </CardContent>
        </Card>
      </DocSection>
    </DocLayout>
  )
}
