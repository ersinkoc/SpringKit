import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, act, cleanup } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import * as React from 'react'
import { SpringText, TypeWriter, SplitText } from '@oxog/springkit/react'

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

async function advanceFrames(frames: number) {
  for (let i = 0; i < frames; i++) {
    await act(async () => {
      vi.advanceTimersByTime(16)
    })
  }
}

function letterSpans(container: HTMLElement): HTMLElement[] {
  return Array.from((container.firstChild as HTMLElement).children) as HTMLElement[]
}

describe('SpringText family (regressions)', () => {
  beforeEach(() => {
    useAnimationClock()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('SpringText splits emoji / surrogate pairs as single characters', () => {
    const { container } = render(<SpringText>{'a😀b'}</SpringText>)
    expect(letterSpans(container).map((el) => el.textContent)).toEqual(['a', '😀', 'b'])
  })

  it('SplitText splits emoji / surrogate pairs as single characters', () => {
    const { container } = render(
      <SplitText render={(el) => <i>{el}</i>}>{'👍x'}</SplitText>
    )
    expect(letterSpans(container).map((el) => el.textContent)).toEqual(['👍', 'x'])
  })

  it('SpringText renders its text on the server', () => {
    const html = renderToString(<SpringText>Hi</SpringText>)
    expect(html).toContain('>H<')
    expect(html).toContain('>i<')
  })

  it('SpringText with the default config completes its animation and calls onComplete once', async () => {
    const onComplete = vi.fn()
    const { container } = render(
      <SpringText stagger={10} onComplete={onComplete}>
        Hi
      </SpringText>
    )
    await advanceFrames(200)

    for (const span of letterSpans(container)) {
      expect(Number(span.style.opacity)).toBeCloseTo(1, 2)
    }
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('SpringText does not restart when re-rendered with a new inline onComplete', async () => {
    function Parent() {
      const [done, setDone] = React.useState(0)
      return (
        <div>
          <SpringText stagger={10} onComplete={() => setDone((n) => n + 1)}>
            Hi
          </SpringText>
          <b data-done={done} />
        </div>
      )
    }
    const { container } = render(<Parent />)
    await advanceFrames(200)

    const wrapper = container.firstChild!.firstChild as HTMLElement
    const spans = Array.from(wrapper.children) as HTMLElement[]
    for (const span of spans) {
      expect(Number(span.style.opacity)).toBeCloseTo(1, 2)
    }
    expect(container.querySelector('b')).toHaveAttribute('data-done', '1')
  })

  it('SpringText with animateOnMount={false} shows the text', () => {
    const { container } = render(<SpringText animateOnMount={false}>Hi</SpringText>)
    for (const span of letterSpans(container)) {
      expect(span.style.opacity).toBe('1')
    }
  })

  it('SpringText does not call onComplete after unmounting mid-stagger', async () => {
    const onComplete = vi.fn()
    const { unmount } = render(
      <SpringText stagger={100} onComplete={onComplete}>
        Hello
      </SpringText>
    )
    await advanceFrames(2)
    unmount()
    await advanceFrames(200)
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('TypeWriter types emoji without splitting surrogate pairs', async () => {
    const { container } = render(
      <TypeWriter speed={100} cursor={false}>
        {'😀😀'}
      </TypeWriter>
    )
    // delay 0 -> '' ; +100ms -> first character
    await act(async () => {
      vi.advanceTimersByTime(110)
    })
    expect(container.textContent).toBe('😀')
  })

  it('TypeWriter does not restart when re-rendered with a new inline onComplete', async () => {
    function Parent() {
      const [done, setDone] = React.useState(false)
      return (
        <div>
          <TypeWriter speed={10} cursor={false} onComplete={() => setDone(true)}>
            Hello
          </TypeWriter>
          {done && <b>done</b>}
        </div>
      )
    }
    const { container } = render(<Parent />)
    await act(async () => {
      vi.advanceTimersByTime(200)
    })
    expect(container.querySelector('b')).not.toBeNull()
    await act(async () => {
      vi.advanceTimersByTime(5)
    })
    expect(container.firstChild!.firstChild!.textContent).toBe('Hello')
  })
})
