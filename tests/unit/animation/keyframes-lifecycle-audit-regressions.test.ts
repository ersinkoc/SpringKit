/**
 * Regression tests from evidence-audit round 2 of keyframes.ts
 * (F3201 jumpTo() guards, F3202 pause() on an idle/completed animation,
 * F3203 stop()/pause() called from inside onKeyframe).
 */
import { describe, it, expect, afterEach } from 'vitest'
import { keyframes, type KeyframesAnimation } from '../../../src/animation/keyframes'
import { installTestClock, type TestClock } from '../../../src/testing/index'

let clock: TestClock | null = null
afterEach(() => {
  clock?.uninstall()
  clock = null
})

const cfg = { stiffness: 400, damping: 40 }

async function drive(c: TestClock, ms: number) {
  for (let t = 0; t < ms; t += 16) {
    c.advance(16)
    for (let i = 0; i < 10; i++) await Promise.resolve()
  }
}

describe('keyframes.jumpTo(): guards (F3201)', () => {
  it('is inert after destroy(): no state change, no callbacks', () => {
    let updates = 0
    let keyframeCalls = 0
    const anim = keyframes([0, 100], {
      onUpdate: () => updates++,
      onKeyframe: () => keyframeCalls++,
    })
    anim.destroy()
    anim.jumpTo(1)
    anim.jumpTo(0)
    expect({ updates, keyframeCalls, idx: anim.getCurrentKeyframe(), v: anim.get() }).toEqual({
      updates: 0,
      keyframeCalls: 0,
      idx: 0,
      v: 0,
    })
  })

  it('ignores NaN and fractional indices (no index/value corruption, no callbacks)', () => {
    const seen: number[] = []
    const updates: number[] = []
    const anim = keyframes([0, 100, 50], {
      onKeyframe: (i) => seen.push(i),
      onUpdate: (v) => updates.push(v),
    })
    anim.jumpTo(1)
    for (const bad of [NaN, 1.5, 0.1, -0.5, Infinity, -Infinity]) {
      anim.jumpTo(bad)
      expect(anim.getCurrentKeyframe()).toBe(1)
      expect(anim.get()).toBe(100)
    }
    expect(seen).toEqual([1])
    expect(updates).toEqual([100])
    anim.destroy()
  })

  it('control: integer indices (first and last included) still jump', () => {
    const anim = keyframes([0, 100, 50])
    anim.jumpTo(2)
    expect([anim.getCurrentKeyframe(), anim.get()]).toEqual([2, 50])
    anim.jumpTo(0)
    expect([anim.getCurrentKeyframe(), anim.get()]).toEqual([0, 0])
    anim.destroy()
  })
})

describe('keyframes.pause() on an animation that is not playing (F3202)', () => {
  it('never-played pause() + resume() does not replay phantom keyframes', async () => {
    clock = installTestClock()
    const visited: number[] = []
    let completed = 0
    const anim = keyframes([0, 100, 50], {
      config: cfg,
      onKeyframe: (i) => visited.push(i),
      onComplete: () => completed++,
    })
    anim.pause()
    anim.resume()
    await drive(clock, 300)
    expect({ visited, completed, playing: anim.isPlaying(), v: anim.get() }).toEqual({
      visited: [],
      completed: 0,
      playing: false,
      v: 0,
    })
    // a later normal play() still works, exactly once
    void anim.play()
    await drive(clock, 3000)
    expect(completed).toBe(1)
    expect(Math.round(anim.get())).toBe(50)
    anim.destroy()
  })

  it('pause() + resume() after completion does not fire onComplete a second time', async () => {
    clock = installTestClock()
    let completed = 0
    const anim = keyframes([0, 100], { config: cfg, onComplete: () => completed++ })
    void anim.play()
    await drive(clock, 3000)
    expect(completed).toBe(1)
    anim.pause()
    anim.resume()
    await drive(clock, 300)
    expect(completed).toBe(1)
    expect(anim.isPlaying()).toBe(false)
    // replaying is still a legitimate second run
    void anim.play()
    await drive(clock, 3000)
    expect(completed).toBe(2)
    anim.destroy()
  })

  it('pause() after stop() then resume() stays inert', async () => {
    clock = installTestClock()
    let completed = 0
    const anim = keyframes([0, 100], { config: cfg, onComplete: () => completed++ })
    void anim.play()
    await drive(clock, 32)
    anim.stop()
    anim.pause()
    anim.resume()
    await drive(clock, 500)
    expect(completed).toBe(0)
    expect(anim.isPlaying()).toBe(false)
    expect(anim.get()).toBe(0)
    anim.destroy()
  })

  it('control: pause/resume of a playing animation still completes exactly once', async () => {
    clock = installTestClock()
    let completed = 0
    const anim = keyframes([0, 100, 50], { config: cfg, onComplete: () => completed++ })
    void anim.play()
    await drive(clock, 48)
    anim.pause()
    anim.pause()
    expect(anim.isPlaying()).toBe(false)
    await drive(clock, 500)
    expect(completed).toBe(0)
    anim.resume()
    await drive(clock, 4000)
    expect(completed).toBe(1)
    expect(Math.round(anim.get())).toBe(50)
    anim.destroy()
  })
})

describe('keyframes: stop()/pause()/destroy() from inside onKeyframe (F3203)', () => {
  it('stop() inside onKeyframe leaves the animation at rest (no spring started afterwards)', async () => {
    clock = installTestClock()
    const values: number[] = []
    const anim: KeyframesAnimation = keyframes([0, 100, 50], {
      config: cfg,
      onUpdate: (v) => values.push(v),
      onKeyframe: (i) => {
        if (i === 1) anim.stop()
      },
    })
    const played = anim.play()
    await drive(clock, 1000)
    await played
    expect(values.filter((v) => v !== 0)).toEqual([])
    expect({ v: anim.get(), idx: anim.getCurrentKeyframe(), playing: anim.isPlaying() }).toEqual({
      v: 0,
      idx: 0,
      playing: false,
    })
    expect(clock.pendingFrames).toBe(0)
    anim.destroy()
  })

  it('pause() inside onKeyframe does not move while paused; resume() still reaches that keyframe', async () => {
    clock = installTestClock()
    const values: number[] = []
    let completed = 0
    let paused = false
    const anim: KeyframesAnimation = keyframes([0, 100, 50], {
      config: cfg,
      onUpdate: (v) => values.push(v),
      onComplete: () => completed++,
      onKeyframe: (i) => {
        if (i === 1 && !paused) {
          paused = true
          anim.pause()
        }
      },
    })
    void anim.play()
    await drive(clock, 1000)
    expect(values.filter((v) => v !== 0)).toEqual([])
    expect(anim.isPlaying()).toBe(false)
    anim.resume()
    await drive(clock, 3000)
    expect(Math.max(...values)).toBeGreaterThan(99.9)
    expect(completed).toBe(1)
    expect(Math.round(anim.get())).toBe(50)
    anim.destroy()
  })

  it('pause() + resume() both inside onKeyframe do not skip the keyframe', async () => {
    clock = installTestClock()
    const values: number[] = []
    let completed = 0
    let once = true
    const anim: KeyframesAnimation = keyframes([0, 100, 50], {
      config: cfg,
      onUpdate: (v) => values.push(v),
      onComplete: () => completed++,
      onKeyframe: (i) => {
        if (i === 1 && once) {
          once = false
          anim.pause()
          anim.resume()
        }
      },
    })
    void anim.play()
    await drive(clock, 4000)
    expect(Math.max(...values)).toBeGreaterThan(99.9)
    expect(completed).toBe(1)
    expect(Math.round(anim.get())).toBe(50)
    anim.destroy()
  })

  it('timed mode: pause() inside onKeyframe, then resume() completes', async () => {
    clock = installTestClock()
    const values: number[] = []
    let completed = 0
    let paused = false
    const anim: KeyframesAnimation = keyframes([0, 100, 50], {
      duration: 300,
      config: cfg,
      onUpdate: (v) => values.push(v),
      onComplete: () => completed++,
      onKeyframe: (i) => {
        if (i === 1 && !paused) {
          paused = true
          anim.pause()
        }
      },
    })
    void anim.play()
    await drive(clock, 600)
    expect(values.filter((v) => v !== 0)).toEqual([])
    anim.resume()
    await drive(clock, 4000)
    expect(completed).toBe(1)
    expect(Math.round(anim.get())).toBe(50)
    anim.destroy()
  })

  it('destroy() inside onKeyframe leaves no pending frames and no completion', async () => {
    clock = installTestClock()
    let completed = 0
    const anim: KeyframesAnimation = keyframes([0, 100, 50], {
      config: cfg,
      onComplete: () => completed++,
      onKeyframe: (i) => {
        if (i === 1) anim.destroy()
      },
    })
    const played = anim.play()
    await drive(clock, 500)
    await played
    expect(completed).toBe(0)
    expect(clock.pendingFrames).toBe(0)
  })

  it('control: a callback that does nothing keeps a plain run unchanged', async () => {
    clock = installTestClock()
    const visited: number[] = []
    let completed = 0
    const anim = keyframes([0, 100, 50], {
      config: cfg,
      onKeyframe: (i) => visited.push(i),
      onComplete: () => completed++,
    })
    void anim.play()
    await drive(clock, 4000)
    expect(visited).toEqual([0, 1, 2])
    expect(completed).toBe(1)
    anim.destroy()
  })
})
