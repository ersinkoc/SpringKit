import { describe, it, expect, afterEach } from 'vitest'
import { createTrail, gridStagger, spiralStagger, linearStagger } from '@oxog/springkit'
import { installTestClock, type TestClock } from '../../../src/testing'

// Evidence-audit regressions (F1301-F1303) for stagger-patterns.ts and trail.ts

describe('F1301: gridStagger/spiralStagger sanitise `columns`', () => {
  const dirs = ['row', 'column', 'diagonal', 'radial'] as const
  const origins = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'] as const
  const sorted = (a: number[]) => [...a].sort((x, y) => x - y)

  it('keeps valid columns unchanged', () => {
    gridStagger({ count: 6, columns: 3, direction: 'diagonal', delay: 50 }).forEach((v, i) =>
      expect(v).toBeCloseTo([0, 50, 100, 50, 100, 150][i]!, 6)
    )
    expect(spiralStagger({ count: 6, columns: 2, delay: 50 })).toEqual([0, 50, 250, 100, 200, 150])
  })

  it('returns finite, non-negative grid delays for 0 / NaN / negative / Infinity columns', () => {
    for (const direction of dirs) {
      for (const origin of origins) {
        const oneColumn = gridStagger({ count: 6, columns: 1, direction, origin, delay: 50 })
        for (const columns of [0, NaN, -1, -Infinity, 0.5]) {
          const result = gridStagger({ count: 6, columns, direction, origin, delay: 50 })
          expect(result.every((d) => Number.isFinite(d) && d >= 0)).toBe(true)
          expect(result).toEqual(oneColumn)
        }
        expect(gridStagger({ count: 6, columns: Infinity, direction, origin, delay: 50 })).toEqual(
          gridStagger({ count: 6, columns: 6, direction, origin, delay: 50 })
        )
      }
    }
  })

  it('floors fractional columns so every spiral cell is visited exactly once', () => {
    for (const direction of ['clockwise', 'counter-clockwise'] as const) {
      expect(spiralStagger({ count: 6, columns: 2.5, direction, delay: 50 })).toEqual(
        spiralStagger({ count: 6, columns: 2, direction, delay: 50 })
      )
      for (const columns of [0, NaN, -3, Infinity, 1, 2.5, 100]) {
        const result = spiralStagger({ count: 6, columns, direction, delay: 50 })
        expect(sorted(result)).toEqual([0, 50, 100, 150, 200, 250])
        expect(Object.keys(result)).toEqual(['0', '1', '2', '3', '4', '5'])
      }
    }
  })

  it('handles count 0 / 1 with invalid columns', () => {
    expect(gridStagger({ count: 0, columns: 0 })).toEqual([])
    expect(gridStagger({ count: 1, columns: NaN })).toEqual([0])
    expect(spiralStagger({ count: 1, columns: Infinity })).toEqual([0])
  })
})

describe('F1302: spiralStagger tolerates non-natural counts', () => {
  it('returns [] for negative / NaN counts instead of throwing', () => {
    expect(spiralStagger({ count: -1, columns: 3 })).toEqual([])
    expect(spiralStagger({ count: NaN, columns: 3 })).toEqual([])
    expect(spiralStagger({ count: -Infinity, columns: 3 })).toEqual([])
    expect(spiralStagger({ count: 0, columns: 3 })).toEqual([])
  })

  it('matches the sibling patterns for a fractional count', () => {
    const fractional = spiralStagger({ count: 2.5, columns: 3, delay: 50 })
    expect(fractional).toHaveLength(linearStagger({ count: 2.5 }).length)
    expect(fractional).toEqual([0, 50, 100])
  })
})

describe('F1303: an idle trail does not re-notify subscribers', () => {
  let clock: TestClock
  afterEach(() => clock.uninstall())

  const notificationsAfter = (setup: (t: ReturnType<typeof createTrail>) => void): number => {
    const trail = createTrail(3, { followDelay: 2 })
    let n = 0
    trail.subscribe(() => {
      n++
    })
    setup(trail)
    n = 0
    clock.advance(1000)
    trail.destroy()
    return n
  }

  it('is silent after construction and after jump()', () => {
    clock = installTestClock()
    expect(notificationsAfter(() => {})).toBe(0)
    expect(notificationsAfter((t) => t.jump(100))).toBe(0)
    expect(notificationsAfter((t) => {
      t.jump(5)
      t.jump(-5)
    })).toBe(0)
  })

  it('still animates followers in order and settles after a jump', () => {
    clock = installTestClock()
    const trail = createTrail(3, { followDelay: 3 })
    trail.set(100)
    clock.advance(200)
    trail.jump(7)
    clock.advance(3000)
    expect(trail.getValues()).toEqual([7, 7, 7])
    trail.set(50)
    clock.advance(150)
    const mid = trail.getValues()
    expect(mid[0]!).toBeGreaterThan(mid[2]!)
    clock.advance(5000)
    expect(trail.getValues().map((x) => Math.round(x * 100) / 100)).toEqual([50, 50, 50])
    trail.destroy()
  })
})
