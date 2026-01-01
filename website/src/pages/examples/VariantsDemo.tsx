import { useState } from 'react'
import { Play, Layers, Sparkles } from 'lucide-react'
import { useVariants } from '@oxog/springkit/react'
import { DemoPageLayout } from './DemoPageLayout'

const CODE = `import { useState } from 'react'
import { useVariants } from '@oxog/springkit/react'

// Define animation variants
const buttonVariants = {
  idle: {
    scale: 1,
    y: 0,
    opacity: 1,
  },
  hover: {
    scale: 1.05,
    y: -2,
    opacity: 1,
  },
  pressed: {
    scale: 0.95,
    y: 2,
    opacity: 0.9,
  },
  disabled: {
    scale: 1,
    y: 0,
    opacity: 0.5,
  },
}

function AnimatedButton() {
  const [variant, setVariant] = useState<keyof typeof buttonVariants>('idle')

  const { values, setVariant: animateTo } = useVariants({
    variants: buttonVariants,
    initial: 'idle',
    animate: variant,
    config: { stiffness: 400, damping: 25 },
  })

  return (
    <button
      onMouseEnter={() => {
        setVariant('hover')
        animateTo('hover')
      }}
      onMouseLeave={() => {
        setVariant('idle')
        animateTo('idle')
      }}
      onMouseDown={() => {
        setVariant('pressed')
        animateTo('pressed')
      }}
      onMouseUp={() => {
        setVariant('hover')
        animateTo('hover')
      }}
      style={{
        transform: \`scale(\${values.scale}) translateY(\${values.y}px)\`,
        opacity: values.opacity,
      }}
    >
      Interactive Button
    </button>
  )
}

// Card with multiple states
const cardVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 50 },
  visible: { opacity: 1, scale: 1, y: 0 },
  selected: { opacity: 1, scale: 1.05, y: -10 },
  exit: { opacity: 0, scale: 0.9, y: -20 },
}

function AnimatedCard() {
  const [state, setState] = useState<keyof typeof cardVariants>('hidden')

  const { values, setVariant } = useVariants({
    variants: cardVariants,
    initial: 'hidden',
    animate: state,
  })

  const cycleState = () => {
    const states: Array<keyof typeof cardVariants> = ['hidden', 'visible', 'selected', 'exit']
    const currentIndex = states.indexOf(state)
    const nextState = states[(currentIndex + 1) % states.length]
    setState(nextState)
    setVariant(nextState)
  }

  return (
    <div onClick={cycleState} style={{
      opacity: values.opacity,
      transform: \`scale(\${values.scale}) translateY(\${values.y}px)\`,
    }}>
      Click to cycle: {state}
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

function VariantsDemo() {
  const [variant, setVariant] = useState<VariantName>('visible')

  const { values, setVariant: animateToVariant } = useVariants({
    variants: cardVariants,
    initial: 'hidden',
    animate: variant,
    config: { stiffness: 300, damping: 22 },
  })

  const handleVariantChange = (v: VariantName) => {
    setVariant(v)
    animateToVariant(v)
  }

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
        <div>
          <p className="font-medium capitalize" style={{ color: colors.from }}>{variant}</p>
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

      {/* Quick cycle button */}
      <button
        onClick={() => {
          const variants = Object.keys(cardVariants) as VariantName[]
          const currentIndex = variants.indexOf(variant)
          const nextVariant = variants[(currentIndex + 1) % variants.length]
          handleVariantChange(nextVariant)
        }}
        className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
      >
        <Play className="w-4 h-4" />
        Cycle to Next Variant
      </button>
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
