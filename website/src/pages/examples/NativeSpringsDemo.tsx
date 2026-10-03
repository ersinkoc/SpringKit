import { useEffect, useMemo, useRef, useState } from 'react'
import { Play, Cpu, Copy, Check } from 'lucide-react'
import {
  spring,
  solveSpring,
  defineSpring,
  springEasing,
  animateNative,
  globalLoop,
  type NativeAnimationControls,
} from '@oxog/springkit'
import { DemoPageLayout } from './DemoPageLayout'

const CODE = `import { spring, defineSpring, animateNative, solveSpring, globalLoop } from '@oxog/springkit'

const config = defineSpring({ duration: 600, bounce: 0.35 })

// 1. Classic: JavaScript computes every frame on the main thread
spring(0, 260, {
  ...config,
  onUpdate: (x) => { jsBox.style.transform = \`translateX(\${x}px)\` },
}).start()

// 2. Native: the spring is compiled to CSS linear() and the browser
//    plays it on the compositor — no JavaScript per frame
animateNative(nativeBox, {
  transform: ['translateX(0px)', 'translateX(260px)'],
}, config)

// 3. Seekable: exact closed-form solution at any millisecond
const solver = solveSpring(config, 0, 260)
solver.at(120)   // { value, velocity } 120ms in
solver.duration  // ms until rest

// 4. Slow motion for debugging: scales both kinds of spring
globalLoop.setTimeScale(0.25)
// ...and back to normal when done (it is global state)
globalLoop.setTimeScale(1)
`

const DISTANCE = 260
const CHART_W = 320
const CHART_H = 140

/** Busy-wait to simulate heavy main-thread work (e.g. a big React render) */
function blockMainThread(ms: number) {
  const end = performance.now() + ms
  while (performance.now() < end) {
    // intentionally blocking
  }
}

function NativeSpringsDemo() {
  const [duration, setDuration] = useState(600)
  const [bounce, setBounce] = useState(0.35)
  const [scrub, setScrub] = useState(1)
  const [copied, setCopied] = useState(false)
  const [atEnd, setAtEnd] = useState(false)
  const [timeScale, setTimeScale] = useState(() => globalLoop.getTimeScale())

  const jsBoxRef = useRef<HTMLDivElement>(null)
  const nativeBoxRef = useRef<HTMLDivElement>(null)
  const scrubBoxRef = useRef<HTMLDivElement>(null)
  const jsAnimRef = useRef<ReturnType<typeof spring> | null>(null)
  const nativeAnimRef = useRef<NativeAnimationControls | null>(null)
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const config = useMemo(() => defineSpring({ duration, bounce }), [duration, bounce])
  const solver = useMemo(() => solveSpring(config, 0, 1), [config])
  const compiled = useMemo(() => springEasing(config), [config])

  const curve = useMemo(() => {
    let max = 1
    let min = 0
    const pts: Array<[number, number]> = []
    for (let i = 0; i <= 120; i++) {
      const v = solver.at((i / 120) * solver.duration).value
      max = Math.max(max, v)
      min = Math.min(min, v)
      pts.push([i / 120, v])
    }
    const range = max - min || 1
    const toY = (v: number) => CHART_H - 10 - ((v - min) / range) * (CHART_H - 20)
    return {
      path: pts.map(([t, v], i) => `${i ? 'L' : 'M'}${(t * CHART_W).toFixed(1)},${toY(v).toFixed(1)}`).join(' '),
      targetY: toY(1),
      overshoot: Math.max(0, (max - 1) * 100),
    }
  }, [solver])

  // Scrubbing: the solver gives the exact state at any time
  useEffect(() => {
    const el = scrubBoxRef.current
    if (!el) return
    el.style.transform = `translateX(${solver.at(scrub * solver.duration).value * DISTANCE}px)`
  }, [scrub, solver])

  useEffect(() => {
    const copyTimeout = copyTimeoutRef
    const unsubscribeTimeScale = globalLoop.onTimeScaleChange(setTimeScale)
    return () => {
      jsAnimRef.current?.destroy()
      nativeAnimRef.current?.cancel()
      if (copyTimeout.current) clearTimeout(copyTimeout.current)
      unsubscribeTimeScale()
      // The time scale is global: don't leave other pages in slow motion
      globalLoop.setTimeScale(1)
    }
  }, [])

  const run = (block: boolean) => {
    const jsBox = jsBoxRef.current
    const nativeBox = nativeBoxRef.current
    if (!jsBox || !nativeBox) return

    const from = atEnd ? DISTANCE : 0
    const to = atEnd ? 0 : DISTANCE
    setAtEnd(!atEnd)

    jsAnimRef.current?.destroy()
    nativeAnimRef.current?.cancel()

    jsAnimRef.current = spring(from, to, {
      ...config,
      onUpdate: (x) => {
        jsBox.style.transform = `translateX(${x}px)`
      },
    })
    jsAnimRef.current.start()

    nativeAnimRef.current = animateNative(
      nativeBox,
      { transform: [`translateX(${from}px)`, `translateX(${to}px)`] },
      { ...config, respectReducedMotion: false }
    )

    if (block) {
      // Let both animations start, then freeze the main thread
      requestAnimationFrame(() => setTimeout(() => blockMainThread(Math.min(1000, compiled.duration * 0.8)), 60))
    }
  }

  const css = `transition: transform ${compiled};`

  const copy = async () => {
    await navigator.clipboard.writeText(css)
    setCopied(true)
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="space-y-6">
      {/* Race */}
      <div className="space-y-3">
        {[
          { ref: jsBoxRef, label: 'spring() — JavaScript, main thread', color: 'from-slate-400 to-slate-500' },
          { ref: nativeBoxRef, label: 'animateNative() — compositor', color: 'from-emerald-400 to-teal-500' },
        ].map(({ ref, label, color }) => (
          <div key={label}>
            <p className="text-xs text-white/50 mb-1.5">{label}</p>
            <div className="relative h-12 bg-white/5 rounded-xl overflow-hidden">
              <div
                ref={ref}
                className={`absolute left-1 top-1 w-10 h-10 rounded-lg bg-gradient-to-br ${color} will-change-transform`}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => run(false)}
          className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
        >
          <Play className="w-4 h-4" />
          Run
        </button>
        <button
          onClick={() => run(true)}
          className="flex-1 py-3 bg-rose-500/20 text-rose-200 ring-1 ring-rose-500/40 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-rose-500/30 transition-all"
        >
          <Cpu className="w-4 h-4" />
          Run + block main thread
        </button>
      </div>
      <p className="text-xs text-white/40">
        “Block main thread” busy-waits while the springs run. The JavaScript spring freezes; the
        native one keeps moving because the browser animates it off the main thread.
      </p>

      {/* Slow motion */}
      <label className="block text-xs text-white/60">
        Slow motion <code className="font-mono">globalLoop.setTimeScale()</code>{' '}
        <span className="font-mono text-white/80">{timeScale.toFixed(2)}×</span>
        <input
          type="range" min={0} max={1} step={0.01} value={timeScale}
          onChange={(e) => globalLoop.setTimeScale(e.target.valueAsNumber)}
          className="w-full mt-1 accent-amber-400"
          aria-label="Global animation time scale"
          aria-valuetext={`${timeScale.toFixed(2)} times normal speed`}
        />
        <span className="text-white/40">Scales both springs, including running ones. 0 freezes them; reset to 1 when you leave.</span>
      </label>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-4">
        <label className="text-xs text-white/60">
          Duration <span className="font-mono text-white/80">{duration}ms</span>
          <input
            type="range" min={150} max={1500} step={10} value={duration}
            onChange={(e) => setDuration(e.target.valueAsNumber)}
            className="w-full mt-1 accent-emerald-400"
            aria-label="Perceived duration in milliseconds"
          />
        </label>
        <label className="text-xs text-white/60">
          Bounce <span className="font-mono text-white/80">{bounce.toFixed(2)}</span>
          <input
            type="range" min={-0.5} max={0.9} step={0.01} value={bounce}
            onChange={(e) => setBounce(e.target.valueAsNumber)}
            className="w-full mt-1 accent-emerald-400"
            aria-label="Bounce"
          />
        </label>
      </div>

      {/* Curve */}
      <div className="bg-black/20 rounded-xl p-3">
        <div className="flex justify-between text-xs text-white/40 mb-2 font-mono">
          <span>settles in {solver.duration}ms</span>
          <span>overshoot {curve.overshoot.toFixed(1)}%</span>
        </div>
        <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="w-full h-auto" role="img" aria-label="Spring curve">
          <line x1="0" x2={CHART_W} y1={curve.targetY} y2={curve.targetY} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
          <path d={curve.path} fill="none" stroke="rgb(52 211 153)" strokeWidth="2" />
          <line
            x1={scrub * CHART_W} x2={scrub * CHART_W} y1="0" y2={CHART_H}
            stroke="rgba(255,255,255,0.35)"
          />
        </svg>
      </div>

      {/* Scrub */}
      <div>
        <p className="text-xs text-white/50 mb-1.5">Seek with solveSpring().at(ms)</p>
        <div className="relative h-12 bg-white/5 rounded-xl overflow-hidden mb-2">
          <div ref={scrubBoxRef} className="absolute left-1 top-1 w-10 h-10 rounded-lg bg-gradient-to-br from-violet-400 to-fuchsia-500" />
        </div>
        <input
          type="range" min={0} max={1} step={0.001} value={scrub}
          onChange={(e) => setScrub(e.target.valueAsNumber)}
          className="w-full accent-violet-400"
          aria-label="Scrub spring time"
        />
      </div>

      {/* CSS output */}
      <div className="relative bg-black/30 rounded-xl p-3 pr-10">
        <p className="text-xs text-white/40 mb-1">Generated CSS ({compiled.easing.length} chars)</p>
        <code className="block text-[11px] text-emerald-200/80 font-mono break-all max-h-24 overflow-auto">{css}</code>
        <button
          onClick={copy}
          className="absolute top-2 right-2 p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-white/60"
          aria-label="Copy CSS"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

export default function NativeSpringsDemoPage() {
  return (
    <DemoPageLayout
      title="Native Springs"
      description="Real spring physics compiled to CSS linear() and played by the browser's compositor. Stays smooth when the main thread is busy, and every spring is exactly seekable."
      category="Core Features"
      categoryPath="/examples"
      code={CODE}
    >
      <NativeSpringsDemo />
    </DemoPageLayout>
  )
}
