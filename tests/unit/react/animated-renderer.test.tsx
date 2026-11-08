import * as React from 'react'
import { afterEach, expect, it } from 'vitest'
import { render, act, cleanup } from '@testing-library/react'
import { Animated } from '../../../src/adapters/react'
import { createMotionValue } from '../../../src/index'
import { animate, applyValuesToElement, createTimeline } from '../../../src/index'
import { installTestClock, type TestClock } from '../../../src/testing'
let clock: TestClock | undefined
afterEach(() => { cleanup(); clock?.uninstall() })

it('writes animation frames without React commits, retaining final values on a parent render', async () => {
  clock = installTestClock()
  let commits = 0
  const ui = (label: string) => <React.Profiler id="animated" onRender={() => commits++}>
    <Animated.div data-testid="box" initial={{ x: 0 }} animate={{ x: 100 }}>{label}</Animated.div>
  </React.Profiler>
  const { getByTestId, rerender } = render(ui('one'))
  const atMount = commits
  for (let i = 0; i < 12; i++) await act(async () => { clock!.nextFrame() })
  expect(getByTestId('box').style.transform).not.toContain('translateX(0px)')
  expect(commits).toBe(atMount)
  const before = getByTestId('box').style.transform
  rerender(ui('two'))
  expect(getByTestId('box').style.transform).toBe(before)
})

it('binds MotionValues to styles and stops writing after unmount', () => {
  const opacity = createMotionValue(0.2)
  const { getByTestId, unmount } = render(<Animated.div data-testid="box" style={{ opacity }} />)
  const element = getByTestId('box')
  expect(element.style.opacity).toBe('0.2')
  act(() => opacity.jump(0.7))
  expect(element.style.opacity).toBe('0.7')
  unmount()
  opacity.jump(1)
  expect(element.style.opacity).toBe('0.7')
  opacity.destroy()
})

it('uses the same CSS units as imperative animation, variants and timeline', async () => {
  clock = installTestClock()
  const values = { zIndex: 5, fontWeight: 700, fontSize: 20, opacity: 0.5 }
  const { getByTestId } = render(<Animated.div data-testid="contract" initial={{ zIndex: 0, fontWeight: 400, fontSize: 10, opacity: 1 }} animate={values} />)
  const imperative = document.createElement('div')
  const variant = document.createElement('div')
  const timed = document.createElement('div')
  const control = animate(imperative, values)
  applyValuesToElement(variant, values)
  const timeline = createTimeline().to(timed, { ...values, duration: 1 })
  try {
    timeline.seek(1)
    await act(async () => { clock!.runAll() })
    await control.finished
    for (const element of [getByTestId('contract'), imperative, variant, timed]) {
      expect(element.style.zIndex).toBe('5')
      expect(element.style.fontWeight).toBe('700')
      expect(element.style.fontSize).toBe('20px')
      expect(element.style.opacity).toBe('0.5')
    }
  } finally { control.stop(); timeline.kill() }
})
