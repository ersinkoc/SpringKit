import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, RotateCcw, Grid3X3, Sparkles, Pause } from 'lucide-react'
import {
  animate,
  linearStagger,
  reverseStagger,
  centerStagger,
  edgeStagger,
  waveStagger,
  gridStagger,
  spiralStagger,
  randomStagger,
} from '@oxog/springkit'
import { DemoPageLayout } from './DemoPageLayout'

const CODE = `import { useRef } from 'react'
import {
  animate,
  linearStagger,
  centerStagger,
  waveStagger,
  gridStagger,
  spiralStagger,
  randomStagger,
} from '@oxog/springkit'

// Available stagger patterns
const patterns = {
  linear: (count: number) => linearStagger({ count, delay: 0.05 }),
  reverse: (count: number) => reverseStagger({ count, delay: 0.05 }),
  center: (count: number) => centerStagger({ count, delay: 0.08 }),
  edge: (count: number) => edgeStagger({ count, delay: 0.08 }),
  wave: (count: number) => waveStagger({ count, delay: 0.1, frequency: 1.5 }),
  random: (count: number) => randomStagger({ count, delay: 0.05 }),
}

// For grid layout
const gridPattern = (cols: number, rows: number) =>
  gridStagger({ count, columns: cols, origin: 'top-left', delay: 0.06 })

const spiralPattern = (cols: number, rows: number) =>
  spiralStagger({ count, columns: cols, direction: 'clockwise', delay: 0.04 })

function StaggerDemo() {
  const [pattern, setPattern] = useState('linear')
  const itemRefs = useRef<HTMLDivElement[]>([])

  const runStagger = () => {
    const items = itemRefs.current.filter(Boolean)
    const count = items.length

    // Get delays based on pattern
    const delays = patterns[pattern](count)

    // Reset all items
    items.forEach((item) => {
      item.style.transform = 'scale(0.3)'
      item.style.opacity = '0'
    })

    // Animate with stagger
    items.forEach((item, i) => {
      setTimeout(() => {
        animate(item, { scale: 1, opacity: 1 }, {
          stiffness: 300,
          damping: 15,
        })
      }, delays[i] * 1000)
    })
  }

  return (
    <div>
      {/* Items Grid */}
      <div className="flex flex-wrap gap-2 mb-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            ref={(el) => { if (el) itemRefs.current[i] = el }}
            className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-400 to-purple-500"
          />
        ))}
      </div>

      {/* Pattern Selector */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {Object.keys(patterns).map((p) => (
          <button
            key={p}
            onClick={() => setPattern(p)}
            className={\`py-2 rounded-lg text-sm capitalize \${
              pattern === p ? 'bg-violet-500/30 text-violet-300' : 'bg-white/5 text-white/60'
            }\`}
          >
            {p}
          </button>
        ))}
      </div>

      <button onClick={runStagger} className="w-full py-3 bg-violet-500/20 text-violet-400 rounded-lg">
        Run Stagger Animation
      </button>
    </div>
  )
}`

type PatternType = 'linear' | 'reverse' | 'center' | 'edge' | 'wave' | 'random' | 'grid' | 'spiral'

const patternDescriptions: Record<PatternType, string> = {
  linear: 'Items animate in order from first to last',
  reverse: 'Items animate from last to first',
  center: 'Animation starts from the center and expands outward',
  edge: 'Animation starts from edges and moves to center',
  wave: 'Sinusoidal wave pattern for rhythmic effect',
  random: 'Random delays for organic, natural feel',
  grid: 'Grid-aware stagger from corner',
  spiral: 'Spiral pattern from center outward',
}

function StaggerDemo() {
  const [pattern, setPattern] = useState<PatternType>('linear')
  const [isAnimating, setIsAnimating] = useState(false)
  const [isAutoRunning, setIsAutoRunning] = useState(false)
  const [runCount, setRunCount] = useState(0)
  const itemRefs = useRef<HTMLDivElement[]>([])
  const gridRefs = useRef<HTMLDivElement[]>([])
  const autoRunRef = useRef<NodeJS.Timeout | null>(null)

  const isGridPattern = pattern === 'grid' || pattern === 'spiral'
  const cols = 5
  const rows = 4

  const getDelays = (count: number): number[] => {
    switch (pattern) {
      case 'linear':
        return linearStagger({ count, delay: 0.05 })
      case 'reverse':
        return reverseStagger({ count, delay: 0.05 })
      case 'center':
        return centerStagger({ count, delay: 0.08 })
      case 'edge':
        return edgeStagger({ count, delay: 0.08 })
      case 'wave':
        return waveStagger({ count, delay: 0.1, frequency: 1.5 })
      case 'random':
        return randomStagger({ count, delay: 0.06, seed: Date.now() })
      case 'grid':
        return gridStagger({ count, columns: cols, origin: 'top-left', delay: 0.06 })
      case 'spiral':
        return spiralStagger({ count, columns: cols, direction: 'clockwise', delay: 0.04 })
      default:
        return linearStagger({ count, delay: 0.05 })
    }
  }

  const runStagger = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setRunCount(c => c + 1)

    const items = isGridPattern
      ? gridRefs.current.filter(Boolean)
      : itemRefs.current.filter(Boolean)
    const count = items.length
    const delays = getDelays(count)

    // Reset all items
    items.forEach((item) => {
      item.style.transform = 'scale(0.3)'
      item.style.opacity = '0'
    })

    // Animate with stagger
    let maxDelay = 0
    items.forEach((item, i) => {
      const delay = delays[i] * 1000
      if (delay > maxDelay) maxDelay = delay

      setTimeout(() => {
        animate(
          item,
          { scale: 1, opacity: 1 },
          { stiffness: 300, damping: 15 }
        )
      }, delay)
    })

    // Reset animating state after all animations complete
    setTimeout(() => setIsAnimating(false), maxDelay + 500)
  }, [isAnimating, isGridPattern, pattern])

  const reset = () => {
    const items = isGridPattern
      ? gridRefs.current.filter(Boolean)
      : itemRefs.current.filter(Boolean)

    items.forEach((item) => {
      item.style.transform = 'scale(1)'
      item.style.opacity = '1'
    })
    setIsAnimating(false)
  }

  const toggleAutoRun = () => {
    if (isAutoRunning) {
      if (autoRunRef.current) {
        clearInterval(autoRunRef.current)
        autoRunRef.current = null
      }
      setIsAutoRunning(false)
    } else {
      setIsAutoRunning(true)
      runStagger()
      autoRunRef.current = setInterval(() => {
        // Cycle through patterns automatically
        setPattern(current => {
          const patterns = Object.keys(patternDescriptions) as PatternType[]
          const currentIndex = patterns.indexOf(current)
          return patterns[(currentIndex + 1) % patterns.length]
        })
        setTimeout(runStagger, 100)
      }, 2000)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoRunRef.current) {
        clearInterval(autoRunRef.current)
      }
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault()
        if (!isAnimating) runStagger()
      } else if (e.key === 'r' || e.key === 'R') {
        reset()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isAnimating, runStagger])

  return (
    <div className="space-y-6">
      {/* Demo area - Linear patterns */}
      {!isGridPattern && (
        <div className="bg-black/30 rounded-xl p-6">
          <div className="flex flex-wrap justify-center gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                ref={(el) => {
                  if (el) itemRefs.current[i] = el
                }}
                className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 shadow-lg shadow-purple-500/30 flex items-center justify-center"
              >
                <span className="text-white/80 font-medium text-sm">{i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Demo area - Grid patterns */}
      {isGridPattern && (
        <div className="bg-black/30 rounded-xl p-6">
          <div
            className="grid gap-2 justify-center"
            style={{ gridTemplateColumns: `repeat(${cols}, 2.5rem)` }}
          >
            {Array.from({ length: cols * rows }).map((_, i) => (
              <div
                key={i}
                ref={(el) => {
                  if (el) gridRefs.current[i] = el
                }}
                className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-400 to-purple-500 shadow-lg shadow-purple-500/30"
              />
            ))}
          </div>
        </div>
      )}

      {/* Pattern description */}
      <div className="flex items-start gap-3 p-4 bg-violet-500/10 rounded-xl border border-violet-500/20">
        <Sparkles className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-violet-300 font-medium capitalize">{pattern} Stagger</p>
            <div className="flex items-center gap-3 text-xs text-white/40">
              <span>Runs: <span className="text-white/60 font-medium">{runCount}</span></span>
              {isAutoRunning && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                  Auto
                </span>
              )}
            </div>
          </div>
          <p className="text-white/60 text-sm">{patternDescriptions[pattern]}</p>
        </div>
      </div>

      {/* Pattern selector */}
      <div>
        <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Select Pattern</p>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(patternDescriptions) as PatternType[]).map((p) => (
            <button
              key={p}
              onClick={() => setPattern(p)}
              className={`py-2.5 rounded-lg text-xs capitalize transition-all ${
                pattern === p
                  ? 'bg-violet-500/30 text-violet-300 ring-1 ring-violet-500/50 shadow-lg shadow-violet-500/20'
                  : 'bg-white/5 hover:bg-white/10 text-white/60'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button
          onClick={toggleAutoRun}
          className={`px-4 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
            isAutoRunning
              ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:shadow-lg hover:shadow-rose-500/30'
              : 'bg-white/5 hover:bg-white/10 text-white/60'
          }`}
        >
          {isAutoRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <button
          onClick={runStagger}
          disabled={isAnimating || isAutoRunning}
          className="flex-1 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-lg hover:shadow-purple-500/30 transition-all"
        >
          <Play className="w-4 h-4" />
          {isAnimating ? 'Animating...' : 'Run Stagger'}
        </button>
        <button
          onClick={reset}
          className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="flex justify-center gap-4 text-xs text-white/30">
        <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/50">Space</kbd> Run</span>
        <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/50">R</kbd> Reset</span>
      </div>
    </div>
  )
}

export default function StaggerPatternsDemoPage() {
  return (
    <DemoPageLayout
      title="Stagger Patterns"
      description="Orchestrate animations with various stagger patterns. Create sequential, center-out, wave, grid, and spiral animation effects."
      category="Animation"
      categoryPath="/examples"
      code={CODE}
    >
      <StaggerDemo />
    </DemoPageLayout>
  )
}
