import { afterEach, expect, it } from 'vitest'
import { animate } from '../../../src/animation/animate'
import { installTestClock, type TestClock } from '../../../src/testing'
let clock: TestClock | undefined
const controls: ReturnType<typeof animate>[] = []
afterEach(() => { controls.forEach(control => control.stop()); controls.length = 0; clock?.uninstall() })
it.each([
  ['width', '0%', '50%'],
  ['backgroundColor', 'rgb(255, 0, 0)', 'rgb(0, 0, 255)'],
  ['width', '0px', '50px'],
] as const)('animates %s while keeping its value type', async (property, from, to) => {
  clock = installTestClock()
  const element = document.createElement('div')
  element.style[property] = from
  const control = animate(element, { [property]: to })
  controls.push(control)
  for (let i = 0; i < 240 && control.isAnimating(); i++) { clock.nextFrame(); await Promise.resolve() }
  expect(element.style[property]).toBe(to)
  expect(control.isAnimating()).toBe(false)
})
