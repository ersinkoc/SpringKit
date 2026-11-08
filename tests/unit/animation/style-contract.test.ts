import { expect, it } from 'vitest'
import { createTimeline, applyValuesToElement } from '../../../src/index'
it('shares unitless and CSS property rules across timeline and variants', () => {
  const variant = document.createElement('div')
  const timed = document.createElement('div')
  const values = { zIndex: 5, fontWeight: 700, fontSize: 20 }
  applyValuesToElement(variant, values)
  const timeline = createTimeline().to(timed, { ...values, duration: 1 })
  timeline.seek(1)
  for (const element of [variant, timed]) {
    expect(element.style.zIndex).toBe('5')
    expect(element.style.fontWeight).toBe('700')
    expect(element.style.fontSize).toBe('20px')
  }
  timeline.kill()
})
