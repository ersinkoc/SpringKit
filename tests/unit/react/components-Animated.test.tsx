import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, act, cleanup, screen, fireEvent } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import * as React from 'react'
import { Animated, MotionConfig } from '@oxog/springkit/react'

function useAnimationClock() {
  vi.useFakeTimers({
    toFake: [
      'setTimeout',
      'clearTimeout',
      'setInterval',
      'clearInterval',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'performance',
      'Date',
    ],
  })
}

/** Advance fake time frame by frame, flushing React updates */
async function advanceFrames(frames: number, onFrame?: () => void) {
  for (let i = 0; i < frames; i++) {
    // async act so the spring group's microtask notifications are flushed
    await act(async () => {
      vi.advanceTimersByTime(16)
    })
    onFrame?.()
  }
}

describe('Animated (regressions)', () => {
  beforeEach(() => {
    useAnimationClock()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('calls onTap without whileTap', () => {
    const onTap = vi.fn()
    render(<Animated.button data-testid="el" onTap={onTap}>Tap</Animated.button>)
    const el = screen.getByTestId('el')
    fireEvent.pointerDown(el)
    fireEvent.pointerUp(el)
    expect(onTap).toHaveBeenCalledTimes(1)
  })

  it('calls onTapCancel without whileTap', () => {
    const onTapCancel = vi.fn()
    render(<Animated.button data-testid="el" onTapCancel={onTapCancel}>Tap</Animated.button>)
    const el = screen.getByTestId('el')
    fireEvent.pointerDown(el)
    fireEvent.pointerCancel(el)
    expect(onTapCancel).toHaveBeenCalledTimes(1)
  })

  it('does not call onTap for a release after the press ended outside the element', () => {
    const onTap = vi.fn()
    render(<Animated.button data-testid="el" onTap={onTap}>Tap</Animated.button>)
    const el = screen.getByTestId('el')
    fireEvent.pointerDown(el)
    // Released outside the element
    fireEvent.pointerUp(document.body)
    // A later pointerup on the element without a new pointerdown is not a tap
    fireEvent.pointerUp(el)
    expect(onTap).not.toHaveBeenCalled()
  })

  it('passes user event handlers through when no gesture props are used', () => {
    const onMouseEnter = vi.fn()
    const onMouseLeave = vi.fn()
    const onPointerDown = vi.fn()
    const onPointerUp = vi.fn()
    const onFocus = vi.fn()
    const onBlur = vi.fn()
    render(
      <Animated.button
        data-testid="el"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onFocus={onFocus}
        onBlur={onBlur}
      >
        Button
      </Animated.button>
    )
    const el = screen.getByTestId('el')
    fireEvent.mouseEnter(el)
    fireEvent.mouseLeave(el)
    fireEvent.pointerDown(el)
    fireEvent.pointerUp(el)
    fireEvent.focus(el)
    fireEvent.blur(el)
    expect(onMouseEnter).toHaveBeenCalledTimes(1)
    expect(onMouseLeave).toHaveBeenCalledTimes(1)
    expect(onPointerDown).toHaveBeenCalledTimes(1)
    expect(onPointerUp).toHaveBeenCalledTimes(1)
    expect(onFocus).toHaveBeenCalledTimes(1)
    expect(onBlur).toHaveBeenCalledTimes(1)
  })

  it('animates numeric whileHover keys that are not in animate, and reverts them on leave', async () => {
    render(
      <Animated.button data-testid="el" whileHover={{ scale: 1.5 }} config={{ stiffness: 300, damping: 30 }}>
        Hover
      </Animated.button>
    )
    const el = screen.getByTestId('el')

    fireEvent.mouseEnter(el)
    await advanceFrames(120)
    expect(el.style.transform).toBe('scale(1.5)')

    fireEvent.mouseLeave(el)
    await advanceFrames(120)
    expect(el.style.transform).toBe('')
  })

  it('maps x/y shorthands to a transform and keeps the static transform', () => {
    render(
      <Animated.div
        data-testid="el"
        animate={{ y: -4 }}
        style={{ transform: 'rotate(10deg)' }}
      />
    )
    const el = screen.getByTestId('el')
    expect(el.style.transform).toBe('translateY(-4px) rotate(10deg)')
  })

  it('keeps numeric static style values when animate is provided', () => {
    render(<Animated.div data-testid="el" animate={{ opacity: 0.5 }} style={{ zIndex: 7 }} />)
    const el = screen.getByTestId('el')
    expect(el.style.zIndex).toBe('7')
    expect(el.style.opacity).toBe('0.5')
  })

  it('does not restart the spring (dropping its velocity) on every re-render', async () => {
    render(
      <Animated.div
        data-testid="el"
        initial={{ width: 0 }}
        animate={{ width: 100 }}
        config={{ stiffness: 300, damping: 5 }}
      />
    )
    const el = screen.getByTestId('el')
    let max = 0
    await advanceFrames(120, () => {
      max = Math.max(max, parseFloat(el.style.width) || 0)
    })
    // An underdamped spring overshoots its target
    expect(max).toBeGreaterThan(100)
  })

  it('ignores emulated mouse events from touch input for hover', () => {
    const onHoverStart = vi.fn()
    render(
      <Animated.button
        data-testid="el"
        whileHover={{ backgroundColor: 'red' }}
        onHoverStart={onHoverStart}
      >
        Touch
      </Animated.button>
    )
    const el = screen.getByTestId('el')
    fireEvent.pointerEnter(el, { pointerType: 'touch' })
    fireEvent.mouseEnter(el)
    expect(el.style.backgroundColor).toBe('')
    expect(onHoverStart).not.toHaveBeenCalled()

    // A real mouse hover still works
    fireEvent.pointerEnter(el, { pointerType: 'mouse' })
    fireEvent.mouseEnter(el)
    expect(el.style.backgroundColor).toBe('red')
    expect(onHoverStart).toHaveBeenCalledTimes(1)
  })

  it('renders initial values during SSR / first paint', () => {
    const html = renderToString(
      <Animated.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        Content
      </Animated.div>
    )
    expect(html).toContain('opacity:0')
  })

  it('respects MotionConfig reducedMotion="always" by skipping the animation', () => {
    render(
      <MotionConfig reducedMotion="always">
        <Animated.div data-testid="el" initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
      </MotionConfig>
    )
    expect(screen.getByTestId('el').style.opacity).toBe('1')
  })

  it('respects MotionConfig initial={false}', () => {
    render(
      <MotionConfig initial={false}>
        <Animated.div data-testid="el" initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
      </MotionConfig>
    )
    expect(screen.getByTestId('el').style.opacity).toBe('1')
  })

  it('works under StrictMode and does not warn after unmounting mid-animation', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { unmount } = render(
      <React.StrictMode>
        <Animated.div data-testid="el" initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
      </React.StrictMode>
    )
    await advanceFrames(3)
    const opacity = parseFloat(screen.getByTestId('el').style.opacity)
    expect(opacity).toBeGreaterThan(0)
    unmount()
    await advanceFrames(20)
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('has a displayName on the exported (memoized) component', () => {
    expect((Animated.div as { displayName?: string }).displayName).toBe('Animated.div')
  })
})
