import { Link } from 'react-router-dom'
import { ArrowRight, Zap, Feather, Layers, MousePointer2, Sparkles, Copy, Check, Github, Package, Play, RotateCcw, ChevronDown, Terminal, Code2, Cpu, Timer, Box, Waves, PenTool, Spline } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Highlight, themes } from 'prism-react-renderer'
import { useSpring, useDrag } from '@oxog/springkit/react'

// ============================================================================
// ANIMATED DIV COMPONENT - Using SpringKit instead of framer-motion
// ============================================================================

interface AnimatedDivProps extends React.HTMLAttributes<HTMLDivElement> {
  initial?: { opacity?: number; y?: number; x?: number; scale?: number }
  animate?: { opacity?: number; y?: number; x?: number; scale?: number; rotate?: number }
  whileInView?: { opacity?: number; y?: number; x?: number; scale?: number }
  whileHover?: { y?: number; scale?: number }
  viewport?: { once?: boolean; margin?: string }
  transition?: { duration?: number; delay?: number; ease?: number[] | string; repeat?: number; type?: string; stiffness?: number; damping?: number }
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ...rest
}: AnimatedDivProps) {
  // Filter out animation props that shouldn't be passed to DOM
  const { ...props } = rest as Record<string, unknown>
  // Remove any animation-related props that might leak through
  delete props.initial
  delete props.animate
  delete props.whileInView
  delete props.whileHover
  delete props.viewport
  delete props.transition
  const ref = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const hasAnimated = useRef(false)

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

  // Auto-animate on mount if using animate (not whileInView)
  useEffect(() => {
    if (!whileInView && animate) {
      const delay = (transition?.delay || 0) * 1000
      const timer = setTimeout(() => setIsMounted(true), delay)
      return () => clearTimeout(timer)
    } else if (!whileInView && !animate) {
      // No animation needed, show immediately
      setIsMounted(true)
    }
  }, [])

  // Determine if we should show animated state
  const shouldShowAnimated = whileInView ? isInView : isMounted

  // Calculate current values
  const currentValues = shouldShowAnimated
    ? {
        opacity: (whileInView || animate)?.opacity ?? 1,
        y: (whileInView || animate)?.y ?? 0,
        x: (whileInView || animate)?.x ?? 0,
        scale: (whileInView || animate)?.scale ?? 1,
      }
    : {
        opacity: initial?.opacity ?? 1,
        y: initial?.y ?? 0,
        x: initial?.x ?? 0,
        scale: initial?.scale ?? 1,
      }

  // Apply hover overrides
  if (whileHover && isHovered) {
    if (whileHover.y !== undefined) currentValues.y = whileHover.y
    if (whileHover.scale !== undefined) currentValues.scale = whileHover.scale
  }

  const transform = `translate(${currentValues.x}px, ${currentValues.y}px) scale(${currentValues.scale})`

  // Use CSS transitions for smooth animations
  const transitionDuration = transition?.duration ?? 0.5
  const cssTransition = `opacity ${transitionDuration}s ease-out, transform ${transitionDuration}s ease-out`

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: currentValues.opacity,
        transform,
        transition: cssTransition,
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
// SPECTACULAR HERO SPRING VISUALIZATION WITH COLLISION PHYSICS
// All positions are RELATIVE to the container center (0,0 = center of rings)
// ============================================================================

interface TrailPoint {
  x: number
  y: number
}

interface Ball {
  id: number
  x: number // Position relative to container center
  y: number // Position relative to container center
  vx: number
  vy: number
  radius: number
  color: string
  hue: number
  isDragging: boolean
  trail: TrailPoint[] // Trail positions relative to container center
}

const BALL_CONFIGS = [
  { x: 0, y: 0, radius: 32, hue: 25, color: 'from-orange-400 via-orange-500 to-amber-600' },
  { x: -80, y: -60, radius: 24, hue: 280, color: 'from-purple-400 via-purple-500 to-fuchsia-600' },
  { x: 80, y: -40, radius: 28, hue: 180, color: 'from-cyan-400 via-cyan-500 to-teal-600' },
  { x: -60, y: 70, radius: 22, hue: 340, color: 'from-rose-400 via-rose-500 to-pink-600' },
  { x: 100, y: 50, radius: 26, hue: 140, color: 'from-green-400 via-emerald-500 to-teal-600' },
]

const TRAIL_COUNT = 3 // Number of trail shadows per ball
const TRAIL_SPRING_FACTOR = [0.15, 0.08, 0.04] // Spring stiffness for each trail (lower = more delay)

function HeroSpringDemo() {
  const [preset, setPreset] = useState<'bouncy' | 'gentle' | 'stiff' | 'wobbly'>('bouncy')
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const draggingBallRef = useRef<number | null>(null)
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // Extended bounds - balls can roam far but will be pulled back
  const bounds = { left: -400, right: 400, top: -350, bottom: 350 }

  // Initialize balls with relative positions (relative to container center)
  const [balls, setBalls] = useState<Ball[]>(() =>
    BALL_CONFIGS.map((cfg, i) => ({
      id: i,
      x: cfg.x,
      y: cfg.y,
      vx: 0,
      vy: 0,
      radius: cfg.radius,
      color: cfg.color,
      hue: cfg.hue,
      isDragging: false,
      trail: Array(TRAIL_COUNT).fill(null).map(() => ({ x: cfg.x, y: cfg.y })),
    }))
  )

  const presetConfigs = {
    bouncy: { stiffness: 400, damping: 10, restitution: 0.9 },
    gentle: { stiffness: 120, damping: 14, restitution: 0.6 },
    stiff: { stiffness: 700, damping: 30, restitution: 0.4 },
    wobbly: { stiffness: 180, damping: 8, restitution: 0.95 },
  }

  const config = presetConfigs[preset]

  // Physics simulation
  useEffect(() => {
    const simulate = () => {
      setBalls(prevBalls => {
        const newBalls = prevBalls.map(ball => ({ ...ball }))
        const dt = 1 / 60

        for (let i = 0; i < newBalls.length; i++) {
          const ball = newBalls[i]
          if (ball.isDragging) continue

          // Home position is the original config position
          const homeX = BALL_CONFIGS[i].x
          const homeY = BALL_CONFIGS[i].y

          // Apply spring force towards home position with very weak attraction
          const springForce = 0.5 // Weak home force
          const dx = homeX - ball.x
          const dy = homeY - ball.y

          // Only apply home force if far from rest and moving slowly
          const distFromRest = Math.sqrt(dx * dx + dy * dy)
          const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy)

          if (distFromRest > 5 && speed < 50) {
            ball.vx += dx * springForce * dt
            ball.vy += dy * springForce * dt
          }

          // Apply damping
          const dampingFactor = 1 - (config.damping * 0.01)
          ball.vx *= dampingFactor
          ball.vy *= dampingFactor

          // Update position
          ball.x += ball.vx * dt * 60
          ball.y += ball.vy * dt * 60

          // Boundary collision with spring bounce
          if (ball.x - ball.radius < bounds.left) {
            ball.x = bounds.left + ball.radius
            ball.vx = Math.abs(ball.vx) * config.restitution
          }
          if (ball.x + ball.radius > bounds.right) {
            ball.x = bounds.right - ball.radius
            ball.vx = -Math.abs(ball.vx) * config.restitution
          }
          if (ball.y - ball.radius < bounds.top) {
            ball.y = bounds.top + ball.radius
            ball.vy = Math.abs(ball.vy) * config.restitution
          }
          if (ball.y + ball.radius > bounds.bottom) {
            ball.y = bounds.bottom - ball.radius
            ball.vy = -Math.abs(ball.vy) * config.restitution
          }
        }

        // Ball-to-ball collision detection and response
        for (let i = 0; i < newBalls.length; i++) {
          for (let j = i + 1; j < newBalls.length; j++) {
            const a = newBalls[i]
            const b = newBalls[j]

            const dx = b.x - a.x
            const dy = b.y - a.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            const minDist = a.radius + b.radius

            if (dist < minDist && dist > 0) {
              // Collision detected - calculate spring-based response
              const overlap = minDist - dist
              const nx = dx / dist
              const ny = dy / dist

              // Separate balls
              const separationForce = overlap * 0.5
              if (!a.isDragging) {
                a.x -= nx * separationForce
                a.y -= ny * separationForce
              }
              if (!b.isDragging) {
                b.x += nx * separationForce
                b.y += ny * separationForce
              }

              // Calculate relative velocity
              const dvx = a.vx - b.vx
              const dvy = a.vy - b.vy
              const dvn = dvx * nx + dvy * ny

              // Only resolve if balls are moving towards each other
              if (dvn > 0) {
                // Spring-based impulse with restitution
                const impulse = dvn * config.restitution * 1.2

                // Apply impulse based on mass (radius)
                const totalMass = a.radius + b.radius
                const aRatio = b.radius / totalMass
                const bRatio = a.radius / totalMass

                if (!a.isDragging) {
                  a.vx -= impulse * nx * aRatio
                  a.vy -= impulse * ny * aRatio
                  // Add spring "pop" effect
                  a.vx -= nx * overlap * config.stiffness * 0.01 * aRatio
                  a.vy -= ny * overlap * config.stiffness * 0.01 * aRatio
                }
                if (!b.isDragging) {
                  b.vx += impulse * nx * bRatio
                  b.vy += impulse * ny * bRatio
                  // Add spring "pop" effect
                  b.vx += nx * overlap * config.stiffness * 0.01 * bRatio
                  b.vy += ny * overlap * config.stiffness * 0.01 * bRatio
                }
              }
            }
          }
        }

        // Update trail positions with spring physics (trails follow their ball)
        for (const ball of newBalls) {
          for (let t = 0; t < ball.trail.length; t++) {
            const trail = ball.trail[t]
            const springFactor = TRAIL_SPRING_FACTOR[t]

            // Spring towards ball position
            trail.x += (ball.x - trail.x) * springFactor
            trail.y += (ball.y - trail.y) * springFactor
          }
        }

        return newBalls
      })

      animationRef.current = requestAnimationFrame(simulate)
    }

    animationRef.current = requestAnimationFrame(simulate)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [config])

  // Find which ball is at a given position (relative to container center)
  const findBallAtPosition = (relX: number, relY: number): number | null => {
    // Check from front to back (higher z-index first)
    for (let i = balls.length - 1; i >= 0; i--) {
      const ball = balls[i]
      const dx = relX - ball.x
      const dy = relY - ball.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist <= ball.radius) {
        return ball.id
      }
    }
    return null
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    // Convert to relative coords
    const relX = e.clientX - centerX
    const relY = e.clientY - centerY

    // Find which ball was clicked
    const ballId = findBallAtPosition(relX, relY)
    if (ballId === null) return

    // Store offset from ball center to pointer
    const ball = balls.find(b => b.id === ballId)!
    dragOffsetRef.current = {
      x: ball.x - relX,
      y: ball.y - relY
    }

    draggingBallRef.current = ballId
    e.currentTarget.setPointerCapture(e.pointerId)

    setBalls(prev => prev.map(b =>
      b.id === ballId ? { ...b, isDragging: true, vx: 0, vy: 0 } : b
    ))
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current || draggingBallRef.current === null) return

    const ballId = draggingBallRef.current
    const rect = containerRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    // Convert screen coords to relative coords (relative to container center)
    // Add back the offset so we drag from where we grabbed
    const newX = e.clientX - centerX + dragOffsetRef.current.x
    const newY = e.clientY - centerY + dragOffsetRef.current.y

    // Clamp to bounds
    const clampedX = Math.max(bounds.left, Math.min(bounds.right, newX))
    const clampedY = Math.max(bounds.top, Math.min(bounds.bottom, newY))

    setBalls(prev => prev.map(b =>
      b.id === ballId ? {
        ...b,
        x: clampedX,
        y: clampedY,
        vx: e.movementX * 2,
        vy: e.movementY * 2,
      } : b
    ))
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    const ballId = draggingBallRef.current
    if (ballId === null) return

    e.currentTarget.releasePointerCapture(e.pointerId)
    draggingBallRef.current = null

    setBalls(prev => prev.map(b =>
      b.id === ballId ? { ...b, isDragging: false } : b
    ))
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[500px] flex items-center justify-center overflow-visible cursor-grab active:cursor-grabbing touch-none select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* All balls and trails are positioned relative to container center */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Trail shadows - rendered behind balls, positioned relative to center */}
        {balls.map((ball) =>
          ball.trail.map((trail, trailIndex) => {
            const scale = 1 - (trailIndex + 1) * 0.15
            const opacity = 0.3 - trailIndex * 0.08
            const trailRadius = ball.radius * scale

            return (
              <div
                key={`trail-${ball.id}-${trailIndex}`}
                className="absolute pointer-events-none"
                style={{
                  left: '50%',
                  top: '50%',
                  width: trailRadius * 2,
                  height: trailRadius * 2,
                  transform: `translate(calc(-50% + ${trail.x}px), calc(-50% + ${trail.y}px))`,
                  zIndex: 5 - trailIndex,
                }}
              >
                <div
                  className="w-full h-full rounded-full"
                  style={{
                    background: `radial-gradient(circle, hsla(${ball.hue}, 100%, 55%, ${opacity}) 0%, hsla(${ball.hue}, 100%, 45%, ${opacity * 0.5}) 50%, transparent 70%)`,
                    filter: `blur(${2 + trailIndex * 2}px)`,
                  }}
                />
              </div>
            )
          })
        )}

        {/* Balls - positioned relative to center */}
        {balls.map((ball) => (
          <div
            key={ball.id}
            className="absolute pointer-events-none"
            style={{
              left: '50%',
              top: '50%',
              width: ball.radius * 2,
              height: ball.radius * 2,
              transform: `translate(calc(-50% + ${ball.x}px), calc(-50% + ${ball.y}px)) scale(${ball.isDragging ? 1.15 : 1})`,
              zIndex: ball.isDragging ? 20 : 10,
            }}
          >
            {/* Glow effect */}
            <div
              className="absolute rounded-full blur-xl pointer-events-none"
              style={{
                background: `radial-gradient(circle, hsla(${ball.hue}, 100%, 55%, 0.5) 0%, transparent 70%)`,
                width: ball.radius * 3,
                height: ball.radius * 3,
                left: '50%',
                top: '50%',
                marginLeft: -ball.radius * 1.5,
                marginTop: -ball.radius * 1.5,
                transform: `scale(${ball.isDragging ? 1.3 : 1})`,
                opacity: ball.isDragging ? 0.9 : 0.6,
                transition: 'transform 0.3s, opacity 0.3s',
              }}
            />

            {/* Ball */}
            <div
              className={`relative w-full h-full rounded-full bg-gradient-to-br ${ball.color} shadow-2xl flex items-center justify-center`}
              style={{
                boxShadow: `0 0 20px hsla(${ball.hue}, 100%, 50%, 0.3), inset 0 -2px 10px rgba(0,0,0,0.2)`,
              }}
            >
              {ball.id === 0 && <Sparkles className="w-6 h-6 text-white/90" />}
              {/* Highlight */}
              <div
                className="absolute top-1 left-1/4 w-1/3 h-1/4 rounded-full bg-white/30 blur-sm pointer-events-none"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Concentric rings - using CSS animation for continuous rotation */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full border border-orange-500/10"
            style={{
              width: 100 + i * 80,
              height: 100 + i * 80,
              animation: `spin ${20 + i * 5}s linear infinite ${i % 2 === 0 ? '' : 'reverse'}`,
            }}
          />
        ))}
      </div>

      {/* Preset selector */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-30">
        {(Object.keys(presetConfigs) as Array<keyof typeof presetConfigs>).map((p) => (
          <button
            key={p}
            onClick={() => setPreset(p)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              preset === p
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* Drag hint */}
      <AnimatedDiv
        className="absolute top-4 left-1/2 -translate-x-1/2 text-sm text-white/40 z-30"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <p>Drag the balls and watch them collide with spring physics</p>
      </AnimatedDiv>
    </div>
  )
}

// ============================================================================
// INTERACTIVE PHYSICS PLAYGROUND - ENHANCED VERSION
// ============================================================================

interface SpringConfig {
  name: string
  stiffness: number
  damping: number
  color: string
  hue: number
}

const PRESET_SPRINGS: SpringConfig[] = [
  { name: 'Bouncy', stiffness: 400, damping: 10, color: 'from-orange-400 to-amber-500', hue: 25 },
  { name: 'Gentle', stiffness: 120, damping: 14, color: 'from-cyan-400 to-teal-500', hue: 180 },
  { name: 'Stiff', stiffness: 700, damping: 30, color: 'from-purple-400 to-fuchsia-500', hue: 280 },
]

function PhysicsPlayground() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [positions, setPositions] = useState<number[]>([0, 0, 0])
  const [graphData, setGraphData] = useState<number[][]>([[], [], []])
  const animationRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Calculate spring position at time t
  const calculateSpringPosition = useCallback((config: SpringConfig, t: number): number => {
    const omega = Math.sqrt(config.stiffness)
    const zeta = config.damping / (2 * Math.sqrt(config.stiffness))

    if (zeta < 1) {
      // Underdamped
      const omegaD = omega * Math.sqrt(1 - zeta * zeta)
      return 1 - Math.exp(-zeta * omega * t) * (Math.cos(omegaD * t) + (zeta * omega / omegaD) * Math.sin(omegaD * t))
    } else if (zeta === 1) {
      // Critically damped
      return 1 - (1 + omega * t) * Math.exp(-omega * t)
    } else {
      // Overdamped
      const r1 = -omega * (zeta - Math.sqrt(zeta * zeta - 1))
      const r2 = -omega * (zeta + Math.sqrt(zeta * zeta - 1))
      return 1 - (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1)
    }
  }, [])

  // Draw the graph
  const drawGraph = useCallback((data: number[][]) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const padding = 20

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
    ctx.lineWidth = 1

    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = padding + (height - 2 * padding) * (i / 4)
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
    }

    // Target line (value = 1)
    ctx.strokeStyle = 'rgba(251, 146, 60, 0.3)'
    ctx.setLineDash([4, 4])
    const targetY = padding + (height - 2 * padding) * 0.1
    ctx.beginPath()
    ctx.moveTo(padding, targetY)
    ctx.lineTo(width - padding, targetY)
    ctx.stroke()
    ctx.setLineDash([])

    // Draw each spring curve
    const colors = ['rgba(251, 146, 60, 0.9)', 'rgba(34, 211, 238, 0.9)', 'rgba(192, 132, 252, 0.9)']

    data.forEach((points, index) => {
      if (points.length < 2) return

      // Main line
      ctx.strokeStyle = colors[index]
      ctx.lineWidth = 2.5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()

      points.forEach((value, i) => {
        const x = padding + (width - 2 * padding) * (i / 180)
        const y = padding + (height - 2 * padding) * (1 - value * 0.9)

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.stroke()
    })
  }, [])

  // Animation loop
  useEffect(() => {
    if (!isPlaying) return

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const elapsed = (timestamp - startTimeRef.current) / 1000

      setTime(elapsed)

      // Calculate positions for each spring
      const newPositions = PRESET_SPRINGS.map(config =>
        calculateSpringPosition(config, elapsed)
      )
      setPositions(newPositions)

      // Update graph data
      setGraphData(prev => {
        const newData = prev.map((arr, i) => {
          const newArr = [...arr, newPositions[i]]
          if (newArr.length > 180) newArr.shift()
          return newArr
        })
        return newData
      })

      if (elapsed < 3) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setIsPlaying(false)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [isPlaying, calculateSpringPosition])

  // Draw graph when data changes
  useEffect(() => {
    drawGraph(graphData)
  }, [graphData, drawGraph])

  const play = () => {
    startTimeRef.current = 0
    setTime(0)
    setPositions([0, 0, 0])
    setGraphData([[], [], []])
    setIsPlaying(true)
  }

  const reset = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current)
    setIsPlaying(false)
    setTime(0)
    setPositions([0, 0, 0])
    setGraphData([[], [], []])
  }

  return (
    <div className="glass rounded-3xl p-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-orange-500/10 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-cyan-500/10 to-transparent rounded-full blur-3xl" />

      <div className="relative">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Spring Comparison</h3>
            <p className="text-white/50 text-sm">Watch how different spring configurations animate to the same target</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={play}
              disabled={isPlaying}
              className="gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0"
            >
              <Play className="w-4 h-4" />
              {isPlaying ? 'Running...' : 'Compare'}
            </Button>
            <Button
              onClick={reset}
              variant="outline"
              className="gap-2 border-white/10 hover:bg-white/5"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-6">
          {PRESET_SPRINGS.map((spring) => {
            const zeta = spring.damping / (2 * Math.sqrt(spring.stiffness))
            return (
              <div key={spring.name} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
                <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${spring.color}`} />
                <span className="text-sm text-white font-medium">{spring.name}</span>
                <span className="text-xs text-white/40">ζ={zeta.toFixed(2)}</span>
              </div>
            )
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Ball Animation */}
          <div className="relative h-72 bg-white/5 rounded-2xl overflow-hidden">
            {/* Grid pattern */}
            <div className="absolute inset-0 grid-pattern opacity-10" />

            {/* Start line */}
            <div className="absolute top-8 left-0 right-0 h-px bg-white/10">
              <span className="absolute left-2 -top-3 text-xs text-white/30">start</span>
            </div>

            {/* Target line */}
            <div className="absolute bottom-12 left-0 right-0 h-px bg-orange-500/40">
              <span className="absolute left-2 -top-3 text-xs text-orange-400/60">target</span>
            </div>

            {/* Vertical tracks */}
            {PRESET_SPRINGS.map((_, i) => (
              <div
                key={i}
                className="absolute top-8 bottom-12 w-px bg-white/5"
                style={{ left: `${25 + i * 25}%` }}
              />
            ))}

            {/* Balls */}
            {PRESET_SPRINGS.map((spring, i) => {
              const trackHeight = 200
              const ballY = 32 + positions[i] * trackHeight

              return (
                <AnimatedDiv
                  key={spring.name}
                  className="absolute"
                  style={{
                    left: `${25 + i * 25}%`,
                    top: ballY,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {/* Glow */}
                  <div
                    className={`absolute inset-0 rounded-full bg-gradient-to-r ${spring.color} blur-lg opacity-50`}
                    style={{ width: 40, height: 40, margin: -8 }}
                  />
                  {/* Ball */}
                  <div
                    className={`w-6 h-6 rounded-full bg-gradient-to-br ${spring.color} shadow-lg`}
                    style={{ boxShadow: `0 0 20px hsla(${spring.hue}, 100%, 50%, 0.4)` }}
                  />
                  {/* Label */}
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-white/40 whitespace-nowrap">
                    {spring.name}
                  </span>
                </AnimatedDiv>
              )
            })}

            {/* Time indicator */}
            <div className="absolute bottom-2 right-3 text-xs text-white/30 font-mono">
              {time.toFixed(2)}s
            </div>
          </div>

          {/* Real-time Graph */}
          <div className="relative h-72 bg-white/5 rounded-2xl overflow-hidden p-4">
            <div className="absolute top-4 left-4 text-xs text-white/30">Value over Time</div>
            <canvas
              ref={canvasRef}
              width={400}
              height={250}
              className="w-full h-full"
            />
            {/* Y-axis labels */}
            <div className="absolute left-2 top-6 text-xs text-white/20">1.0</div>
            <div className="absolute left-2 bottom-6 text-xs text-white/20">0.0</div>
          </div>
        </div>

        {/* Spring configs info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          {PRESET_SPRINGS.map((spring) => {
            const zeta = spring.damping / (2 * Math.sqrt(spring.stiffness))
            const dampingType = zeta < 1 ? 'Underdamped' : zeta === 1 ? 'Critical' : 'Overdamped'

            return (
              <div key={spring.name} className="p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${spring.color}`} />
                  <span className="text-sm font-medium text-white">{spring.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    zeta < 1 ? 'bg-green-500/20 text-green-400' :
                    zeta === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {dampingType}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-white/40">Stiffness</div>
                  <div className="text-white/70 font-mono">{spring.stiffness}</div>
                  <div className="text-white/40">Damping</div>
                  <div className="text-white/70 font-mono">{spring.damping}</div>
                  <div className="text-white/40">Damping Ratio</div>
                  <div className="text-white/70 font-mono">ζ = {zeta.toFixed(2)}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// STAGGER DEMO - Show stagger() animation with list items
// ============================================================================

const STAGGER_ITEMS = [
  { icon: Zap, label: 'Lightning Fast', color: 'from-yellow-400 to-orange-500' },
  { icon: Feather, label: 'Zero Dependencies', color: 'from-green-400 to-emerald-500' },
  { icon: Layers, label: 'Full Orchestration', color: 'from-purple-400 to-pink-500' },
  { icon: MousePointer2, label: 'Gesture Ready', color: 'from-blue-400 to-cyan-500' },
  { icon: Waves, label: 'Smooth Interpolation', color: 'from-rose-400 to-red-500' },
  { icon: Cpu, label: 'React Integration', color: 'from-indigo-400 to-violet-500' },
]

function StaggerDemo() {
  const [isAnimating, setIsAnimating] = useState(false)
  const [visibleItems, setVisibleItems] = useState<number[]>([])
  const [staggerDelay, setStaggerDelay] = useState(100)

  const runStagger = useCallback(() => {
    setIsAnimating(true)
    setVisibleItems([])

    STAGGER_ITEMS.forEach((_, index) => {
      setTimeout(() => {
        setVisibleItems(prev => [...prev, index])
      }, index * staggerDelay)
    })

    setTimeout(() => {
      setIsAnimating(false)
    }, STAGGER_ITEMS.length * staggerDelay + 500)
  }, [staggerDelay])

  const reset = () => {
    setVisibleItems([])
    setIsAnimating(false)
  }

  return (
    <div className="glass rounded-3xl p-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-cyan-500/10 to-transparent rounded-full blur-3xl" />

      <div className="relative">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Stagger Animation</h3>
            <p className="text-white/50 text-sm">Create cascading animations with customizable delays</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={runStagger}
              disabled={isAnimating}
              className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
            >
              <Play className="w-4 h-4" />
              {isAnimating ? 'Running...' : 'Stagger'}
            </Button>
            <Button
              onClick={reset}
              variant="outline"
              className="gap-2 border-white/10 hover:bg-white/5"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          </div>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <span className="text-sm text-white/50">Delay:</span>
          <input
            type="range"
            min="50"
            max="300"
            value={staggerDelay}
            onChange={(e) => setStaggerDelay(Number(e.target.value))}
            className="flex-1 h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-purple-500 [&::-webkit-slider-thumb]:to-pink-500"
          />
          <span className="text-sm text-white/70 font-mono w-16">{staggerDelay}ms</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {STAGGER_ITEMS.map((item, index) => {
            const isVisible = visibleItems.includes(index)
            const Icon = item.icon

            return (
              <AnimatedDiv
                key={index}
                initial={{ opacity: 0, y: 30, scale: 0.8 }}
                animate={isVisible ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className="relative group"
              >
                <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-20 transition-opacity blur-xl`} />
                <div className="relative bg-white/5 rounded-xl p-4 border border-white/5 group-hover:border-white/10 transition-colors">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${item.color} flex items-center justify-center mb-3`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm text-white/70">{item.label}</span>
                </div>
              </AnimatedDiv>
            )
          })}
        </div>

        <div className="mt-6 p-4 rounded-xl bg-black/30 border border-white/5">
          <code className="text-xs text-white/60 font-mono">
            <span className="text-purple-400">stagger</span>
            <span className="text-white/40">(</span>
            <span className="text-cyan-400">animations</span>
            <span className="text-white/40">, {'{'}</span>
            <span className="text-orange-400"> delay</span>
            <span className="text-white/40">:</span>
            <span className="text-green-400"> {staggerDelay}</span>
            <span className="text-white/40"> {'}'})</span>
          </code>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// COLOR INTERPOLATION DEMO
// ============================================================================

const COLOR_PRESETS = [
  { name: 'Sunset', colors: ['#FF6B6B', '#FFA500', '#FFD93D'] },
  { name: 'Ocean', colors: ['#0077B6', '#00B4D8', '#90E0EF'] },
  { name: 'Forest', colors: ['#2D6A4F', '#40916C', '#95D5B2'] },
  { name: 'Neon', colors: ['#FF00FF', '#8B5CF6', '#06B6D4'] },
]

function hexToRgbObj(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : { r: 0, g: 0, b: 0 }
}

function ColorInterpolationDemo() {
  const [progress, setProgress] = useState(0)
  const [selectedPreset, setSelectedPreset] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const animationRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)

  const colors = COLOR_PRESETS[selectedPreset].colors

  const interpolateColorValue = useCallback((t: number, colorArr: string[]) => {
    if (colorArr.length === 2) {
      const c1 = hexToRgbObj(colorArr[0])
      const c2 = hexToRgbObj(colorArr[1])
      const r = Math.round(c1.r + (c2.r - c1.r) * t)
      const g = Math.round(c1.g + (c2.g - c1.g) * t)
      const b = Math.round(c1.b + (c2.b - c1.b) * t)
      return `rgb(${r}, ${g}, ${b})`
    }
    if (t < 0.5) {
      const localT = t * 2
      const c1 = hexToRgbObj(colorArr[0])
      const c2 = hexToRgbObj(colorArr[1])
      const r = Math.round(c1.r + (c2.r - c1.r) * localT)
      const g = Math.round(c1.g + (c2.g - c1.g) * localT)
      const b = Math.round(c1.b + (c2.b - c1.b) * localT)
      return `rgb(${r}, ${g}, ${b})`
    } else {
      const localT = (t - 0.5) * 2
      const c1 = hexToRgbObj(colorArr[1])
      const c2 = hexToRgbObj(colorArr[2])
      const r = Math.round(c1.r + (c2.r - c1.r) * localT)
      const g = Math.round(c1.g + (c2.g - c1.g) * localT)
      const b = Math.round(c1.b + (c2.b - c1.b) * localT)
      return `rgb(${r}, ${g}, ${b})`
    }
  }, [])

  const animate = useCallback(() => {
    setIsAnimating(true)
    setProgress(0)
    startTimeRef.current = 0

    const run = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const elapsed = (timestamp - startTimeRef.current) / 2000

      if (elapsed < 1) {
        setProgress(elapsed)
        animationRef.current = requestAnimationFrame(run)
      } else {
        setProgress(1)
        setIsAnimating(false)
      }
    }

    animationRef.current = requestAnimationFrame(run)
  }, [])

  const reset = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current)
    setProgress(0)
    setIsAnimating(false)
  }

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [])

  const currentColor = interpolateColorValue(progress, colors)

  return (
    <div className="glass rounded-3xl p-8 relative overflow-hidden">
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20 transition-colors duration-300"
        style={{ background: currentColor }}
      />

      <div className="relative">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Color Interpolation</h3>
            <p className="text-white/50 text-sm">Smoothly transition between colors with spring physics</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={animate}
              disabled={isAnimating}
              className="gap-2 text-white border-0"
              style={{ background: `linear-gradient(to right, ${colors[0]}, ${colors[colors.length - 1]})` }}
            >
              <Play className="w-4 h-4" />
              {isAnimating ? 'Running...' : 'Animate'}
            </Button>
            <Button
              onClick={reset}
              variant="outline"
              className="gap-2 border-white/10 hover:bg-white/5"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {COLOR_PRESETS.map((preset, i) => (
            <button
              key={preset.name}
              onClick={() => { setSelectedPreset(i); reset() }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedPreset === i
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
              style={{
                borderWidth: 2,
                borderStyle: 'solid',
                borderImage: `linear-gradient(to right, ${preset.colors.join(', ')}) 1`,
              }}
            >
              {preset.name}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          <div className="relative h-32 rounded-2xl overflow-hidden">
            <div
              className="absolute inset-0 transition-colors duration-100"
              style={{ background: currentColor }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-white drop-shadow-lg">{(progress * 100).toFixed(0)}%</div>
                <div className="text-sm text-white/80 font-mono drop-shadow">{currentColor}</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div
              className="h-4 rounded-full"
              style={{ background: `linear-gradient(to right, ${colors.join(', ')})` }}
            />
            <AnimatedDiv
              className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white shadow-lg border-2"
              style={{
                left: `calc(${progress * 100}% - 12px)`,
                borderColor: currentColor,
              }}
            />
          </div>

          <div className="flex justify-between">
            {colors.map((color, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full shadow-lg"
                  style={{ background: color }}
                />
                <span className="text-xs text-white/50 font-mono">{color}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 p-4 rounded-xl bg-black/30 border border-white/5">
          <code className="text-xs text-white/60 font-mono">
            <span className="text-purple-400">interpolateColor</span>
            <span className="text-white/40">(</span>
            <span className="text-green-400">{progress.toFixed(2)}</span>
            <span className="text-white/40">, [</span>
            <span className="text-orange-400">'{colors[0]}'</span>
            <span className="text-white/40">, </span>
            <span className="text-orange-400">'{colors[colors.length - 1]}'</span>
            <span className="text-white/40">])</span>
          </code>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// INTERACTIVE DRAG DEMO - Rubber band physics
// ============================================================================

function DragDemo() {
  const [trail, setTrail] = useState<{ x: number; y: number }[]>([])

  // Use SpringKit's useDrag hook with rubber band physics
  const [pos, api] = useDrag({
    bounds: { left: -150, right: 150, top: -100, bottom: 100 },
    rubberBand: true,
    rubberBandFactor: 0.3,
  })

  // Track trail during drag
  useEffect(() => {
    if (api.isDragging) {
      setTrail(prev => {
        const newTrail = [...prev, { x: pos.x, y: pos.y }]
        if (newTrail.length > 20) newTrail.shift()
        return newTrail
      })
    } else {
      // Clear trail after drag ends
      const timer = setTimeout(() => setTrail([]), 500)
      return () => clearTimeout(timer)
    }
  }, [pos.x, pos.y, api.isDragging])

  // Spring for scale animation
  const scaleSpring = useSpring({
    scale: api.isDragging ? 1.2 : 1,
  }, { stiffness: 500, damping: 25 })

  return (
    <div className="glass rounded-3xl p-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-to-tl from-green-500/10 to-transparent rounded-full blur-3xl" />

      <div className="relative">
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-1">Drag Spring with Rubber Band</h3>
          <p className="text-white/50 text-sm">Drag the ball beyond bounds to feel the elastic resistance</p>
        </div>

        <div className="relative h-64 bg-white/5 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 grid-pattern opacity-10" />
          <div className="absolute inset-8 border border-dashed border-white/10 rounded-xl" />
          <div className="absolute top-6 left-1/2 -translate-x-1/2 text-xs text-white/30">bounds</div>

          {trail.map((point, i) => (
            <div
              key={i}
              className="absolute w-6 h-6 rounded-full bg-gradient-to-br from-blue-400/20 to-cyan-400/20"
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(calc(-50% + ${point.x}px), calc(-50% + ${point.y}px))`,
                opacity: (i / trail.length) * 0.5,
              }}
            />
          ))}

          <div
            ref={api.ref}
            className="absolute left-1/2 top-1/2 -ml-6 -mt-6 cursor-grab active:cursor-grabbing z-10 touch-none"
            style={{
              transform: `translate(${pos.x}px, ${pos.y}px) scale(${scaleSpring.scale})`,
            }}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 blur-xl opacity-50" style={{ width: 64, height: 64, margin: -8 }} />
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 shadow-lg flex items-center justify-center">
              <MousePointer2 className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="absolute bottom-3 right-3 text-xs text-white/30 font-mono">
            x: {pos.x.toFixed(0)} y: {pos.y.toFixed(0)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <div className="text-sm text-white/70 mb-2">Features</div>
            <ul className="text-xs text-white/50 space-y-1">
              <li>• Rubber band elasticity</li>
              <li>• Momentum on release</li>
              <li>• Spring back to bounds</li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <div className="text-sm text-white/70 mb-2">SpringKit Code</div>
            <code className="text-xs text-white/50 font-mono">
              createDragSpring(el, {'{'}<br />
              &nbsp;&nbsp;rubberBand: true,<br />
              &nbsp;&nbsp;bounds: {'{ ... }'}<br />
              {'}'})
            </code>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// COPY BUTTON
// ============================================================================

function CopyButton({ text, className = '' }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className={`p-2 rounded-lg hover:bg-white/10 transition-colors ${className}`}
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-400" />
      ) : (
        <Copy className="w-4 h-4 text-white/50" />
      )}
    </button>
  )
}

// ============================================================================
// CODE BLOCK
// ============================================================================

function CodeBlock({ code, filename, showLineNumbers = true }: { code: string; filename?: string; showLineNumbers?: boolean }) {
  return (
    <div className="code-block relative group overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          {filename && (
            <span className="text-xs text-white/40 font-mono">{filename}</span>
          )}
        </div>
        <CopyButton text={code} />
      </div>

      <Highlight theme={themes.nightOwl} code={code.trim()} language="tsx">
        {({ style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className="p-4 overflow-x-auto text-sm leading-relaxed"
            style={{ ...style, background: 'transparent' }}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })} className="flex">
                {showLineNumbers && (
                  <span className="select-none w-8 text-white/20 text-right pr-4 flex-shrink-0">
                    {i + 1}
                  </span>
                )}
                <span>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </span>
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  )
}

// ============================================================================
// FEATURE CARD
// ============================================================================

function FeatureCard({ icon: Icon, title, description, gradient, delay }: {
  icon: React.ElementType
  title: string
  description: string
  gradient: string
  delay: number
}) {
  return (
    <AnimatedDiv
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative"
    >
      {/* Hover glow */}
      <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl ${gradient}`} />

      <div className="relative glass rounded-2xl p-6 h-full border border-white/5 group-hover:border-white/10 transition-colors">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${gradient}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>

        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-orange-300 transition-colors">
          {title}
        </h3>
        <p className="text-white/50 text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </AnimatedDiv>
  )
}

// ============================================================================
// STATS
// ============================================================================

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const duration = 1500
          const startTime = performance.now()

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)

            // Easing function
            const eased = 1 - Math.pow(1 - progress, 4)
            setDisplayValue(Math.floor(eased * value))

            if (progress < 1) {
              requestAnimationFrame(animate)
            }
          }

          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [value])

  return (
    <span ref={ref}>
      {displayValue}{suffix}
    </span>
  )
}

function Stats() {
  const stats = [
    { value: 7, suffix: 'KB', label: 'Gzipped', icon: Box },
    { value: 0, suffix: '', label: 'Dependencies', icon: Feather },
    { value: 100, suffix: '%', label: 'TypeScript', icon: Code2 },
    { value: 380, suffix: '+', label: 'Tests', icon: Timer },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {stats.map((stat, i) => (
        <AnimatedDiv
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.1 }}
          className="relative group"
        >
          <div className="glass rounded-2xl p-6 text-center border border-white/5 group-hover:border-orange-500/20 transition-colors">
            <stat.icon className="w-5 h-5 text-orange-400/50 mx-auto mb-3" />
            <div className="text-3xl lg:text-4xl font-bold text-gradient mb-1">
              <AnimatedNumber value={stat.value} suffix={stat.suffix} />
            </div>
            <div className="text-sm text-white/40">{stat.label}</div>
          </div>
        </AnimatedDiv>
      ))}
    </div>
  )
}

// ============================================================================
// COMPARISON TABLE
// ============================================================================

function ComparisonTable() {
  const libraries = [
    { name: 'SpringKit', bundle: '~7KB', deps: '0', ts: true, gestures: true, presets: true },
    { name: 'Framer Motion', bundle: '~45KB', deps: '3', ts: true, gestures: true, presets: true },
    { name: 'React Spring', bundle: '~25KB', deps: '2', ts: true, gestures: false, presets: false },
    { name: 'GSAP', bundle: '~60KB', deps: '0', ts: false, gestures: false, presets: false },
  ]

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-4 px-4 text-white/50 font-medium text-sm">Library</th>
            <th className="text-center py-4 px-4 text-white/50 font-medium text-sm">Bundle Size</th>
            <th className="text-center py-4 px-4 text-white/50 font-medium text-sm">Dependencies</th>
            <th className="text-center py-4 px-4 text-white/50 font-medium text-sm">TypeScript</th>
            <th className="text-center py-4 px-4 text-white/50 font-medium text-sm">Gestures</th>
            <th className="text-center py-4 px-4 text-white/50 font-medium text-sm">Presets</th>
          </tr>
        </thead>
        <tbody>
          {libraries.map((lib) => (
            <tr
              key={lib.name}
              className={`border-b border-white/5 ${lib.name === 'SpringKit' ? 'bg-orange-500/5' : ''}`}
            >
              <td className="py-4 px-4">
                <span className={`font-medium ${lib.name === 'SpringKit' ? 'text-orange-400' : 'text-white'}`}>
                  {lib.name}
                </span>
              </td>
              <td className="text-center py-4 px-4 font-mono text-sm text-white/70">{lib.bundle}</td>
              <td className="text-center py-4 px-4 font-mono text-sm text-white/70">{lib.deps}</td>
              <td className="text-center py-4 px-4">
                {lib.ts ? <Check className="w-4 h-4 text-green-400 mx-auto" /> : <span className="text-white/30">—</span>}
              </td>
              <td className="text-center py-4 px-4">
                {lib.gestures ? <Check className="w-4 h-4 text-green-400 mx-auto" /> : <span className="text-white/30">—</span>}
              </td>
              <td className="text-center py-4 px-4">
                {lib.presets ? <Check className="w-4 h-4 text-green-400 mx-auto" /> : <span className="text-white/30">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ============================================================================
// MAIN HOME COMPONENT
// ============================================================================

export function Home() {
  const installCode = 'npm install @oxog/springkit'

  const vanillaExample = `import { spring, springPresets } from '@oxog/springkit'

// Create a bouncy spring animation
const anim = spring(0, 100, {
  ...springPresets.bouncy,
  onUpdate: (value) => {
    element.style.transform = \`translateX(\${value}px)\`
  },
  onComplete: () => console.log('Done!')
})

anim.start()`

  const reactExample = `import { useSpring, Animated } from '@oxog/springkit/react'

function BouncyCard() {
  const [isHovered, setIsHovered] = useState(false)

  const { scale, shadow } = useSpring({
    scale: isHovered ? 1.05 : 1,
    shadow: isHovered ? 20 : 5,
  })

  return (
    <Animated.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: \`scale(\${scale})\`,
        boxShadow: \`0 \${shadow}px 40px rgba(0,0,0,0.2)\`
      }}
    />
  )
}`

  const gestureExample = `import { createDragSpring } from '@oxog/springkit'

const drag = createDragSpring(element, {
  rubberBand: true,
  momentum: true,
  bounds: { left: 0, right: 300 },
  onDrag: ({ x, y, velocity }) => {
    // Real-time drag updates
  },
  onRelease: ({ x, y }) => {
    // Spring back or snap to position
  }
})`

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 mesh-gradient">
        {/* Floating orbs - using CSS animations for smooth infinite loops */}
        <div
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-orange-500/20 to-transparent blur-3xl animate-float-slow"
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-tl from-rose-500/15 to-transparent blur-3xl animate-float-slow-reverse"
        />

        {/* Grid overlay */}
        <div className="absolute inset-0 grid-pattern opacity-20" />

        {/* Noise texture */}
        <div className="absolute inset-0 noise" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center py-20 px-4">
          <div className="max-w-7xl mx-auto w-full">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Left: Content */}
              <div className="space-y-8">
                <AnimatedDiv
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
                >
                  {/* Badge */}
                  <AnimatedDiv
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-subtle mb-8"
                    whileHover={{ scale: 1.02 }}
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
                    </span>
                    <span className="text-sm text-white/70">v1.2.0 — AnimatePresence, Gesture Props, Keyframes, SVG Path, FLIP Layout</span>
                  </AnimatedDiv>

                  {/* Headline */}
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight">
                    <span className="text-white">Physics-based</span>
                    <br />
                    <span className="text-gradient">Spring Animations</span>
                  </h1>
                </AnimatedDiv>

                <AnimatedDiv
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, stiffness: 100, damping: 15 }}
                  className="text-lg md:text-xl text-white/50 max-w-xl leading-relaxed"
                >
                  <p>A zero-dependency animation library that brings natural, fluid motion
                  to your UI with real spring physics, gesture support, and React integration.</p>
                </AnimatedDiv>

                {/* CTA Buttons */}
                <AnimatedDiv
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
                  className="flex flex-wrap gap-4"
                >
                  <Link to="/docs/getting-started">
                    <Button size="lg" className="gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0 shadow-xl shadow-orange-500/25 h-12 px-6">
                      Get Started
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <a href="https://github.com/ersinkoc/springkit" target="_blank" rel="noreferrer">
                    <Button size="lg" variant="outline" className="gap-2 border-white/10 hover:bg-white/5 h-12 px-6">
                      <Github className="w-5 h-5" />
                      Star on GitHub
                    </Button>
                  </a>
                </AnimatedDiv>

                {/* Install command */}
                <AnimatedDiv
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
                >
                  <div className="inline-flex items-center gap-3 glass-subtle rounded-xl px-4 py-3">
                    <Terminal className="w-4 h-4 text-orange-400" />
                    <code className="text-sm text-white/70 font-mono">{installCode}</code>
                    <CopyButton text={installCode} />
                  </div>
                </AnimatedDiv>
              </div>

              {/* Right: Interactive Demo */}
              <AnimatedDiv
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="hidden lg:block"
              >
                <HeroSpringDemo />
              </AnimatedDiv>
            </div>

            {/* Scroll indicator */}
            <AnimatedDiv
              className="absolute bottom-8 left-1/2 -translate-x-1/2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              <div className="text-white/30 animate-bounce">
                <ChevronDown className="w-6 h-6" />
              </div>
            </AnimatedDiv>
          </div>
        </section>

        {/* Stats Section */}
        <section className="relative py-20 px-4 border-y border-white/5 bg-black/20 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto">
            <Stats />
          </div>
        </section>

        {/* Features Section */}
        <section className="relative py-32 px-4">
          <div className="max-w-6xl mx-auto">
            <AnimatedDiv
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-20"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Everything You Need
              </h2>
              <p className="text-white/50 text-lg max-w-2xl mx-auto">
                A complete animation toolkit with physics-based springs, gesture support,
                orchestration, and seamless React integration.
              </p>
            </AnimatedDiv>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon={Zap}
                title="Real Spring Physics"
                description="Based on actual spring equations with configurable stiffness, damping, and mass for natural, believable motion."
                gradient="bg-gradient-to-br from-yellow-500/20 to-orange-500/20"
                delay={0}
              />
              <FeatureCard
                icon={Feather}
                title="Zero Dependencies"
                description="No runtime dependencies. Everything implemented from scratch for maximum control and minimal bundle impact."
                gradient="bg-gradient-to-br from-green-500/20 to-emerald-500/20"
                delay={0.1}
              />
              <FeatureCard
                icon={MousePointer2}
                title="Gesture Support"
                description="Built-in drag and scroll springs with rubber band physics, momentum, and smooth boundary constraints."
                gradient="bg-gradient-to-br from-blue-500/20 to-cyan-500/20"
                delay={0.2}
              />
              <FeatureCard
                icon={Layers}
                title="Orchestration"
                description="Sequence, parallel, stagger, and trail animations for complex choreographed motion patterns."
                gradient="bg-gradient-to-br from-purple-500/20 to-pink-500/20"
                delay={0.3}
              />
              <FeatureCard
                icon={Waves}
                title="Interpolation"
                description="Interpolate between any values including colors, with support for custom output ranges and easing."
                gradient="bg-gradient-to-br from-rose-500/20 to-red-500/20"
                delay={0.4}
              />
              <FeatureCard
                icon={Cpu}
                title="React Hooks"
                description="useSpring, useSpringValue, useTrail, and more. Plus ready-to-use Animated components for React."
                gradient="bg-gradient-to-br from-indigo-500/20 to-violet-500/20"
                delay={0.5}
              />
              <FeatureCard
                icon={Sparkles}
                title="AnimatePresence"
                description="Exit animations for unmounting components. Mode: sync, wait, popLayout with onExitComplete callback."
                gradient="bg-gradient-to-br from-amber-500/20 to-yellow-500/20"
                delay={0.6}
              />
              <FeatureCard
                icon={MousePointer2}
                title="Gesture Props"
                description="whileHover, whileTap, whileFocus, whileInView, whileDrag - declarative gesture animations on Animated components."
                gradient="bg-gradient-to-br from-teal-500/20 to-cyan-500/20"
                delay={0.7}
              />
              <FeatureCard
                icon={Layers}
                title="FLIP Layout"
                description="Smooth layout change animations using the FLIP technique. flip(), flipBatch(), measureElement()."
                gradient="bg-gradient-to-br from-fuchsia-500/20 to-pink-500/20"
                delay={0.8}
              />
              <FeatureCard
                icon={Spline}
                title="Keyframes"
                description="Multi-step spring animations with keyframes(). Per-keyframe configs, onKeyframe callbacks, and smooth spring transitions."
                gradient="bg-gradient-to-br from-sky-500/20 to-blue-500/20"
                delay={0.9}
              />
              <FeatureCard
                icon={PenTool}
                title="SVG Path Animation"
                description="Line drawing effects with createPathAnimation(). Animate pathLength, pathOffset with spring physics."
                gradient="bg-gradient-to-br from-lime-500/20 to-green-500/20"
                delay={1.0}
              />
            </div>
          </div>
        </section>

        {/* Interactive Playground Section */}
        <section className="relative py-32 px-4 bg-black/20">
          <div className="max-w-5xl mx-auto">
            <AnimatedDiv
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Feel the Physics
              </h2>
              <p className="text-white/50 text-lg max-w-2xl mx-auto">
                Experiment with spring parameters in real-time.
                Adjust stiffness, damping, and mass to see how they affect motion.
              </p>
            </AnimatedDiv>

            <AnimatedDiv
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <PhysicsPlayground />
            </AnimatedDiv>
          </div>
        </section>

        {/* Orchestration Section - Stagger Demo */}
        <section className="relative py-32 px-4">
          <div className="max-w-5xl mx-auto">
            <AnimatedDiv
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Orchestrate with Ease
              </h2>
              <p className="text-white/50 text-lg max-w-2xl mx-auto">
                Create complex animation sequences with stagger, parallel, and sequential orchestration.
              </p>
            </AnimatedDiv>

            <AnimatedDiv
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <StaggerDemo />
            </AnimatedDiv>
          </div>
        </section>

        {/* Color & Gesture Demos */}
        <section className="relative py-32 px-4 bg-black/20">
          <div className="max-w-6xl mx-auto">
            <AnimatedDiv
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Rich Interpolation & Gestures
              </h2>
              <p className="text-white/50 text-lg max-w-2xl mx-auto">
                Interpolate between any values including colors, and build fluid gesture interactions.
              </p>
            </AnimatedDiv>

            <div className="grid lg:grid-cols-2 gap-8">
              <AnimatedDiv
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <ColorInterpolationDemo />
              </AnimatedDiv>
              <AnimatedDiv
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <DragDemo />
              </AnimatedDiv>
            </div>
          </div>
        </section>

        {/* Code Examples Section */}
        <section className="relative py-32 px-4">
          <div className="max-w-6xl mx-auto">
            <AnimatedDiv
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-20"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Simple API, Powerful Results
              </h2>
              <p className="text-white/50 text-lg max-w-2xl mx-auto">
                Get started in seconds with an intuitive API that feels natural.
                Works with vanilla JavaScript or React.
              </p>
            </AnimatedDiv>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Vanilla JS */}
              <AnimatedDiv
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <span className="font-medium text-white">Vanilla JavaScript</span>
                </div>
                <CodeBlock code={vanillaExample} filename="animation.ts" />
              </AnimatedDiv>

              {/* React */}
              <AnimatedDiv
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-cyan-400" />
                  <span className="font-medium text-white">React Hooks</span>
                </div>
                <CodeBlock code={reactExample} filename="BouncyCard.tsx" />
              </AnimatedDiv>
            </div>

            {/* Gesture Example */}
            <AnimatedDiv
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-purple-400" />
                <span className="font-medium text-white">Gesture Support</span>
              </div>
              <CodeBlock code={gestureExample} filename="drag.ts" />
            </AnimatedDiv>
          </div>
        </section>

        {/* Comparison Section */}
        <section className="relative py-32 px-4 bg-black/20">
          <div className="max-w-4xl mx-auto">
            <AnimatedDiv
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                How It Compares
              </h2>
              <p className="text-white/50 text-lg max-w-2xl mx-auto">
                SpringKit delivers premium features at a fraction of the bundle size.
              </p>
            </AnimatedDiv>

            <AnimatedDiv
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="glass rounded-2xl overflow-hidden"
            >
              <ComparisonTable />
            </AnimatedDiv>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-32 px-4">
          <div className="max-w-4xl mx-auto">
            <AnimatedDiv
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              {/* Glow background */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-rose-500/20 blur-3xl" />

              <div className="relative glass rounded-3xl p-12 md:p-16 text-center border border-white/10">
                <AnimatedDiv
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <Sparkles className="w-12 h-12 text-orange-400 mx-auto mb-6" />

                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    Ready to Add Spring to Your UI?
                  </h2>
                  <p className="text-white/50 text-lg mb-8 max-w-xl mx-auto">
                    Start building beautiful, physics-based animations today.
                    It only takes a minute to get started.
                  </p>

                  <div className="flex flex-wrap justify-center gap-4">
                    <Link to="/docs/getting-started">
                      <Button size="lg" className="gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0 shadow-xl shadow-orange-500/25 h-12 px-8">
                        Read the Docs
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link to="/examples">
                      <Button size="lg" variant="outline" className="gap-2 border-white/10 hover:bg-white/5 h-12 px-8">
                        View Examples
                      </Button>
                    </Link>
                  </div>
                </AnimatedDiv>
              </div>
            </AnimatedDiv>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative py-12 px-4 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-bold text-white text-lg">SpringKit</span>
                  <p className="text-xs text-white/40">Physics-based animations</p>
                </div>
              </div>

              <p className="text-sm text-white/40">
                MIT License · Created with care by Ersin KOC
              </p>

              <div className="flex items-center gap-4">
                <a
                  href="https://github.com/ersinkoc/springkit"
                  target="_blank"
                  rel="noreferrer"
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <Github className="w-5 h-5" />
                </a>
                <a
                  href="https://www.npmjs.com/package/@oxog/springkit"
                  target="_blank"
                  rel="noreferrer"
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <Package className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
