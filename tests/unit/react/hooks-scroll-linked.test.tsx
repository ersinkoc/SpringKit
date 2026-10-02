/**
 * Regression tests for useScrollLinked hooks
 */
import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { ScrollProgress } from '../../../src/scroll/scroll-linked'
import { useScrollLinkedValue } from '../../../src/adapters/react/hooks/useScrollLinked'

function fakeScrollProgress() {
  const subscribe = vi.fn((cb: (info: { progress: number }) => void) => {
    cb({ progress: 0.5 })
    return () => {}
  })
  const progress = {
    get: () => 0.5,
    getInfo: () => ({ progress: 0.5 }),
    subscribe,
    destroy: () => {},
  } as unknown as ScrollProgress
  return { progress, subscribe }
}

describe('useScrollLinkedValue', () => {
  it('does not recreate the linked value on every render with inline ranges', () => {
    const { progress, subscribe } = fakeScrollProgress()
    const { result, rerender } = renderHook(() =>
      useScrollLinkedValue(progress, { inputRange: [0, 1], outputRange: [0, 100] })
    )
    expect(result.current).toBe(50)
    const callsAfterMount = subscribe.mock.calls.length
    rerender()
    rerender()
    expect(subscribe.mock.calls.length).toBe(callsAfterMount)
  })

  it('does not recreate the linked value with an inline smooth spring config', () => {
    const { progress, subscribe } = fakeScrollProgress()
    const { rerender, unmount } = renderHook(() =>
      useScrollLinkedValue(progress, {
        inputRange: [0, 1],
        outputRange: [0, 100],
        smooth: { stiffness: 200, damping: 30 },
      })
    )
    const callsAfterMount = subscribe.mock.calls.length
    rerender()
    rerender()
    expect(subscribe.mock.calls.length).toBe(callsAfterMount)
    unmount()
  })

  it('recreates the linked value when the range contents change', () => {
    const { progress } = fakeScrollProgress()
    const { result, rerender } = renderHook(
      ({ max }) => useScrollLinkedValue(progress, { inputRange: [0, 1], outputRange: [0, max] }),
      { initialProps: { max: 100 } }
    )
    expect(result.current).toBe(50)
    rerender({ max: 200 })
    expect(result.current).toBe(100)
  })
})
