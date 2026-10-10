import { describe, it, expect, afterEach, vi } from 'vitest'
import { installTestClock, type TestClock } from '../../../src/testing'
import { globalLoop, type Animatable } from '../../../src/animation/loop'

describe('AnimationLoop audit regressions', () => {
  let clock: TestClock | null = null
  const added: Animatable[] = []

  afterEach(() => {
    for (const a of added.splice(0)) globalLoop.remove(a)
    clock?.uninstall()
    clock = null
    vi.restoreAllMocks()
  })

  const add = (a: Animatable) => {
    added.push(a)
    globalLoop.add(a)
  }

  // F401: isComplete() throwing escaped tick(), leaving the loop "running"
  // with no frame scheduled (every animation frozen, new ones never started)
  it('isolates an animation whose isComplete() throws', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    clock = installTestClock()

    let good = 0
    const bad: Animatable = {
      update: () => {},
      isComplete: () => {
        throw new Error('isComplete boom')
      },
    }
    const ok: Animatable = { update: () => void good++, isComplete: () => false }

    expect(() => add(bad)).not.toThrow()
    add(ok)
    clock.advance(100)

    expect(good).toBeGreaterThanOrEqual(3)
    expect(clock.pendingFrames).toBe(1)
    expect(errSpy).toHaveBeenCalled()

    globalLoop.remove(bad)
    globalLoop.remove(ok)
    expect(clock.pendingFrames).toBe(0)

    // The loop restarts cleanly afterwards
    let late = 0
    let lateDone = false
    add({
      update: () => {
        if (++late >= 3) lateDone = true
      },
      isComplete: () => lateDone,
    })
    clock.advance(100)
    expect(lateDone).toBe(true)
    expect(globalLoop.size).toBe(0)
  })
})
