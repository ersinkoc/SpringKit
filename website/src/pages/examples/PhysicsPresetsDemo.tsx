import { useState, useRef } from 'react'
import { Play, RotateCcw, Gauge, Info } from 'lucide-react'
import { spring, physicsPresets } from '@oxog/springkit'
import { DemoPageLayout } from './DemoPageLayout'

const CODE = `import { useState, useRef } from 'react'
import { spring, physicsPresets } from '@oxog/springkit'

// Available physics presets from SpringKit
const presets = {
  // Soft & Gentle
  gentle: { stiffness: 120, damping: 14 },
  wobbly: { stiffness: 180, damping: 12 },

  // Balanced
  smooth: { stiffness: 100, damping: 20 },
  stiff: { stiffness: 210, damping: 20 },

  // Bouncy
  bouncy: { stiffness: 400, damping: 10 },
  superBouncy: { stiffness: 500, damping: 8 },

  // Snappy
  snappy: { stiffness: 500, damping: 30 },
  instant: { stiffness: 1000, damping: 50 },
}

function PhysicsDemo() {
  const [preset, setPreset] = useState('bouncy')
  const [isAnimating, setIsAnimating] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  const runAnimation = () => {
    if (!boxRef.current || isAnimating) return
    setIsAnimating(true)

    const config = presets[preset]

    // Animate from 0 to 250px
    const animation = spring(0, 250, {
      ...config,
      onUpdate: (value) => {
        if (boxRef.current) {
          boxRef.current.style.transform = \`translateX(\${value}px)\`
        }
      },
      onComplete: () => {
        // Animate back to 0
        spring(250, 0, {
          ...config,
          onUpdate: (value) => {
            if (boxRef.current) {
              boxRef.current.style.transform = \`translateX(\${value}px)\`
            }
          },
          onComplete: () => setIsAnimating(false),
        }).start()
      },
    })

    animation.start()
  }

  return (
    <div>
      {/* Demo Box */}
      <div className="h-24 bg-black/20 rounded-xl flex items-center px-4 mb-6">
        <div
          ref={boxRef}
          className="w-16 h-16 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 shadow-lg"
        />
      </div>

      {/* Preset Selector */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {Object.keys(presets).map((p) => (
          <button
            key={p}
            onClick={() => setPreset(p)}
            className={\`py-2 rounded-lg text-xs capitalize transition-colors \${
              preset === p
                ? 'bg-amber-500/30 text-amber-300 ring-1 ring-amber-500/50'
                : 'bg-white/5 hover:bg-white/10 text-white/60'
            }\`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Config Display */}
      <div className="bg-black/20 rounded-lg p-3 mb-4 font-mono text-xs text-white/60">
        stiffness: {presets[preset].stiffness}, damping: {presets[preset].damping}
      </div>

      {/* Run Button */}
      <button
        onClick={runAnimation}
        disabled={isAnimating}
        className="w-full py-3 bg-amber-500/20 text-amber-400 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-amber-500/30 transition-colors"
      >
        <Play className="w-4 h-4" />
        {isAnimating ? 'Animating...' : 'Run Animation'}
      </button>
    </div>
  )
}`

// Preset configurations with descriptions
const presets: Record<string, { stiffness: number; damping: number; description: string }> = {
  gentle: { stiffness: 120, damping: 14, description: 'Soft, slow movement' },
  wobbly: { stiffness: 180, damping: 12, description: 'Playful wobble effect' },
  smooth: { stiffness: 100, damping: 20, description: 'Balanced, natural feel' },
  stiff: { stiffness: 210, damping: 20, description: 'Firm but still springy' },
  bouncy: { stiffness: 400, damping: 10, description: 'High energy bounce' },
  superBouncy: { stiffness: 500, damping: 8, description: 'Maximum bounce' },
  snappy: { stiffness: 500, damping: 30, description: 'Quick and responsive' },
  instant: { stiffness: 1000, damping: 50, description: 'Nearly instant' },
}

function PhysicsDemo() {
  const [preset, setPreset] = useState<keyof typeof presets>('bouncy')
  const [isAnimating, setIsAnimating] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  const runAnimation = () => {
    if (!boxRef.current || isAnimating) return
    setIsAnimating(true)

    const config = presets[preset]

    const animation = spring(0, 250, {
      stiffness: config.stiffness,
      damping: config.damping,
      onUpdate: (value) => {
        if (boxRef.current) {
          boxRef.current.style.transform = `translateX(${value}px)`
        }
      },
      onComplete: () => {
        spring(250, 0, {
          stiffness: config.stiffness,
          damping: config.damping,
          onUpdate: (value) => {
            if (boxRef.current) {
              boxRef.current.style.transform = `translateX(${value}px)`
            }
          },
          onComplete: () => setIsAnimating(false),
        }).start()
      },
    })

    animation.start()
  }

  const reset = () => {
    if (boxRef.current) {
      boxRef.current.style.transform = 'translateX(0px)'
    }
    setIsAnimating(false)
  }

  return (
    <div className="space-y-6">
      {/* Visual demo area */}
      <div className="relative">
        <div className="h-28 bg-black/30 rounded-xl flex items-center px-6 overflow-hidden">
          {/* Track */}
          <div className="absolute left-6 right-6 h-1 bg-white/10 rounded-full" />
          <div className="absolute left-6 w-16 h-1 bg-amber-500/30 rounded-full" />
          <div className="absolute right-6 w-16 h-1 bg-amber-500/30 rounded-full" />

          {/* Box */}
          <div
            ref={boxRef}
            className="relative z-10 w-16 h-16 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/30 flex items-center justify-center"
          >
            <Gauge className="w-6 h-6 text-white/80" />
          </div>
        </div>
      </div>

      {/* Preset info */}
      <div className="flex items-start gap-3 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-amber-300 font-medium capitalize">{preset}</p>
          <p className="text-white/60 text-sm">{presets[preset].description}</p>
          <p className="text-white/40 text-xs font-mono mt-1">
            stiffness: {presets[preset].stiffness}, damping: {presets[preset].damping}
          </p>
        </div>
      </div>

      {/* Preset selector */}
      <div>
        <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Select Preset</p>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(presets) as Array<keyof typeof presets>).map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={`py-2.5 rounded-lg text-xs capitalize transition-all ${
                preset === p
                  ? 'bg-amber-500/30 text-amber-300 ring-1 ring-amber-500/50 shadow-lg shadow-amber-500/20'
                  : 'bg-white/5 hover:bg-white/10 text-white/60'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button
          onClick={runAnimation}
          disabled={isAnimating}
          className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-lg hover:shadow-orange-500/30 transition-all"
        >
          <Play className="w-4 h-4" />
          {isAnimating ? 'Animating...' : 'Run Animation'}
        </button>
        <button
          onClick={reset}
          className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default function PhysicsPresetsDemoPage() {
  return (
    <DemoPageLayout
      title="Physics Presets"
      description="Pre-configured spring physics behaviors for common animation needs. Each preset offers a unique feel from gentle movements to snappy interactions."
      category="Core Features"
      categoryPath="/examples"
      code={CODE}
    >
      <PhysicsDemo />
    </DemoPageLayout>
  )
}
