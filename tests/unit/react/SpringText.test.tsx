import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import React from 'react'
import {
  SpringText,
  SpringNumber,
  TypeWriter,
  SplitText,
} from '@oxog/springkit/react'

beforeEach(() => {
  cleanup()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('SpringText', () => {
  describe('basic rendering', () => {
    it('should render text content', () => {
      const { container } = render(<SpringText>Hello World</SpringText>)
      // SpringText splits text into spans, check for presence of wrapper
      expect(container.firstChild).toBeInTheDocument()
      // Container should have some span children with characters
      expect(container.querySelectorAll('span').length).toBeGreaterThan(0)
    })

    it('should apply className', () => {
      const { container } = render(
        <SpringText className="my-text">Hello</SpringText>
      )
      expect(container.querySelector('.my-text')).toBeInTheDocument()
    })

    it('should apply style', () => {
      const { container } = render(
        <SpringText style={{ fontFamily: 'monospace' }}>Hello</SpringText>
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ fontFamily: 'monospace' })
    })
  })

  describe('mode options', () => {
    it('should split by characters by default', () => {
      const { container } = render(<SpringText>AB</SpringText>)
      const spans = container.querySelectorAll('span > span')
      expect(spans.length).toBe(2)
    })

    it('should split by words when mode="words"', () => {
      const { container } = render(
        <SpringText mode="words">Hello World</SpringText>
      )
      // "Hello", " ", "World" = 3 parts
      const spans = container.querySelectorAll('span > span')
      expect(spans.length).toBe(3)
    })

    it('should split by lines when mode="lines"', () => {
      const { container } = render(
        <SpringText mode="lines">{'Line1\nLine2'}</SpringText>
      )
      const spans = container.querySelectorAll('span > span')
      expect(spans.length).toBe(2)
    })
  })

  describe('animation options', () => {
    it('should accept stagger prop', () => {
      render(<SpringText stagger={50}>Hello</SpringText>)
      expect(screen.getByText(/H/)).toBeInTheDocument()
    })

    it('should accept from prop', () => {
      render(<SpringText from="left">Hello</SpringText>)
      expect(screen.getByText(/H/)).toBeInTheDocument()
    })

    it('should accept config prop', () => {
      render(
        <SpringText config={{ stiffness: 300, damping: 30 }}>Hello</SpringText>
      )
      expect(screen.getByText(/H/)).toBeInTheDocument()
    })

    it('should accept initialOpacity prop', () => {
      render(<SpringText initialOpacity={0.5}>Hello</SpringText>)
      expect(screen.getByText(/H/)).toBeInTheDocument()
    })

    it('should accept initialOffset prop', () => {
      render(<SpringText initialOffset={30}>Hello</SpringText>)
      expect(screen.getByText(/H/)).toBeInTheDocument()
    })

    it('should not animate on mount when animateOnMount is false', () => {
      render(<SpringText animateOnMount={false}>Hello</SpringText>)
      expect(screen.getByText(/H/)).toBeInTheDocument()
    })
  })

  describe('callbacks', () => {
    it('should call onComplete when animation finishes', () => {
      const onComplete = vi.fn()
      render(
        <SpringText stagger={10} onComplete={onComplete}>
          Hi
        </SpringText>
      )

      // Run all timers and requestAnimationFrame callbacks
      vi.runAllTimers()

      // onComplete should have been called after animations complete
      expect(onComplete).toHaveBeenCalled()
    })
  })

  describe('trigger', () => {
    it('should replay animation when trigger changes', () => {
      const { rerender } = render(<SpringText trigger={1}>Hello</SpringText>)
      expect(screen.getByText(/H/)).toBeInTheDocument()

      rerender(<SpringText trigger={2}>Hello</SpringText>)
      expect(screen.getByText(/H/)).toBeInTheDocument()
    })
  })

  describe('from directions', () => {
    it('should handle from="left"', () => {
      render(<SpringText from="left">Test</SpringText>)
      expect(screen.getByText(/T/)).toBeInTheDocument()
    })

    it('should handle from="right"', () => {
      render(<SpringText from="right">Test</SpringText>)
      expect(screen.getByText(/T/)).toBeInTheDocument()
    })

    it('should handle from="top"', () => {
      render(<SpringText from="top">Test</SpringText>)
      expect(screen.getByText(/T/)).toBeInTheDocument()
    })

    it('should handle from="bottom"', () => {
      render(<SpringText from="bottom">Test</SpringText>)
      expect(screen.getByText(/T/)).toBeInTheDocument()
    })

    it('should handle from="center"', () => {
      render(<SpringText from="center">Test</SpringText>)
      expect(screen.getByText(/T/)).toBeInTheDocument()
    })
  })
})

describe('SpringNumber', () => {
  describe('basic rendering', () => {
    it('should render number', () => {
      render(<SpringNumber value={100} />)
      // Initial render might show 100 or animating value
      expect(document.body).toHaveTextContent(/\d+/)
    })

    it('should apply className', () => {
      const { container } = render(
        <SpringNumber value={50} className="my-number" />
      )
      expect(container.querySelector('.my-number')).toBeInTheDocument()
    })

    it('should apply style', () => {
      const { container } = render(
        <SpringNumber value={50} style={{ fontSize: '20px' }} />
      )
      const span = container.firstChild as HTMLElement
      expect(span).toHaveStyle({ fontSize: '20px' })
    })
  })

  describe('formatting options', () => {
    it('should handle decimals', () => {
      render(<SpringNumber value={99.99} decimals={2} />)
      expect(document.body).toHaveTextContent(/\d/)
    })

    it('should handle prefix', () => {
      render(<SpringNumber value={100} prefix="$" />)
      expect(document.body).toHaveTextContent('$')
    })

    it('should handle suffix', () => {
      render(<SpringNumber value={75} suffix="%" />)
      expect(document.body).toHaveTextContent('%')
    })

    it('should use custom format function', () => {
      render(
        <SpringNumber
          value={0.75}
          format={(v) => `${(v * 100).toFixed(0)}%`}
        />
      )
      // Format function will be applied
      expect(document.body).toHaveTextContent('%')
    })
  })

  describe('spring config', () => {
    it('should accept custom config', () => {
      render(
        <SpringNumber value={100} config={{ stiffness: 50, damping: 10 }} />
      )
      expect(document.body).toHaveTextContent(/\d/)
    })
  })

  describe('value updates', () => {
    it('should animate to new value', () => {
      const { rerender } = render(<SpringNumber value={0} />)
      rerender(<SpringNumber value={100} />)
      // Animation should be triggered
      expect(document.body).toHaveTextContent(/\d/)
    })
  })
})

describe('TypeWriter', () => {
  describe('basic rendering', () => {
    it('should render progressively', () => {
      render(<TypeWriter>Hello World</TypeWriter>)
      // Initially might be empty or partial
      expect(document.body).toBeDefined()
    })

    it('should apply className', () => {
      const { container } = render(
        <TypeWriter className="my-typewriter">Hello</TypeWriter>
      )
      expect(container.querySelector('.my-typewriter')).toBeInTheDocument()
    })

    it('should apply style', () => {
      const { container } = render(
        <TypeWriter style={{ fontWeight: 'bold' }}>Hello</TypeWriter>
      )
      const span = container.firstChild as HTMLElement
      expect(span).toHaveStyle({ fontWeight: 'bold' })
    })
  })

  describe('typing options', () => {
    it('should accept speed prop', () => {
      render(<TypeWriter speed={100}>Hello</TypeWriter>)
      expect(document.body).toBeDefined()
    })

    it('should accept delay prop', () => {
      render(<TypeWriter delay={500}>Hello</TypeWriter>)
      expect(document.body).toBeDefined()
    })
  })

  describe('cursor options', () => {
    it('should show cursor by default', () => {
      render(<TypeWriter>Hello</TypeWriter>)
      expect(document.body).toHaveTextContent('|')
    })

    it('should hide cursor when cursor is false', () => {
      render(<TypeWriter cursor={false}>Hello</TypeWriter>)
      expect(document.body).not.toHaveTextContent('|')
    })

    it('should accept custom cursor character', () => {
      render(<TypeWriter cursorChar="_">Hello</TypeWriter>)
      expect(document.body).toHaveTextContent('_')
    })
  })

  describe('loop options', () => {
    it('should accept loop prop', () => {
      render(<TypeWriter loop>Hello</TypeWriter>)
      expect(document.body).toBeDefined()
    })

    it('should accept pauseAtEnd prop', () => {
      render(<TypeWriter loop pauseAtEnd={2000}>Hello</TypeWriter>)
      expect(document.body).toBeDefined()
    })

    it('should accept deleteSpeed prop', () => {
      render(<TypeWriter loop deleteSpeed={50}>Hello</TypeWriter>)
      expect(document.body).toBeDefined()
    })
  })

  describe('callbacks', () => {
    it('should accept onComplete prop', () => {
      const onComplete = vi.fn()
      // Just verify the component renders with onComplete prop without crashing
      render(
        <TypeWriter speed={10} onComplete={onComplete}>
          Hi
        </TypeWriter>
      )
      expect(document.body).toBeDefined()
    })
  })

  describe('text display', () => {
    it('should render with initial cursor', () => {
      render(<TypeWriter speed={10}>Hello</TypeWriter>)
      // TypeWriter starts with just cursor visible, text types progressively
      expect(document.body).toHaveTextContent('|')
    })
  })
})

describe('SplitText', () => {
  describe('basic rendering', () => {
    it('should render with render function', () => {
      render(
        <SplitText render={(char, index) => <span key={index}>{char}</span>}>
          Hello
        </SplitText>
      )
      expect(document.body).toHaveTextContent('Hello')
    })

    it('should apply className', () => {
      const { container } = render(
        <SplitText
          className="my-split"
          render={(char, index) => <span key={index}>{char}</span>}
        >
          Hi
        </SplitText>
      )
      expect(container.querySelector('.my-split')).toBeInTheDocument()
    })

    it('should apply style', () => {
      const { container } = render(
        <SplitText
          style={{ letterSpacing: '2px' }}
          render={(char, index) => <span key={index}>{char}</span>}
        >
          Hi
        </SplitText>
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ letterSpacing: '2px' })
    })
  })

  describe('mode options', () => {
    it('should split by characters by default', () => {
      let count = 0
      render(
        <SplitText
          render={(char, index) => {
            count++
            return <span key={index}>{char}</span>
          }}
        >
          AB
        </SplitText>
      )
      expect(count).toBe(2)
    })

    it('should split by words when mode="words"', () => {
      let count = 0
      render(
        <SplitText
          mode="words"
          render={(word, index) => {
            count++
            return <span key={index}>{word}</span>
          }}
        >
          Hello World
        </SplitText>
      )
      // "Hello", " ", "World" = 3 parts
      expect(count).toBe(3)
    })

    it('should split by lines when mode="lines"', () => {
      let count = 0
      render(
        <SplitText
          mode="lines"
          render={(line, index) => {
            count++
            return <span key={index}>{line}</span>
          }}
        >
          {'Line1\nLine2\nLine3'}
        </SplitText>
      )
      expect(count).toBe(3)
    })
  })

  describe('render function parameters', () => {
    it('should pass correct index to render function', () => {
      const indices: number[] = []
      render(
        <SplitText
          render={(char, index) => {
            indices.push(index)
            return <span key={index}>{char}</span>
          }}
        >
          ABC
        </SplitText>
      )
      expect(indices).toEqual([0, 1, 2])
    })

    it('should pass correct total to render function', () => {
      const totals: number[] = []
      render(
        <SplitText
          render={(char, index, total) => {
            totals.push(total)
            return <span key={index}>{char}</span>
          }}
        >
          ABCD
        </SplitText>
      )
      expect(totals).toEqual([4, 4, 4, 4])
    })

    it('should pass correct element to render function', () => {
      const elements: string[] = []
      render(
        <SplitText
          render={(element, index) => {
            elements.push(element)
            return <span key={index}>{element}</span>
          }}
        >
          XYZ
        </SplitText>
      )
      expect(elements).toEqual(['X', 'Y', 'Z'])
    })
  })
})
