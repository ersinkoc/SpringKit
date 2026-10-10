import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createDragSpring, type DragSpringConfig } from '@oxog/springkit'
import { installTestClock, type TestClock } from '../../../src/testing'

describe('createDragSpring audit regressions', () => {
  let clock: TestClock
  const elements: HTMLElement[] = []

  beforeEach(() => {
    clock = installTestClock()
  })

  afterEach(() => {
    clock.uninstall()
    elements.splice(0).forEach((el) => el.remove())
  })

  const mount = (): HTMLElement => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    elements.push(el)
    return el
  }

  const pointer = (type: string, clientX: number, clientY = 0) =>
    new PointerEvent(type, { pointerId: 1, button: 0, clientX, clientY, bubbles: true })

  /** Drag 0 -> (toX, toY) in one move, hold still 500ms (no release velocity), release, settle */
  const dragAndRelease = (config: DragSpringConfig, toX: number, toY = 0) => {
    const el = mount()
    const drag = createDragSpring(el, config)
    el.dispatchEvent(pointer('pointerdown', 0, 0))
    clock.advance(16)
    el.dispatchEvent(pointer('pointermove', toX, toY))
    clock.advance(500)
    el.dispatchEvent(pointer('pointerup', toX, toY))
    clock.runAll()
    return { drag, el }
  }

  describe('snapToNearest() uses the current velocity (F101)', () => {
    const points = [{ x: 100, y: 0, radius: 50 }]

    /** 100px along x over `duration` ms, in 10ms steps, then release */
    const fling = (el: HTMLElement, duration: number) => {
      const steps = duration / 10
      el.dispatchEvent(pointer('pointerdown', 0))
      for (let i = 1; i <= steps; i++) {
        clock.advance(10)
        el.dispatchEvent(pointer('pointermove', (100 * i) / steps))
      }
      el.dispatchEvent(pointer('pointerup', 100))
    }

    it('snaps at rest even though the last drag was released faster than velocityThreshold', () => {
      const el = mount()
      const snapStarts: number[] = []
      const drag = createDragSpring(el, {
        bounds: { left: 0, right: 120 },
        snap: { points },
        onSnapStart: (p) => snapStarts.push(p.x),
      })

      fling(el, 50) // 2000 px/s > default 500 px/s: no snap on release
      expect(snapStarts).toEqual([])
      clock.runAll()
      expect(drag.getPosition().x).toBeCloseTo(120, 3)

      drag.snapToNearest()
      clock.runAll()
      expect(snapStarts).toEqual([100])
      expect(drag.getPosition().x).toBeCloseTo(100, 1)
      drag.destroy()
    })

    it('still refuses to snap while the element is moving faster than velocityThreshold', () => {
      const el = mount()
      const snapStarts: number[] = []
      const drag = createDragSpring(el, { snap: { points }, onSnapStart: (p) => snapStarts.push(p.x) })

      fling(el, 50)
      clock.advance(32)
      expect(Math.hypot(drag.getVelocity().x, drag.getVelocity().y)).toBeGreaterThan(500)
      drag.snapToNearest()
      expect(snapStarts).toEqual([])
      drag.destroy()
    })

    it('a slow release still snaps on release', () => {
      const el = mount()
      const snapStarts: number[] = []
      const drag = createDragSpring(el, { snap: { points }, onSnapStart: (p) => snapStarts.push(p.x) })

      fling(el, 1000) // 100 px/s
      expect(snapStarts).toEqual([100])
      drag.destroy()
    })
  })

  describe('grid snap stays inside the bounds (F102)', () => {
    const bounds = { left: 0, right: 100, top: 0, bottom: 100 }

    it('does not rest past the right bound when the nearest grid cell is outside', () => {
      const { drag } = dragAndRelease({ bounds, snap: { grid: { x: 40, y: 10 } } }, 500)
      // round(100 / 40) * 40 = 120 would leave the bounds
      expect(drag.getPosition().x).toBeCloseTo(100, 1)
      drag.destroy()
    })

    it('does not rest past the bottom bound', () => {
      const { drag } = dragAndRelease({ bounds, snap: { grid: { x: 10, y: 40 } } }, 50, 500)
      expect(drag.getPosition().y).toBeCloseTo(100, 1)
      expect(drag.getPosition().x).toBeCloseTo(50, 1)
      drag.destroy()
    })

    it('does not rest before the left bound', () => {
      const { drag } = dragAndRelease({ bounds: { left: 10, right: 100 }, snap: { grid: { x: 40, y: 10 } } }, -500)
      expect(drag.getPosition().x).toBeCloseTo(10, 1)
      drag.destroy()
    })

    it('keeps a grid cell that is inside the bounds, and works without bounds', () => {
      const inside = dragAndRelease({ bounds, snap: { grid: { x: 50, y: 10 } } }, 70)
      expect(inside.drag.getPosition().x).toBeCloseTo(50, 1)
      inside.drag.destroy()

      const unbounded = dragAndRelease({ snap: { grid: { x: 40, y: 10 } } }, 500)
      expect(unbounded.drag.getPosition().x).toBeCloseTo(520, 1)
      unbounded.drag.destroy()
    })

    it('snapToNearest() clamps to the bounds too', () => {
      const { drag } = dragAndRelease({ bounds, snap: { grid: { x: 40, y: 10 }, snapOnRelease: false } }, 500)
      drag.snapToNearest()
      clock.runAll()
      expect(drag.getPosition().x).toBeCloseTo(100, 1)
      drag.destroy()
    })
  })

  describe('reset() after destroy() (F103)', () => {
    it('is a no-op: no onUpdate, position unchanged', () => {
      const el = mount()
      const updates: Array<[number, number]> = []
      const drag = createDragSpring(el, { onUpdate: (x, y) => updates.push([x, y]) })
      drag.setPosition(30, 40)
      drag.destroy()
      updates.length = 0

      drag.reset()
      clock.runAll()
      expect(updates).toEqual([])
      expect(drag.getPosition()).toEqual({ x: 30, y: 40 })
    })

    it('still resets a live controller', () => {
      const el = mount()
      const updates: Array<[number, number]> = []
      const drag = createDragSpring(el, { onUpdate: (x, y) => updates.push([x, y]) })
      drag.setPosition(30, 40)
      updates.length = 0

      drag.reset()
      expect(drag.getPosition()).toEqual({ x: 0, y: 0 })
      expect(updates[updates.length - 1]).toEqual([0, 0])
      drag.destroy()
    })
  })
})
