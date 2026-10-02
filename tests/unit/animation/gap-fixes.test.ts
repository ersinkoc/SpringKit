import { describe, it, expect, afterEach, vi } from 'vitest'
import { decay } from '../../../src/animation/decay'
import { animate } from '../../../src/animation/animate'
import { createTimeline } from '../../../src/animation/timeline'
import { keyframes } from '../../../src/animation/keyframes'
import { globalLoop } from '../../../src/animation/loop'
import { installTestClock, type TestClock } from '../../../src/testing/index'

let clock: TestClock | null = null
afterEach(() => {
  globalLoop.setTimeScale(1)
  clock?.uninstall()
  clock = null
  document.body.textContent = ''
})

async function isSettled(promise: Promise<unknown>): Promise<boolean> {
  let settled = false
  void promise.then(() => {
    settled = true
  })
  for (let i = 0; i < 10; i++) await Promise.resolve()
  return settled
}

describe('decay().stop()', () => {
  it('resolves finished, and a later start() gets a fresh pending promise', async () => {
    clock = installTestClock()
    const anim = decay({ velocity: 1000 }).start()
    clock.advance(50)
    anim.stop()
    const stopped = anim.finished
    expect(await isSettled(stopped)).toBe(true)

    anim.start()
    expect(anim.finished).not.toBe(stopped)
    expect(await isSettled(anim.finished)).toBe(false)
    clock.runAll()
    expect(anim.getValue()).toBeCloseTo(anim.target, 6)
    expect(await isSettled(anim.finished)).toBe(true)
  })
})

describe('animate() array values', () => {
  it('jumps to the first entry and springs through the rest', async () => {
    clock = installTestClock()
    const el = document.createElement('div')
    document.body.appendChild(el)
    el.style.opacity = '0.3'
    const seen: number[] = []
    const controls = animate(
      el,
      { opacity: [0, 1] },
      // overdamped: moves monotonically from 0 to 1
      { stiffness: 300, damping: 40, onUpdate: (v) => seen.push(v.opacity!) }
    )
    // The starting keyframe is applied immediately
    expect(el.style.opacity).toBe('0')
    clock.runAll()
    expect(await isSettled(controls.finished)).toBe(true)
    expect(el.style.opacity).toBe('1')
    expect(seen[0]).toBe(0)
    for (let i = 1; i < seen.length; i++) {
      expect(seen[i]!).toBeGreaterThanOrEqual(seen[i - 1]!)
    }
  })

  it('a single-entry array is a plain target', () => {
    clock = installTestClock()
    const el = document.createElement('div')
    document.body.appendChild(el)
    el.style.opacity = '0.3'
    animate(el, { opacity: [1] }, { stiffness: 300, damping: 40 })
    expect(el.style.opacity).toBe('0.3')
    clock.runAll()
    expect(el.style.opacity).toBe('1')
  })
})

describe('timeline', () => {
  it('animates object targets and fires segment onUpdate for them', () => {
    clock = installTestClock()
    const obj = { x: 0 }
    const onUpdate = vi.fn()
    createTimeline().to(obj, { x: 100, duration: 0.5, onUpdate }).play()
    clock.advance(250)
    expect(obj.x).toBeGreaterThan(0)
    expect(onUpdate).toHaveBeenCalled()
    const progress = onUpdate.mock.calls[onUpdate.mock.calls.length - 1]![0] as number
    expect(progress).toBeCloseTo(0.5, 6)
    clock.runAll()
    expect(obj.x).toBe(100)
    expect(onUpdate).toHaveBeenLastCalledWith(1)
  })

  it('from() and fromTo() animate object targets', () => {
    clock = installTestClock()
    const a = { y: 10 }
    const b = { z: 0 }
    createTimeline()
      .from(a, { y: 50, duration: 0.2 })
      .fromTo(b, { z: 5 }, { z: 15, duration: 0.2 }, 0)
      .play()
    // from() renders its starting values immediately
    expect(a.y).toBe(50)
    clock.runAll()
    expect(a.y).toBe(10)
    expect(b.z).toBe(15)
  })

  it('reverse() scrubs segments backwards consistently with seek()', () => {
    clock = installTestClock()
    const obj = { x: 0 }
    const tl = createTimeline().to(obj, { x: 100, duration: 1 }).play()
    clock.advance(600)
    const forwardValue = obj.x
    expect(forwardValue).toBeGreaterThan(0)

    tl.reverse()
    clock.advance(300)
    expect(tl.time()).toBeCloseTo(0.3, 6)

    // A second timeline seeked to the same time renders the same value
    const other = { x: 0 }
    createTimeline().to(other, { x: 100, duration: 1 }).seek(tl.time())
    expect(obj.x).toBeCloseTo(other.x, 9)
    expect(obj.x).not.toBeCloseTo(forwardValue, 3)

    clock.runAll()
    expect(tl.time()).toBe(0)
    expect(obj.x).toBe(0)
  })

  it('seek() renders values while paused', () => {
    const obj = { x: 0 }
    const tl = createTimeline().to(obj, { x: 100, duration: 1 })
    tl.seek(1)
    expect(obj.x).toBe(100)
    tl.seek(0)
    expect(obj.x).toBe(0)
  })

  it('sequential element segments keep each other\'s transforms', () => {
    clock = installTestClock()
    const el = document.createElement('div')
    document.body.appendChild(el)
    createTimeline()
      .to(el, { x: 100, duration: 0.2 })
      .to(el, { y: 50, duration: 0.2 })
      .play()
    clock.runAll()
    expect(el.style.transform).toContain('translateX(100px)')
    expect(el.style.transform).toContain('translateY(50px)')
  })

  it('a later to() on the same element starts where the previous one ended', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const tl = createTimeline()
      .to(el, { x: 100, duration: 0.2 })
      .to(el, { x: 200, duration: 0.2 })
    tl.seek(0.2)
    expect(el.style.transform).toBe('translateX(100px)')
    tl.seek(0.2000001)
    const x = parseFloat(/translateX\(([-\d.e]+)px\)/.exec(el.style.transform)![1]!)
    expect(x).toBeGreaterThanOrEqual(99.99)
    expect(x).toBeLessThan(101)
  })

  it('at 0.5x, 200ms of real time equals 100ms at 1x', () => {
    clock = installTestClock()
    globalLoop.setTimeScale(0.5)
    const slow = createTimeline().to({}, { duration: 1 }).play()
    clock.advance(200)
    const slowTime = slow.time()
    slow.kill()
    globalLoop.setTimeScale(1)
    const normal = createTimeline().to({}, { duration: 1 }).play()
    clock.advance(100)
    expect(slowTime).toBeCloseTo(normal.time(), 9)
    expect(slowTime).toBeCloseTo(0.1, 6)
  })

  it('uses the segment ease function when given', () => {
    const obj = { x: 0 }
    const tl = createTimeline().to(obj, { x: 100, duration: 1, ease: (t) => t })
    tl.seek(0.25)
    expect(obj.x).toBeCloseTo(25, 9)
  })
})

/**
 * keyframes() playback is promise-driven: advance the test clock one frame at
 * a time and drain microtasks in between so awaited waits can continue.
 */
async function advanceAsync(ms: number): Promise<void> {
  const end = clock!.now() + ms
  const flush = async () => {
    for (let i = 0; i < 20; i++) await Promise.resolve()
  }
  await flush()
  while (clock!.now() < end - 1e-6) {
    clock!.advance(Math.min(1000 / 60, end - clock!.now()))
    await flush()
  }
}

/** Run until `promise` settles (at most 10s of virtual time) */
async function runUntil(promise: Promise<unknown>): Promise<void> {
  let done = false
  void promise.then(() => {
    done = true
  })
  for (let t = 0; t < 10_000 && !done; t += 1000 / 60) await advanceAsync(1000 / 60)
  expect(done).toBe(true)
}

describe('keyframes() timing', () => {
  it('starts each transition at the time of the keyframe it leaves', async () => {
    clock = installTestClock()
    const t0 = clock.now()
    const starts: Array<[number, number]> = []
    const anim = keyframes([0, 100, 0], {
      times: [0, 0.8, 1],
      duration: 1000,
      config: { stiffness: 1000, damping: 63 },
      onKeyframe: (i) => starts.push([i, clock!.now() - t0]),
    })
    await runUntil(anim.play())
    expect(starts.map(([i]) => i)).toEqual([0, 1, 2])
    expect(starts[1]![1]).toBe(0)
    // Leaves keyframe 1 at 800ms (not when its spring happens to settle)
    expect(starts[2]![1]).toBeGreaterThanOrEqual(800 - 1e-6)
    expect(starts[2]![1]).toBeLessThan(800 + 17)
    expect(anim.get()).toBe(0)
  })

  it('holds the first value until its time', async () => {
    clock = installTestClock()
    const anim = keyframes([0, 100], { times: [0.5, 1], duration: 400 })
    void anim.play()
    await Promise.resolve()
    await advanceAsync(150)
    expect(anim.get()).toBe(0)
    expect(anim.getCurrentKeyframe()).toBe(0)
    await advanceAsync(100)
    expect(anim.getCurrentKeyframe()).toBe(1)
    expect(anim.get()).toBeGreaterThan(0)
    anim.destroy()
  })

  it('per-keyframe `at` works like `times`', async () => {
    clock = installTestClock()
    const t0 = clock.now()
    let leftAt = -1
    const anim = keyframes([{ value: 0 }, { value: 50, at: 0.5 }, { value: 0, at: 1 }], {
      duration: 600,
      config: { stiffness: 1000, damping: 63 },
      onKeyframe: (i) => {
        if (i === 2) leftAt = clock!.now() - t0
      },
    })
    await runUntil(anim.play())
    expect(leftAt).toBeGreaterThanOrEqual(300 - 1e-6)
    expect(leftAt).toBeLessThan(300 + 17)
  })

  it('timed keyframes honor the global time scale', async () => {
    clock = installTestClock()
    globalLoop.setTimeScale(0.5)
    const t0 = clock.now()
    let leftAt = -1
    const anim = keyframes([0, 100, 0], {
      times: [0, 0.5, 1],
      duration: 200,
      onKeyframe: (i) => {
        if (i === 2) leftAt = clock!.now() - t0
      },
    })
    void anim.play()
    await Promise.resolve()
    await advanceAsync(1000)
    anim.destroy()
    expect(leftAt).toBeGreaterThanOrEqual(200 - 1e-6)
    expect(leftAt).toBeLessThan(200 + 17)
  })

  it('pause() and resume() keep the timed schedule (paused time does not count)', async () => {
    clock = installTestClock()
    const t0 = clock.now()
    let leftAt = -1
    const anim = keyframes([0, 100, 0], {
      times: [0, 0.5, 1],
      duration: 400,
      onKeyframe: (i) => {
        if (i === 2) leftAt = clock!.now() - t0
      },
    })
    void anim.play()
    await Promise.resolve()
    await advanceAsync(100)
    anim.pause()
    await advanceAsync(500)
    anim.resume()
    await advanceAsync(1000)
    anim.destroy()
    // 200ms of playback + 500ms paused
    expect(leftAt).toBeGreaterThanOrEqual(700 - 1e-6)
    expect(leftAt).toBeLessThan(700 + 17)
  })
})
