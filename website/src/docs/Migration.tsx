import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpCircle, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { DocLayout, DocSection, CodeBlock } from '@/components/docs'

const GUIDE_URL = 'https://github.com/ersinkoc/springkit/blob/main/docs/MIGRATION-2.0.md'
const CHANGELOG_URL = 'https://github.com/ersinkoc/springkit/blob/main/CHANGELOG.md'

interface ChecklistRow {
  use: ReactNode
  change: ReactNode
}

const CHECKLIST: ChecklistRow[] = [
  { use: <code>decay()</code>, change: <>Velocity is px/s, deceleration per ms: multiply 1.x velocities by 60</> },
  { use: <><code>useDrag</code> / <code>createDragSpring</code> velocities, swipe thresholds</>, change: <>All gesture velocities are px/s: multiply 1.x values by 1000</> },
  { use: <><code>useDrag</code> / <code>createDragSpring</code> with <code>momentum</code></>, change: <>Flings glide much further (a real decay)</> },
  { use: <><code>onSnapComplete</code></>, change: <>Fires when the snap settles, not after a fixed 500ms</> },
  { use: <><code>dragElastic: {'{ … }'}</code> (core drag)</>, change: <>Edges left out are not elastic (0, was 0.5)</> },
  { use: <><code>stagger()</code> with a number <code>delay</code></>, change: <>Items are actually staggered (<code>k × delay</code>)</> },
  { use: <><code>staggerPresets</code> / stagger pattern defaults</>, change: <>Values are milliseconds (were seconds)</> },
  { use: <><code>animate(el, {'{ x: [a, b] }'})</code></>, change: <>The first entry is the start value</> },
  { use: <>Spring timings tuned on a 120Hz+ display</>, change: <>Springs run at the intended speed on every display</> },
  { use: <><code>{'<Animated onDrag… />'}</code></>, change: <>Drag gesture callbacks <code>(event, info)</code>, not HTML5 drag events</> },
  { use: <>Click handlers on draggable <code>Animated</code> elements</>, change: <>Drag starts after 3px; <code>dragThreshold={'{0}'}</code> restores the old start</> },
  { use: <><code>configFromDuration</code> / <code>configFromBounce</code></>, change: <>Physically derived configs; prefer <code>defineSpring()</code></> },
  { use: <><code>await spring.finished</code> after <code>stop()</code></>, change: <>Now resolves</> },
  { use: <>Color output strings</>, change: <><code>rgba()</code> for translucent colors; CSS color names are parsed</> },
  { use: <><code>Animated</code> and reduced motion</>, change: <>OS <code>prefers-reduced-motion</code> is honored without a <code>MotionConfig</code></> },
  { use: <>Tests that only fake <code>setTimeout</code></>, change: <>Delays run on the animation clock: use <code>installTestClock()</code></> },
  { use: <><code>useScroll({'{ target }'})</code> reading <code>scrollY</code></>, change: <>Reports the page scroll; pass <code>container</code> for an element</> },
  { use: <><code>useMotionValueEvent(v, 'change')</code></>, change: <>No call on mount</> },
]

function Checklist() {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-sm text-left">
        <caption className="sr-only">Migration checklist from SpringKit 1.x to 2.0</caption>
        <thead className="bg-white/5 text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">If you use</th>
            <th scope="col" className="px-4 py-3 font-medium">What changed in 2.0</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {CHECKLIST.map((row, i) => (
            <tr key={i} className="align-top">
              <td className="px-4 py-3 text-white/80 min-w-[14rem]">{row.use}</td>
              <td className="px-4 py-3 text-muted-foreground min-w-[16rem]">{row.change}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Item({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-2">
      <h3 className="font-semibold text-white">{title}</h3>
      <div className="text-sm text-muted-foreground space-y-2">{children}</div>
    </div>
  )
}

export function Migration() {
  return (
    <DocLayout
      title="Migrating to 2.0"
      description="What changed from SpringKit 1.x, who is affected and what to do"
      icon={ArrowUpCircle}
    >
      <DocSection title="Overview">
        <p className="text-muted-foreground">
          Most apps upgrade without code changes. 2.0 is a major version because about 190 bug fixes
          make the physics exact and refresh-rate independent, and several of them change observable
          behavior. It also adds compositor springs (<Link to="/docs/advanced/native-springs" className="text-orange-300 hover:text-orange-200">Native Springs</Link>),
          a deterministic <Link to="/docs/advanced/testing" className="text-orange-300 hover:text-orange-200">test clock</Link>,{' '}
          <Link to="/docs/advanced/time-scale" className="text-orange-300 hover:text-orange-200">slow motion</Link> and
          a Framer-Motion-style <Link to="/docs/react/drag" className="text-orange-300 hover:text-orange-200">drag API for Animated</Link>.
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock language="bash" code="npm install @oxog/springkit@2" />
          </CardContent>
        </Card>
        <div className="flex flex-wrap gap-4 text-sm">
          <a href={GUIDE_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-orange-300 hover:text-orange-200">
            Full migration guide <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a href={CHANGELOG_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-orange-300 hover:text-orange-200">
            Changelog <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </DocSection>

      <DocSection title="Quick Checklist">
        <Checklist />
      </DocSection>

      <DocSection title="Physics and Timing">
        <Item title="Springs run at the same speed on every display">
          <p>
            1.x advanced a fixed 1/60 s per frame, so springs ran 2× too fast at 120Hz and 2.4× at
            144Hz. 2.0 uses the exact closed-form solution with real elapsed time. If you tuned{' '}
            <code>stiffness</code> / <code>damping</code> by eye on a high-refresh-rate screen, your
            animations will now look slower: re-tune them, or describe the spring by its duration.
          </p>
          <CodeBlock code={`import { defineSpring, spring } from '@oxog/springkit'

spring(0, 100, { ...defineSpring({ duration: 350, bounce: 0.2 }), onUpdate })`} />
        </Item>
        <Item title={<><code>decay()</code> uses real units</>}>
          <p>
            <code>velocity</code> is in units per second and <code>deceleration</code> is the fraction
            kept per millisecond (iOS scale: <code>0.998</code> normal, <code>0.99</code> fast).
          </p>
          <CodeBlock code={`// 1.x
decay({ velocity: 20, deceleration: 0.95 })

// 2.0: px per frame × 60 = px/s; per-frame deceleration d → d ** (1 / 16.67)
decay({ velocity: 1200, deceleration: 0.997 })`} />
        </Item>
        <Item title={<><code>stop()</code> resolves <code>finished</code></>}>
          <p>
            <code>spring().stop()</code> and <code>decay().stop()</code> resolve the current{' '}
            <code>finished</code> promise; each <code>start()</code> creates a new one.
          </p>
        </Item>
      </DocSection>

      <DocSection title="Gestures">
        <Item title="All gesture velocities are px/s">
          <p>
            <code>onDragEnd</code> velocity, <code>release(vx, vy)</code>, <code>getVelocity()</code>,{' '}
            <code>snap.velocityThreshold</code> (default 500) and the swipe{' '}
            <code>velocityThreshold</code> (default 500) were px/ms. They can now be passed straight
            to <code>decay()</code>.
          </p>
          <CodeBlock code={`// 1.x
createSwipeGesture(el, { velocityThreshold: 0.3 })
// 2.0
createSwipeGesture(el, { velocityThreshold: 300 })`} />
        </Item>
        <Item title="Core drag momentum is a real decay">
          <p>
            The release velocity carries over and decays exponentially: a 1000 px/s fling glides
            ~325 px with the default <code>momentumDecay: 0.95</code>. Use <code>0.9</code> (~158 px) or
            lower for a shorter glide. <code>onSnapComplete</code> fires once the snap has settled.
          </p>
        </Item>
        <Item title="Swipes and rubber bands">
          <p>
            Swipes need at least <code>minDistance</code> (default 10px) of travel, so taps are no
            longer swipes. <code>createScrollSpring({'{ bounce: true }'})</code> uses an iOS-style rubber
            band, and <code>constrainToParent</code> keeps the element inside the parent's padding box.
          </p>
        </Item>
      </DocSection>

      <DocSection title="Orchestration">
        <Item title={<><code>stagger()</code> with a numeric delay</>}>
          <p>
            Item <code>k</code> starts after <code>k × delay</code> (1.x gave every item the same delay),
            and <code>from: 'center'</code> fans out symmetrically. Use <code>delay: 0</code> or{' '}
            <code>parallel()</code> if you relied on all items starting together.
          </p>
        </Item>
        <Item title="Stagger patterns are in milliseconds">
          <CodeBlock code={`staggerPresets.cascade(3) // 1.x: [0, 0.05, 0.1]   2.0: [0, 50, 100]`} />
        </Item>
        <Item title={<><code>animate()</code> arrays start at the first entry</>}>
          <p>
            <code>animate(el, {'{ opacity: [0, 1] }'})</code> starts at <code>0</code> and springs to{' '}
            <code>1</code> (<code>[from, ...to]</code>, as in Framer Motion).
          </p>
        </Item>
        <Item title="Timeline">
          <p>
            Segments are a function of playhead time, so <code>seek()</code> and{' '}
            <code>reverse()</code> are exact, and <code>to()</code> reads its start values when the
            segment first plays. Positions remain in seconds.
          </p>
        </Item>
      </DocSection>

      <DocSection title="React">
        <Item title={<><code>Animated</code> drag callbacks</>}>
          <p>
            <code>onDrag</code>, <code>onDragStart</code> and <code>onDragEnd</code> are drag gesture
            callbacks. For native HTML5 drag-and-drop, put those handlers on a plain element.
          </p>
          <CodeBlock language="tsx" code={`<Animated.div
  drag
  onDragEnd={(event, info) => console.log(info.offset, info.velocity)}
/>`} />
        </Item>
        <Item title="Drag starts after a 3px threshold">
          <p>
            A click on a draggable element fires no drag callbacks; a press that becomes a drag fires{' '}
            <code>onTapCancel</code> instead of <code>onTap</code>. <code>dragThreshold={'{0}'}</code>{' '}
            starts on pointerdown as before.
          </p>
        </Item>
        <Item title="Reduced motion and presence">
          <p>
            <code>Animated</code> honors the OS <code>prefers-reduced-motion</code> setting without a{' '}
            <code>MotionConfig</code>; wrap the app in{' '}
            <code>{'<MotionConfig reducedMotion="never">'}</code> to opt out.{' '}
            <code>AnimatePresence</code> removes children without an exit animation immediately, and{' '}
            <code>LazyMotion</code> always renders its children.
          </p>
        </Item>
        <Item title="Delays use the animation clock">
          <p>
            <code>useSprings</code> <code>delay</code>, <code>useTrail</code> / <code>SpringText</code> /{' '}
            <code>useVariants</code> staggers, <code>useAnimate</code> <code>delay</code> and{' '}
            <code>useChain</code> steps follow <code>globalLoop.setTimeScale()</code>. Tests that only
            fake <code>setTimeout</code> must use{' '}
            <Link to="/docs/advanced/testing" className="text-orange-300 hover:text-orange-200"><code>installTestClock()</code></Link>.
          </p>
        </Item>
        <Item title="Hooks">
          <ul className="list-disc pl-5 space-y-1">
            <li><code>useScroll({'{ target }'})</code> without a <code>container</code>: <code>scrollX</code> / <code>scrollY</code> are the page scroll.</li>
            <li><code>useMotionValueEvent(value, 'change', cb)</code> only fires on changes, not on mount.</li>
            <li><code>useMomentum</code>, <code>useBounce</code>, <code>useGravity</code>, <code>usePointer</code> / <code>useGyroscope</code> <code>smooth</code> use real elapsed time.</li>
            <li><code>useChain</code> starts each step once the previous one has settled.</li>
            <li><code>useVariants</code> keeps non-px <code>x</code> / <code>y</code> strings such as <code>'50%'</code>.</li>
            <li><code>Trail</code> <code>reverse</code> reverses the stagger order and passes the real index.</li>
          </ul>
        </Item>
      </DocSection>

      <DocSection title="Output Formats and Packaging">
        <Item title="Colors">
          <p>
            Translucent results are <code>rgba(...)</code>, mixed with premultiplied alpha. CSS color
            names (<code>'red'</code>, <code>'rebeccapurple'</code>) are parsed; in 1.x they became
            black. Pass <code>{'{ space: \'oklab\' }'}</code> for perceptually even gradients.
          </p>
        </Item>
        <Item title="Packaging">
          <p>
            <code>@oxog/springkit/react</code> no longer bundles its own copy of the core, so both
            entries share one animation loop. The React entry starts with <code>"use client"</code>.
            New entry point: <code>@oxog/springkit/testing</code>.
          </p>
        </Item>
      </DocSection>
    </DocLayout>
  )
}
