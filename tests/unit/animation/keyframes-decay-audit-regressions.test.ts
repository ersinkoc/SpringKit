/**
 * Regression tests from the evidence audit of keyframes.ts / decay.ts
 * (F1201 non-finite keyframe positions, F1202 throwing keyframes callbacks,
 * F1203 decay start() after destroy()).
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { keyframes, type Keyframe } from '../../../src/animation/keyframes'
import { decay } from '../../../src/animation/decay'
import { installTestClock, type TestClock } from '../../../src/testing/index'

let clock: TestClock | null = null
afterEach(() => {
  clock?.uninstall()
  clock = null
  vi.restoreAllMocks()
})

async function drive(c: TestClock, ms: number) {
  for (let t = 0; t < ms; t += 16) {
    c.advance(16)
    for (let i = 0; i < 10; i++) await Promise.resolve()
  }
}

describe('keyframes: non-finite positions are treated as unspecified (F1201)', () => {
  async function run(values: (number | Keyframe<number>)[], times?: number[], duration = 500) {
    clock = installTestClock()
    let completed = 0
    const visited: number[] = []
    const anim = keyframes(values, {
      times,
      duration,
      config: { stiffness: 400, damping: 40 },
      onKeyframe: (i) => visited.push(i),
      onComplete: () => completed++,
    })
    void anim.play()
    await drive(clock, 5000)
    const result = { completed, visited: visited.join(','), playing: anim.isPlaying(), value: Math.round(anim.get()) }
    anim.destroy()
    clock.uninstall()
    clock = null
    return result
  }
  const done = { completed: 1, visited: '0,1,2', playing: false, value: 50 }

  it('a NaN entry in times no longer hangs the timed schedule', async () => {
    expect(await run([0, 100, 50], [0, NaN, 1])).toEqual(done)
  })

  it('Infinity / -Infinity / object-form at fall back to even distribution or times[i]', async () => {
    expect(await run([0, 100, 50], [0, 0.5, Infinity])).toEqual(done)
    expect(await run([0, 100, 50], [-Infinity, 0.5, 1])).toEqual(done)
    expect(await run([{ value: 0 }, { value: 100, at: NaN }, { value: 50 }])).toEqual(done)
    expect(await run([{ value: 0 }, { value: 100, at: NaN }, { value: 50 }], [0, 0.5, 1])).toEqual(done)
  })

  it('control: finite (including unsorted) times still order the keyframes', async () => {
    expect(await run([0, 100, 50], [0, 0.5, 1])).toEqual(done)
    expect(await run([0, 50, 100], [0, 1, 0.5])).toEqual(done)
  })
})

describe('keyframes: a throwing user callback never wedges playback (F1202)', () => {
  async function run(throwAt: number | null, throwInComplete: boolean) {
    clock = installTestClock()
    let completed = 0
    const visited: number[] = []
    const anim = keyframes([0, 100, 50], {
      config: { stiffness: 400, damping: 40 },
      onKeyframe: (i) => {
        visited.push(i)
        if (i === throwAt) throw new Error('user onKeyframe boom')
      },
      onComplete: () => {
        completed++
        if (throwInComplete) throw new Error('user onComplete boom')
      },
    })
    let rejected = 'no'
    const p = anim.play().catch((e: Error) => { rejected = e.message })
    await drive(clock, 3000)
    await p
    const result = { rejected, playing: anim.isPlaying(), completed, visited: visited.join(','), value: Math.round(anim.get()) }
    anim.destroy()
    clock.uninstall()
    clock = null
    return result
  }
  const done = { rejected: 'no', playing: false, completed: 1, visited: '0,1,2', value: 50 }

  it('onKeyframe that throws mid-run: play() resolves, playback finishes, error is logged', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await run(1, false)).toEqual(done)
    expect(await run(0, false)).toEqual(done)
    expect(err).toHaveBeenCalledTimes(2)
  })

  it('onComplete that throws: play() resolves and isPlaying() is false', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await run(null, true)).toEqual(done)
    expect(err).toHaveBeenCalledTimes(1)
  })

  it('jumpTo() isolates throwing onUpdate/onKeyframe', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const a = keyframes([0, 100], {
      onUpdate: () => { throw new Error('u') },
      onKeyframe: () => { throw new Error('k') },
    })
    expect(() => a.jumpTo(1)).not.toThrow()
    expect(a.getCurrentKeyframe()).toBe(1)
    expect(a.get()).toBe(100)
    a.destroy()
  })

  it('control: healthy callbacks log nothing', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await run(null, false)).toEqual(done)
    expect(err).not.toHaveBeenCalled()
  })
})

describe('decay: start() after destroy() is a no-op (F1203)', () => {
  it('does not re-enter the global loop or move the value', async () => {
    clock = installTestClock()
    const d = decay({ velocity: 1000, from: 5 })
    d.destroy()
    expect(d.start()).toBe(d)
    expect(clock.pendingFrames).toBe(0)
    clock.advance(200)
    expect(d.getValue()).toBe(5)
  })

  it('destroy mid-run then repeated start() keeps the value frozen and finished resolved', async () => {
    clock = installTestClock()
    const onComplete = vi.fn()
    const e = decay({ velocity: 1000, onComplete })
    e.start()
    clock.advance(50)
    e.destroy()
    const atDestroy = e.getValue()
    e.start()
    e.start()
    clock.advance(5000)
    expect(e.getValue()).toBe(atDestroy)
    expect(onComplete).not.toHaveBeenCalled()
    expect(clock.pendingFrames).toBe(0)
    await expect(e.finished).resolves.toBeUndefined()
  })

  it('control: stop() then start() still resumes and completes once', () => {
    clock = installTestClock()
    const onComplete = vi.fn()
    const c = decay({ velocity: 1000, onComplete })
    c.start()
    clock.advance(100)
    c.stop()
    const atStop = c.getValue()
    c.start()
    clock.runAll()
    expect(c.getValue()).toBeGreaterThan(atStop)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})
