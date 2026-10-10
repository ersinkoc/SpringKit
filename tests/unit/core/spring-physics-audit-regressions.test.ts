import { describe, it, expect, afterEach } from 'vitest'
import { installTestClock, type TestClock } from '../../../src/testing'
import { globalLoop } from '../../../src/animation/loop'
import { spring, type SpringAnimation } from '../../../src/core/spring'
import { stepSpring, restThreshold } from '../../../src/core/physics'

async function flush(): Promise<void> {
  for (let i = 0; i < 5; i++) await Promise.resolve()
}

describe('spring / physics audit regressions', () => {
  let clock: TestClock | null = null
  const springs: SpringAnimation[] = []

  afterEach(() => {
    for (const s of springs.splice(0)) s.destroy()
    clock?.uninstall()
    clock = null
  })

  // F901: start() registered the spring in the loop after onStart returned,
  // even when onStart had stopped / destroyed / paused it
  describe('stop / destroy / pause inside onStart', () => {
    for (const kind of ['stop', 'destroy', 'pause'] as const) {
      it(`${kind}() in onStart leaves the loop empty`, () => {
        clock = installTestClock()
        const a: SpringAnimation = spring(0, 100, {
          onStart: () => {
            if (kind === 'stop') a.stop()
            else if (kind === 'destroy') a.destroy()
            else a.pause()
          },
        })
        springs.push(a)
        a.start()
        expect(globalLoop.size).toBe(0)
        clock.advance(200)
        expect(clock.pendingFrames).toBe(0)
        expect(a.isAnimating()).toBe(false)
      })
    }

    it('a spring paused in onStart can still be resumed', () => {
      clock = installTestClock()
      const a: SpringAnimation = spring(0, 100, { onStart: () => a.pause() })
      springs.push(a)
      a.start()
      a.resume()
      clock.runAll()
      expect(a.isComplete()).toBe(true)
      expect(a.getValue()).toBe(100)
      expect(globalLoop.size).toBe(0)
    })
  })

  // F902: `finished` was settled after the completion callbacks, so a restart
  // from one of them got an already-resolved promise
  describe('restart from a completion callback', () => {
    for (const hook of ['onComplete', 'onRest'] as const) {
      it(`${hook} restart keeps a pending finished until the new run completes`, async () => {
        clock = installTestClock()
        let restarted = false
        const restart = () => {
          if (!restarted) {
            restarted = true
            a.setWithVelocity(0)
          }
        }
        const a: SpringAnimation = spring(0, 100, {
          onComplete: () => {
            if (hook === 'onComplete') restart()
          },
          onRest: () => {
            if (hook === 'onRest') restart()
          },
        })
        springs.push(a)
        a.start()
        const firstRun = a.finished
        let firstResolved = false
        void firstRun.then(() => (firstResolved = true))
        while (!restarted) clock.nextFrame()
        let resolved = false
        void a.finished.then(() => (resolved = true))
        await flush()
        expect(a.isAnimating()).toBe(true)
        expect(firstResolved).toBe(true)
        expect(a.finished).not.toBe(firstRun)
        expect(resolved).toBe(false)

        clock.runAll()
        await flush()
        expect(resolved).toBe(true)
        expect(a.getValue()).toBe(0)
      })
    }
  })

  // F903: NaN / negative rest thresholds made the rest check permanently false
  describe('invalid rest thresholds', () => {
    for (const cfg of [{ restDelta: NaN }, { restDelta: -1 }, { restSpeed: NaN }, { restSpeed: -1 }]) {
      it(`spring completes with ${JSON.stringify(cfg)} (NaN prints as null)`, () => {
        clock = installTestClock()
        const a = spring(0, 100, cfg)
        springs.push(a)
        a.start()
        clock.advance(60_000)
        expect(a.isComplete()).toBe(true)
        expect(a.getValue()).toBe(100)
        expect(globalLoop.size).toBe(0)
      })
    }

    it('stepSpring falls back to the default thresholds', () => {
      let x = 0
      let v = 0
      let rest = false
      for (let i = 0; i < 2000 && !rest; i++) {
        const r = stepSpring(x, v, 100, { restDelta: NaN, restSpeed: -5 }, 1 / 60)
        x = r.position
        v = r.velocity
        rest = r.isRest
      }
      expect(rest).toBe(true)
    })

    it('restThreshold keeps valid values (including 0)', () => {
      expect(restThreshold(0, 0.01)).toBe(0)
      expect(restThreshold(0.5, 0.01)).toBe(0.5)
      expect(restThreshold(undefined, 0.01)).toBe(0.01)
    })
  })
})
