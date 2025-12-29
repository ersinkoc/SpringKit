import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Play, RotateCcw, GripVertical, ChevronRight, Sparkles, Layers, Zap, MousePointer2, ArrowRight } from 'lucide-react'
import { useSpring, useDrag, useTrail } from '@oxog/springkit/react'
import {
  spring,
  springPresets,
  createSpringValue,
  decay,
  sequence,
  parallel,
  stagger,
  configFromBounce
} from '@oxog/springkit'

// ============ 1. Spring Physics Visualizer ============

function PhysicsVisualizer() {
  const [stiffness, setStiffness] = useState(170)
  const [damping, setDamping] = useState(26)
  const [mass, setMass] = useState(1)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const springRef = useRef<ReturnType<typeof createSpringValue> | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  // Draw spring curve
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    ctx.clearRect(0, 0, width, height)

    // Draw grid
    ctx.strokeStyle = '#27272a'
    ctx.lineWidth = 1
    for (let i = 0; i <= 10; i++) {
      ctx.beginPath()
      ctx.moveTo(i * width / 10, 0)
      ctx.lineTo(i * width / 10, height)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i * height / 10)
      ctx.lineTo(width, i * height / 10)
      ctx.stroke()
    }

    // Simulate spring
    const points: { x: number; y: number }[] = []
    let position = 0
    let velocity = 0
    const target = 1
    const dt = 1 / 60
    const duration = 2

    for (let t = 0; t < duration; t += dt) {
      const force = stiffness * (target - position)
      const dampingForce = damping * velocity
      const acceleration = (force - dampingForce) / mass
      velocity += acceleration * dt
      position += velocity * dt
      points.push({
        x: (t / duration) * width,
        y: height - (position * height * 0.8) - height * 0.1
      })
    }

    // Draw curve
    ctx.strokeStyle = '#f97316'
    ctx.lineWidth = 2
    ctx.beginPath()
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    })
    ctx.stroke()

    // Draw target line
    ctx.strokeStyle = '#3b82f6'
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(0, height * 0.1)
    ctx.lineTo(width, height * 0.1)
    ctx.stroke()
    ctx.setLineDash([])
  }, [stiffness, damping, mass])

  const runAnimation = () => {
    if (!boxRef.current || isAnimating) return
    setIsAnimating(true)

    boxRef.current.style.transform = 'translateX(0)'

    springRef.current?.destroy()
    springRef.current = createSpringValue(0, {
      stiffness,
      damping,
      mass,
      onUpdate: v => {
        if (boxRef.current) boxRef.current.style.transform = `translateX(${v}px)`
      },
      onComplete: () => setIsAnimating(false)
    })
    springRef.current.set(200)
  }

  return (
    <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-orange-500" />
        <h3 className="text-lg font-semibold text-white">Spring Physics</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <canvas
            ref={canvasRef}
            width={300}
            height={150}
            className="w-full bg-zinc-950 rounded-lg mb-4"
          />

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-400">Stiffness</span>
                <span className="font-mono text-orange-500">{stiffness}</span>
              </div>
              <input type="range" min="50" max="500" value={stiffness}
                onChange={e => setStiffness(Number(e.target.value))}
                className="w-full accent-orange-500 h-1" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-400">Damping</span>
                <span className="font-mono text-orange-500">{damping}</span>
              </div>
              <input type="range" min="1" max="100" value={damping}
                onChange={e => setDamping(Number(e.target.value))}
                className="w-full accent-orange-500 h-1" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-400">Mass</span>
                <span className="font-mono text-orange-500">{mass}</span>
              </div>
              <input type="range" min="0.1" max="5" step="0.1" value={mass}
                onChange={e => setMass(Number(e.target.value))}
                className="w-full accent-orange-500 h-1" />
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex-1 bg-zinc-800/30 rounded-xl relative overflow-hidden mb-4">
            <div className="absolute right-4 top-0 bottom-0 w-px bg-blue-500/50" />
            <div
              ref={boxRef}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl shadow-lg shadow-orange-500/30"
            />
          </div>
          <button
            onClick={runAnimation}
            disabled={isAnimating}
            className="flex items-center justify-center gap-2 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
          >
            <Play className="w-4 h-4" />
            Animate
          </button>
        </div>
      </div>
    </div>
  )
}

// ============ 2. Trail Animation (Staggered) ============

function TrailDemo() {
  const [show, setShow] = useState(true)
  const items = ['Spring', 'Physics', 'Animation', 'Library', 'React']

  const trail = useTrail(items.length, {
    opacity: show ? 1 : 0,
    x: show ? 0 : -50,
    scale: show ? 1 : 0.8,
  }, { stiffness: 200, damping: 20 })

  return (
    <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-violet-500" />
          <h3 className="text-lg font-semibold text-white">useTrail - Staggered Animation</h3>
        </div>
        <button
          onClick={() => setShow(!show)}
          className="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {show ? 'Hide' : 'Show'}
        </button>
      </div>

      <div className="space-y-2 min-h-[200px]">
        {items.map((item, i) => (
          <div
            key={item}
            className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg"
            style={{
              opacity: trail[i]?.opacity ?? 0,
              transform: `translateX(${trail[i]?.x ?? 0}px) scale(${trail[i]?.scale ?? 1})`,
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: `hsl(${260 + i * 20}, 70%, 50%)` }}
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

// ============ 3. Orchestration (Sequence & Parallel) ============

function OrchestrationDemo() {
  const boxRefs = useRef<(HTMLDivElement | null)[]>([])
  const [mode, setMode] = useState<'sequence' | 'parallel' | 'stagger'>('sequence')
  const [isRunning, setIsRunning] = useState(false)

  const runAnimation = async () => {
    if (isRunning) return
    setIsRunning(true)

    // Reset
    boxRefs.current.forEach(box => {
      if (box) box.style.transform = 'translateX(0)'
    })

    const createAnim = (index: number) => () => {
      return spring(0, 200, {
        stiffness: 180,
        damping: 20,
        onUpdate: v => {
          const box = boxRefs.current[index]
          if (box) box.style.transform = `translateX(${v}px)`
        }
      }).start()
    }

    try {
      if (mode === 'sequence') {
        await sequence([createAnim(0), createAnim(1), createAnim(2)])
      } else if (mode === 'parallel') {
        await parallel([createAnim(0), createAnim(1), createAnim(2)])
      } else {
        // Stagger with manual delays
        const boxes = boxRefs.current.filter(Boolean) as HTMLDivElement[]
        await stagger(boxes, (box, index) => {
          return spring(0, 200, {
            stiffness: 180,
            damping: 20,
            onUpdate: v => { box.style.transform = `translateX(${v}px)` }
          }).start()
        }, { delay: 100 })
      }
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-emerald-500" />
        <h3 className="text-lg font-semibold text-white">Orchestration</h3>
      </div>

      <div className="flex gap-2 mb-4">
        {(['sequence', 'parallel', 'stagger'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              mode === m
                ? 'bg-emerald-500 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="space-y-3 mb-4">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-10 bg-zinc-800/30 rounded-lg relative overflow-hidden">
            <div
              ref={el => { boxRefs.current[i] = el }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg"
              style={{
                backgroundColor: ['#10b981', '#22d3ee', '#a78bfa'][i],
                boxShadow: `0 4px 20px ${['#10b98140', '#22d3ee40', '#a78bfa40'][i]}`
              }}
            />
          </div>
        ))}
      </div>

      <button
        onClick={runAnimation}
        disabled={isRunning}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
      >
        <Play className="w-4 h-4" />
        Run {mode}
      </button>
    </div>
  )
}

// ============ 4. Interactive Drag with Bounds ============

function AdvancedDragDemo() {
  const [pos, api] = useDrag({
    bounds: { left: -140, right: 140, top: -70, bottom: 70 },
    rubberBand: true,
    rubberBandFactor: 0.15,
  })

  const bgStyle = useSpring({
    scale: api.isDragging ? 1.02 : 1,
    borderOpacity: api.isDragging ? 1 : 0.3,
  }, { stiffness: 400, damping: 30 })

  return (
    <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
      <div className="flex items-center gap-2 mb-4">
        <MousePointer2 className="w-5 h-5 text-cyan-500" />
        <h3 className="text-lg font-semibold text-white">Drag with Rubber Band</h3>
      </div>

      <div
        className="h-48 bg-zinc-800/30 rounded-xl relative overflow-hidden transition-transform"
        style={{
          transform: `scale(${bgStyle.scale})`,
          borderColor: `rgba(6, 182, 212, ${bgStyle.borderOpacity})`,
          borderWidth: 2,
          borderStyle: 'solid'
        }}
      >
        {/* Bounds indicator */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-36 border border-dashed border-zinc-700 rounded-lg" />

        <div
          ref={api.ref}
          className="absolute left-1/2 top-1/2 -ml-8 -mt-8 w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl cursor-grab active:cursor-grabbing flex items-center justify-center shadow-lg shadow-cyan-500/30 select-none"
          style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
        >
          <GripVertical className="w-6 h-6 text-white" />
        </div>
      </div>

      <div className="flex justify-center gap-6 mt-4 text-sm font-mono">
        <span className="text-zinc-400">x: <span className="text-cyan-400">{pos.x.toFixed(0)}</span></span>
        <span className="text-zinc-400">y: <span className="text-cyan-400">{pos.y.toFixed(0)}</span></span>
        <span className="text-zinc-400">dragging: <span className="text-cyan-400">{api.isDragging ? 'yes' : 'no'}</span></span>
      </div>
    </div>
  )
}

// ============ 5. Color Interpolation ============

function ColorInterpolationDemo() {
  const [progress, setProgress] = useState(0)
  const springRef = useRef<ReturnType<typeof createSpringValue> | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  const colors = ['#f97316', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981']

  // Simple color lerp
  const lerpColor = (c1: string, c2: string, t: number) => {
    const r1 = parseInt(c1.slice(1, 3), 16)
    const g1 = parseInt(c1.slice(3, 5), 16)
    const b1 = parseInt(c1.slice(5, 7), 16)
    const r2 = parseInt(c2.slice(1, 3), 16)
    const g2 = parseInt(c2.slice(3, 5), 16)
    const b2 = parseInt(c2.slice(5, 7), 16)
    const r = Math.round(r1 + (r2 - r1) * t)
    const g = Math.round(g1 + (g2 - g1) * t)
    const b = Math.round(b1 + (b2 - b1) * t)
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  const getColor = (p: number) => {
    const segment = p * (colors.length - 1)
    const i = Math.min(Math.floor(segment), colors.length - 2)
    const t = segment - i
    return lerpColor(colors[i], colors[i + 1], t)
  }

  const currentColor = getColor(progress)

  const animate = () => {
    if (isAnimating) return
    setIsAnimating(true)

    springRef.current?.destroy()
    springRef.current = createSpringValue(progress, {
      stiffness: 100,
      damping: 15,
      onUpdate: v => setProgress(Math.max(0, Math.min(1, v))),
      onComplete: () => setIsAnimating(false)
    })
    springRef.current.set(progress < 0.5 ? 1 : 0)
  }

  return (
    <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-5 rounded-full" style={{ background: 'linear-gradient(90deg, #f97316, #ec4899, #8b5cf6, #3b82f6, #10b981)' }} />
        <h3 className="text-lg font-semibold text-white">Color Interpolation</h3>
      </div>

      <div
        className="h-32 rounded-xl mb-4 flex items-center justify-center transition-shadow"
        style={{
          backgroundColor: currentColor,
          boxShadow: `0 20px 60px ${currentColor}60`
        }}
      >
        <span className="text-white font-mono text-lg font-bold drop-shadow-lg">
          {currentColor}
        </span>
      </div>

      <div className="flex gap-1 mb-4">
        {colors.map((c, i) => (
          <div
            key={i}
            className="flex-1 h-2 rounded-full first:rounded-l-full last:rounded-r-full"
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      <div className="flex items-center gap-4">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={progress}
          onChange={e => setProgress(Number(e.target.value))}
          className="flex-1 accent-white h-1"
        />
        <button
          onClick={animate}
          disabled={isAnimating}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Animate
        </button>
      </div>
    </div>
  )
}

// ============ 6. useSpring - Multiple Elements with Hover ============

function MultipleSpringDemo() {
  const [active, setActive] = useState<number | null>(null)
  const count = 6

  return (
    <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-5 h-5 text-pink-500" />
        <h3 className="text-lg font-semibold text-white">useSpring - Hover Effects</h3>
      </div>

      <div className="flex justify-center gap-3">
        {Array.from({ length: count }).map((_, i) => (
          <HoverBox
            key={i}
            index={i}
            isActive={active === i}
            onHover={() => setActive(i)}
            onLeave={() => setActive(null)}
          />
        ))}
      </div>

      <p className="text-center text-xs text-zinc-500 mt-4">Hover over the boxes</p>
    </div>
  )
}

function HoverBox({ index, isActive, onHover, onLeave }: {
  index: number
  isActive: boolean
  onHover: () => void
  onLeave: () => void
}) {
  const style = useSpring({
    scale: isActive ? 1.2 : 1,
    y: isActive ? -10 : 0,
    rotate: isActive ? 5 : 0,
  }, { stiffness: 300, damping: 20 })

  return (
    <div
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className="w-14 h-14 rounded-xl cursor-pointer"
      style={{
        backgroundColor: `hsl(${330 + index * 15}, 70%, 55%)`,
        transform: `scale(${style.scale}) translateY(${style.y}px) rotate(${style.rotate}deg)`,
        boxShadow: isActive ? `0 20px 40px hsl(${330 + index * 15}, 70%, 30%)` : 'none'
      }}
    />
  )
}

// ============ 7. Decay (Momentum) Demo ============

function DecayDemo() {
  const boxRef = useRef<HTMLDivElement>(null)
  const [velocity, setVelocity] = useState(1500)
  const [position, setPosition] = useState(0)

  const fling = () => {
    if (!boxRef.current) return
    boxRef.current.style.transform = 'translateX(0)'
    setPosition(0)

    decay({
      velocity,
      deceleration: 0.997,
      clamp: [0, 300],
      onUpdate: v => {
        if (boxRef.current) boxRef.current.style.transform = `translateX(${v}px)`
        setPosition(v)
      }
    }).start()
  }

  return (
    <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
      <div className="flex items-center gap-2 mb-4">
        <ArrowRight className="w-5 h-5 text-teal-500" />
        <h3 className="text-lg font-semibold text-white">Decay - Momentum Physics</h3>
      </div>

      <div className="h-20 bg-zinc-800/30 rounded-xl relative overflow-hidden mb-4">
        <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-teal-500/50" />
        <div
          ref={boxRef}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl shadow-lg shadow-teal-500/30 flex items-center justify-center"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-zinc-400">Initial Velocity</span>
            <span className="font-mono text-teal-400">{velocity}</span>
          </div>
          <input
            type="range"
            min="500"
            max="3000"
            value={velocity}
            onChange={e => setVelocity(Number(e.target.value))}
            className="w-full accent-teal-500 h-1"
          />
        </div>
        <button
          onClick={fling}
          className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Fling
        </button>
      </div>

      <div className="text-center font-mono text-sm text-zinc-500">
        Position: <span className="text-teal-400">{position.toFixed(0)}px</span>
      </div>
    </div>
  )
}

// ============ 8. Config Presets Comparison ============

function PresetsComparison() {
  const boxRefs = useRef<(HTMLDivElement | null)[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const presets = [
    { name: 'default', config: springPresets.default, color: '#f97316' },
    { name: 'gentle', config: springPresets.gentle, color: '#22c55e' },
    { name: 'wobbly', config: springPresets.wobbly, color: '#3b82f6' },
    { name: 'stiff', config: springPresets.stiff, color: '#a855f7' },
    { name: 'bounce', config: configFromBounce(0.4), color: '#ec4899' },
  ]

  const runAll = () => {
    if (isRunning) return
    setIsRunning(true)

    // Reset
    boxRefs.current.forEach(box => {
      if (box) box.style.transform = 'translateX(0)'
    })

    let completed = 0
    presets.forEach((preset, i) => {
      const box = boxRefs.current[i]
      if (!box) return

      spring(0, 250, {
        ...preset.config,
        onUpdate: v => { box.style.transform = `translateX(${v}px)` },
        onComplete: () => {
          completed++
          if (completed === presets.length) setIsRunning(false)
        }
      }).start()
    })
  }

  return (
    <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-semibold text-white">Spring Presets</h3>
        </div>
        <button
          onClick={runAll}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Play className="w-4 h-4" />
          Compare
        </button>
      </div>

      <div className="space-y-2">
        {presets.map((preset, i) => (
          <div key={preset.name} className="flex items-center gap-3">
            <span className="w-16 text-xs font-mono text-zinc-500">{preset.name}</span>
            <div className="flex-1 h-8 bg-zinc-800/30 rounded relative overflow-hidden">
              <div
                ref={el => { boxRefs.current[i] = el }}
                className="absolute left-1 top-1 bottom-1 w-6 rounded"
                style={{ backgroundColor: preset.color, boxShadow: `0 2px 10px ${preset.color}60` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============ Main Page ============

export function Examples() {
  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            SpringKit Examples
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Explore the full power of physics-based animations. Every demo uses real spring physics calculations.
          </p>
        </motion.div>

        {/* Demos Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2">
            <PhysicsVisualizer />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <TrailDemo />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <OrchestrationDemo />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <AdvancedDragDemo />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <ColorInterpolationDemo />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <MultipleSpringDemo />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <DecayDemo />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="lg:col-span-2">
            <PresetsComparison />
          </motion.div>
        </div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-16"
        >
          <p className="text-zinc-500 mb-4">Ready to build fluid, natural animations?</p>
          <a
            href="/docs/getting-started"
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
          >
            Get Started
            <ChevronRight className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </div>
  )
}
