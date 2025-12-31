import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DocLayout, DocSection, CodeBlock } from '@/components/docs'
import { Palette, Play, Sparkles, Gauge } from 'lucide-react'
import { createSpringValue, physicsPresets, getPhysicsPreset, createFeeling, adjustSpeed, adjustBounce, type PhysicsPresetName } from '@oxog/springkit'

const presets = [
  { name: 'default', config: { stiffness: 100, damping: 10 }, description: 'Standard spring animation' },
  { name: 'gentle', config: { stiffness: 120, damping: 14 }, description: 'Softer, more forgiving animation' },
  { name: 'wobbly', config: { stiffness: 180, damping: 12 }, description: 'Extra bounce and oscillation' },
  { name: 'stiff', config: { stiffness: 210, damping: 20 }, description: 'Quick, snappy animation' },
  { name: 'slow', config: { stiffness: 280, damping: 60 }, description: 'Slower, smooth animation' },
  { name: 'molasses', config: { stiffness: 280, damping: 120 }, description: 'Very slow, heavily damped' },
  { name: 'bounce', config: { stiffness: 200, damping: 8 }, description: 'Bouncy with overshoot' },
  { name: 'noWobble', config: { stiffness: 170, damping: 26 }, description: 'No oscillation, smooth decay' },
]

function PresetCard({ name, config, description }: { name: string; config: { stiffness: number; damping: number }; description: string }) {
  const [position, setPosition] = useState(8)
  const springRef = useRef<ReturnType<typeof createSpringValue> | null>(null)

  useEffect(() => {
    springRef.current = createSpringValue(8, {
      ...config,
      onUpdate: setPosition,
    })
    return () => springRef.current?.destroy()
  }, [config.stiffness, config.damping])

  const handlePlay = () => {
    if (!springRef.current) return
    // Animate to end, then back to start
    springRef.current.set(200)
    setTimeout(() => {
      springRef.current?.set(8)
    }, 750)
  }

  return (
    <Card className="group">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="capitalize text-orange-300">{name}</CardTitle>
          <button
            onClick={handlePlay}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            aria-label="Play animation"
          >
            <Play className="w-4 h-4 text-orange-400" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>

        {/* Animation preview */}
        <div className="h-12 bg-white/5 rounded-lg mb-4 relative overflow-hidden">
          <div
            className="absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500"
            style={{ transform: `translateY(-50%) translateX(${position}px)` }}
          />
        </div>

        <div className="flex gap-4 text-xs font-mono">
          <span className="px-2 py-1 rounded bg-white/5 text-white/60">
            stiffness: <span className="text-orange-300">{config.stiffness}</span>
          </span>
          <span className="px-2 py-1 rounded bg-white/5 text-white/60">
            damping: <span className="text-orange-300">{config.damping}</span>
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export function Presets() {
  return (
    <DocLayout
      title="Spring Presets"
      description="Ready-to-use spring configurations for common animation styles"
      icon={Palette}
    >
      <div className="grid md:grid-cols-2 gap-6">
        {presets.map((preset) => (
          <PresetCard key={preset.name} {...preset} />
        ))}
      </div>

      <DocSection title="Usage" icon={Play}>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { spring, springPresets } from '@oxog/springkit'

const anim = spring(0, 100, {
  ...springPresets.bounce,
  onUpdate: (value) => {
    element.style.transform = \`translateX(\${value}px)\`
  },
})

anim.start()

// Available presets:
// springPresets.default
// springPresets.gentle
// springPresets.wobbly
// springPresets.stiff
// springPresets.slow
// springPresets.molasses
// springPresets.bounce
// springPresets.noWobble`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Custom Presets">
        <p className="text-muted-foreground mb-4">
          You can also create your own presets by defining custom stiffness and damping values:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`// Create your own preset
const myPreset = {
  stiffness: 150,
  damping: 15,
  mass: 1,
}

const anim = spring(0, 100, {
  ...myPreset,
  onUpdate: (value) => {
    element.style.transform = \`scale(\${1 + value / 100})\`
  },
})

anim.start()`} />
          </CardContent>
        </Card>
      </DocSection>

      {/* Physics Presets Section */}
      <DocSection title="Physics Presets (v1.3.0)" icon={Gauge}>
        <p className="text-muted-foreground mb-6">
          40+ semantic, use-case oriented spring configurations. Instead of tuning stiffness and damping manually,
          use presets that describe the behavior you want.
        </p>

        <PhysicsPresetsGrid />

        <div className="mt-8">
          <h4 className="text-lg font-semibold text-white mb-4">Using Physics Presets</h4>
          <Card>
            <CardContent className="pt-6">
              <CodeBlock code={`import { physicsPresets, getPhysicsPreset } from '@oxog/springkit'

// Use directly
const anim = spring(0, 100, {
  ...physicsPresets.button,
  onUpdate: (v) => button.style.transform = \`scale(\${1 + v * 0.1})\`
})

// Or use the getter function
const config = getPhysicsPreset('modalEnter')

// Available categories:
// UI: button, toggle, checkbox, hover, focus
// Layout: pageTransition, modalEnter, modalExit, sidebar, dropdown, toast, tooltip
// Gestures: dragRelease, swipe, pullToRefresh, snap, rubberBand
// Cards: cardFlip, cardHover, listItem, accordion
// Loading: skeleton, progress, spinner
// Emphasis: pulse, shake, bounceAttention, pop, wiggle
// Mobile: ios, android, haptic
// Natural: pendulum, jelly, elastic, heavy, light, liquid`} />
            </CardContent>
          </Card>
        </div>
      </DocSection>

      {/* Feelings Section */}
      <DocSection title="Creating Feelings" icon={Sparkles}>
        <p className="text-muted-foreground mb-6">
          Don't know which preset to use? Use <code className="text-orange-400">createFeeling()</code> to describe the feeling you want.
        </p>

        <FeelingsDemo />

        <div className="mt-8">
          <Card>
            <CardContent className="pt-6">
              <CodeBlock code={`import { createFeeling, adjustSpeed, adjustBounce } from '@oxog/springkit'

// Use feelings to describe what you want
const snappyConfig = createFeeling('snappy')  // Quick, responsive
const smoothConfig = createFeeling('smooth')  // Fluid, elegant
const bouncyConfig = createFeeling('bouncy')  // Fun, playful
const heavyConfig = createFeeling('heavy')    // Weighty, substantial
const lightConfig = createFeeling('light')    // Airy, delicate
const elasticConfig = createFeeling('elastic') // Stretchy, rubber-like

// Adjust speed (multiplier)
const fasterPreset = adjustSpeed(physicsPresets.button, 1.5)  // 50% faster
const slowerPreset = adjustSpeed(physicsPresets.button, 0.5)  // 50% slower

// Adjust bounce (0-1, where 1 is most bouncy)
const moreBouncyPreset = adjustBounce(physicsPresets.button, 0.8)
const lessBouncyPreset = adjustBounce(physicsPresets.button, 0.2)`} />
            </CardContent>
          </Card>
        </div>
      </DocSection>
    </DocLayout>
  )
}

// Physics Presets Grid Component
function PhysicsPresetsGrid() {
  const [selectedPreset, setSelectedPreset] = useState<PhysicsPresetName>('button')
  const [position, setPosition] = useState(0)
  const springRef = useRef<ReturnType<typeof createSpringValue> | null>(null)

  const categories: Record<string, PhysicsPresetName[]> = {
    'UI Interactions': ['button', 'toggle', 'checkbox', 'hover', 'focus'],
    'Layout & Navigation': ['pageTransition', 'modalEnter', 'modalExit', 'sidebar', 'dropdown', 'toast'],
    'Gestures & Drag': ['dragRelease', 'swipe', 'pullToRefresh', 'snap', 'rubberBand'],
    'Cards & Items': ['cardFlip', 'cardHover', 'listItem', 'accordion'],
    'Emphasis': ['pulse', 'shake', 'bounceAttention', 'pop', 'wiggle'],
    'Natural Physics': ['pendulum', 'jelly', 'elastic', 'heavy', 'light', 'liquid'],
  }

  const handlePresetClick = (preset: PhysicsPresetName) => {
    setSelectedPreset(preset)

    if (springRef.current) {
      springRef.current.destroy()
    }

    const config = getPhysicsPreset(preset)
    springRef.current = createSpringValue(0, {
      ...config,
      onUpdate: setPosition,
    })

    springRef.current.set(200)
    setTimeout(() => {
      springRef.current?.set(0)
    }, 600)
  }

  useEffect(() => {
    return () => {
      springRef.current?.destroy()
    }
  }, [])

  const currentConfig = physicsPresets[selectedPreset]

  return (
    <div className="space-y-6">
      {/* Animation Preview */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-semibold text-orange-300 capitalize">{selectedPreset}</h4>
              <div className="flex gap-3 text-xs font-mono mt-1">
                <span className="text-white/60">stiffness: <span className="text-orange-300">{currentConfig.stiffness}</span></span>
                <span className="text-white/60">damping: <span className="text-orange-300">{currentConfig.damping}</span></span>
                <span className="text-white/60">mass: <span className="text-orange-300">{currentConfig.mass}</span></span>
              </div>
            </div>
            <button
              onClick={() => handlePresetClick(selectedPreset)}
              className="p-2 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 transition-colors"
              aria-label="Replay animation"
            >
              <Play className="w-5 h-5 text-orange-400" />
            </button>
          </div>
          <div className="h-14 bg-white/5 rounded-xl relative overflow-hidden">
            <div
              className="absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/30"
              style={{ left: 8, transform: `translateY(-50%) translateX(${position}px)` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preset Categories */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(categories).map(([category, presetList]) => (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-orange-300">{category}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2">
                {presetList.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handlePresetClick(preset)}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                      selectedPreset === preset
                        ? 'bg-orange-500/30 text-orange-300 font-medium'
                        : 'bg-white/5 hover:bg-white/10 text-white/60'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Feelings Demo Component
function FeelingsDemo() {
  const [selectedFeeling, setSelectedFeeling] = useState<'snappy' | 'smooth' | 'bouncy' | 'heavy' | 'light' | 'elastic'>('snappy')
  const [position, setPosition] = useState(0)
  const springRef = useRef<ReturnType<typeof createSpringValue> | null>(null)

  const feelings = ['snappy', 'smooth', 'bouncy', 'heavy', 'light', 'elastic'] as const

  const handleFeelingClick = (feeling: typeof feelings[number]) => {
    setSelectedFeeling(feeling)

    if (springRef.current) {
      springRef.current.destroy()
    }

    const config = createFeeling(feeling)
    springRef.current = createSpringValue(0, {
      ...config,
      onUpdate: setPosition,
    })

    springRef.current.set(200)
    setTimeout(() => {
      springRef.current?.set(0)
    }, 600)
  }

  useEffect(() => {
    return () => {
      springRef.current?.destroy()
    }
  }, [])

  const currentConfig = createFeeling(selectedFeeling)

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-lg font-semibold text-purple-300 capitalize">{selectedFeeling}</h4>
            <div className="flex gap-3 text-xs font-mono mt-1">
              <span className="text-white/60">stiffness: <span className="text-purple-300">{currentConfig.stiffness}</span></span>
              <span className="text-white/60">damping: <span className="text-purple-300">{currentConfig.damping}</span></span>
              <span className="text-white/60">mass: <span className="text-purple-300">{currentConfig.mass}</span></span>
            </div>
          </div>
        </div>

        {/* Animation Preview */}
        <div className="h-14 bg-white/5 rounded-xl mb-4 relative overflow-hidden">
          <div
            className="absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30"
            style={{ left: 8, transform: `translateY(-50%) translateX(${position}px)` }}
          />
        </div>

        {/* Feeling Buttons */}
        <div className="flex gap-2 flex-wrap">
          {feelings.map((feeling) => (
            <button
              key={feeling}
              onClick={() => handleFeelingClick(feeling)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors capitalize ${
                selectedFeeling === feeling
                  ? 'bg-purple-500/30 text-purple-300 font-medium'
                  : 'bg-white/5 hover:bg-white/10 text-white/60'
              }`}
            >
              {feeling}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
