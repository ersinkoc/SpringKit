/**
 * Regression tests from the evidence audit of timeline.ts / sequence.ts
 * (F301 throwing hooks, F302 stagger setup failure, F303 kill() from a hook).
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { createTimeline, type Timeline } from '../../../src/animation/timeline'
import { stagger } from '../../../src/animation/sequence'
import { installTestClock, type TestClock } from '../../../src/testing/index'

let clock: TestClock | null = null
afterEach(() => {
  clock?.uninstall()
  clock = null
  vi.restoreAllMocks()
})

describe('timeline: a throwing user hook never stalls the timeline (F301)', () => {
  it('segment onUpdate that throws every frame: timeline still completes and errors are logged', () => {
    clock = installTestClock()
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    const target = { v: 0 }
    const onComplete = vi.fn()
    const tl = createTimeline({ onComplete }).to(target, {
      v: 100,
      duration: 0.5,
      onUpdate: () => {
        throw new Error('always')
      },
    })
    tl.play()
    clock.advance(2000)
    expect(target.v).toBe(100)
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(err).toHaveBeenCalled()
    tl.kill()
  })

  it('throwing segment onStart / onComplete and timeline onUpdate leave the later hooks running', () => {
    clock = installTestClock()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const order: string[] = []
    const target = { v: 0 }
    let thrown = false
    const tl = createTimeline({
      onUpdate: () => {
        order.push('tl.onUpdate')
        if (!thrown) {
          thrown = true
          throw new Error('update')
        }
      },
      onComplete: () => order.push('tl.onComplete'),
    }).to(target, {
      v: 1,
      duration: 0.2,
      onStart: () => {
        order.push('seg.onStart')
        throw new Error('start')
      },
      onComplete: () => {
        order.push('seg.onComplete')
        throw new Error('complete')
      },
    })
    tl.play()
    clock.advance(1000)
    expect(order[0]).toBe('seg.onStart')
    expect(order).toContain('seg.onComplete')
    expect(order.filter((e) => e === 'tl.onComplete')).toHaveLength(1)
    expect(order[order.length - 1]).toBe('tl.onComplete')
    expect(target.v).toBe(1)
    tl.kill()
  })

  it('throwing onRepeat / onComplete: every repeat still runs and playback ends cleanly', () => {
    clock = installTestClock()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const repeats: number[] = []
    const tl = createTimeline({
      repeat: 2,
      onRepeat: (n) => {
        repeats.push(n)
        throw new Error('repeat')
      },
      onComplete: () => {
        throw new Error('complete')
      },
    }).to({ v: 0 }, { v: 1, duration: 0.1 })
    tl.play()
    clock.advance(3000)
    expect(repeats).toEqual([1, 2])
    expect(tl.isPlaying()).toBe(false)
    expect(clock.pendingFrames).toBe(0)
    tl.kill()
  })
})

describe('timeline: kill() from inside a hook stops the rest of that frame (F303)', () => {
  type Where = 'call' | 'segOnUpdate' | 'segOnComplete' | 'tlOnUpdate' | 'onRepeat' | 'pauseCb'

  function run(where: Where) {
    clock = installTestClock()
    const events: string[] = []
    let killed = false
    const maybeKill = (w: Where) => {
      if (where === w && !killed) {
        killed = true
        events.push('KILL@' + w)
        tl.kill()
      }
    }
    const tag = (n: string) => events.push(killed ? n + '-AFTER-KILL' : n)
    const tl: Timeline = createTimeline({
      repeat: 3,
      onUpdate: () => {
        tag('tl.onUpdate')
        maybeKill('tlOnUpdate')
      },
      onRepeat: () => {
        tag('tl.onRepeat')
        maybeKill('onRepeat')
      },
      onComplete: () => tag('tl.onComplete'),
    })
      .to(
        { v: 0 },
        {
          v: 1,
          duration: 0.1,
          onUpdate: () => {
            tag('seg.onUpdate')
            maybeKill('segOnUpdate')
          },
          onComplete: () => {
            tag('seg.onComplete')
            maybeKill('segOnComplete')
          },
        }
      )
      .call(() => {
        tag('call1')
        maybeKill('call')
      }, 0.1)
      .call(() => tag('call2'), 0.1) // same position: must not run once call1 killed the timeline
    if (where === 'pauseCb') {
      tl.addPause(0.05, () => {
        tag('pauseCb')
        maybeKill('pauseCb')
      })
    }
    tl.play()
    clock.advance(100)
    if (where === 'pauseCb') tl.resume() // must not revive a killed timeline
    clock.advance(3000)
    const result = {
      events,
      afterKill: events.filter((e) => e.endsWith('-AFTER-KILL')),
      pendingFrames: clock.pendingFrames,
      playing: tl.isPlaying(),
    }
    clock.uninstall()
    clock = null
    return result
  }

  const places: Where[] = ['call', 'segOnUpdate', 'segOnComplete', 'tlOnUpdate', 'onRepeat', 'pauseCb']
  for (const where of places) {
    it(`kill() inside ${where}: nothing fires afterwards and no frame stays scheduled`, () => {
      const r = run(where)
      expect(r.events).toContain('KILL@' + where)
      expect(r.afterKill).toEqual([])
      expect(r.pendingFrames).toBe(0)
      expect(r.playing).toBe(false)
    })
  }

  it("killing one timeline from another's hook leaves the other running", () => {
    clock = installTestClock()
    const done: string[] = []
    const b = createTimeline().to({ v: 0 }, { v: 1, duration: 0.3 })
    const b2 = createTimeline({ onComplete: () => done.push('b2') }).to({ v: 0 }, { v: 1, duration: 0.3 })
    const a = createTimeline().to({ v: 0 }, { v: 1, duration: 0.2 }).call(() => b.kill(), 0.1)
    a.play()
    b.play()
    b2.play()
    clock.advance(1000)
    expect(done).toEqual(['b2'])
    a.kill()
    b2.kill()
  })
})

describe('stagger: setup failure cancels the delayed starts already scheduled (F302)', () => {
  function fake() {
    let resolve!: () => void
    const finished = new Promise<void>((r) => (resolve = r))
    return { finished, resolve, start: vi.fn() }
  }

  it('animate() throws on a later item: no delayed start fires after the rejection', async () => {
    clock = installTestClock()
    const anims = [fake(), fake(), fake()]
    const p = stagger(
      [0, 1, 2, 3],
      (_i, idx) => {
        if (idx === 3) throw new Error('animate failed')
        return anims[idx]!
      },
      { delay: 50 }
    )
    await expect(p).rejects.toThrow('animate failed') // rejection settles before time is released
    clock.advance(1000)
    expect(anims[0]!.start).toHaveBeenCalledTimes(1)
    expect(anims[1]!.start).not.toHaveBeenCalled()
    expect(anims[2]!.start).not.toHaveBeenCalled()
  })

  it('a delay function that throws part-way cancels the scheduled delays', async () => {
    clock = installTestClock()
    const anims = [fake(), fake(), fake(), fake()]
    const p = stagger([0, 1, 2, 3], (_i, idx) => anims[idx]!, {
      delay: (i) => {
        if (i === 3) throw new Error('delay failed')
        return i * 40
      },
    })
    await expect(p).rejects.toThrow('delay failed')
    clock.advance(1000)
    expect(anims[1]!.start).not.toHaveBeenCalled()
    expect(anims[2]!.start).not.toHaveBeenCalled()
  })

  it('control: a successful stagger still starts each item at k * delay', async () => {
    clock = installTestClock()
    const anims = [fake(), fake(), fake()]
    const p = stagger([0, 1, 2], (_i, idx) => anims[idx]!, { delay: 50 })
    expect(anims[1]!.start).not.toHaveBeenCalled()
    clock.advance(60)
    expect(anims[1]!.start).toHaveBeenCalledTimes(1)
    expect(anims[2]!.start).not.toHaveBeenCalled()
    clock.advance(60)
    expect(anims[2]!.start).toHaveBeenCalledTimes(1)
    anims.forEach((a) => a.resolve())
    await expect(p).resolves.toBeUndefined()
  })
})
