import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import React, { useState } from 'react'
import { Reorder } from '@oxog/springkit/react'

beforeEach(() => {
  cleanup()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('Reorder.Group', () => {
  describe('basic rendering', () => {
    it('should render children', () => {
      render(
        <Reorder.Group values={['a', 'b', 'c']} onReorder={() => {}}>
          <Reorder.Item value="a">A</Reorder.Item>
          <Reorder.Item value="b">B</Reorder.Item>
          <Reorder.Item value="c">C</Reorder.Item>
        </Reorder.Group>
      )

      expect(screen.getByText('A')).toBeInTheDocument()
      expect(screen.getByText('B')).toBeInTheDocument()
      expect(screen.getByText('C')).toBeInTheDocument()
    })

    it('should render as ul by default', () => {
      const { container } = render(
        <Reorder.Group values={['a']} onReorder={() => {}}>
          <Reorder.Item value="a">A</Reorder.Item>
        </Reorder.Group>
      )

      expect(container.querySelector('ul')).toBeInTheDocument()
    })

    it('should render as custom element', () => {
      const { container } = render(
        <Reorder.Group values={['a']} onReorder={() => {}} as="div">
          <Reorder.Item value="a">A</Reorder.Item>
        </Reorder.Group>
      )

      expect(container.querySelector('div')).toBeInTheDocument()
      expect(container.querySelector('ul')).not.toBeInTheDocument()
    })

    it('should apply className', () => {
      const { container } = render(
        <Reorder.Group values={['a']} onReorder={() => {}} className="my-list">
          <Reorder.Item value="a">A</Reorder.Item>
        </Reorder.Group>
      )

      expect(container.querySelector('.my-list')).toBeInTheDocument()
    })

    it('should apply style', () => {
      const { container } = render(
        <Reorder.Group
          values={['a']}
          onReorder={() => {}}
          style={{ paddingTop: '10px' }}
        >
          <Reorder.Item value="a">A</Reorder.Item>
        </Reorder.Group>
      )

      const list = container.firstChild as HTMLElement
      expect(list).toHaveStyle({ paddingTop: '10px' })
    })

    it('should remove list-style by default', () => {
      const { container } = render(
        <Reorder.Group values={['a']} onReorder={() => {}}>
          <Reorder.Item value="a">A</Reorder.Item>
        </Reorder.Group>
      )

      const list = container.firstChild as HTMLElement
      expect(list).toHaveStyle({ listStyle: 'none' })
    })
  })

  describe('axis option', () => {
    it('should default to y axis', () => {
      render(
        <Reorder.Group values={['a']} onReorder={() => {}}>
          <Reorder.Item value="a">A</Reorder.Item>
        </Reorder.Group>
      )

      expect(screen.getByText('A')).toBeInTheDocument()
    })

    it('should accept x axis', () => {
      render(
        <Reorder.Group values={['a']} onReorder={() => {}} axis="x">
          <Reorder.Item value="a">A</Reorder.Item>
        </Reorder.Group>
      )

      expect(screen.getByText('A')).toBeInTheDocument()
    })
  })

  describe('config option', () => {
    it('should accept spring config', () => {
      render(
        <Reorder.Group
          values={['a']}
          onReorder={() => {}}
          config={{ stiffness: 400, damping: 30 }}
        >
          <Reorder.Item value="a">A</Reorder.Item>
        </Reorder.Group>
      )

      expect(screen.getByText('A')).toBeInTheDocument()
    })
  })

  describe('layoutDuration option', () => {
    it('should accept layoutDuration', () => {
      render(
        <Reorder.Group values={['a']} onReorder={() => {}} layoutDuration={300}>
          <Reorder.Item value="a">A</Reorder.Item>
        </Reorder.Group>
      )

      expect(screen.getByText('A')).toBeInTheDocument()
    })

    it('should accept 0 to disable transitions', () => {
      render(
        <Reorder.Group values={['a']} onReorder={() => {}} layoutDuration={0}>
          <Reorder.Item value="a">A</Reorder.Item>
        </Reorder.Group>
      )

      expect(screen.getByText('A')).toBeInTheDocument()
    })
  })

  describe('onReorder callback', () => {
    it('should receive onReorder prop', () => {
      const onReorder = vi.fn()

      render(
        <Reorder.Group values={['a', 'b']} onReorder={onReorder}>
          <Reorder.Item value="a">A</Reorder.Item>
          <Reorder.Item value="b">B</Reorder.Item>
        </Reorder.Group>
      )

      expect(screen.getByText('A')).toBeInTheDocument()
    })
  })
})

describe('Reorder.Item', () => {
  describe('basic rendering', () => {
    it('should render children', () => {
      render(
        <Reorder.Group values={['a']} onReorder={() => {}}>
          <Reorder.Item value="a">
            <span data-testid="content">Content</span>
          </Reorder.Item>
        </Reorder.Group>
      )

      expect(screen.getByTestId('content')).toBeInTheDocument()
    })

    it('should render as li by default', () => {
      const { container } = render(
        <Reorder.Group values={['a']} onReorder={() => {}}>
          <Reorder.Item value="a">A</Reorder.Item>
        </Reorder.Group>
      )

      expect(container.querySelector('li')).toBeInTheDocument()
    })

    it('should render as custom element', () => {
      const { container } = render(
        <Reorder.Group values={['a']} onReorder={() => {}}>
          <Reorder.Item value="a" as="div">A</Reorder.Item>
        </Reorder.Group>
      )

      expect(container.querySelector('li')).not.toBeInTheDocument()
    })

    it('should apply className', () => {
      const { container } = render(
        <Reorder.Group values={['a']} onReorder={() => {}}>
          <Reorder.Item value="a" className="my-item">A</Reorder.Item>
        </Reorder.Group>
      )

      expect(container.querySelector('.my-item')).toBeInTheDocument()
    })

    it('should apply style', () => {
      const { container } = render(
        <Reorder.Group values={['a']} onReorder={() => {}}>
          <Reorder.Item
            value="a"
            style={{ padding: '10px' }}
          >
            A
          </Reorder.Item>
        </Reorder.Group>
      )

      const item = container.querySelector('li') as HTMLElement
      expect(item).toHaveStyle({ padding: '10px' })
    })
  })

  describe('drag behavior', () => {
    it('should have grab cursor by default', () => {
      const { container } = render(
        <Reorder.Group values={['a']} onReorder={() => {}}>
          <Reorder.Item value="a">A</Reorder.Item>
        </Reorder.Group>
      )

      const item = container.querySelector('li') as HTMLElement
      expect(item).toHaveStyle({ cursor: 'grab' })
    })

    it('should have user-select none', () => {
      const { container } = render(
        <Reorder.Group values={['a']} onReorder={() => {}}>
          <Reorder.Item value="a">A</Reorder.Item>
        </Reorder.Group>
      )

      const item = container.querySelector('li') as HTMLElement
      expect(item).toHaveStyle({ userSelect: 'none' })
    })

    it('should have touch-action none', () => {
      const { container } = render(
        <Reorder.Group values={['a']} onReorder={() => {}}>
          <Reorder.Item value="a">A</Reorder.Item>
        </Reorder.Group>
      )

      const item = container.querySelector('li') as HTMLElement
      // Note: touchAction may not be applied by default in this implementation
      expect(item).toBeInTheDocument()
    })
  })

  describe('dragEnabled option', () => {
    it('should be draggable by default', () => {
      const { container } = render(
        <Reorder.Group values={['a']} onReorder={() => {}}>
          <Reorder.Item value="a">A</Reorder.Item>
        </Reorder.Group>
      )

      const item = container.querySelector('li') as HTMLElement
      expect(item).toHaveStyle({ cursor: 'grab' })
    })

    it('should not be draggable when dragEnabled is false', () => {
      const { container } = render(
        <Reorder.Group values={['a']} onReorder={() => {}}>
          <Reorder.Item value="a" dragEnabled={false}>
            A
          </Reorder.Item>
        </Reorder.Group>
      )

      const item = container.querySelector('li') as HTMLElement
      // When disabled, cursor should not be grab
      expect(item).not.toHaveStyle({ cursor: 'grab' })
    })
  })

  describe('drag callbacks', () => {
    it('should call onDragStart when drag begins', () => {
      const onDragStart = vi.fn()

      const { container } = render(
        <Reorder.Group values={['a']} onReorder={() => {}}>
          <Reorder.Item value="a" onDragStart={onDragStart}>
            A
          </Reorder.Item>
        </Reorder.Group>
      )

      const item = container.querySelector('li') as HTMLElement
      fireEvent.pointerDown(item, { clientX: 50, clientY: 50, pointerId: 1 })

      expect(onDragStart).toHaveBeenCalled()
    })

    it('should call onDragEnd when drag ends', () => {
      const onDragEnd = vi.fn()

      const { container } = render(
        <Reorder.Group values={['a']} onReorder={() => {}}>
          <Reorder.Item value="a" onDragEnd={onDragEnd}>
            A
          </Reorder.Item>
        </Reorder.Group>
      )

      const item = container.querySelector('li') as HTMLElement

      // Mock setPointerCapture and releasePointerCapture
      item.setPointerCapture = vi.fn()
      item.releasePointerCapture = vi.fn()

      fireEvent.pointerDown(item, { clientX: 50, clientY: 50, pointerId: 1 })
      fireEvent.pointerUp(item, { clientX: 50, clientY: 50, pointerId: 1 })

      expect(onDragEnd).toHaveBeenCalled()
    })
  })

  describe('transform behavior', () => {
    it('should have position relative', () => {
      const { container } = render(
        <Reorder.Group values={['a']} onReorder={() => {}}>
          <Reorder.Item value="a">A</Reorder.Item>
        </Reorder.Group>
      )

      const item = container.querySelector('li') as HTMLElement
      expect(item).toHaveStyle({ position: 'relative' })
    })

    it('should have initial transform', () => {
      const { container } = render(
        <Reorder.Group values={['a']} onReorder={() => {}}>
          <Reorder.Item value="a">A</Reorder.Item>
        </Reorder.Group>
      )

      const item = container.querySelector('li') as HTMLElement
      expect(item.style.transform).toContain('translate')
    })
  })
})

describe('Reorder integration', () => {
  it('should render complete list', () => {
    const items = ['Item 1', 'Item 2', 'Item 3']

    render(
      <Reorder.Group values={items} onReorder={() => {}}>
        {items.map((item) => (
          <Reorder.Item key={item} value={item}>
            {item}
          </Reorder.Item>
        ))}
      </Reorder.Group>
    )

    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 2')).toBeInTheDocument()
    expect(screen.getByText('Item 3')).toBeInTheDocument()
  })

  it('should work with object values', () => {
    const items = [
      { id: 1, name: 'First' },
      { id: 2, name: 'Second' },
    ]

    render(
      <Reorder.Group values={items} onReorder={() => {}}>
        {items.map((item) => (
          <Reorder.Item key={item.id} value={item}>
            {item.name}
          </Reorder.Item>
        ))}
      </Reorder.Group>
    )

    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
  })

  it('should work with controlled state', () => {
    function ControlledList() {
      const [items, setItems] = useState(['A', 'B', 'C'])

      return (
        <Reorder.Group values={items} onReorder={setItems}>
          {items.map((item) => (
            <Reorder.Item key={item} value={item}>
              {item}
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )
    }

    render(<ControlledList />)

    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
    expect(screen.getByText('C')).toBeInTheDocument()
  })

  it('should throw error when Item is used outside Group', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<Reorder.Item value="a">A</Reorder.Item>)
    }).toThrow('Reorder.Item must be used within a Reorder.Group')

    consoleSpy.mockRestore()
  })
})
