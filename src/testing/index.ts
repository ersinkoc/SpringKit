/**
 * Deterministic time control for testing SpringKit animations.
 *
 * `installTestClock()` replaces `requestAnimationFrame`,
 * `cancelAnimationFrame` and `performance.now` (and optionally the timer
 * functions) with a virtual timeline that only moves when you advance it.
 * Every SpringKit module — and your own code — then runs frame-perfect and
 * instantly, regardless of real time or the machine's speed.
 *
 * @example
 * import { installTestClock } from '@oxog/springkit/testing'
 *
 * const clock = installTestClock()
 * spring(0, 100, { onUpdate: (v) => (x = v) }).start()
 * clock.advance(100)   // exactly 6 frames at 60fps
 * clock.runAll()       // until every animation has settled
 * clock.uninstall()
 */

export interface TestClockOptions {
  /** Simulated display refresh rate in Hz (default 60) */
  frameRate?: number
  /**
   * Also virtualize `setTimeout`, `clearTimeout`, `setInterval` and
   * `clearInterval` (default false). Enable this for code that mixes
   * timers with animation frames (stagger delays, sequences).
   */
  timers?: boolean
  /**
   * Virtual time (ms) to start at. Defaults to the real `performance.now()`
   * so timestamps captured before installation stay in the past.
   */
  startTime?: number
}

export interface TestClock {
  /** Current virtual time in milliseconds */
  now(): number
  /** Advance virtual time, running every frame and timer that falls due */
  advance(ms: number): void
  /** Advance to the next animation frame and run it */
  nextFrame(): void
  /**
   * Advance until no frames or timers are pending, i.e. every animation has
   * settled. Throws if that takes longer than `limitMs` of virtual time
   * (default 30s), which usually means an animation never comes to rest.
   * @returns the virtual time that elapsed
   */
  runAll(limitMs?: number): number
  /** Number of animation frame callbacks waiting for the next frame */
  readonly pendingFrames: number
  /** Number of pending virtual timers (always 0 when `timers` is off) */
  readonly pendingTimers: number
  /** Restore the real clock functions */
  uninstall(): void
}

interface Timer {
  id: number
  due: number
  callback: (...args: unknown[]) => void
  args: unknown[]
  interval: number | null
}

type Global = typeof globalThis & Record<string, unknown>

/**
 * First virtual frame / timer id. Code often cancels the last id it got in
 * cleanup, possibly after uninstall(), with the real cancelAnimationFrame /
 * clearTimeout. Real ids count up from small numbers, so virtual ids live at
 * the top of the 32-bit range, where real ones never get to: no stale virtual
 * id can cancel an unrelated real callback. (Kept below 2^32 because WebIDL
 * truncates handles to 32 bits; as a signed `long` (clearTimeout) these are
 * negative, which real timer ids never are.)
 */
const VIRTUAL_ID_BASE = 0xf000_0000

let active: TestClock | null = null

/**
 * Install a virtual clock. Only one can be active at a time; installing a
 * second one throws so tests can't silently interfere with each other.
 */
export function installTestClock(options: TestClockOptions = {}): TestClock {
  if (active) {
    throw new Error(
      '[SpringKit] A test clock is already installed. Call uninstall() first.'
    )
  }

  const frameRate =
    options.frameRate !== undefined && options.frameRate > 0 ? options.frameRate : 60
  const frameDuration = 1000 / frameRate
  const g = globalThis as Global
  const perf = (typeof performance !== 'undefined' ? performance : undefined) as
    | (Performance & Record<string, unknown>)
    | undefined

  // Start from the real current time so code that captured a timestamp just
  // before installation still sees time moving forward.
  let time =
    options.startTime !== undefined && Number.isFinite(options.startTime)
      ? options.startTime
      : perf
        ? perf.now()
        : 0
  // Frame times are computed as origin + n * frameDuration (never by repeated
  // addition) so they don't drift: 6 frames at 60fps land exactly on 100ms.
  const origin = time
  let frameIndex = 1
  const frameTime = (index: number) => origin + index * frameDuration
  let nextFrameTime = frameTime(frameIndex)
  /** Tolerance for comparing times, absorbs floating-point rounding */
  const EPSILON = 1e-6

  let frameCallbacks = new Map<number, FrameRequestCallback>()
  let nextFrameId = VIRTUAL_ID_BASE
  const timers = new Map<number, Timer>()
  let nextTimerId = VIRTUAL_ID_BASE

  const fakes: Record<string, unknown> = {
    requestAnimationFrame: (callback: FrameRequestCallback): number => {
      const id = nextFrameId++
      frameCallbacks.set(id, callback)
      return id
    },
    cancelAnimationFrame: (id: number): void => {
      frameCallbacks.delete(id)
    },
  }

  if (options.timers) {
    const schedule = (
      callback: unknown,
      delay: unknown,
      args: unknown[],
      repeat: boolean
    ): number => {
      const id = nextTimerId++
      const ms = Math.max(0, Number(delay) || 0)
      if (typeof callback === 'function') {
        timers.set(id, {
          id,
          due: time + ms,
          callback: callback as (...a: unknown[]) => void,
          args,
          // Browsers clamp intervals; never schedule a zero-length interval
          interval: repeat ? Math.max(1, ms) : null,
        })
      }
      return id
    }
    const clear = (id: unknown): void => {
      timers.delete(Number(id))
    }
    fakes.setTimeout = (cb: unknown, delay?: unknown, ...args: unknown[]) =>
      schedule(cb, delay, args, false)
    fakes.setInterval = (cb: unknown, delay?: unknown, ...args: unknown[]) =>
      schedule(cb, delay, args, true)
    fakes.clearTimeout = clear
    fakes.clearInterval = clear
  }

  // Patch globals, remembering whether each was an own property so that
  // uninstall restores the exact previous state.
  const restores: Array<() => void> = []
  const patch = (target: Record<string, unknown>, key: string, value: unknown) => {
    const hadOwn = Object.prototype.hasOwnProperty.call(target, key)
    const previous = Object.getOwnPropertyDescriptor(target, key)
    Object.defineProperty(target, key, {
      configurable: true,
      writable: true,
      value,
    })
    restores.push(() => {
      if (hadOwn && previous) Object.defineProperty(target, key, previous)
      else delete target[key]
    })
  }

  for (const [key, value] of Object.entries(fakes)) {
    patch(g, key, value)
    // jsdom/happy-dom expose a separate window object in some setups
    const win = g.window as unknown as Record<string, unknown> | undefined
    if (win && win !== g) patch(win, key, value)
  }
  if (perf) patch(perf, 'now', () => time)

  const runFrame = () => {
    time = Math.max(time, nextFrameTime)
    nextFrameTime = frameTime(++frameIndex)
    // Callbacks requested during this frame run in the next one
    const callbacks = frameCallbacks
    frameCallbacks = new Map()
    for (const callback of callbacks.values()) {
      try {
        callback(time)
      } catch (error) {
        console.error('[SpringKit] Error in animation frame callback:', error)
      }
    }
  }

  const nextTimer = (): Timer | undefined => {
    let earliest: Timer | undefined
    for (const timer of timers.values()) {
      if (!earliest || timer.due < earliest.due) earliest = timer
    }
    return earliest
  }

  const runTimer = (timer: Timer) => {
    time = Math.max(time, timer.due)
    // Never let the next frame fall behind the current time
    while (nextFrameTime < time - EPSILON) nextFrameTime = frameTime(++frameIndex)
    if (timer.interval === null) timers.delete(timer.id)
    else timer.due += timer.interval
    try {
      timer.callback(...timer.args)
    } catch (error) {
      console.error('[SpringKit] Error in timer callback:', error)
    }
  }

  /** Run the next event (frame or timer) due at or before `limit` */
  const step = (limit: number): boolean => {
    const timer = nextTimer()
    const frameDue = frameCallbacks.size > 0 ? nextFrameTime : Infinity
    const timerDue = timer ? timer.due : Infinity
    if (Math.min(frameDue, timerDue) > limit + EPSILON) return false
    if (timer && timerDue < frameDue) runTimer(timer)
    else runFrame()
    return true
  }

  const ensureActive = () => {
    if (active !== clock) {
      throw new Error('[SpringKit] This test clock has been uninstalled.')
    }
  }

  const clock: TestClock = {
    now: () => time,

    advance(ms: number) {
      ensureActive()
      const target = time + Math.max(0, ms)
      while (step(target)) {
        // keep running events in time order
      }
      time = Math.max(time, target)
      // Keep frames aligned to the refresh rate even when idle
      while (nextFrameTime <= time + EPSILON) nextFrameTime = frameTime(++frameIndex)
    },

    nextFrame() {
      ensureActive()
      // Timers due before the frame fire first, then the frame itself
      for (let timer = nextTimer(); timer && timer.due < nextFrameTime; timer = nextTimer()) {
        runTimer(timer)
      }
      runFrame()
    },

    runAll(limitMs = 30_000) {
      ensureActive()
      const start = time
      const limit = start + limitMs
      while (frameCallbacks.size > 0 || timers.size > 0) {
        const hasOnlyIntervals =
          frameCallbacks.size === 0 &&
          [...timers.values()].every((timer) => timer.interval !== null)
        if (hasOnlyIntervals) break
        if (!step(limit)) {
          throw new Error(
            `[SpringKit] runAll(): animations still running after ${limitMs}ms of ` +
              'virtual time. A spring with zero damping never settles.'
          )
        }
      }
      return time - start
    },

    get pendingFrames() {
      return frameCallbacks.size
    },

    get pendingTimers() {
      return timers.size
    },

    uninstall() {
      if (active !== clock) return
      for (let i = restores.length - 1; i >= 0; i--) restores[i]!()
      active = null

      // Hand pending work over to the real clock. Dropping it would leave
      // anything waiting on a frame (e.g. the global animation loop, which
      // considers itself running) frozen forever.
      const pendingFrames = [...frameCallbacks.values()]
      const pendingTimeouts = [...timers.values()].filter((t) => t.interval === null)
      frameCallbacks.clear()
      timers.clear()
      if (typeof g.requestAnimationFrame === 'function') {
        for (const callback of pendingFrames) g.requestAnimationFrame(callback)
      }
      if (typeof g.setTimeout === 'function') {
        for (const timer of pendingTimeouts) {
          g.setTimeout(timer.callback, Math.max(0, timer.due - time), ...timer.args)
        }
      }
      // Virtual intervals are dropped: their ids can't be cleared with the
      // real clearInterval, so re-creating them would leak.
    },
  }

  active = clock
  return clock
}
