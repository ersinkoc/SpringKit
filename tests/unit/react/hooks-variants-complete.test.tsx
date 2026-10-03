import { describe, it, expect, afterEach } from 'vitest'
import { render, act, cleanup } from '@testing-library/react'
import * as React from 'react'
import { useVariants } from '../../../src/adapters/react/hooks/useVariants'
import { installTestClock, type TestClock } from '@oxog/springkit/testing'

let clock: TestClock | null = null
afterEach(() => {
  cleanup()
  clock?.uninstall()
  clock = null
})

describe('useVariants onAnimationComplete', () => {
  it('fires once the spring has actually settled, also for slow bouncy springs', async () => {
    clock = installTestClock({ timers: true })
    let opacity = -1
    let opacityAtComplete: number | null = null
    function C() {
      const { values } = useVariants({
        variants: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
        initial: 'hidden',
        animate: 'visible',
        spring: { stiffness: 60, damping: 6 },
        onAnimationComplete: () => {
          opacityAtComplete = opacity
        },
      })
      opacity = Number(values.opacity)
      return null
    }
    render(<C />)
    for (let t = 0; t < 6000 && opacityAtComplete === null; t += 16) {
      await act(async () => {
        clock!.advance(16)
      })
    }
    expect(opacityAtComplete).not.toBeNull()
    expect(Math.abs(opacityAtComplete! - 1)).toBeLessThan(0.02)
  })
})
