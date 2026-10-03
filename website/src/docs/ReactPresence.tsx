import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Layers, Plus, RotateCcw } from 'lucide-react'
import {
  Animated,
  AnimatePresence,
  VariantProvider,
  createMotionComponent,
  type AnimatePresenceMode,
} from '@oxog/springkit/react'
import { Card, CardContent } from '@/components/ui/card'
import { DocLayout, DocSection, CodeBlock, PropsTable, type PropRow } from '@/components/docs'
import { cn } from '@/lib/utils'

const PRESENCE_PROPS: PropRow[] = [
  {
    name: 'mode',
    type: "'sync' | 'wait' | 'popLayout'",
    default: "'sync'",
    description: 'How entering and exiting children animate relative to each other (see below).',
  },
  {
    name: 'initial',
    type: 'boolean',
    default: 'true',
    description: <>Set to <code>false</code> to skip the enter animation of the children present on first render.</>,
  },
  {
    name: 'custom',
    type: 'unknown',
    default: '—',
    description: <>Data for exiting children (read with <code>usePresenceCustom()</code>), e.g. a slide direction.</>,
  },
  {
    name: 'onExitComplete',
    type: '() => void',
    default: '—',
    description: 'Called when all exiting children have finished animating.',
  },
]

const MODES: { mode: AnimatePresenceMode; desc: string }[] = [
  { mode: 'sync', desc: 'Default. Exiting and entering children animate at the same time; the exiting child keeps its place in the layout until it is removed.' },
  { mode: 'wait', desc: 'The entering child is mounted only after the exiting one has finished. Best for swapping a single keyed child (pages, steps).' },
  {
    mode: 'popLayout',
    desc: 'Like sync, but exiting children are popped out of the flow (position: absolute at their last position and size) so siblings reflow immediately. Exiting children must forward their ref to a DOM element (Animated.* does) and their offset parent should be positioned (position: relative).',
  },
]

// ---------------------------------------------------------------------------
// Live demos
// ---------------------------------------------------------------------------

function ModePicker<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: T[]
  onChange: (value: T) => void
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg bg-white/5 p-1">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={value === option}
          onClick={() => onChange(option)}
          className={cn(
            'px-3 py-1 text-xs font-mono rounded-md transition-colors',
            value === option ? 'bg-orange-500/20 text-orange-200' : 'text-white/50 hover:text-white'
          )}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

function PresenceListDemo() {
  const [mode, setMode] = useState<'sync' | 'popLayout'>('popLayout')
  const [items, setItems] = useState([1, 2, 3, 4])
  const nextId = useRef(5)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <ModePicker label="AnimatePresence mode for the list" value={mode} options={['sync', 'popLayout']} onChange={setMode} />
        <button
          type="button"
          onClick={() => setItems((prev) => [...prev, nextId.current++])}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-white/5 hover:bg-white/10 text-white/70"
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>
      <ul className="relative flex flex-wrap gap-2 min-h-[2.5rem]" aria-label="Removable items">
        <AnimatePresence mode={mode}>
          {items.map((id) => (
            <Animated.li
              key={id}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              config={{ stiffness: 260, damping: 22 }}
              className="list-none"
            >
              <button
                type="button"
                onClick={() => setItems((prev) => prev.filter((item) => item !== id))}
                aria-label={`Remove item ${id}`}
                className="px-3 py-2 rounded-lg bg-gradient-to-br from-orange-500/30 to-amber-500/20 border border-orange-400/30 text-sm text-orange-100 hover:border-orange-300/60"
              >
                Item {id} ×
              </button>
            </Animated.li>
          ))}
        </AnimatePresence>
      </ul>
      <p className="text-xs text-white/40">
        Remove an item: with <code>sync</code> its neighbours wait for the exit to finish before
        closing the gap; with <code>popLayout</code> they move in immediately.
      </p>
    </div>
  )
}

const STEPS = ['Account', 'Profile', 'Confirm']

function PresenceSwapDemo() {
  const [mode, setMode] = useState<'sync' | 'wait'>('wait')
  const [step, setStep] = useState(0)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <ModePicker label="AnimatePresence mode for the step" value={mode} options={['sync', 'wait']} onChange={setMode} />
        <button
          type="button"
          onClick={() => setStep((s) => (s + 1) % STEPS.length)}
          className="px-3 py-1.5 text-xs rounded-lg bg-white/5 hover:bg-white/10 text-white/70"
        >
          Next step
        </button>
      </div>
      <div className="grid h-20 items-center" aria-live="polite">
        <AnimatePresence mode={mode}>
          <Animated.div
            key={step}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            config={{ stiffness: 220, damping: 24 }}
            style={{ gridArea: '1 / 1' }}
            className="rounded-xl bg-white/5 border border-white/10 px-4 py-3"
          >
            <span className="text-xs text-white/40 block">Step {step + 1} of {STEPS.length}</span>
            <span className="text-white font-medium">{STEPS[step]}</span>
          </Animated.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

const MotionLi = createMotionComponent('li', {
  variants: {
    hidden: { opacity: 0, x: -24 },
    visible: { opacity: 1, x: 0 },
  },
  spring: { stiffness: 220, damping: 22 },
})

const LIST = ['createMotionComponent', 'VariantProvider', 'staggerChildren', 'staggerDirection', 'delayChildren']

function StaggerDemo() {
  const [show, setShow] = useState(true)
  const [runKey, setRunKey] = useState(0)

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-pressed={show}
          className="px-3 py-1.5 text-xs rounded-lg bg-orange-500/20 text-orange-200 hover:bg-orange-500/30"
        >
          {show ? 'Hide (reverse stagger)' : 'Show'}
        </button>
        <button
          type="button"
          onClick={() => {
            setShow(true)
            setRunKey((k) => k + 1)
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-white/5 hover:bg-white/10 text-white/70"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Replay mount
        </button>
      </div>
      <ul key={runKey} className="space-y-2">
        <VariantProvider
          variant={show ? 'visible' : 'hidden'}
          transition={{ staggerChildren: 70, delayChildren: 50, staggerDirection: show ? 1 : -1 }}
        >
          {LIST.map((label) => (
            <MotionLi
              key={label}
              initial="hidden"
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 font-mono text-sm text-orange-200"
            >
              {label}
            </MotionLi>
          ))}
        </VariantProvider>
      </ul>
    </div>
  )
}

const PANEL_SPRING = { stiffness: 220, damping: 26 }

const Panel = createMotionComponent('div', {
  variants: {
    closed: { opacity: 0.35, scale: 0.94, backgroundColor: 'rgba(249, 115, 22, 0)' },
    open: { opacity: 1, scale: 1, backgroundColor: 'rgba(249, 115, 22, 0.12)' },
  },
  spring: PANEL_SPRING,
})

const PanelItem = createMotionComponent('li', {
  variants: {
    closed: { opacity: 0, x: -16 },
    open: { opacity: 1, x: 0 },
  },
  spring: { stiffness: 260, damping: 22 },
})

const PANEL_ITEMS = ['Inbox', 'Drafts', 'Archive']

function BeforeChildrenDemo() {
  const [open, setOpen] = useState(false)
  const variant = open ? 'open' : 'closed'

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-pressed={open}
        className="px-3 py-1.5 text-xs rounded-lg bg-orange-500/20 text-orange-200 hover:bg-orange-500/30"
      >
        {open ? 'Close panel' : 'Open panel'}
      </button>
      <Panel
        initial="closed"
        animate={variant}
        className="rounded-xl border border-orange-400/20 p-4"
      >
        <ul className="space-y-2">
          <VariantProvider
            variant={variant}
            transition={{ when: 'beforeChildren', spring: PANEL_SPRING, staggerChildren: 60 }}
          >
            {PANEL_ITEMS.map((label) => (
              <PanelItem
                key={label}
                initial="closed"
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-orange-100"
              >
                {label}
              </PanelItem>
            ))}
          </VariantProvider>
        </ul>
      </Panel>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function ReactPresence() {
  return (
    <DocLayout
      title="Presence & Variants"
      description="Exit animations with AnimatePresence modes, and staggered variant children"
      icon={Layers}
    >
      <DocSection title="AnimatePresence">
        <p className="text-muted-foreground mb-4">
          A removed child stays mounted until its exit finishes: <code>Animated</code> elements with an{' '}
          <code>exit</code> prop, or components that call <code>safeToRemove</code> from{' '}
          <code>usePresence()</code>. Every direct child needs a unique <code>key</code>.
        </p>
        <PropsTable rows={PRESENCE_PROPS} caption="AnimatePresence props" />
      </DocSection>

      <DocSection title="Modes">
        <div className="grid gap-3">
          {MODES.map(({ mode, desc }) => (
            <div key={mode} className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 p-3 rounded-lg bg-white/5 border border-white/10">
              <code className="text-orange-300 font-mono text-sm sm:w-24 shrink-0">'{mode}'</code>
              <span className="text-muted-foreground text-sm">{desc}</span>
            </div>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <PresenceListDemo />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { AnimatePresence, Animated } from '@oxog/springkit/react'

// popLayout: the offset parent must be positioned
<ul style={{ position: 'relative' }}>
  <AnimatePresence mode="popLayout">
    {items.map((id) => (
      <Animated.li
        key={id}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.6 }}
      >
        <button onClick={() => remove(id)}>Item {id}</button>
      </Animated.li>
    ))}
  </AnimatePresence>
</ul>`} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <PresenceSwapDemo />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`// wait: the next step enters after the previous one has left
<AnimatePresence mode="wait">
  <Animated.div
    key={step}
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -16 }}
  >
    {steps[step]}
  </Animated.div>
</AnimatePresence>`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="createMotionComponent & VariantProvider">
        <p className="text-muted-foreground mb-4">
          <code>createMotionComponent(tag, {'{ variants, spring }'})</code> turns any HTML/SVG tag into a
          variant-driven component. It accepts the element's own props plus <code>variants</code>,{' '}
          <code>initial</code>, <code>animate</code>, <code>custom</code>, <code>inherit</code>,{' '}
          <code>spring</code> and <code>onAnimationComplete</code>, and without an <code>animate</code>{' '}
          prop it follows the variant of the nearest <code>VariantProvider</code>.
        </p>
        <p className="text-muted-foreground mb-4">
          <code>VariantProvider</code> gives each direct child its index and the child count, so the
          provider's <code>transition</code> staggers them automatically. All timings are in{' '}
          <strong>milliseconds</strong>: child <em>i</em> starts after{' '}
          <code>delayChildren + i × staggerChildren</code> (counted from the end with{' '}
          <code>staggerDirection: -1</code>).
        </p>
        <Card>
          <CardContent className="pt-6">
            <StaggerDemo />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { createMotionComponent, VariantProvider } from '@oxog/springkit/react'

const MotionLi = createMotionComponent('li', {
  variants: {
    hidden: { opacity: 0, x: -24 },
    visible: { opacity: 1, x: 0 },
  },
  spring: { stiffness: 220, damping: 22 },
})

function List({ items, show }) {
  return (
    <ul>
      <VariantProvider
        variant={show ? 'visible' : 'hidden'}
        transition={{
          staggerChildren: 70,               // ms between children
          delayChildren: 50,                 // ms before the first one
          staggerDirection: show ? 1 : -1,   // hide from the last item up
        }}
      >
        {items.map((item) => (
          <MotionLi key={item} initial="hidden">{item}</MotionLi>
        ))}
      </VariantProvider>
    </ul>
  )
}`} />
          </CardContent>
        </Card>
        <p className="text-sm text-muted-foreground">
          Every number and string of a variant springs: <code>opacity</code>, the transform shorthands
          (<code>x</code>, <code>y</code>, <code>scale</code>, <code>scaleX</code>, <code>scaleY</code>,{' '}
          <code>rotate</code>), and also colors, units (<code>x: '50%'</code>, <code>width: '20rem'</code>)
          and complex strings like <code>boxShadow</code>, with the same rules as{' '}
          <Link to="/docs/react/values" className="text-orange-300 hover:underline">Animated</Link>. A
          settled animation renders the variant's exact string. Transform shorthands are combined into
          one <code>transform</code>, after any <code>style.transform</code> you pass.
        </p>
      </DocSection>

      <DocSection title="Parent first: when: 'beforeChildren'">
        <p className="text-muted-foreground mb-4">
          With <code>transition.when: 'beforeChildren'</code> on a <code>VariantProvider</code> the
          children start once the parent's animation is done. The provider can't see the parent
          element, so it waits <code>transition.delay</code> plus the settle time of{' '}
          <code>transition.spring</code> (the default spring when omitted): pass the parent's own spring
          and delay. <code>staggerChildren</code> / <code>delayChildren</code> are counted from that
          point. <code>'afterChildren'</code> is not supported (it behaves like <code>false</code>).
        </p>
        <Card>
          <CardContent className="pt-6">
            <BeforeChildrenDemo />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`const PANEL_SPRING = { stiffness: 220, damping: 26 }

const Panel = createMotionComponent('div', {
  variants: {
    closed: { opacity: 0.35, scale: 0.94, backgroundColor: 'rgba(249, 115, 22, 0)' },
    open: { opacity: 1, scale: 1, backgroundColor: 'rgba(249, 115, 22, 0.12)' },
  },
  spring: PANEL_SPRING,
})

const Item = createMotionComponent('li', {
  variants: {
    closed: { opacity: 0, x: -16 },
    open: { opacity: 1, x: 0 },
  },
})

<Panel initial="closed" animate={open ? 'open' : 'closed'}>
  <ul>
    <VariantProvider
      variant={open ? 'open' : 'closed'}
      transition={{
        when: 'beforeChildren', // wait for the panel's spring to settle
        spring: PANEL_SPRING,   // the parent's spring decides how long
        staggerChildren: 60,
      }}
    >
      {items.map((item) => (
        <Item key={item} initial="closed">{item}</Item>
      ))}
    </VariantProvider>
  </ul>
</Panel>`} />
          </CardContent>
        </Card>
      </DocSection>
    </DocLayout>
  )
}
