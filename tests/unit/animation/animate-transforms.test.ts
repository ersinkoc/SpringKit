import { describe, it, expect, afterEach } from 'vitest'
import { animate } from '../../../src/animation/animate'
import { installTestClock, type TestClock } from '../../../src/testing/index'

let clock: TestClock | null = null
afterEach(() => {
  clock?.uninstall()
  clock = null
})

describe('animate() transform properties', () => {
  it('renders skew and scaleZ (they were accepted but never written)', async () => {
    clock = installTestClock()
    const el = document.createElement('div')
    const controls = animate(el, { skew: 20, scaleZ: 2 }, { stiffness: 300, damping: 30 })
    clock.runAll()
    await controls.finished
    expect(el.style.transform).toContain('skew(20deg)')
    expect(el.style.transform).toContain('scaleZ(2)')
  })
})

describe('animate() transform start values', () => {
  it('scaleZ starts from 1 (identity), like the other scale properties', () => {
    clock = installTestClock()
    const el = document.createElement('div')
    const seen: number[] = []
    const controls = animate(el, { scaleZ: 2 }, { onUpdate: (v) => seen.push(v.scaleZ!) })
    clock.runAll()
    expect(Math.min(...seen)).toBeGreaterThanOrEqual(1)
    controls.stop()
  })
})

describe('animate() called again on a property that is still animating', () => {
  it('the latest call owns the property: an older, slower animation cannot overwrite it', async () => {
    clock = installTestClock()
    const el = document.createElement('div')
    // Slow, soft animation toward 100...
    const first = animate(el, { x: 100, opacity: 0.5 }, { stiffness: 20, damping: 4 })
    clock.advance(50)
    // ...interrupted by a fast one back to 0
    const second = animate(el, { x: 0 }, { stiffness: 400, damping: 40 })
    clock.runAll()
    await second.finished
    await first.finished
    expect(el.style.transform).toBe('translate3d(0px, 0px, 0px)')
    // The other property of the first call still completes
    expect(el.style.opacity).toBe('0.5')
  })
})

describe('animate() pause() / resume()', () => {
  it('keeps the velocity: a pause/resume between frames does not change the motion', () => {
    clock = installTestClock()
    const a = document.createElement('div')
    const b = document.createElement('div')
    let va = 0
    let vb = 0
    const ca = animate(a, { x: [0, 100] }, { stiffness: 170, damping: 26, onUpdate: (v) => (va = v.x!) })
    const cb = animate(b, { x: [0, 100] }, { stiffness: 170, damping: 26, onUpdate: (v) => (vb = v.x!) })
    clock.advance(100)
    expect(vb).toBeCloseTo(va, 9)
    cb.pause()
    cb.resume()
    clock.advance(50)
    expect(vb).toBeCloseTo(va, 6)
    ca.stop()
    cb.stop()
  })
})
