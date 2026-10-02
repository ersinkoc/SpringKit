/**
 * React hook for Timeline API
 */
import { useRef, useCallback, useMemo, useState } from 'react'
import {
  createTimeline,
  type TimelineConfig,
  type Timeline,
  type TimelineTarget,
  type TimelineProps,
  type TimelinePosition,
} from '@oxog/springkit'
import { useIsomorphicLayoutEffect } from '../utils/ssr.js'

// ============ Types ============

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UseTimelineOptions extends TimelineConfig {}

export interface UseTimelineReturn {
  /** The timeline instance */
  timeline: Timeline | null
  /** Play the timeline */
  play: () => void
  /** Pause the timeline */
  pause: () => void
  /** Resume from paused state */
  resume: () => void
  /** Reverse the timeline */
  reverse: () => void
  /** Restart from beginning */
  restart: () => void
  /**
   * Seek to a time position in seconds, or to a label (same as `Timeline.seek`).
   * Use `seekProgress` to seek by progress (0-1).
   */
  seek: (position: number | string) => void
  /** Seek to a progress (0-1) of the timeline's total duration */
  seekProgress: (progress: number) => void
  /** Add a .to() animation */
  to: (target: TimelineTarget, props: TimelineProps, position?: TimelinePosition) => UseTimelineReturn
  /** Add a .from() animation */
  from: (target: TimelineTarget, props: TimelineProps, position?: TimelinePosition) => UseTimelineReturn
  /** Add a .fromTo() animation */
  fromTo: (target: TimelineTarget, fromProps: TimelineProps, toProps: TimelineProps, position?: TimelinePosition) => UseTimelineReturn
  /** Add a label */
  addLabel: (label: string, position?: TimelinePosition) => UseTimelineReturn
  /** Kill the timeline */
  kill: () => void
  /** Check if playing */
  isPlaying: boolean
  /** Check if paused */
  isPaused: boolean
  /** Current progress (0-1) */
  progress: number
}

/**
 * Create and control a timeline animation
 *
 * @example Basic usage
 * ```tsx
 * function AnimatedSequence() {
 *   const box1 = useRef<HTMLDivElement>(null)
 *   const box2 = useRef<HTMLDivElement>(null)
 *
 *   // Timelines don't autoplay unless `autoplay: true`
 *   const { timeline, play } = useTimeline({
 *     onComplete: () => console.log('Done!'),
 *   })
 *
 *   useEffect(() => {
 *     if (timeline && box1.current && box2.current) {
 *       timeline
 *         .to(box1.current, { x: 100, opacity: 1 })
 *         .to(box2.current, { x: 100, opacity: 1 }, '-=0.2') // positions are in seconds
 *     }
 *   }, [timeline])
 *
 *   return (
 *     <>
 *       <button onClick={play}>Play</button>
 *       <div ref={box1} style={{ opacity: 0 }}>Box 1</div>
 *       <div ref={box2} style={{ opacity: 0 }}>Box 2</div>
 *     </>
 *   )
 * }
 * ```
 *
 * @example With labels
 * ```tsx
 * const { timeline } = useTimeline()
 *
 * timeline
 *   .addLabel('start')
 *   .to(element, { x: 100 })
 *   .addLabel('middle')
 *   .to(element, { y: 100 })
 *   .to(otherElement, { opacity: 1 }, 'start') // Jump back to start label
 * ```
 */
export function useTimeline(
  options: UseTimelineOptions = {}
): UseTimelineReturn {
  const timelineRef = useRef<Timeline | null>(null)
  // Mirror the instance in state so consumers re-render with the created
  // timeline (a ref alone would leave `timeline` null after mount)
  const [timeline, setTimeline] = useState<Timeline | null>(null)
  const optionsRef = useRef(options)
  optionsRef.current = options

  // Create timeline on mount
  useIsomorphicLayoutEffect(() => {
    const instance = createTimeline(optionsRef.current)
    timelineRef.current = instance
    setTimeline(instance)

    return () => {
      instance.kill()
      if (timelineRef.current === instance) {
        timelineRef.current = null
      }
    }
  }, [])

  const play = useCallback(() => {
    timelineRef.current?.play()
  }, [])

  const pause = useCallback(() => {
    timelineRef.current?.pause()
  }, [])

  const resume = useCallback(() => {
    timelineRef.current?.resume()
  }, [])

  const reverse = useCallback(() => {
    timelineRef.current?.reverse()
  }, [])

  const restart = useCallback(() => {
    timelineRef.current?.restart()
  }, [])

  const seek = useCallback((position: number | string) => {
    timelineRef.current?.seek(position)
  }, [])

  const seekProgress = useCallback((progress: number) => {
    const instance = timelineRef.current
    if (!instance || !Number.isFinite(progress)) return
    const clamped = Math.min(1, Math.max(0, progress))
    instance.seek(clamped * instance.duration())
  }, [])

  const kill = useCallback(() => {
    timelineRef.current?.kill()
  }, [])

  // Chainable methods that return the hook result
  const returnValue = useMemo(() => {
    const result: UseTimelineReturn = {
      timeline,
      play,
      pause,
      resume,
      reverse,
      restart,
      seek,
      seekProgress,
      kill,
      get isPlaying() {
        return timelineRef.current?.isPlaying() ?? false
      },
      get isPaused() {
        // Timeline doesn't expose isPaused directly, derive from isPlaying
        return !(timelineRef.current?.isPlaying() ?? false)
      },
      get progress() {
        return timelineRef.current?.progress() ?? 0
      },
      to: (target, props, position) => {
        timelineRef.current?.to(target, props, position)
        return result
      },
      from: (target, props, position) => {
        timelineRef.current?.from(target, props, position)
        return result
      },
      fromTo: (target, fromProps, toProps, position) => {
        timelineRef.current?.fromTo(target, fromProps, toProps, position)
        return result
      },
      addLabel: (label, position) => {
        timelineRef.current?.addLabel(label, position)
        return result
      },
    }
    return result
  }, [timeline, play, pause, resume, reverse, restart, seek, seekProgress, kill])

  return returnValue
}

// ============ useTimelineState ============

export interface UseTimelineStateReturn {
  /** Current progress (0-1) */
  progress: number
  /** Is the timeline playing */
  isPlaying: boolean
  /** Is the timeline paused */
  isPaused: boolean
  /** Is the timeline reversed */
  isReversed: boolean
}

/**
 * Subscribe to timeline state changes
 *
 * @example
 * ```tsx
 * function TimelineProgress({ timeline }: { timeline: Timeline }) {
 *   const { progress, isPlaying } = useTimelineState(timeline)
 *
 *   return (
 *     <div>
 *       <progress value={progress} max={1} />
 *       <span>{isPlaying ? 'Playing' : 'Paused'}</span>
 *     </div>
 *   )
 * }
 * ```
 */
export function useTimelineState(
  timeline: Timeline | null
): UseTimelineStateReturn {
  const [state, setState] = useState<UseTimelineStateReturn>({
    progress: 0,
    isPlaying: false,
    isPaused: true,
    isReversed: false,
  })

  useIsomorphicLayoutEffect(() => {
    if (!timeline) return

    // Only re-render when something actually changed
    const updateState = () => {
      const isPlaying = timeline.isPlaying()
      const next: UseTimelineStateReturn = {
        progress: timeline.progress(),
        isPlaying,
        isPaused: !isPlaying,
        isReversed: timeline.isReversed(),
      }
      setState((prev) =>
        prev.progress === next.progress &&
        prev.isPlaying === next.isPlaying &&
        prev.isPaused === next.isPaused &&
        prev.isReversed === next.isReversed
          ? prev
          : next
      )
    }

    // Update initially
    updateState()

    // Use a ref to store the latest rafId to ensure proper cleanup
    // This fixes the memory leak where intermediate RAF callbacks weren't cancelled
    let currentRafId: number | null = null
    let isActive = true

    const tick = () => {
      if (!isActive) return
      updateState()
      currentRafId = requestAnimationFrame(tick)
    }
    currentRafId = requestAnimationFrame(tick)

    return () => {
      isActive = false
      if (currentRafId !== null) {
        cancelAnimationFrame(currentRafId)
        currentRafId = null
      }
    }
  }, [timeline])

  return state
}
