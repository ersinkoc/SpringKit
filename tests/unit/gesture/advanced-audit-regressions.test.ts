import { describe, it, expect, vi, afterEach } from 'vitest'
import { createPinchGesture, createRotateGesture, type RotateState } from '../../../src/gesture/advanced'
import { installTestClock, type TestClock } from '../../../src/testing/index'

let clock: TestClock | null = null
afterEach(() => {
  clock?.uninstall()
  clock = null
  document.body.textContent = ''
})

type Pt = [number, number, number]
const touch = (type: string, pts: Pt[]) =>
  new TouchEvent(type, {
    changedTouches: pts.map(([identifier, clientX, clientY]) => ({ identifier, clientX, clientY })) as unknown as Touch[],
    bubbles: true,
    cancelable: true,
  })

describe('rotate threshold keeps tracking once passed (F201)', () => {
  const pair = (deg: number): Pt[] => {
    const r = (deg * Math.PI) / 180
    return [[0, 0, 0], [1, 100 * Math.cos(r), 100 * Math.sin(r)]]
  }

  /** gestures: a list of gestures, each a list of finger angles (deg) */
  function run(threshold: number, gestures: number[][]) {
    clock = installTestClock({ startTime: 0 })
    const el = document.createElement('div')
    document.body.appendChild(el)
    const perGesture: number[][] = []
    const ends: number[] = []
    const g = createRotateGesture(el, {
      threshold,
      onRotateStart: () => perGesture.push([]),
      onRotate: (s) => perGesture[perGesture.length - 1]!.push(s.angle),
      onRotateEnd: (s) => ends.push(s.angle),
    })
    for (const degrees of gestures) {
      el.dispatchEvent(touch('touchstart', pair(0)))
      for (const d of degrees) {
        clock.advance(16)
        el.dispatchEvent(touch('touchmove', pair(d)))
      }
      clock.advance(16)
      el.dispatchEvent(touch('touchend', [[0, 0, 0], [1, 0, 0]]))
    }
    g.destroy()
    return { perGesture, ends }
  }

  const near = (actual: number[], expected: number[]) => {
    expect(actual).toHaveLength(expected.length)
    actual.forEach((v, i) => expect(v).toBeCloseTo(expected[i]!, 6))
  }

  it('follows the fingers back below the threshold and ends at their angle', () => {
    const r = run(10, [[15, 5]])
    near(r.perGesture[0]!, [15, 5])
    near(r.ends, [5])
  })

  it('keeps tracking through zero and the other direction', () => {
    const r = run(10, [[15, 5, 0, -20]])
    near(r.perGesture[0]!, [15, 5, 0, -20])
    near(r.ends, [-20])
  })

  it('reports nothing while the rotation stays below the threshold', () => {
    const r = run(10, [[3, 9, 2]])
    expect(r.perGesture[0]).toEqual([])
    near(r.ends, [0])
  })

  it('applies the threshold again to the next gesture, carrying the offset', () => {
    const r = run(10, [[15], [4, 12]])
    near(r.perGesture[0]!, [15])
    near(r.perGesture[1]!, [27])
    near(r.ends, [15, 27])
  })
})

describe.each(['pinch', 'rotate'] as const)('%s: touchcancel ends as cancelled (F202)', (kind) => {
  const both: Pt[] = [[0, 0, 0], [1, 100, 0]]

  function setup() {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const onEnd = vi.fn()
    const g = kind === 'pinch'
      ? createPinchGesture(el, { onPinchEnd: onEnd })
      : createRotateGesture(el, { onRotateEnd: onEnd })
    return { el, onEnd, g }
  }

  it('reports cancelled = true for touchcancel and false for touchend', () => {
    const a = setup()
    a.el.dispatchEvent(touch('touchstart', both))
    a.el.dispatchEvent(touch('touchcancel', both))
    expect(a.onEnd).toHaveBeenCalledTimes(1)
    expect(a.onEnd.mock.calls[0]![0].cancelled).toBe(true)
    expect(a.onEnd.mock.calls[0]![0].last).toBe(true)
    a.g.destroy()

    const b = setup()
    b.el.dispatchEvent(touch('touchstart', both))
    b.el.dispatchEvent(touch('touchend', both))
    expect(b.onEnd.mock.calls[0]![0].cancelled).toBe(false)
    b.g.destroy()
  })

  it('does not stick for the next gesture and ignores a cancel that leaves two fingers', () => {
    const { el, onEnd, g } = setup()
    el.dispatchEvent(touch('touchstart', both))
    el.dispatchEvent(touch('touchcancel', both))
    el.dispatchEvent(touch('touchstart', [[0, 0, 0], [1, 100, 0]]))
    el.dispatchEvent(touch('touchstart', [[2, 50, 50]]))
    el.dispatchEvent(touch('touchcancel', [[2, 50, 50]]))
    expect(onEnd).toHaveBeenCalledTimes(1)
    el.dispatchEvent(touch('touchend', both))
    expect(onEnd).toHaveBeenCalledTimes(2)
    expect(onEnd.mock.calls[1]![0].cancelled).toBe(false)
    g.destroy()
  })

  it('removes the touchcancel listener on destroy', () => {
    const { el, onEnd, g } = setup()
    el.dispatchEvent(touch('touchstart', both))
    g.destroy()
    el.dispatchEvent(touch('touchcancel', both))
    expect(onEnd).not.toHaveBeenCalled()
  })
})

describe('rotate with fingers on the same point (F203)', () => {
  const same: Pt[] = [[0, 100, 100], [1, 100, 100]]
  const at = (deg: number, r = 100): Pt[] => {
    const a = (deg * Math.PI) / 180
    return [[0, 100, 100], [1, 100 + r * Math.cos(a), 100 + r * Math.sin(a)]]
  }

  function harness() {
    clock = installTestClock({ startTime: 0 })
    const el = document.createElement('div')
    document.body.appendChild(el)
    const angles: number[] = []
    const states: RotateState[] = []
    const g = createRotateGesture(el, {
      onRotate: (s) => { angles.push(s.angle); states.push(s) },
    })
    const send = (type: string, pts: Pt[]) => {
      clock!.advance(16)
      const ev = touch(type, pts)
      el.dispatchEvent(ev)
      return ev
    }
    return { angles, states, g, send }
  }

  it('measures rotation from the first real angle after a coincident start', () => {
    const h = harness()
    h.send('touchstart', same)
    const ev = h.send('touchmove', same)
    expect(ev.defaultPrevented).toBe(true)
    expect(h.angles).toEqual([])
    h.send('touchmove', at(90))
    h.send('touchmove', at(120))
    expect(h.angles).toHaveLength(1)
    expect(h.angles[0]).toBeCloseTo(30, 6)
    expect(h.states[0]!.initialAngle).toBeCloseTo(90, 6)
    h.g.destroy()
  })

  it('does not jump when the fingers cross through the same point mid-gesture', () => {
    const h = harness()
    h.send('touchstart', at(45))
    h.send('touchmove', at(60))
    h.send('touchmove', same)
    h.send('touchmove', at(75))
    expect(h.angles).toHaveLength(2)
    expect(h.angles[0]).toBeCloseTo(15, 6)
    expect(h.angles[1]).toBeCloseTo(30, 6)
    h.g.destroy()
  })

  it('re-bases when lifting a finger leaves a coincident pair', () => {
    const h = harness()
    h.send('touchstart', [[0, 100, 100], [1, 200, 100]])
    h.send('touchstart', [[2, 100, 100]])
    h.send('touchend', [[1, 200, 100]])
    h.send('touchmove', [[2, 100, 200]])
    expect(h.angles).toEqual([])
    const a = (120 * Math.PI) / 180
    h.send('touchmove', [[2, 100 + 100 * Math.cos(a), 100 + 100 * Math.sin(a)]])
    expect(h.angles).toHaveLength(1)
    expect(h.angles[0]).toBeCloseTo(30, 6)
    h.g.destroy()
  })

  it('leaves a distinct start unchanged and starts the next gesture clean', () => {
    const h = harness()
    h.send('touchstart', at(90))
    h.send('touchmove', at(120))
    expect(h.angles[0]).toBeCloseTo(30, 6)
    h.send('touchend', at(120))
    h.send('touchstart', same)
    h.send('touchmove', at(90))
    h.send('touchend', same)
    h.send('touchstart', at(0))
    h.send('touchmove', at(20))
    expect(h.angles).toHaveLength(2)
    expect(h.angles[1]).toBeCloseTo(20 + 30, 6) // offset 30 carried from the first gesture
    h.g.destroy()
  })
})
