import { describe, it, expect, afterEach } from 'vitest'
import { stagger } from '../../../src/animation/sequence'
import { spring } from '../../../src/core/spring'
import { installTestClock, type TestClock } from '../../../src/testing/index'

let clock: TestClock | null = null
afterEach(() => {
  clock?.uninstall()
  clock = null
})

/** Run stagger() and record when each item's animation actually started */
function startTimes(count: number, options: Parameters<typeof stagger>[2]) {
  clock = installTestClock({ timers: true, startTime: 0 })
  const started: number[] = new Array(count).fill(-1)
  const done = stagger(
    Array.from({ length: count }, (_, i) => i),
    (item) =>
      spring(0, 1, {
        stiffness: 400,
        damping: 40,
        onStart: () => {
          started[item] = performance.now()
        },
      }),
    options
  )
  clock.runAll()
  return { started, done }
}

describe('stagger() delays', () => {
  it('spaces items by a numeric delay', async () => {
    const { started, done } = startTimes(4, { delay: 50 })
    expect(started).toEqual([0, 50, 100, 150])
    await done
  })

  it('fans out symmetrically from the center', async () => {
    const { started, done } = startTimes(5, { delay: 40, from: 'center' })
    expect(started).toEqual([80, 40, 0, 40, 80])
    await done
  })

  it('starts from the last item', async () => {
    const { started, done } = startTimes(3, { delay: 30, from: 'last' })
    expect(started).toEqual([60, 30, 0])
    await done
  })

  it('passes the start-order position to a delay function', async () => {
    const { started, done } = startTimes(3, { delay: (i) => i * i * 10 })
    expect(started).toEqual([0, 10, 40])
    await done
  })
})
