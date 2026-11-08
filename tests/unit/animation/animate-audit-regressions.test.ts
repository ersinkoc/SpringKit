import { describe, it, expect, afterEach } from 'vitest'
import { installTestClock, type TestClock } from '../../../src/testing'
import { animate } from '../../../src/animation/animate'

const flush = async () => {
  for (let i = 0; i < 10; i++) await Promise.resolve()
}

const xOf = (el: HTMLElement) => {
  const m = /translate3d\(([-\d.e]+)px/.exec(el.style.transform)
  return m ? parseFloat(m[1]!) : NaN
}

describe('animate() audit regressions', () => {
  let clock: TestClock | null = null
  const els: HTMLElement[] = []

  const mk = () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    els.push(el)
    return el
  }

  /** Advance frame by frame, letting keyframe continuations (microtasks) run */
  const step = async (ms: number) => {
    for (let t = 0; t < ms; t += 16) {
      clock!.advance(16)
      for (let i = 0; i < 6; i++) await Promise.resolve()
    }
  }

  afterEach(() => {
    els.splice(0).forEach((el) => el.remove())
    clock?.uninstall()
    clock = null
  })

  // F1101: style.setProperty()/getPropertyValue() need kebab-case; camelCase
  // names from pxProperties (fontSize, paddingTop...) were silently ignored
  it('reads and writes camelCase style properties', () => {
    clock = installTestClock()
    const el = mk()
    el.style.fontSize = '10px'
    el.style.paddingTop = '4px'
    const firstFontSize: number[] = []
    animate(el, { fontSize: 30, paddingTop: 20 }, {
      onUpdate: (v) => {
        if (v.fontSize !== undefined) firstFontSize.push(v.fontSize)
      },
    })
    clock.advance(4000)

    expect(el.style.fontSize).toBe('30px')
    expect(el.style.paddingTop).toBe('20px')
    // starts from the current value instead of 0
    expect(firstFontSize[0]).toBeCloseTo(10, 0)
  })

  it('keeps custom property names as they are', () => {
    clock = installTestClock()
    const el = mk()
    animate(el, { '--myVar': 7 })
    clock.advance(4000)
    expect(el.style.getPropertyValue('--myVar')).toBe('7')
  })

  // F1102: a settled property kept being re-applied through the still-running
  // properties of the same call, clobbering a later call that owns it
  it('does not re-apply a settled property over a later animate() call', async () => {
    clock = installTestClock()
    const longOpacity = Array.from({ length: 60 }, (_, i) => i % 2)
    const el = mk()
    const a = animate(el, { x: 50, opacity: longOpacity })
    await step(4000) // x has settled, opacity keyframes keep A running
    expect(a.isAnimating()).toBe(true)

    const b = animate(el, { x: 300 })
    let guard = 0
    while (b.isAnimating() && guard++ < 1000) await step(16)
    await step(160)

    expect(a.isAnimating()).toBe(true)
    expect(xOf(el)).toBeCloseTo(300, 1)

    // pause()/resume() must not restart the settled property either
    a.pause()
    await step(64)
    a.resume()
    await step(320)
    expect(xOf(el)).toBeCloseTo(300, 1)
    a.stop()
  })

  // F1103: a call whose properties were all taken over is interrupted, so
  // like stop() it must not report completion (finished still settles)
  it('does not call onComplete of an animation superseded by a later call', async () => {
    clock = installTestClock()
    const el = mk()
    const log: string[] = []
    const a = animate(el, { x: 100 }, { onComplete: () => log.push('A.complete') })
    void a.finished.then(() => log.push('A.finished'))
    clock.advance(100)
    animate(el, { x: 300 }, { onComplete: () => log.push('B.complete') })

    clock.advance(32)
    await flush()
    expect(log).toEqual(['A.finished'])

    clock.advance(6000)
    await flush()
    expect(log).toEqual(['A.finished', 'B.complete'])
  })

  it('still completes a partially superseded animation once its remaining properties finish', async () => {
    clock = installTestClock()
    const el = mk()
    const log: string[] = []
    animate(el, { x: 100, opacity: 0.5 }, { onComplete: () => log.push('A.complete') })
    clock.advance(100)
    animate(el, { x: 300 })
    clock.advance(6000)
    await flush()
    expect(log).toEqual(['A.complete'])
  })
})
