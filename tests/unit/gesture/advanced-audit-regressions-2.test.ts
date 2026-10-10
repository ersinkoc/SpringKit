import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  createLongPressGesture,
  createSwipeGesture,
  type GestureController,
  type SwipeConfig,
} from '../../../src/gesture/advanced'
import { installTestClock, type TestClock } from '../../../src/testing/index'

let clock: TestClock | null = null
afterEach(() => {
  clock?.uninstall()
  clock = null
  document.body.textContent = ''
})

const P = (type: string, x = 0, y = 0, id = 1) =>
  new PointerEvent(type, { pointerId: id, clientX: x, clientY: y, bubbles: true })

const mount = () => {
  clock = installTestClock({ startTime: 0, timers: true })
  const el = document.createElement('div')
  document.body.appendChild(el)
  return { el, clock }
}

describe('long press disabled / destroyed from onPressStart (F3301)', () => {
  it('disable() inside onPressStart: onLongPress never fires, the press ends cancelled', () => {
    const { el, clock } = mount()
    const log: string[] = []
    let disableOnStart = true
    const g: GestureController = createLongPressGesture(el, {
      onPressStart: () => {
        log.push('start')
        if (disableOnStart) g.disable()
      },
      onLongPress: () => log.push('long'),
      onPressEnd: (s) => log.push(`end:${s.cancelled}`),
    })
    el.dispatchEvent(P('pointerdown'))
    expect(clock.pendingTimers).toBe(0)
    clock.advance(600)
    el.dispatchEvent(P('pointerup'))
    expect(log).toEqual(['start', 'end:true'])

    // Re-enabled: the next press works and fires exactly once, before onPressEnd
    g.enable()
    disableOnStart = false
    log.length = 0
    el.dispatchEvent(P('pointerdown'))
    clock.advance(600)
    el.dispatchEvent(P('pointerup'))
    expect(log).toEqual(['start', 'long', 'end:false'])
    g.destroy()
  })

  it('destroy() inside onPressStart leaves no timer and fires nothing', () => {
    const { el, clock } = mount()
    const onLongPress = vi.fn()
    const onPressEnd = vi.fn()
    const g: GestureController = createLongPressGesture(el, {
      onPressStart: () => g.destroy(),
      onLongPress,
      onPressEnd,
    })
    el.dispatchEvent(P('pointerdown'))
    expect(clock.pendingTimers).toBe(0)
    clock.advance(600)
    el.dispatchEvent(P('pointerup'))
    expect(onLongPress).not.toHaveBeenCalled()
    expect(onPressEnd).not.toHaveBeenCalled()
  })

  it('disable() then enable() inside onPressStart keeps the press alive', () => {
    const { el, clock } = mount()
    const onLongPress = vi.fn()
    const g: GestureController = createLongPressGesture(el, {
      onPressStart: () => {
        g.disable()
        g.enable()
      },
      onLongPress,
    })
    el.dispatchEvent(P('pointerdown'))
    clock.advance(600)
    expect(onLongPress).toHaveBeenCalledTimes(1)
    el.dispatchEvent(P('pointerup'))
    g.destroy()
  })

  it('a press released and restarted inside onPressStart arms exactly one timer', () => {
    const { el, clock } = mount()
    const onLongPress = vi.fn()
    const onPressEnd = vi.fn()
    let depth = 0
    const g = createLongPressGesture(el, {
      onPressStart: () => {
        if (depth++ === 0) {
          el.dispatchEvent(P('pointerup'))
          el.dispatchEvent(P('pointerdown'))
        }
      },
      onLongPress,
      onPressEnd,
    })
    el.dispatchEvent(P('pointerdown'))
    expect(clock.pendingTimers).toBe(1)
    clock.advance(600)
    expect(onLongPress).toHaveBeenCalledTimes(1)
    el.dispatchEvent(P('pointerup'))
    expect(onPressEnd).toHaveBeenCalledTimes(2)
    g.destroy()
  })
})

describe('long press disabled mid-press ends as cancelled (F3302)', () => {
  it('disable() before the long press fires: cancelled, not triggered, no onLongPress', () => {
    const { el, clock } = mount()
    const onLongPress = vi.fn()
    const onPressEnd = vi.fn()
    const g = createLongPressGesture(el, { onLongPress, onPressEnd })
    el.dispatchEvent(P('pointerdown'))
    clock.advance(100)
    g.disable()
    clock.advance(600)
    el.dispatchEvent(P('pointerup'))
    expect(onLongPress).not.toHaveBeenCalled()
    expect(onPressEnd).toHaveBeenCalledTimes(1)
    expect(onPressEnd.mock.calls[0]![0].cancelled).toBe(true)
    expect(onPressEnd.mock.calls[0]![0].triggered).toBe(false)
    g.destroy()
  })

  it('disable() + enable() mid-press stays cancelled; the next press is clean', () => {
    const { el, clock } = mount()
    const onLongPress = vi.fn()
    const onPressEnd = vi.fn()
    const g = createLongPressGesture(el, { onLongPress, onPressEnd })
    el.dispatchEvent(P('pointerdown'))
    g.disable()
    g.enable()
    clock.advance(600)
    el.dispatchEvent(P('pointerup'))
    expect(onLongPress).not.toHaveBeenCalled()
    expect(onPressEnd.mock.calls[0]![0].cancelled).toBe(true)

    el.dispatchEvent(P('pointerdown'))
    clock.advance(600)
    el.dispatchEvent(P('pointerup'))
    expect(onLongPress).toHaveBeenCalledTimes(1)
    expect(onPressEnd.mock.calls[1]![0].cancelled).toBe(false)
    g.destroy()
  })

  it('disable() after the long press fired does not cancel it', () => {
    const { el, clock } = mount()
    const onPressEnd = vi.fn()
    const g = createLongPressGesture(el, { onPressEnd })
    el.dispatchEvent(P('pointerdown'))
    clock.advance(600)
    g.disable()
    el.dispatchEvent(P('pointerup'))
    expect(onPressEnd.mock.calls[0]![0].cancelled).toBe(false)
    expect(onPressEnd.mock.calls[0]![0].triggered).toBe(true)
    g.destroy()
  })
})

describe('swipe needs travel along its axis (F3303)', () => {
  function swipe(cfg: SwipeConfig, dx: number, dy: number, ms = 16) {
    const { el, clock: c } = mount()
    const dirs: Array<string | null> = []
    const g = createSwipeGesture(el, { ...cfg, onSwipe: (s) => dirs.push(s.direction) })
    el.dispatchEvent(P('pointerdown'))
    c.advance(ms)
    el.dispatchEvent(P('pointerup', dx, dy))
    g.destroy()
    c.uninstall()
    clock = null
    return dirs
  }

  it('a tap is not a swipe on a constrained axis, even with a zero distance threshold', () => {
    expect(swipe({ axis: 'x', distanceThreshold: 0 }, 0, 0)).toEqual([])
    expect(swipe({ axis: 'y', distanceThreshold: 0 }, 0, 0)).toEqual([])
    expect(swipe({ axis: 'x', distanceThreshold: 0, velocityThreshold: 0, minDistance: 0 }, 0, 0)).toEqual([])
    expect(swipe({ axis: 'x', distanceThreshold: 0 }, 0, 100)).toEqual([])
  })

  it('real travel still reports the right direction', () => {
    expect(swipe({ axis: 'x', distanceThreshold: 0 }, 1, 0)).toEqual(['right'])
    expect(swipe({ axis: 'x', distanceThreshold: 0 }, -1, 0)).toEqual(['left'])
    expect(swipe({ axis: 'y', distanceThreshold: 0 }, 0, 1)).toEqual(['down'])
    expect(swipe({ axis: 'y', distanceThreshold: 0 }, 0, -1)).toEqual(['up'])
    // slow release (300ms, under the velocity threshold): exactly distanceThreshold
    // is a swipe, just below is not
    expect(swipe({}, 49.99, 0, 300)).toEqual([])
    expect(swipe({}, 50, 0, 300)).toEqual(['right'])
  })
})
