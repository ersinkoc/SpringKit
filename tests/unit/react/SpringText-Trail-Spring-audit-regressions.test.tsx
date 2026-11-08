/**
 * Regressions found by the SpringText / Trail / Spring audit (F2201-F2203).
 * Deterministic: everything runs on installTestClock().
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, act, cleanup } from '@testing-library/react'
import * as React from 'react'
import { SpringText, SplitText, Spring } from '@oxog/springkit/react'
import { installTestClock, type TestClock } from '@oxog/springkit/testing'

let clock: TestClock | null = null
afterEach(() => {
  cleanup()
  clock?.uninstall()
  clock = null
  vi.restoreAllMocks()
})

type Mode = 'characters' | 'words' | 'lines'

/**
 * Records the opacities SpringText renders in every commit. The parent's layout
 * effect runs in the same commit as the SpringText DOM update, so it sees what
 * the first paint after a prop change would show.
 */
function Probe(props: {
  text: string
  mount: boolean
  trig: number
  mode?: Mode
  stagger?: number
  done?: () => void
  log: string[]
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  React.useLayoutEffect(() => {
    const spans = Array.from(ref.current!.firstElementChild!.children) as HTMLElement[]
    props.log.push(spans.map((s) => s.style.opacity || '-').join(','))
  })
  return (
    <div ref={ref}>
      <SpringText
        animateOnMount={props.mount}
        trigger={props.trig}
        mode={props.mode}
        stagger={props.stagger ?? 10}
        onComplete={props.done}
      >
        {props.text}
      </SpringText>
    </div>
  )
}

describe('SpringText: no stale progress after a text / mode / trigger change (F2201)', () => {
  it('animateOnMount: the first commit of new text, a new mode or a replay starts hidden', async () => {
    clock = installTestClock({ timers: true })
    const log: string[] = []
    const { rerender } = render(<Probe text="abcd" mount trig={0} log={log} />)
    expect(log[0]).toBe('0,0,0,0')
    await act(async () => clock!.runAll())

    log.length = 0
    rerender(<Probe text="ab" mount trig={0} log={log} />)
    expect(log[0]).toBe('0,0')
    await act(async () => clock!.runAll())

    log.length = 0
    rerender(<Probe text="ab" mount trig={0} mode="words" log={log} />)
    expect(log[0]).toBe('0')
    await act(async () => clock!.runAll())

    // replay
    log.length = 0
    rerender(<Probe text="ab" mount trig={1} mode="words" log={log} />)
    expect(log[0]).toBe('0')
    // an unrelated re-render mid-animation keeps the progress
    await act(async () => clock!.advance(60))
    log.length = 0
    rerender(<Probe text="ab" mount trig={1} mode="words" log={log} />)
    expect(Number(log[0])).toBeGreaterThan(0)
    expect(Number(log[0])).toBeLessThan(1)
  })

  it('animateOnMount=false: new text is fully visible at once, a trigger replay starts hidden', async () => {
    clock = installTestClock({ timers: true })
    const log: string[] = []
    const { rerender } = render(<Probe text="ab" mount={false} trig={0} log={log} />)
    expect(log[0]).toBe('1,1')
    await act(async () => clock!.runAll())

    log.length = 0
    rerender(<Probe text="abcde" mount={false} trig={0} log={log} />)
    expect(log[0]).toBe('1,1,1,1,1')
    await act(async () => clock!.runAll())

    log.length = 0
    rerender(<Probe text="a" mount={false} trig={0} log={log} />)
    expect(log[0]).toBe('1')
    await act(async () => clock!.runAll())

    log.length = 0
    rerender(<Probe text="a" mount={false} trig={1} log={log} />)
    expect(log[0]).toBe('0')
  })

  it('text change mid-animation: the old run is dropped and onComplete fires once for the new text', async () => {
    clock = installTestClock({ timers: true })
    const log: string[] = []
    const done = vi.fn()
    const { rerender, container } = render(
      <Probe text="abcd" mount trig={0} stagger={50} done={done} log={log} />
    )
    await act(async () => clock!.advance(80))
    log.length = 0
    rerender(<Probe text="xyz" mount trig={0} stagger={50} done={done} log={log} />)
    expect(log[0]).toBe('0,0,0')

    await act(async () => clock!.advance(16))
    const spans = () =>
      Array.from((container.firstChild as HTMLElement).firstElementChild!.children) as HTMLElement[]
    expect(Number(spans()[2]!.style.opacity)).toBeLessThan(0.01)

    await act(async () => clock!.runAll())
    expect(done).toHaveBeenCalledTimes(1)
    for (const span of spans()) expect(Number(span.style.opacity)).toBeCloseTo(1, 2)
  })

  it('a NaN trigger does not replay the animation when an unrelated prop changes', async () => {
    clock = installTestClock({ timers: true })
    const element = (stagger: number) => (
      <SpringText animateOnMount={false} trigger={Number.NaN} stagger={stagger}>
        ab
      </SpringText>
    )
    const { rerender, container } = render(element(10))
    await act(async () => clock!.runAll())
    rerender(element(20))
    await act(async () => clock!.advance(0))
    const opacities = Array.from((container.firstChild as HTMLElement).children).map((c) =>
      Number((c as HTMLElement).style.opacity)
    )
    expect(opacities).toEqual([1, 1])
  })
})

describe('SpringText: empty tokens are not animated (F2202)', () => {
  async function run(text: string, mode: Mode) {
    clock = installTestClock({ timers: true })
    let doneAt = -1
    let completes = 0
    const start = clock.now()
    const { container } = render(
      <SpringText
        mode={mode}
        stagger={100}
        onComplete={() => {
          completes++
          doneAt = clock!.now() - start
        }}
      >
        {text}
      </SpringText>
    )
    const texts = (Array.from((container.firstChild as HTMLElement).children) as HTMLElement[]).map(
      (c) => c.textContent
    )
    await act(async () => clock!.runAll())
    clock.uninstall()
    clock = null
    cleanup()
    return { doneAt, completes, texts }
  }

  it('words mode: leading / trailing / whitespace-only text renders no empty span and adds no extra slot', async () => {
    const plain = await run('a b', 'words')
    const trailing = await run('a b ', 'words')
    const leading = await run('  a b', 'words')
    const blank = await run('   ', 'words')

    for (const result of [plain, trailing, leading, blank]) {
      expect(result.texts).not.toContain('')
      expect(result.completes).toBe(1)
    }
    // exactly one stagger slot more than "a b": the whitespace token itself
    expect(trailing.doneAt).toBeCloseTo(plain.doneAt + 100, 6)
    expect(leading.doneAt).toBeCloseTo(plain.doneAt + 100, 6)
    expect(leading.texts).toEqual(['  ', 'a', ' ', 'b'])
    expect(blank.texts).toEqual(['   '])
  })

  it('lines mode: blank lines and a trailing newline render no empty span', async () => {
    const lines = await run('a\n\nb\n', 'lines')
    expect(lines.texts).toEqual(['a', 'b'])
    expect(lines.completes).toBe(1)
  })

  it('empty children render nothing', async () => {
    const empty = await run('', 'words')
    expect(empty.texts).toEqual([])
  })

  it('SplitText keeps handing every token (including empty ones) to render', () => {
    const seen: string[] = []
    render(
      <SplitText
        mode="words"
        render={(el) => {
          seen.push(el)
          return <i>{el}</i>
        }}
      >
        {'a b '}
      </SplitText>
    )
    expect(seen).toEqual(['a', ' ', 'b', ' ', ''])
  })
})

describe('Spring: a throwing onRest is isolated (F2203)', () => {
  it('is logged instead of becoming an unhandled rejection, and later runs still report rest', async () => {
    const rejections: unknown[] = []
    const handler = (reason: unknown) => {
      rejections.push(reason)
    }
    process.on('unhandledRejection', handler)
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    clock = installTestClock({ timers: true })

    let calls = 0
    const element = (to: number) => (
      <Spring
        from={{ x: 0 }}
        to={{ x: to }}
        onRest={() => {
          calls++
          throw new Error('boom ' + calls)
        }}
      >
        {(v) => <i>{v.x}</i>}
      </Spring>
    )
    const { rerender, container, unmount } = render(element(10))
    await act(async () => clock!.runAll())
    expect(calls).toBe(1)

    rerender(element(40))
    await act(async () => clock!.runAll())
    expect(calls).toBe(2)
    expect(Number(container.textContent)).toBeCloseTo(40, 1)

    // retarget, then unmount before the run can finish: no callback afterwards
    rerender(element(70))
    unmount()
    await act(async () => clock!.runAll())
    expect(calls).toBe(2)

    clock.uninstall()
    clock = null
    await new Promise<void>((resolve) => setImmediate(resolve))
    await new Promise<void>((resolve) => setImmediate(resolve))
    process.off('unhandledRejection', handler)

    expect(rejections).toHaveLength(0)
    const logged = errSpy.mock.calls.map((call) => String(call[0]))
    expect(logged).toHaveLength(2)
    expect(logged.every((message) => message.includes('[SpringKit]'))).toBe(true)
  })
})
