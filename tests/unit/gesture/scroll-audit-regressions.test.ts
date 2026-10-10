import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createScrollSpring } from '@oxog/springkit'
import { installTestClock, type TestClock } from '../../../src/testing'

describe('createScrollSpring audit regressions (F502)', () => {
  let clock: TestClock
  let container: HTMLElement

  beforeEach(() => {
    clock = installTestClock()
    container = document.createElement('div')
    document.body.appendChild(container)
    Object.defineProperty(container, 'scrollHeight', { configurable: true, value: 1000 })
    Object.defineProperty(container, 'clientHeight', { configurable: true, value: 200 })
    Object.defineProperty(container, 'scrollWidth', { configurable: true, value: 0 })
    Object.defineProperty(container, 'clientWidth', { configurable: true, value: 0 })
  })

  afterEach(() => {
    clock.uninstall()
    document.body.removeChild(container)
  })

  it.each([NaN, Infinity, -Infinity])(
    'scrollTo(0, %s) does not poison later wheel input or the scroll-end loop',
    (bad) => {
      let ends = 0
      const scroll = createScrollSpring(container, { onScrollEnd: () => { ends++ } })

      scroll.scrollTo(0, bad)
      clock.advance(3000)
      container.dispatchEvent(new WheelEvent('wheel', { deltaY: 50, cancelable: true }))
      clock.advance(5000)

      expect(scroll.getScroll().y).toBeCloseTo(50, 0)
      expect(ends).toBe(1)
      expect(clock.pendingFrames).toBe(0)
      scroll.destroy()
    }
  )
})
