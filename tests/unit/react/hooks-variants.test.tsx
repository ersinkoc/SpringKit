/**
 * Regression tests for useVariants
 */
import { describe, it, expect } from 'vitest'
import { render, act } from '@testing-library/react'
import * as React from 'react'
import { useVariants } from '../../../src/adapters/react/hooks/useVariants'

const variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}
const spring = { stiffness: 1000, damping: 100 }

async function runFrames(ms: number) {
  // several short act() scopes so React flushes renders in between
  for (let t = 0; t < ms; t += 50) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })
  }
}

describe('useVariants', () => {
  it('animates from `initial` to `animate` on mount', async () => {
    let opacity: unknown = -1
    function C() {
      const { values } = useVariants({ variants, initial: 'hidden', animate: 'visible', spring })
      opacity = values.opacity
      return null
    }
    render(<C />)
    await runFrames(500)
    expect(opacity).toBeGreaterThan(0.9)
  })

  it('animates from `initial` to `animate` on mount under StrictMode', async () => {
    let opacity: unknown = -1
    function C() {
      const { values } = useVariants({ variants, initial: 'hidden', animate: 'visible', spring })
      opacity = values.opacity
      return null
    }
    render(<React.StrictMode><C /></React.StrictMode>)
    await runFrames(500)
    expect(opacity).toBeGreaterThan(0.9)
  })

  it('setVariant switches to the requested variant', async () => {
    let api!: ReturnType<typeof useVariants>
    function C() {
      api = useVariants({ variants, initial: 'hidden', animate: 'hidden', spring })
      return null
    }
    render(<C />)
    await runFrames(100)
    expect(api.values.opacity).toBe(0)
    act(() => api.setVariant('visible'))
    await runFrames(500)
    expect(api.currentVariant).toBe('visible')
    expect(api.values.opacity).toBeGreaterThan(0.9)
  })
})
