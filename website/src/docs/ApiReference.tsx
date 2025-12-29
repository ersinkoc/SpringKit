import { Routes, Route } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'

export function ApiReference() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-4">API Reference</h1>
        <p className="text-xl text-muted-foreground">
          Complete API documentation for all SpringKit functions and types.
        </p>
      </div>

      <Routes>
        <Route path="/" element={<ApiIndex />} />
        <Route path="/spring" element={<SpringApi />} />
        <Route path="/spring-value" element={<SpringValueApi />} />
        <Route path="/spring-group" element={<SpringGroupApi />} />
        <Route path="/interpolate" element={<InterpolateApi />} />
        <Route path="/types" element={<TypesApi />} />
      </Routes>
    </div>
  )
}

function ApiIndex() {
  const apis = [
    { name: 'spring()', path: '/docs/api/spring', desc: 'Create a spring animation' },
    { name: 'createSpringValue()', path: '/docs/api/spring-value', desc: 'Create an animated value' },
    { name: 'createSpringGroup()', path: '/docs/api/spring-group', desc: 'Create coordinated animations' },
    { name: 'interpolate()', path: '/docs/api/interpolate', desc: 'Map values to ranges' },
    { name: 'interpolateColor()', path: '/docs/api/interpolate', desc: 'Interpolate colors' },
    { name: 'sequence()', path: '/docs/api/interpolate', desc: 'Run animations sequentially' },
    { name: 'parallel()', path: '/docs/api/interpolate', desc: 'Run animations in parallel' },
    { name: 'stagger()', path: '/docs/api/interpolate', desc: 'Stagger animations' },
    { name: 'createTrail()', path: '/docs/api/interpolate', desc: 'Create trail effect' },
    { name: 'decay()', path: '/docs/api/interpolate', desc: 'Decay animation' },
    { name: 'createDragSpring()', path: '/docs/api/interpolate', desc: 'Drag interactions' },
    { name: 'createScrollSpring()', path: '/docs/api/interpolate', desc: 'Scroll interactions' },
  ]

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {apis.map((api) => (
        <a key={api.path} href={api.path}>
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <h3 className="font-mono font-bold mb-1">{api.name}</h3>
              <p className="text-sm text-muted-foreground">{api.desc}</p>
            </CardContent>
          </Card>
        </a>
      ))}
    </div>
  )
}

function SpringApi() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">spring()</h2>
      <Card>
        <CardContent className="pt-6">
          <pre className="bg-muted p-4 rounded-lg text-sm">
            <code>{`function spring(
  from: number,
  to: number,
  config?: SpringConfig
): SpringAnimation`}</code>
          </pre>
        </CardContent>
      </Card>

      <h3 className="text-xl font-bold">Methods</h3>
      <Card>
        <CardContent className="pt-6">
          <ul className="space-y-2 text-sm">
            <li><code>start()</code> - Start the animation</li>
            <li><code>stop()</code> - Stop immediately</li>
            <li><code>pause()</code> - Pause the animation</li>
            <li><code>resume()</code> - Resume paused animation</li>
            <li><code>reverse()</code> - Reverse direction</li>
            <li><code>set(to)</code> - Update target value</li>
            <li><code>getValue()</code> - Get current value</li>
            <li><code>getVelocity()</code> - Get current velocity</li>
            <li><code>isAnimating()</code> - Check if running</li>
            <li><code>isPaused()</code> - Check if paused</li>
            <li><code>isComplete()</code> - Check if complete</li>
            <li><code>finished</code> - Promise for completion</li>
            <li><code>destroy()</code> - Clean up</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

function SpringValueApi() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">createSpringValue()</h2>
      <Card>
        <CardContent className="pt-6">
          <pre className="bg-muted p-4 rounded-lg text-sm">
            <code>{`function createSpringValue(
  initial: number,
  config?: SpringConfig
): SpringValue`}</code>
          </pre>
        </CardContent>
      </Card>

      <h3 className="text-xl font-bold">Methods</h3>
      <Card>
        <CardContent className="pt-6">
          <ul className="space-y-2 text-sm">
            <li><code>get()</code> - Get current value</li>
            <li><code>getVelocity()</code> - Get current velocity</li>
            <li><code>set(to, config?)</code> - Animate to value</li>
            <li><code>jump(to)</code> - Set immediately</li>
            <li><code>subscribe(callback)</code> - Listen to changes</li>
            <li><code>isAnimating()</code> - Check if animating</li>
            <li><code>finished</code> - Promise for completion</li>
            <li><code>destroy()</code> - Clean up</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

function SpringGroupApi() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">createSpringGroup()</h2>
      <Card>
        <CardContent className="pt-6">
          <pre className="bg-muted p-4 rounded-lg text-sm">
            <code>{`function createSpringGroup<T extends Record<string, number>>(
  initialValues: T,
  config?: SpringConfig
): SpringGroup<T>`}</code>
          </pre>
        </CardContent>
      </Card>

      <h3 className="text-xl font-bold">Methods</h3>
      <Card>
        <CardContent className="pt-6">
          <ul className="space-y-2 text-sm">
            <li><code>get()</code> - Get all values</li>
            <li><code>getValue(key)</code> - Get single value</li>
            <li><code>set(values, config?)</code> - Animate to values</li>
            <li><code>jump(values)</code> - Set immediately</li>
            <li><code>subscribe(callback)</code> - Listen to changes</li>
            <li><code>isAnimating()</code> - Check if animating</li>
            <li><code>finished</code> - Promise for all complete</li>
            <li><code>destroy()</code> - Clean up</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

function InterpolateApi() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">interpolate()</h2>
      <Card>
        <CardContent className="pt-6">
          <pre className="bg-muted p-4 rounded-lg text-sm">
            <code>{`function interpolate(
  value: SpringValue | (() => number),
  input: number[],
  output: number[],
  options?: InterpolateOptions
): Interpolation`}</code>
          </pre>
        </CardContent>
      </Card>

      <h3 className="text-xl font-bold">Methods</h3>
      <Card>
        <CardContent className="pt-6">
          <ul className="space-y-2 text-sm">
            <li><code>get()</code> - Get interpolated value</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

function TypesApi() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Type Definitions</h2>

      <Card>
        <CardContent className="pt-6">
          <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
            <code>{`interface SpringConfig {
  stiffness?: number
  damping?: number
  mass?: number
  velocity?: number
  restSpeed?: number
  restDelta?: number
  clamp?: boolean
  onUpdate?: (value: number) => void
  onStart?: () => void
  onComplete?: () => void
  onRest?: () => void
}

interface SpringAnimation {
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
}

interface SpringValue {
  get(): number
  getVelocity(): number
  set(to: number, config?: SpringConfig): void
  jump(to: number): void
  subscribe(callback: (value: number) => void): () => void
  isAnimating(): boolean
  finished: Promise<void>
  destroy(): void
}

interface SpringGroup<T> {
  get(): T
  getValue(key: keyof T): number
  set(values: Partial<T>, config?: SpringConfig): void
  jump(values: Partial<T>): void
  subscribe(callback: (values: T) => void): () => void
  isAnimating(): boolean
  finished: Promise<void>
  destroy(): void
}`}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
