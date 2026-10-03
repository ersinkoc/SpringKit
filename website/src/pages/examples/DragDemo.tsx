import { useCallback, useEffect, useRef, useState } from 'react'
import { Hand, GripVertical, MoveHorizontal, RotateCcw } from 'lucide-react'
import { Animated, useDragControls, type PanInfo } from '@oxog/springkit/react'
import { DemoPageLayout } from './DemoPageLayout'

const CODE = `import { useEffect, useRef } from 'react'
import { Animated, useDragControls, type PanInfo } from '@oxog/springkit/react'

const log = (message: string) => console.log(message)

// 1. Free drag inside a container, with elasticity, momentum,
//    snap-back and a live readout of the gesture
function ConstrainedDrag({ elastic, momentum, snapToOrigin }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const readoutRef = useRef<HTMLParagraphElement>(null)

  const onDrag = (_event: PointerEvent, info: PanInfo) => {
    // info.offset: px since pointerdown, info.velocity: px/s
    readoutRef.current!.textContent =
      \`offset \${info.offset.x.toFixed(0)}, \${info.offset.y.toFixed(0)} px · \` +
      \`velocity \${info.velocity.x.toFixed(0)}, \${info.velocity.y.toFixed(0)} px/s\`
  }

  return (
    <div ref={containerRef} className="relative h-56">
      <Animated.div
        drag                               // both axes (= "both")
        dragConstraints={containerRef}     // stay inside the container
        dragElastic={elastic}              // 0..1 pull past the edges (default 0.5)
        dragMomentum={momentum}            // keep gliding after release (default true)
        dragTransition={{ deceleration: 0.995, bounceStiffness: 300, bounceDamping: 20 }}
        dragSnapToOrigin={snapToOrigin}    // spring back to (0, 0) on release
        whileDrag={{ scale: 1.08 }}
        onDragStart={() => log('onDragStart')}
        onDrag={onDrag}
        onDragEnd={(_e, info) => log(\`onDragEnd · \${Math.round(info.velocity.x)} px/s\`)}
        onDragTransitionEnd={() => log('onDragTransitionEnd')}
        aria-label="Draggable box"
      />
      <p ref={readoutRef} aria-live="off" />
    </div>
  )
}

// 2. Horizontal only, momentum snapped to a 44px grid
function AxisLockedDrag() {
  return (
    <Animated.div
      drag="x"                             // touch-action: pan-y is set for you
      dragConstraints={{ left: 0, right: 176 }}
      dragElastic={0.2}
      dragTransition={{ modifyTarget: (t) => Math.round(t / 44) * 44 }}
      aria-label="Horizontal slider knob"
    />
  )
}

// 3. Only the handle starts a drag
function HandleDrag() {
  const controls = useDragControls()

  // Escape cancels an active drag
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && controls.isDragging()) controls.cancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [controls])

  return (
    <>
      <Animated.div
        drag
        dragControls={controls}
        dragListener={false}               // the card itself ignores pointerdown
        dragConstraints={{ left: -120, right: 120, top: -40, bottom: 40 }}
      >
        <button
          aria-label="Drag handle"
          style={{ touchAction: 'none' }}  // the handle needs it (dragListener is off)
          onPointerDown={(e) => controls.start(e)}
        >
          ⋮⋮
        </button>
        Card content
      </Animated.div>

      {/* Interrupt a release animation */}
      <button onClick={() => controls.cancel()}>controls.cancel()</button>
      <button onClick={() => controls.stop()}>controls.stop()</button>
    </>
  )
}`

type LogEntry = { id: number; text: string }

function useEventLog(max = 4) {
  const [entries, setEntries] = useState<LogEntry[]>([])
  const idRef = useRef(0)
  const log = useCallback((text: string) => {
    idRef.current += 1
    const entry = { id: idRef.current, text }
    setEntries((prev) => [entry, ...prev].slice(0, max))
  }, [max])
  return { entries, log }
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-sky-400"
      />
      <code className="font-mono">{label}</code>
    </label>
  )
}

function SectionHeader({ icon, title, subtitle, color }: { icon: React.ReactNode; title: string; subtitle: string; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
      <div>
        <h3 className="font-medium text-white">{title}</h3>
        <p className="text-xs text-white/40">{subtitle}</p>
      </div>
    </div>
  )
}

function ConstrainedSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const offsetRef = useRef<HTMLSpanElement>(null)
  const velocityRef = useRef<HTMLSpanElement>(null)
  const [elastic, setElastic] = useState(0.5)
  const [momentum, setMomentum] = useState(true)
  const [snapToOrigin, setSnapToOrigin] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const { entries, log } = useEventLog()

  // Written straight to the DOM: no React re-render per pointer move
  const handleDrag = useCallback((_event: PointerEvent, info: PanInfo) => {
    if (offsetRef.current) {
      offsetRef.current.textContent = `${info.offset.x.toFixed(0)}, ${info.offset.y.toFixed(0)} px`
    }
    if (velocityRef.current) {
      velocityRef.current.textContent = `${info.velocity.x.toFixed(0)}, ${info.velocity.y.toFixed(0)} px/s`
    }
  }, [])

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={<Hand className="w-5 h-5 text-sky-400" />}
        title="Constraints, elasticity & momentum"
        subtitle="dragConstraints={containerRef} · whileDrag · onDrag info"
        color="bg-sky-500/20"
      />

      <div
        ref={containerRef}
        className="relative h-56 rounded-xl bg-black/30 border border-dashed border-white/10 overflow-hidden flex items-center justify-center"
      >
        <Animated.div
          key={resetKey}
          drag
          dragConstraints={containerRef}
          dragElastic={elastic}
          dragMomentum={momentum}
          dragTransition={{ deceleration: 0.995, bounceStiffness: 300, bounceDamping: 20 }}
          dragSnapToOrigin={snapToOrigin}
          whileDrag={{ scale: 1.08 }}
          onDragStart={() => log('onDragStart')}
          onDrag={handleDrag}
          onDragEnd={(_e, info) =>
            log(`onDragEnd · v = ${Math.round(info.velocity.x)}, ${Math.round(info.velocity.y)} px/s`)
          }
          onDragTransitionEnd={() => log('onDragTransitionEnd')}
          role="img"
          aria-roledescription="draggable"
          aria-label="Draggable box. Drag with a mouse, pen or finger."
          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 shadow-lg shadow-sky-500/30 cursor-grab active:cursor-grabbing flex items-center justify-center text-white text-sm font-medium select-none"
        >
          Drag me
        </Animated.div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div className="bg-black/20 rounded-lg px-3 py-2">
          <span className="text-white/40 block">info.offset</span>
          <span ref={offsetRef} className="text-sky-200">0, 0 px</span>
        </div>
        <div className="bg-black/20 rounded-lg px-3 py-2">
          <span className="text-white/40 block">info.velocity</span>
          <span ref={velocityRef} className="text-sky-200">0, 0 px/s</span>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 items-start">
        <div className="space-y-2">
          <label className="block text-xs text-white/60">
            <code className="font-mono">dragElastic</code>{' '}
            <span className="font-mono text-white/80">{elastic.toFixed(2)}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={elastic}
              onChange={(e) => setElastic(e.target.valueAsNumber)}
              className="w-full mt-1 accent-sky-400"
              aria-label="Drag elasticity beyond the container"
            />
          </label>
          <Toggle label="dragMomentum" checked={momentum} onChange={setMomentum} />
          <Toggle label="dragSnapToOrigin" checked={snapToOrigin} onChange={setSnapToOrigin} />
          <button
            onClick={() => setResetKey((k) => k + 1)}
            className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-white/5 hover:bg-white/10 text-white/70"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset position
          </button>
        </div>
        <ol className="text-[11px] font-mono text-white/50 space-y-1 min-h-[5.5rem]" aria-label="Drag events">
          {entries.length === 0 && <li className="text-white/30">Drag events appear here</li>}
          {entries.map((entry) => (
            <li key={entry.id} className="truncate">{entry.text}</li>
          ))}
        </ol>
      </div>
    </div>
  )
}

const GRID = 44
const TRACK_STEPS = 4

function AxisSection() {
  const [position, setPosition] = useState(0)
  const [lockAxis, setLockAxis] = useState<string>('—')

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={<MoveHorizontal className="w-5 h-5 text-emerald-400" />}
        title='drag="x" and dragDirectionLock'
        subtitle="Axis lock, box constraints, momentum snapped by modifyTarget"
        color="bg-emerald-500/20"
      />

      <div className="rounded-xl bg-black/30 p-4 space-y-2">
        <div className="relative h-14" style={{ width: GRID * TRACK_STEPS + 56 }}>
          <div className="absolute inset-y-0 left-0 right-0 flex items-center">
            <div className="h-1 w-full rounded bg-white/10" />
          </div>
          {Array.from({ length: TRACK_STEPS + 1 }, (_, i) => (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 w-1 h-3 rounded bg-white/20"
              style={{ left: 26 + i * GRID }}
            />
          ))}
          <Animated.div
            drag="x"
            dragConstraints={{ left: 0, right: GRID * TRACK_STEPS }}
            dragElastic={0.2}
            dragTransition={{ modifyTarget: (t) => Math.round(t / GRID) * GRID }}
            onDrag={(_e, info) => setPosition(Math.round(info.offset.x))}
            whileDrag={{ scale: 1.15 }}
            role="img"
            aria-roledescription="draggable"
            aria-label="Horizontal knob, moves along the x axis only"
            className="absolute top-1 w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/30 cursor-grab active:cursor-grabbing"
            style={{ left: 4 }}
          />
        </div>
        <p className="text-[11px] text-white/40">
          Flick it: momentum comes to rest on a 44px tick (<code>modifyTarget</code> only applies when
          there is release velocity). Pointer <code>info.offset.x</code>:{' '}
          <span className="font-mono text-white/70">{position}px</span>
        </p>
      </div>

      <div className="rounded-xl bg-black/30 p-4 flex items-center gap-4">
        <div className="relative w-36 h-28 rounded-lg border border-dashed border-white/10 flex items-center justify-center">
          <Animated.div
            drag
            dragDirectionLock
            dragSnapToOrigin
            onDirectionLock={(axis) => setLockAxis(axis)}
            onDragEnd={() => setLockAxis('—')}
            role="img"
            aria-roledescription="draggable"
            aria-label="Box that locks to the axis you first move along"
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 cursor-grab active:cursor-grabbing"
          />
        </div>
        <div className="text-xs text-white/50 space-y-1">
          <p><code className="font-mono">dragDirectionLock</code> picks the axis you move first.</p>
          <p>
            onDirectionLock: <span className="font-mono text-amber-200">{lockAxis}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

function HandleSection() {
  const controls = useDragControls()
  const [status, setStatus] = useState('idle')

  // Escape cancels an active drag (the card animates back inside its bounds)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && controls.isDragging()) controls.cancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [controls])

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={<GripVertical className="w-5 h-5 text-fuchsia-400" />}
        title="useDragControls + handle"
        subtitle="dragListener={false}: only the handle starts a drag"
        color="bg-fuchsia-500/20"
      />

      <div className="rounded-xl bg-black/30 h-40 flex items-center justify-center overflow-hidden">
        <Animated.div
          drag
          dragControls={controls}
          dragListener={false}
          dragConstraints={{ left: -120, right: 120, top: -40, bottom: 40 }}
          whileDrag={{ scale: 1.04 }}
          onDragStart={() => setStatus('dragging')}
          onDragEnd={() => setStatus('released')}
          onDragTransitionEnd={() => setStatus('settled')}
          className="w-56 rounded-xl bg-slate-800 border border-white/10 shadow-xl flex items-stretch"
        >
          <button
            type="button"
            aria-label="Drag handle: press and move to drag the card"
            onPointerDown={(e) => controls.start(e)}
            className="px-2 flex items-center rounded-l-xl bg-fuchsia-500/20 text-fuchsia-300 cursor-grab active:cursor-grabbing"
            style={{ touchAction: 'none' }}
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <div className="p-3 text-xs text-white/60 space-y-2">
            <p>Selectable text — pressing here does not drag.</p>
            <p className="font-mono text-fuchsia-200">status: {status}</p>
          </div>
        </Animated.div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => controls.cancel()}
          className="flex-1 py-2 text-xs rounded-lg bg-white/5 hover:bg-white/10 text-white/70 font-mono"
        >
          controls.cancel()
        </button>
        <button
          onClick={() => controls.stop()}
          className="flex-1 py-2 text-xs rounded-lg bg-white/5 hover:bg-white/10 text-white/70 font-mono"
        >
          controls.stop()
        </button>
      </div>
      <p className="text-[11px] text-white/40">
        Fling the card, then press a button while it is still gliding: <code>cancel()</code> animates
        back inside the constraints, <code>stop()</code> settles immediately. Press <kbd>Esc</kbd>{' '}
        during a drag to cancel it.
      </p>
    </div>
  )
}

function DragDemo() {
  return (
    <div className="space-y-10">
      <ConstrainedSection />
      <AxisSection />
      <HandleSection />
    </div>
  )
}

export default function DragDemoPage() {
  return (
    <DemoPageLayout
      title="Drag Gestures"
      description="Make any Animated element draggable with one prop: container constraints, elastic edges, momentum, snap-back, axis locks, drag handles and per-move pointer info."
      category="Gestures"
      categoryPath="/examples"
      code={CODE}
    >
      <DragDemo />
    </DemoPageLayout>
  )
}
