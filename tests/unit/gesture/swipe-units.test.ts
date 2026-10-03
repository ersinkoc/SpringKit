import { describe, it, expect, afterEach, vi } from 'vitest'
import { createSwipeGesture } from '../../../src/gesture/advanced'
import { installTestClock, type TestClock } from '../../../src/testing/index'

let clock: TestClock | null = null
afterEach(() => {
  clock?.uninstall()
  clock = null
})

const pointer = (type: string, x: number) =>
  new PointerEvent(type, { pointerId: 1, clientX: x, clientY: 0, bubbles: true })

describe('swipe velocity units', () => {
  it('reports velocity in px/s and compares the threshold in px/s', () => {
    clock = installTestClock({ startTime: 0 })
    const el = document.createElement('div')
    document.body.appendChild(el)
    const onSwipe = vi.fn()
    const swipe = createSwipeGesture(el, { onSwipe, distanceThreshold: 50 })

    el.dispatchEvent(pointer('pointerdown', 0))
    for (let i = 1; i <= 5; i++) {
      clock.advance(20)
      el.dispatchEvent(pointer('pointermove', i * 20))
    }
    el.dispatchEvent(pointer('pointerup', 100))

    expect(onSwipe).toHaveBeenCalledTimes(1)
    const { velocity, direction } = onSwipe.mock.calls[0]![0]
    expect(direction).toBe('right')
    expect(velocity.x).toBeCloseTo(1000, 0) // 20px every 20ms
    swipe.destroy()
    el.remove()
  })

  it('does not swipe below the default 500 px/s threshold', () => {
    clock = installTestClock({ startTime: 0 })
    const el = document.createElement('div')
    document.body.appendChild(el)
    const onSwipe = vi.fn()
    const swipe = createSwipeGesture(el, { onSwipe, distanceThreshold: 1000 })

    el.dispatchEvent(pointer('pointerdown', 0))
    for (let i = 1; i <= 5; i++) {
      clock.advance(50)
      el.dispatchEvent(pointer('pointermove', i * 15)) // 300 px/s
    }
    el.dispatchEvent(pointer('pointerup', 75))
    expect(onSwipe).not.toHaveBeenCalled()
    swipe.destroy()
    el.remove()
  })
})
