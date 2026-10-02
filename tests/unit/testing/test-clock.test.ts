import { describe, it, expect, afterEach, vi } from 'vitest'
import { installTestClock, type TestClock } from '../../../src/testing/index'
import { spring } from '../../../src/core/spring'
import { decay } from '../../../src/animation/decay'
import { createSpringValue } from '../../../src/core/spring-value'
import { solveSpring } from '../../../src/native/solver'
import { globalLoop } from '../../../src/animation/loop'

let clock: TestClock | null = null
afterEach(() => {
  clock?.uninstall()
  clock = null
})

describe('installTestClock', () => {
  it('replaces and restores the clock functions', () => {
    const realRaf = globalThis.requestAnimationFrame
    const realNow = performance.now
    clock = installTestClock()
    expect(globalThis.requestAnimationFrame).not.toBe(realRaf)
    const t = performance.now()
    expect(performance.now()).toBe(t) // frozen until advanced
    clock.advance(50)
    expect(performance.now()).toBe(t + 50)
    clock.uninstall()
    clock = null
    expect(globalThis.requestAnimationFrame).toBe(realRaf)
    expect(performance.now).toBe(realNow)
  })

  it('refuses to install twice', () => {
    clock = installTestClock()
    expect(() => installTestClock()).toThrow(/already installed/)
  })

  it('runs frame callbacks at the configured refresh rate', () => {
    clock = installTestClock({ frameRate: 120 })
    const stamps: number[] = []
    const start = clock.now()
    const loop = (t: number) => {
      stamps.push(t - start)
      if (stamps.length < 5) requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
    clock.advance(1000)
    expect(stamps.map((s) => Math.round(s * 100) / 100)).toEqual([8.33, 16.67, 25, 33.33, 41.67])
  })

  it('lands frames exactly on frame boundaries without float drift', () => {
    for (const startTime of [0, 0.1, 123456.789, 98765432.1, 3e9 + 0.3]) {
      const c = installTestClock({ startTime })
      try {
        let frames = 0
        let id = 0
        const loop = () => {
          frames++
          id = requestAnimationFrame(loop)
        }
        id = requestAnimationFrame(loop)
        c.advance(100) // 6 frames at 60fps, the 6th exactly at +100ms
        expect(frames).toBe(6)
        c.advance(1000)
        expect(frames).toBe(66)
        expect(c.now()).toBe(startTime + 1100)
        cancelAnimationFrame(id)
      } finally {
        c.uninstall()
      }
    }
  })

  it('starts at startTime when given', () => {
    clock = installTestClock({ startTime: 0 })
    expect(performance.now()).toBe(0)
    clock.advance(16)
    expect(performance.now()).toBe(16)
  })

  it('cancels frames', () => {
    clock = installTestClock()
    const cb = vi.fn()
    const id = requestAnimationFrame(cb)
    cancelAnimationFrame(id)
    clock.advance(100)
    expect(cb).not.toHaveBeenCalled()
    expect(clock.pendingFrames).toBe(0)
  })

  it('drives spring() deterministically and runAll() settles it', async () => {
    clock = installTestClock()
    const values: number[] = []
    const anim = spring(0, 100, {
      stiffness: 170,
      damping: 26,
      onUpdate: (v) => values.push(v),
    })
    anim.start()
    clock.advance(100)
    const at100 = anim.getValue()
    expect(at100).toBeGreaterThan(10)
    expect(at100).toBeLessThan(100)

    const elapsed = clock.runAll()
    expect(anim.isComplete()).toBe(true)
    expect(anim.getValue()).toBe(100)
    expect(elapsed).toBeGreaterThan(200)
    expect(globalLoop.size).toBe(0)
  })

  it('makes spring() match the exact analytic solution at any frame rate', () => {
    const cfg = { stiffness: 200, damping: 15 }
    const exact = solveSpring(cfg, 0, 1)
    for (const frameRate of [30, 60, 120, 144]) {
      const c = installTestClock({ frameRate })
      try {
        const t0 = c.now()
        const samples: Array<[number, number]> = []
        const anim = spring(0, 1, {
          ...cfg,
          onUpdate: (v) => samples.push([performance.now() - t0, v]),
        })
        anim.start()
        c.advance(300)
        anim.destroy()
        expect(samples.length).toBeGreaterThan(5)
        for (const [t, v] of samples) {
          expect(Math.abs(v - exact.at(t).value)).toBeLessThan(1e-6)
        }
      } finally {
        c.uninstall()
      }
    }
  })

  it('drives decay() and createSpringValue()', async () => {
    clock = installTestClock()
    const d = decay({ from: 0, velocity: 1000 })
    d.start()
    const sv = createSpringValue(0)
    sv.set(50)
    clock.runAll()
    expect(d.getValue()).toBeGreaterThan(100)
    expect(sv.get()).toBe(50)
    await expect(sv.finished).resolves.toBeUndefined()
  })

  it('virtualizes timers when asked, interleaved in time order with frames', () => {
    clock = installTestClock({ timers: true })
    const log: string[] = []
    setTimeout(() => log.push('timeout 20'), 20)
    setTimeout(() => log.push('timeout 5'), 5)
    requestAnimationFrame(() => log.push('frame'))
    const interval = setInterval(() => log.push('interval'), 30)
    clock.advance(65)
    clearInterval(interval)
    expect(log).toEqual(['timeout 5', 'frame', 'timeout 20', 'interval', 'interval'])
    expect(clock.pendingTimers).toBe(0)
  })

  it('passes timer arguments and clears timeouts', () => {
    clock = installTestClock({ timers: true })
    const cb = vi.fn()
    setTimeout(cb, 10, 'a', 1)
    const id = setTimeout(cb, 10, 'never')
    clearTimeout(id)
    clock.advance(10)
    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenCalledWith('a', 1)
  })

  it('runAll() throws for animations that never settle', () => {
    clock = installTestClock()
    const anim = spring(0, 1, { damping: 0 })
    anim.start()
    expect(() => clock!.runAll(2000)).toThrow(/still running/)
    anim.destroy()
  })

  it('runAll() ignores lone intervals instead of looping forever', () => {
    clock = installTestClock({ timers: true })
    setInterval(() => {}, 10)
    expect(clock.runAll()).toBe(0)
  })

  it('nextFrame() runs exactly one frame', () => {
    clock = installTestClock()
    const cb = vi.fn()
    requestAnimationFrame(cb)
    requestAnimationFrame(cb)
    clock.nextFrame()
    expect(cb).toHaveBeenCalledTimes(2)
    expect(clock.pendingFrames).toBe(0)
  })

  it('isolates errors thrown by frame callbacks', () => {
    clock = installTestClock()
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    const ok = vi.fn()
    requestAnimationFrame(() => {
      throw new Error('boom')
    })
    requestAnimationFrame(ok)
    clock.nextFrame()
    expect(ok).toHaveBeenCalled()
    expect(err).toHaveBeenCalled()
    err.mockRestore()
  })

  it('keeps animations running across clock swaps (no stall after uninstall + reinstall)', () => {
    const first = installTestClock()
    const leaked = spring(0, 1, { stiffness: 100, damping: 5 })
    leaked.start()
    first.advance(50)
    first.uninstall() // leaves the loop running, its frame handed to the real clock

    clock = installTestClock()
    const anim = spring(0, 100, { stiffness: 300, damping: 30 })
    anim.start()
    clock.advance(100)
    expect(anim.getValue()).toBeGreaterThan(20)
    expect(clock.pendingFrames).toBeGreaterThan(0)
    leaked.destroy()
    anim.destroy()
  })

  it('throws when used after uninstall', () => {
    const c = installTestClock()
    c.uninstall()
    expect(() => c.advance(10)).toThrow(/uninstalled/)
  })
})
