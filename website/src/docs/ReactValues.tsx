import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Palette, ArrowRight } from 'lucide-react'
import { Animated } from '@oxog/springkit/react'
import { Card, CardContent } from '@/components/ui/card'
import { DocLayout, DocSection, CodeBlock } from '@/components/docs'

const DEMO_CONFIG = { stiffness: 170, damping: 16 }

/** One toggle drives a color, unit and complex-string animation side by side */
function ValuesDemo() {
  const [on, setOn] = useState(false)

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => setOn((value) => !value)}
        aria-pressed={on}
        className="px-3 py-1.5 text-xs rounded-lg bg-orange-500/20 text-orange-200 hover:bg-orange-500/30"
      >
        {on ? 'Animate back' : 'Animate strings'}
      </button>

      <div className="grid gap-6 sm:grid-cols-3">
        <figure className="space-y-2">
          <figcaption className="text-xs text-white/40 font-mono">backgroundColor / color</figcaption>
          <Animated.div
            animate={{
              backgroundColor: on ? 'tomato' : 'transparent',
              color: on ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
            }}
            config={DEMO_CONFIG}
            className="h-16 rounded-xl border border-white/15 flex items-center justify-center text-sm font-medium"
          >
            {on ? "'tomato'" : "'transparent'"}
          </Animated.div>
        </figure>

        <figure className="space-y-2">
          <figcaption className="text-xs text-white/40 font-mono">width (rem) / x (%)</figcaption>
          <div className="h-16 rounded-xl bg-black/20 p-2 flex flex-col justify-between overflow-hidden">
            <Animated.div
              animate={{ width: on ? '9rem' : '3rem' }}
              config={DEMO_CONFIG}
              className="h-5 max-w-full rounded-md bg-gradient-to-r from-orange-500 to-amber-500"
            />
            <Animated.div
              animate={{ x: on ? '200%' : '0%' }}
              config={DEMO_CONFIG}
              className="h-5 w-1/4 rounded-md bg-cyan-400/70"
            />
          </div>
        </figure>

        <figure className="space-y-2">
          <figcaption className="text-xs text-white/40 font-mono">boxShadow / filter</figcaption>
          <Animated.div
            animate={{
              boxShadow: on
                ? '0px 12px 32px rgba(249, 115, 22, 0.55)'
                : '0px 0px 0px rgba(249, 115, 22, 0)',
              filter: on ? 'blur(0px)' : 'blur(4px)',
            }}
            config={DEMO_CONFIG}
            className="h-16 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-sm text-white"
          >
            Sharp &amp; lifted
          </Animated.div>
        </figure>
      </div>

      <p className="text-xs text-white/40">
        Click again mid-flight: every value turns around with its current velocity, colors and
        shadows included.
      </p>
    </div>
  )
}

const RULES: { title: string; desc: ReactNode }[] = [
  {
    title: 'Same spring as numbers',
    desc: (
      <>
        Every number and color inside a string becomes a hidden channel of the element's spring
        group. Retargeting keeps the velocity, <code>config</code> applies, and{' '}
        <code>whileHover</code> / <code>whileTap</code> / <code>whileFocus</code> /{' '}
        <code>whileDrag</code> / <code>whileInView</code>, <code>exit</code> and reduced motion work
        exactly as they do for <code>opacity</code> or <code>x</code>.
      </>
    ),
  },
  {
    title: 'Exact settled value',
    desc: (
      <>
        Once the spring has settled the element gets exactly the string you wrote (
        <code>'tomato'</code> stays <code>'tomato'</code>, not <code>rgb(255, 99, 71)</code>).
        Colors in between frames are written as <code>rgb()</code> / <code>rgba()</code>.
      </>
    ),
  },
  {
    title: 'Colors mix premultiplied',
    desc: (
      <>
        Hex, <code>rgb()</code>, <code>rgba()</code>, <code>hsl()</code>, <code>transparent</code> and CSS
        color names (<code>'rebeccapurple'</code>) can be mixed freely. Alpha is premultiplied, so a fade
        from <code>transparent</code> doesn't pass through gray or black.
      </>
    ),
  },
  {
    title: 'Different shapes jump',
    desc: (
      <>
        Two strings animate only when their text lines up: same units, same words, same number of
        shadows. <code>'auto'</code> → <code>'100px'</code>, <code>'50%'</code> → <code>'200px'</code>,{' '}
        <code>'0'</code> → <code>'10px'</code> or a number → a string jump to the new value instead.
        Write both ends in the same form (<code>'0px 0px 0px rgba(0,0,0,0)'</code>, not{' '}
        <code>'none'</code>).
      </>
    ),
  },
  {
    title: 'No starting value, no animation',
    desc: (
      <>
        A string key that only appears in <code>while*</code> or <code>exit</code> (not in{' '}
        <code>initial</code>, <code>animate</code> or <code>style</code>) has nothing to start from: it
        starts at its target, and it is removed again when the gesture ends. Give it a resting value in{' '}
        <code>animate</code> or <code>style</code>. A transform shorthand with a unit (
        <code>whileHover={'{{ x: \'20%\' }}'}</code>) starts from its identity (<code>'0%'</code>).
      </>
    ),
  },
  {
    title: 'Static style strings',
    desc: (
      <>
        Inline <code>style</code> strings are not animated on their own. When an animation prop
        animates the same key, the <code>style</code> value is its resting value whenever{' '}
        <code>animate</code> doesn't set that key.
      </>
    ),
  },
]

export function ReactValues() {
  return (
    <DocLayout
      title="Animating Any Value"
      description="Colors, units and complex strings in Animated, variants and createMotionComponent"
      icon={Palette}
    >
      <DocSection title="Overview">
        <p className="text-muted-foreground mb-4">
          <code>Animated</code> elements spring more than numbers. Any string in{' '}
          <code>initial</code>, <code>animate</code>, <code>exit</code> or a <code>while*</code> prop
          animates: colors (<code>backgroundColor</code>, <code>color</code>, <code>borderColor</code>),
          numbers with units (<code>width: '20rem'</code>, <code>x: '50%'</code>,{' '}
          <code>rotate: '45deg'</code>) and complex strings made of numbers and colors (
          <code>boxShadow</code>, <code>filter: 'blur(4px)'</code>).
        </p>
        <Card>
          <CardContent className="pt-6">
            <ValuesDemo />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { Animated } from '@oxog/springkit/react'

<Animated.div
  animate={{
    // Colors: hex, rgb(a), hsl(a), 'transparent' and CSS names
    backgroundColor: on ? 'tomato' : 'transparent',
    color: on ? '#fff' : 'rgba(255, 255, 255, 0.6)',

    // Numbers with units
    width: on ? '20rem' : '8rem',
    x: on ? '50%' : '0%',

    // Complex strings: every number and color inside springs
    boxShadow: on
      ? '0px 12px 32px rgba(249, 115, 22, 0.55)'
      : '0px 0px 0px rgba(249, 115, 22, 0)',
    filter: on ? 'blur(0px)' : 'blur(4px)',
  }}
  config={{ stiffness: 170, damping: 16 }}
/>`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Rules">
        <div className="grid gap-3">
          {RULES.map((rule) => (
            <div key={rule.title} className="p-3 rounded-lg bg-white/5 border border-white/10">
              <h3 className="text-orange-300 text-sm font-semibold mb-1">{rule.title}</h3>
              <p className="text-muted-foreground text-sm">{rule.desc}</p>
            </div>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`// Animates: both ends have the same shape
<Animated.div animate={{ height: open ? '12rem' : '0rem' }} />

// Jumps: 'auto' has no number to spring from
<Animated.div animate={{ height: open ? 'auto' : '0px' }} />

// Jumps on hover (no resting backgroundColor), disappears on hover end
<Animated.button whileHover={{ backgroundColor: '#f97316' }} />

// Animates both ways: the resting value comes from style (or animate)
<Animated.button
  style={{ backgroundColor: 'rgba(249, 115, 22, 0)' }}
  whileHover={{ backgroundColor: '#f97316' }}
/>`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Variants & createMotionComponent">
        <p className="text-muted-foreground mb-4">
          The same values work in variants: <code>useVariants</code>, <code>createMotionComponent</code>{' '}
          and children of a <code>VariantProvider</code> spring every number and string of a variant
          and settle on the exact string. <code>x</code> / <code>y</code> strings keep their unit (
          <code>'50%'</code> stays <code>'50%'</code>); plain px strings such as <code>'12px'</code>{' '}
          come back as numbers.
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { createMotionComponent } from '@oxog/springkit/react'

const Chip = createMotionComponent('button', {
  variants: {
    idle: { backgroundColor: 'transparent', boxShadow: '0px 0px 0px rgba(0,0,0,0)', x: '0%' },
    active: { backgroundColor: 'rebeccapurple', boxShadow: '0px 8px 24px rgba(0,0,0,0.3)', x: '10%' },
  },
  spring: { stiffness: 260, damping: 22 },
})

<Chip initial="idle" animate={selected ? 'active' : 'idle'}>Filter</Chip>`} />
          </CardContent>
        </Card>
        <Link
          to="/docs/react/presence-variants"
          className="inline-flex items-center gap-2 text-sm text-orange-300 hover:text-orange-200"
        >
          Staggering and orchestrating variant children <ArrowRight className="w-4 h-4" />
        </Link>
      </DocSection>
    </DocLayout>
  )
}
