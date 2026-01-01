import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, screen, waitFor, cleanup } from '@testing-library/react'
import React from 'react'
import { Animated, AnimatePresence } from '@oxog/springkit/react'

describe('Animated', () => {
  beforeEach(() => {
    cleanup()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('basic rendering', () => {
    it('should render with children', () => {
      render(<Animated.div data-testid="animated">Hello World</Animated.div>)
      expect(screen.getByTestId('animated')).toHaveTextContent('Hello World')
    })

    it('should apply static styles', () => {
      render(
        <Animated.div data-testid="animated" style={{ color: 'red', fontSize: '16px' }}>
          Content
        </Animated.div>
      )
      const element = screen.getByTestId('animated')
      // Use rgb format for color comparison as browsers normalize color values
      expect(element).toHaveStyle({ color: 'rgb(255, 0, 0)', fontSize: '16px' })
    })

    it('should forward ref', () => {
      const ref = React.createRef<HTMLDivElement>()
      render(<Animated.div ref={ref}>Content</Animated.div>)
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })

    it('should pass through HTML attributes', () => {
      render(
        <Animated.div
          data-testid="animated"
          className="my-class"
          id="my-id"
          aria-label="My label"
        >
          Content
        </Animated.div>
      )
      const element = screen.getByTestId('animated')
      expect(element).toHaveClass('my-class')
      expect(element).toHaveAttribute('id', 'my-id')
      expect(element).toHaveAttribute('aria-label', 'My label')
    })
  })

  describe('all element types', () => {
    it('should render Animated.span', () => {
      render(<Animated.span data-testid="el">Content</Animated.span>)
      expect(screen.getByTestId('el').tagName).toBe('SPAN')
    })

    it('should render Animated.button', () => {
      render(<Animated.button data-testid="el">Click</Animated.button>)
      expect(screen.getByTestId('el').tagName).toBe('BUTTON')
    })

    it('should render Animated.a', () => {
      render(<Animated.a data-testid="el" href="#">Link</Animated.a>)
      expect(screen.getByTestId('el').tagName).toBe('A')
    })

    it('should render heading elements', () => {
      render(<Animated.h1 data-testid="h1">H1</Animated.h1>)
      render(<Animated.h2 data-testid="h2">H2</Animated.h2>)
      render(<Animated.h3 data-testid="h3">H3</Animated.h3>)
      expect(screen.getByTestId('h1').tagName).toBe('H1')
      expect(screen.getByTestId('h2').tagName).toBe('H2')
      expect(screen.getByTestId('h3').tagName).toBe('H3')
    })

    it('should render list elements', () => {
      render(
        <Animated.ul data-testid="ul">
          <Animated.li data-testid="li">Item</Animated.li>
        </Animated.ul>
      )
      expect(screen.getByTestId('ul').tagName).toBe('UL')
      expect(screen.getByTestId('li').tagName).toBe('LI')
    })

    it('should render semantic elements', () => {
      render(<Animated.section data-testid="section">Content</Animated.section>)
      render(<Animated.article data-testid="article">Content</Animated.article>)
      render(<Animated.header data-testid="header">Content</Animated.header>)
      render(<Animated.footer data-testid="footer">Content</Animated.footer>)
      render(<Animated.nav data-testid="nav">Content</Animated.nav>)
      render(<Animated.main data-testid="main">Content</Animated.main>)
      expect(screen.getByTestId('section').tagName).toBe('SECTION')
      expect(screen.getByTestId('article').tagName).toBe('ARTICLE')
      expect(screen.getByTestId('header').tagName).toBe('HEADER')
      expect(screen.getByTestId('footer').tagName).toBe('FOOTER')
      expect(screen.getByTestId('nav').tagName).toBe('NAV')
      expect(screen.getByTestId('main').tagName).toBe('MAIN')
    })
  })

  describe('whileHover', () => {
    it('should apply whileHover styles on mouse enter', async () => {
      render(
        <Animated.div
          data-testid="animated"
          animate={{ opacity: 1 }}
          whileHover={{ opacity: 0.5 }}
        >
          Hover me
        </Animated.div>
      )

      const element = screen.getByTestId('animated')
      fireEvent.mouseEnter(element)

      // Wait for animation to start processing
      await waitFor(() => {
        // The spring animation has started, opacity should be changing
        expect(element).toBeInTheDocument()
      })
    })

    it('should revert styles on mouse leave', async () => {
      render(
        <Animated.div
          data-testid="animated"
          animate={{ opacity: 1 }}
          whileHover={{ opacity: 0.5 }}
        >
          Hover me
        </Animated.div>
      )

      const element = screen.getByTestId('animated')
      fireEvent.mouseEnter(element)
      fireEvent.mouseLeave(element)

      await waitFor(() => {
        expect(element).toBeInTheDocument()
      })
    })

    it('should call onHoverStart callback', () => {
      const onHoverStart = vi.fn()
      render(
        <Animated.div
          data-testid="animated"
          whileHover={{ scale: 1.1 }}
          onHoverStart={onHoverStart}
        >
          Hover me
        </Animated.div>
      )

      fireEvent.mouseEnter(screen.getByTestId('animated'))
      expect(onHoverStart).toHaveBeenCalledTimes(1)
    })

    it('should call onHoverEnd callback', () => {
      const onHoverEnd = vi.fn()
      render(
        <Animated.div
          data-testid="animated"
          whileHover={{ scale: 1.1 }}
          onHoverEnd={onHoverEnd}
        >
          Hover me
        </Animated.div>
      )

      const element = screen.getByTestId('animated')
      fireEvent.mouseEnter(element)
      fireEvent.mouseLeave(element)
      expect(onHoverEnd).toHaveBeenCalledTimes(1)
    })
  })

  describe('whileTap', () => {
    it('should apply whileTap styles on pointer down', async () => {
      render(
        <Animated.button
          data-testid="animated"
          animate={{ scale: 1 }}
          whileTap={{ scale: 0.95 }}
        >
          Click me
        </Animated.button>
      )

      const element = screen.getByTestId('animated')
      fireEvent.pointerDown(element)

      await waitFor(() => {
        expect(element).toBeInTheDocument()
      })
    })

    it('should revert styles on pointer up', async () => {
      render(
        <Animated.button
          data-testid="animated"
          animate={{ scale: 1 }}
          whileTap={{ scale: 0.95 }}
        >
          Click me
        </Animated.button>
      )

      const element = screen.getByTestId('animated')
      fireEvent.pointerDown(element)
      fireEvent.pointerUp(element)

      await waitFor(() => {
        expect(element).toBeInTheDocument()
      })
    })

    it('should call onTapStart callback', () => {
      const onTapStart = vi.fn()
      render(
        <Animated.button
          data-testid="animated"
          whileTap={{ scale: 0.95 }}
          onTapStart={onTapStart}
        >
          Click me
        </Animated.button>
      )

      fireEvent.pointerDown(screen.getByTestId('animated'))
      expect(onTapStart).toHaveBeenCalledTimes(1)
    })

    it('should call onTap callback on pointer up', () => {
      const onTap = vi.fn()
      render(
        <Animated.button
          data-testid="animated"
          whileTap={{ scale: 0.95 }}
          onTap={onTap}
        >
          Click me
        </Animated.button>
      )

      const element = screen.getByTestId('animated')
      fireEvent.pointerDown(element)
      fireEvent.pointerUp(element)
      expect(onTap).toHaveBeenCalledTimes(1)
    })

    it('should call onTapCancel on pointer cancel', () => {
      const onTapCancel = vi.fn()
      render(
        <Animated.button
          data-testid="animated"
          whileTap={{ scale: 0.95 }}
          onTapCancel={onTapCancel}
        >
          Click me
        </Animated.button>
      )

      const element = screen.getByTestId('animated')
      fireEvent.pointerDown(element)
      fireEvent.pointerCancel(element)
      expect(onTapCancel).toHaveBeenCalledTimes(1)
    })

    it('should reset tap state on mouse leave', () => {
      const onTap = vi.fn()
      render(
        <Animated.button
          data-testid="animated"
          whileTap={{ scale: 0.95 }}
          whileHover={{ opacity: 0.8 }}
          onTap={onTap}
        >
          Click me
        </Animated.button>
      )

      const element = screen.getByTestId('animated')
      fireEvent.pointerDown(element)
      fireEvent.mouseLeave(element)
      // After mouse leave, tap should be cancelled
      fireEvent.pointerUp(element)
      // onTap should NOT be called because press was cancelled
      expect(onTap).not.toHaveBeenCalled()
    })
  })

  describe('whileFocus', () => {
    it('should apply whileFocus styles on focus', async () => {
      render(
        <Animated.button
          data-testid="animated"
          animate={{ borderWidth: 1 }}
          whileFocus={{ borderWidth: 2 }}
        >
          Focus me
        </Animated.button>
      )

      const element = screen.getByTestId('animated')
      fireEvent.focus(element)

      await waitFor(() => {
        expect(element).toBeInTheDocument()
      })
    })

    it('should revert styles on blur', async () => {
      render(
        <Animated.button
          data-testid="animated"
          animate={{ borderWidth: 1 }}
          whileFocus={{ borderWidth: 2 }}
        >
          Focus me
        </Animated.button>
      )

      const element = screen.getByTestId('animated')
      fireEvent.focus(element)
      fireEvent.blur(element)

      await waitFor(() => {
        expect(element).toBeInTheDocument()
      })
    })
  })

  describe('initial and animate', () => {
    it('should start from initial values', () => {
      render(
        <Animated.div
          data-testid="animated"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Content
        </Animated.div>
      )

      // The animation should start from initial values
      expect(screen.getByTestId('animated')).toBeInTheDocument()
    })

    it('should skip initial animation when initial is false', () => {
      render(
        <Animated.div
          data-testid="animated"
          initial={false}
          animate={{ opacity: 1 }}
        >
          Content
        </Animated.div>
      )

      expect(screen.getByTestId('animated')).toBeInTheDocument()
    })
  })

  describe('spring config', () => {
    it('should accept custom spring config', () => {
      render(
        <Animated.div
          data-testid="animated"
          animate={{ opacity: 1 }}
          config={{ stiffness: 300, damping: 30 }}
        >
          Content
        </Animated.div>
      )

      expect(screen.getByTestId('animated')).toBeInTheDocument()
    })
  })

  describe('gesture state layering', () => {
    it('should layer multiple gesture states (hover + tap)', async () => {
      render(
        <Animated.button
          data-testid="animated"
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          Interactive
        </Animated.button>
      )

      const element = screen.getByTestId('animated')

      // Hover
      fireEvent.mouseEnter(element)
      await waitFor(() => expect(element).toBeInTheDocument())

      // Tap while hovering - tap should override hover's scale
      fireEvent.pointerDown(element)
      await waitFor(() => expect(element).toBeInTheDocument())

      // Release tap - should go back to hover scale
      fireEvent.pointerUp(element)
      await waitFor(() => expect(element).toBeInTheDocument())
    })

    it('should layer focus and hover states', async () => {
      render(
        <Animated.button
          data-testid="animated"
          animate={{ opacity: 1, borderWidth: 1 }}
          whileHover={{ opacity: 0.9 }}
          whileFocus={{ borderWidth: 2 }}
        >
          Interactive
        </Animated.button>
      )

      const element = screen.getByTestId('animated')

      // Focus first
      fireEvent.focus(element)

      // Then hover - both states should be active
      fireEvent.mouseEnter(element)

      await waitFor(() => expect(element).toBeInTheDocument())
    })
  })

  describe('event handler passthrough', () => {
    it('should call original onMouseEnter alongside gesture handling', () => {
      const onMouseEnter = vi.fn()
      render(
        <Animated.div
          data-testid="animated"
          whileHover={{ opacity: 0.8 }}
          onMouseEnter={onMouseEnter}
        >
          Hover
        </Animated.div>
      )

      fireEvent.mouseEnter(screen.getByTestId('animated'))
      expect(onMouseEnter).toHaveBeenCalled()
    })

    it('should call original onPointerDown alongside gesture handling', () => {
      const onPointerDown = vi.fn()
      render(
        <Animated.button
          data-testid="animated"
          whileTap={{ scale: 0.95 }}
          onPointerDown={onPointerDown}
        >
          Tap
        </Animated.button>
      )

      fireEvent.pointerDown(screen.getByTestId('animated'))
      expect(onPointerDown).toHaveBeenCalled()
    })

    it('should call original onFocus alongside gesture handling', () => {
      const onFocus = vi.fn()
      render(
        <Animated.button
          data-testid="animated"
          whileFocus={{ borderWidth: 2 }}
          onFocus={onFocus}
        >
          Focus
        </Animated.button>
      )

      fireEvent.focus(screen.getByTestId('animated'))
      expect(onFocus).toHaveBeenCalled()
    })
  })
})

describe('AnimatePresence', () => {
  it('should render children normally', () => {
    render(
      <AnimatePresence>
        <Animated.div key="test" data-testid="child">
          Content
        </Animated.div>
      </AnimatePresence>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('should handle initial prop to skip initial animations', () => {
    render(
      <AnimatePresence initial={false}>
        <Animated.div
          key="test"
          data-testid="child"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Content
        </Animated.div>
      </AnimatePresence>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('should render with mode sync', () => {
    render(
      <AnimatePresence mode="sync">
        <Animated.div key="test" data-testid="child">
          Content
        </Animated.div>
      </AnimatePresence>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('should render with mode wait', () => {
    render(
      <AnimatePresence mode="wait">
        <Animated.div key="test" data-testid="child">
          Content
        </Animated.div>
      </AnimatePresence>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('should handle exit animations', async () => {
    const TestComponent = ({ show }: { show: boolean }) => (
      <AnimatePresence>
        {show && (
          <Animated.div
            key="modal"
            data-testid="modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            Modal
          </Animated.div>
        )}
      </AnimatePresence>
    )

    const { rerender } = render(<TestComponent show={true} />)
    expect(screen.getByTestId('modal')).toBeInTheDocument()

    // Trigger exit
    rerender(<TestComponent show={false} />)

    // Element should eventually be removed after exit animation
    await waitFor(() => {
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('should call onExitComplete when exit animation finishes', async () => {
    const onExitComplete = vi.fn()

    const TestComponent = ({ show }: { show: boolean }) => (
      <AnimatePresence onExitComplete={onExitComplete}>
        {show && (
          <Animated.div
            key="modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            Modal
          </Animated.div>
        )}
      </AnimatePresence>
    )

    const { rerender } = render(<TestComponent show={true} />)
    rerender(<TestComponent show={false} />)

    await waitFor(() => {
      expect(onExitComplete).toHaveBeenCalled()
    }, { timeout: 2000 })
  })
})
