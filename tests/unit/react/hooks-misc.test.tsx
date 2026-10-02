/**
 * Regression tests for assorted hooks (transition, morph, drag, gestures, scroll)
 */
import { describe, it, expect, vi } from 'vitest'
import { render, renderHook, act, fireEvent } from '@testing-library/react'
import * as React from 'react'
import { useInstantTransition } from '../../../src/adapters/react/hooks/useInstantTransition'
import { useMorph, useMorphRef } from '../../../src/adapters/react/hooks/useMorph'
import { useDrag } from '../../../src/adapters/react/hooks/useDrag'
import { useDragControls } from '../../../src/adapters/react/hooks/useDragControls'
import { useGesture } from '../../../src/adapters/react/hooks/useGesture'
import { useScroll } from '../../../src/adapters/react/hooks/useScroll'

const PATH_A = 'M0,0 L10,0 L10,10 Z'

describe('useInstantTransition', () => {
  it('reports isPending while its transition is in flight', () => {
    const pendingSeen: boolean[] = []
    let start!: (cb: () => void) => void
    let setValue!: (v: number) => void
    function C() {
      const [startInstant, isPending] = useInstantTransition()
      const [, set] = React.useState(0)
      start = startInstant
      setValue = set
      pendingSeen.push(isPending)
      return null
    }
    render(<C />)
    act(() => {
      start(() => setValue(1))
    })
    expect(pendingSeen).toContain(true)
  })
})

describe('useMorph', () => {
  it('calls the latest onProgress option (no stale closure)', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { result, rerender } = renderHook(
      ({ onProgress }) => useMorph(PATH_A, { onProgress }),
      { initialProps: { onProgress: first } }
    )
    rerender({ onProgress: second })
    first.mockClear()
    act(() => result.current.setProgress(0.5))
    expect(second).toHaveBeenCalled()
    expect(first).not.toHaveBeenCalled()
  })

  it('useMorphRef calls the latest onProgress option (no stale closure)', () => {
    const first = vi.fn()
    const second = vi.fn()
    let api!: ReturnType<typeof useMorphRef>
    function C({ onProgress }: { onProgress: (p: number) => void }) {
      api = useMorphRef(PATH_A, { onProgress })
      return (
        <svg>
          <path ref={api.pathRef} />
        </svg>
      )
    }
    const { rerender } = render(<C onProgress={first} />)
    rerender(<C onProgress={second} />)
    first.mockClear()
    act(() => api.setProgress(0.5))
    expect(second).toHaveBeenCalled()
    expect(first).not.toHaveBeenCalled()
  })
})

describe('useDrag', () => {
  it('returns a stable ref callback (no detach/re-attach on every render)', () => {
    const { result, rerender } = renderHook(() => useDrag())
    const firstRef = result.current[1].ref
    rerender()
    expect(result.current[1].ref).toBe(firstRef)
  })
})

describe('useDragControls', () => {
  it('returns a stable controls object across renders', () => {
    const { result, rerender } = renderHook(() => useDragControls())
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })
})

describe('useGesture', () => {
  it('captures the pointer on pointerdown so the drag continues outside the element', () => {
    let bind!: ReturnType<typeof useGesture>
    function C() {
      bind = useGesture({ onDrag: () => {} })
      return <div data-testid="el" {...bind} />
    }
    const { getByTestId } = render(<C />)
    const el = getByTestId('el')
    const setPointerCapture = vi.fn()
    ;(el as unknown as { setPointerCapture: typeof setPointerCapture }).setPointerCapture = setPointerCapture
    fireEvent.pointerDown(el, { pointerId: 7, clientX: 0, clientY: 0 })
    expect(setPointerCapture).toHaveBeenCalledWith(7)
  })
})

describe('useScroll', () => {
  it('does not restart its scroll subscription on every render with the default offset', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const { rerender } = renderHook(() => useScroll())
    const countScrollListeners = () =>
      addSpy.mock.calls.filter(([type]) => type === 'scroll').length
    const afterMount = countScrollListeners()
    rerender()
    rerender()
    expect(countScrollListeners()).toBe(afterMount)
    addSpy.mockRestore()
  })

  it('tracks page scroll for target-element progress', async () => {
    const target = document.createElement('div')
    document.body.appendChild(target)
    let top = 800
    target.getBoundingClientRect = () =>
      ({ top, bottom: top + 100, left: 0, right: 100, width: 100, height: 100, x: 0, y: top, toJSON: () => ({}) }) as DOMRect
    const ref = { current: target }

    const { result } = renderHook(() =>
      useScroll({ target: ref, offset: ['start end', 'end start'] })
    )
    await act(async () => { await new Promise((r) => setTimeout(r, 50)) })
    const before = result.current.scrollYProgress.get()

    // scroll the page: the element moves up in the viewport
    top = 300
    await act(async () => {
      window.dispatchEvent(new Event('scroll'))
      await new Promise((r) => setTimeout(r, 50))
    })
    expect(result.current.scrollYProgress.get()).toBeGreaterThan(before)
    target.remove()
  })
})
