/**
 * Animated: reduced motion arriving after mount (hydration) and browsers
 * without IntersectionObserver
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, act, cleanup } from '@testing-library/react'
import * as React from 'react'
import { Animated } from '../../../src/adapters/react/components/Animated'
import { MotionConfig } from '../../../src/adapters/react/components/MotionConfig'
import { installTestClock, type TestClock } from '@oxog/springkit/testing'

let clock: TestClock | null = null
let restoreMatchMedia: (() => void) | null = null
afterEach(() => {
  cleanup()
  clock?.uninstall()
  clock = null
  restoreMatchMedia?.()
  restoreMatchMedia = null
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function mockReducedMotionQuery(initial: boolean) {
  let matches = initial
  const listeners = new Set<(e: { matches: boolean }) => void>()
  // Define (not spy on) matchMedia: other test files may have removed it
  const previous = Object.getOwnPropertyDescriptor(window, 'matchMedia')
  restoreMatchMedia = () => {
    if (previous) Object.defineProperty(window, 'matchMedia', previous)
    else delete (window as { matchMedia?: unknown }).matchMedia
  }
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) =>
      ({
        get matches() {
          return query.includes('reduce') ? matches : false
        },
        media: query,
        addEventListener: (_: string, cb: (e: { matches: boolean }) => void) => listeners.add(cb),
        removeEventListener: (_: string, cb: (e: { matches: boolean }) => void) => listeners.delete(cb),
        addListener: (cb: (e: { matches: boolean }) => void) => listeners.add(cb),
        removeListener: (cb: (e: { matches: boolean }) => void) => listeners.delete(cb),
      }) as unknown as MediaQueryList,
  })
  return (next: boolean) => {
    matches = next
    listeners.forEach((cb) => cb({ matches: next }))
  }
}

describe('Animated reduced motion after mount', () => {
  it('skips the entrance when the preference arrives before the first frame', async () => {
    clock = installTestClock()
    const setReduced = mockReducedMotionQuery(false)
    const { getByTestId } = render(
      <MotionConfig reducedMotion="user">
        <Animated.div data-testid="el" initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
      </MotionConfig>
    )
    await act(async () => {
      setReduced(true)
    })
    await act(async () => {
      clock!.nextFrame()
    })
    await act(async () => {
      clock!.nextFrame()
    })
    expect(Number(getByTestId('el').style.opacity)).toBe(1)
  })

  it('finishes a running animation when reduced motion switches on', async () => {
    clock = installTestClock()
    const setReduced = mockReducedMotionQuery(false)
    const { getByTestId } = render(
      <MotionConfig reducedMotion="user">
        <Animated.div
          data-testid="el"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          config={{ stiffness: 40, damping: 20 }}
        />
      </MotionConfig>
    )
    for (let i = 0; i < 4; i++) {
      await act(async () => {
        clock!.nextFrame()
      })
    }
    const mid = Number(getByTestId('el').style.opacity)
    expect(mid).toBeLessThan(1)
    await act(async () => {
      setReduced(true)
    })
    await act(async () => {
      clock!.nextFrame()
    })
    expect(Number(getByTestId('el').style.opacity)).toBe(1)
  })
})

describe('Animated whileInView without IntersectionObserver', () => {
  it('does not crash and treats the element as visible', async () => {
    clock = installTestClock()
    vi.stubGlobal('IntersectionObserver', undefined)
    const { getByTestId } = render(
      <Animated.div data-testid="el" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} />
    )
    await act(async () => {
      clock!.runAll()
    })
    expect(Number(getByTestId('el').style.opacity)).toBeCloseTo(1, 3)
  })
})
