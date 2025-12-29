import { Routes, Route, Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { DocLayout, DocSection, CodeBlock } from '@/components/docs'
import { Book, FileType, Zap, Atom, Layers, Blend } from 'lucide-react'

export function ApiReference() {
  return (
    <Routes>
      <Route path="/" element={<ApiIndex />} />
      <Route path="/spring" element={<SpringApi />} />
      <Route path="/spring-value" element={<SpringValueApi />} />
      <Route path="/spring-group" element={<SpringGroupApi />} />
      <Route path="/interpolate" element={<InterpolateApi />} />
      <Route path="/types" element={<TypesApi />} />
    </Routes>
  )
}

function ApiIndex() {
  const apis = [
    { name: 'spring()', href: '/docs/api/spring', desc: 'Create a spring animation', icon: Zap },
    { name: 'createSpringValue()', href: '/docs/api/spring-value', desc: 'Create an animated value', icon: Atom },
    { name: 'createSpringGroup()', href: '/docs/api/spring-group', desc: 'Create coordinated animations', icon: Layers },
    { name: 'interpolate()', href: '/docs/api/interpolate', desc: 'Map values to ranges', icon: Blend },
    { name: 'Types', href: '/docs/api/types', desc: 'TypeScript type definitions', icon: FileType },
  ]

  return (
    <DocLayout
      title="API Reference"
      description="Complete API documentation for all SpringKit functions and types"
      icon={Book}
    >
      <div className="grid md:grid-cols-2 gap-4">
        {apis.map((api) => (
          <Link key={api.href} to={api.href}>
            <Card className="h-full group cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                    <api.icon className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-mono font-bold mb-1 text-white group-hover:text-orange-300 transition-colors">
                      {api.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{api.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <DocSection title="Other Functions">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            'interpolateColor()',
            'sequence()',
            'parallel()',
            'stagger()',
            'createTrail()',
            'decay()',
            'createDragSpring()',
            'createScrollSpring()',
          ].map((fn) => (
            <div key={fn} className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 font-mono text-sm text-orange-300">
              {fn}
            </div>
          ))}
        </div>
      </DocSection>
    </DocLayout>
  )
}

function SpringApi() {
  return (
    <DocLayout
      title="spring()"
      description="Create a one-time spring animation"
      icon={Zap}
    >
      <DocSection title="Signature">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`function spring(
  from: number,
  to: number,
  config?: SpringConfig
): SpringAnimation`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Methods">
        <div className="grid gap-3">
          {[
            { method: 'start()', desc: 'Start the animation' },
            { method: 'stop()', desc: 'Stop immediately' },
            { method: 'pause()', desc: 'Pause the animation' },
            { method: 'resume()', desc: 'Resume paused animation' },
            { method: 'reverse()', desc: 'Reverse direction' },
            { method: 'set(to)', desc: 'Update target value' },
            { method: 'getValue()', desc: 'Get current value' },
            { method: 'getVelocity()', desc: 'Get current velocity' },
            { method: 'isAnimating()', desc: 'Check if running' },
            { method: 'isPaused()', desc: 'Check if paused' },
            { method: 'isComplete()', desc: 'Check if complete' },
            { method: 'finished', desc: 'Promise for completion' },
            { method: 'destroy()', desc: 'Clean up' },
          ].map((item) => (
            <div key={item.method} className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10">
              <code className="text-orange-300 font-mono text-sm">{item.method}</code>
              <span className="text-muted-foreground text-sm">{item.desc}</span>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="Example">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { spring } from '@oxog/springkit'

const anim = spring(0, 100, {
  stiffness: 200,
  damping: 20,
  onUpdate: (value) => {
    element.style.transform = \`translateX(\${value}px)\`
  },
  onComplete: () => {
    console.log('Done!')
  }
})

anim.start()

// Later...
await anim.finished`} />
          </CardContent>
        </Card>
      </DocSection>
    </DocLayout>
  )
}

function SpringValueApi() {
  return (
    <DocLayout
      title="createSpringValue()"
      description="Create an animated value that can be updated over time"
      icon={Atom}
    >
      <DocSection title="Signature">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`function createSpringValue(
  initial: number,
  config?: SpringConfig
): SpringValue`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Methods">
        <div className="grid gap-3">
          {[
            { method: 'get()', desc: 'Get current value' },
            { method: 'getVelocity()', desc: 'Get current velocity' },
            { method: 'set(to, config?)', desc: 'Animate to value' },
            { method: 'jump(to)', desc: 'Set immediately' },
            { method: 'subscribe(callback)', desc: 'Listen to changes' },
            { method: 'isAnimating()', desc: 'Check if animating' },
            { method: 'finished', desc: 'Promise for completion' },
            { method: 'destroy()', desc: 'Clean up' },
          ].map((item) => (
            <div key={item.method} className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10">
              <code className="text-orange-300 font-mono text-sm">{item.method}</code>
              <span className="text-muted-foreground text-sm">{item.desc}</span>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="Example">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { createSpringValue } from '@oxog/springkit'

const x = createSpringValue(0, {
  stiffness: 100,
  damping: 10,
})

// Subscribe to changes
const unsubscribe = x.subscribe((value) => {
  element.style.transform = \`translateX(\${value}px)\`
})

// Animate to new value
x.set(100)

// Jump immediately
x.jump(50)

// Cleanup
x.destroy()`} />
          </CardContent>
        </Card>
      </DocSection>
    </DocLayout>
  )
}

function SpringGroupApi() {
  return (
    <DocLayout
      title="createSpringGroup()"
      description="Animate multiple values together"
      icon={Layers}
    >
      <DocSection title="Signature">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`function createSpringGroup<T extends Record<string, number>>(
  initialValues: T,
  config?: SpringConfig
): SpringGroup<T>`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Methods">
        <div className="grid gap-3">
          {[
            { method: 'get()', desc: 'Get all values' },
            { method: 'getValue(key)', desc: 'Get single value' },
            { method: 'set(values, config?)', desc: 'Animate to values' },
            { method: 'jump(values)', desc: 'Set immediately' },
            { method: 'subscribe(callback)', desc: 'Listen to changes' },
            { method: 'isAnimating()', desc: 'Check if animating' },
            { method: 'finished', desc: 'Promise for all complete' },
            { method: 'destroy()', desc: 'Clean up' },
          ].map((item) => (
            <div key={item.method} className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10">
              <code className="text-orange-300 font-mono text-sm">{item.method}</code>
              <span className="text-muted-foreground text-sm">{item.desc}</span>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="Example">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { createSpringGroup } from '@oxog/springkit'

const group = createSpringGroup({
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0,
}, { stiffness: 100, damping: 10 })

group.subscribe((values) => {
  element.style.transform = \`
    translate(\${values.x}px, \${values.y}px)
    scale(\${values.scale})
    rotate(\${values.rotation}deg)
  \`
})

// Animate multiple values
group.set({ x: 100, y: 50, scale: 1.2 })

// Animate single value
group.set({ rotation: 45 })`} />
          </CardContent>
        </Card>
      </DocSection>
    </DocLayout>
  )
}

function InterpolateApi() {
  return (
    <DocLayout
      title="interpolate()"
      description="Map values from one range to another"
      icon={Blend}
    >
      <DocSection title="Signature">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`function interpolate(
  value: SpringValue | (() => number),
  input: number[],
  output: number[],
  options?: InterpolateOptions
): Interpolation`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Options">
        <div className="grid gap-3">
          {[
            { option: 'extrapolate', desc: '"clamp" | "identity" | "extend"' },
            { option: 'extrapolateLeft', desc: 'Extrapolation for values below input range' },
            { option: 'extrapolateRight', desc: 'Extrapolation for values above input range' },
          ].map((item) => (
            <div key={item.option} className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10">
              <code className="text-orange-300 font-mono text-sm">{item.option}</code>
              <span className="text-muted-foreground text-sm">{item.desc}</span>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="Example">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { createSpringValue, interpolate } from '@oxog/springkit'

const progress = createSpringValue(0)

// Map 0-100 to 0-1 for opacity
const opacity = interpolate(progress, [0, 100], [0, 1])

// Multi-point interpolation for scale
const scale = interpolate(progress, [0, 50, 100], [1, 1.5, 1])

progress.subscribe(() => {
  element.style.opacity = String(opacity.get())
  element.style.transform = \`scale(\${scale.get()})\`
})

progress.set(100)`} />
          </CardContent>
        </Card>
      </DocSection>
    </DocLayout>
  )
}

function TypesApi() {
  return (
    <DocLayout
      title="Type Definitions"
      description="TypeScript interfaces and types"
      icon={FileType}
    >
      <DocSection title="SpringConfig">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`interface SpringConfig {
  stiffness?: number      // Default: 100
  damping?: number        // Default: 10
  mass?: number           // Default: 1
  velocity?: number       // Default: 0
  restSpeed?: number      // Default: 0.01
  restDelta?: number      // Default: 0.01
  clamp?: boolean         // Default: false

  // Callbacks
  onUpdate?: (value: number) => void
  onStart?: () => void
  onComplete?: () => void
  onRest?: () => void
}`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="SpringAnimation">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`interface SpringAnimation {
  start(): SpringAnimation
  stop(): void
  pause(): void
  resume(): void
  reverse(): void
  set(to: number): void
  isAnimating(): boolean
  isPaused(): boolean
  isComplete(): boolean
  getValue(): number
  getVelocity(): number
  finished: Promise<void>
  destroy(): void
}`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="SpringValue">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`interface SpringValue {
  get(): number
  getVelocity(): number
  set(to: number, config?: SpringConfig): void
  jump(to: number): void
  subscribe(callback: (value: number) => void): () => void
  isAnimating(): boolean
  finished: Promise<void>
  destroy(): void
}`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="SpringGroup">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`interface SpringGroup<T extends Record<string, number>> {
  get(): T
  getValue(key: keyof T): number
  set(values: Partial<T>, config?: SpringConfig): void
  jump(values: Partial<T>): void
  subscribe(callback: (values: T) => void): () => void
  isAnimating(): boolean
  finished: Promise<void>
  destroy(): void
}`} />
          </CardContent>
        </Card>
      </DocSection>
    </DocLayout>
  )
}
