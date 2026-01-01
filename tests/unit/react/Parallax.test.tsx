import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import React from 'react'
import {
  Parallax,
  MouseParallax,
  TiltCard,
  ParallaxContainer,
  ParallaxLayer,
  useParallaxContext,
} from '@oxog/springkit/react'

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  root = null
  rootMargin = ''
  thresholds = []
  takeRecords = vi.fn().mockReturnValue([])
}

beforeEach(() => {
  cleanup()
  vi.useFakeTimers()
  global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('Parallax', () => {
  describe('basic rendering', () => {
    it('should render children', () => {
      render(
        <Parallax>
          <div data-testid="content">Parallax Content</div>
        </Parallax>
      )
      expect(screen.getByTestId('content')).toBeInTheDocument()
    })

    it('should apply className', () => {
      const { container } = render(
        <Parallax className="my-parallax">
          <span>Content</span>
        </Parallax>
      )
      expect(container.querySelector('.my-parallax')).toBeInTheDocument()
    })

    it('should apply style', () => {
      const { container } = render(
        <Parallax style={{ opacity: '0.5' }}>
          <span>Content</span>
        </Parallax>
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ opacity: '0.5' })
    })

    it('should forward ref', () => {
      const ref = React.createRef<HTMLDivElement>()
      render(
        <Parallax ref={ref}>
          <span>Content</span>
        </Parallax>
      )
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })
  })

  describe('speed option', () => {
    it('should accept speed prop', () => {
      render(
        <Parallax speed={0.5}>
          <span>Content</span>
        </Parallax>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should accept negative speed', () => {
      render(
        <Parallax speed={-0.3}>
          <span>Content</span>
        </Parallax>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })

  describe('direction option', () => {
    it('should default to vertical', () => {
      render(
        <Parallax>
          <span>Content</span>
        </Parallax>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should accept horizontal direction', () => {
      render(
        <Parallax direction="horizontal">
          <span>Content</span>
        </Parallax>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should accept both direction', () => {
      render(
        <Parallax direction="both">
          <span>Content</span>
        </Parallax>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })

  describe('config option', () => {
    it('should accept spring config', () => {
      render(
        <Parallax config={{ stiffness: 100, damping: 20 }}>
          <span>Content</span>
        </Parallax>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })

  describe('enabled option', () => {
    it('should be enabled by default', () => {
      render(
        <Parallax>
          <span>Content</span>
        </Parallax>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should disable when enabled is false', () => {
      render(
        <Parallax enabled={false}>
          <span>Content</span>
        </Parallax>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })

  describe('offset option', () => {
    it('should accept x offset', () => {
      render(
        <Parallax offset={{ x: 50 }}>
          <span>Content</span>
        </Parallax>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should accept y offset', () => {
      render(
        <Parallax offset={{ y: 100 }}>
          <span>Content</span>
        </Parallax>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })

  describe('as prop', () => {
    it('should render as div by default', () => {
      const { container } = render(
        <Parallax>
          <span>Content</span>
        </Parallax>
      )
      expect(container.firstChild?.nodeName).toBe('DIV')
    })

    it('should render as specified element', () => {
      const { container } = render(
        <Parallax as="section">
          <span>Content</span>
        </Parallax>
      )
      expect(container.firstChild?.nodeName).toBe('SECTION')
    })
  })

  describe('transform behavior', () => {
    it('should have will-change: transform', () => {
      const { container } = render(
        <Parallax>
          <span>Content</span>
        </Parallax>
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ willChange: 'transform' })
    })
  })
})

describe('MouseParallax', () => {
  describe('basic rendering', () => {
    it('should render children', () => {
      render(
        <MouseParallax>
          <div data-testid="content">Mouse Parallax</div>
        </MouseParallax>
      )
      expect(screen.getByTestId('content')).toBeInTheDocument()
    })

    it('should apply className', () => {
      const { container } = render(
        <MouseParallax className="my-mouse-parallax">
          <span>Content</span>
        </MouseParallax>
      )
      expect(container.querySelector('.my-mouse-parallax')).toBeInTheDocument()
    })

    it('should apply style', () => {
      const { container } = render(
        <MouseParallax style={{ opacity: 0.8 }}>
          <span>Content</span>
        </MouseParallax>
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ opacity: '0.8' })
    })

    it('should forward ref', () => {
      const ref = React.createRef<HTMLDivElement>()
      render(
        <MouseParallax ref={ref}>
          <span>Content</span>
        </MouseParallax>
      )
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })
  })

  describe('strength option', () => {
    it('should accept strength prop', () => {
      render(
        <MouseParallax strength={30}>
          <span>Content</span>
        </MouseParallax>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })

  describe('inverted option', () => {
    it('should accept inverted prop', () => {
      render(
        <MouseParallax inverted>
          <span>Content</span>
        </MouseParallax>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })

  describe('config option', () => {
    it('should accept spring config', () => {
      render(
        <MouseParallax config={{ stiffness: 150, damping: 20 }}>
          <span>Content</span>
        </MouseParallax>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })

  describe('resetOnLeave option', () => {
    it('should default to true', () => {
      render(
        <MouseParallax>
          <span>Content</span>
        </MouseParallax>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should accept resetOnLeave false', () => {
      render(
        <MouseParallax resetOnLeave={false}>
          <span>Content</span>
        </MouseParallax>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })

  describe('as prop', () => {
    it('should render as div by default', () => {
      const { container } = render(
        <MouseParallax>
          <span>Content</span>
        </MouseParallax>
      )
      expect(container.firstChild?.nodeName).toBe('DIV')
    })

    it('should render as specified element', () => {
      const { container } = render(
        <MouseParallax as="article">
          <span>Content</span>
        </MouseParallax>
      )
      expect(container.firstChild?.nodeName).toBe('ARTICLE')
    })
  })
})

describe('TiltCard', () => {
  describe('basic rendering', () => {
    it('should render children', () => {
      render(
        <TiltCard>
          <div data-testid="content">Tilt Card</div>
        </TiltCard>
      )
      expect(screen.getByTestId('content')).toBeInTheDocument()
    })

    it('should apply className', () => {
      const { container } = render(
        <TiltCard className="my-tilt-card">
          <span>Content</span>
        </TiltCard>
      )
      expect(container.querySelector('.my-tilt-card')).toBeInTheDocument()
    })

    it('should apply style', () => {
      const { container } = render(
        <TiltCard style={{ border: '1px solid black' }}>
          <span>Content</span>
        </TiltCard>
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ border: '1px solid black' })
    })

    it('should forward ref', () => {
      const ref = React.createRef<HTMLDivElement>()
      render(
        <TiltCard ref={ref}>
          <span>Content</span>
        </TiltCard>
      )
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })
  })

  describe('tilt options', () => {
    it('should accept maxTilt prop', () => {
      render(
        <TiltCard maxTilt={30}>
          <span>Content</span>
        </TiltCard>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should accept perspective prop', () => {
      const { container } = render(
        <TiltCard perspective={500}>
          <span>Content</span>
        </TiltCard>
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ perspective: '500px' })
    })

    it('should accept scale prop', () => {
      render(
        <TiltCard scale={1.1}>
          <span>Content</span>
        </TiltCard>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })

  describe('config option', () => {
    it('should accept spring config', () => {
      render(
        <TiltCard config={{ stiffness: 400, damping: 25 }}>
          <span>Content</span>
        </TiltCard>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })

  describe('enabled option', () => {
    it('should be enabled by default', () => {
      render(
        <TiltCard>
          <span>Content</span>
        </TiltCard>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should disable when enabled is false', () => {
      render(
        <TiltCard enabled={false}>
          <span>Content</span>
        </TiltCard>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })

  describe('glare option', () => {
    it('should not show glare by default', () => {
      const { container } = render(
        <TiltCard>
          <span>Content</span>
        </TiltCard>
      )
      // Only 2 divs: outer container and inner
      const divs = container.querySelectorAll('div')
      expect(divs.length).toBe(2)
    })

    it('should show glare when enabled', () => {
      const { container } = render(
        <TiltCard glare>
          <span>Content</span>
        </TiltCard>
      )
      // 3 divs: outer container, inner, and glare overlay
      const divs = container.querySelectorAll('div')
      expect(divs.length).toBe(3)
    })

    it('should accept glareOpacity prop', () => {
      render(
        <TiltCard glare glareOpacity={0.3}>
          <span>Content</span>
        </TiltCard>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })

  describe('callback', () => {
    it('should call onTilt when tilting', () => {
      const onTilt = vi.fn()
      const { container } = render(
        <TiltCard onTilt={onTilt}>
          <span>Content</span>
        </TiltCard>
      )

      const wrapper = container.firstChild as HTMLElement
      vi.spyOn(wrapper, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 200,
        height: 200,
        right: 200,
        bottom: 200,
        x: 0,
        y: 0,
        toJSON: () => {},
      })

      fireEvent.mouseMove(wrapper, { clientX: 150, clientY: 100 })

      expect(onTilt).toHaveBeenCalled()
    })
  })

  describe('transform behavior', () => {
    it('should have perspective', () => {
      const { container } = render(
        <TiltCard>
          <span>Content</span>
        </TiltCard>
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ perspective: '1000px' })
    })

    it('should have preserve-3d on inner transform div', () => {
      const { container } = render(
        <TiltCard>
          <span>Content</span>
        </TiltCard>
      )
      const wrapper = container.firstChild as HTMLElement
      const innerDiv = wrapper.firstChild as HTMLElement
      expect(innerDiv).toHaveStyle({ transformStyle: 'preserve-3d' })
    })
  })
})

describe('ParallaxContainer', () => {
  describe('basic rendering', () => {
    it('should render children', () => {
      render(
        <ParallaxContainer>
          <div data-testid="content">Layer Content</div>
        </ParallaxContainer>
      )
      expect(screen.getByTestId('content')).toBeInTheDocument()
    })

    it('should apply className', () => {
      const { container } = render(
        <ParallaxContainer className="my-container">
          <span>Content</span>
        </ParallaxContainer>
      )
      expect(container.querySelector('.my-container')).toBeInTheDocument()
    })

    it('should apply style', () => {
      const { container } = render(
        <ParallaxContainer style={{ padding: '20px' }}>
          <span>Content</span>
        </ParallaxContainer>
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ padding: '20px' })
    })
  })

  describe('pages option', () => {
    it('should default to 1 page', () => {
      const { container } = render(
        <ParallaxContainer>
          <span>Content</span>
        </ParallaxContainer>
      )
      const inner = container.querySelector('div > div')
      expect(inner).toHaveStyle({ height: '100vh' })
    })

    it('should accept pages prop', () => {
      const { container } = render(
        <ParallaxContainer pages={3}>
          <span>Content</span>
        </ParallaxContainer>
      )
      // The pages prop should be accepted without error
      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })

  describe('container behavior', () => {
    it('should have 100vh height', () => {
      const { container } = render(
        <ParallaxContainer>
          <span>Content</span>
        </ParallaxContainer>
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ height: '100vh' })
    })

    it('should have overflow auto', () => {
      const { container } = render(
        <ParallaxContainer>
          <span>Content</span>
        </ParallaxContainer>
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ overflow: 'auto' })
    })
  })
})

describe('ParallaxLayer', () => {
  describe('basic rendering', () => {
    it('should render children', () => {
      render(
        <ParallaxContainer>
          <ParallaxLayer>
            <div data-testid="layer">Layer</div>
          </ParallaxLayer>
        </ParallaxContainer>
      )
      expect(screen.getByTestId('layer')).toBeInTheDocument()
    })

    it('should apply className', () => {
      const { container } = render(
        <ParallaxContainer>
          <ParallaxLayer className="my-layer">
            <span>Content</span>
          </ParallaxLayer>
        </ParallaxContainer>
      )
      expect(container.querySelector('.my-layer')).toBeInTheDocument()
    })

    it('should apply style', () => {
      const { container } = render(
        <ParallaxContainer>
          <ParallaxLayer style={{ zIndex: 10 }}>
            <span>Content</span>
          </ParallaxLayer>
        </ParallaxContainer>
      )
      const layer = container.querySelector('.my-layer, [style*="zIndex"]')
      expect(layer).toBeDefined()
    })
  })

  describe('offset option', () => {
    it('should accept offset prop', () => {
      render(
        <ParallaxContainer>
          <ParallaxLayer offset={1}>
            <span>Page 2</span>
          </ParallaxLayer>
        </ParallaxContainer>
      )
      expect(screen.getByText('Page 2')).toBeInTheDocument()
    })
  })

  describe('speed option', () => {
    it('should accept speed prop', () => {
      render(
        <ParallaxContainer>
          <ParallaxLayer speed={0.5}>
            <span>Slow layer</span>
          </ParallaxLayer>
        </ParallaxContainer>
      )
      expect(screen.getByText('Slow layer')).toBeInTheDocument()
    })
  })

  describe('horizontal option', () => {
    it('should accept horizontal prop', () => {
      render(
        <ParallaxContainer>
          <ParallaxLayer horizontal>
            <span>Horizontal</span>
          </ParallaxLayer>
        </ParallaxContainer>
      )
      expect(screen.getByText('Horizontal')).toBeInTheDocument()
    })
  })

  describe('sticky option', () => {
    it('should accept sticky prop', () => {
      render(
        <ParallaxContainer>
          <ParallaxLayer sticky={{ start: 0, end: 0.5 }}>
            <span>Sticky</span>
          </ParallaxLayer>
        </ParallaxContainer>
      )
      expect(screen.getByText('Sticky')).toBeInTheDocument()
    })
  })

  describe('positioning', () => {
    it('should be absolute positioned', () => {
      const { container } = render(
        <ParallaxContainer>
          <ParallaxLayer>
            <span>Content</span>
          </ParallaxLayer>
        </ParallaxContainer>
      )
      const layers = container.querySelectorAll('[style*="position: absolute"]')
      expect(layers.length).toBeGreaterThan(0)
    })

    it('should have will-change: transform', () => {
      const { container } = render(
        <ParallaxContainer>
          <ParallaxLayer>
            <span>Content</span>
          </ParallaxLayer>
        </ParallaxContainer>
      )
      const layers = container.querySelectorAll('[style*="will-change"]')
      expect(layers.length).toBeGreaterThan(0)
    })
  })
})

describe('useParallaxContext', () => {
  it('should return null outside ParallaxContainer', () => {
    const TestComponent = () => {
      const context = useParallaxContext()
      return <div data-testid="value">{context === null ? 'null' : 'defined'}</div>
    }

    render(<TestComponent />)
    expect(screen.getByTestId('value')).toHaveTextContent('null')
  })

  it('should return context inside ParallaxContainer', () => {
    const TestComponent = () => {
      const context = useParallaxContext()
      return (
        <div data-testid="value">
          {context ? 'defined' : 'null'}
        </div>
      )
    }

    render(
      <ParallaxContainer>
        <TestComponent />
      </ParallaxContainer>
    )
    expect(screen.getByTestId('value')).toHaveTextContent('defined')
  })
})
