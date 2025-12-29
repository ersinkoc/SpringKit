import { Card, CardContent } from '@/components/ui/card'
import { DocLayout, DocSection, CodeBlock } from '@/components/docs'
import { Blend, Palette, ArrowLeftRight } from 'lucide-react'

export function Interpolation() {
  return (
    <DocLayout
      title="Interpolation"
      description="Map values to different ranges and interpolate between colors"
      icon={Blend}
    >
      <DocSection title="Value Interpolation" icon={ArrowLeftRight}>
        <p className="text-muted-foreground text-lg mb-4">
          Map a spring value from one range to another:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { createSpringValue, interpolate } from '@oxog/springkit'

const x = createSpringValue(0)

// Map 0-100 to 0-1
const opacity = interpolate(x, [0, 100], [0, 1])

x.subscribe(() => {
  element.style.opacity = String(opacity.get())
})

x.set(100)  // opacity animates to 1`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Multi-Point Interpolation">
        <p className="text-muted-foreground text-lg mb-4">
          Interpolate through multiple points for complex transitions:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`const progress = createSpringValue(0)

// Scale: starts at 1, peaks at 1.5, returns to 1
const scale = interpolate(progress, [0, 50, 100], [1, 1.5, 1])

progress.subscribe(() => {
  element.style.transform = \`scale(\${scale.get()})\`
})`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Color Interpolation" icon={Palette}>
        <p className="text-muted-foreground text-lg mb-4">
          Smoothly interpolate between colors:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { createSpringValue, interpolateColor } from '@oxog/springkit'

const progress = createSpringValue(0)

const color = interpolateColor(
  progress,
  [0, 50, 100],
  ['#ff0000', '#00ff00', '#0000ff']
)

progress.subscribe(() => {
  element.style.backgroundColor = color.get()
})

progress.set(50)  // color is '#00ff00'`} />
          </CardContent>
        </Card>

        {/* Color preview */}
        <div className="flex gap-2 mt-4">
          {['#ff0000', '#00ff00', '#0000ff'].map((color, i) => (
            <div
              key={i}
              className="flex-1 h-12 rounded-lg flex items-center justify-center text-xs font-mono text-white/80"
              style={{ backgroundColor: color }}
            >
              {i === 0 ? '0%' : i === 1 ? '50%' : '100%'}
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="Extrapolation">
        <p className="text-muted-foreground text-lg mb-4">
          Control how values behave outside the input range:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`const value = createSpringValue(0)

// Clamp: won't go outside output range
const clamped = interpolate(
  value,
  [0, 100],
  [0, 200],
  { extrapolate: 'clamp' }
)

// Identity: returns input value outside range
const identity = interpolate(
  value,
  [0, 100],
  [0, 200],
  { extrapolate: 'identity' }
)

// Extend: continues linear interpolation (default)
const extended = interpolate(
  value,
  [0, 100],
  [0, 200],
  { extrapolate: 'extend' }
)`} />
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-4 mt-4">
          {[
            { mode: 'clamp', desc: 'Stays within bounds' },
            { mode: 'identity', desc: 'Returns raw value' },
            { mode: 'extend', desc: 'Continues pattern' },
          ].map((item) => (
            <div key={item.mode} className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
              <code className="text-orange-300 font-mono">{item.mode}</code>
              <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </DocSection>
    </DocLayout>
  )
}
