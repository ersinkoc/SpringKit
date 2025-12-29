import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Spring, Animated, Trail } from '../../../src/adapters/react'

describe('React components', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Spring', () => {
    it('should render spring animation', () => {
      render(
        <Spring from={{ opacity: 0 }} to={{ opacity: 1 }}>
          {(values) => <div style={{ opacity: values.opacity }}>Content</div>}
        </Spring>
      )

      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should use provided config', () => {
      render(
        <Spring
          from={{ x: 0 }}
          to={{ x: 100 }}
          config={{ stiffness: 200, damping: 20 }}
        >
          {(values) => <div>{values.x}</div>}
        </Spring>
      )

      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('should call onRest callback', async () => {
      const onRest = vi.fn()

      render(
        <Spring
          from={{ x: 0 }}
          to={{ x: 100 }}
          config={{ stiffness: 1000, damping: 50, restSpeed: 10, restDelta: 10 }}
          onRest={onRest}
        >
          {(values) => <div>{values.x}</div>}
        </Spring>
      )

      await vi.runAllTimersAsync()

      expect(onRest).toHaveBeenCalled()
    })

    it('should handle multiple values', () => {
      render(
        <Spring
          from={{ x: 0, y: 0, opacity: 0 }}
          to={{ x: 100, y: 50, opacity: 1 }}
        >
          {(values) => (
            <div>
              {values.x}, {values.y}, {values.opacity}
            </div>
          )}
        </Spring>
      )

      expect(screen.getByText('0, 0, 0')).toBeInTheDocument()
    })
  })

  describe('Animated', () => {
    it('should render Animated.div', () => {
      render(
        <Animated.div
          data-testid="animated"
          style={{ opacity: 0.5, width: 100 }}
          config={{ stiffness: 100 }}
        >
          Content
        </Animated.div>
      )

      expect(screen.getByTestId('animated')).toBeInTheDocument()
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should render Animated.span', () => {
      render(
        <Animated.span data-testid="animated">Content</Animated.span>
      )

      expect(screen.getByTestId('animated')).toBeInTheDocument()
    })

    it('should render Animated.button', () => {
      render(
        <Animated.button data-testid="button">Click</Animated.button>
      )

      expect(screen.getByTestId('button')).toBeInTheDocument()
      expect(screen.getByText('Click')).toBeInTheDocument()
    })

    it('should render Animated.p', () => {
      render(
        <Animated.p data-testid="paragraph">Text</Animated.p>
      )

      expect(screen.getByTestId('paragraph')).toBeInTheDocument()
    })

    it('should render Animated.h1', () => {
      render(
        <Animated.h1 data-testid="heading">Title</Animated.h1>
      )

      expect(screen.getByTestId('heading')).toBeInTheDocument()
    })

    it('should render Animated.ul and li', () => {
      render(
        <Animated.ul data-testid="list">
          <Animated.li>Item 1</Animated.li>
          <Animated.li>Item 2</Animated.li>
        </Animated.ul>
      )

      expect(screen.getByTestId('list')).toBeInTheDocument()
      expect(screen.getByText('Item 1')).toBeInTheDocument()
      expect(screen.getByText('Item 2')).toBeInTheDocument()
    })

    it('should forward ref', () => {
      const ref = { current: null }

      render(
        <Animated.div ref={ref as any} data-testid="animated">
          Content
        </Animated.div>
      )

      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })

    it('should pass through props', () => {
      render(
        <Animated.div
          data-testid="animated"
          className="test-class"
          id="test-id"
          role="article"
        >
          Content
        </Animated.div>
      )

      const element = screen.getByTestId('animated')
      expect(element).toHaveClass('test-class')
      expect(element).toHaveAttribute('id', 'test-id')
      expect(element).toHaveAttribute('role', 'article')
    })
  })

  describe('Trail', () => {
    it('should render trail animation', () => {
      const items = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' },
      ]

      render(
        <Trail
          items={items}
          keys={(item) => item.id}
          from={{ opacity: 0 }}
          to={{ opacity: 1 }}
        >
          {(values, item) => (
            <div key={item.id} style={{ opacity: values.opacity }}>
              {item.name}
            </div>
          )}
        </Trail>
      )

      expect(screen.getByText('Item 1')).toBeInTheDocument()
      expect(screen.getByText('Item 2')).toBeInTheDocument()
      expect(screen.getByText('Item 3')).toBeInTheDocument()
    })

    it('should handle reverse prop', () => {
      const items = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ]

      render(
        <Trail
          items={items}
          keys={(item) => item.id}
          from={{ opacity: 0 }}
          to={{ opacity: 1 }}
          reverse={true}
        >
          {(values, item) => (
            <div key={item.id} style={{ opacity: values.opacity }}>
              {item.name}
            </div>
          )}
        </Trail>
      )

      expect(screen.getByText('Item 1')).toBeInTheDocument()
      expect(screen.getByText('Item 2')).toBeInTheDocument()
    })

    it('should use provided config', () => {
      const items = [{ id: 1, name: 'Item 1' }]

      render(
        <Trail
          items={items}
          keys={(item) => item.id}
          from={{ opacity: 0 }}
          to={{ opacity: 1 }}
          config={{ stiffness: 200 }}
        >
          {(values, item) => (
            <div key={item.id} style={{ opacity: values.opacity }}>
              {item.name}
            </div>
          )}
        </Trail>
      )

      expect(screen.getByText('Item 1')).toBeInTheDocument()
    })

    it('should handle empty items', () => {
      render(
        <Trail
          items={[]}
          keys={(item: any) => item.id}
          from={{ opacity: 0 }}
          to={{ opacity: 1 }}
        >
          {(values, item) => (
            <div key={item.id} style={{ opacity: values.opacity }}>
              {item.name}
            </div>
          )}
        </Trail>
      )

      expect(screen.queryByText(/Item/)).not.toBeInTheDocument()
    })
  })
})
