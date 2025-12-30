import { useState, useRef, useEffect } from 'react'
import {
  Play, RotateCcw, GripVertical, ChevronRight, Sparkles, Layers, Zap,
  MousePointer2, ArrowRight, Activity, Target, Gauge, Box,
  Atom, Flame, Waves, Heart, Star, Moon, Sun, Cloud, Snowflake, Music,
  Rocket, Globe, Cpu, Eye, Shuffle
} from 'lucide-react'
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
// ANIMATED DIV COMPONENT - Using SpringKit instead of framer-motion
// ============================================================================

interface AnimatedDivProps extends React.HTMLAttributes<HTMLDivElement> {
  initial?: { opacity?: number; y?: number; x?: number; scale?: number }
  animate?: { opacity?: number; y?: number; x?: number; scale?: number }
  whileInView?: { opacity?: number; y?: number; x?: number; scale?: number }
  whileHover?: { y?: number; scale?: number }
  viewport?: { once?: boolean; margin?: string }
  transition?: { duration?: number; delay?: number; stiffness?: number; damping?: number }
  children?: React.ReactNode
}

function AnimatedDiv({
  initial,
  animate,
  whileInView,
  whileHover,
  viewport,
  transition,
  children,
  className,
  style,
  ...rest
}: AnimatedDivProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const hasAnimated = useRef(false)

  // Filter out animation props that shouldn't be passed to DOM
  const props = { ...rest } as Record<string, unknown>
  delete props.initial
  delete props.animate
  delete props.whileInView
  delete props.whileHover
  delete props.viewport
  delete props.transition

  // Determine target values
  const target = whileInView && isInView ? whileInView : animate || {}
  const hoverTarget = whileHover && isHovered ? whileHover : {}

  // Merge targets
  const finalTarget = { ...target, ...hoverTarget }

  const springValues = useSpring({
    opacity: finalTarget.opacity ?? initial?.opacity ?? 1,
    y: finalTarget.y ?? initial?.y ?? 0,
    x: finalTarget.x ?? initial?.x ?? 0,
    scale: finalTarget.scale ?? initial?.scale ?? 1,
  }, {
    stiffness: transition?.stiffness ?? 100,
    damping: transition?.damping ?? 15,
  })

  // Intersection Observer for whileInView
  useEffect(() => {
    if (!whileInView || !ref.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (viewport?.once && hasAnimated.current) return
            setIsInView(true)
            hasAnimated.current = true
          } else if (!viewport?.once) {
            setIsInView(false)
          }
        })
      },
      {
        rootMargin: viewport?.margin || '0px',
        threshold: 0.1
      }
    )

    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [whileInView, viewport?.once, viewport?.margin])

  // Auto-animate on mount if no whileInView
  useEffect(() => {
    if (!whileInView && animate) {
      const delay = (transition?.delay || 0) * 1000
      const timer = setTimeout(() => setIsInView(true), delay)
      return () => clearTimeout(timer)
    }
  }, [])

  const transform = `translate(${springValues.x}px, ${springValues.y}px) scale(${springValues.scale})`

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: springValues.opacity,
        transform,
      }}
      onMouseEnter={() => whileHover && setIsHovered(true)}
      onMouseLeave={() => whileHover && setIsHovered(false)}
      {...props}
    >
      {children}
    </div>
  )
}

// ============================================================================
// SPECTACULAR HERO - 3D Rotating Cube with Spring Physics
// ============================================================================

function SpectacularHero() {
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [isAutoRotating, setIsAutoRotating] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const autoRotateRef = useRef<number | null>(null)
  const springXRef = useRef<ReturnType<typeof createSpringValue> | null>(null)
  const springYRef = useRef<ReturnType<typeof createSpringValue> | null>(null)

  // Auto rotation
  useEffect(() => {
    if (isAutoRotating) {
      let angle = 0
      const animate = () => {
        angle += 0.3
        setRotateX(Math.sin(angle * 0.02) * 15)
        setRotateY(angle)
        autoRotateRef.current = requestAnimationFrame(animate)
      }
      autoRotateRef.current = requestAnimationFrame(animate)
    }
    return () => {
      if (autoRotateRef.current) cancelAnimationFrame(autoRotateRef.current)
    }
  }, [isAutoRotating])

  // Mouse interaction
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isAutoRotating || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width / 2) / rect.width
    const y = (e.clientY - rect.top - rect.height / 2) / rect.height

    springXRef.current?.set(-y * 40)
    springYRef.current?.set(x * 40)
  }

  useEffect(() => {
    springXRef.current = createSpringValue(0, {
      stiffness: 150,
      damping: 15,
      onUpdate: setRotateX
    })
    springYRef.current = createSpringValue(0, {
      stiffness: 150,
      damping: 15,
      onUpdate: setRotateY
    })
    return () => {
      springXRef.current?.destroy()
      springYRef.current?.destroy()
    }
  }, [])

  const faces = [
    { transform: 'translateZ(80px)', gradient: 'from-orange-500 to-amber-500', icon: Sparkles },
    { transform: 'rotateY(180deg) translateZ(80px)', gradient: 'from-purple-500 to-pink-500', icon: Atom },
    { transform: 'rotateY(-90deg) translateZ(80px)', gradient: 'from-cyan-500 to-blue-500', icon: Zap },
    { transform: 'rotateY(90deg) translateZ(80px)', gradient: 'from-green-500 to-emerald-500', icon: Layers },
    { transform: 'rotateX(90deg) translateZ(80px)', gradient: 'from-rose-500 to-red-500', icon: Heart },
    { transform: 'rotateX(-90deg) translateZ(80px)', gradient: 'from-violet-500 to-indigo-500', icon: Star },
  ]

  return (
    <div className="relative mb-16">
      {/* Background effects */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] bg-gradient-radial from-orange-500/20 via-transparent to-transparent blur-3xl" />
      </div>

      <div className="relative glass rounded-3xl p-8 border border-white/10 overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div className="space-y-6">
            <AnimatedDiv
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/20 text-orange-400 text-sm font-medium rounded-full mb-4">
                <Sparkles className="w-4 h-4" />
                Interactive Playground
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                Experience the
                <span className="text-gradient block">Physics of Motion</span>
              </h1>
              <p className="text-white/50 text-lg leading-relaxed">
                Every animation here uses real spring calculations. Drag, click, and interact
                to feel the natural, fluid motion that physics-based springs provide.
              </p>
            </AnimatedDiv>

            <AnimatedDiv
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-3"
            >
              <button
                onClick={() => setIsAutoRotating(!isAutoRotating)}
                className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                  isAutoRotating
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {isAutoRotating ? 'Stop Rotation' : 'Auto Rotate'}
              </button>
              <span className="px-4 py-2.5 text-white/40 text-sm">
                {isAutoRotating ? 'Click to enable mouse control' : 'Move mouse over cube'}
              </span>
            </AnimatedDiv>
          </div>

          {/* Right: 3D Cube */}
          <AnimatedDiv
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 20 }}
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => {
              if (!isAutoRotating) {
                springXRef.current?.set(0)
                springYRef.current?.set(0)
              }
            }}
            className="relative h-80 flex items-center justify-center perspective-1000"
            style={{ perspective: '1000px' }}
          >
            <div
              className="relative w-40 h-40"
              style={{
                transformStyle: 'preserve-3d',
                transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
              }}
            >
              {faces.map((face, i) => {
                const Icon = face.icon
                return (
                  <div
                    key={i}
                    className={`absolute inset-0 bg-gradient-to-br ${face.gradient} rounded-2xl flex items-center justify-center backface-hidden shadow-2xl`}
                    style={{
                      transform: face.transform,
                      backfaceVisibility: 'hidden',
                    }}
                  >
                    <Icon className="w-12 h-12 text-white/90" />
                  </div>
                )
              })}
            </div>

            {/* Orbital rings */}
            <div
              className="absolute w-72 h-72 border border-white/10 rounded-full"
              style={{
                transform: `rotateX(${rotateX + 70}deg) rotateY(${rotateY}deg)`,
                transformStyle: 'preserve-3d',
              }}
            />
            <div
              className="absolute w-80 h-80 border border-white/5 rounded-full"
              style={{
                transform: `rotateX(${rotateX + 70}deg) rotateY(${rotateY + 60}deg)`,
                transformStyle: 'preserve-3d',
              }}
            />
          </AnimatedDiv>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// PARTICLE EXPLOSION - Click to explode particles
// ============================================================================

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  size: number
  hue: number
  life: number
  maxLife: number
}

function ParticleExplosion() {
  const [particles, setParticles] = useState<Particle[]>([])
  const [explosionCount, setExplosionCount] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)

  const createExplosion = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const newParticles: Particle[] = []
    const count = 30 + Math.random() * 20

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5
      const speed = 5 + Math.random() * 10
      const hue = (explosionCount * 60 + Math.random() * 60) % 360

      newParticles.push({
        id: Date.now() + i,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 8,
        hue,
        life: 1,
        maxLife: 60 + Math.random() * 40,
      })
    }

    setParticles(prev => [...prev, ...newParticles])
    setExplosionCount(prev => prev + 1)
  }

  useEffect(() => {
    const animate = () => {
      setParticles(prev => {
        const updated = prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vx: p.vx * 0.98,
            vy: p.vy * 0.98 + 0.15, // gravity
            life: p.life - 1 / p.maxLife,
          }))
          .filter(p => p.life > 0)

        return updated
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [])

  return (
    <div className="glass rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 flex items-center justify-center">
            <Flame className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Particle Explosion</h3>
            <p className="text-xs text-white/40">Click anywhere to explode</p>
          </div>
        </div>
        <span className="text-sm text-white/30 font-mono">{particles.length} particles</span>
      </div>

      <div
        ref={containerRef}
        onClick={createExplosion}
        className="relative h-64 bg-black/30 rounded-xl overflow-hidden cursor-crosshair"
      >
        {/* Click hint */}
        {particles.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white/20 text-sm">Click to create explosion</span>
          </div>
        )}

        {/* Particles */}
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: p.x,
              top: p.y,
              width: p.size * p.life,
              height: p.size * p.life,
              background: `radial-gradient(circle, hsla(${p.hue}, 100%, 60%, ${p.life}) 0%, hsla(${p.hue}, 100%, 50%, 0) 70%)`,
              transform: 'translate(-50%, -50%)',
              boxShadow: `0 0 ${p.size * 2}px hsla(${p.hue}, 100%, 50%, ${p.life * 0.5})`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// GRAVITY SIMULATION - Planets orbiting with spring physics
// ============================================================================

interface Planet {
  id: number
  angle: number
  distance: number
  speed: number
  size: number
  hue: number
  hasRing?: boolean
}

function GravitySimulation() {
  const [planets] = useState<Planet[]>([
    { id: 0, angle: 0, distance: 60, speed: 0.02, size: 16, hue: 25 },
    { id: 1, angle: 2, distance: 90, speed: 0.015, size: 20, hue: 200 },
    { id: 2, angle: 4, distance: 125, speed: 0.01, size: 14, hue: 340, hasRing: true },
    { id: 3, angle: 1, distance: 160, speed: 0.007, size: 24, hue: 40 },
  ])
  const [positions, setPositions] = useState(planets.map(p => ({ x: 0, y: 0, angle: p.angle })))
  const [isPaused, setIsPaused] = useState(false)
  const [hoveredPlanet, setHoveredPlanet] = useState<number | null>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    if (isPaused) return

    const animate = () => {
      setPositions(prev => prev.map((pos, i) => {
        const planet = planets[i]
        const newAngle = pos.angle + planet.speed
        return {
          x: Math.cos(newAngle) * planet.distance,
          y: Math.sin(newAngle) * planet.distance * 0.4, // Elliptical
          angle: newAngle,
        }
      }))
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [isPaused, planets])

  return (
    <div className="glass rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
            <Globe className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Orbital Dynamics</h3>
            <p className="text-xs text-white/40">Spring-based celestial motion</p>
          </div>
        </div>
        <button
          onClick={() => setIsPaused(!isPaused)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            isPaused
              ? 'bg-indigo-500 text-white'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>
      </div>

      <div className="relative h-64 bg-black/30 rounded-xl overflow-hidden">
        {/* Stars background */}
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0.2 + Math.random() * 0.5,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}

        {/* Orbit paths */}
        {planets.map((planet) => (
          <div
            key={`orbit-${planet.id}`}
            className="absolute left-1/2 top-1/2 border border-white/5 rounded-full"
            style={{
              width: planet.distance * 2,
              height: planet.distance * 2 * 0.4,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}

        {/* Sun */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-lg shadow-yellow-500/50 flex items-center justify-center">
            <Sun className="w-6 h-6 text-white" />
          </div>
          <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-xl animate-pulse" />
        </div>

        {/* Planets */}
        {planets.map((planet, i) => (
          <div
            key={planet.id}
            className="absolute left-1/2 top-1/2 transition-transform duration-100"
            style={{
              transform: `translate(calc(-50% + ${positions[i]?.x || 0}px), calc(-50% + ${positions[i]?.y || 0}px))`,
              zIndex: positions[i]?.y > 0 ? 10 : 5,
            }}
            onMouseEnter={() => setHoveredPlanet(planet.id)}
            onMouseLeave={() => setHoveredPlanet(null)}
          >
            {/* Ring for Saturn-like planet */}
            {planet.hasRing && (
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-white/20 rounded-full"
                style={{
                  width: planet.size * 2.5,
                  height: planet.size * 0.8,
                  transform: 'translate(-50%, -50%) rotateX(70deg)',
                }}
              />
            )}
            <div
              className="rounded-full cursor-pointer transition-transform"
              style={{
                width: planet.size,
                height: planet.size,
                background: `radial-gradient(circle at 30% 30%, hsl(${planet.hue}, 70%, 60%), hsl(${planet.hue}, 60%, 30%))`,
                boxShadow: `0 0 ${planet.size}px hsla(${planet.hue}, 70%, 50%, 0.3)`,
                transform: hoveredPlanet === planet.id ? 'scale(1.3)' : 'scale(1)',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// MORPHING SHAPES - Smooth shape transitions
// ============================================================================

const SHAPES = [
  { name: 'Circle', borderRadius: '50%', rotation: 0 },
  { name: 'Square', borderRadius: '0%', rotation: 0 },
  { name: 'Diamond', borderRadius: '0%', rotation: 45 },
  { name: 'Rounded', borderRadius: '30%', rotation: 0 },
  { name: 'Pill', borderRadius: '50% 50% 50% 50% / 25% 25% 25% 25%', rotation: 0 },
]

function MorphingShapes() {
  const [currentShape, setCurrentShape] = useState(0)
  const [style, setStyle] = useState({ borderRadius: '50%', rotation: 0, scale: 1 })
  const radiusRef = useRef<ReturnType<typeof createSpringValue> | null>(null)
  const rotationRef = useRef<ReturnType<typeof createSpringValue> | null>(null)
  const scaleRef = useRef<ReturnType<typeof createSpringValue> | null>(null)

  useEffect(() => {
    // We'll use a numeric value for border radius interpolation
    radiusRef.current = createSpringValue(50, { stiffness: 200, damping: 20 })
    rotationRef.current = createSpringValue(0, { stiffness: 150, damping: 15, onUpdate: (v) => setStyle(s => ({ ...s, rotation: v })) })
    scaleRef.current = createSpringValue(1, { stiffness: 300, damping: 20, onUpdate: (v) => setStyle(s => ({ ...s, scale: v })) })

    return () => {
      radiusRef.current?.destroy()
      rotationRef.current?.destroy()
      scaleRef.current?.destroy()
    }
  }, [])

  const morphTo = (index: number) => {
    setCurrentShape(index)
    const shape = SHAPES[index]

    rotationRef.current?.set(shape.rotation)
    scaleRef.current?.set(0.8)
    setTimeout(() => scaleRef.current?.set(1), 100)

    setStyle(s => ({ ...s, borderRadius: shape.borderRadius }))
  }

  const nextShape = () => morphTo((currentShape + 1) % SHAPES.length)

  return (
    <div className="glass rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 flex items-center justify-center">
            <Shuffle className="w-5 h-5 text-fuchsia-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Morphing Shapes</h3>
            <p className="text-xs text-white/40">Smooth spring transitions</p>
          </div>
        </div>
        <span className="text-sm text-fuchsia-400 font-medium">{SHAPES[currentShape].name}</span>
      </div>

      <div className="h-48 bg-black/30 rounded-xl flex items-center justify-center mb-4">
        <div
          onClick={nextShape}
          className="w-24 h-24 bg-gradient-to-br from-fuchsia-500 to-purple-600 cursor-pointer transition-all duration-500 ease-out shadow-2xl shadow-fuchsia-500/30"
          style={{
            borderRadius: style.borderRadius,
            transform: `rotate(${style.rotation}deg) scale(${style.scale})`,
          }}
        />
      </div>

      <div className="flex gap-2">
        {SHAPES.map((shape, i) => (
          <button
            key={shape.name}
            onClick={() => morphTo(i)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
              currentShape === i
                ? 'bg-fuchsia-500 text-white'
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            {shape.name}
          </button>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// WAVE ANIMATION - Synchronized wave motion
// ============================================================================

function WaveAnimation() {
  const [waves, setWaves] = useState<number[]>(Array(20).fill(0))
  const [isRunning, setIsRunning] = useState(true)
  const [frequency, setFrequency] = useState(0.15)
  const [amplitude, setAmplitude] = useState(30)
  const animationRef = useRef<number | null>(null)
  const timeRef = useRef(0)

  useEffect(() => {
    if (!isRunning) return

    const animate = () => {
      timeRef.current += 0.05
      setWaves(prev => prev.map((_, i) => {
        return Math.sin(timeRef.current + i * frequency) * amplitude
      }))
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [isRunning, frequency, amplitude])

  return (
    <div className="glass rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
            <Waves className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Wave Motion</h3>
            <p className="text-xs text-white/40">Synchronized spring waves</p>
          </div>
        </div>
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            isRunning
              ? 'bg-cyan-500 text-white'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          {isRunning ? 'Pause' : 'Play'}
        </button>
      </div>

      <div className="h-32 bg-black/30 rounded-xl flex items-end justify-center gap-1 p-4 mb-4">
        {waves.map((height, i) => (
          <div
            key={i}
            className="w-3 rounded-t-full bg-gradient-to-t from-cyan-500 to-blue-400 transition-all"
            style={{
              height: 40 + height,
              opacity: 0.5 + (height + amplitude) / (amplitude * 4),
            }}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-white/50">Frequency</span>
            <span className="text-cyan-400 font-mono">{frequency.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.05"
            max="0.4"
            step="0.01"
            value={frequency}
            onChange={(e) => setFrequency(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-white/50">Amplitude</span>
            <span className="text-cyan-400 font-mono">{amplitude}</span>
          </div>
          <input
            type="range"
            min="10"
            max="50"
            value={amplitude}
            onChange={(e) => setAmplitude(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MAGNETIC BUTTONS - Hover attraction effect
// ============================================================================

function MagneticButton({ children, color }: { children: React.ReactNode; color: string }) {
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
    <button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`px-8 py-4 ${color} text-white font-semibold rounded-2xl shadow-lg transition-shadow hover:shadow-xl`}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)`,
      }}
    >
      {children}
    </button>
  )
}

function MagneticButtonsDemo() {
  return (
    <div className="glass rounded-2xl p-6 border border-white/10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center">
          <Target className="w-5 h-5 text-pink-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Magnetic Buttons</h3>
          <p className="text-xs text-white/40">Hover to feel the attraction</p>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4 py-8">
        <MagneticButton color="bg-gradient-to-r from-pink-500 to-rose-500">
          <span className="flex items-center gap-2">
            <Heart className="w-5 h-5" /> Like
          </span>
        </MagneticButton>
        <MagneticButton color="bg-gradient-to-r from-violet-500 to-purple-500">
          <span className="flex items-center gap-2">
            <Star className="w-5 h-5" /> Star
          </span>
        </MagneticButton>
        <MagneticButton color="bg-gradient-to-r from-cyan-500 to-blue-500">
          <span className="flex items-center gap-2">
            <Rocket className="w-5 h-5" /> Launch
          </span>
        </MagneticButton>
      </div>
    </div>
  )
}

// ============================================================================
// ICON CAROUSEL - Smooth rotating icons
// ============================================================================

const ICONS = [Sparkles, Atom, Zap, Heart, Star, Moon, Sun, Cloud, Snowflake, Music, Rocket, Globe, Cpu, Eye]

function IconCarousel() {
  const [rotation, setRotation] = useState(0)
  const [selectedIcon, setSelectedIcon] = useState(0)
  const springRef = useRef<ReturnType<typeof createSpringValue> | null>(null)

  useEffect(() => {
    springRef.current = createSpringValue(0, {
      stiffness: 100,
      damping: 20,
      onUpdate: setRotation
    })
    return () => springRef.current?.destroy()
  }, [])

  const selectIcon = (index: number) => {
    setSelectedIcon(index)
    const targetRotation = -index * (360 / ICONS.length)
    springRef.current?.set(targetRotation)
  }

  const radius = 120

  return (
    <div className="glass rounded-2xl p-6 border border-white/10">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Icon Carousel</h3>
          <p className="text-xs text-white/40">Click icons to rotate with spring</p>
        </div>
      </div>

      <div className="relative h-72 flex items-center justify-center">
        {/* Center display */}
        <div className="absolute w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-500/30 z-10">
          {(() => {
            const Icon = ICONS[selectedIcon]
            return <Icon className="w-10 h-10 text-white" />
          })()}
        </div>

        {/* Rotating icons */}
        <div
          className="absolute"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {ICONS.map((Icon, i) => {
            const angle = (i / ICONS.length) * Math.PI * 2
            const x = Math.cos(angle) * radius
            const y = Math.sin(angle) * radius
            const isSelected = i === selectedIcon

            return (
              <div
                key={i}
                onClick={() => selectIcon(i)}
                className={`absolute w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-amber-500/30 scale-110'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
                style={{
                  left: x,
                  top: y,
                  transform: `translate(-50%, -50%) rotate(${-rotation}deg)`,
                }}
              >
                <Icon className={`w-6 h-6 ${isSelected ? 'text-amber-400' : 'text-white/50'}`} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// EXISTING DEMOS (Enhanced)
// ============================================================================

function PhysicsVisualizer() {
  const [stiffness, setStiffness] = useState(170)
  const [damping, setDamping] = useState(26)
  const [mass, setMass] = useState(1)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const springRef = useRef<ReturnType<typeof createSpringValue> | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  const dampingRatio = calculateDampingRatio(damping, stiffness, mass)
  const config = { stiffness, damping, mass }
  const dampingType = isUnderdamped(config) ? 'Underdamped' :
                      isOverdamped(config) ? 'Overdamped' : 'Critical'

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    ctx.clearRect(0, 0, width, height)

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
            <div className="absolute right-4 top-0 bottom-0 w-px bg-blue-500/30" />
            <div className="absolute right-3 top-2 text-[10px] text-blue-400/50">target</div>

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

function TrailDemo() {
  const [show, setShow] = useState(false) // Start hidden to show animation on mount
  const items = ['useSpring', 'useTrail', 'useDrag', 'useGesture', 'Animated']

  const trail = useTrail(items.length, {
    opacity: show ? 1 : 0,
    x: show ? 0 : -50,
    scale: show ? 1 : 0.8,
  }, { stiffness: 180, damping: 18 })

  // Auto-show on mount after a small delay
  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 300)
    return () => clearTimeout(timer)
  }, [])

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
              transform: `translateX(${trail[i]?.x ?? -50}px) scale(${trail[i]?.scale ?? 0.8})`,
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

function OrchestrationDemo() {
  const boxRefs = useRef<(HTMLDivElement | null)[]>([])
  const [mode, setMode] = useState<'sequence' | 'parallel' | 'stagger'>('sequence')
  const [isRunning, setIsRunning] = useState(false)

  const runAnimation = async () => {
    if (isRunning) return
    setIsRunning(true)

    // Reset all boxes to start position
    boxRefs.current.forEach(box => {
      if (box) box.style.left = '8px'
    })

    await new Promise(r => setTimeout(r, 100))

    // For sequence/parallel: return a function that creates and starts the animation
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
        // For stagger: return animation WITHOUT calling start() - stagger handles that
        const boxes = boxRefs.current.filter(Boolean) as HTMLDivElement[]
        await stagger(boxes, (box) => {
          return spring(0, 200, {
            stiffness: 180,
            damping: 20,
            onUpdate: v => { box.style.left = `${8 + v}px` }
          })
        }, { delay: 120 })
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

function AdvancedDragDemo() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pos, api] = useDrag({
    bounds: { left: -120, right: 120, top: -60, bottom: 60 },
    rubberBand: true,
    rubberBandFactor: 0.2,
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
        ref={containerRef}
        className="h-48 bg-black/20 rounded-xl relative overflow-hidden transition-transform"
        style={{
          transform: `scale(${bgStyle.scale})`,
          borderColor: `rgba(6, 182, 212, ${bgStyle.borderOpacity})`,
          borderWidth: 2,
          borderStyle: 'solid'
        }}
      >
        {/* Bounds indicator */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-32 border border-dashed border-white/10 rounded-lg" />
        {/* Center crosshair */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-px bg-white/10" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-4 bg-white/10" />

        {/* Draggable element - centered with transform */}
        <div
          ref={api.ref}
          className="absolute w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl cursor-grab active:cursor-grabbing flex items-center justify-center shadow-lg select-none transition-shadow"
          style={{
            left: '50%',
            top: '50%',
            transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
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

function DecayDemo() {
  const boxRef = useRef<HTMLDivElement>(null)
  const [velocity, setVelocity] = useState(800)
  const [position, setPosition] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const fling = () => {
    if (!boxRef.current || isAnimating) return
    setIsAnimating(true)
    boxRef.current.style.transform = 'translateX(0)'
    setPosition(0)

    decay({
      velocity: velocity / 60, // Convert to per-frame velocity
      deceleration: 0.95,
      clamp: [0, 280],
      onUpdate: v => {
        if (boxRef.current) boxRef.current.style.transform = `translateX(${v}px)`
        setPosition(v)
      },
      onComplete: () => setIsAnimating(false)
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
            min="200"
            max="2000"
            step="100"
            value={velocity}
            onChange={e => setVelocity(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <button
          onClick={fling}
          disabled={isAnimating}
          className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-teal-500/20"
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

function PresetsComparison() {
  const boxRefs = useRef<(HTMLDivElement | null)[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const animationsRef = useRef<Array<{ stop: () => void }>>([])

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

    // Stop any running animations
    animationsRef.current.forEach(a => a.stop())
    animationsRef.current = []

    // Reset all boxes
    boxRefs.current.forEach(box => {
      if (box) box.style.transform = 'translateX(0)'
    })

    let completed = 0
    const targetDistance = 250 // Shorter distance for better comparison

    setTimeout(() => {
      presets.forEach((preset, i) => {
        const box = boxRefs.current[i]
        if (!box) return

        const anim = spring(0, targetDistance, {
          ...preset.config,
          onUpdate: v => { box.style.transform = `translateX(${v}px)` },
          onComplete: () => {
            completed++
            if (completed === presets.length) setIsRunning(false)
          }
        }).start()

        animationsRef.current.push(anim)
      })
    }, 50)
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
      <div className="max-w-7xl mx-auto">
        {/* Spectacular Hero */}
        <SpectacularHero />

        {/* New Interactive Demos Section */}
        <AnimatedDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-2">Visual Effects</h2>
          <p className="text-white/40 mb-6">Stunning visual demonstrations of spring physics</p>

          <div className="grid lg:grid-cols-3 gap-6">
            <AnimatedDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <ParticleExplosion />
            </AnimatedDiv>
            <AnimatedDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <GravitySimulation />
            </AnimatedDiv>
            <AnimatedDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <WaveAnimation />
            </AnimatedDiv>
          </div>
        </AnimatedDiv>

        {/* Interactive Controls Section */}
        <AnimatedDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-2">Interactive Controls</h2>
          <p className="text-white/40 mb-6">Click, drag, and hover to experience spring physics</p>

          <div className="grid lg:grid-cols-3 gap-6">
            <AnimatedDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
              <MorphingShapes />
            </AnimatedDiv>
            <AnimatedDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <MagneticButtonsDemo />
            </AnimatedDiv>
            <AnimatedDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
              <IconCarousel />
            </AnimatedDiv>
          </div>
        </AnimatedDiv>

        {/* Core Demos Section */}
        <AnimatedDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-2">Core Features</h2>
          <p className="text-white/40 mb-6">Essential SpringKit functionality in action</p>

          <div className="grid lg:grid-cols-2 gap-6">
            <AnimatedDiv
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
              className="lg:col-span-2"
            >
              <PhysicsVisualizer />
            </AnimatedDiv>

            <AnimatedDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
              <TrailDemo />
            </AnimatedDiv>

            <AnimatedDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}>
              <OrchestrationDemo />
            </AnimatedDiv>

            <AnimatedDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
              <AdvancedDragDemo />
            </AnimatedDiv>

            <AnimatedDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }}>
              <DecayDemo />
            </AnimatedDiv>

            <AnimatedDiv
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="lg:col-span-2"
            >
              <PresetsComparison />
            </AnimatedDiv>
          </div>
        </AnimatedDiv>

        {/* Footer CTA */}
        <AnimatedDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-16"
        >
          <div className="glass rounded-3xl p-12 border border-white/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-amber-500/10" />
            <div className="relative">
              <Sparkles className="w-12 h-12 text-orange-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Ready to Create Amazing Animations?</h3>
              <p className="text-white/40 mb-6 max-w-md mx-auto">
                Start building fluid, natural animations with SpringKit's physics-based spring engine.
              </p>
              <a
                href="/docs/getting-started"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-orange-500/20"
              >
                Get Started
                <ChevronRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </AnimatedDiv>
      </div>
    </div>
  )
}
