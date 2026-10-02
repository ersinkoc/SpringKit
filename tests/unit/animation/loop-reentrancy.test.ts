import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { globalLoop, type Animatable } from '../../../src/animation/loop'

// Manual RAF queue so frames can be stepped deterministically
let queue: Map<number, FrameRequestCallback>
let nextId: number

function flushFrame(): number {
  const callbacks = Array.from(queue.values())
  queue.clear()
  callbacks.forEach((cb) => cb(performance.now()))
  return callbacks.length
}

describe('AnimationLoop re-entrancy & error isolation (regression)', () => {
  beforeEach(() => {
    queue = new Map()
    nextId = 1
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      const id = nextId++
      queue.set(id, cb)
      return id
    })
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      queue.delete(id)
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('does not spawn a second RAF chain when an animation is added from within a tick', () => {
    let bUpdates = 0
    let bDone = false
    const b: Animatable = {
      update: () => {
        bUpdates++
      },
      isComplete: () => bDone,
    }

    let aDone = false
    const a: Animatable = {
      update: () => {
        if (aDone) return
        aDone = true
        // Mimics spring.update(): remove self on rest, then onComplete starts another animation
        globalLoop.remove(a)
        globalLoop.add(b)
      },
      isComplete: () => aDone,
    }

    globalLoop.add(a) // synchronous first tick runs a.update()

    // Exactly one tick callback must be queued
    expect(queue.size).toBe(1)

    const before = bUpdates
    flushFrame()
    // b must be updated exactly once per frame
    expect(bUpdates - before).toBe(1)
    expect(queue.size).toBe(1)

    bDone = true
    flushFrame()
    expect(globalLoop.size).toBe(0)
    expect(queue.size).toBe(0)
  })

  it('keeps running other animations when one update throws', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    let throwOnce = true
    let badDone = false
    const bad: Animatable = {
      update: () => {
        if (throwOnce) {
          throwOnce = false
          throw new Error('boom')
        }
        badDone = true
      },
      isComplete: () => badDone,
    }

    let goodUpdates = 0
    let goodDone = false
    const good: Animatable = {
      update: () => {
        goodUpdates++
      },
      isComplete: () => goodDone,
    }

    expect(() => globalLoop.add(bad)).not.toThrow()
    globalLoop.add(good)

    // Loop must still have a scheduled frame
    expect(queue.size).toBe(1)
    flushFrame()
    expect(goodUpdates).toBeGreaterThan(0)

    goodDone = true
    flushFrame()
    expect(globalLoop.size).toBe(0)
    expect(consoleSpy).toHaveBeenCalled()
  })
})
