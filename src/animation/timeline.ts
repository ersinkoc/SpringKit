/**
 * Timeline API - GSAP-inspired animation sequencing with spring physics
 *
 * Create complex, coordinated animations with precise control over
 * timing, sequencing, and playback.
 */

import type { SpringConfig } from '../core/config.js'
import { springMotion } from '../core/physics.js'
import { clamp } from '../utils/math.js'
import { globalLoop } from './loop.js'

// ============ Types ============

/**
 * Animation target - can be element, selector, or values object. Plain
 * objects have their numeric properties written directly (missing ones start
 * at 0) and fire the segment's `onUpdate` like element targets.
 */
export type TimelineTarget = HTMLElement | string | Record<string, number>

/**
 * Animation values (numeric properties to animate)
 */
export interface TimelineValues {
  [key: string]: number | undefined
}

/**
 * Timeline animation options
 */
export interface TimelineOptions {
  /** Animation duration override (not used with springs, but for timing) */
  duration?: number
  /** Delay before animation starts */
  delay?: number
  /** Spring configuration */
  spring?: SpringConfig
  /**
   * Easing function mapping segment progress (0-1) to animation progress.
   * When omitted, the segment follows its spring's motion curve, compressed
   * to the segment's duration.
   */
  ease?: (t: number) => number
  /** Callback when animation starts */
  onStart?: () => void
  /** Callback whenever the segment's progress (0-1) changes */
  onUpdate?: (progress: number) => void
  /** Callback when animation completes */
  onComplete?: () => void
}

/**
 * Animation properties - numeric values to animate plus the segment options.
 *
 * (Declared as an interface rather than `TimelineValues & TimelineOptions`:
 * in that intersection the numeric index signature also applied to the option
 * keys, so `spring`, `ease`, `onStart`, `onUpdate` and `onComplete` were
 * rejected in object literals.)
 */
export interface TimelineProps extends TimelineOptions {
  [key: string]: number | TimelineOptions[keyof TimelineOptions]
}

/**
 * Position in timeline - can be absolute, relative, or label
 */
export type TimelinePosition = number | string | `+=${number}` | `-=${number}` | `<` | `>`

/**
 * Timeline segment representing a single animation
 */
interface TimelineSegment {
  id: string
  target: TimelineTarget
  props: TimelineProps
  startTime: number
  endTime: number
  /** Reads/writes the target's values (null: nothing to animate) */
  adapter: TargetAdapter | null
  /** Values at progress 0 (captured on first render for `to()`) */
  fromValues: Record<string, number> | null
  /** Values at progress 1 (`from()`: the target's values at definition) */
  toValues: Record<string, number>
  /** Maps segment progress to animation progress (spring-shaped or eased) */
  curve: (progress: number) => number
  /** Progress last rendered (-1: never rendered) */
  lastProgress: number
  isActive: boolean
  isComplete: boolean
}

/** Reads and writes numeric values on a timeline target */
interface TargetAdapter {
  read(keys: string[]): Record<string, number>
  write(values: Record<string, number>): void
}

/**
 * Transform values last applied per element. CSS transforms are a single
 * property: without this, a segment animating `y` would wipe the `x`
 * written by a previous segment, and `to()` could not start transform
 * properties from their current value (the computed matrix isn't parsed).
 */
const elementTransforms = new WeakMap<HTMLElement, Map<string, number>>()

/** Remaining fraction of the distance below which a spring counts as settled */
const SETTLE_THRESHOLD = 1e-3
/** Longest spring motion (s) mapped onto a segment, for undamped springs */
const MAX_SETTLE_TIME = 10

/**
 * Spring-shaped progress curve: the spring's normalized motion from 0 to 1,
 * time-compressed so that it settles exactly at progress 1. A pure function
 * of progress, so segments can be scrubbed, seeked and reversed.
 */
function springCurve(config: SpringConfig): (progress: number) => number {
  const motion = springMotion(config, 1, 0)
  const stiffness = config.stiffness !== undefined && config.stiffness > 0 ? config.stiffness : 100
  const mass = config.mass !== undefined && config.mass > 0 ? config.mass : 1
  const omega = Math.sqrt(stiffness / mass)

  // First time the remaining amplitude (displacement and velocity) is negligible
  const dt = 1 / 240
  let settleTime = MAX_SETTLE_TIME
  for (let t = dt; t < MAX_SETTLE_TIME; t += dt) {
    const state = motion(t)
    if (Math.hypot(state.position, state.velocity / omega) < SETTLE_THRESHOLD) {
      settleTime = t
      break
    }
  }

  return (progress) => {
    if (progress <= 0) return 0
    if (progress >= 1) return 1
    return 1 - motion(progress * settleTime).position
  }
}

/**
 * Timeline configuration
 */
export interface TimelineConfig {
  /** Default spring configuration for all animations */
  defaults?: SpringConfig
  /** Whether to autoplay on creation */
  autoplay?: boolean
  /** Repeat count (-1 = infinite) */
  repeat?: number
  /** Yoyo (reverse on repeat) */
  yoyo?: boolean
  /** Delay between repeats (seconds; follows the time scale) */
  repeatDelay?: number
  /** Callback when timeline starts */
  onStart?: () => void
  /** Callback on each frame */
  onUpdate?: (progress: number) => void
  /** Callback when timeline completes */
  onComplete?: () => void
  /** Callback on repeat */
  onRepeat?: (iteration: number) => void
}

/**
 * Timeline controller interface
 */
export interface Timeline {
  /** Add animation to end of timeline */
  to(target: TimelineTarget, props: TimelineProps, position?: TimelinePosition): Timeline
  /** Add animation from initial values */
  from(target: TimelineTarget, props: TimelineProps, position?: TimelinePosition): Timeline
  /** Add animation from/to values */
  fromTo(target: TimelineTarget, fromProps: TimelineProps, toProps: TimelineProps, position?: TimelinePosition): Timeline
  /** Add a label at current position */
  addLabel(label: string, position?: TimelinePosition): Timeline
  /** Add a callback at position */
  call(callback: () => void, position?: TimelinePosition): Timeline
  /** Set properties instantly (no animation) */
  set(target: TimelineTarget, props: TimelineProps, position?: TimelinePosition): Timeline
  /** Add pause at position */
  addPause(position?: TimelinePosition, callback?: () => void): Timeline

  /** Play timeline */
  play(): Timeline
  /** Pause timeline */
  pause(): Timeline
  /** Resume from pause */
  resume(): Timeline
  /** Reverse timeline */
  reverse(): Timeline
  /** Restart timeline */
  restart(): Timeline
  /** Seek to position */
  seek(position: number | string): Timeline
  /** Kill timeline and cleanup */
  kill(): void

  /** Get current time */
  time(): number
  /** Get total duration */
  duration(): number
  /** Get current progress (0-1) */
  progress(): number
  /** Check if playing */
  isPlaying(): boolean
  /** Check if reversed */
  isReversed(): boolean

  /** Get timeline by ID */
  getById(id: string): TimelineSegment | undefined
}

// ============ Implementation ============

let timelineIdCounter = 0

/**
 * Create a new timeline
 *
 * @example
 * ```ts
 * const tl = createTimeline()
 *   .to(element, { x: 100, opacity: 1 })
 *   .to(element, { y: 50 }, '+=0.2')
 *   .to(element, { scale: 1.2 }, '<')
 *
 * tl.play()
 * ```
 */
export function createTimeline(config: TimelineConfig = {}): Timeline {
  // Unique ID for this timeline instance to prevent segment ID collisions
  const timelineInstanceId = ++timelineIdCounter
  let segmentIdCounter = 0

  const {
    defaults = {},
    autoplay = false,
    repeat = 0,
    yoyo = false,
    repeatDelay = 0,
    onStart,
    onUpdate,
    onComplete,
    onRepeat,
  } = config

  const segments: TimelineSegment[] = []
  const labels = new Map<string, number>()
  const callbacks = new Map<number, (() => void)[]>()
  const pauses = new Map<number, (() => void) | undefined>()

  let currentTime = 0
  let totalDuration = 0
  let isPlaying = false
  let isReversed = false
  let isPaused = false
  let repeatCount = 0
  let rafId: number | null = null
  // Cancels the pending repeat delay (loop-driven: follows the time scale)
  let cancelRepeatDelay: (() => void) | null = null
  // Timestamp of the previous frame (null: next frame starts the clock)
  let lastFrameTime: number | null = null
  let hasStarted = false
  let insertTime = 0
  // When true, callbacks/pauses sitting exactly at the playhead's current
  // position are eligible to fire on the next tick (fresh start, restart,
  // repeat, seek). Otherwise only positions strictly crossed fire.
  let includeStartPosition = true

  // ============ Utility Functions ============

  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

  const parsePosition = (position?: TimelinePosition): number => {
    if (position === undefined) {
      return insertTime
    }

    if (typeof position === 'number') {
      return position
    }

    // Relative to previous animation
    if (position === '<') {
      const lastSegment = segments[segments.length - 1]
      if (!lastSegment) {
        console.warn('[SpringKit] Timeline: "<" position used with no previous segments')
        return 0
      }
      return lastSegment.startTime
    }

    if (position === '>') {
      return insertTime
    }

    // Relative offset
    if (position.startsWith('+=')) {
      return insertTime + parseFloat(position.slice(2))
    }

    if (position.startsWith('-=')) {
      return insertTime - parseFloat(position.slice(2))
    }

    // Label reference
    if (labels.has(position)) {
      return labels.get(position)!
    }

    // Label with offset
    const labelMatch = position.match(/^([a-zA-Z_]\w*)([+-]=?\d*\.?\d+)?$/)
    if (labelMatch) {
      const labelName = labelMatch[1] // First capture group is always defined due to regex structure
      const offset = labelMatch[2] // Second capture group may be undefined
      if (!labelName) {
        console.warn(`[SpringKit] Timeline: Invalid label reference in position "${position}"`)
        return insertTime
      }
      const labelTime = labels.get(labelName) ?? 0
      if (offset) {
        const offsetValue = parseFloat(offset.replace('=', ''))
        return labelTime + offsetValue
      }
      return labelTime
    }

    return insertTime
  }

  const resolveTarget = (target: TimelineTarget): HTMLElement | null => {
    if (typeof target === 'string') {
      return document.querySelector(target)
    }
    if (typeof HTMLElement !== 'undefined' && target instanceof HTMLElement) {
      return target
    }
    return null
  }

  /** Element targets write styles; plain objects get their props assigned */
  const createAdapter = (target: TimelineTarget): TargetAdapter | null => {
    const element = resolveTarget(target)
    if (element) {
      return {
        read: (keys) => getCurrentElementValues(element, keys),
        write: (values) => applyPropsToElement(element, values),
      }
    }
    if (typeof target === 'object' && target !== null && !(typeof Node !== 'undefined' && target instanceof Node)) {
      const object = target as Record<string, unknown>
      return {
        read: (keys) => {
          const current: Record<string, number> = {}
          for (const key of keys) {
            const value = object[key]
            current[key] = typeof value === 'number' && Number.isFinite(value) ? value : 0
          }
          return current
        },
        write: (values) => {
          Object.assign(object, values)
        },
      }
    }
    return null
  }

  const extractNumericProps = (props: TimelineProps): Record<string, number> => {
    const result: Record<string, number> = {}
    for (const [key, value] of Object.entries(props)) {
      if (typeof value === 'number' && !['duration', 'delay'].includes(key)) {
        result[key] = value
      }
    }
    return result
  }

  const applyPropsToElement = (element: HTMLElement, props: Record<string, number>) => {
    const cssProps: Record<string, string> = {}
    let stored = elementTransforms.get(element)
    let transformChanged = false

    for (const [key, value] of Object.entries(props)) {
      if (transformFunction(key, 0) !== null) {
        if (!stored) {
          stored = new Map()
          elementTransforms.set(element, stored)
        }
        stored.set(key, value)
        transformChanged = true
      } else if (key === 'opacity') {
        cssProps.opacity = String(value)
      } else {
        // Assume pixels for numeric values
        cssProps[key] = `${value}px`
      }
    }

    if (transformChanged && stored) {
      const transforms: string[] = []
      stored.forEach((value, key) => {
        const fn = transformFunction(key, value)
        if (fn) transforms.push(fn)
      })
      element.style.transform = transforms.join(' ')
    }

    for (const [prop, val] of Object.entries(cssProps)) {
      ;(element.style as unknown as Record<string, string>)[prop] = val
    }
  }

  /** CSS transform function for a transform property, or null if it isn't one */
  const transformFunction = (key: string, value: number): string | null => {
    switch (key) {
      case 'x':
        return `translateX(${value}px)`
      case 'y':
        return `translateY(${value}px)`
      case 'z':
        return `translateZ(${value}px)`
      case 'scale':
        return `scale(${value})`
      case 'scaleX':
        return `scaleX(${value})`
      case 'scaleY':
        return `scaleY(${value})`
      case 'rotate':
      case 'rotation':
        return `rotate(${value}deg)`
      case 'rotateX':
        return `rotateX(${value}deg)`
      case 'rotateY':
        return `rotateY(${value}deg)`
      case 'rotateZ':
        return `rotateZ(${value}deg)`
      case 'skewX':
        return `skewX(${value}deg)`
      case 'skewY':
        return `skewY(${value}deg)`
      default:
        return null
    }
  }

  const getCurrentElementValues = (element: HTMLElement, keys: string[]): Record<string, number> => {
    const current: Record<string, number> = {}
    const computed = getComputedStyle(element)
    const stored = elementTransforms.get(element)

    for (const key of keys) {
      switch (key) {
        case 'opacity': {
          // Note: `|| 1` would turn a legitimate opacity of 0 into 1
          const opacity = parseFloat(computed.opacity)
          current[key] = Number.isNaN(opacity) ? 1 : opacity
          break
        }
        case 'x':
        case 'y':
        case 'z':
        case 'scale':
        case 'scaleX':
        case 'scaleY':
        case 'rotate':
        case 'rotation':
        case 'rotateX':
        case 'rotateY':
        case 'rotateZ':
        case 'skewX':
        case 'skewY':
          // Prefer the value this timeline module last applied; the computed
          // matrix isn't parsed, so otherwise fall back to the identity
          current[key] = stored?.get(key) ?? (key.startsWith('scale') ? 1 : 0)
          break
        default:
          current[key] = parseFloat(computed.getPropertyValue(key)) || 0
      }
    }

    return current
  }

  // ============ Animation Loop ============

  // Maximum delta time to prevent jumps after tab suspension (64ms = ~15fps minimum)
  const MAX_DELTA_TIME = 64

  /**
   * Schedule the next tick, cancelling any pending one so that there is never
   * more than one RAF chain driving this timeline.
   */
  const scheduleTick = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
    }
    rafId = requestAnimationFrame(tick)
  }

  /**
   * Whether a position (in ms, as stored in callbacks/pauses) was crossed by
   * the playhead moving from prevTime to nextTime (seconds).
   */
  const isCrossed = (positionMs: number, prevTime: number, nextTime: number, includeStart: boolean): boolean => {
    // Rounded to 1ns: a playhead parked on a position (e.g. at a pause, set
    // to positionMs / 1000) must map back to exactly positionMs, which
    // `t * 1000` doesn't always do (1003 / 1000 * 1000 < 1003)
    const prevMs = Math.round(prevTime * 1e6) / 1e3
    const nextMs = Math.round(nextTime * 1e6) / 1e3
    if (nextMs >= prevMs) {
      return (includeStart ? positionMs >= Math.floor(prevMs) : positionMs > prevMs) && positionMs <= nextMs
    }
    return (includeStart ? positionMs <= prevMs : positionMs < Math.floor(prevMs)) && positionMs >= Math.floor(nextMs)
  }

  /** Segment progress (0-1) at a timeline time */
  const segmentProgressAt = (segment: TimelineSegment, time: number): number => {
    // Guard against division by zero
    const segmentDuration = segment.endTime - segment.startTime
    return segmentDuration > 0
      ? clamp((time - segment.startTime) / segmentDuration, 0, 1)
      : time >= segment.endTime ? 1 : 0
  }

  /** Write a segment's values at `progress`; returns whether progress changed */
  const renderSegment = (segment: TimelineSegment, progress: number, force: boolean): boolean => {
    const changed = progress !== segment.lastProgress
    if (!changed && !force) return false
    segment.lastProgress = progress
    const { adapter } = segment
    const keys = Object.keys(segment.toValues)
    if (adapter && keys.length > 0) {
      // `to()` starts from whatever the target holds when first rendered
      const from = segment.fromValues ?? (segment.fromValues = adapter.read(keys))
      const eased = segment.curve(progress)
      const values: Record<string, number> = {}
      for (const key of keys) {
        const start = from[key] ?? 0
        values[key] = start + ((segment.toValues[key] ?? 0) - start) * eased
      }
      adapter.write(values)
    }
    return changed
  }

  /**
   * Render every segment at `time`. Values are a pure function of time, so
   * playing, reversing and seeking all scrub segments the same way. With
   * `events`, fires segment onStart / onUpdate / onComplete.
   */
  const renderAt = (time: number, events: boolean) => {
    // Segments ahead of the playhead that were rendered before (the playhead
    // moved back across them) are restored to their starting values, latest
    // first so that earlier segments' starting values win
    let restored = false
    for (let i = segments.length - 1; i >= 0; i--) {
      const segment = segments[i]!
      if (time < segment.startTime && segment.lastProgress > 0) {
        renderSegment(segment, 0, false)
        restored = true
        if (events) segment.props.onUpdate?.(0)
      }
    }

    // Started segments in insertion order: later segments win on overlap
    for (const segment of segments) {
      if (time < segment.startTime) {
        // Not reached (yet, or anymore): let it start again
        segment.isActive = false
        segment.isComplete = false
        continue
      }
      const progress = segmentProgressAt(segment, time)
      if (progress < 1) segment.isComplete = false

      if (!segment.isActive) {
        segment.isActive = true
        if (events) segment.props.onStart?.()
      }

      const changed = renderSegment(segment, progress, restored)
      if (events && changed) segment.props.onUpdate?.(progress)

      if (progress >= 1 && !segment.isComplete) {
        segment.isComplete = true
        if (events) segment.props.onComplete?.()
      }
    }
  }

  const tick = (timestamp: number) => {
    rafId = null
    if (!isPlaying || isPaused) return

    // Clamp delta time to prevent jumps after tab suspension or debugger
    // pauses, and follow the global time scale (slow motion / freeze)
    const rawDelta = lastFrameTime !== null ? (timestamp - lastFrameTime) : 0
    const deltaTime =
      (Math.min(Math.max(rawDelta, 0), MAX_DELTA_TIME) / 1000) * globalLoop.getTimeScale()
    lastFrameTime = timestamp

    // Update time
    const prevTime = currentTime
    currentTime += isReversed ? -deltaTime : deltaTime
    currentTime = clamp(currentTime, 0, totalDuration)
    const includeStart = includeStartPosition
    includeStartPosition = false

    // Check for pauses (the first one crossed in the playing direction)
    const crossedPauses = Array.from(pauses.keys())
      .filter((ms) => isCrossed(ms, prevTime, currentTime, includeStart))
      .sort((a, b) => (isReversed ? b - a : a - b))
    const pauseMs = crossedPauses[0]
    // The playhead stops at the pause: callbacks beyond it fire after resume
    const reachedTime =
      pauseMs !== undefined ? clamp(pauseMs / 1000, 0, totalDuration) : currentTime

    // Fire callbacks whose position was crossed this frame. (Matching the
    // exact millisecond would skip almost every callback, since frames
    // rarely land on it.)
    const crossedCallbacks = Array.from(callbacks.keys())
      .filter((ms) => isCrossed(ms, prevTime, reachedTime, includeStart))
      .sort((a, b) => (isReversed ? b - a : a - b))
    for (const ms of crossedCallbacks) {
      callbacks.get(ms)?.forEach(cb => {
        try {
          cb()
        } catch (e) {
          console.error('[SpringKit] Timeline callback error:', e)
        }
      })
    }

    if (pauseMs !== undefined) {
      isPaused = true
      // Stop exactly at the pause position
      currentTime = reachedTime
      renderAt(currentTime, true)
      const pauseCallback = pauses.get(pauseMs)
      try {
        pauseCallback?.()
      } catch (e) {
        console.error('[SpringKit] Timeline pause callback error:', e)
      }
      return
    }

    // Update segments. A segment becomes active once the playhead has
    // reached its start and completes once its progress reaches 1, even if
    // a single frame jumped past it.
    renderAt(currentTime, true)

    onUpdate?.(totalDuration > 0 ? currentTime / totalDuration : 1)

    // Check for completion
    if ((isReversed && currentTime <= 0) || (!isReversed && currentTime >= totalDuration)) {
      if (repeat === -1 || repeatCount < repeat) {
        repeatCount++
        onRepeat?.(repeatCount)

        if (yoyo) {
          isReversed = !isReversed
        } else {
          // Restart from the beginning of the playing direction
          currentTime = isReversed ? totalDuration : 0
          includeStartPosition = true
          segments.forEach(s => {
            s.isActive = false
            s.isComplete = false
          })
        }

        if (repeatDelay > 0) {
          cancelRepeatDelay = globalLoop.delay(repeatDelay * 1000, () => {
            cancelRepeatDelay = null
            // The delay itself is not playback time
            lastFrameTime = null
            scheduleTick()
          })
          return
        }
      } else {
        isPlaying = false
        onComplete?.()
        return
      }
    }

    scheduleTick()
  }

  /** Create a segment and add it to the timeline */
  const addSegment = (
    target: TimelineTarget,
    props: TimelineProps,
    position: TimelinePosition | undefined,
    toValues: Record<string, number>,
    fromValues: Record<string, number> | null,
    adapter: TargetAdapter | null
  ) => {
    const startTime = parsePosition(position) + (props.delay || 0)
    const duration = props.duration || 0.5
    const endTime = startTime + duration

    const segment: TimelineSegment = {
      id: `segment_${timelineInstanceId}_${segmentIdCounter++}`,
      target,
      props,
      startTime,
      endTime,
      adapter: Object.keys(toValues).length > 0 ? adapter : null,
      fromValues,
      toValues,
      curve: props.ease ?? springCurve({ ...defaults, ...props.spring }),
      lastProgress: -1,
      isActive: false,
      isComplete: false,
    }

    // from() / fromTo() show their starting values right away
    if (segment.adapter && fromValues) {
      segment.adapter.write(fromValues)
    }

    segments.push(segment)
    insertTime = endTime
    totalDuration = Math.max(totalDuration, endTime)
  }

  // ============ Public API ============

  const timeline: Timeline = {
    to(target, props, position) {
      // Starting values are read from the target when the segment first renders
      addSegment(target, props, position, extractNumericProps(props), null, createAdapter(target))
      return timeline
    },

    from(target, props, position) {
      // Start from props, animate to the target's current values
      const adapter = createAdapter(target)
      const fromValues = extractNumericProps(props)
      const toValues = adapter ? adapter.read(Object.keys(fromValues)) : fromValues
      addSegment(target, props, position, toValues, fromValues, adapter)
      return timeline
    },

    fromTo(target, fromProps, toProps, position) {
      const adapter = createAdapter(target)
      const toValues = extractNumericProps(toProps)
      // Properties missing from fromProps start at the target's current value
      const fromValues = {
        ...(adapter ? adapter.read(Object.keys(toValues)) : toValues),
        ...extractNumericProps(fromProps),
      }
      addSegment(target, toProps, position, toValues, fromValues, adapter)
      return timeline
    },

    addLabel(label, position) {
      const time = parsePosition(position)
      labels.set(label, time)
      return timeline
    },

    call(callback, position) {
      const time = Math.round(parsePosition(position) * 1000)
      if (!callbacks.has(time)) {
        callbacks.set(time, [])
      }
      callbacks.get(time)!.push(callback)
      return timeline
    },

    set(target, props, position) {
      const adapter = createAdapter(target)
      if (adapter) {
        const time = parsePosition(position)
        this.call(() => {
          adapter.write(extractNumericProps(props))
        }, time)
      }
      return timeline
    },

    addPause(position, callback) {
      const time = Math.round(parsePosition(position) * 1000)
      pauses.set(time, callback)
      return timeline
    },

    play() {
      if (!hasStarted) {
        hasStarted = true
        onStart?.()
      }
      isPlaying = true
      isPaused = false
      // Count the time from now to the first frame (a 0 delta would lose it)
      lastFrameTime = now()
      scheduleTick()
      return timeline
    },

    pause() {
      isPaused = true
      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
      return timeline
    },

    resume() {
      if (isPaused) {
        isPaused = false
        lastFrameTime = now()
        scheduleTick()
      }
      return timeline
    },

    reverse() {
      isReversed = !isReversed
      return timeline
    },

    restart() {
      currentTime = isReversed ? totalDuration : 0
      repeatCount = 0
      hasStarted = false
      includeStartPosition = true
      segments.forEach(s => {
        s.isActive = false
        s.isComplete = false
      })
      return this.play()
    },

    seek(position) {
      if (typeof position === 'string') {
        currentTime = labels.get(position) ?? 0
      } else {
        currentTime = clamp(position, 0, totalDuration)
      }
      // Reset segments that lie ahead of the new playhead so they play again
      segments.forEach(s => {
        if (currentTime < s.startTime) {
          s.isActive = false
          s.isComplete = false
        } else if (currentTime < s.endTime) {
          s.isComplete = false
        }
      })
      // Show the values at the new position without firing segment events:
      // onStart / onComplete still fire when playback continues from here
      const flags = segments.map(s => [s.isActive, s.isComplete] as const)
      renderAt(currentTime, false)
      segments.forEach((s, i) => {
        ;[s.isActive, s.isComplete] = flags[i]!
      })
      includeStartPosition = true
      return timeline
    },

    kill() {
      isPlaying = false
      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
      // Cancel the repeat delay to prevent memory leak
      cancelRepeatDelay?.()
      cancelRepeatDelay = null
      segments.length = 0
      labels.clear()
      callbacks.clear()
      pauses.clear()
    },

    time: () => currentTime,
    duration: () => totalDuration,
    progress: () => totalDuration > 0 ? currentTime / totalDuration : 0,
    isPlaying: () => isPlaying && !isPaused,
    isReversed: () => isReversed,

    getById(id) {
      return segments.find(s => s.id === id)
    },
  }

  if (autoplay) {
    timeline.play()
  }

  return timeline
}

/**
 * Create a simple tween (single animation)
 */
export function tween(
  target: TimelineTarget,
  props: TimelineProps
): Timeline {
  return createTimeline().to(target, props).play()
}

/**
 * Create a timeline that animates all targets simultaneously
 */
export function allTo(
  targets: TimelineTarget[],
  props: TimelineProps
): Timeline {
  const tl = createTimeline()
  targets.forEach((target, i) => {
    tl.to(target, props, i === 0 ? 0 : '<')
  })
  return tl.play()
}
