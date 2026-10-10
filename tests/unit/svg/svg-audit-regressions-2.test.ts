import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMorph, createMorphSequence, createPathAnimation } from '@oxog/springkit'
import { installTestClock, type TestClock } from '../../../src/testing/index'

// jsdom has no SVG geometry, so createMorph uses its linear-sampling fallback
// and the path element's getTotalLength is faked.
const A = 'M0 0 L100 0'
const C = 'M0 100 L100 100'

function pathEl(): SVGPathElement {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'path') as SVGPathElement
  ;(el as unknown as { getTotalLength: () => number }).getTotalLength = () => 200
  return el
}
type PathAnimation = ReturnType<typeof createPathAnimation>
const flush = async () => {
  for (let i = 0; i < 10; i++) await Promise.resolve()
}

describe('createMorph audit regressions, round 2 (F3101, F3102)', () => {
  let clock: TestClock

  beforeEach(() => {
    clock = installTestClock()
  })

  afterEach(() => {
    clock.uninstall()
    vi.restoreAllMocks()
  })

  it('F3101: a destroyed controller ignores setProgress() and does not retain late subscribers', () => {
    const morph = createMorph(A, { samples: 2 })
    morph.morphTo(C)
    morph.destroy()
    const before = morph.getPath()
    const late = vi.fn()
    morph.subscribe(late)
    // the initial call still reports the (frozen) path once
    expect(late).toHaveBeenCalledTimes(1)
    late.mockClear()
    morph.setProgress(1)
    expect(morph.getPath()).toBe(before)
    expect(late).not.toHaveBeenCalled()
  })

  it('F3101: morphTo() after destroy() and the sequence wrapper are inert', () => {
    const onProgress = vi.fn()
    const morph = createMorph(A, { samples: 2, onProgress })
    morph.destroy()
    const before = morph.getPath()
    morph.morphTo(C)
    clock.runAll()
    expect(morph.getPath()).toBe(before)
    expect(onProgress).not.toHaveBeenCalled()

    const seq = createMorphSequence([A, C], { samples: 2 })
    seq.destroy()
    const p = seq.getPath()
    expect(() => seq.morphToNext()).not.toThrow()
    clock.runAll()
    expect(seq.getPath()).toBe(p)
  })

  it('F3101: onComplete is not fired when destroy() is called from a notification of the final frame', () => {
    let completed = 0
    const morph = createMorph(A, { samples: 2, onComplete: () => { completed++ } })
    let done = false
    morph.subscribe(() => {
      if (!done && morph.getProgress() >= 0.999) {
        done = true
        morph.destroy()
      }
    })
    morph.morphTo(C)
    clock.runAll()
    expect(completed).toBe(0)

    // a live controller still completes exactly once
    let live = 0
    const m2 = createMorph(A, { samples: 2, onComplete: () => { live++ } })
    m2.morphTo(C)
    clock.runAll()
    expect(live).toBe(1)
    m2.destroy()
  })

  it('F3102: subscribing the same callback twice keeps two registrations', () => {
    const morph = createMorph(A, { samples: 2 })
    const cb = vi.fn()
    const u1 = morph.subscribe(cb)
    const u2 = morph.subscribe(cb)
    cb.mockClear()
    morph.setProgress(0.5)
    expect(cb).toHaveBeenCalledTimes(2)

    // a handle only removes its own registration, however often it is called
    u1()
    u1()
    cb.mockClear()
    morph.setProgress(0.7)
    expect(cb).toHaveBeenCalledTimes(1)
    u2()
    cb.mockClear()
    morph.setProgress(0.9)
    expect(cb).not.toHaveBeenCalled()
    morph.destroy()
  })
})

describe('createPathAnimation audit regressions, round 2 (F3103)', () => {
  let clock: TestClock

  beforeEach(() => {
    clock = installTestClock({ timers: true })
  })

  afterEach(() => {
    clock.uninstall()
    vi.restoreAllMocks()
  })

  function build(act: (a: PathAnimation) => void, onComplete?: () => void) {
    const el = pathEl()
    const h: { a?: PathAnimation } = {}
    let fired = false
    const a = (h.a = createPathAnimation(el, {
      onComplete,
      onUpdate: (v) => {
        if (v > 0.5 && !fired) {
          fired = true
          act(h.a!)
        }
      },
    }))
    let resolved = false
    void a.play().then(() => { resolved = true })
    return { a, el, isResolved: () => resolved }
  }

  it('F3103: reset() made from inside onUpdate stops the animation at 0', async () => {
    const t = build((a) => a.reset())
    clock.advance(5000)
    await flush()
    expect(t.a.get()).toBe(0)
    expect(t.el.style.strokeDashoffset).toBe('200')
    expect(t.a.isAnimating()).toBe(false)
    expect(t.isResolved()).toBe(true)

    // and it can be played again from 0
    const p = t.a.play()
    clock.nextFrame()
    expect(t.a.get()).toBeLessThan(0.5)
    clock.advance(5000)
    await p
    expect(t.a.get()).toBeCloseTo(1, 3)
    t.a.destroy()
  })

  it('F3103: an instant set(v) from inside onUpdate lands on v (latest call wins, no onComplete)', async () => {
    const onComplete = vi.fn()
    const t = build((a) => {
      a.set(0.9)
      a.set(0.3)
    }, onComplete)
    clock.advance(5000)
    await flush()
    expect(t.a.get()).toBeCloseTo(0.3, 10)
    expect(Number(t.el.style.strokeDashoffset)).toBeCloseTo(140, 6)
    expect(t.a.isAnimating()).toBe(false)
    expect(onComplete).not.toHaveBeenCalled()
    t.a.destroy()
  })

  it('F3103: an animated request made right after the re-entrant reset is not cancelled', async () => {
    const t = build((a) => {
      a.reset()
      void a.play(1)
    })
    clock.advance(5000)
    await flush()
    expect(t.a.get()).toBeCloseTo(1, 3)
    expect(t.a.isAnimating()).toBe(false)
    t.a.destroy()
  })
})
