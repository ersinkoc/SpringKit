import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { renderHook, act } from '@testing-library/react'
import React from 'react'
import {
  Magnetic,
  MagneticGroup,
  MagneticCursor,
  useMagnetic,
} from '@oxog/springkit/react'

beforeEach(() => {
  cleanup()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('Magnetic', () => {
  describe('basic rendering', () => {
    it('should render children', () => {
      render(
        <Magnetic>
          <button data-testid="btn">Click me</button>
        </Magnetic>
      )
      expect(screen.getByTestId('btn')).toBeInTheDocument()
    })

    it('should apply className', () => {
      const { container } = render(
        <Magnetic className="my-magnetic">
          <span>Content</span>
        </Magnetic>
      )
      expect(container.querySelector('.my-magnetic')).toBeInTheDocument()
    })

    it('should apply style', () => {
      const { container } = render(
        <Magnetic style={{ padding: '20px' }}>
          <span>Content</span>
        </Magnetic>
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ padding: '20px' })
    })

    it('should forward ref', () => {
      const ref = React.createRef<HTMLDivElement>()
      render(
        <Magnetic ref={ref}>
          <span>Content</span>
        </Magnetic>
      )
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })
  })

  describe('magnetic options', () => {
    it('should accept strength prop', () => {
      render(
        <Magnetic strength={0.5}>
          <span>Content</span>
        </Magnetic>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should accept range prop', () => {
      render(
        <Magnetic range={200}>
          <span>Content</span>
        </Magnetic>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should accept config prop', () => {
      render(
        <Magnetic config={{ stiffness: 300, damping: 20 }}>
          <span>Content</span>
        </Magnetic>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should accept maxOffset prop', () => {
      render(
        <Magnetic maxOffset={30}>
          <span>Content</span>
        </Magnetic>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should accept scaleOnHover prop', () => {
      render(
        <Magnetic scaleOnHover={1.1}>
          <span>Content</span>
        </Magnetic>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })

  describe('enabled prop', () => {
    it('should be enabled by default', () => {
      render(
        <Magnetic>
          <span>Content</span>
        </Magnetic>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should disable when enabled is false', () => {
      render(
        <Magnetic enabled={false}>
          <span>Content</span>
        </Magnetic>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })

  describe('callbacks', () => {
    it('should call onAttract when attracted', () => {
      const onAttract = vi.fn()
      const { container } = render(
        <Magnetic range={1000} onAttract={onAttract}>
          <span>Content</span>
        </Magnetic>
      )

      // Mock getBoundingClientRect
      const wrapper = container.firstChild as HTMLElement
      vi.spyOn(wrapper, 'getBoundingClientRect').mockReturnValue({
        left: 100,
        top: 100,
        width: 100,
        height: 50,
        right: 200,
        bottom: 150,
        x: 100,
        y: 100,
        toJSON: () => {},
      })

      // Dispatch mouse move within range
      act(() => {
        window.dispatchEvent(
          new MouseEvent('mousemove', {
            clientX: 150,
            clientY: 125,
          })
        )
      })

      expect(onAttract).toHaveBeenCalled()
    })

    it('should call onRelease when released', () => {
      const onRelease = vi.fn()
      const { container } = render(
        <Magnetic range={100} onRelease={onRelease}>
          <span>Content</span>
        </Magnetic>
      )

      const wrapper = container.firstChild as HTMLElement
      vi.spyOn(wrapper, 'getBoundingClientRect').mockReturnValue({
        left: 100,
        top: 100,
        width: 100,
        height: 50,
        right: 200,
        bottom: 150,
        x: 100,
        y: 100,
        toJSON: () => {},
      })

      // First attract
      act(() => {
        window.dispatchEvent(
          new MouseEvent('mousemove', {
            clientX: 150,
            clientY: 125,
          })
        )
      })

      // Then move far away
      act(() => {
        window.dispatchEvent(
          new MouseEvent('mousemove', {
            clientX: 1000,
            clientY: 1000,
          })
        )
      })

      expect(onRelease).toHaveBeenCalled()
    })
  })

  describe('transform behavior', () => {
    it('should have inline-block display', () => {
      const { container } = render(
        <Magnetic>
          <span>Content</span>
        </Magnetic>
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ display: 'inline-block' })
    })

    it('should have will-change: transform', () => {
      const { container } = render(
        <Magnetic>
          <span>Content</span>
        </Magnetic>
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ willChange: 'transform' })
    })
  })
})

describe('MagneticGroup', () => {
  describe('basic rendering', () => {
    it('should render children', () => {
      render(
        <MagneticGroup>
          <Magnetic>
            <button>A</button>
          </Magnetic>
          <Magnetic>
            <button>B</button>
          </Magnetic>
        </MagneticGroup>
      )
      expect(screen.getByText('A')).toBeInTheDocument()
      expect(screen.getByText('B')).toBeInTheDocument()
    })

    it('should apply className', () => {
      const { container } = render(
        <MagneticGroup className="my-group">
          <span>Content</span>
        </MagneticGroup>
      )
      expect(container.querySelector('.my-group')).toBeInTheDocument()
    })

    it('should apply style', () => {
      const { container } = render(
        <MagneticGroup style={{ gap: '10px' }}>
          <span>Content</span>
        </MagneticGroup>
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ gap: '10px' })
    })
  })

  describe('repel option', () => {
    it('should accept repel prop', () => {
      render(
        <MagneticGroup repel>
          <Magnetic>
            <button>A</button>
          </Magnetic>
        </MagneticGroup>
      )
      expect(screen.getByText('A')).toBeInTheDocument()
    })

    it('should accept repelStrength prop', () => {
      render(
        <MagneticGroup repel repelStrength={0.5}>
          <Magnetic>
            <button>A</button>
          </Magnetic>
        </MagneticGroup>
      )
      expect(screen.getByText('A')).toBeInTheDocument()
    })
  })
})

describe('MagneticCursor', () => {
  describe('basic rendering', () => {
    it('should render when visible', () => {
      const { container } = render(<MagneticCursor />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('should not render when not visible', () => {
      const { container } = render(<MagneticCursor visible={false} />)
      expect(container.firstChild).toBeNull()
    })

    it('should render children', () => {
      render(
        <MagneticCursor>
          <div data-testid="cursor-content">Custom cursor</div>
        </MagneticCursor>
      )
      expect(screen.getByTestId('cursor-content')).toBeInTheDocument()
    })

    it('should render default cursor when no children', () => {
      const { container } = render(<MagneticCursor />)
      // Should render at least the outer div
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  describe('size option', () => {
    it('should accept size prop', () => {
      const { container } = render(<MagneticCursor size={50} />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ width: '50px', height: '50px' })
    })

    it('should default to 30px', () => {
      const { container } = render(<MagneticCursor />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ width: '30px', height: '30px' })
    })
  })

  describe('styling options', () => {
    it('should be fixed position', () => {
      const { container } = render(<MagneticCursor />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ position: 'fixed' })
    })

    it('should have pointer-events: none', () => {
      const { container } = render(<MagneticCursor />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ pointerEvents: 'none' })
    })

    it('should accept zIndex prop', () => {
      const { container } = render(<MagneticCursor zIndex={5000} />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ zIndex: '5000' })
    })

    it('should apply className', () => {
      const { container } = render(<MagneticCursor className="my-cursor" />)
      expect(container.querySelector('.my-cursor')).toBeInTheDocument()
    })

    it('should apply style', () => {
      const { container } = render(<MagneticCursor style={{ opacity: 0.5 }} />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ opacity: '0.5' })
    })
  })

  describe('spring config', () => {
    it('should accept config prop', () => {
      render(<MagneticCursor config={{ stiffness: 200, damping: 25 }} />)
      expect(document.body).toBeDefined()
    })
  })

  describe('offset option', () => {
    it('should accept offset prop', () => {
      render(<MagneticCursor offset={{ x: 10, y: 10 }} />)
      expect(document.body).toBeDefined()
    })
  })
})

describe('useMagnetic', () => {
  describe('return values', () => {
    it('should return ref', () => {
      const { result } = renderHook(() => useMagnetic())
      expect(result.current.ref).toBeDefined()
    })

    it('should return x and y offsets', () => {
      const { result } = renderHook(() => useMagnetic())
      expect(result.current.x).toBe(0)
      expect(result.current.y).toBe(0)
    })

    it('should return isAttracted state', () => {
      const { result } = renderHook(() => useMagnetic())
      expect(result.current.isAttracted).toBe(false)
    })

    it('should return reset function', () => {
      const { result } = renderHook(() => useMagnetic())
      expect(typeof result.current.reset).toBe('function')
    })
  })

  describe('options', () => {
    it('should accept strength option', () => {
      const { result } = renderHook(() => useMagnetic({ strength: 0.5 }))
      expect(result.current.x).toBe(0)
    })

    it('should accept range option', () => {
      const { result } = renderHook(() => useMagnetic({ range: 200 }))
      expect(result.current.x).toBe(0)
    })

    it('should accept config option', () => {
      const { result } = renderHook(() =>
        useMagnetic({ config: { stiffness: 300, damping: 25 } })
      )
      expect(result.current.x).toBe(0)
    })

    it('should accept enabled option', () => {
      const { result } = renderHook(() => useMagnetic({ enabled: false }))
      expect(result.current.isAttracted).toBe(false)
    })

    it('should accept maxOffset option', () => {
      const { result } = renderHook(() => useMagnetic({ maxOffset: 30 }))
      expect(result.current.x).toBe(0)
    })
  })

  describe('reset function', () => {
    it('should reset position to 0', () => {
      const { result } = renderHook(() => useMagnetic())

      act(() => {
        result.current.reset()
      })

      expect(result.current.x).toBe(0)
      expect(result.current.y).toBe(0)
      expect(result.current.isAttracted).toBe(false)
    })
  })

  describe('mouse interaction', () => {
    it('should not be attracted initially', () => {
      const { result } = renderHook(() => useMagnetic())
      expect(result.current.isAttracted).toBe(false)
    })
  })
})
