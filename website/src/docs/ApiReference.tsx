import { Routes, Route, Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { DocLayout, DocSection, CodeBlock } from '@/components/docs'
import { Book, FileType, Zap, Atom, Layers, Blend, Play, RotateCcw, Box, Activity, Eye, Gauge, MousePointer2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { spring, createSpringValue, createSpringGroup, interpolate, createMotionValue, transformValue } from '@oxog/springkit'

export function ApiReference() {
  return (
    <Routes>
      <Route path="/" element={<ApiIndex />} />
      <Route path="/spring" element={<SpringApi />} />
      <Route path="/spring-value" element={<SpringValueApi />} />
      <Route path="/spring-group" element={<SpringGroupApi />} />
      <Route path="/interpolate" element={<InterpolateApi />} />
      <Route path="/motion-value" element={<MotionValueApi />} />
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
    { name: 'MotionValue', href: '/docs/api/motion-value', desc: 'High-performance animated values', icon: Activity },
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

      <DocSection title="Animation Functions">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            'interpolateColor()',
            'sequence()',
            'parallel()',
            'stagger()',
            'createTrail()',
            'decay()',
            'keyframes()',
            'createDragSpring()',
            'createScrollSpring()',
          ].map((fn) => (
            <div key={fn} className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 font-mono text-sm text-orange-300">
              {fn}
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="SVG Animations">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            'createPathAnimation()',
            'getPathLength()',
            'preparePathForAnimation()',
            'getPointAtProgress()',
          ].map((fn) => (
            <div key={fn} className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 font-mono text-sm text-cyan-300">
              {fn}
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="Layout Animations (FLIP)">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            'createFlip()',
            'flip()',
            'flipBatch()',
            'measureElement()',
          ].map((fn) => (
            <div key={fn} className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 font-mono text-sm text-amber-300">
              {fn}
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="MotionValue Functions">
        <p className="text-muted-foreground mb-4">
          High-performance animated values that update without React re-renders:
        </p>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            { fn: 'createMotionValue(initial, options?)', desc: 'Create a MotionValue instance' },
            { fn: 'transformValue(source, transform)', desc: 'Create a derived MotionValue' },
            { fn: 'motionMapRange(source, input, output)', desc: 'Map MotionValue to range' },
          ].map((item) => (
            <div key={item.fn} className="p-3 rounded-lg bg-white/5 border border-white/10">
              <code className="font-mono text-sm text-orange-300 block mb-1">{item.fn}</code>
              <span className="text-muted-foreground text-xs">{item.desc}</span>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="Physics Utilities">
        <p className="text-muted-foreground mb-4">
          Helper functions for analyzing spring behavior:
        </p>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            { fn: 'calculateDampingRatio(damping, stiffness, mass)', desc: 'Calculate damping ratio (ζ)' },
            { fn: 'isUnderdamped(config)', desc: 'Check if spring will oscillate (ζ < 1)' },
            { fn: 'isOverdamped(config)', desc: 'Check if spring is sluggish (ζ > 1)' },
            { fn: 'isCriticallyDamped(config)', desc: 'Check if spring is critically damped (ζ ≈ 1)' },
          ].map((item) => (
            <div key={item.fn} className="p-3 rounded-lg bg-white/5 border border-white/10">
              <code className="font-mono text-sm text-orange-300 block mb-1">{item.fn}</code>
              <span className="text-muted-foreground text-xs">{item.desc}</span>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="Global Loop">
        <p className="text-muted-foreground mb-4">
          Access the global animation loop for monitoring and debugging:
        </p>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            { fn: 'globalLoop.onFrame(callback)', desc: 'Subscribe to frame updates with delta time' },
            { fn: 'globalLoop.getFPS()', desc: 'Get current frame rate' },
            { fn: 'globalLoop.getAliveCount()', desc: 'Get number of active animations' },
            { fn: 'globalLoop.size', desc: 'Total animations in loop' },
          ].map((item) => (
            <div key={item.fn} className="p-3 rounded-lg bg-white/5 border border-white/10">
              <code className="font-mono text-sm text-orange-300 block mb-1">{item.fn}</code>
              <span className="text-muted-foreground text-xs">{item.desc}</span>
            </div>
          ))}
        </div>
      </DocSection>
    </DocLayout>
  )
}

// ============================================================================
// INTERACTIVE API DEMOS
// ============================================================================

function SpringDemo() {
  const boxRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<ReturnType<typeof spring> | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [value, setValue] = useState(0)

  const runAnimation = () => {
    if (!boxRef.current || isAnimating) return
    setIsAnimating(true)

    boxRef.current.style.transform = 'translateX(0)'
    setValue(0)

    animRef.current?.stop()
    animRef.current = spring(0, 200, {
      stiffness: 180,
      damping: 20,
      onUpdate: (v) => {
        if (boxRef.current) boxRef.current.style.transform = `translateX(${v}px)`
        setValue(v)
      },
      onComplete: () => setIsAnimating(false)
    })
    animRef.current.start()
  }

  const reset = () => {
    animRef.current?.stop()
    if (boxRef.current) boxRef.current.style.transform = 'translateX(0)'
    setValue(0)
    setIsAnimating(false)
  }

  return (
    <div className="space-y-4">
      <div className="h-20 bg-black/20 rounded-xl relative overflow-hidden">
        <div className="absolute right-4 top-0 bottom-0 w-px bg-orange-500/30" />
        <div className="absolute right-3 top-2 text-[10px] text-orange-400/50">target</div>
        <div
          ref={boxRef}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl shadow-lg flex items-center justify-center"
        >
          <Box className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-sm font-mono text-white/50">
          Value: <span className="text-orange-400">{value.toFixed(1)}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={runAnimation}
            disabled={isAnimating}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg"
          >
            <Play className="w-4 h-4" />
            Run
          </button>
          <button onClick={reset} className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function SpringValueDemo() {
  const [position, setPosition] = useState(0)
  const springRef = useRef<ReturnType<typeof createSpringValue> | null>(null)

  useEffect(() => {
    springRef.current = createSpringValue(0, {
      stiffness: 150,
      damping: 15,
      onUpdate: setPosition
    })
    return () => springRef.current?.destroy()
  }, [])

  const moveTo = (target: number) => springRef.current?.set(target)
  const jumpTo = (target: number) => springRef.current?.jump(target)

  return (
    <div className="space-y-4">
      <div className="h-16 bg-black/20 rounded-xl relative overflow-hidden">
        {[0, 100, 200, 300].map(pos => (
          <div key={pos} className="absolute top-0 bottom-0 w-px bg-white/10" style={{ left: `${(pos / 300) * 100}%` }} />
        ))}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg shadow-lg flex items-center justify-center"
          style={{ left: `calc(${(position / 300) * 100}% - 20px)` }}
        >
          <Atom className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-sm font-mono text-white/50">
          Position: <span className="text-cyan-400">{position.toFixed(0)}</span>
        </div>
        <div className="flex gap-2">
          {[0, 100, 200, 300].map(target => (
            <button
              key={target}
              onClick={() => moveTo(target)}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 text-sm rounded-lg font-mono"
            >
              {target}
            </button>
          ))}
          <button
            onClick={() => jumpTo(0)}
            className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-sm rounded-lg"
          >
            Jump 0
          </button>
        </div>
      </div>
    </div>
  )
}

function SpringGroupDemo() {
  const [values, setValues] = useState({ x: 0, y: 0, scale: 1, rotate: 0 })
  const groupRef = useRef<ReturnType<typeof createSpringGroup<typeof values>> | null>(null)

  useEffect(() => {
    groupRef.current = createSpringGroup(
      { x: 0, y: 0, scale: 1, rotate: 0 },
      { stiffness: 200, damping: 20 }
    )
    groupRef.current.subscribe(setValues)
    return () => groupRef.current?.destroy()
  }, [])

  const presets = [
    { name: 'Center', values: { x: 0, y: 0, scale: 1, rotate: 0 } },
    { name: 'Right', values: { x: 80, y: 0, scale: 1, rotate: 0 } },
    { name: 'Scaled', values: { x: 0, y: 0, scale: 1.5, rotate: 0 } },
    { name: 'Rotated', values: { x: 0, y: 0, scale: 1, rotate: 45 } },
    { name: 'Complex', values: { x: 50, y: -20, scale: 1.2, rotate: 15 } },
  ]

  return (
    <div className="space-y-4">
      <div className="h-32 bg-black/20 rounded-xl relative overflow-hidden flex items-center justify-center">
        <div
          className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl shadow-lg flex items-center justify-center"
          style={{
            transform: `translate(${values.x}px, ${values.y}px) scale(${values.scale}) rotate(${values.rotate}deg)`
          }}
        >
          <Layers className="w-7 h-7 text-white" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {presets.map(preset => (
          <button
            key={preset.name}
            onClick={() => groupRef.current?.set(preset.values)}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 text-sm rounded-lg"
          >
            {preset.name}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2 text-xs font-mono text-white/50">
        <div>x: <span className="text-violet-400">{values.x.toFixed(0)}</span></div>
        <div>y: <span className="text-violet-400">{values.y.toFixed(0)}</span></div>
        <div>scale: <span className="text-violet-400">{values.scale.toFixed(2)}</span></div>
        <div>rotate: <span className="text-violet-400">{values.rotate.toFixed(0)}°</span></div>
      </div>
    </div>
  )
}

function InterpolateDemo() {
  const [progress, setProgress] = useState(0)
  const springRef = useRef<ReturnType<typeof createSpringValue> | null>(null)
  const interpOpacity = useRef<ReturnType<typeof interpolate> | null>(null)
  const interpScale = useRef<ReturnType<typeof interpolate> | null>(null)
  const interpHue = useRef<ReturnType<typeof interpolate> | null>(null)

  useEffect(() => {
    springRef.current = createSpringValue(0, { stiffness: 100, damping: 15 })
    interpOpacity.current = interpolate(springRef.current, [0, 100], [0.3, 1])
    interpScale.current = interpolate(springRef.current, [0, 50, 100], [1, 1.3, 1])
    interpHue.current = interpolate(springRef.current, [0, 100], [0, 360])

    springRef.current.subscribe((v) => setProgress(v))
    return () => springRef.current?.destroy()
  }, [])

  const opacity = interpOpacity.current?.get() ?? 0.3
  const scale = interpScale.current?.get() ?? 1
  const hue = interpHue.current?.get() ?? 0

  return (
    <div className="space-y-4">
      <div className="h-32 bg-black/20 rounded-xl flex items-center justify-center">
        <div
          className="w-20 h-20 rounded-2xl shadow-lg flex items-center justify-center"
          style={{
            opacity,
            transform: `scale(${scale})`,
            backgroundColor: `hsl(${hue}, 70%, 50%)`,
          }}
        >
          <Blend className="w-8 h-8 text-white" />
        </div>
      </div>
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-white/50">Progress</span>
          <span className="font-mono text-emerald-400">{progress.toFixed(0)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={(e) => springRef.current?.set(Number(e.target.value))}
          className="w-full"
        />
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs font-mono text-white/50">
        <div>opacity: <span className="text-emerald-400">{opacity.toFixed(2)}</span></div>
        <div>scale: <span className="text-emerald-400">{scale.toFixed(2)}</span></div>
        <div>hue: <span className="text-emerald-400">{hue.toFixed(0)}°</span></div>
      </div>
    </div>
  )
}

function SpringApi() {
  return (
    <DocLayout
      title="spring()"
      description="Create a one-time spring animation"
      icon={Zap}
    >
      <DocSection title="Interactive Demo">
        <p className="text-muted-foreground mb-4">
          Click Run to see a spring animation in action:
        </p>
        <Card>
          <CardContent className="pt-6">
            <SpringDemo />
          </CardContent>
        </Card>
      </DocSection>

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
      <DocSection title="Interactive Demo">
        <p className="text-muted-foreground mb-4">
          Click the position buttons to animate, or use Jump to set immediately:
        </p>
        <Card>
          <CardContent className="pt-6">
            <SpringValueDemo />
          </CardContent>
        </Card>
      </DocSection>

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
      <DocSection title="Interactive Demo">
        <p className="text-muted-foreground mb-4">
          Click presets to animate multiple properties simultaneously:
        </p>
        <Card>
          <CardContent className="pt-6">
            <SpringGroupDemo />
          </CardContent>
        </Card>
      </DocSection>

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
      <DocSection title="Interactive Demo">
        <p className="text-muted-foreground mb-4">
          Drag the slider to see how interpolation maps progress to opacity, scale, and color:
        </p>
        <Card>
          <CardContent className="pt-6">
            <InterpolateDemo />
          </CardContent>
        </Card>
      </DocSection>

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

function MotionValueApi() {
  const boxRef = useRef<HTMLDivElement>(null)
  const motionValueRef = useRef<ReturnType<typeof createMotionValue> | null>(null)
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    motionValueRef.current = createMotionValue(0, {
      spring: { stiffness: 200, damping: 20 }
    })
    motionValueRef.current.subscribe((v) => {
      setDisplayValue(v)
      if (boxRef.current) {
        boxRef.current.style.transform = `translateX(${v}px)`
      }
    })
    return () => motionValueRef.current?.destroy()
  }, [])

  return (
    <DocLayout
      title="MotionValue"
      description="High-performance animated values without React re-renders"
      icon={Activity}
    >
      <DocSection title="Overview">
        <p className="text-muted-foreground">
          MotionValue is designed for high-frequency animations where React's state updates would cause performance issues.
          Unlike useState, MotionValue updates don't trigger re-renders - they directly manipulate the DOM for smooth 60fps animations.
        </p>
      </DocSection>

      <DocSection title="Interactive Demo">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => motionValueRef.current?.set(200)}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium"
              >
                Animate to 200
              </button>
              <button
                onClick={() => motionValueRef.current?.set(0)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium"
              >
                Reset to 0
              </button>
              <button
                onClick={() => motionValueRef.current?.jump(100)}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium"
              >
                Jump to 100
              </button>
            </div>
            <div className="h-16 bg-black/20 rounded-lg relative overflow-hidden">
              <div
                ref={boxRef}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg"
              >
                {displayValue.toFixed(0)}
              </div>
            </div>
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="createMotionValue()">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { createMotionValue } from '@oxog/springkit'

// Create a basic MotionValue
const x = createMotionValue(0)

// With spring configuration
const scale = createMotionValue(1, {
  spring: { stiffness: 300, damping: 30 }
})

// Subscribe to changes (no React re-render!)
x.subscribe((value) => {
  element.style.transform = \`translateX(\${value}px)\`
})

// Animate to new value with spring physics
x.set(100)

// Jump instantly without animation
x.jump(50)

// Stop current animation
x.stop()

// Get current value and velocity
console.log(x.get())         // Current value
console.log(x.getVelocity()) // Current velocity
console.log(x.isAnimating()) // Is animation running?

// Listen to events
x.on('animationStart', () => console.log('Started!'))
x.on('animationEnd', () => console.log('Ended!'))
x.on('change', () => console.log('Changed!'))

// Cleanup
x.destroy()`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="transformValue()">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { createMotionValue, transformValue } from '@oxog/springkit'

const x = createMotionValue(0)

// Create derived values
const opacity = transformValue(x, v => 1 - v / 100)
const rotate = transformValue(x, v => v * 0.5)
const color = transformValue(x, v =>
  v < 50 ? '#ef4444' : '#22c55e'
)

// Derived values auto-update when source changes
x.set(100)
console.log(opacity.get()) // 0
console.log(rotate.get())  // 50`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="motionMapRange()">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { createMotionValue, motionMapRange } from '@oxog/springkit'

const scrollY = createMotionValue(0)

// Map scroll (0-500) to opacity (1-0)
const opacity = motionMapRange(
  scrollY,
  [0, 500],   // input range
  [1, 0]      // output range
)

// With clamping (no extrapolation)
const progress = motionMapRange(
  scrollY,
  [0, 500],
  [0, 1],
  { clamp: true }
)`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="MotionValue Methods">
        <div className="grid md:grid-cols-2 gap-3">
          {[
            { method: 'get()', desc: 'Get current value synchronously' },
            { method: 'set(value, animate?)', desc: 'Set value with optional animation' },
            { method: 'jump(value)', desc: 'Instantly set value without animation' },
            { method: 'stop()', desc: 'Stop running animation' },
            { method: 'getVelocity()', desc: 'Get current velocity' },
            { method: 'isAnimating()', desc: 'Check if animating' },
            { method: 'subscribe(callback)', desc: 'Subscribe to value changes' },
            { method: 'on(event, callback)', desc: 'Listen to events' },
            { method: 'setConfig(config)', desc: 'Update spring configuration' },
            { method: 'destroy()', desc: 'Cleanup and dispose' },
          ].map((item) => (
            <div key={item.method} className="p-3 rounded-lg bg-white/5 border border-white/10">
              <code className="font-mono text-sm text-orange-300 block mb-1">{item.method}</code>
              <span className="text-muted-foreground text-xs">{item.desc}</span>
            </div>
          ))}
        </div>
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
