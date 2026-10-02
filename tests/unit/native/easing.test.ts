import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  springEasing,
  springTransition,
  supportsLinearEasing,
} from '../../../src/native/easing'
import { solveSpring, defineSpring } from '../../../src/native/solver'
import { animateNative } from '../../../src/native/animate-native'

/** Evaluate a CSS linear() easing string at progress p (CSS Easing Level 2 rules) */
function evalLinear(easing: string, p: number): number {
  const body = easing.slice('linear('.length, -1)
  const stops = body.split(',').map((part, i, all) => {
    const [v, pct] = part.trim().split(/\s+/)
    const t = pct ? parseFloat(pct) / 100 : i === 0 ? 0 : i === all.length - 1 ? 1 : NaN
    return [t, parseFloat(v!)] as [number, number]
  })
  for (let i = 1; i < stops.length; i++) {
    const [t0, v0] = stops[i - 1]!
    const [t1, v1] = stops[i]!
    if (p <= t1) return t1 === t0 ? v1 : v0 + ((v1 - v0) * (p - t0)) / (t1 - t0)
  }
  return stops[stops.length - 1]![1]
}

describe('springEasing', () => {
  it('produces a CSS linear() easing that tracks the true spring curve', () => {
    const cfg = { stiffness: 220, damping: 12 }
    const { easing, duration } = springEasing(cfg)
    const solver = solveSpring(cfg, 0, 1)

    expect(easing.startsWith('linear(0, ')).toBe(true)
    expect(easing.endsWith(', 1)')).toBe(true)
    expect(duration).toBe(Math.round(solver.duration))

    for (let p = 0; p <= 1; p += 0.01) {
      expect(Math.abs(evalLinear(easing, p) - solver.at(p * duration).value)).toBeLessThan(0.004)
    }
  })

  it('captures overshoot for bouncy springs', () => {
    const { easing } = springEasing(defineSpring({ bounce: 0.4 }))
    const values = easing.match(/-?\d+(\.\d+)?(?= )/g)!.map(Number)
    expect(Math.max(...values)).toBeGreaterThan(1.05)
  })

  it('emits few stops for smooth springs (compact output)', () => {
    const { easing } = springEasing({ stiffness: 100, damping: 20 })
    expect(easing.split(',').length).toBeLessThan(40)
  })

  it('emits monotonically increasing stop positions', () => {
    const { easing } = springEasing(defineSpring({ bounce: 0.3 }))
    const pcts = [...easing.matchAll(/ (\d+(\.\d+)?)%/g)].map((m) => parseFloat(m[1]!))
    for (let i = 1; i < pcts.length; i++) expect(pcts[i]!).toBeGreaterThan(pcts[i - 1]!)
  })

  it('is cached for identical configs', () => {
    expect(springEasing({ stiffness: 333 })).toBe(springEasing({ stiffness: 333 }))
  })

  it('stringifies to "<duration>ms <easing>"', () => {
    const e = springEasing({ stiffness: 250, damping: 20 })
    expect(String(e)).toBe(`${e.duration}ms ${e.easing}`)
  })

  it('respects precision', () => {
    const coarse = springEasing({ stiffness: 200, damping: 6, precision: 0.02 })
    const fine = springEasing({ stiffness: 200, damping: 6, precision: 0.0005 })
    expect(fine.easing.length).toBeGreaterThan(coarse.easing.length)
  })
})

describe('springTransition', () => {
  it('builds a transition list for multiple properties', () => {
    const e = springEasing({ stiffness: 180, damping: 18 })
    expect(springTransition(['transform', 'opacity'], { stiffness: 180, damping: 18 })).toBe(
      `transform ${e.duration}ms ${e.easing}, opacity ${e.duration}ms ${e.easing}`
    )
    expect(springTransition('transform', { stiffness: 180, damping: 18 })).toBe(
      `transform ${e.duration}ms ${e.easing}`
    )
  })
})

describe('supportsLinearEasing', () => {
  it('returns a boolean without throwing', () => {
    expect(typeof supportsLinearEasing()).toBe('boolean')
  })
})

describe('animateNative', () => {
  afterEach(() => vi.restoreAllMocks())

  it('falls back to applying the final keyframe when WAAPI is unavailable', async () => {
    const el = document.createElement('div')
    ;(el as unknown as { animate?: unknown }).animate = undefined
    const onComplete = vi.fn()
    const controls = animateNative(el, { opacity: [0, 0.5], transform: ['none', 'translateX(10px)'] }, { onComplete })
    await controls.finished
    expect(el.style.opacity).toBe('0.5')
    expect(el.style.transform).toBe('translateX(10px)')
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(controls.animation).toBeNull()
  })

  it('handles keyframe arrays and custom properties in the fallback', async () => {
    const el = document.createElement('div')
    ;(el as unknown as { animate?: unknown }).animate = undefined
    await animateNative(el, [{ '--x': '0px' }, { '--x': '20px', offset: 1 }]).finished
    expect(el.style.getPropertyValue('--x')).toBe('20px')
  })

  it('drives element.animate with the compiled spring and commits styles', async () => {
    const el = document.createElement('div')
    let resolveFinished!: () => void
    const fake = {
      finished: new Promise<void>((r) => (resolveFinished = r)),
      commitStyles: vi.fn(),
      cancel: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      finish: vi.fn(),
      reverse: vi.fn(),
      currentTime: 0 as number | null,
    }
    const animate = vi.fn(() => fake as unknown as Animation)
    ;(el as unknown as { animate: typeof animate }).animate = animate

    const cfg = { stiffness: 260, damping: 20 }
    const onComplete = vi.fn()
    const controls = animateNative(el, { opacity: [0, 1] }, { ...cfg, delay: 30, onComplete })
    const compiled = springEasing(cfg)

    expect(animate).toHaveBeenCalledTimes(1)
    const timing = (animate.mock.calls[0] as unknown[])[1] as KeyframeAnimationOptions
    expect(timing.duration).toBe(compiled.duration)
    expect(timing.delay).toBe(30)
    expect(timing.fill).toBe('both')

    controls.seek(100)
    expect(fake.currentTime).toBe(130)

    resolveFinished()
    await controls.finished
    expect(fake.commitStyles).toHaveBeenCalled()
    expect(fake.cancel).toHaveBeenCalled()
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('resolves (does not reject) when cancelled', async () => {
    const el = document.createElement('div')
    const fake = {
      finished: Promise.reject(new DOMException('aborted', 'AbortError')),
      commitStyles: vi.fn(),
      cancel: vi.fn(),
    }
    ;(el as unknown as { animate: () => unknown }).animate = () => fake
    const onComplete = vi.fn()
    await expect(animateNative(el, { opacity: [0, 1] }, { onComplete }).finished).resolves.toBeUndefined()
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('uses zero duration when the user prefers reduced motion', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (q: string) => ({ matches: q.includes('reduce') }) as MediaQueryList
    )
    const el = document.createElement('div')
    const animate = vi.fn(() => ({ finished: new Promise(() => {}) }) as unknown as Animation)
    ;(el as unknown as { animate: typeof animate }).animate = animate
    const controls = animateNative(el, { opacity: [0, 1] }, { delay: 200 })
    const timing = (animate.mock.calls[0] as unknown[])[1] as KeyframeAnimationOptions
    expect(timing.duration).toBe(0)
    expect(timing.delay).toBe(0)
    expect(controls.duration).toBe(0)
  })
})
