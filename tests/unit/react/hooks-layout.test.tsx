/**
 * Regression tests for layout animation hooks
 */
import { describe, it, expect, vi } from 'vitest'
import { render, renderHook, act } from '@testing-library/react'
import * as React from 'react'
import {
  useLayoutGroup,
  useLayoutId,
  useFlip,
  useAutoLayout,
  LayoutGroupProvider,
  LayoutGroupContext,
} from '../../../src/adapters/react/hooks/useLayoutAnimation'

function mockRect(el: Element, x: number, y = 0, width = 100, height = 100) {
  el.getBoundingClientRect = () =>
    ({ x, y, left: x, top: y, right: x + width, bottom: y + height, width, height, toJSON: () => ({}) }) as DOMRect
}

describe('useLayoutGroup', () => {
  it('registers elements from child ref callbacks during the initial commit', () => {
    const onAnimationStart = vi.fn()
    let api!: ReturnType<typeof useLayoutGroup>
    function List() {
      api = useLayoutGroup({ onAnimationStart })
      return (
        <div
          data-testid="a"
          ref={(el) => {
            if (el) api.register('a', el)
          }}
        />
      )
    }
    const { getByTestId } = render(<List />)
    mockRect(getByTestId('a'), 200)
    act(() => api.update())
    expect(onAnimationStart).toHaveBeenCalledWith('a')
  })

  it('exposes the layout group instance', () => {
    const { result } = renderHook(() => useLayoutGroup())
    expect(result.current.layoutGroup).not.toBeNull()
  })
})

describe('useLayoutId', () => {
  it('registers the element with its local group when no group is passed', () => {
    const onAnimationStart = vi.fn()
    let update!: () => void
    function Card() {
      const layout = useLayoutId('card', { onAnimationStart })
      update = layout.update
      return <div data-testid="card" ref={layout.ref} />
    }
    const { getByTestId } = render(<Card />)
    mockRect(getByTestId('card'), 300)
    act(() => update())
    expect(onAnimationStart).toHaveBeenCalledWith('card')
  })
})

describe('LayoutGroupProvider', () => {
  it('provides a non-null layout group to its children', () => {
    let fromContext: unknown = 'unset'
    function Child() {
      fromContext = React.useContext(LayoutGroupContext)
      return null
    }
    render(
      <LayoutGroupProvider>
        <Child />
      </LayoutGroupProvider>
    )
    expect(fromContext).not.toBeNull()
  })
})

describe('useAutoLayout', () => {
  it('only tracks layout ids inside the container it is attached to', () => {
    const outside = document.createElement('div')
    outside.setAttribute('data-layout-id', 'outside')
    document.body.appendChild(outside)
    const onAnimationStart = vi.fn()
    let api!: ReturnType<typeof useAutoLayout>
    function List() {
      api = useAutoLayout({ onAnimationStart })
      return (
        <ul ref={api.containerRef}>
          <li data-layout-id="inside" data-testid="inside" />
        </ul>
      )
    }
    const { getByTestId } = render(<List />)
    mockRect(outside, 500)
    mockRect(getByTestId('inside'), 500)
    act(() => api.update())
    expect(onAnimationStart).toHaveBeenCalledWith('inside')
    expect(onAnimationStart).not.toHaveBeenCalledWith('outside')
    outside.remove()
  })
})

describe('useFlip', () => {
  it('returns a stable flip function when options are not memoized', () => {
    const { result, rerender } = renderHook(() => useFlip())
    const first = result.current.flip
    rerender()
    expect(result.current.flip).toBe(first)
  })

  it('flip() without a mutate callback animates from the last measured box', async () => {
    let flipFn!: ReturnType<typeof useFlip>['flip']
    function Box() {
      const { ref, flip } = useFlip()
      flipFn = flip
      return <div data-testid="box" ref={ref} />
    }
    const { getByTestId } = render(<Box />)
    const box = getByTestId('box')
    // initial measurement happened at ref attach (x = 0); the layout then changes
    mockRect(box, 100)
    let promise!: Promise<void>
    act(() => {
      promise = flipFn()
    })
    // inverted to the previous position (100px to the left)
    const match = /translate\((-?[\d.]+)px/.exec(box.style.transform)
    expect(match).not.toBeNull()
    expect(Number(match![1])).toBeCloseTo(-100, 0)
    await act(async () => {
      await promise
    })
  })
})
