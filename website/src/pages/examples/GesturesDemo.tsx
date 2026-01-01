import { useState } from 'react'
import { MousePointer2, Hand, Target } from 'lucide-react'
import { useDrag, useHover, useTap } from '@oxog/springkit/react'
import { DemoPageLayout } from './DemoPageLayout'

const CODE = `import { useState } from 'react'
import { useDrag, useHover, useTap } from '@oxog/springkit/react'

// useDrag - Draggable elements with spring physics
function DragDemo() {
  const [{ x, y }, api] = useDrag({
    bounds: { left: -100, right: 100, top: -50, bottom: 50 },
    rubberBand: true,
    stiffness: 200,
    damping: 20,
  })

  return (
    <div
      ref={api.ref}
      style={{ transform: \`translate(\${x}px, \${y}px)\` }}
      className={api.isDragging ? 'cursor-grabbing' : 'cursor-grab'}
    >
      Drag me!
    </div>
  )
}

// useHover - Hover state tracking
function HoverDemo() {
  const { isHovered, handlers } = useHover()

  return (
    <div
      {...handlers}
      style={{
        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
        background: isHovered ? '#3b82f6' : '#1e293b',
      }}
    >
      Hover over me
    </div>
  )
}

// useTap - Press/tap state tracking
function TapDemo() {
  const { isPressed, handlers } = useTap()

  return (
    <button
      {...handlers}
      style={{
        transform: isPressed ? 'scale(0.95)' : 'scale(1)',
      }}
    >
      {isPressed ? 'Pressing...' : 'Tap me'}
    </button>
  )
}`

function DragSection() {
  const [{ x, y }, api] = useDrag({
    bounds: { left: -120, right: 120, top: -60, bottom: 60 },
    rubberBand: true,
    stiffness: 200,
    damping: 20,
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Hand className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="font-medium text-white">useDrag</h3>
          <p className="text-xs text-white/40">Draggable with bounds & rubber band</p>
        </div>
      </div>

      <div className="bg-black/30 rounded-xl h-40 relative overflow-hidden flex items-center justify-center">
        {/* Bounds indicator */}
        <div className="absolute inset-4 border border-dashed border-white/10 rounded-xl" />

        {/* Draggable element */}
        <div
          ref={api.ref}
          className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg shadow-blue-500/40 flex items-center justify-center text-white font-medium text-sm transition-shadow ${
            api.isDragging
              ? 'cursor-grabbing shadow-xl shadow-blue-500/60'
              : 'cursor-grab'
          }`}
          style={{
            transform: `translate(${x}px, ${y}px)`,
          }}
        >
          {api.isDragging ? 'Dragging' : 'Drag me'}
        </div>
      </div>

      <div className="flex justify-center gap-4 text-xs text-white/40">
        <span>X: {x.toFixed(0)}</span>
        <span>Y: {y.toFixed(0)}</span>
      </div>
    </div>
  )
}

function HoverSection() {
  const [hoverCount, setHoverCount] = useState(0)
  const { isHovered, handlers } = useHover()

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-500/20 rounded-lg">
          <MousePointer2 className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="font-medium text-white">useHover</h3>
          <p className="text-xs text-white/40">Smooth hover state tracking</p>
        </div>
      </div>

      <div className="bg-black/30 rounded-xl h-40 flex items-center justify-center">
        <div className="flex gap-4">
          {/* Card 1 */}
          <div
            {...handlers}
            onMouseEnter={(e) => {
              handlers.onMouseEnter?.()
              setHoverCount((c) => c + 1)
            }}
            className="w-28 h-28 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg flex flex-col items-center justify-center text-white transition-all duration-300 cursor-pointer"
            style={{
              transform: isHovered ? 'scale(1.1) translateY(-8px)' : 'scale(1)',
              boxShadow: isHovered
                ? '0 25px 50px -12px rgba(16, 185, 129, 0.5)'
                : '0 10px 15px -3px rgba(16, 185, 129, 0.3)',
            }}
          >
            <span className="text-2xl font-bold">{hoverCount}</span>
            <span className="text-xs opacity-80">Hovers</span>
          </div>

          {/* Card 2 - static for comparison */}
          <div className="w-28 h-28 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 text-xs text-center px-2">
            Static card for comparison
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-white/40">
        Hover over the green card to see the effect
      </p>
    </div>
  )
}

function TapSection() {
  const [tapCount, setTapCount] = useState(0)
  const [lastAction, setLastAction] = useState<string>('')
  const { isPressed, handlers } = useTap()

  const handleClick = () => {
    setTapCount((c) => c + 1)
    setLastAction('Tap!')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-violet-500/20 rounded-lg">
          <Target className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h3 className="font-medium text-white">useTap</h3>
          <p className="text-xs text-white/40">Tap & press detection</p>
        </div>
      </div>

      <div className="bg-black/30 rounded-xl h-40 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <button
            {...handlers}
            onClick={handleClick}
            className="px-8 py-4 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-600 shadow-lg shadow-purple-500/40 text-white font-medium transition-all"
            style={{
              transform: isPressed ? 'scale(0.92)' : 'scale(1)',
              boxShadow: isPressed
                ? '0 5px 15px -3px rgba(139, 92, 246, 0.3)'
                : '0 25px 50px -12px rgba(139, 92, 246, 0.4)',
            }}
          >
            {isPressed ? 'Pressing...' : 'Tap or Hold'}
          </button>

          <div className="flex items-center gap-4 text-sm">
            <span className="text-white/60">
              Taps: <span className="text-violet-400 font-medium">{tapCount}</span>
            </span>
            {lastAction && (
              <span className="px-2 py-1 bg-violet-500/20 text-violet-300 rounded-lg text-xs">
                {lastAction}
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-white/40">
        Click or tap the button
      </p>
    </div>
  )
}

function GesturesDemo() {
  return (
    <div className="space-y-8">
      <DragSection />
      <div className="h-px bg-white/10" />
      <HoverSection />
      <div className="h-px bg-white/10" />
      <TapSection />
    </div>
  )
}

export default function GesturesDemoPage() {
  return (
    <DemoPageLayout
      title="Gesture Hooks"
      description="React hooks for handling user gestures with spring physics. Drag, hover, and tap interactions with smooth animations."
      category="Gestures"
      categoryPath="/examples"
      code={CODE}
    >
      <GesturesDemo />
    </DemoPageLayout>
  )
}
