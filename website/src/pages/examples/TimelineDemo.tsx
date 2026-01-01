import { useState, useRef, useEffect } from 'react'
import { Play, Pause, RotateCcw, Timer, FastForward, Rewind } from 'lucide-react'
import { createTimeline } from '@oxog/springkit'
import { DemoPageLayout } from './DemoPageLayout'

const CODE = `import { useRef, useEffect, useState } from 'react'
import { createTimeline } from '@oxog/springkit'

function TimelineDemo() {
  const box1Ref = useRef<HTMLDivElement>(null)
  const box2Ref = useRef<HTMLDivElement>(null)
  const box3Ref = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<ReturnType<typeof createTimeline> | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!box1Ref.current || !box2Ref.current || !box3Ref.current) return

    // Create a coordinated timeline
    const timeline = createTimeline({
      defaults: { stiffness: 200, damping: 20 },
      onUpdate: (p) => setProgress(p),
    })

    // Add animations at specific positions
    timeline
      .to(box1Ref.current, { x: 200, rotate: 180 }, '0')      // Start at 0s
      .to(box2Ref.current, { x: 200, scale: 1.5 }, '0.2')     // Start at 0.2s
      .to(box3Ref.current, { x: 200, opacity: 0.5 }, '0.4')   // Start at 0.4s
      .to(box1Ref.current, { y: 50 }, '0.5')                  // Additional animation
      .to(box2Ref.current, { y: -50 }, '0.5')

    timelineRef.current = timeline
    return () => timeline.kill()
  }, [])

  const play = () => timelineRef.current?.play()
  const pause = () => timelineRef.current?.pause()
  const reverse = () => timelineRef.current?.reverse()
  const reset = () => timelineRef.current?.seek(0)

  return (
    <div>
      {/* Animated boxes */}
      <div className="flex flex-col gap-4 mb-6">
        <div ref={box1Ref} className="w-16 h-16 rounded-xl bg-cyan-500" />
        <div ref={box2Ref} className="w-16 h-16 rounded-xl bg-violet-500" />
        <div ref={box3Ref} className="w-16 h-16 rounded-xl bg-rose-500" />
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-white/10 rounded-full mb-4">
        <div
          className="h-full bg-cyan-500 rounded-full transition-all"
          style={{ width: \`\${progress * 100}%\` }}
        />
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button onClick={play}>Play</button>
        <button onClick={pause}>Pause</button>
        <button onClick={reverse}>Reverse</button>
        <button onClick={reset}>Reset</button>
      </div>
    </div>
  )
}`

function TimelineDemo() {
  const box1Ref = useRef<HTMLDivElement>(null)
  const box2Ref = useRef<HTMLDivElement>(null)
  const box3Ref = useRef<HTMLDivElement>(null)
  const circleRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<ReturnType<typeof createTimeline> | null>(null)

  const [progress, setProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    if (!box1Ref.current || !box2Ref.current || !box3Ref.current || !circleRef.current) return

    const timeline = createTimeline({
      defaults: { stiffness: 200, damping: 20 },
      onUpdate: (p) => setProgress(p),
      onPlay: () => setIsPlaying(true),
      onPause: () => setIsPlaying(false),
      onComplete: () => setIsPlaying(false),
    })

    // Build the timeline sequence
    timeline
      // Phase 1: Boxes slide in
      .to(box1Ref.current, { x: 250, rotate: 360 }, '0')
      .to(box2Ref.current, { x: 250, scale: 1.3 }, '0.15')
      .to(box3Ref.current, { x: 250, borderRadius: 50 }, '0.3')

      // Phase 2: Circle appears
      .to(circleRef.current, { scale: 1, opacity: 1 }, '0.5')

      // Phase 3: Boxes move vertically
      .to(box1Ref.current, { y: -30 }, '0.7')
      .to(box2Ref.current, { y: 30 }, '0.7')
      .to(box3Ref.current, { y: 0 }, '0.7')

      // Phase 4: Color shift (using opacity)
      .to(circleRef.current, { rotate: 360 }, '0.9')

    timelineRef.current = timeline
    setDuration(timeline.duration || 2)

    return () => {
      timeline.kill()
    }
  }, [])

  const play = () => timelineRef.current?.play()
  const pause = () => timelineRef.current?.pause()
  const reverse = () => timelineRef.current?.reverse()
  const reset = () => {
    timelineRef.current?.seek(0)
    setIsPlaying(false)
  }

  const seekTo = (value: number) => {
    timelineRef.current?.seek(value)
  }

  return (
    <div className="space-y-6">
      {/* Demo area */}
      <div className="bg-black/30 rounded-xl p-8 min-h-[200px] relative overflow-hidden">
        {/* Boxes */}
        <div className="space-y-3">
          <div
            ref={box1Ref}
            className="w-14 h-14 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 shadow-lg shadow-cyan-500/30"
          />
          <div
            ref={box2Ref}
            className="w-14 h-14 rounded-xl bg-gradient-to-r from-violet-400 to-violet-500 shadow-lg shadow-violet-500/30"
          />
          <div
            ref={box3Ref}
            className="w-14 h-14 rounded-xl bg-gradient-to-r from-rose-400 to-rose-500 shadow-lg shadow-rose-500/30"
          />
        </div>

        {/* Circle */}
        <div
          ref={circleRef}
          className="absolute top-1/2 right-8 -translate-y-1/2 w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/30"
          style={{ opacity: 0, transform: 'scale(0) translateY(-50%)' }}
        />
      </div>

      {/* Timeline visualization */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-white/40">
          <span>0s</span>
          <span>Timeline Progress</span>
          <span>{duration.toFixed(1)}s</span>
        </div>

        {/* Progress bar */}
        <div
          className="relative h-3 bg-white/10 rounded-full cursor-pointer overflow-hidden"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const x = e.clientX - rect.left
            const percent = x / rect.width
            seekTo(percent)
          }}
        >
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 via-violet-500 to-rose-500 rounded-full transition-all duration-100"
            style={{ width: `${progress * 100}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg transition-all duration-100"
            style={{ left: `calc(${progress * 100}% - 8px)` }}
          />
        </div>

        {/* Progress percentage */}
        <div className="text-center text-sm text-white/60">
          {(progress * 100).toFixed(0)}% complete
        </div>
      </div>

      {/* Keyframe markers */}
      <div className="bg-black/20 rounded-xl p-4">
        <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Timeline Events</p>
        <div className="relative h-8">
          <div className="absolute inset-x-0 top-1/2 h-0.5 bg-white/10 rounded-full" />

          {/* Keyframe dots */}
          {[0, 0.15, 0.3, 0.5, 0.7, 0.9].map((time, i) => (
            <div
              key={i}
              className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full transition-all ${
                progress >= time ? 'bg-cyan-400 scale-110' : 'bg-white/30'
              }`}
              style={{ left: `${time * 100}%`, transform: 'translate(-50%, -50%)' }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-white/40">
          <span>Slide</span>
          <span>Scale</span>
          <span>Morph</span>
          <span>Appear</span>
          <span>Move</span>
          <span>Rotate</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={reset}
          className="p-3 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl transition-colors"
        >
          <Rewind className="w-5 h-5" />
        </button>

        {isPlaying ? (
          <button
            onClick={pause}
            className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-violet-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-violet-500/30 transition-all"
          >
            <Pause className="w-5 h-5" />
            Pause
          </button>
        ) : (
          <button
            onClick={play}
            className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-violet-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-violet-500/30 transition-all"
          >
            <Play className="w-5 h-5" />
            Play
          </button>
        )}

        <button
          onClick={reverse}
          className="p-3 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl transition-colors"
        >
          <FastForward className="w-5 h-5 rotate-180" />
        </button>

        <button
          onClick={reset}
          className="p-3 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

export default function TimelineDemoPage() {
  return (
    <DemoPageLayout
      title="Timeline API"
      description="Create complex, coordinated animation sequences with precise timing control. Scrub, play, pause, and reverse your animations."
      category="Animation"
      categoryPath="/examples"
      code={CODE}
    >
      <TimelineDemo />
    </DemoPageLayout>
  )
}
