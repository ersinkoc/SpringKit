import { globalLoop } from '../animation/loop.js'
import {
  springEasing,
  supportsLinearEasing,
  type SpringEasingOptions,
} from './easing.js'

export interface NativeAnimationOptions extends SpringEasingOptions {
  /** Delay before starting, in milliseconds (default 0) */
  delay?: number
  /**
   * Keep the final keyframe applied as inline style once the animation
   * finishes (default true). The WAAPI animation itself is then cancelled so
   * it doesn't hold the element's style hostage.
   */
  persist?: boolean
  /**
   * Jump straight to the end when the user prefers reduced motion
   * (default true).
   */
  respectReducedMotion?: boolean
  /** Called once when the animation finishes (not when cancelled) */
  onComplete?: () => void
}

export interface NativeAnimationControls {
  /** The underlying WAAPI animation, or null when WAAPI is unavailable */
  readonly animation: Animation | null
  /** Duration of the spring in milliseconds */
  readonly duration: number
  /** Resolves when the animation finishes or is cancelled */
  readonly finished: Promise<void>
  play(): void
  pause(): void
  /** Stop and remove the animation's effect */
  cancel(): void
  /** Jump to the end */
  finish(): void
  /** Play backwards from the current point */
  reverse(): void
  /** Jump to `ms` milliseconds into the animation (excluding delay) */
  seek(ms: number): void
}

/** Used where `linear()` is unsupported: a fast ease-out with no overshoot */
const FALLBACK_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)'

/**
 * Animate an element with a spring using the Web Animations API.
 *
 * The spring is compiled to a CSS `linear()` easing ({@link springEasing}),
 * so the browser runs it — on the compositor thread for `transform`,
 * `opacity` and `filter`. Ideal for enter/exit and layout-free motion that
 * must stay smooth under main-thread load.
 *
 * @example
 * await animateNative(card, { transform: ['translateY(40px)', 'none'], opacity: [0, 1] },
 *   { ...defineSpring({ duration: 450, bounce: 0.2 }) }).finished
 */
export function animateNative(
  element: Element,
  keyframes: Keyframe[] | PropertyIndexedKeyframes,
  options: NativeAnimationOptions = {}
): NativeAnimationControls {
  const {
    delay = 0,
    persist = true,
    respectReducedMotion = true,
    onComplete,
    ...springOptions
  } = options

  const compiled = springEasing(springOptions)
  const reduced = respectReducedMotion && prefersReducedMotion()
  const duration = reduced ? 0 : compiled.duration

  const canAnimate =
    typeof (element as Partial<Element>).animate === 'function'

  if (!canAnimate) {
    // No WAAPI (SSR, very old browsers, some test environments): apply the
    // end state immediately so the UI is still correct.
    applyFinalKeyframe(element, keyframes)
    onComplete?.()
    return {
      animation: null,
      duration,
      finished: Promise.resolve(),
      play: noop,
      pause: noop,
      cancel: noop,
      finish: noop,
      reverse: noop,
      seek: noop,
    }
  }

  const animation = element.animate(keyframes, {
    duration,
    delay: reduced ? 0 : Math.max(0, delay),
    easing: supportsLinearEasing() ? compiled.easing : FALLBACK_EASING,
    fill: 'both',
  })

  // Follow the global time scale (slow motion / freeze) while running
  const applyTimeScale = (scale: number) => {
    if (typeof animation.updatePlaybackRate === 'function') {
      animation.updatePlaybackRate(scale)
    } else {
      animation.playbackRate = scale
    }
  }
  if (globalLoop.getTimeScale() !== 1) applyTimeScale(globalLoop.getTimeScale())
  const unsubscribeTimeScale = globalLoop.onTimeScaleChange(applyTimeScale)

  const finished = animation.finished.then(
    () => {
      unsubscribeTimeScale()
      if (persist) {
        try {
          animation.commitStyles()
        } catch {
          // commitStyles throws for detached / non-rendered elements
          applyFinalKeyframe(element, keyframes)
        }
        animation.cancel()
      }
      try {
        onComplete?.()
      } catch (error) {
        console.error('[SpringKit]', error)
      }
    },
    // Rejected with AbortError when cancelled — that's a normal outcome
    () => {
      unsubscribeTimeScale()
    }
  )

  return {
    animation,
    duration,
    finished,
    play: () => animation.play(),
    pause: () => animation.pause(),
    cancel: () => animation.cancel(),
    finish: () => animation.finish(),
    reverse: () => animation.reverse(),
    seek: (ms: number) => {
      animation.currentTime = Math.max(0, delay) + Math.min(Math.max(0, ms), duration)
    },
  }
}

function prefersReducedMotion(): boolean {
  try {
    return (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
  } catch {
    return false
  }
}

function applyFinalKeyframe(
  element: Element,
  keyframes: Keyframe[] | PropertyIndexedKeyframes
): void {
  const style = (element as Partial<HTMLElement>).style
  if (!style) return

  const final: Record<string, unknown> = Array.isArray(keyframes)
    ? { ...(keyframes[keyframes.length - 1] ?? {}) }
    : Object.fromEntries(
        Object.entries(keyframes).map(([key, value]) => [
          key,
          Array.isArray(value) ? value[value.length - 1] : value,
        ])
      )

  for (const [property, value] of Object.entries(final)) {
    if (
      value === undefined ||
      value === null ||
      property === 'offset' ||
      property === 'easing' ||
      property === 'composite'
    ) {
      continue
    }
    if (property.startsWith('--')) {
      style.setProperty(property, String(value))
    } else {
      ;(style as unknown as Record<string, string>)[property] = String(value)
    }
  }
}

function noop(): void {}
