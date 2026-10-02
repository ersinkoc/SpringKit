import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, act, cleanup, screen } from '@testing-library/react'
import * as React from 'react'
import { AnimatePresence, Animated, usePresence } from '@oxog/springkit/react'

type Registry = Record<string, () => void>

/**
 * A presence-aware child that exposes safeToRemove through a registry and
 * counts mounts/unmounts.
 */
function makeChild(stats: { mounts: number; unmounts: number }, registry: Registry) {
  return function Child({ id }: { id: string }) {
    const [isPresent, safeToRemove] = usePresence()
    registry[id] = safeToRemove
    React.useEffect(() => {
      stats.mounts++
      return () => {
        stats.unmounts++
      }
    }, [])
    return (
      <div data-testid={`child-${id}`} data-present={String(isPresent)}>
        {id}
      </div>
    )
  }
}

describe('AnimatePresence (regressions)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('keeps the same component instance mounted while it exits (no remount)', () => {
    const stats = { mounts: 0, unmounts: 0 }
    const registry: Registry = {}
    const Child = makeChild(stats, registry)

    const { rerender } = render(
      <AnimatePresence>{[<Child key="a" id="a" />]}</AnimatePresence>
    )
    expect(stats.mounts).toBe(1)

    rerender(<AnimatePresence>{[]}</AnimatePresence>)

    expect(screen.getByTestId('child-a')).toHaveAttribute('data-present', 'false')
    expect(stats.mounts).toBe(1)
    expect(stats.unmounts).toBe(0)

    act(() => registry.a!())
    expect(screen.queryByTestId('child-a')).toBeNull()
    expect(stats.unmounts).toBe(1)
  })

  it('does not duplicate a child that is re-added while exiting and still reports exit completion', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const stats = { mounts: 0, unmounts: 0 }
    const registry: Registry = {}
    const Child = makeChild(stats, registry)
    const onExitComplete = vi.fn()

    const ui = (show: boolean) => (
      <AnimatePresence onExitComplete={onExitComplete}>
        {show ? [<Child key="a" id="a" />] : []}
      </AnimatePresence>
    )

    const { rerender } = render(ui(true))
    rerender(ui(false))
    rerender(ui(true))

    const nodes = screen.getAllByTestId('child-a')
    expect(nodes).toHaveLength(1)
    expect(nodes[0]).toHaveAttribute('data-present', 'true')
    expect(errorSpy).not.toHaveBeenCalled()

    // A stale safeToRemove call for the (no longer exiting) child is ignored
    act(() => registry.a!())
    expect(screen.getByTestId('child-a')).toBeInTheDocument()
    expect(onExitComplete).not.toHaveBeenCalled()

    // Remove again and complete: onExitComplete fires exactly once
    rerender(ui(false))
    act(() => registry.a!())
    expect(screen.queryByTestId('child-a')).toBeNull()
    expect(onExitComplete).toHaveBeenCalledTimes(1)
  })

  it('arms the fallback exit timeout under React.StrictMode', () => {
    const stats = { mounts: 0, unmounts: 0 }
    const registry: Registry = {}
    const Child = makeChild(stats, registry)
    const onExitComplete = vi.fn()

    const ui = (show: boolean) => (
      <React.StrictMode>
        <AnimatePresence onExitComplete={onExitComplete}>
          {show ? [<Child key="a" id="a" />] : []}
        </AnimatePresence>
      </React.StrictMode>
    )

    const { rerender } = render(ui(true))
    rerender(ui(false))
    expect(screen.getByTestId('child-a')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(10_000)
    })

    expect(screen.queryByTestId('child-a')).toBeNull()
    expect(onExitComplete).toHaveBeenCalledTimes(1)
  })

  it('keeps the fallback exit timeout armed across parent re-renders', () => {
    const stats = { mounts: 0, unmounts: 0 }
    const registry: Registry = {}
    const Child = makeChild(stats, registry)
    let calls = 0

    const ui = (show: boolean, tick: number) => (
      <AnimatePresence onExitComplete={() => { calls++ }}>
        {show ? [<Child key="a" id="a" />] : []}
        <div data-tick={tick} key="static" />
      </AnimatePresence>
    )

    const { rerender } = render(ui(true, 0))
    rerender(ui(false, 0))

    act(() => {
      vi.advanceTimersByTime(5_000)
    })
    // Parent re-renders with a fresh inline onExitComplete callback
    rerender(ui(false, 1))
    act(() => {
      vi.advanceTimersByTime(5_000)
    })

    expect(screen.queryByTestId('child-a')).toBeNull()
    expect(calls).toBe(1)
  })

  it('does not fire onExitComplete early when safeToRemove is called twice', () => {
    const stats = { mounts: 0, unmounts: 0 }
    const registry: Registry = {}
    const Child = makeChild(stats, registry)
    const onExitComplete = vi.fn()

    const ui = (show: boolean) => (
      <AnimatePresence onExitComplete={onExitComplete}>
        {show ? [<Child key="a" id="a" />, <Child key="b" id="b" />] : []}
      </AnimatePresence>
    )

    const { rerender } = render(ui(true))
    rerender(ui(false))

    act(() => {
      registry.a!()
      registry.a!()
    })
    expect(onExitComplete).not.toHaveBeenCalled()
    expect(screen.getByTestId('child-b')).toBeInTheDocument()

    act(() => registry.b!())
    expect(onExitComplete).toHaveBeenCalledTimes(1)
    expect(screen.queryByTestId('child-b')).toBeNull()
  })

  it('keeps an exiting child at its original position in the list', () => {
    const stats = { mounts: 0, unmounts: 0 }
    const registry: Registry = {}
    const Child = makeChild(stats, registry)

    const ui = (ids: string[]) => (
      <div data-testid="list">
        <AnimatePresence>
          {ids.map((id) => (
            <Child key={id} id={id} />
          ))}
        </AnimatePresence>
      </div>
    )

    const { rerender } = render(ui(['a', 'b', 'c']))
    rerender(ui(['a', 'c']))

    const order = Array.from(screen.getByTestId('list').children).map((el) => el.textContent)
    expect(order).toEqual(['a', 'b', 'c'])
  })

  it('initial={false} does not leak a data-initial-skip attribute and skips the initial animation', () => {
    render(
      <AnimatePresence initial={false}>
        <Animated.div key="a" data-testid="a" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          A
        </Animated.div>
      </AnimatePresence>
    )

    const el = screen.getByTestId('a')
    expect(el).not.toHaveAttribute('data-initial-skip')
    expect(el.style.opacity).toBe('1')
  })

  it('mode="wait" renders the entering child only after the exiting one is removed', () => {
    const stats = { mounts: 0, unmounts: 0 }
    const registry: Registry = {}
    const Child = makeChild(stats, registry)

    const ui = (id: string) => (
      <AnimatePresence mode="wait">
        <Child key={id} id={id} />
      </AnimatePresence>
    )

    const { rerender } = render(ui('a'))
    rerender(ui('b'))

    expect(screen.getByTestId('child-a')).toHaveAttribute('data-present', 'false')
    expect(screen.queryByTestId('child-b')).toBeNull()

    act(() => registry.a!())
    expect(screen.queryByTestId('child-a')).toBeNull()
    expect(screen.getByTestId('child-b')).toBeInTheDocument()
  })

  it('renders children with integer-like keys in children order', () => {
    const stats = { mounts: 0, unmounts: 0 }
    const registry: Registry = {}
    const Child = makeChild(stats, registry)

    render(
      <div data-testid="list">
        <AnimatePresence>
          {['10', '2', '1'].map((id) => (
            <Child key={id} id={id} />
          ))}
        </AnimatePresence>
      </div>
    )

    const order = Array.from(screen.getByTestId('list').children).map((el) => el.textContent)
    expect(order).toEqual(['10', '2', '1'])
  })

  it('mode="wait" never mounts a child that was skipped while another one was exiting', () => {
    const stats = { mounts: 0, unmounts: 0 }
    const registry: Registry = {}
    const Child = makeChild(stats, registry)

    const ui = (id: string) => (
      <AnimatePresence mode="wait">
        <Child key={id} id={id} />
      </AnimatePresence>
    )

    const { rerender } = render(ui('a'))
    rerender(ui('b'))
    rerender(ui('c'))

    expect(screen.queryByTestId('child-b')).toBeNull()
    act(() => registry.a!())
    expect(screen.queryByTestId('child-b')).toBeNull()
    expect(screen.getByTestId('child-c')).toHaveAttribute('data-present', 'true')
    // a and c mounted once each, b never
    expect(stats.mounts).toBe(2)
  })

  it('removes an Animated child without an exit prop immediately instead of after the fallback timeout', () => {
    const onExitComplete = vi.fn()
    const ui = (show: boolean) => (
      <AnimatePresence onExitComplete={onExitComplete}>
        {show ? [<Animated.div key="a" data-testid="a" animate={{ opacity: 1 }} />] : []}
      </AnimatePresence>
    )

    const { rerender } = render(ui(true))
    rerender(ui(false))

    act(() => {
      vi.advanceTimersByTime(50)
    })

    expect(screen.queryByTestId('a')).toBeNull()
    expect(onExitComplete).toHaveBeenCalledTimes(1)
  })
})
