import { installTestClock } from '../../../src/testing/index'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { spring } from '../../../src/core/spring'
import { simulateSpring } from '../../../src/core/physics'
import { decay } from '../../../src/animation/decay'
import { globalLoop, type Animatable } from '../../../src/animation/loop'

/** Remove anything a failed test may have left in the shared global loop */
function resetLoop() {
  const internal = globalLoop as unknown as { animations: Set<unknown> }
  for (const entry of Array.from(internal.animations)) {
    const anim = (entry as { deref?: () => Animatable | undefined }).deref?.() ?? (entry as Animatable)
    globalLoop.remove(anim)
  }
}

type Updatable = { update(now: number): void }

const START = 1000

/**
 * Freeze the global loop (RAF never fires) so update() can be driven manually
 * with synthetic timestamps.
 */
function freezeLoop() {
  vi.stubGlobal('requestAnimationFrame', () => 1)
  vi.stubGlobal('cancelAnimationFrame', () => {})
  vi.spyOn(performance, 'now').mockReturnValue(START)
}

describe('core regressions', () => {
  afterEach(() => {
    resetLoop()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  describe('spring physics are refresh-rate independent', () => {
    // Driven by the virtual test clock (the loop owns the animation clock,
    // so update() can't be called with arbitrary timestamps)
    const run = (hz: number, ms: number) => {
      const clock = installTestClock({ frameRate: hz, startTime: 0 })
      try {
        const anim = spring(0, 100, { stiffness: 170, damping: 26 })
        anim.start()
        clock.advance(ms)
        const value = anim.getValue()
        anim.stop()
        return value
      } finally {
        clock.uninstall()
      }
    }

    it('reaches the same position after 200ms at 60Hz, 120Hz, 144Hz and 50Hz', () => {
      // 500ms is a whole number of frames at all four refresh rates
      const at60 = run(60, 500)
      const at120 = run(120, 500)
      const at144 = run(144, 500)
      const at50 = run(50, 500)

      expect(at60).toBeGreaterThan(10)
      expect(at60).toBeLessThan(99)
      expect(Math.abs(at120 - at60)).toBeLessThan(2)
      expect(Math.abs(at144 - at60)).toBeLessThan(2)
      expect(Math.abs(at50 - at60)).toBeLessThan(2)
    })

    it('settles in about the same wall-clock time at 50/60/120/144Hz', () => {
      const settleTime = (hz: number) => {
        let done = false
        const anim = spring(0, 100, { stiffness: 170, damping: 26, onComplete: () => { done = true } })
        anim.start()
        const frameMs = 1000 / hz
        let t = START
        while (!done && t < START + 10000) {
          t += frameMs
          ;(anim as unknown as Updatable).update(t)
        }
        anim.stop()
        return t - START
      }
      const t60 = settleTime(60)
      expect(t60).toBeLessThan(5000)
      for (const hz of [50, 120, 144]) {
        expect(Math.abs(settleTime(hz) - t60)).toBeLessThan(60)
      }
    })
  })

  describe('loop FPS', () => {
    it('getFPS() stays finite after the synchronous start tick', () => {
      manualFrames()
      const a: Animatable = { update: () => {}, isComplete: () => false }
      globalLoop.add(a)
      expect(Number.isFinite(globalLoop.getFPS())).toBe(true)
      globalLoop.remove(a)
    })
  })

  describe('spring initial velocity validation', () => {
    it('a NaN initial velocity does not make the spring run forever', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      freezeLoop()
      let completed = false
      const anim = spring(0, 10, { velocity: NaN, stiffness: 300, damping: 30, onComplete: () => { completed = true } })
      anim.start()
      let t = START
      for (let i = 0; i < 600 && !completed; i++) {
        t += 16
        ;(anim as unknown as Updatable).update(t)
      }
      expect(completed).toBe(true)
      expect(anim.getValue()).toBe(10)
    })
  })

  describe('simulateSpring timeStep', () => {
    it('defaults to a 1/60s step and honours a custom step', () => {
      const config = { stiffness: 100, damping: 10, mass: 1 }
      const def = simulateSpring(0, 0, 100, config)
      const explicit = simulateSpring(0, 0, 100, config, 1 / 60)
      expect(def).toEqual(explicit)

      const zero = simulateSpring(0, 0, 100, config, 0)
      expect(zero.position).toBe(0)
      expect(zero.isRest).toBe(false)

      // Invalid steps fall back to the default instead of producing NaN
      const bad = simulateSpring(0, 0, 100, config, NaN)
      expect(bad).toEqual(def)
    })
  })

  describe('spring callback error isolation', () => {
    it('still completes and resolves finished when onUpdate throws', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      freezeLoop()
      let completed = false
      const anim = spring(0, 10, {
        stiffness: 300,
        damping: 30,
        onUpdate: () => {
          throw new Error('boom')
        },
        onComplete: () => {
          completed = true
        },
      })
      anim.start()
      let t = START
      for (let i = 0; i < 600 && !completed; i++) {
        t += 16
        ;(anim as unknown as Updatable).update(t)
      }
      expect(completed).toBe(true)
      await expect(anim.finished).resolves.toBeUndefined()
      expect(consoleSpy).toHaveBeenCalled()
    })
  })

  describe('decay is refresh-rate independent', () => {

    const run = (hz: number, ms: number) => {
      const clock = installTestClock({ frameRate: hz, startTime: 0 })
      try {
        let value = 0
        const anim = decay({ velocity: 1200, deceleration: 0.995, onUpdate: (v) => { value = v } })
        anim.start()
        clock.advance(ms)
        anim.stop()
        return value
      } finally {
        clock.uninstall()
      }
    }

    it('travels the same distance in 1/6 s at 60Hz, 144Hz and 30Hz', () => {
      const ms = 1000 / 6
      const at60 = run(60, ms)
      const at144 = run(144, ms)
      const at30 = run(30, ms)
      expect(at60).toBeGreaterThan(40)
      expect(Math.abs(at144 - at60)).toBeLessThan(0.5)
      expect(Math.abs(at30 - at60)).toBeLessThan(0.5)
    })

    it('follows the exact exponential decay (velocity in units/s, deceleration per ms)', () => {
      // x(t) = v0/1000 * (d^t - 1) / ln(d)
      const expected = (1.2 * (Math.pow(0.995, 200) - 1)) / Math.log(0.995)
      expect(run(60, 200)).toBeCloseTo(expected, 6)
    })
  })
})

// ---------------------------------------------------------------------------
// Deterministic frame stepping for loop-driven APIs (SpringValue, groups...)
// ---------------------------------------------------------------------------
import { createSpringValue } from '../../../src/core/spring-value'
import { createSpringGroup } from '../../../src/core/spring-group'
import { createMotionValue } from '../../../src/core/MotionValue'

function manualFrames() {
  let clock = START
  const queue = new Map<number, FrameRequestCallback>()
  let nextId = 1
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    const id = nextId++
    queue.set(id, cb)
    return id
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    queue.delete(id)
  })
  vi.spyOn(performance, 'now').mockImplementation(() => clock)
  const step = (count = 1, ms = 1000 / 60) => {
    for (let i = 0; i < count; i++) {
      clock += ms
      const cbs = Array.from(queue.values())
      queue.clear()
      cbs.forEach((cb) => cb(clock))
    }
  }
  return { step }
}

const flushMicrotasks = async () => {
  for (let i = 0; i < 5; i++) await Promise.resolve()
}

describe('SpringValue regressions', () => {
  afterEach(() => {
    resetLoop()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('preserves velocity when retargeted mid-flight', () => {
    const { step } = manualFrames()
    const v = createSpringValue(0, { stiffness: 170, damping: 26 })
    v.set(100)
    step(6)
    const velocityBefore = v.getVelocity()
    expect(velocityBefore).toBeGreaterThan(50)

    v.set(200)
    // Velocity must carry over instead of resetting to 0
    expect(v.getVelocity()).toBeCloseTo(velocityBefore, 5)
    v.destroy()
  })

  it('keeps progressing when retargeted on every frame', () => {
    const { step } = manualFrames()
    // Keep the loop running so set() happens while the loop is active
    const keepAlive: Animatable = { update: () => {}, isComplete: () => false }
    globalLoop.add(keepAlive)
    const v = createSpringValue(0, { stiffness: 170, damping: 26 })
    for (let i = 0; i < 20; i++) {
      v.set(100)
      step()
    }
    // A fresh animation per frame must still integrate the frame's time
    expect(v.get()).toBeGreaterThan(30)
    globalLoop.remove(keepAlive)
    v.destroy()
  })

  it('an explicit velocity passed to set() still wins', () => {
    const { step } = manualFrames()
    const v = createSpringValue(0)
    v.set(100)
    step(5)
    v.set(200, { velocity: 0 })
    expect(v.getVelocity()).toBe(0)
    v.destroy()
  })

  it('resolves the pending finished promise when jump() interrupts an animation', async () => {
    const { step } = manualFrames()
    const v = createSpringValue(0)
    v.set(100)
    step(2)
    let resolved = false
    v.finished.then(() => {
      resolved = true
    })
    v.jump(50)
    await flushMicrotasks()
    expect(resolved).toBe(true)
    expect(v.get()).toBe(50)
    v.destroy()
  })
})

describe('finished of an idle value', () => {
  it('SpringValue.finished is settled before any animation', async () => {
    let done = false
    createSpringValue(0).finished.then(() => {
      done = true
    })
    await flushMicrotasks()
    expect(done).toBe(true)
  })

  it('SpringGroup.finished is settled before any animation', async () => {
    let done = false
    createSpringGroup({ x: 0 }).finished.then(() => {
      done = true
    })
    await flushMicrotasks()
    expect(done).toBe(true)
  })

  it('MotionValue.stop() on an idle value does not emit animationEnd', () => {
    const mv = createMotionValue(0)
    const onEnd = vi.fn()
    mv.on('animationEnd', onEnd)
    mv.stop()
    expect(onEnd).not.toHaveBeenCalled()
    mv.destroy()
  })
})

describe('SpringGroup regressions', () => {
  afterEach(() => {
    resetLoop()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('a superseded batch does not resolve the new batch early, and its own promise settles', async () => {
    const { step } = manualFrames()
    const group = createSpringGroup({ x: 0 }, { stiffness: 170, damping: 26 })

    group.set({ x: 100 })
    const first = group.finished
    let firstResolved = false
    first.then(() => {
      firstResolved = true
    })
    step(3)

    group.set({ x: 200 })
    let secondResolved = false
    group.finished.then(() => {
      secondResolved = true
    })

    await flushMicrotasks()
    // The interrupted batch's promise settles...
    expect(firstResolved).toBe(true)
    // ...but must NOT resolve the new batch while x is still animating
    expect(group.isAnimating()).toBe(true)
    expect(secondResolved).toBe(false)

    for (let i = 0; i < 600 && group.isAnimating(); i++) step()
    await flushMicrotasks()
    expect(secondResolved).toBe(true)
    expect(group.getValue('x')).toBe(200)
    group.destroy()
  })
})

describe('MotionValue regressions', () => {
  afterEach(() => {
    resetLoop()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('set(value, false) keeps the internal spring in sync', () => {
    const { step } = manualFrames()
    const mv = createMotionValue(0, { spring: { stiffness: 170, damping: 26 } })
    mv.set(50, false)
    expect(mv.get()).toBe(50)

    const seen: number[] = []
    mv.subscribe((v) => seen.push(v))
    mv.set(100)
    step(1)
    step(1)
    // Must animate from 50 upwards, never jump back toward the stale 0
    expect(Math.min(...seen)).toBeGreaterThanOrEqual(50)
    mv.destroy()
  })

  it('set(value, false) during an animation stops it and ends the animation', () => {
    const { step } = manualFrames()
    const mv = createMotionValue(0)
    const onEnd = vi.fn()
    mv.on('animationEnd', onEnd)
    mv.set(100)
    step(3)
    expect(mv.isAnimating()).toBe(true)

    mv.set(10, false)
    expect(mv.isAnimating()).toBe(false)
    expect(onEnd).toHaveBeenCalledTimes(1)
    step(5)
    // The old spring must not keep overwriting the value
    expect(mv.get()).toBe(10)
    mv.destroy()
  })

  it('does not report animationEnd while the spring has momentarily zero velocity', () => {
    const { step } = manualFrames()
    // Keep the loop running so the new spring's first update happens on a
    // frame with zero elapsed time (velocity still exactly 0, not at rest)
    const keepAlive: Animatable = { update: () => {}, isComplete: () => false }
    globalLoop.add(keepAlive)

    const mv = createMotionValue(0)
    const onEnd = vi.fn()
    mv.on('animationEnd', onEnd)
    mv.set(100)
    step(1)
    expect(onEnd).not.toHaveBeenCalled()
    expect(mv.isAnimating()).toBe(true)

    for (let i = 0; i < 600 && mv.isAnimating(); i++) step()
    expect(onEnd).toHaveBeenCalledTimes(1)
    expect(mv.get()).toBe(100)
    globalLoop.remove(keepAlive)
    mv.destroy()
  })
})

// ---------------------------------------------------------------------------
// variants
// ---------------------------------------------------------------------------
import { mergeVariants, buildTransformString, createOrchestration } from '../../../src/core/variants'

describe('variants regressions', () => {
  it('mergeVariants keeps earlier transition fields', () => {
    const merged = mergeVariants(
      { x: 1, transition: { delay: 100 } },
      { y: 2, transition: { staggerChildren: 0.1 } }
    )
    expect(merged.transition).toEqual({ delay: 100, staggerChildren: 0.1 })
  })

  it('mergeVariants does not mutate the input transitions', () => {
    const a = { transition: { delay: 100 } }
    const b = { transition: { staggerChildren: 0.1 } }
    mergeVariants(a, b)
    expect(a.transition).toEqual({ delay: 100 })
    expect(b.transition).toEqual({ staggerChildren: 0.1 })
  })

  it('buildTransformString keeps units of string x/y values', () => {
    expect(buildTransformString({ x: '50%', y: '2rem' })).toBe('translate(50%, 2rem)')
    expect(buildTransformString({ x: 10, y: '1em' })).toBe('translate(10px, 1em)')
  })

  it('createOrchestration propagates a child rejection instead of hanging', async () => {
    vi.useFakeTimers()
    try {
      const orchestration = createOrchestration(
        () => Promise.resolve(),
        [() => Promise.reject(new Error('child failed'))],
        { staggerChildren: 10 }
      )
      const result = orchestration.children()
      const assertion = expect(result).rejects.toThrow('child failed')
      await vi.runAllTimersAsync()
      await assertion
    } finally {
      vi.useRealTimers()
    }
  })
})
