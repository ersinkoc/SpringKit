import { describe, it, expect, afterEach, vi } from 'vitest'
import { createTimeline } from '../../../src/animation/timeline'
import { installTestClock, type TestClock } from '../../../src/testing/index'

let clock: TestClock | null = null
afterEach(() => {
  clock?.uninstall()
  clock = null
})

describe('timeline addPause() boundaries', () => {
  it('resume() moves past a pause whose position is not exact in binary (no endless re-pause)', () => {
    clock = installTestClock()
    const onPause = vi.fn()
    // 1003 / 1000 * 1000 < 1003 in floating point
    const tl = createTimeline().to({ v: 0 }, { v: 100, duration: 2 }).addPause(1.003, onPause)
    tl.play()
    clock.advance(1100)
    expect(onPause).toHaveBeenCalledTimes(1)
    const pausedAt = tl.time()

    tl.resume()
    clock.advance(200)
    expect(onPause).toHaveBeenCalledTimes(1)
    expect(tl.time()).toBeGreaterThan(pausedAt + 0.1)
    tl.kill()
  })

  it('callbacks after a pause fire once, after resuming (not early in the pausing frame)', () => {
    clock = installTestClock({ frameRate: 10 }) // 100ms frames jump over both positions
    const order: string[] = []
    const tl = createTimeline()
      .to({ v: 0 }, { v: 1, duration: 1 })
      .addPause(0.15, () => order.push('pause'))
      .call(() => order.push('call'), 0.17)
    tl.play()
    clock.advance(300)
    expect(order).toEqual(['pause'])

    tl.resume()
    clock.advance(300)
    expect(order).toEqual(['pause', 'call'])
    tl.kill()
  })
})

describe('timeline position precision', () => {
  it('pauses exactly at a millisecond position that is not exact in binary', () => {
    clock = installTestClock()
    // 1.003 * 1000 === 1002.9999999999999
    const tl = createTimeline().to({ v: 0 }, { v: 1, duration: 2 }).addPause(1.003)
    tl.play()
    clock.advance(1200)
    expect(tl.time()).toBe(1.003)
    tl.kill()
  })
})
