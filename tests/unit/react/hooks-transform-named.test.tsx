import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMotionValue } from '../../../src/adapters/react/hooks/useMotionValue'
import { useTransform } from '../../../src/adapters/react/hooks/useTransform'

describe('useTransform with CSS color names', () => {
  it('interpolates between named colors instead of snapping', () => {
    const { result } = renderHook(() => {
      const progress = useMotionValue(0)
      const color = useTransform(progress, [0, 1], ['red', 'blue'])
      return { progress, color }
    })
    act(() => result.current.progress.jump(0.5))
    const mid = result.current.color.get()
    expect(mid).toMatch(/^rgba?\(/)
    expect(mid).not.toBe('rgb(255, 0, 0)')
    expect(mid).not.toBe('rgb(0, 0, 255)')
    act(() => result.current.progress.jump(1))
    expect(result.current.color.get()).toBe('rgb(0, 0, 255)')
  })
})
