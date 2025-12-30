import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play, RotateCcw, GripVertical, ChevronRight, Sparkles, Layers, Zap, MousePointer2, ArrowRight, Palette, Wind, Activity, Target, Gauge, Box } from 'lucide-react'
import { useSpring, useDrag, useTrail } from '@oxog/springkit/react'
import {
  spring,
  springPresets,
  createSpringValue,
  decay,
  sequence,
  parallel,
  stagger,
  configFromBounce,
  calculateDampingRatio,
  isUnderdamped,
  isOverdamped,
} from '@oxog/springkit'

// ============================================================================
// 1. SPRING PHYSICS VISUALIZER - Interactive parameter tuning
// ============================================================================

function PhysicsVisualizer() {
  const [stiffness, setStiffness] = useState(170)
  const [damping, setDamping] = useState(26)
  const [mass, setMass] = useState(1)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const springRef = useRef<ReturnType<typeof createSpringValue> | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  // Calculate damping characteristics
  const dampingRatio = calculateDampingRatio(damping, stiffness, mass)
  const config = { stiffness, damping, mass }
  const dampingType = isUnderdamped(config) ? 'Underdamped' :
                      isOverdamped(config) ? 'Overdamped' : 'Critical'

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
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
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

    // Draw curve with gradient
    const gradient = ctx.createLinearGradient(0, 0, width, 0)
    gradient.addColorStop(0, '#f97316')
    gradient.addColorStop(1, '#eab308')
    ctx.strokeStyle = gradient
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    })
    ctx.stroke()

    // Draw target line
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)'
    ctx.setLineDash([5, 5])
    ctx.lineWidth = 1
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

  const reset = () => {
    springRef.current?.destroy()
    if (boxRef.current) boxRef.current.style.transform = 'translateX(0)'
    setIsAnimating(false)
  }

  return (
    <div className="glass rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Spring Physics</h3>
            <p className="text-xs text-white/40">Visualize spring behavior</p>
          </div>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${
          dampingType === 'Underdamped' ? 'bg-green-500/20 text-green-400' :
          dampingType === 'Overdamped' ? 'bg-red-500/20 text-red-400' :
          'bg-yellow-500/20 text-yellow-400'
        }`}>
          {dampingType} (ζ = {dampingRatio.toFixed(2)})
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <canvas
            ref={canvasRef}
            width={400}
            height={200}
            className="w-full bg-black/20 rounded-xl mb-4"
          />

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/60">Stiffness</span>
                <span className="font-mono text-orange-400">{stiffness}</span>
              </div>
              <input type="range" min="50" max="500" value={stiffness}
                onChange={e => setStiffness(Number(e.target.value))}
                className="w-full" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/60">Damping</span>
                <span className="font-mono text-orange-400">{damping}</span>
              </div>
              <input type="range" min="1" max="100" value={damping}
                onChange={e => setDamping(Number(e.target.value))}
                className="w-full" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/60">Mass</span>
                <span className="font-mono text-orange-400">{mass}</span>
              </div>
              <input type="range" min="0.1" max="5" step="0.1" value={mass}
                onChange={e => setMass(Number(e.target.value))}
                className="w-full" />
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex-1 bg-black/20 rounded-xl relative overflow-hidden mb-4 min-h-[120px]">
            {/* Target line */}
            <div className="absolute right-4 top-0 bottom-0 w-px bg-blue-500/30" />
            <div className="absolute right-3 top-2 text-[10px] text-blue-400/50">target</div>

            {/* Animated box */}
            <div
              ref={boxRef}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl shadow-lg shadow-orange-500/30 flex items-center justify-center"
            >
              <Box className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={runAnimation}
              disabled={isAnimating}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white font-medium rounded-xl transition-all"
            >
              <Play className="w-4 h-4" />
              Animate
            </button>
            <button
              onClick={reset}
              className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// 2. TRAIL ANIMATION - Staggered list reveal
// ============================================================================

function TrailDemo() {
  const [show, setShow] = useState(true)
  const items = ['useSpring', 'useTrail', 'useDrag', 'useGesture', 'Animated']

  const trail = useTrail(items.length, {
    opacity: show ? 1 : 0,
    x: show ? 0 : -50,
    scale: show ? 1 : 0.8,
  }, { stiffness: 200, damping: 20 })

  return (
    <div className="glass rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
            <Layers className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">useTrail</h3>
            <p className="text-xs text-white/40">Staggered animations</p>
          </div>
        </div>
        <button
          onClick={() => setShow(!show)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            show
              ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30'
              : 'bg-white/5 text-white/70 hover:bg-white/10'
          }`}
        >
          {show ? 'Hide' : 'Show'}
        </button>
      </div>

      <div className="space-y-2 min-h-[240px]">
        {items.map((item, i) => (
          <div
            key={item}
            className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5"
            style={{
              opacity: trail[i]?.opacity ?? 0,
              transform: `translateX(${trail[i]?.x ?? 0}px) scale(${trail[i]?.scale ?? 1})`,
            }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{
                background: `linear-gradient(135deg, hsl(${260 + i * 20}, 70%, 50%), hsl(${280 + i * 20}, 70%, 40%))`,
              }}
            >
              {i + 1}
            </div>
            <div>
              <span className="text-white font-medium">{item}</span>
              <p className="text-xs text-white/40">React Hook</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// 3. ORCHESTRATION - Sequence, Parallel, Stagger
// ============================================================================

function OrchestrationDemo() {
  const boxRefs = useRef<(HTMLDivElement | null)[]>([])
  const [mode, setMode] = useState<'sequence' | 'parallel' | 'stagger'>('sequence')
  const [isRunning, setIsRunning] = useState(false)

  const runAnimation = async () => {
    if (isRunning) return
    setIsRunning(true)

    // Reset
    boxRefs.current.forEach(box => {
      if (box) box.style.left = '8px'
    })

    await new Promise(r => setTimeout(r, 100))

    const createAnim = (index: number) => () => {
      return spring(0, 200, {
        stiffness: 180,
        damping: 20,
        onUpdate: v => {
          const box = boxRefs.current[index]
          if (box) box.style.left = `${8 + v}px`
        }
      }).start()
    }

    try {
      if (mode === 'sequence') {
        await sequence([createAnim(0), createAnim(1), createAnim(2)])
      } else if (mode === 'parallel') {
        await parallel([createAnim(0), createAnim(1), createAnim(2)])
      } else {
        const boxes = boxRefs.current.filter(Boolean) as HTMLDivElement[]
        await stagger(boxes, (box) => {
          return spring(0, 200, {
            stiffness: 180,
            damping: 20,
            onUpdate: v => { box.style.left = `${8 + v}px` }
          }).start()
        }, { delay: 100 })
      }
    } finally {
      setIsRunning(false)
    }
  }

  const colors = ['#10b981', '#22d3ee', '#a78bfa']
  const labels = ['First', 'Second', 'Third']

  return (
    <div className="glass rounded-2xl p-6 border border-white/10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Orchestration</h3>
          <p className="text-xs text-white/40">Sequence, parallel, stagger</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {(['sequence', 'parallel', 'stagger'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              mode === m
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="space-y-3 mb-4">
        {[0, 1, 2].map(i => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-white/40 w-12">{labels[i]}</span>
            <div className="flex-1 h-12 bg-black/20 rounded-xl relative overflow-hidden">
              <div
                ref={el => { boxRefs.current[i] = el }}
                className="absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg flex items-center justify-center"
                style={{
                  left: '8px',
                  backgroundColor: colors[i],
                  boxShadow: `0 4px 20px ${colors[i]}40`
                }}
              >
                <span className="text-white font-bold text-sm">{i + 1}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={runAnimation}
        disabled={isRunning}
        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 text-white font-medium rounded-xl transition-all"
      >
        <Play className="w-4 h-4" />
        Run {mode}
      </button>
    </div>
  )
}

// ============================================================================
// 4. DRAG WITH RUBBER BAND - Interactive gesture
// ============================================================================

function AdvancedDragDemo() {
  const [pos, api] = useDrag({
    bounds: { left: -140, right: 140, top: -70, bottom: 70 },
    rubberBand: true,
    rubberBandFactor: 0.15,
  })

  const bgStyle = useSpring({
    scale: api.isDragging ? 1.02 : 1,
    borderOpacity: api.isDragging ? 0.5 : 0.1,
  }, { stiffness: 400, damping: 30 })

  return (
    <div className="glass rounded-2xl p-6 border border-white/10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
          <MousePointer2 className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">useDrag</h3>
          <p className="text-xs text-white/40">With rubber band physics</p>
        </div>
      </div>

      <div
        className="h-48 bg-black/20 rounded-xl relative overflow-hidden transition-transform"
        style={{
          transform: `scale(${bgStyle.scale})`,
          borderColor: `rgba(6, 182, 212, ${bgStyle.borderOpacity})`,
          borderWidth: 2,
          borderStyle: 'solid'
        }}
      >
        {/* Bounds indicator */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-36 border border-dashed border-white/10 rounded-lg" />

        {/* Center crosshair */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-px bg-white/10" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-4 bg-white/10" />

        <div
          ref={api.ref}
          className="absolute left-1/2 top-1/2 -ml-8 -mt-8 w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl cursor-grab active:cursor-grabbing flex items-center justify-center shadow-lg shadow-cyan-500/30 select-none transition-shadow"
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px)`,
            boxShadow: api.isDragging ? '0 20px 40px rgba(6, 182, 212, 0.4)' : '0 10px 30px rgba(6, 182, 212, 0.2)'
          }}
        >
          <GripVertical className="w-6 h-6 text-white" />
        </div>
      </div>

      <div className="flex justify-center gap-8 mt-4 text-sm font-mono">
        <span className="text-white/40">x: <span className="text-cyan-400">{pos.x.toFixed(0)}</span></span>
        <span className="text-white/40">y: <span className="text-cyan-400">{pos.y.toFixed(0)}</span></span>
        <span className="text-white/40">
          <span className={api.isDragging ? 'text-cyan-400' : 'text-white/30'}>
            {api.isDragging ? 'dragging' : 'idle'}
          </span>
        </span>
      </div>
    </div>
  )
}

// ============================================================================
// 5. COLOR INTERPOLATION - With interpolateColor
// ============================================================================

function ColorInterpolationDemo() {
  const [progress, setProgress] = useState(0)
  const springRef = useRef<ReturnType<typeof createSpringValue> | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  const colors = ['#f97316', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981']

  // Simple color lerp function
  const lerpColor = (color1: string, color2: string, t: number): string => {
    const hex = (c: string) => parseInt(c, 16)
    const r1 = hex(color1.slice(1, 3)), g1 = hex(color1.slice(3, 5)), b1 = hex(color1.slice(5, 7))
    const r2 = hex(color2.slice(1, 3)), g2 = hex(color2.slice(3, 5)), b2 = hex(color2.slice(5, 7))
    const r = Math.round(r1 + (r2 - r1) * t)
    const g = Math.round(g1 + (g2 - g1) * t)
    const b = Math.round(b1 + (b2 - b1) * t)
    return `rgb(${r}, ${g}, ${b})`
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
    <div className="glass rounded-2xl p-6 border border-white/10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f97316, #ec4899, #8b5cf6)' }}>
          <Palette className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">interpolateColor</h3>
          <p className="text-xs text-white/40">Smooth color transitions</p>
        </div>
      </div>

      <div
        className="h-32 rounded-xl mb-4 flex items-center justify-center transition-shadow"
        style={{
          backgroundColor: currentColor,
          boxShadow: `0 20px 60px ${currentColor}50`
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
            className="flex-1 h-3 rounded-full first:rounded-l-full last:rounded-r-full transition-transform hover:scale-y-150"
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
          className="flex-1"
        />
        <button
          onClick={animate}
          disabled={isAnimating}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {progress < 0.5 ? 'To End' : 'To Start'}
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// 6. SMOOTH INTERRUPTION - Velocity-aware transitions
// ============================================================================

function VelocityInterruptionDemo() {
  const boxRef = useRef<HTMLDivElement>(null)
  const springRef = useRef<ReturnType<typeof createSpringValue> | null>(null)
  const [target, setTarget] = useState(0)
  const [velocity, setVelocity] = useState(0)

  useEffect(() => {
    if (!boxRef.current) return

    springRef.current?.destroy()
    springRef.current = createSpringValue(0, {
      stiffness: 200,
      damping: 20,
      onUpdate: (v) => {
        if (boxRef.current) {
          boxRef.current.style.transform = `translateX(${v}px)`
        }
        setVelocity(springRef.current?.getVelocity() ?? 0)
      }
    })

    return () => springRef.current?.destroy()
  }, [])

  const animateTo = (newTarget: number) => {
    setTarget(newTarget)
    // SpringKit automatically preserves velocity during interruption
    springRef.current?.set(newTarget)
  }

  return (
    <div className="glass rounded-2xl p-6 border border-white/10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center">
          <Wind className="w-5 h-5 text-rose-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Smooth Interruptions</h3>
          <p className="text-xs text-white/40">Velocity-aware transitions</p>
        </div>
      </div>

      <div className="h-20 bg-black/20 rounded-xl relative overflow-hidden mb-4">
        {/* Target indicators */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-white/10" />
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10" />
        <div className="absolute right-4 top-0 bottom-0 w-px bg-white/10" />

        <div
          ref={boxRef}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl shadow-lg shadow-rose-500/30 flex items-center justify-center"
        >
          <Target className="w-5 h-5 text-white" />
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {[0, 150, 300].map((t, i) => (
          <button
            key={t}
            onClick={() => animateTo(t)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              target === t
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            {['Start', 'Middle', 'End'][i]}
          </button>
        ))}
      </div>

      <div className="text-center font-mono text-sm">
        <span className="text-white/40">Velocity: </span>
        <span className={`${Math.abs(velocity) > 10 ? 'text-rose-400' : 'text-white/60'}`}>
          {velocity.toFixed(1)} px/frame
        </span>
      </div>

      <p className="text-xs text-white/30 text-center mt-2">
        Click buttons rapidly to see smooth interruptions
      </p>
    </div>
  )
}

// ============================================================================
// 7. HOVER EFFECTS - useSpring for interactions
// ============================================================================

function MultipleSpringDemo() {
  const [active, setActive] = useState<number | null>(null)
  const count = 6

  return (
    <div className="glass rounded-2xl p-6 border border-white/10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-fuchsia-500/20 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-pink-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">useSpring</h3>
          <p className="text-xs text-white/40">Hover interactions</p>
        </div>
      </div>

      <div className="flex justify-center gap-4 py-4">
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

      <p className="text-center text-xs text-white/30 mt-2">Hover over the boxes</p>
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
    scale: isActive ? 1.3 : 1,
    y: isActive ? -15 : 0,
    rotate: isActive ? 8 : 0,
  }, { stiffness: 300, damping: 20 })

  const hue = 330 + index * 15

  return (
    <div
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className="w-14 h-14 rounded-xl cursor-pointer transition-shadow"
      style={{
        background: `linear-gradient(135deg, hsl(${hue}, 70%, 55%), hsl(${hue + 20}, 70%, 45%))`,
        transform: `scale(${style.scale}) translateY(${style.y}px) rotate(${style.rotate}deg)`,
        boxShadow: isActive ? `0 20px 40px hsl(${hue}, 70%, 30%)` : 'none'
      }}
    />
  )
}

// ============================================================================
// 8. DECAY (MOMENTUM) - Fling physics
// ============================================================================

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
      clamp: [0, 280],
      onUpdate: v => {
        if (boxRef.current) boxRef.current.style.transform = `translateX(${v}px)`
        setPosition(v)
      }
    }).start()
  }

  return (
    <div className="glass rounded-2xl p-6 border border-white/10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 flex items-center justify-center">
          <Gauge className="w-5 h-5 text-teal-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">decay</h3>
          <p className="text-xs text-white/40">Momentum-based animation</p>
        </div>
      </div>

      <div className="h-20 bg-black/20 rounded-xl relative overflow-hidden mb-4">
        {/* End marker */}
        <div className="absolute right-4 top-0 bottom-0 w-px bg-teal-500/30" />
        <div className="absolute right-3 top-2 text-[10px] text-teal-400/50">end</div>

        <div
          ref={boxRef}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl shadow-lg shadow-teal-500/30 flex items-center justify-center"
        >
          <ArrowRight className="w-5 h-5 text-white" />
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-white/60">Initial Velocity</span>
            <span className="font-mono text-teal-400">{velocity}</span>
          </div>
          <input
            type="range"
            min="500"
            max="3000"
            value={velocity}
            onChange={e => setVelocity(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <button
          onClick={fling}
          className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-teal-500/20"
        >
          Fling
        </button>
      </div>

      <div className="text-center font-mono text-sm text-white/40">
        Position: <span className="text-teal-400">{position.toFixed(0)}px</span>
      </div>
    </div>
  )
}

// ============================================================================
// 9. PRESETS COMPARISON - Visual comparison
// ============================================================================

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

      setTimeout(() => {
        spring(0, 300, {
          ...preset.config,
          onUpdate: v => { box.style.transform = `translateX(${v}px)` },
          onComplete: () => {
            completed++
            if (completed === presets.length) setIsRunning(false)
          }
        }).start()
      }, 50)
    })
  }

  return (
    <div className="glass rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Spring Presets</h3>
            <p className="text-xs text-white/40">Compare behaviors</p>
          </div>
        </div>
        <button
          onClick={runAll}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-amber-500/20"
        >
          <Play className="w-4 h-4" />
          Compare
        </button>
      </div>

      <div className="space-y-3">
        {presets.map((preset, i) => (
          <div key={preset.name} className="flex items-center gap-4">
            <div className="w-20 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: preset.color }} />
              <span className="text-xs font-mono text-white/50">{preset.name}</span>
            </div>
            <div className="flex-1 h-10 bg-black/20 rounded-lg relative overflow-hidden">
              {/* End marker */}
              <div className="absolute right-4 top-0 bottom-0 w-px bg-white/10" />

              <div
                ref={el => { boxRefs.current[i] = el }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: preset.color,
                  boxShadow: `0 4px 15px ${preset.color}40`
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// MAIN EXAMPLES PAGE
// ============================================================================

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
            Interactive Examples
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Explore the full power of physics-based animations. Every demo uses real spring calculations from SpringKit.
          </p>
        </motion.div>

        {/* Demos Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
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
            <VelocityInterruptionDemo />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <MultipleSpringDemo />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
            <DecayDemo />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2"
          >
            <PresetsComparison />
          </motion.div>
        </div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="text-center mt-16"
        >
          <p className="text-white/40 mb-4">Ready to build fluid, natural animations?</p>
          <a
            href="/docs/getting-started"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium rounded-xl transition-all shadow-lg shadow-orange-500/20"
          >
            Get Started
            <ChevronRight className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </div>
  )
}
