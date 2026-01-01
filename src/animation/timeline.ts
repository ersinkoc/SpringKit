/**
 * Timeline API - GSAP-inspired animation sequencing with spring physics
 *
 * Create complex, coordinated animations with precise control over
 * timing, sequencing, and playback.
 */

import { createSpringGroup, type SpringGroup } from '../core/spring-group.js'
import type { SpringConfig } from '../core/config.js'
import { clamp } from '../utils/math.js'

// ============ Types ============

/**
 * Animation target - can be element, selector, or values object
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
  /** Easing function (for non-spring animations) */
  ease?: (t: number) => number
  /** Callback when animation starts */
  onStart?: () => void
  /** Callback on each update */
  onUpdate?: (progress: number) => void
  /** Callback when animation completes */
  onComplete?: () => void
}

/**
 * Animation properties - combines values with options
 */
export type TimelineProps = TimelineValues & TimelineOptions

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
  spring: SpringGroup<Record<string, number>> | null
  isActive: boolean
  isComplete: boolean
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
  /** Delay between repeats */
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
  let lastFrameTime = 0
  let hasStarted = false
  let insertTime = 0

  // ============ Utility Functions ============

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
      return lastSegment ? lastSegment.startTime : 0
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
      const labelName = labelMatch[1]
      const offset = labelMatch[2]
      const labelTime = labelName ? (labels.get(labelName) ?? 0) : 0
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
    if (target instanceof HTMLElement) {
      return target
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
    const transforms: string[] = []
    const cssProps: Record<string, string> = {}

    for (const [key, value] of Object.entries(props)) {
      switch (key) {
        case 'x':
          transforms.push(`translateX(${value}px)`)
          break
        case 'y':
          transforms.push(`translateY(${value}px)`)
          break
        case 'z':
          transforms.push(`translateZ(${value}px)`)
          break
        case 'scale':
          transforms.push(`scale(${value})`)
          break
        case 'scaleX':
          transforms.push(`scaleX(${value})`)
          break
        case 'scaleY':
          transforms.push(`scaleY(${value})`)
          break
        case 'rotate':
        case 'rotation':
          transforms.push(`rotate(${value}deg)`)
          break
        case 'rotateX':
          transforms.push(`rotateX(${value}deg)`)
          break
        case 'rotateY':
          transforms.push(`rotateY(${value}deg)`)
          break
        case 'rotateZ':
          transforms.push(`rotateZ(${value}deg)`)
          break
        case 'skewX':
          transforms.push(`skewX(${value}deg)`)
          break
        case 'skewY':
          transforms.push(`skewY(${value}deg)`)
          break
        case 'opacity':
          cssProps.opacity = String(value)
          break
        default:
          // Assume pixels for numeric values
          cssProps[key] = typeof value === 'number' ? `${value}px` : String(value)
      }
    }

    if (transforms.length > 0) {
      element.style.transform = transforms.join(' ')
    }

    for (const [prop, val] of Object.entries(cssProps)) {
      ;(element.style as unknown as Record<string, string>)[prop] = val
    }
  }

  const getCurrentElementValues = (element: HTMLElement, props: Record<string, number>): Record<string, number> => {
    const current: Record<string, number> = {}
    const computed = getComputedStyle(element)

    for (const key of Object.keys(props)) {
      switch (key) {
        case 'opacity':
          current[key] = parseFloat(computed.opacity) || 1
          break
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
          // Parse from transform matrix - simplified, defaults to 0 or 1
          current[key] = key.startsWith('scale') ? 1 : 0
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

  const tick = (timestamp: number) => {
    if (!isPlaying || isPaused) return

    // Clamp delta time to prevent jumps after tab suspension or debugger pauses
    const rawDelta = lastFrameTime ? (timestamp - lastFrameTime) : 0
    const deltaTime = Math.min(rawDelta, MAX_DELTA_TIME) / 1000
    lastFrameTime = timestamp

    // Update time
    currentTime += isReversed ? -deltaTime : deltaTime
    currentTime = clamp(currentTime, 0, totalDuration)

    // Check for callbacks
    const callbacksAtTime = callbacks.get(Math.floor(currentTime * 1000))
    if (callbacksAtTime) {
      callbacksAtTime.forEach(cb => cb())
    }

    // Check for pauses
    const pauseCallback = pauses.get(Math.floor(currentTime * 1000))
    if (pauseCallback !== undefined) {
      isPaused = true
      pauseCallback?.()
      return
    }

    // Update segments
    for (const segment of segments) {
      const segmentProgress = clamp(
        (currentTime - segment.startTime) / (segment.endTime - segment.startTime),
        0,
        1
      )

      const shouldBeActive = currentTime >= segment.startTime && currentTime <= segment.endTime

      if (shouldBeActive && !segment.isActive) {
        segment.isActive = true
        segment.props.onStart?.()
      }

      if (segment.isActive && segment.spring) {
        segment.props.onUpdate?.(segmentProgress)
      }

      if (shouldBeActive && segmentProgress >= 1 && !segment.isComplete) {
        segment.isComplete = true
        segment.props.onComplete?.()
      }
    }

    onUpdate?.(currentTime / totalDuration)

    // Check for completion
    if ((isReversed && currentTime <= 0) || (!isReversed && currentTime >= totalDuration)) {
      if (repeat === -1 || repeatCount < repeat) {
        repeatCount++
        onRepeat?.(repeatCount)

        if (yoyo) {
          isReversed = !isReversed
        } else {
          currentTime = 0
          segments.forEach(s => {
            s.isActive = false
            s.isComplete = false
          })
        }

        if (repeatDelay > 0) {
          setTimeout(() => {
            rafId = requestAnimationFrame(tick)
          }, repeatDelay * 1000)
          return
        }
      } else {
        isPlaying = false
        onComplete?.()
        return
      }
    }

    rafId = requestAnimationFrame(tick)
  }

  // ============ Public API ============

  const timeline: Timeline = {
    to(target, props, position) {
      const startTime = parsePosition(position) + (props.delay || 0)
      const duration = props.duration || 0.5
      const endTime = startTime + duration

      const element = resolveTarget(target)
      const numericProps = extractNumericProps(props)

      const segment: TimelineSegment = {
        id: `segment_${timelineIdCounter++}`,
        target,
        props,
        startTime,
        endTime,
        spring: null,
        isActive: false,
        isComplete: false,
      }

      if (element && Object.keys(numericProps).length > 0) {
        const currentValues = getCurrentElementValues(element, numericProps)
        const springConfig: SpringConfig = { ...defaults, ...props.spring }

        segment.spring = createSpringGroup(currentValues, springConfig)

        segment.spring.subscribe((values: Record<string, number>) => {
          applyPropsToElement(element, values)
        })

        // Set target values when segment becomes active
        const originalOnStart = segment.props.onStart
        segment.props.onStart = () => {
          segment.spring?.set(numericProps)
          originalOnStart?.()
        }
      }

      segments.push(segment)
      insertTime = endTime
      totalDuration = Math.max(totalDuration, endTime)

      return timeline
    },

    from(target, props, position) {
      const startTime = parsePosition(position) + (props.delay || 0)
      const duration = props.duration || 0.5
      const endTime = startTime + duration

      const element = resolveTarget(target)
      const numericProps = extractNumericProps(props)

      const segment: TimelineSegment = {
        id: `segment_${timelineIdCounter++}`,
        target,
        props,
        startTime,
        endTime,
        spring: null,
        isActive: false,
        isComplete: false,
      }

      if (element && Object.keys(numericProps).length > 0) {
        const targetValues = getCurrentElementValues(element, numericProps)
        const springConfig: SpringConfig = { ...defaults, ...props.spring }

        // Start from props, animate to current
        segment.spring = createSpringGroup(numericProps, springConfig)
        applyPropsToElement(element, numericProps)

        segment.spring.subscribe((values: Record<string, number>) => {
          applyPropsToElement(element, values)
        })

        const originalOnStart = segment.props.onStart
        segment.props.onStart = () => {
          segment.spring?.set(targetValues)
          originalOnStart?.()
        }
      }

      segments.push(segment)
      insertTime = endTime
      totalDuration = Math.max(totalDuration, endTime)

      return timeline
    },

    fromTo(target, fromProps, toProps, position) {
      const startTime = parsePosition(position) + (toProps.delay || 0)
      const duration = toProps.duration || 0.5
      const endTime = startTime + duration

      const element = resolveTarget(target)
      const fromNumeric = extractNumericProps(fromProps)
      const toNumeric = extractNumericProps(toProps)

      const segment: TimelineSegment = {
        id: `segment_${timelineIdCounter++}`,
        target,
        props: toProps,
        startTime,
        endTime,
        spring: null,
        isActive: false,
        isComplete: false,
      }

      if (element && Object.keys(toNumeric).length > 0) {
        const springConfig: SpringConfig = { ...defaults, ...toProps.spring }

        segment.spring = createSpringGroup(fromNumeric, springConfig)
        applyPropsToElement(element, fromNumeric)

        segment.spring.subscribe((values: Record<string, number>) => {
          applyPropsToElement(element, values)
        })

        const originalOnStart = segment.props.onStart
        segment.props.onStart = () => {
          segment.spring?.set(toNumeric)
          originalOnStart?.()
        }
      }

      segments.push(segment)
      insertTime = endTime
      totalDuration = Math.max(totalDuration, endTime)

      return timeline
    },

    addLabel(label, position) {
      const time = parsePosition(position)
      labels.set(label, time)
      return timeline
    },

    call(callback, position) {
      const time = Math.floor(parsePosition(position) * 1000)
      if (!callbacks.has(time)) {
        callbacks.set(time, [])
      }
      callbacks.get(time)!.push(callback)
      return timeline
    },

    set(target, props, position) {
      const element = resolveTarget(target)
      if (element) {
        const time = parsePosition(position)
        this.call(() => {
          applyPropsToElement(element, extractNumericProps(props))
        }, time)
      }
      return timeline
    },

    addPause(position, callback) {
      const time = Math.floor(parsePosition(position) * 1000)
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
      lastFrameTime = 0
      rafId = requestAnimationFrame(tick)
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
        lastFrameTime = 0
        rafId = requestAnimationFrame(tick)
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
      return timeline
    },

    kill() {
      isPlaying = false
      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
      segments.forEach(s => s.spring?.destroy())
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
