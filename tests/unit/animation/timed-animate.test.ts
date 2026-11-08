import { afterEach, expect, it } from 'vitest'
import { animate } from '../../../src/animation/animate'
import { globalLoop } from '../../../src/animation/loop'
import { installTestClock, type TestClock } from '../../../src/testing'
let clock: TestClock | undefined
const controls: ReturnType<typeof animate>[] = []
afterEach(() => { controls.forEach(c => c.stop()); controls.length = 0; globalLoop.setTimeScale(1); clock?.uninstall() })

it('honors duration/easing, reports real progress and preserves time on pause', async () => {
  clock = installTestClock({ startTime: 0 })
  const element = document.createElement('div')
  const control = animate(element, { x: [0, 100] }, { duration: 1000, ease: p => p * p })
  controls.push(control)
  clock.advance(500)
  expect(parseFloat(element.style.transform.slice('translate3d('.length))).toBeCloseTo(25)
  expect(control.getProgress()).toBeCloseTo(0.25)
  control.pause(); clock.advance(1000)
  expect(parseFloat(element.style.transform.slice('translate3d('.length))).toBeCloseTo(25)
  control.resume(); clock.advance(500)
  await control.finished
  expect(element.style.transform).toContain('100px')
  expect(control.getProgress()).toBe(1)
})

it('uses animation time for timed color and unit channels', async () => {
  clock = installTestClock({ startTime: 0 })
  globalLoop.setTimeScale(2)
  const element = document.createElement('div')
  element.style.width = '0%'
  const control = animate(element, { width: '100%' }, { duration: 1000 })
  controls.push(control)
  clock.advance(250)
  expect(parseFloat(element.style.width)).toBeCloseTo(50)
  clock.advance(250)
  await control.finished
  expect(element.style.width).toBe('100%')
})

it('can resume a timed animation paused before its start delay expires', async () => {
  clock = installTestClock({ startTime: 0 })
  const element = document.createElement('div')
  const control = animate(element, { x: 100 }, { duration: 1000, delay: 100 })
  controls.push(control)
  control.pause()
  clock.advance(200)
  await Promise.resolve()
  control.resume()
  clock.advance(500)
  expect(parseFloat(element.style.transform.slice('translate3d('.length))).toBeCloseTo(50)
  clock.advance(500)
  await control.finished
  expect(element.style.transform).toContain('100px')
})
