import { describe, it, expect, afterEach, vi } from 'vitest'
import { installTestClock, type TestClock } from '../../../src/testing'
import { createSpringValue } from '../../../src/core/spring-value'
import { createSpringGroup } from '../../../src/core/spring-group'

// Flush promise reactions without timers (the test clock owns time)
async function flush(): Promise<void> {
  for (let i = 0; i < 10; i++) await Promise.resolve()
}

async function settled(p: Promise<void>): Promise<boolean> {
  let done = false
  void p.then(() => {
    done = true
  })
  await flush()
  return done
}

describe('SpringValue / SpringGroup audit regressions', () => {
  let clock: TestClock | null = null

  afterEach(() => {
    clock?.uninstall()
    clock = null
    vi.restoreAllMocks()
  })

  // F1001: a throwing onComplete skipped resolving `finished`
  describe('throwing onComplete', () => {
    it('still settles SpringValue.finished and reports the error', async () => {
      clock = installTestClock()
      const err = vi.spyOn(console, 'error').mockImplementation(() => {})
      const value = createSpringValue(0)
      const cb = vi.fn(() => {
        throw new Error('boom')
      })
      value.set(100, { onComplete: cb })
      const fin = value.finished
      clock.runAll()

      expect(await settled(fin)).toBe(true)
      expect(cb).toHaveBeenCalledTimes(1)
      expect(value.get()).toBe(100)
      expect(err).toHaveBeenCalled()
      value.destroy()
    })

    it('settles SpringGroup.finished when a group-level onComplete throws', async () => {
      clock = installTestClock()
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const group = createSpringGroup(
        { x: 0, y: 0 },
        {
          onComplete: () => {
            throw new Error('boom')
          },
        }
      )
      group.set({ x: 10, y: 20 })
      const fin = group.finished
      clock.runAll()

      expect(await settled(fin)).toBe(true)
      expect(group.get()).toEqual({ x: 10, y: 20 })
      group.destroy()
    })

    it('does not resolve a later set() early (control)', async () => {
      clock = installTestClock()
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const value = createSpringValue(0, {
        onComplete: () => {
          throw new Error('boom')
        },
      })
      value.set(50)
      clock.runAll()
      value.set(80)
      const second = value.finished
      expect(await settled(second)).toBe(false)
      clock.runAll()
      expect(await settled(second)).toBe(true)
      value.destroy()
    })
  })

  // F1002: set() issued from inside onComplete had its `finished` resolved by the
  // completion that was still unwinding
  describe('set() chained from onComplete', () => {
    it('keeps the new finished pending until the new animation rests', async () => {
      clock = installTestClock()
      const value = createSpringValue(0)
      let chained: Promise<void> | null = null
      let chainedDone = false
      value.set(100, {
        onComplete: () => {
          value.set(200, { stiffness: 170 })
          chained = value.finished
          void chained.then(() => {
            chainedDone = true
          })
        },
      })
      let guard = 0
      while (!chained && guard++ < 1000) clock.nextFrame()
      await flush()

      expect(value.isAnimating()).toBe(true)
      expect(chainedDone).toBe(false)
      clock.runAll()
      await flush()
      expect(chainedDone).toBe(true)
      expect(value.get()).toBe(200)
      value.destroy()
    })

    it('resolves every hop of a chain at its own rest position', async () => {
      clock = installTestClock()
      const value = createSpringValue(0)
      const log: string[] = []
      const targets = [100, 0, 100]
      let hop = 0
      const next = (): void => {
        const to = targets[hop++]
        if (to === undefined) return
        value.set(to, { onComplete: next })
        const id = hop
        void value.finished.then(() => log.push(`${id}@${value.get().toFixed(0)}`))
      }
      next()
      let frames = 0
      while ((value.isAnimating() || hop < targets.length) && frames++ < 5000) {
        clock.nextFrame()
        await flush()
      }
      await flush()

      expect(log).toEqual(['1@100', '2@0', '3@100'])
      value.destroy()
    })
  })

  // F1003: an unsubscribe handle removed registrations it did not own
  describe('unsubscribe ownership', () => {
    it('SpringValue: one handle of a twice-registered callback leaves the other live', () => {
      clock = installTestClock()
      const value = createSpringValue(0)
      const cb = vi.fn()
      const first = value.subscribe(cb)
      const second = value.subscribe(cb)
      first()
      cb.mockClear()

      value.jump(5)
      expect(cb).toHaveBeenCalledTimes(1)

      second()
      cb.mockClear()
      value.jump(6)
      expect(cb).not.toHaveBeenCalled()
      value.destroy()
    })

    it('SpringValue: a stale handle does not remove a later registration', () => {
      clock = installTestClock()
      const value = createSpringValue(0)
      const cb = vi.fn()
      const old = value.subscribe(cb)
      old()
      const fresh = value.subscribe(cb)
      old()
      old()
      cb.mockClear()

      value.jump(5)
      expect(cb).toHaveBeenCalledTimes(1)

      fresh()
      fresh()
      cb.mockClear()
      value.jump(7)
      expect(cb).not.toHaveBeenCalled()
      value.destroy()
    })

    it('SpringValue: unsubscribing after destroy() does not throw', () => {
      const value = createSpringValue(0)
      const unsub = value.subscribe(vi.fn())
      value.destroy()
      expect(() => unsub()).not.toThrow()
    })

    it('SpringGroup: a stale handle does not remove a later registration', async () => {
      clock = installTestClock()
      const group = createSpringGroup({ x: 0 })
      const cb = vi.fn()
      const old = group.subscribe(cb)
      old()
      const fresh = group.subscribe(cb)
      old()
      await flush()
      cb.mockClear()

      group.jump({ x: 5 })
      await flush()
      expect(cb).toHaveBeenCalledTimes(1)

      fresh()
      fresh()
      cb.mockClear()
      group.jump({ x: 6 })
      await flush()
      expect(cb).not.toHaveBeenCalled()
      group.destroy()
    })
  })
})
