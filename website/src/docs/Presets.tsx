import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DocLayout, DocSection, CodeBlock } from '@/components/docs'
import { Palette, Play } from 'lucide-react'
import { createSpringValue } from '@oxog/springkit'

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
    </DocLayout>
  )
}
