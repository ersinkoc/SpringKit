import { describe, it, expect, afterEach } from 'vitest'
import { globalLoop, type Animatable } from '../../../src/animation/loop'
import { installTestClock, type TestClock } from '../../../src/testing/index'

/**
 * Frame snapshot semantics of the loop, which reuses one snapshot buffer and
 * tracks in-frame removals instead of copying the animation set and doing a
 * set lookup per animation every frame.
 */

let clock: TestClock | null = null
const live: Animatable[] = []

afterEach(() => {
  for (const a of live) globalLoop.remove(a)
  live.length = 0
  clock?.uninstall()
  clock = null
})

function track(name: string, log: string[], onUpdate?: () => void): Animatable & { done: boolean } {
  const a = {
    done: false,
    update() {
      log.push(name)
      onUpdate?.()
    },
    isComplete() {
      return a.done
    },
  }
  live.push(a)
  return a
}

describe('AnimationLoop frame snapshot', () => {
  it('starts animations added during a frame on the next frame', () => {
    clock = installTestClock()
    const log: string[] = []
    let added = false
    const late = track('late', log)
    const a = track('a', log, () => {
      if (!added) {
        added = true
        globalLoop.add(late)
      }
    })
    globalLoop.add(a) // synchronous start tick: a runs and adds late
    expect(log).toEqual(['a'])
    clock.nextFrame()
    expect(log).toEqual(['a', 'a', 'late'])
  })

  it('skips animations removed earlier in the same frame', () => {
    clock = installTestClock()
    const log: string[] = []
    const b = track('b', log)
    const c = track('c', log)
    let armed = false
    const a = track('a', log, () => {
      if (armed) globalLoop.remove(b)
    })
    globalLoop.add(a)
    globalLoop.add(b)
    globalLoop.add(c)
    clock.nextFrame()
    log.length = 0
    armed = true
    clock.nextFrame()
    expect(log).toEqual(['a', 'c'])
    armed = false
    clock.nextFrame()
    expect(log).toEqual(['a', 'c', 'a', 'c'])
  })

  it('still updates an animation removed and re-added earlier in the frame', () => {
    clock = installTestClock()
    const log: string[] = []
    const b = track('b', log)
    let armed = false
    const a = track('a', log, () => {
      if (armed) {
        armed = false
        globalLoop.remove(b)
        globalLoop.add(b)
      }
    })
    globalLoop.add(a)
    globalLoop.add(b)
    clock.nextFrame()
    log.length = 0
    armed = true
    clock.nextFrame()
    expect(log).toEqual(['a', 'b'])
  })

  it('handles removals in one frame without affecting the next', () => {
    clock = installTestClock()
    const log: string[] = []
    const a = track('a', log)
    const b = track('b', log)
    const c = track('c', log, () => {
      c.done = true
    })
    globalLoop.add(c)
    globalLoop.add(a)
    globalLoop.add(b)
    clock.nextFrame()
    // c completed and was released; a and b keep running
    expect(globalLoop.size).toBe(2)
    log.length = 0
    clock.nextFrame()
    expect(log).toEqual(['a', 'b'])
    // a removes itself mid-frame; b still runs this frame and the next
    log.length = 0
    a.update = () => {
      log.push('a')
      globalLoop.remove(a)
    }
    clock.nextFrame()
    clock.nextFrame()
    expect(log).toEqual(['a', 'b', 'b'])
  })
})
