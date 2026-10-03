/**
 * Regression tests for useReducedMotion
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  useReducedMotion,
  getReducedMotionPreference,
} from '../../../src/adapters/react/hooks/useReducedMotion'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useReducedMotion', () => {
  it('does not crash when window.matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined)
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
    expect(getReducedMotionPreference()).toBe(false)
  })

  it('reacts to media query changes', () => {
    let listener: ((e: { matches: boolean }) => void) | null = null
    const mql = {
      matches: false,
      addEventListener: (_: string, cb: (e: { matches: boolean }) => void) => { listener = cb },
      removeEventListener: () => { listener = null },
    }
    vi.stubGlobal('matchMedia', () => mql)
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
    act(() => {
      // Browsers update `matches` before notifying
      mql.matches = true
      listener?.({ matches: true })
    })
    expect(result.current).toBe(true)
  })
})
