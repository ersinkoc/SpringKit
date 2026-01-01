import { useState, useEffect } from 'react'
import { Play, RotateCcw, Zap, Activity, Waves } from 'lucide-react'
import { useBounce, useElastic, useGravity } from '@oxog/springkit/react'
import { DemoPageLayout } from './DemoPageLayout'

const CODE = `import { useState } from 'react'
import { useBounce, useElastic, useGravity, useMotionValueState } from '@oxog/springkit/react'

// useBounce - Creates bouncy, elastic animations
function BounceDemo() {
  const [active, setActive] = useState(false)

  const { value, bounce } = useBounce({
    bounciness: 0.6,       // How bouncy (0-1)
    stiffness: 300,        // Spring stiffness
  })

  const y = useMotionValueState(value) ?? 0

  const handleBounce = () => {
    setActive(true)
    bounce(100)  // Bounce with initial velocity
    setTimeout(() => setActive(false), 1000)
  }

  return (
    <div onClick={handleBounce}>
      <div style={{ transform: \`translateY(\${y}px)\` }}>
        Bouncy Ball
      </div>
    </div>
  )
}

// useElastic - Creates elastic, stretchy animations
function ElasticDemo() {
  const { value, stretch, release } = useElastic({
    elasticity: 0.8,       // How stretchy (0-1)
    damping: 15,           // How quickly it settles
  })

  const scale = useMotionValueState(value) ?? 1

  return (
    <div
      onMouseDown={() => stretch(0.7)}   // Compress
      onMouseUp={() => release()}         // Spring back
      style={{ transform: \`scale(\${scale})\` }}
    >
      Elastic Button
    </div>
  )
}

// useGravity - Simulates gravitational physics
function GravityDemo() {
  const { value, drop, throw: throwUp } = useGravity({
    gravity: 980,          // Pixels per second squared
    bounce: 0.7,           // Bounce coefficient
    floor: 200,            // Floor position
  })

  const y = useMotionValueState(value) ?? 0

  return (
    <div>
      <div style={{ transform: \`translateY(\${y}px)\` }}>
        Falling Object
      </div>
      <button onClick={() => drop()}>Drop</button>
      <button onClick={() => throwUp(-500)}>Throw Up</button>
    </div>
  )
}`

function BounceSection() {
  const [isBouncing, setIsBouncing] = useState(false)
  const [yPos, setYPos] = useState(0)

  const { value, drop, stop } = useBounce({
    dampening: 0.02,
    gravity: 0.5,
    floor: 140,
    ceiling: 0,
    restitution: 0.7,
  })

  // Subscribe to MotionValue changes directly
  useEffect(() => {
    if (!value) return
    const unsubscribe = value.subscribe((v) => {
      setYPos(v)
    })
    return unsubscribe
  }, [value])

  const handleBounce = () => {
    if (isBouncing) return
    setIsBouncing(true)
    drop(0, 0) // Drop from top
    setTimeout(() => setIsBouncing(false), 2000)
  }

  const reset = () => {
    stop()
    value?.jump(0)
    setYPos(0)
    setIsBouncing(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-500/20 rounded-lg">
          <Zap className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h3 className="font-medium text-white">useBounce</h3>
          <p className="text-xs text-white/40">Elastic bounce physics</p>
        </div>
      </div>

      <div className="bg-black/30 rounded-xl h-48 relative overflow-hidden">
        {/* Floor */}
        <div className="absolute bottom-0 inset-x-0 h-1 bg-orange-500/30" />

        {/* Ball */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 shadow-lg shadow-orange-500/40"
          style={{ top: 20, transform: `translateX(-50%) translateY(${yPos}px)` }}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleBounce}
          disabled={isBouncing}
          className="flex-1 py-2 bg-orange-500/20 text-orange-400 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          <Play className="w-4 h-4 inline mr-2" />
          Bounce
        </button>
        <button
          onClick={reset}
          className="px-4 py-2 bg-white/5 text-white/60 rounded-lg"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function ElasticSection() {
  const [isPressed, setIsPressed] = useState(false)
  const [elasticValue, setElasticValue] = useState(0)

  const { value, stretch, release } = useElastic({
    elasticity: 0.5,
    maxStretch: 100,
  })

  // Subscribe to MotionValue changes directly
  useEffect(() => {
    if (!value) return
    const unsubscribe = value.subscribe((v) => {
      setElasticValue(v)
    })
    return unsubscribe
  }, [value])

  // For elastic, value starts at 0, so we convert to scale
  const scale = 1 + elasticValue / 100 // Convert stretch amount to scale

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-pink-500/20 rounded-lg">
          <Activity className="w-5 h-5 text-pink-400" />
        </div>
        <div>
          <h3 className="font-medium text-white">useElastic</h3>
          <p className="text-xs text-white/40">Stretchy, rubbery feel</p>
        </div>
      </div>

      <div className="bg-black/30 rounded-xl h-48 flex items-center justify-center">
        <button
          onMouseDown={() => {
            setIsPressed(true)
            stretch(-30) // Negative value compresses
          }}
          onMouseUp={() => {
            setIsPressed(false)
            release()
          }}
          onMouseLeave={() => {
            if (isPressed) {
              setIsPressed(false)
              release()
            }
          }}
          className="w-32 h-32 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 shadow-lg shadow-pink-500/40 flex items-center justify-center text-white font-medium cursor-pointer select-none"
          style={{ transform: `scale(${scale})` }}
        >
          {isPressed ? 'Stretched!' : 'Press & Hold'}
        </button>
      </div>

      <p className="text-center text-xs text-white/40">
        Press and hold the button to see elastic effect
      </p>
    </div>
  )
}

function GravitySection() {
  const [isDropping, setIsDropping] = useState(false)
  const [yPos, setYPos] = useState(0)

  const { y, launch, setPosition, stop } = useGravity({
    gravity: { x: 0, y: 0.5 },
    bounds: { left: 0, right: 0, top: 0, bottom: 140 },
    bounciness: 0.65,
  })

  // Subscribe to MotionValue changes directly
  useEffect(() => {
    if (!y) return
    const unsubscribe = y.subscribe((v) => {
      setYPos(v)
    })
    return unsubscribe
  }, [y])

  const handleDrop = () => {
    setIsDropping(true)
    setPosition({ x: 0, y: 0 })
    launch({ x: 0, y: 0 }) // Let gravity do the work
    setTimeout(() => setIsDropping(false), 2000)
  }

  const handleThrow = () => {
    setIsDropping(true)
    setPosition({ x: 0, y: 140 })
    launch({ x: 0, y: -15 }) // Throw upward
    setTimeout(() => setIsDropping(false), 2500)
  }

  const reset = () => {
    stop()
    setPosition({ x: 0, y: 0 })
    setYPos(0)
    setIsDropping(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-cyan-500/20 rounded-lg">
          <Waves className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h3 className="font-medium text-white">useGravity</h3>
          <p className="text-xs text-white/40">Real gravity simulation</p>
        </div>
      </div>

      <div className="bg-black/30 rounded-xl h-48 relative overflow-hidden">
        {/* Floor */}
        <div className="absolute bottom-4 inset-x-4 h-1 bg-cyan-500/30 rounded-full" />

        {/* Ball */}
        <div
          className="absolute left-1/2 w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/40"
          style={{
            top: 16,
            transform: `translateX(-50%) translateY(${yPos}px)`,
          }}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleDrop}
          disabled={isDropping}
          className="flex-1 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          Drop
        </button>
        <button
          onClick={handleThrow}
          disabled={isDropping}
          className="flex-1 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          Throw Up
        </button>
        <button
          onClick={reset}
          className="px-4 py-2 bg-white/5 text-white/60 rounded-lg"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function PhysicsHooksDemo() {
  return (
    <div className="space-y-8">
      <BounceSection />
      <div className="h-px bg-white/10" />
      <ElasticSection />
      <div className="h-px bg-white/10" />
      <GravitySection />
    </div>
  )
}

export default function BounceElasticDemoPage() {
  return (
    <DemoPageLayout
      title="Physics Hooks"
      description="Specialized hooks for common physics-based animations: bouncy balls, elastic buttons, and gravitational effects."
      category="React Hooks"
      categoryPath="/examples"
      code={CODE}
    >
      <PhysicsHooksDemo />
    </DemoPageLayout>
  )
}
