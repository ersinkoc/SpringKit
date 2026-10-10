import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMorph, createPathAnimation, preparePathForAnimation } from '@oxog/springkit'
import { installTestClock, type TestClock } from '../../../src/testing/index'

// jsdom has no SVG geometry, so createMorph uses its linear-sampling fallback
// and the path element's getTotalLength is faked.
const A = 'M0 0 L100 0'
const C = 'M0 100 L100 100'
const firstY = (d: string) => Number(/M\s*[-\d.e]+\s+([-\d.e]+)/.exec(d)![1])

describe('createMorph audit regressions (F1501, F1502)', () => {
  let clock: TestClock

  beforeEach(() => {
    clock = installTestClock()
  })

  afterEach(() => {
    clock.uninstall()
    vi.restoreAllMocks()
  })

  it('F1501: morphTo() from inside onComplete animates instead of snapping to the target', async () => {
    const holder: { morph?: ReturnType<typeof createMorph> } = {}
    let fired = 0
    const morph = (holder.morph = createMorph(A, {
      samples: 2,
      onComplete: () => {
        fired++
        if (fired === 1) holder.morph!.morphTo(C)
      },
    }))
    morph.morphTo(A)
    clock.advance(10000)
    // the re-entrant morph starts right after the notification
    await Promise.resolve()
    clock.nextFrame()
    expect(firstY(morph.getPath())).toBeLessThan(50)
    clock.runAll()
    expect(firstY(morph.getPath())).toBeCloseTo(100, 3)
    expect(fired).toBe(2)
    morph.destroy()
  })

  it('F1501: the latest re-entrant morphTo wins and destroy() cancels it', async () => {
    const holder: { morph?: ReturnType<typeof createMorph> } = {}
    let fired = 0
    const morph = (holder.morph = createMorph(A, {
      samples: 2,
      onComplete: () => {
        fired++
        if (fired === 1) {
          holder.morph!.morphTo(C)
          holder.morph!.morphTo(A)
        }
      },
    }))
    morph.morphTo(C)
    clock.advance(10000)
    await Promise.resolve()
    clock.runAll()
    expect(firstY(morph.getPath())).toBeCloseTo(0, 3)

    const second = (holder.morph = createMorph(A, {
      samples: 2,
      onComplete: () => holder.morph!.morphTo(C),
    }))
    second.morphTo(C)
    clock.advance(10000)
    const before = second.getPath()
    second.destroy()
    await Promise.resolve()
    expect(second.getPath()).toBe(before)
    morph.destroy()
  })

  it('F1502: a throwing onProgress does not stop the path update or the subscribers', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const seen: string[] = []
    const morph = createMorph(A, {
      samples: 2,
      onProgress: () => {
        throw new Error('boom')
      },
    })
    morph.subscribe((d) => seen.push(d))
    const initial = seen.length
    morph.morphTo(C)
    clock.advance(10000)
    expect(seen.length - initial).toBeGreaterThan(5)
    expect(morph.getPath()).toBe('M 0 100 L 100 100')
    morph.destroy()
  })
})

describe('path animation audit regressions (F1503)', () => {
  const makePath = (length = 200) => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'path') as SVGPathElement
    ;(el as unknown as { getTotalLength: () => number }).getTotalLength = () => length
    return el
  }

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('F1503: set() with a non-finite value is treated as 0, never stored as NaN/Infinity', () => {
    for (const bad of [NaN, Infinity, -Infinity]) {
      const el = makePath()
      const anim = createPathAnimation(el)
      anim.set(0.5)
      anim.set(bad)
      expect(anim.get()).toBe(0)
      expect(el.style.strokeDashoffset).toBe('200')
      anim.destroy()
    }
  })

  it('F1503: preparePathForAnimation() with a non-finite progress hides the path', () => {
    const el = makePath()
    preparePathForAnimation(el, NaN)
    expect(el.style.strokeDashoffset).toBe('200')
    preparePathForAnimation(el, 0.25)
    expect(el.style.strokeDashoffset).toBe('150')
  })
})
