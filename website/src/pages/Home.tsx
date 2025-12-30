import { Link } from 'react-router-dom'
import { motion, useSpring, useMotionValue } from 'framer-motion'
import { ArrowRight, Zap, Feather, Layers, MousePointer2, Sparkles, Copy, Check, Github, Package, Play, RotateCcw, ChevronDown, Terminal, Code2, Cpu, Timer, Box, Waves } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Highlight, themes } from 'prism-react-renderer'

// ============================================================================
// SPECTACULAR HERO SPRING VISUALIZATION
// ============================================================================

function HeroSpringDemo() {
  const [isDragging, setIsDragging] = useState(false)
  const [preset, setPreset] = useState<'bouncy' | 'gentle' | 'stiff' | 'wobbly'>('bouncy')

  const presetConfigs = {
    bouncy: { stiffness: 400, damping: 10 },
    gentle: { stiffness: 120, damping: 14 },
    stiff: { stiffness: 700, damping: 30 },
    wobbly: { stiffness: 180, damping: 8 },
  }

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Spring trail effect - multiple circles following with delay
  const springConfig = presetConfigs[preset]

  return (
    <div className="relative w-full h-[500px] flex items-center justify-center">
      {/* Concentric rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-orange-500/10"
            style={{
              width: 100 + i * 80,
              height: 100 + i * 80,
            }}
            animate={{
              rotate: i % 2 === 0 ? 360 : -360,
              scale: [1, 1.02, 1],
            }}
            transition={{
              rotate: { duration: 20 + i * 5, repeat: Infinity, ease: 'linear' },
              scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
            }}
          />
        ))}
      </div>

      {/* Trail circles */}
      {[0.15, 0.3, 0.45].map((delay, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 60 - i * 12,
            height: 60 - i * 12,
            background: `radial-gradient(circle, hsla(25, 100%, ${55 - i * 10}%, ${0.3 - i * 0.08}) 0%, transparent 70%)`,
            x: useSpring(x, { ...springConfig, stiffness: springConfig.stiffness * (1 - delay) }),
            y: useSpring(y, { ...springConfig, stiffness: springConfig.stiffness * (1 - delay) }),
          }}
        />
      ))}

      {/* Main draggable ball */}
      <motion.div
        drag
        dragConstraints={{ left: -200, right: 200, top: -150, bottom: 150 }}
        dragElastic={0.1}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
        style={{ x, y }}
        whileDrag={{ scale: 1.1 }}
        transition={{
          type: 'spring',
          ...springConfig,
        }}
        className="relative cursor-grab active:cursor-grabbing z-10"
      >
        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 rounded-full blur-xl"
          style={{
            background: 'radial-gradient(circle, hsla(25, 100%, 55%, 0.6) 0%, transparent 70%)',
            width: 120,
            height: 120,
            marginLeft: -30,
            marginTop: -30,
          }}
          animate={{
            scale: isDragging ? 1.3 : [1, 1.15, 1],
            opacity: isDragging ? 0.8 : [0.6, 0.8, 0.6],
          }}
          transition={{
            scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
            opacity: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
          }}
        />

        {/* Ball */}
        <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 via-orange-500 to-amber-600 shadow-2xl flex items-center justify-center ring-4 ring-orange-500/20">
          <Sparkles className="w-6 h-6 text-white/90" />
        </div>
      </motion.div>

      {/* Preset selector */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
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
      <motion.p
        className="absolute top-4 left-1/2 -translate-x-1/2 text-sm text-white/40"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        Drag the ball to feel the spring physics
      </motion.p>
    </div>
  )
}

// ============================================================================
// INTERACTIVE PHYSICS PLAYGROUND
// ============================================================================

function PhysicsPlayground() {
  const [stiffness, setStiffness] = useState(300)
  const [damping, setDamping] = useState(20)
  const [mass, setMass] = useState(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const animationRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)

  const simulateSpring = useCallback(() => {
    const omega = Math.sqrt(stiffness / mass)
    const zeta = damping / (2 * Math.sqrt(stiffness * mass))

    const step = (time: number) => {
      if (!startTimeRef.current) startTimeRef.current = time
      const elapsed = (time - startTimeRef.current) / 1000

      let pos: number
      if (zeta < 1) {
        // Underdamped
        const omegaD = omega * Math.sqrt(1 - zeta * zeta)
        pos = Math.exp(-zeta * omega * elapsed) * Math.cos(omegaD * elapsed)
      } else if (zeta === 1) {
        // Critically damped
        pos = (1 + omega * elapsed) * Math.exp(-omega * elapsed)
      } else {
        // Overdamped
        const r1 = -omega * (zeta - Math.sqrt(zeta * zeta - 1))
        const r2 = -omega * (zeta + Math.sqrt(zeta * zeta - 1))
        pos = (Math.exp(r1 * elapsed) + Math.exp(r2 * elapsed)) / 2
      }

      // Map to visual range
      const visualPos = (1 - pos) * 200

      if (Math.abs(pos) < 0.001 || elapsed > 5) {
        setPosition(200)
        setIsPlaying(false)
        return
      }

      setPosition(visualPos)
      animationRef.current = requestAnimationFrame(step)
    }

    animationRef.current = requestAnimationFrame(step)
  }, [stiffness, damping, mass])

  const play = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current)
    startTimeRef.current = 0
    setPosition(0)
    setIsPlaying(true)
    simulateSpring()
  }

  const reset = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current)
    setIsPlaying(false)
    setPosition(0)
    startTimeRef.current = 0
  }

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [])

  // Calculate damping ratio for display
  const dampingRatio = damping / (2 * Math.sqrt(stiffness * mass))
  const dampingType = dampingRatio < 1 ? 'Underdamped' : dampingRatio === 1 ? 'Critically Damped' : 'Overdamped'

  return (
    <div className="glass rounded-3xl p-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-orange-500/10 to-transparent rounded-full blur-3xl" />

      <div className="relative grid lg:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Physics Playground</h3>
            <p className="text-white/50 text-sm">Adjust parameters to see how they affect spring behavior</p>
          </div>

          {/* Sliders */}
          <div className="space-y-5">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm text-white/70">Stiffness</label>
                <span className="text-sm text-orange-400 font-mono">{stiffness}</span>
              </div>
              <input
                type="range"
                min="50"
                max="1000"
                value={stiffness}
                onChange={(e) => setStiffness(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-orange-500/50"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm text-white/70">Damping</label>
                <span className="text-sm text-orange-400 font-mono">{damping}</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={damping}
                onChange={(e) => setDamping(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-orange-500/50"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm text-white/70">Mass</label>
                <span className="text-sm text-orange-400 font-mono">{mass}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={mass}
                onChange={(e) => setMass(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-orange-500/50"
              />
            </div>
          </div>

          {/* Info badge */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 w-fit">
            <div className={`w-2 h-2 rounded-full ${dampingRatio < 1 ? 'bg-green-400' : dampingRatio === 1 ? 'bg-yellow-400' : 'bg-red-400'}`} />
            <span className="text-sm text-white/70">{dampingType}</span>
            <span className="text-sm text-white/40">(ζ = {dampingRatio.toFixed(2)})</span>
          </div>

          {/* Play/Reset buttons */}
          <div className="flex gap-3">
            <Button
              onClick={play}
              disabled={isPlaying}
              className="gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0"
            >
              <Play className="w-4 h-4" />
              Play
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

        {/* Visualization */}
        <div className="relative h-64 bg-white/5 rounded-2xl overflow-hidden">
          {/* Grid lines */}
          <div className="absolute inset-0 grid-pattern opacity-20" />

          {/* Target line */}
          <div className="absolute bottom-8 left-0 right-0 h-px bg-orange-500/30">
            <span className="absolute -right-2 -top-3 text-xs text-orange-400/50">target</span>
          </div>

          {/* Spring line */}
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <line
              x1="50%"
              y1="16"
              x2="50%"
              y2={32 + position}
              stroke="url(#springGradient)"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
            <defs>
              <linearGradient id="springGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(251, 146, 60, 0.3)" />
                <stop offset="100%" stopColor="rgba(251, 146, 60, 0.8)" />
              </linearGradient>
            </defs>
          </svg>

          {/* Anchor point */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white/20 border-2 border-white/30" />

          {/* Ball */}
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 shadow-lg shadow-orange-500/30"
            style={{ top: 24 + position }}
          />
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
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
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
    </motion.div>
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
        <motion.div
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
        </motion.div>
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
          {libraries.map((lib, i) => (
            <motion.tr
              key={lib.name}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
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
            </motion.tr>
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
        {/* Floating orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-orange-500/20 to-transparent blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-tl from-rose-500/15 to-transparent blur-3xl"
          animate={{
            x: [0, -40, 0],
            y: [0, 40, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
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
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
                >
                  {/* Badge */}
                  <motion.div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-subtle mb-8"
                    whileHover={{ scale: 1.02 }}
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
                    </span>
                    <span className="text-sm text-white/70">v1.0.0 — Production Ready</span>
                  </motion.div>

                  {/* Headline */}
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight">
                    <span className="text-white">Physics-based</span>
                    <br />
                    <span className="text-gradient">Spring Animations</span>
                  </h1>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
                  className="text-lg md:text-xl text-white/50 max-w-xl leading-relaxed"
                >
                  A zero-dependency animation library that brings natural, fluid motion
                  to your UI with real spring physics, gesture support, and React integration.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
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
                </motion.div>

                {/* Install command */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
                >
                  <div className="inline-flex items-center gap-3 glass-subtle rounded-xl px-4 py-3">
                    <Terminal className="w-4 h-4 text-orange-400" />
                    <code className="text-sm text-white/70 font-mono">{installCode}</code>
                    <CopyButton text={installCode} />
                  </div>
                </motion.div>
              </div>

              {/* Right: Interactive Demo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="hidden lg:block"
              >
                <HeroSpringDemo />
              </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div
              className="absolute bottom-8 left-1/2 -translate-x-1/2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="text-white/30"
              >
                <ChevronDown className="w-6 h-6" />
              </motion.div>
            </motion.div>
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
            <motion.div
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
            </motion.div>

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
            </div>
          </div>
        </section>

        {/* Interactive Playground Section */}
        <section className="relative py-32 px-4 bg-black/20">
          <div className="max-w-5xl mx-auto">
            <motion.div
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <PhysicsPlayground />
            </motion.div>
          </div>
        </section>

        {/* Code Examples Section */}
        <section className="relative py-32 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
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
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Vanilla JS */}
              <motion.div
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
              </motion.div>

              {/* React */}
              <motion.div
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
              </motion.div>
            </div>

            {/* Gesture Example */}
            <motion.div
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
            </motion.div>
          </div>
        </section>

        {/* Comparison Section */}
        <section className="relative py-32 px-4 bg-black/20">
          <div className="max-w-4xl mx-auto">
            <motion.div
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="glass rounded-2xl overflow-hidden"
            >
              <ComparisonTable />
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-32 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              {/* Glow background */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-rose-500/20 blur-3xl" />

              <div className="relative glass rounded-3xl p-12 md:p-16 text-center border border-white/10">
                <motion.div
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
                </motion.div>
              </div>
            </motion.div>
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
