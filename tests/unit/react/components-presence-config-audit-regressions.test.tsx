import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, act, screen } from '@testing-library/react'
import * as React from 'react'
import {
  LazyMotion,
  MotionFeatureGuard,
  useLazyMotion,
  usePresence,
  domMax,
  domMin,
  domAnimation,
} from '@oxog/springkit/react'
import type { FeatureBundle } from '@oxog/springkit/react'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function deferred<T>() {
  let resolve!: (v: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

function memoConsumer() {
  const state = { n: 0, last: null as null | ReturnType<typeof useLazyMotion> }
  const C = React.memo(function C() {
    state.last = useLazyMotion()
    state.n++
    return null
  })
  return { C, state }
}

class Boundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  override state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  override componentDidCatch() {}
  override render() {
    return this.state.failed ? <i data-testid="boundary" /> : this.props.children
  }
}

// F2801: a plain features bundle was copied into state by an effect, so consumers
// committed once with the previous bundle, and an inline (equal) bundle re-rendered
// every context consumer on each parent render.
describe('LazyMotion with a plain bundle (F2801)', () => {
  it('keeps consumers and the context value stable for an inline equal bundle', () => {
    const { C, state } = memoConsumer()
    const ui = () => (
      <LazyMotion features={{ animations: true, gestures: true }}>
        <C />
      </LazyMotion>
    )
    const { rerender } = render(ui())
    const first = state.last
    rerender(ui())
    rerender(ui())
    expect(state.n).toBe(1)
    expect(state.last).toBe(first)
  })

  it('exposes a changed bundle in the very first commit', () => {
    const committed: boolean[] = []
    function Probe() {
      const l = useLazyMotion()
      React.useLayoutEffect(() => {
        committed.push(!!l.features.layout)
      })
      return null
    }
    const ui = (f: FeatureBundle) => (
      <LazyMotion features={f}>
        <Probe />
        <MotionFeatureGuard feature="layout">
          <i />
        </MotionFeatureGuard>
      </LazyMotion>
    )
    const { rerender } = render(ui(domMax))
    committed.length = 0
    rerender(ui(domMin))
    expect(committed).toEqual([false])
  })

  it('does not let a superseded slow loader override a newer one (gated order)', async () => {
    const a = deferred<FeatureBundle>()
    const b = deferred<FeatureBundle>()
    const loadA = () => a.promise
    const loadB = () => b.promise
    const { C, state } = memoConsumer()
    const ui = (l: () => Promise<FeatureBundle>) => (
      <LazyMotion features={l}>
        <C />
      </LazyMotion>
    )
    const { rerender } = render(ui(loadA))
    expect(state.last?.isLoaded).toBe(false)
    rerender(ui(loadB))
    await act(async () => b.resolve({ svg: true }))
    await act(async () => a.resolve({ layout: true }))
    expect(state.last?.isLoaded).toBe(true)
    expect(state.last?.features).toEqual({ svg: true })
  })

  it('reports not-loaded when switching from a plain bundle to a loader, and ignores a cancelled loader after switching back', async () => {
    const d = deferred<FeatureBundle>()
    const load = () => d.promise
    const { C, state } = memoConsumer()
    const { rerender } = render(
      <LazyMotion features={domAnimation}>
        <C />
      </LazyMotion>
    )
    rerender(
      <LazyMotion features={load}>
        <C />
      </LazyMotion>
    )
    expect(state.last?.isLoaded).toBe(false)
    rerender(
      <LazyMotion features={domMax}>
        <C />
      </LazyMotion>
    )
    expect(state.last?.isLoaded).toBe(true)
    await act(async () => d.resolve({ svg: true }))
    expect(state.last?.features).toEqual(domMax)
  })
})

// F2802: a loader that throws synchronously escaped into the error boundary
// instead of degrading like a rejected promise.
describe('LazyMotion loader failures (F2802)', () => {
  function Probe({ out }: { out: { ctx: ReturnType<typeof useLazyMotion> | null } }) {
    out.ctx = useLazyMotion()
    return <b data-testid="kid" />
  }

  it('degrades gracefully when the loader throws synchronously', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    const out = { ctx: null as ReturnType<typeof useLazyMotion> | null }
    const loader = vi.fn((): Promise<FeatureBundle> => {
      throw new Error('sync')
    })
    render(
      <Boundary>
        <LazyMotion features={loader}>
          <Probe out={out} />
        </LazyMotion>
      </Boundary>
    )
    await act(async () => {})
    expect(screen.queryByTestId('boundary')).toBeNull()
    expect(screen.getByTestId('kid')).toBeTruthy()
    expect(out.ctx?.isLoaded).toBe(true)
    expect(out.ctx?.features).toEqual({})
    expect(err).toHaveBeenCalledTimes(1)
    expect(loader).toHaveBeenCalledTimes(1)
  })

  it('still degrades for a rejected promise and resolves a successful one', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const bad = { ctx: null as ReturnType<typeof useLazyMotion> | null }
    const good = { ctx: null as ReturnType<typeof useLazyMotion> | null }
    render(
      <>
        <LazyMotion features={() => Promise.reject(new Error('async'))}>
          <Probe out={bad} />
        </LazyMotion>
        <LazyMotion features={() => Promise.resolve({ layout: true })}>
          <Probe out={good} />
        </LazyMotion>
      </>
    )
    await act(async () => {})
    expect(bad.ctx?.features).toEqual({})
    expect(bad.ctx?.isLoaded).toBe(true)
    expect(good.ctx?.features).toEqual({ layout: true })
  })
})

// F2803: usePresence() outside AnimatePresence returned a new no-op function on
// every render, re-running any effect that lists safeToRemove as a dependency.
describe('usePresence outside AnimatePresence (F2803)', () => {
  it('returns a stable safeToRemove', () => {
    const seen: Array<() => void> = []
    let runs = 0
    function Child() {
      const [isPresent, safeToRemove] = usePresence()
      seen.push(safeToRemove)
      React.useEffect(() => {
        runs++
      }, [isPresent, safeToRemove])
      return null
    }
    const { rerender } = render(<Child />)
    rerender(<Child />)
    rerender(<Child />)
    expect(runs).toBe(1)
    expect(new Set(seen).size).toBe(1)
    expect(() => seen[0]!()).not.toThrow()
  })
})
