import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup, screen, fireEvent } from '@testing-library/react'
import * as React from 'react'
import { Reorder } from '@oxog/springkit/react'

const ITEM_HEIGHT = 50

/** Give every rendered item a vertical layout box based on its DOM index */
function mockLayout(list: HTMLElement) {
  Array.from(list.children).forEach((child) => {
    const el = child as HTMLElement
    el.getBoundingClientRect = () => {
      const index = Array.from(list.children).indexOf(el)
      const top = index * ITEM_HEIGHT
      return {
        left: 0,
        top,
        width: 200,
        height: ITEM_HEIGHT,
        right: 200,
        bottom: top + ITEM_HEIGHT,
        x: 0,
        y: top,
        toJSON() {
          return {}
        },
      } as DOMRect
    }
  })
}

function List<T extends string | number>({
  values,
  onReorder,
}: {
  values: T[]
  onReorder: (order: T[]) => void
}) {
  return (
    <Reorder.Group values={values} onReorder={onReorder} layoutDuration={0}>
      {values.map((value) => (
        <Reorder.Item key={value} value={value}>
          {`item-${value}`}
        </Reorder.Item>
      ))}
    </Reorder.Group>
  )
}

describe('Reorder (regressions)', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('does not jump when the pointer is pressed and moved by 0px', () => {
    render(<List values={['a', 'b', 'c']} onReorder={() => {}} />)
    mockLayout(screen.getByRole('listbox'))

    const item = screen.getByText('item-a')
    fireEvent.pointerDown(item, { clientX: 10, clientY: 25, pointerId: 1 })
    fireEvent.pointerMove(item, { clientX: 10, clientY: 25, pointerId: 1 })

    expect(item.style.transform).toBe('translateY(0px)')
  })

  it('reorders when an item is dragged past the midpoint of its neighbour', () => {
    const onReorder = vi.fn()
    render(<List values={['a', 'b', 'c']} onReorder={onReorder} />)
    mockLayout(screen.getByRole('listbox'))

    const item = screen.getByText('item-a')
    fireEvent.pointerDown(item, { clientX: 10, clientY: 25, pointerId: 1 })
    // Move down by 30px: past the midpoint (25px) of item b
    fireEvent.pointerMove(item, { clientX: 10, clientY: 55, pointerId: 1 })
    fireEvent.pointerUp(item, { clientX: 10, clientY: 55, pointerId: 1 })

    expect(onReorder).toHaveBeenCalledTimes(1)
    expect(onReorder).toHaveBeenCalledWith(['b', 'a', 'c'])
  })

  it('does not reorder when the item is dragged less than half a neighbour', () => {
    const onReorder = vi.fn()
    render(<List values={['a', 'b', 'c']} onReorder={onReorder} />)
    mockLayout(screen.getByRole('listbox'))

    const item = screen.getByText('item-a')
    fireEvent.pointerDown(item, { clientX: 10, clientY: 25, pointerId: 1 })
    fireEvent.pointerMove(item, { clientX: 10, clientY: 40, pointerId: 1 })
    fireEvent.pointerUp(item, { clientX: 10, clientY: 40, pointerId: 1 })

    expect(onReorder).not.toHaveBeenCalled()
  })

  it('handles falsy item values such as 0', () => {
    const onReorder = vi.fn()
    render(<List values={[0, 1, 2]} onReorder={onReorder} />)
    mockLayout(screen.getByRole('listbox'))

    const item = screen.getByText('item-1')
    fireEvent.pointerDown(item, { clientX: 10, clientY: 75, pointerId: 1 })
    fireEvent.pointerMove(item, { clientX: 10, clientY: 45, pointerId: 1 })
    fireEvent.pointerUp(item, { clientX: 10, clientY: 45, pointerId: 1 })

    expect(onReorder).toHaveBeenCalledWith([1, 0, 2])
  })

  it('reorders with the keyboard', () => {
    const onReorder = vi.fn()
    render(<List values={['a', 'b', 'c']} onReorder={onReorder} />)

    fireEvent.keyDown(screen.getByText('item-a'), { key: 'ArrowDown' })
    expect(onReorder).toHaveBeenLastCalledWith(['b', 'a', 'c'])

    fireEvent.keyDown(screen.getByText('item-a'), { key: 'End' })
    expect(onReorder).toHaveBeenLastCalledWith(['b', 'c', 'a'])
  })

  it('keeps working under StrictMode', () => {
    const onReorder = vi.fn()
    render(
      <React.StrictMode>
        <List values={['a', 'b', 'c']} onReorder={onReorder} />
      </React.StrictMode>
    )
    mockLayout(screen.getByRole('listbox'))

    const item = screen.getByText('item-c')
    fireEvent.pointerDown(item, { clientX: 10, clientY: 125, pointerId: 1 })
    fireEvent.pointerMove(item, { clientX: 10, clientY: 60, pointerId: 1 })
    fireEvent.pointerUp(item, { clientX: 10, clientY: 60, pointerId: 1 })

    expect(onReorder).toHaveBeenCalledWith(['a', 'c', 'b'])
  })

  it('has displayNames for DevTools', () => {
    expect((Reorder.Group as unknown as { displayName?: string }).displayName).toBe('Reorder.Group')
    expect((Reorder.Item as unknown as { displayName?: string }).displayName).toBe('Reorder.Item')
  })
})
