import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Gauge, ArrowRight } from 'lucide-react'
import { globalLoop, spring } from '@oxog/springkit'
import { Card, CardContent } from '@/components/ui/card'
import { DocLayout, DocSection, CodeBlock } from '@/components/docs'
import { cn } from '@/lib/utils'

const PRESETS = [1, 0.5, 0.25, 0.1, 0]
const BOX = 40

/** Ping-pong spring whose speed follows globalLoop's time scale */
function TimeScaleDemo() {
  const trackRef = useRef<HTMLDivElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(() => globalLoop.getTimeScale())

  // Mirror the global time scale (it may also be changed elsewhere)
  useEffect(() => {
    const unsubscribe = globalLoop.onTimeScaleChange(setScale)
    return () => {
      unsubscribe()
    }
  }, [])

  // A spring that bounces between both ends forever
  useEffect(() => {
    let cancelled = false
    let animation: ReturnType<typeof spring> | null = null

    const distance = () => Math.max(0, (trackRef.current?.clientWidth ?? 0) - BOX - 8)
    const run = (toEnd: boolean) => {
      const from = toEnd ? 0 : distance()
      const to = toEnd ? distance() : 0
      animation = spring(from, to, {
        stiffness: 120,
        damping: 9,
        onUpdate: (x) => {
          if (boxRef.current) boxRef.current.style.transform = `translateX(${x}px)`
        },
        onComplete: () => {
          if (!cancelled) run(!toEnd)
        },
      })
      animation.start()
    }
    run(true)

    return () => {
      cancelled = true
      animation?.destroy()
      // The time scale is global: never leave other pages in slow motion
      globalLoop.setTimeScale(1)
    }
  }, [])

  return (
    <div className="space-y-4">
      <div ref={trackRef} className="relative h-12 rounded-xl bg-black/20 overflow-hidden">
        <div
          ref={boxRef}
          className="absolute left-1 top-1 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 will-change-transform"
          style={{ width: BOX, height: BOX }}
        />
      </div>

      <label className="block text-sm text-white/70">
        <span className="flex justify-between">
          <span>
            <code className="font-mono">globalLoop.setTimeScale()</code>
          </span>
          <span className="font-mono text-orange-200">{scale.toFixed(2)}×</span>
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={scale}
          onChange={(e) => globalLoop.setTimeScale(e.target.valueAsNumber)}
          className="w-full mt-2 accent-orange-400"
          aria-label="Global animation time scale"
          aria-valuetext={`${scale.toFixed(2)} times normal speed`}
        />
      </label>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Time scale presets">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => globalLoop.setTimeScale(preset)}
            aria-pressed={scale === preset}
            className={cn(
              'px-3 py-1.5 text-xs font-mono rounded-lg transition-colors',
              scale === preset ? 'bg-orange-500/20 text-orange-200' : 'bg-white/5 text-white/60 hover:bg-white/10'
            )}
          >
            {preset === 0 ? 'freeze (0)' : `${preset}×`}
          </button>
        ))}
      </div>
    </div>
  )
}

export function TimeScaleDoc() {
  return (
    <DocLayout
      title="Slow Motion"
      description="Scale time for every loop-driven animation to inspect motion while developing"
      icon={Gauge}
    >
      <DocSection title="Overview">
        <p className="text-muted-foreground mb-4">
          <code>globalLoop.setTimeScale(n)</code> slows down, speeds up or freezes every animation
          driven by SpringKit's frame loop: <code>spring()</code>, spring values and groups,{' '}
          <code>decay()</code>, MotionValues, timelines, <code>keyframes()</code>, the React hooks and{' '}
          <code>Animated</code> elements built on them (including drag momentum and the{' '}
          <code>useMomentum</code> / <code>useBounce</code> / <code>useGravity</code> physics hooks), and
          every animation started with <code>animateNative()</code> (through the Web Animations{' '}
          <code>playbackRate</code>). Delays scale too (see below). <code>1</code> is normal speed,{' '}
          <code>0.1</code> is 10× slow motion and <code>0</code> freezes.
        </p>
        <Card>
          <CardContent className="pt-6">
            <TimeScaleDemo />
          </CardContent>
        </Card>
        <p className="text-sm text-muted-foreground">
          The time scale is reset to 1 when you leave this page. It is global state, so do the same in
          your own debug tools.
        </p>
      </DocSection>

      <DocSection title="API">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { globalLoop } from '@oxog/springkit'

globalLoop.setTimeScale(0.1)  // 10x slow motion
globalLoop.setTimeScale(0)    // freeze
globalLoop.setTimeScale(2)    // double speed
globalLoop.getTimeScale()     // current scale

// React to changes (e.g. a debug overlay); returns an unsubscribe function
const unsubscribe = globalLoop.onTimeScaleChange((scale) => {
  label.textContent = \`\${scale}x\`
})

// A slow-motion toggle while holding Shift
window.addEventListener('keydown', (e) => { if (e.key === 'Shift') globalLoop.setTimeScale(0.2) })
window.addEventListener('keyup', (e) => { if (e.key === 'Shift') globalLoop.setTimeScale(1) })`} />
          </CardContent>
        </Card>
        <div className="grid gap-3">
          {[
            { fn: 'globalLoop.setTimeScale(scale)', desc: 'Set the playback speed. Negative, NaN or infinite values are treated as 0 (frozen). Listeners are only notified when the value changes.' },
            { fn: 'globalLoop.getTimeScale()', desc: 'The current scale (default 1).' },
            { fn: 'globalLoop.onTimeScaleChange(callback)', desc: 'Called with the new scale on every change. Returns an unsubscribe function.' },
          ].map((item) => (
            <div key={item.fn} className="flex flex-col sm:flex-row sm:items-start gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
              <code className="text-orange-300 font-mono text-sm shrink-0">{item.fn}</code>
              <span className="text-muted-foreground text-sm">{item.desc}</span>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="Delays on the Animation Clock">
        <p className="text-muted-foreground mb-4">
          <code>delay(ms, callback)</code> (also <code>globalLoop.delay()</code>) is a{' '}
          <code>setTimeout</code> driven by the frame loop: <code>ms</code> is animation time, so slow
          motion stretches the wait and <code>0</code> freezes it, and the test clock controls it. It
          returns a cancel function (a no-op once the callback has run). The callback runs during the
          first frame at or after the due time, never synchronously, even for <code>ms &lt;= 0</code>.
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { delay, globalLoop, spring } from '@oxog/springkit'

// Start a spring 300ms (of animation time) from now
const cancel = delay(300, () => {
  spring(0, 100, { onUpdate: (x) => { el.style.transform = \`translateX(\${x}px)\` } }).start()
})

cancel() // changed your mind: the callback never runs

// Same thing through the loop instance
const cancelToo = globalLoop.delay(300, () => console.log('due'))`} />
          </CardContent>
        </Card>
        <p className="text-muted-foreground">
          SpringKit schedules its own delays this way: <code>animate()</code> <code>delay</code>,{' '}
          <code>stagger()</code> delays, trail delays and timeline <code>repeatDelay</code>, and in React
          the variant staggers (<code>staggerChildren</code>, <code>delayChildren</code>,{' '}
          <code>when: 'beforeChildren'</code>), <code>useSprings</code> <code>delay</code>,{' '}
          <code>useTrail</code> / <code>SpringText</code> staggers, <code>useAnimate</code>{' '}
          <code>delay</code> and <code>useChain</code> steps. Use <code>delay()</code> instead of{' '}
          <code>setTimeout</code> in your own sequencing code so it stays in step with the animations.
        </p>
        <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-400/20 text-sm text-orange-100/90">
          <strong className="text-orange-200">Tests:</strong> because these delays no longer use{' '}
          <code>setTimeout</code>, a test that only fakes timers (e.g.{' '}
          <code>vi.useFakeTimers()</code> + <code>vi.advanceTimersByTime()</code>) will not fire them.
          Use <code>installTestClock()</code> from <code>@oxog/springkit/testing</code>, which drives
          frames and the animation clock (see{' '}
          <Link to="/docs/advanced/testing" className="underline hover:text-white">Testing Animations</Link>).
        </div>
      </DocSection>

      <DocSection title="What Is Not Affected">
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>
            Your own <code>setTimeout</code> / <code>setInterval</code> timers and{' '}
            <code>requestAnimationFrame</code> loops (read <code>globalLoop.getTimeScale()</code> or use{' '}
            <code>delay()</code>), and the few timer-based APIs left: <code>TypeWriter</code> typing speed
            and the <code>createOrchestration()</code> delays. Animations they start are scaled once
            running.
          </li>
          <li>
            The pointer itself: an element being dragged still follows the cursor 1:1; only its
            release animation is scaled.
          </li>
          <li>
            The frame delta passed to <code>globalLoop.onFrame()</code> listeners is the real
            (unscaled) frame time.
          </li>
        </ul>
        <Link
          to="/examples/native-springs"
          className="inline-flex items-center gap-2 text-sm text-orange-300 hover:text-orange-200"
        >
          Try it on JavaScript and compositor springs side by side <ArrowRight className="w-4 h-4" />
        </Link>
      </DocSection>
    </DocLayout>
  )
}
