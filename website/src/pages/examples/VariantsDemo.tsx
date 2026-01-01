import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, Layers, Sparkles } from 'lucide-react'
import { useVariants } from '@oxog/springkit/react'
import { DemoPageLayout } from './DemoPageLayout'

const CODE = `import { useState } from 'react'
import { useVariants } from '@oxog/springkit/react'

// Define animation variants
const cardVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 50, rotate: -5 },
  visible: { opacity: 1, scale: 1, y: 0, rotate: 0 },
  hover: { opacity: 1, scale: 1.05, y: -8, rotate: 0 },
  selected: { opacity: 1, scale: 1.1, y: -15, rotate: 2 },
  exit: { opacity: 0, scale: 0.9, y: -30, rotate: 5 },
}

function AnimatedCard() {
  const [variant, setVariant] = useState('visible')

  // useVariants automatically animates when 'animate' prop changes
  const { values } = useVariants({
    variants: cardVariants,
    initial: 'hidden',   // Start from hidden state
    animate: variant,     // Animate to current variant
    spring: { stiffness: 300, damping: 22 },
  })

  return (
    <div>
      {/* Animated element */}
      <div
        style={{
          opacity: values.opacity,
          transform: \`
            scale(\${values.scale})
            translateY(\${values.y}px)
            rotate(\${values.rotate}deg)
          \`,
        }}
      >
        Current: {variant}
      </div>

      {/* Variant selector buttons */}
      <div className="flex gap-2 mt-4">
        {Object.keys(cardVariants).map((v) => (
          <button
            key={v}
            onClick={() => setVariant(v)}
            className={variant === v ? 'active' : ''}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  )
}`

// Variant definitions
const cardVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 40, rotate: -5 },
  visible: { opacity: 1, scale: 1, y: 0, rotate: 0 },
  hover: { opacity: 1, scale: 1.05, y: -8, rotate: 0 },
  selected: { opacity: 1, scale: 1.1, y: -15, rotate: 2 },
  exit: { opacity: 0, scale: 0.9, y: -30, rotate: 5 },
}

type VariantName = keyof typeof cardVariants

const variantDescriptions: Record<VariantName, string> = {
  hidden: 'Element is hidden, scaled down and offset',
  visible: 'Normal visible state',
  hover: 'Subtle lift on hover',
  selected: 'Emphasized selected state',
  exit: 'Fade and float up on exit',
}

const variantColors: Record<VariantName, { from: string; to: string }> = {
  hidden: { from: '#64748b', to: '#475569' },
  visible: { from: '#3b82f6', to: '#2563eb' },
  hover: { from: '#8b5cf6', to: '#7c3aed' },
  selected: { from: '#10b981', to: '#059669' },
  exit: { from: '#f59e0b', to: '#d97706' },
}

const SPEED_OPTIONS = [
  { label: 'Slow', value: 2000 },
  { label: 'Normal', value: 1200 },
  { label: 'Fast', value: 600 },
]

function VariantsDemo() {
  const [variant, setVariant] = useState<VariantName>('visible')
  const [isAutoCycling, setIsAutoCycling] = useState(false)
  const [cycleSpeed, setCycleSpeed] = useState(1200)
  const [transitionCount, setTransitionCount] = useState(0)
  const autoCycleRef = useRef<NodeJS.Timeout | null>(null)

  // useVariants animates automatically when 'animate' prop changes
  const { values } = useVariants({
    variants: cardVariants,
    initial: 'hidden',
    animate: variant,
    spring: { stiffness: 300, damping: 22 },
  })

  // Just update the state - useVariants will animate automatically
  const handleVariantChange = useCallback((v: VariantName) => {
    setVariant(v)
  }, [])

  const cycleToNext = useCallback(() => {
    const variants = Object.keys(cardVariants) as VariantName[]
    setVariant(current => {
      const currentIndex = variants.indexOf(current)
      return variants[(currentIndex + 1) % variants.length]
    })
    setTransitionCount(c => c + 1)
  }, [])

  const toggleAutoCycle = () => {
    if (isAutoCycling) {
      if (autoCycleRef.current) {
        clearInterval(autoCycleRef.current)
        autoCycleRef.current = null
      }
      setIsAutoCycling(false)
    } else {
      setIsAutoCycling(true)
      cycleToNext()
      autoCycleRef.current = setInterval(cycleToNext, cycleSpeed)
    }
  }

  // Update interval when speed changes
  useEffect(() => {
    if (isAutoCycling && autoCycleRef.current) {
      clearInterval(autoCycleRef.current)
      autoCycleRef.current = setInterval(cycleToNext, cycleSpeed)
    }
  }, [cycleSpeed, isAutoCycling, cycleToNext])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault()
        toggleAutoCycle()
      } else if (e.key === 'ArrowRight') {
        if (!isAutoCycling) cycleToNext()
      } else if (e.key === 'ArrowLeft') {
        if (!isAutoCycling) {
          const variants = Object.keys(cardVariants) as VariantName[]
          setVariant(current => {
            const currentIndex = variants.indexOf(current)
            return variants[(currentIndex - 1 + variants.length) % variants.length]
          })
          setTransitionCount(c => c + 1)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isAutoCycling, cycleToNext])

  // Cleanup auto-cycle on unmount
  useEffect(() => {
    return () => {
      if (autoCycleRef.current) {
        clearInterval(autoCycleRef.current)
      }
    }
  }, [])

  const colors = variantColors[variant]

  return (
    <div className="space-y-6">
      {/* Demo area */}
      <div className="bg-black/30 rounded-xl p-8 min-h-[240px] flex items-center justify-center">
        <div
          className="w-48 h-32 rounded-2xl shadow-2xl flex flex-col items-center justify-center text-white"
          style={{
            opacity: values.opacity ?? 1,
            transform: `scale(${values.scale ?? 1}) translateY(${values.y ?? 0}px) rotate(${values.rotate ?? 0}deg)`,
            background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
            boxShadow: `0 25px 50px -12px ${colors.from}60`,
          }}
        >
          <Sparkles className="w-8 h-8 mb-2 opacity-80" />
          <span className="font-medium capitalize">{variant}</span>
        </div>
      </div>

      {/* Current values display */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-black/20 rounded-lg p-2">
          <p className="text-xs text-white/40">Opacity</p>
          <p className="text-sm text-white font-mono">{(values.opacity ?? 1).toFixed(2)}</p>
        </div>
        <div className="bg-black/20 rounded-lg p-2">
          <p className="text-xs text-white/40">Scale</p>
          <p className="text-sm text-white font-mono">{(values.scale ?? 1).toFixed(2)}</p>
        </div>
        <div className="bg-black/20 rounded-lg p-2">
          <p className="text-xs text-white/40">Y</p>
          <p className="text-sm text-white font-mono">{(values.y ?? 0).toFixed(0)}px</p>
        </div>
        <div className="bg-black/20 rounded-lg p-2">
          <p className="text-xs text-white/40">Rotate</p>
          <p className="text-sm text-white font-mono">{(values.rotate ?? 0).toFixed(1)}°</p>
        </div>
      </div>

      {/* Variant description */}
      <div className="flex items-start gap-3 p-4 rounded-xl border"
        style={{
          background: `${colors.from}15`,
          borderColor: `${colors.from}30`,
        }}
      >
        <Layers className="w-5 h-5 shrink-0 mt-0.5" style={{ color: colors.from }} />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-medium capitalize" style={{ color: colors.from }}>{variant}</p>
            <div className="flex items-center gap-3 text-xs text-white/40">
              <span>Transitions: <span className="text-white/60 font-medium">{transitionCount}</span></span>
              {isAutoCycling && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  Auto
                </span>
              )}
            </div>
          </div>
          <p className="text-white/60 text-sm">{variantDescriptions[variant]}</p>
        </div>
      </div>

      {/* Variant selector */}
      <div>
        <p className="text-xs text-white/40 uppercase tracking-wider mb-2">
          Select Variant
        </p>
        <div className="grid grid-cols-5 gap-2">
          {(Object.keys(cardVariants) as VariantName[]).map((v) => {
            const vc = variantColors[v]
            return (
              <button
                key={v}
                onClick={() => handleVariantChange(v)}
                className={`py-3 rounded-xl text-xs capitalize font-medium transition-all ${
                  variant === v
                    ? 'text-white ring-1 ring-white/20 shadow-lg'
                    : 'bg-white/5 hover:bg-white/10 text-white/60'
                }`}
                style={{
                  background:
                    variant === v
                      ? `linear-gradient(135deg, ${vc.from}50, ${vc.to}50)`
                      : undefined,
                }}
              >
                {v}
              </button>
            )
          })}
        </div>
      </div>

      {/* Speed control */}
      <div>
        <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Cycle Speed</p>
        <div className="flex gap-2">
          {SPEED_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setCycleSpeed(option.value)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                cycleSpeed === option.value
                  ? 'bg-emerald-500/30 text-emerald-300 ring-1 ring-emerald-500/50'
                  : 'bg-white/5 hover:bg-white/10 text-white/60'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex gap-3">
        <button
          onClick={toggleAutoCycle}
          className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
            isAutoCycling
              ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:shadow-lg hover:shadow-rose-500/30'
              : 'bg-white/5 hover:bg-white/10 text-white/60'
          }`}
        >
          {isAutoCycling ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isAutoCycling ? 'Stop' : 'Auto Cycle'}
        </button>
        <button
          onClick={cycleToNext}
          disabled={isAutoCycling}
          className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
        >
          <Play className="w-4 h-4" />
          Next Variant
        </button>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="flex justify-center gap-4 text-xs text-white/30">
        <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/50">Space</kbd> Play/Pause</span>
        <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/50">←</kbd> Prev</span>
        <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/50">→</kbd> Next</span>
      </div>
    </div>
  )
}

export default function VariantsDemoPage() {
  return (
    <DemoPageLayout
      title="Variants System"
      description="Define declarative animation states and smoothly transition between them. Perfect for complex UI interactions."
      category="Core Features"
      categoryPath="/examples"
      code={CODE}
    >
      <VariantsDemo />
    </DemoPageLayout>
  )
}
