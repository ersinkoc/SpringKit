/**
 * React hook for Timeline API
 */
import { useRef, useCallback, useMemo } from 'react'
import {
  createTimeline,
  type TimelineConfig,
  type Timeline,
  type TimelineTarget,
  type TimelineProps,
  type TimelinePosition,
} from '../../../index.js'
import { useIsomorphicLayoutEffect } from '../utils/ssr.js'

// ============ Types ============

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
  /** Seek to a specific progress (0-1) or time */
  seek: (progress: number) => void
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
 *   const { timeline, play } = useTimeline({
 *     paused: true,
 *     onComplete: () => console.log('Done!'),
 *   })
 *
 *   useEffect(() => {
 *     if (timeline && box1.current && box2.current) {
 *       timeline
 *         .to(box1.current, { x: 100, opacity: 1 })
 *         .to(box2.current, { x: 100, opacity: 1 }, '-=200')
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

  // Create timeline on mount
  useIsomorphicLayoutEffect(() => {
    const timeline = createTimeline(options)
    timelineRef.current = timeline

    return () => {
      timeline.kill()
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

  const seek = useCallback((progress: number) => {
    timelineRef.current?.seek(progress)
  }, [])

  const kill = useCallback(() => {
    timelineRef.current?.kill()
  }, [])

  // Chainable methods that return the hook result
  const returnValue = useMemo(() => {
    const result: UseTimelineReturn = {
      timeline: timelineRef.current,
      play,
      pause,
      resume,
      reverse,
      restart,
      seek,
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
  }, [play, pause, resume, reverse, restart, seek, kill])

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
  const progressRef = useRef(0)
  const isPlayingRef = useRef(false)
  const isPausedRef = useRef(true)
  const isReversedRef = useRef(false)

  useIsomorphicLayoutEffect(() => {
    if (!timeline) return

    const updateState = () => {
      progressRef.current = timeline.progress()
      isPlayingRef.current = timeline.isPlaying()
      isPausedRef.current = !timeline.isPlaying()
      isReversedRef.current = timeline.isReversed()
    }

    // Update initially
    updateState()

    // Update on animation frame while timeline exists
    let rafId: number | null = null
    const tick = () => {
      updateState()
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [timeline])

  return {
    get progress() {
      return progressRef.current
    },
    get isPlaying() {
      return isPlayingRef.current
    },
    get isPaused() {
      return isPausedRef.current
    },
    get isReversed() {
      return isReversedRef.current
    },
  }
}
