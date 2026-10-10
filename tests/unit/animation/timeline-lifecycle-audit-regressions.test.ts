/**
 * Regression tests from the timeline lifecycle audit (round 2): seek()
 * targets, non-finite timing inputs and repeatDelay vs. playback controls.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { createTimeline, type TimelinePosition, type TimelineProps } from '../../../src/animation/timeline'
import { installTestClock, type TestClock } from '../../../src/testing'

let clock: TestClock | null = null

afterEach(() => {
  clock?.uninstall()
  clock = null
})

describe('seek() always lands inside [0, duration] (F3501)', () => {
  const build = (onComplete?: () => void) =>
    createTimeline({ onComplete })
      .to({ v: 0 }, { v: 1, duration: 1 })
      .addLabel('late', 5)
      .addLabel('early', -2)
      .addLabel('mid', 0.4)

  it('treats NaN like an unknown label instead of poisoning the playhead', () => {
    clock = installTestClock()
    let completed = 0
    const tl = build(() => completed++)
    tl.seek(NaN)
    expect(tl.time()).toBe(0)
    expect(tl.progress()).toBe(0)
    tl.play()
    clock.advance(3000)
    expect(completed).toBe(1)
    expect(tl.isPlaying()).toBe(false)
  })

  it('clamps numeric targets at the boundaries (control)', () => {
    clock = installTestClock()
    const tl = build()
    for (const [target, want] of [
      [0, 0],
      [1, 1],
      [99, 1],
      [-3, 0],
      [Infinity, 1],
      [-Infinity, 0],
      [0.25, 0.25],
    ] as Array<[number, number]>) {
      tl.seek(target)
      expect(tl.time()).toBe(want)
    }
  })

  it('clamps labels that lie outside the timeline, keeps in-range labels', () => {
    clock = installTestClock()
    const tl = build()
    tl.seek('late')
    expect(tl.time()).toBe(1)
    expect(tl.progress()).toBe(1)
    tl.seek('early')
    expect(tl.time()).toBe(0)
    tl.seek('mid')
    expect(tl.time()).toBe(0.4)
    tl.seek('unknown')
    expect(tl.time()).toBe(0)
  })
})

describe('non-finite timing inputs never make a timeline endless (F3502)', () => {
  function run(second: TimelineProps, position?: TimelinePosition) {
    clock = installTestClock()
    let completed = 0
    const tl = createTimeline({ onComplete: () => completed++ })
      .to({ v: 0 }, { v: 1, duration: 1 })
      .to({ w: 0 }, second, position)
    const duration = tl.duration()
    tl.play()
    clock.advance(10000)
    const result = { duration, completed, playing: tl.isPlaying() }
    clock.uninstall()
    clock = null
    return result
  }

  it.each([
    ["position '+=abc'", { w: 1, duration: 1 }, '+=abc' as TimelinePosition | undefined, 2],
    ['position NaN', { w: 1, duration: 1 }, NaN, 2],
    ['position Infinity', { w: 1, duration: 1 }, Infinity, 2],
    ['delay Infinity', { w: 1, duration: 1, delay: Infinity }, undefined, 2],
    ['duration Infinity', { w: 1, duration: Infinity }, undefined, 1.5],
  ])('%s falls back to the end of the timeline / default duration', (_name, props, position, duration) => {
    expect(run(props, position)).toEqual({ duration, completed: 1, playing: false })
  })

  it('finite inputs are unchanged (control)', () => {
    expect(run({ w: 1, duration: 1 }, '+=0.5')).toEqual({ duration: 2.5, completed: 1, playing: false })
    expect(run({ w: 1, duration: 1, delay: 0.5 }).duration).toBe(2.5)
  })
})

describe('repeatDelay vs. pause / resume / play / restart (F3503)', () => {
  function make() {
    clock = installTestClock()
    const events: string[] = []
    const tl = createTimeline({
      repeat: 1,
      repeatDelay: 1,
      onRepeat: () => events.push('R'),
      onComplete: () => events.push('C'),
    }).to({ v: 0 }, { v: 1, duration: 0.1 })
    return { tl, events }
  }

  it('resume() inside the delay does not end it early', () => {
    const { tl, events } = make()
    tl.play()
    clock!.advance(150) // first iteration done, ~1 s delay pending
    tl.pause()
    clock!.advance(100)
    tl.resume()
    clock!.advance(100)
    expect(tl.time()).toBe(0)
    expect(events).toEqual(['R'])
    clock!.advance(1000)
    expect(events).toEqual(['R', 'C'])
    expect(tl.time()).toBeCloseTo(0.1, 6)
  })

  it('play() inside the delay does not end it early', () => {
    const { tl, events } = make()
    tl.play()
    clock!.advance(150)
    tl.play()
    clock!.advance(100)
    expect(tl.time()).toBe(0)
    clock!.advance(1000)
    expect(events).toEqual(['R', 'C'])
  })

  it('a delay that elapsed while paused lets resume() continue at once', () => {
    const { tl, events } = make()
    tl.play()
    clock!.advance(150)
    tl.pause()
    clock!.advance(2000)
    expect(events).toEqual(['R'])
    tl.resume()
    clock!.advance(300)
    expect(events).toEqual(['R', 'C'])
  })

  it('restart() inside the delay cancels it: the stale timer costs the new run no time', () => {
    const run = (repeatDelay: number) => {
      clock = installTestClock()
      const tl = createTimeline({ repeat: 1, repeatDelay }).to({ v: 0 }, { v: 1, duration: 3 })
      tl.play()
      clock.advance(3100)
      tl.restart()
      clock.advance(1900) // a stale delay would fire ~0.9 s into the new run
      const time = tl.time()
      clock.uninstall()
      clock = null
      return time
    }
    expect(run(1)).toBeCloseTo(run(0), 9)
  })

  it('kill() inside the delay leaves nothing scheduled', () => {
    const { tl, events } = make()
    tl.play()
    clock!.advance(150)
    tl.kill()
    tl.resume()
    clock!.advance(3000)
    expect(events).toEqual(['R'])
    expect(clock!.pendingFrames).toBe(0)
  })

  it('without a repeatDelay pause/resume/play still schedule a tick (control)', () => {
    clock = installTestClock()
    const tl = createTimeline({ repeat: 1 }).to({ v: 0 }, { v: 1, duration: 0.5 })
    tl.play()
    clock.advance(100)
    tl.pause()
    expect(clock.pendingFrames).toBe(0)
    tl.resume()
    expect(clock.pendingFrames).toBe(1)
    clock.advance(3000)
    expect(tl.isPlaying()).toBe(false)
  })
})
