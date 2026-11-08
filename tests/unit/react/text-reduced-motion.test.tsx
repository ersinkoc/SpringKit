import * as React from 'react'
import { afterEach, expect, it } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { MotionConfig, SpringText, SpringNumber, TypeWriter } from '../../../src/adapters/react'
import { installTestClock } from '../../../src/testing'
afterEach(cleanup)
it('shows complete text and numbers without typing timers when motion is reduced', () => {
  const clock = installTestClock({ timers: true })
  try {
    const ui = (value: number) => <MotionConfig reducedMotion="always">
      <SpringText>Hello 👨‍👩‍👧‍👦</SpringText><SpringNumber value={value} /><TypeWriter cursor loop>Full text</TypeWriter>
    </MotionConfig>
    const { container, rerender } = render(ui(10))
    expect(container.textContent).toContain('Full text')
    expect(container.querySelectorAll('span')[1]?.style.opacity).not.toBe('0')
    rerender(ui(99))
    expect(container.textContent).toContain('99')
    expect(clock.pendingTimers).toBe(0)
  } finally { cleanup(); clock.uninstall() }
})
