/**
 * Regression tests for useAnimate
 */
import { describe, it, expect, vi } from 'vitest'
import { render, act } from '@testing-library/react'
import * as React from 'react'
import { useAnimate } from '../../../src/adapters/react/hooks/useAnimate'

function settlesWithin(promise: Promise<unknown>, ms: number) {
  return Promise.race([
    promise.then(() => 'settled'),
    new Promise((r) => setTimeout(() => r('pending'), ms)),
  ])
}

describe('useAnimate', () => {
  it('settles a pending animate() promise when the component unmounts', async () => {
    let api!: ReturnType<typeof useAnimate>
    function C() {
      api = useAnimate()
      return <div ref={api[0] as React.RefObject<HTMLDivElement>} />
    }
    const { unmount } = render(<C />)
    const onComplete = vi.fn()
    let promise!: Promise<void>
    act(() => {
      promise = api[1]({ x: 100 }, { config: { stiffness: 10, damping: 1 }, onComplete })
    })
    unmount()
    expect(await settlesWithin(promise, 300)).toBe('settled')
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('settles a delayed animate() promise when the component unmounts during the delay', async () => {
    let api!: ReturnType<typeof useAnimate>
    function C() {
      api = useAnimate()
      return <div ref={api[0] as React.RefObject<HTMLDivElement>} />
    }
    const { unmount } = render(<C />)
    let promise!: Promise<void>
    act(() => {
      promise = api[1]({ x: 100 }, { delay: 10_000 })
    })
    unmount()
    expect(await settlesWithin(promise, 300)).toBe('settled')
  })
})
