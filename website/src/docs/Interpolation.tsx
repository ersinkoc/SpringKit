import { useMemo, useState } from 'react'
import { interpolateColor, type ColorSpace } from '@oxog/springkit'
import { Card, CardContent } from '@/components/ui/card'
import { DocLayout, DocSection, CodeBlock } from '@/components/docs'
import { Blend, Palette, ArrowLeftRight, Droplets } from 'lucide-react'
import { cn } from '@/lib/utils'

const SPACES: { space: ColorSpace; note: string }[] = [
  { space: 'srgb', note: 'default · cheapest, can dip through gray' },
  { space: 'linear', note: 'mixes like light · brighter midpoints' },
  { space: 'oklab', note: 'perceptually even · no muddy midpoint' },
]

const PAIRS: { label: string; from: string; to: string }[] = [
  { label: 'blue → yellow', from: '#0000ff', to: '#ffff00' },
  { label: 'red → cyan', from: '#ff0000', to: '#00ffff' },
  { label: 'black → white', from: '#000000', to: '#ffffff' },
]

const SAMPLES = 32

/** Build a CSS gradient by sampling interpolateColor (not the browser's own mixing) */
function sampleGradient(from: string, to: string, space: ColorSpace): { gradient: string; mid: string } {
  let t = 0
  const color = interpolateColor(() => t, [0, 1], [from, to], { space })
  const stops: string[] = []
  for (let i = 0; i <= SAMPLES; i++) {
    t = i / SAMPLES
    stops.push(`${color.get()} ${((i / SAMPLES) * 100).toFixed(2)}%`)
  }
  t = 0.5
  return { gradient: `linear-gradient(to right, ${stops.join(', ')})`, mid: color.get() }
}

function ColorSpaceStrips() {
  const [pairIndex, setPairIndex] = useState(0)
  const pair = PAIRS[pairIndex] ?? PAIRS[0]!
  const strips = useMemo(
    () => SPACES.map(({ space, note }) => ({ space, note, ...sampleGradient(pair.from, pair.to, space) })),
    [pair]
  )

  return (
    <div className="space-y-4">
      <div role="radiogroup" aria-label="Color pair" className="inline-flex flex-wrap rounded-lg bg-white/5 p-1">
        {PAIRS.map((p, i) => (
          <button
            key={p.label}
            type="button"
            role="radio"
            aria-checked={i === pairIndex}
            onClick={() => setPairIndex(i)}
            className={cn(
              'px-3 py-1 text-xs rounded-md transition-colors',
              i === pairIndex ? 'bg-orange-500/20 text-orange-200' : 'text-white/50 hover:text-white'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {strips.map(({ space, note, gradient, mid }) => (
          <div key={space}>
            <div className="flex items-baseline justify-between gap-2 mb-1 text-xs">
              <span>
                <code className="text-orange-300 font-mono">space: '{space}'</code>{' '}
                <span className="text-white/40">{note}</span>
              </span>
              <span className="font-mono text-white/40 hidden sm:inline">50% = {mid}</span>
            </div>
            <div
              className="h-10 rounded-lg ring-1 ring-white/10"
              style={{ backgroundImage: gradient }}
              role="img"
              aria-label={`${pair.label} interpolated in ${space}, midpoint ${mid}`}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Straight-alpha mix of transparent black → white, for comparison only */
function naiveMix(t: number): string {
  const c = Math.round(255 * t)
  return `rgba(${c}, ${c}, ${c}, ${t.toFixed(3)})`
}

function PremultipliedStrips() {
  const { premultiplied, naive } = useMemo(() => {
    let t = 0
    const color = interpolateColor(() => t, [0, 1], ['transparent', '#ffffff'])
    const a: string[] = []
    const b: string[] = []
    for (let i = 0; i <= SAMPLES; i++) {
      t = i / SAMPLES
      const pos = `${((i / SAMPLES) * 100).toFixed(2)}%`
      a.push(`${color.get()} ${pos}`)
      b.push(`${naiveMix(t)} ${pos}`)
    }
    return {
      premultiplied: `linear-gradient(to right, ${a.join(', ')})`,
      naive: `linear-gradient(to right, ${b.join(', ')})`,
    }
  }, [])

  return (
    <div className="space-y-3 rounded-xl p-4 bg-gradient-to-r from-orange-500 to-rose-500">
      {[
        { label: "interpolateColor: 'transparent' → white (premultiplied)", gradient: premultiplied },
        { label: 'straight alpha, for comparison: gray haze', gradient: naive },
      ].map(({ label, gradient }) => (
        <div key={label}>
          <p className="text-xs text-white font-medium mb-1 drop-shadow">{label}</p>
          <div className="h-8 rounded-lg ring-1 ring-black/20" style={{ backgroundImage: gradient }} role="img" aria-label={label} />
        </div>
      ))}
    </div>
  )
}

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

      <DocSection title="Color Spaces" icon={Droplets}>
        <p className="text-muted-foreground text-lg mb-4">
          Pass <code>space</code> in the options (4th argument) to choose where colors are mixed:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { createSpringValue, interpolateColor } from '@oxog/springkit'

const progress = createSpringValue(0)

// interpolateColor(source, inputRange, colors, options?)
const sky = interpolateColor(progress, [0, 1], ['#0000ff', '#ffff00'], {
  space: 'oklab',       // 'srgb' (default) | 'linear' | 'oklab'
  extrapolate: 'clamp', // the usual interpolate() options still apply
})

// The source can also be a plain function
let t = 0.5
const mid = interpolateColor(() => t, [0, 1], ['#ff0000', '#00ffff'], { space: 'linear' })
mid.get() // 'rgb(...)', or 'rgba(...)' when translucent

// Accepted: #rgb, #rgba, #rrggbb, #rrggbbaa, rgb()/rgba(), hsl()/hsla(), 'transparent'.
// Named colors such as 'red' are NOT parsed (they resolve to black).`} />
          </CardContent>
        </Card>
        <p className="text-muted-foreground mb-2">
          Each strip below is built by sampling <code>interpolateColor().get()</code> 33 times, so it
          shows exactly what your animation will output:
        </p>
        <Card>
          <CardContent className="pt-6">
            <ColorSpaceStrips />
          </CardContent>
        </Card>
        <p className="text-sm text-muted-foreground">
          Results are always converted back to sRGB <code>rgb()</code> / <code>rgba()</code>; OKLab
          values that fall outside the sRGB gamut are clipped per channel. The same <code>space</code>{' '}
          option exists on React's <code>useTransform()</code> for color outputs.
        </p>
      </DocSection>

      <DocSection title="Premultiplied Alpha">
        <p className="text-muted-foreground text-lg mb-4">
          Alpha is always interpolated premultiplied (like CSS <code>color-mix()</code>), in every
          space. Fading from <code>transparent</code> (transparent <em>black</em>) therefore does not
          pass through a dark haze:
        </p>
        <PremultipliedStrips />
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`const glow = interpolateColor(progress, [0, 1], ['transparent', '#ffffff'])
// 50% → 'rgba(255, 255, 255, 0.5)', not 'rgba(128, 128, 128, 0.5)'`} />
          </CardContent>
        </Card>
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
