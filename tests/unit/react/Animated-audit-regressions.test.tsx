/**
 * Audit regressions for Animated / AnimatePresence / PresenceChild
 * (F801: presence child removed before every nested exit finished,
 *  F802: keys named like Object.prototype members)
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, act, cleanup, screen } from '@testing-library/react'
import * as React from 'react'
import { AnimatePresence, Animated, usePresence } from '@oxog/springkit/react'
import { installTestClock, type TestClock } from '@oxog/springkit/testing'

let clock: TestClock | null = null
afterEach(() => {
  cleanup()
  clock?.uninstall()
  clock = null
})

const fast = { stiffness: 400, damping: 40 }
const slow = { stiffness: 40, damping: 12 }

const advance = (ms: number) => act(async () => { clock!.advance(ms) })
const settle = () => act(async () => { clock!.runAll() })
const has = (id: string) => screen.queryByTestId(id) !== null

describe('F801: a presence child waits for every Animated exit inside it', () => {
  it('outer with exit + nested Animated without exit: stays mounted while the outer fades (original repro)', async () => {
    clock = installTestClock({ timers: true })
    const ui = (show: boolean) => (
      <AnimatePresence>
        {show ? (
          <Animated.div key="a" data-testid="outer" config={fast} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Animated.span data-testid="inner">x</Animated.span>
          </Animated.div>
        ) : null}
      </AnimatePresence>
    )
    const { rerender } = render(ui(true))
    await settle()
    rerender(ui(false))
    await advance(16)
    expect(has('outer')).toBe(true)
    await settle()
    expect(has('outer')).toBe(false)
  })

  it('inner exit longer than outer exit: removal waits for the slowest, onExitComplete fires once, after it', async () => {
    clock = installTestClock({ timers: true })
    const onExitComplete = vi.fn()
    const outerDone = vi.fn()
    const innerDone = vi.fn()
    const ui = (show: boolean) => (
      <AnimatePresence onExitComplete={onExitComplete}>
        {show ? (
          <Animated.div key="a" data-testid="outer" config={fast} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onAnimationComplete={outerDone}>
            <Animated.span data-testid="inner" config={slow} animate={{ x: 0 }} exit={{ x: 200 }} onAnimationComplete={innerDone}>x</Animated.span>
          </Animated.div>
        ) : null}
      </AnimatePresence>
    )
    const { rerender } = render(ui(true))
    await settle()
    rerender(ui(false))
    // outer (stiff) finishes first; the child must stay until the slow inner settles
    let guard = 0
    while (!outerDone.mock.calls.length && guard++ < 200) await advance(16)
    expect(outerDone).toHaveBeenCalledTimes(1)
    expect(innerDone).not.toHaveBeenCalled()
    expect(has('outer')).toBe(true)
    expect(onExitComplete).not.toHaveBeenCalled()
    await settle()
    expect(innerDone).toHaveBeenCalledTimes(1)
    expect(has('outer')).toBe(false)
    expect(onExitComplete).toHaveBeenCalledTimes(1)
  })

  it('sibling Animated elements in one custom child: removed only after both exits', async () => {
    clock = installTestClock({ timers: true })
    function Card() {
      return (
        <section data-testid="card">
          <Animated.div config={fast} exit={{ opacity: 0 }} animate={{ opacity: 1 }} />
          <Animated.div config={slow} exit={{ x: 300 }} animate={{ x: 0 }} />
        </section>
      )
    }
    const ui = (show: boolean) => <AnimatePresence>{show ? <Card key="c" /> : null}</AnimatePresence>
    const { rerender } = render(ui(true))
    await settle()
    rerender(ui(false))
    await advance(200)
    expect(has('card')).toBe(true) // fast one is done, slow one is not
    await settle()
    expect(has('card')).toBe(false)
  })

  it('re-entering mid-exit cancels the removal; a later exit completes normally', async () => {
    clock = installTestClock({ timers: true })
    const onExitComplete = vi.fn()
    const ui = (show: boolean) => (
      <AnimatePresence onExitComplete={onExitComplete}>
        {show ? (
          <Animated.div key="a" data-testid="outer" config={slow} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Animated.span data-testid="inner" config={slow} animate={{ x: 0 }} exit={{ x: 100 }}>x</Animated.span>
          </Animated.div>
        ) : null}
      </AnimatePresence>
    )
    const { rerender } = render(ui(true))
    await settle()
    rerender(ui(false))
    await advance(64)
    rerender(ui(true))
    await settle()
    expect(has('outer')).toBe(true)
    expect(onExitComplete).not.toHaveBeenCalled()
    rerender(ui(false))
    await advance(16)
    expect(has('outer')).toBe(true)
    await settle()
    expect(has('outer')).toBe(false)
    expect(onExitComplete).toHaveBeenCalledTimes(1)
  })

  it('an exiting Animated that unmounts while the others are done still lets the child go', async () => {
    clock = installTestClock({ timers: true })
    let hideInner: () => void = () => {}
    const fastDone = vi.fn()
    function Card() {
      const [inner, setInner] = React.useState(true)
      hideInner = () => setInner(false)
      return (
        <div data-testid="card">
          <Animated.div config={fast} exit={{ opacity: 0 }} animate={{ opacity: 1 }} onAnimationComplete={fastDone} />
          {inner ? <Animated.div data-testid="slow" config={slow} exit={{ x: 300 }} animate={{ x: 0 }} /> : null}
        </div>
      )
    }
    const ui = (show: boolean) => <AnimatePresence>{show ? <Card key="c" /> : null}</AnimatePresence>
    const { rerender } = render(ui(true))
    await settle()
    rerender(ui(false))
    let guard = 0
    while (!fastDone.mock.calls.length && guard++ < 200) await advance(16)
    expect(fastDone).toHaveBeenCalledTimes(1)
    expect(has('card')).toBe(true) // the slow one is still exiting
    await act(async () => { hideInner() })
    await act(async () => { await Promise.resolve() }) // the release is deferred to a microtask
    await act(async () => { await Promise.resolve() })
    expect(has('card')).toBe(false)
  })

  it('a lone Animated still completes exactly once (control)', async () => {
    clock = installTestClock({ timers: true })
    const done = vi.fn()
    const onExitComplete = vi.fn()
    const ui = (show: boolean) => (
      <AnimatePresence onExitComplete={onExitComplete}>
        {show ? <Animated.div key="a" data-testid="outer" config={fast} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onAnimationComplete={done} /> : null}
      </AnimatePresence>
    )
    const { rerender } = render(ui(true))
    await settle()
    rerender(ui(false))
    await settle()
    expect(has('outer')).toBe(false)
    expect(done).toHaveBeenCalledTimes(1)
    expect(onExitComplete).toHaveBeenCalledTimes(1)
  })

})

const registry: Record<string, () => void> = Object.create(null)
function Child({ id }: { id: string }) {
  const [isPresent, safeToRemove] = usePresence()
  registry[id] = safeToRemove
  return <div data-testid={`c-${id}`} data-present={String(isPresent)} />
}
const tree = (keys: string[], onExitComplete?: () => void, mode?: 'sync' | 'wait') => (
  <AnimatePresence onExitComplete={onExitComplete} mode={mode}>
    {keys.map((k) => <Child key={k} id={k} />)}
  </AnimatePresence>
)
const KEYS = ['constructor', 'toString', 'hasOwnProperty', '__proto__', 'valueOf']

describe('F802: Object.prototype-named keys behave like any other key', () => {
  for (const key of KEYS) {
    it(`exit lifecycle for key "${key}"`, () => {
      const done = vi.fn()
      const { rerender } = render(tree([key, 'plain'], done))
      expect(screen.getAllByTestId(`c-${key}`)).toHaveLength(1)
      rerender(tree(['plain'], done))
      const el = screen.getByTestId(`c-${key}`)
      expect(el.getAttribute('data-present')).toBe('false')
      expect(done).not.toHaveBeenCalled()
      act(() => registry[key]!())
      expect(screen.queryByTestId(`c-${key}`)).toBeNull()
      expect(screen.getByTestId('c-plain')).toBeTruthy()
      expect(done).toHaveBeenCalledTimes(1)
      // duplicate / stale completion is ignored
      act(() => registry[key]!())
      expect(done).toHaveBeenCalledTimes(1)
    })

    it(`re-adding key "${key}" while exiting cancels the exit without duplicating`, () => {
      const done = vi.fn()
      const { rerender } = render(tree([key], done))
      rerender(tree([], done))
      expect(screen.getByTestId(`c-${key}`).getAttribute('data-present')).toBe('false')
      rerender(tree([key], done))
      expect(screen.getAllByTestId(`c-${key}`)).toHaveLength(1)
      expect(screen.getByTestId(`c-${key}`).getAttribute('data-present')).toBe('true')
    })
  }

  it('wait mode: entering "constructor" waits for the exiting child', () => {
    const { rerender } = render(tree(['a'], undefined, 'wait'))
    rerender(tree(['constructor'], undefined, 'wait'))
    expect(screen.queryByTestId('c-constructor')).toBeNull()
    expect(screen.getByTestId('c-a').getAttribute('data-present')).toBe('false')
    act(() => registry.a!())
    expect(screen.queryByTestId('c-a')).toBeNull()
    expect(screen.getByTestId('c-constructor')).toBeTruthy()
  })
})
