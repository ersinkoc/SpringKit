import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createTimeline } from '../../../src/animation/timeline'

// ---------------------------------------------------------------------------
// Manual RAF queue: frames are stepped deterministically with timestamps
// ---------------------------------------------------------------------------
let rafQueue: Map<number, FrameRequestCallback>
let rafNextId: number
let clock: number

function installManualRaf() {
  rafQueue = new Map()
  rafNextId = 1
  clock = 1000
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    const id = rafNextId++
    rafQueue.set(id, cb)
    return id
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    rafQueue.delete(id)
  })
  vi.spyOn(performance, 'now').mockImplementation(() => clock)
}

function frame(ms = 1000 / 60) {
  clock += ms
  const cbs = Array.from(rafQueue.values())
  rafQueue.clear()
  cbs.forEach((cb) => cb(clock))
}

function frames(count: number, ms = 1000 / 60) {
  for (let i = 0; i < count; i++) frame(ms)
}

describe('Timeline regressions', () => {
  beforeEach(installManualRaf)
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('fires call() callbacks even when no frame lands on the exact millisecond', () => {
    const cb = vi.fn()
    const tl = createTimeline().to({}, { duration: 1 }).call(cb, 0.27)
    tl.play()
    frames(70) // > 1s at 60fps
    expect(cb).toHaveBeenCalledTimes(1)
    tl.kill()
  })

  it('fires a call() callback placed at time 0 exactly once', () => {
    const cb = vi.fn()
    const tl = createTimeline().call(cb, 0).to({}, { duration: 0.2 })
    tl.play()
    frames(20)
    expect(cb).toHaveBeenCalledTimes(1)
    tl.kill()
  })

  it('pauses at addPause() positions, including pauses without a callback', () => {
    const pauseCb = vi.fn()
    const tl = createTimeline()
      .to({}, { duration: 1 })
      .addPause(0.3)
      .addPause(0.6, pauseCb)
    tl.play()
    frames(30)
    expect(tl.isPlaying()).toBe(false)
    expect(tl.time()).toBeCloseTo(0.3, 5)

    tl.resume()
    frames(30)
    expect(pauseCb).toHaveBeenCalledTimes(1)
    expect(tl.time()).toBeCloseTo(0.6, 5)

    tl.resume()
    frames(40)
    expect(tl.progress()).toBe(1)
    tl.kill()
  })

  it('fires onComplete for segments that are not the last one', () => {
    const first = vi.fn()
    const second = vi.fn()
    const tl = createTimeline()
      .to({}, { duration: 0.3, onComplete: first })
      .to({}, { duration: 0.3, onComplete: second })
    tl.play()
    frames(60)
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
    tl.kill()
  })

  it('starts and completes a short segment that a single frame jumps over', () => {
    const onStart = vi.fn()
    const onComplete = vi.fn()
    const tl = createTimeline()
      .to({}, { duration: 0.1 })
      .to({}, { duration: 0.005, onStart, onComplete })
      .to({}, { duration: 0.2 })
    tl.play()
    frames(30, 20)
    expect(onStart).toHaveBeenCalledTimes(1)
    expect(onComplete).toHaveBeenCalledTimes(1)
    tl.kill()
  })

  it('calling play() twice does not run two tick chains', () => {
    const onUpdate = vi.fn()
    const tl = createTimeline({ onUpdate }).to({}, { duration: 1 })
    tl.play()
    tl.play()
    frames(10)
    // Exactly one timeline update per frame
    expect(onUpdate).toHaveBeenCalledTimes(10)
    expect(rafQueue.size).toBe(1)
    tl.kill()
  })

  it('replays segments after seeking backwards', () => {
    const onStart = vi.fn()
    const tl = createTimeline().to({}, { duration: 0.2 }).to({}, { duration: 0.2, onStart })
    tl.play()
    frames(15) // ~0.25s, second segment started
    expect(onStart).toHaveBeenCalledTimes(1)
    tl.seek(0)
    frames(20)
    expect(onStart).toHaveBeenCalledTimes(2)
    tl.kill()
  })

  it('repeats correctly when playing reversed without yoyo', () => {
    const onRepeat = vi.fn()
    const onComplete = vi.fn()
    const tl = createTimeline({ repeat: 1, onRepeat, onComplete }).to({}, { duration: 0.5 })
    tl.seek(0.5)
    tl.reverse()
    tl.play()
    frames(10) // ~0.15s
    expect(onRepeat).toHaveBeenCalledTimes(0)
    frames(30) // first pass finished, repeat starts from the end again
    expect(onRepeat).toHaveBeenCalledTimes(1)
    expect(onComplete).not.toHaveBeenCalled()
    expect(tl.time()).toBeGreaterThan(0.2)
    tl.kill()
  })

  it('reads an element opacity of 0 as 0 (not 1)', () => {
    const el = document.createElement('div')
    el.style.opacity = '0'
    document.body.appendChild(el)
    const tl = createTimeline().to(el, { opacity: 1, duration: 0.5 })
    tl.play()
    frame()
    frame()
    // Animating from 0 toward 1: must not snap up to 1 on the first frames
    expect(parseFloat(el.style.opacity || '0')).toBeLessThan(0.9)
    tl.kill()
    el.remove()
  })
})

// ---------------------------------------------------------------------------
// animate()
// ---------------------------------------------------------------------------
import { animate } from '../../../src/animation/animate'
import { globalLoop, type Animatable } from '../../../src/animation/loop'

function resetLoop() {
  const internal = globalLoop as unknown as { animations: Set<unknown> }
  for (const entry of Array.from(internal.animations)) {
    const anim = (entry as { deref?: () => Animatable | undefined }).deref?.() ?? (entry as Animatable)
    globalLoop.remove(anim)
  }
}

const flushMicrotasks = async () => {
  for (let i = 0; i < 10; i++) await Promise.resolve()
}

async function runUntil(cond: () => boolean, maxFrames = 2000) {
  for (let i = 0; i < maxFrames && !cond(); i++) {
    frame()
    await flushMicrotasks()
  }
}

describe('animate() regressions', () => {
  let el: HTMLElement
  beforeEach(() => {
    installManualRaf()
    el = document.createElement('div')
    document.body.appendChild(el)
  })
  afterEach(() => {
    resetLoop()
    el.remove()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('starts an opacity animation from 0 when the element opacity is 0', () => {
    el.style.opacity = '0'
    const values: number[] = []
    const controls = animate(el, { opacity: 1 }, { onUpdate: (v) => values.push(v.opacity!) })
    frame()
    frame()
    expect(values[0]).toBeLessThan(0.5)
    controls.stop()
  })

  it('resolves finished for an empty target', async () => {
    const controls = animate(el, {})
    let done = false
    controls.finished.then(() => {
      done = true
    })
    await flushMicrotasks()
    expect(done).toBe(true)
  })

  it('does not reset other transform properties set by a previous animate()', async () => {
    const first = animate(el, { x: 100 }, { stiffness: 300, damping: 30 })
    let firstDone = false
    first.finished.then(() => { firstDone = true })
    await runUntil(() => firstDone)
    expect(el.style.transform).toContain('100px')

    const second = animate(el, { scale: 2 }, { stiffness: 300, damping: 30 })
    frame()
    // x translation must be kept while scale animates
    expect(el.style.transform).toContain('translate3d(100px')
    second.stop()
  })

  it('continues a transform property from its last animated value', async () => {
    const first = animate(el, { x: 100 }, { stiffness: 300, damping: 30 })
    let firstDone = false
    first.finished.then(() => { firstDone = true })
    await runUntil(() => firstDone)

    const xs: number[] = []
    const second = animate(el, { x: 200 }, { stiffness: 300, damping: 30, onUpdate: (v) => xs.push(v.x!) })
    frame()
    frame()
    // Must not jump back to 0
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(100)
    second.stop()
  })

  it('pause() halts the animation and resume() finishes it with the final value applied', async () => {
    const controls = animate(el, { opacity: 0.2 }, { stiffness: 170, damping: 26 })
    let done = false
    controls.finished.then(() => { done = true })
    frames(5)
    controls.pause()
    const pausedOpacity = el.style.opacity

    // While paused, nothing should complete
    for (let i = 0; i < 300; i++) {
      frame()
      await flushMicrotasks()
    }
    expect(done).toBe(false)
    expect(el.style.opacity).toBe(pausedOpacity)

    controls.resume()
    await runUntil(() => done)
    expect(done).toBe(true)
    expect(parseFloat(el.style.opacity)).toBeCloseTo(0.2, 2)
  })
})

// ---------------------------------------------------------------------------
// stagger patterns
// ---------------------------------------------------------------------------
import { gridStagger, spiralStagger, staggerPresets } from '../../../src/animation/stagger-patterns'
import { stagger } from '../../../src/animation/sequence'
import type { SpringAnimation } from '../../../src/core/spring'

describe('stagger pattern regressions', () => {
  it('center-origin radial grid stagger is not all zeros', () => {
    const delays = gridStagger({ count: 9, columns: 3, origin: 'center', direction: 'radial', delay: 0.1 })
    expect(delays[4]).toBe(0) // center first
    expect(delays[0]).toBeGreaterThan(0) // corners later
    expect(new Set(delays).size).toBeGreaterThan(1)
    expect(new Set(staggerPresets.gridRadial(9, 3)).size).toBeGreaterThan(1)
  })

  it('radial grid stagger normalises by the farthest cell for any origin', () => {
    // top-right origin: the farthest cell is bottom-left (index 6), not the last index
    const delays = gridStagger({ count: 9, columns: 3, origin: 'top-right', direction: 'radial', delay: 0.1 })
    const max = Math.max(...delays)
    expect(delays[6]).toBe(max)
    // bottom-right (index 8) is closer than bottom-left, so it must be strictly earlier
    expect(delays[8]).toBeLessThan(delays[6]!)
  })

  it('diagonal grid stagger with a single cell does not produce NaN', () => {
    const delays = gridStagger({ count: 1, columns: 1, direction: 'diagonal', delay: 0.1 })
    expect(delays).toEqual([0])
  })

  it('counter-clockwise from center differs from clockwise from edge', () => {
    const cwEdge = spiralStagger({ count: 9, columns: 3, direction: 'clockwise', startFrom: 'edge', delay: 0.1 })
    const ccwCenter = spiralStagger({ count: 9, columns: 3, direction: 'counter-clockwise', startFrom: 'center', delay: 0.1 })
    expect(ccwCenter).not.toEqual(cwEdge)
    // From center: the centre cell goes first
    expect(ccwCenter[4]).toBe(0)
  })

  it('counter-clockwise from edge still starts at the edge', () => {
    const ccw = spiralStagger({ count: 9, columns: 3, direction: 'counter-clockwise', startFrom: 'edge', delay: 0.1 })
    // The centre of a 3x3 spiral is always visited last when starting from the edge
    expect(ccw[4]).toBe(Math.max(...ccw))
    // and a corner goes first
    expect([ccw[0], ccw[2], ccw[6], ccw[8]]).toContain(0)
  })
})

describe('sequence.stagger regressions', () => {
  const fakeAnim = (log: number[], index: number): SpringAnimation => {
    const anim = {
      started: false,
      start() {
        log.push(index)
        return anim as unknown as SpringAnimation
      },
      finished: Promise.resolve(),
    }
    return anim as unknown as SpringAnimation
  }

  it('animates every item when `from` is out of range', async () => {
    const log: number[] = []
    const animateFn = vi.fn((_item: string, i: number) => fakeAnim(log, i))
    await stagger(['a', 'b', 'c'], animateFn, { from: 10 })
    expect(animateFn).toHaveBeenCalledTimes(3)
    expect(log.sort()).toEqual([0, 1, 2])
    expect(animateFn.mock.calls.every(([item]) => item !== undefined)).toBe(true)
  })

  it('does not call animate for an empty list', async () => {
    const animateFn = vi.fn((_item: string, i: number) => fakeAnim([], i))
    await stagger([], animateFn)
    expect(animateFn).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// keyframes()
// ---------------------------------------------------------------------------
import { keyframes } from '../../../src/animation/keyframes'

describe('keyframes() regressions', () => {
  beforeEach(() => {
    installManualRaf()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  })
  afterEach(() => {
    resetLoop()
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  const tick = async (count = 1) => {
    for (let i = 0; i < count; i++) {
      vi.advanceTimersByTime(16)
      frame(16)
      await flushMicrotasks()
    }
  }

  it('stop() actually stops playback and settles play()', async () => {
    const onComplete = vi.fn()
    const onKeyframe = vi.fn()
    const anim = keyframes([0, 100, 200], { config: { stiffness: 170, damping: 26 }, onComplete, onKeyframe })
    let settled = false
    anim.play().then(() => {
      settled = true
    })
    await tick(5)
    anim.stop()
    expect(anim.get()).toBe(0)
    onKeyframe.mockClear()

    await tick(300)
    expect(settled).toBe(true)
    expect(onKeyframe).not.toHaveBeenCalled()
    expect(onComplete).not.toHaveBeenCalled()
    expect(anim.get()).toBe(0)
    expect(anim.getCurrentKeyframe()).toBe(0)
    anim.destroy()
  })

  it('resume() finishes the interrupted keyframe instead of skipping it', async () => {
    const values: number[] = []
    const anim = keyframes([0, 100, 0], {
      config: { stiffness: 170, damping: 26 },
      onUpdate: (v) => values.push(v),
    })
    anim.play()
    await tick(4) // heading toward 100, far from it
    anim.pause()
    expect(anim.get()).toBeLessThan(80)

    values.length = 0
    anim.resume()
    let done = false
    const doneCheck = () => !anim.isPlaying()
    for (let i = 0; i < 600 && !done; i++) {
      await tick()
      done = doneCheck()
    }
    // After resuming, the animation must still visit ~100 before returning to 0
    expect(Math.max(...values)).toBeGreaterThan(95)
    expect(anim.get()).toBe(0)
    anim.destroy()
  })

  it('pause() + immediate resume() does not run two playback loops', async () => {
    const onKeyframe = vi.fn()
    const anim = keyframes([0, 100, 50, 0], { config: { stiffness: 300, damping: 30 }, onKeyframe })
    anim.play()
    await tick(3)
    anim.pause()
    anim.resume()
    for (let i = 0; i < 600 && anim.isPlaying(); i++) await tick()
    // Keyframes 1..3 are each entered exactly once by a single loop
    const indices = onKeyframe.mock.calls.map(([i]) => i).filter((i) => i > 0)
    expect(indices.filter((i) => i === 2)).toHaveLength(1)
    expect(indices.filter((i) => i === 3)).toHaveLength(1)
    anim.destroy()
  })

  it('destroy() settles a pending play() promise', async () => {
    const anim = keyframes([0, 100], { config: { stiffness: 170, damping: 26 } })
    let settled = false
    anim.play().then(() => {
      settled = true
    })
    await tick(2)
    anim.destroy()
    await flushMicrotasks()
    expect(settled).toBe(true)
  })

  it('a per-keyframe config only applies to the transition into that keyframe', async () => {
    const reached: number[] = []
    let frameCount = 0
    const anim = keyframes(
      [0, { value: 100, config: { stiffness: 2000, damping: 90 } }, 0],
      {
        config: { stiffness: 40, damping: 12 },
        onKeyframe: () => reached.push(frameCount),
      }
    )
    anim.play()
    for (let i = 0; i < 2000 && anim.isPlaying(); i++) {
      await tick()
      frameCount++
    }
    // reached = [start(0), entered kf1, entered kf2]
    const fastLeg = reached[2]! - reached[1]!
    const lastLegStart = reached[2]!
    const slowLeg = frameCount - lastLegStart
    // The last leg uses the slow default config, so it must take much longer
    expect(slowLeg).toBeGreaterThan(fastLeg * 2)
    anim.destroy()
  })
})

// ---------------------------------------------------------------------------
// createTrail()
// ---------------------------------------------------------------------------
import { createTrail } from '../../../src/animation/trail'

describe('createTrail() regressions', () => {
  beforeEach(() => {
    installManualRaf()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  })
  afterEach(() => {
    resetLoop()
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  const tick = (count = 1) => {
    for (let i = 0; i < count; i++) {
      vi.advanceTimersByTime(16)
      frame(16)
    }
  }

  it('calls a subscriber once on subscribe, regardless of the number of items', () => {
    const trail = createTrail(4)
    const cb = vi.fn()
    trail.subscribe(cb)
    expect(cb).toHaveBeenCalledTimes(1)
    trail.destroy()
  })

  it('does not multiply notifications when there are several subscribers', () => {
    const countFor = (subscriberCount: number) => {
      const trail = createTrail(3, { stiffness: 300, damping: 30 })
      const spies = Array.from({ length: subscriberCount }, () => vi.fn())
      spies.forEach((spy) => trail.subscribe(spy))
      spies.forEach((spy) => spy.mockClear())
      trail.set(100)
      tick(120)
      const count = spies[0]!.mock.calls.length
      trail.destroy()
      resetLoop()
      return count
    }
    const single = countFor(1)
    expect(single).toBeGreaterThan(0)
    // A second subscriber must not double the first subscriber's notifications
    expect(countFor(2)).toBe(single)
  })

  it('followers start following while the leader is still moving', () => {
    // Slow leader: still far from its target after a few hundred ms
    const trail = createTrail(2, { stiffness: 20, damping: 8, followDelay: 2 })
    trail.set(100)
    tick(15) // ~240ms
    const [first] = trail.getValues()
    expect(first).toBeGreaterThan(0)
    trail.destroy()
  })

  it('jump() is not undone by follower updates scheduled before it', () => {
    const trail = createTrail(3, { stiffness: 300, damping: 30, followDelay: 3 })
    trail.set(100)
    tick(3)
    trail.jump(0)
    tick(200)
    expect(trail.getValues()).toEqual([0, 0, 0])
    trail.destroy()
  })
})
