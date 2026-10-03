import { describe, it, expect, afterEach, vi } from 'vitest'
import { globalLoop, delay } from '../../../src/animation/loop'
import { animate } from '../../../src/animation/animate'
import { stagger } from '../../../src/animation/sequence'
import { spring } from '../../../src/core/spring'
import { createTimeline } from '../../../src/animation/timeline'
import { createTrail } from '../../../src/animation/trail'
import { keyframes } from '../../../src/animation/keyframes'
import { installTestClock, type TestClock } from '../../../src/testing/index'

const flush = async () => {
  for (let i = 0; i < 10; i++) await Promise.resolve()
}

let clock: TestClock | null = null
afterEach(() => {
  globalLoop.setTimeScale(1)
  clock?.uninstall()
  clock = null
})

describe.each([false, true])('delay() (test clock timers: %s)', (timers) => {
  it('fires after the delay of animation time, never synchronously', () => {
    clock = installTestClock({ timers })
    const cb = vi.fn()
    delay(0, cb)
    expect(cb).not.toHaveBeenCalled()
    const late = vi.fn()
    delay(100, late)
    clock.advance(17)
    expect(cb).toHaveBeenCalledTimes(1)
    clock.advance(80)
    expect(late).not.toHaveBeenCalled()
    clock.advance(20)
    expect(late).toHaveBeenCalledTimes(1)
    clock.runAll()
    expect(late).toHaveBeenCalledTimes(1)
  })

  it('follows the time scale (slow motion stretches it, 0 freezes it)', () => {
    clock = installTestClock({ timers })
    const cb = vi.fn()
    globalLoop.setTimeScale(0.5)
    delay(100, cb)
    clock.advance(150)
    expect(cb).not.toHaveBeenCalled()
    clock.advance(70)
    expect(cb).toHaveBeenCalledTimes(1)

    const frozen = vi.fn()
    globalLoop.setTimeScale(0)
    delay(10, frozen)
    clock.advance(500)
    expect(frozen).not.toHaveBeenCalled()
    globalLoop.setTimeScale(1)
    clock.advance(50)
    expect(frozen).toHaveBeenCalledTimes(1)
  })

  it('can be cancelled, and the loop goes idle afterwards', () => {
    clock = installTestClock({ timers })
    const cb = vi.fn()
    const cancel = delay(50, cb)
    cancel()
    clock.advance(100)
    expect(cb).not.toHaveBeenCalled()
    expect(globalLoop.size).toBe(0)
  })
})

describe('loop clock change', () => {
  it('re-adding an animation that is already running moves its frame to the new clock', () => {
    // A clock that never fires (e.g. a fake timer that was uninstalled)
    vi.stubGlobal('requestAnimationFrame', () => 1)
    vi.stubGlobal('cancelAnimationFrame', () => {})
    const first = vi.fn()
    const cancelFirst = delay(10, first) // the loop now waits on the dead clock
    vi.unstubAllGlobals()

    clock = installTestClock()
    const second = vi.fn()
    delay(10, second) // same runner, already in the loop
    clock.advance(50)
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
    cancelFirst()
  })
})

describe('delays that follow the time scale', () => {
  it('animate() delay', () => {
    clock = installTestClock({ timers: true })
    globalLoop.setTimeScale(0.5)
    const el = document.createElement('div')
    const onUpdate = vi.fn()
    const controls = animate(el, { opacity: 0.5 }, { delay: 100, onUpdate })
    clock.advance(150)
    expect(onUpdate).not.toHaveBeenCalled()
    clock.advance(100)
    expect(onUpdate).toHaveBeenCalled()
    controls.stop()
  })

  it('stagger() delays', () => {
    clock = installTestClock({ timers: true })
    globalLoop.setTimeScale(0.5)
    const started: number[] = []
    void stagger(
      [0, 1],
      (_item, index) => {
        const anim = spring(0, 1)
        const start = anim.start.bind(anim)
        anim.start = () => {
          started.push(index)
          return start()
        }
        return anim
      },
      { delay: 100 }
    )
    expect(started).toEqual([0])
    clock.advance(150)
    expect(started).toEqual([0])
    clock.advance(70)
    expect(started).toEqual([0, 1])
    clock.runAll()
  })

  it('timeline repeatDelay', () => {
    clock = installTestClock({ timers: true })
    const onRepeat = vi.fn()
    const onComplete = vi.fn()
    const tl = createTimeline({ repeat: 1, repeatDelay: 0.2, onRepeat, onComplete }).to(
      { v: 0 },
      { v: 1, duration: 0.1 }
    )
    tl.play()
    clock.advance(150) // first run done, repeat delay running
    expect(onRepeat).toHaveBeenCalledTimes(1)
    globalLoop.setTimeScale(0)
    clock.advance(1000) // frozen: the repeat delay doesn't elapse
    globalLoop.setTimeScale(1)
    clock.advance(100)
    expect(tl.time()).toBe(0) // still waiting out the repeat delay
    clock.advance(300)
    expect(onComplete).toHaveBeenCalledTimes(1)
    tl.kill()
  })

  it('trail followDelay', () => {
    clock = installTestClock({ timers: true })
    globalLoop.setTimeScale(0.5)
    const trail = createTrail(1, { followDelay: 2 })
    trail.set(100)
    // The first moving leader sample (frame 1) reaches the follower after
    // 2 frames' worth (32ms) of animation time = 64ms of real time at 0.5x
    clock.advance(70)
    expect(trail.getValues()[0]).toBe(0)
    clock.advance(100)
    expect(trail.getValues()[0]).toBeGreaterThan(0)
    trail.destroy()
  })

  it('keyframes start check', async () => {
    clock = installTestClock({ timers: true })
    globalLoop.setTimeScale(0)
    const onComplete = vi.fn()
    // The target equals the start: the first spring settles at once, so only
    // the start check stands between keyframes and completion
    const kf = keyframes([0, 0], { onComplete })
    void kf.play()
    clock.advance(500)
    await flush()
    expect(onComplete).not.toHaveBeenCalled()
    globalLoop.setTimeScale(1)
    for (let i = 0; i < 10; i++) {
      clock.advance(20)
      await flush()
    }
    expect(onComplete).toHaveBeenCalled()
    kf.destroy()
  })
})
