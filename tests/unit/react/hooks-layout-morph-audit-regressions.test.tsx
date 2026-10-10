/**
 * Regression tests from the evidence audit of useLayoutAnimation.ts / useMorph.ts
 * (F2501-F2503). Time is virtual (installTestClock); jsdom has no layout, so
 * getBoundingClientRect is mocked at the seam.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, renderHook, act, cleanup } from '@testing-library/react'
import * as React from 'react'
import { installTestClock, type TestClock } from '@oxog/springkit/testing'
import {
  useLayoutGroup,
  useLayoutId,
  useFlip,
  useAutoLayout,
  LayoutGroupProvider,
  LayoutGroupContext,
} from '../../../src/adapters/react/hooks/useLayoutAnimation'
import { useMorph, useMorphSequence, useMorphRef } from '../../../src/adapters/react/hooks/useMorph'

let clock: TestClock | null = null
afterEach(() => {
  cleanup()
  clock?.uninstall()
  clock = null
})

function mockRect(el: Element, x: number, y = 0, width = 100, height = 100) {
  el.getBoundingClientRect = () =>
    ({ x, y, left: x, top: y, right: x + width, bottom: y + height, width, height, toJSON: () => ({}) }) as DOMRect
}

// ============ F2501: layout hooks use the latest animation callbacks ============

type Cbs = { onAnimationStart?: (id: string) => void; onAnimationComplete?: (id: string) => void }
interface Mounted {
  rerender: (c: Cbs) => void
  move: (x: number) => void
}

function mountGroup(initial: Cbs): Mounted {
  let api!: ReturnType<typeof useLayoutGroup>
  function C(props: Cbs) {
    api = useLayoutGroup(props)
    return <div data-testid="a" ref={(el) => { if (el) api.register('a', el) }} />
  }
  const r = render(<C {...initial} />)
  return { rerender: (c) => r.rerender(<C {...c} />), move: (x) => { mockRect(r.getByTestId('a'), x); act(() => api.update()) } }
}
function mountId(initial: Cbs): Mounted {
  let update!: () => void
  function C(props: Cbs) {
    const l = useLayoutId('x', props)
    update = l.update
    return <div data-testid="a" ref={l.ref} />
  }
  const r = render(<C {...initial} />)
  return { rerender: (c) => r.rerender(<C {...c} />), move: (x) => { mockRect(r.getByTestId('a'), x); act(() => update()) } }
}
function mountAuto(initial: Cbs): Mounted {
  let api!: ReturnType<typeof useAutoLayout>
  function C(props: Cbs) {
    api = useAutoLayout(props)
    return <ul ref={api.containerRef}><li data-layout-id="i" data-testid="a" /></ul>
  }
  const r = render(<C {...initial} />)
  return { rerender: (c) => r.rerender(<C {...c} />), move: (x) => { mockRect(r.getByTestId('a'), x); act(() => api.update()) } }
}
function mountProvider(initial: Cbs): Mounted {
  let group!: { register(id: string, el: HTMLElement): void; update(): void }
  function Child() {
    group = React.useContext(LayoutGroupContext)!
    return <div data-testid="a" ref={(el) => { if (el) group.register('a', el) }} />
  }
  const tree = (c: Cbs) => <LayoutGroupProvider config={c}><Child /></LayoutGroupProvider>
  const r = render(tree(initial))
  return { rerender: (c) => r.rerender(tree(c)), move: (x) => { mockRect(r.getByTestId('a'), x); act(() => group.update()) } }
}

describe('F2501 layout hooks call the callbacks of the latest render', () => {
  const mounts = { useLayoutGroup: mountGroup, useLayoutId: mountId, useAutoLayout: mountAuto, LayoutGroupProvider: mountProvider }

  for (const [name, mount] of Object.entries(mounts)) {
    it(`${name}: onAnimationStart`, () => {
      const first = vi.fn()
      const second = vi.fn()
      const m = mount({ onAnimationStart: first })
      m.rerender({ onAnimationStart: second })
      m.move(200)
      expect(second).toHaveBeenCalledTimes(1)
      expect(first).not.toHaveBeenCalled()
    })

    it(`${name}: onAnimationComplete`, () => {
      clock = installTestClock({ timers: true })
      const first = vi.fn()
      const second = vi.fn()
      const m = mount({ onAnimationComplete: first })
      m.rerender({ onAnimationComplete: second })
      m.move(200)
      act(() => clock!.advance(10000))
      expect(second).toHaveBeenCalledTimes(1)
      expect(first).not.toHaveBeenCalled()
    })

    it(`${name}: a callback dropped in a later render is not called`, () => {
      const first = vi.fn()
      const m = mount({ onAnimationStart: first })
      m.rerender({})
      expect(() => m.move(200)).not.toThrow()
      expect(first).not.toHaveBeenCalled()
    })
  }
})

// ============ F2502: useFlip().flip() interrupting a running flip ============

function mountBox() {
  const state = { layoutX: 0 }
  const translateX = (el: HTMLElement) => {
    const m = /translate\((-?[\d.e+-]+)px/.exec(el.style.transform)
    return m ? Number(m[1]) : 0
  }
  let flipFn!: ReturnType<typeof useFlip>['flip']
  function Box() {
    const { ref, flip } = useFlip({ config: { stiffness: 100, damping: 20 } })
    flipFn = flip
    return (
      <div
        data-testid="box"
        ref={(el) => {
          if (el) {
            // what a browser reports for a translated element
            el.getBoundingClientRect = () => {
              const x = state.layoutX + translateX(el)
              return { x, y: 0, left: x, top: 0, right: x + 100, bottom: 100, width: 100, height: 100, toJSON: () => ({}) } as DOMRect
            }
          }
          ref(el)
        }}
      />
    )
  }
  const { getByTestId } = render(<Box />)
  const box = getByTestId('box')
  return { state, box, flip: () => flipFn(), visual: () => box.getBoundingClientRect().left }
}

describe('F2502 useFlip flip() without mutate, interrupting a running FLIP', () => {
  it('starts from where the element is shown, settles at the layout box and restores the style', async () => {
    clock = installTestClock({ timers: true })
    const m = mountBox()
    m.state.layoutX = 100
    let p1!: Promise<void>
    act(() => { p1 = m.flip() })
    act(() => clock!.advance(150))
    const shown = m.visual()
    expect(shown).toBeGreaterThan(1)
    expect(shown).toBeLessThan(99)
    m.state.layoutX = 300
    let p2!: Promise<void>
    act(() => { p2 = m.flip() })
    expect(m.visual()).toBeCloseTo(shown, 6)
    // the superseded call settles while the newer FLIP still runs: it must not clear it
    await act(async () => { await p1 })
    expect(m.box.style.transform).not.toBe('')
    act(() => clock!.advance(10000))
    await act(async () => { await p2 })
    expect(m.visual()).toBeCloseTo(300, 6)
    expect(m.box.style.transform).toBe('')
  })

  it('does not jump when flip() is called twice without a layout change', () => {
    clock = installTestClock({ timers: true })
    const m = mountBox()
    m.state.layoutX = 100
    act(() => { void m.flip() })
    act(() => clock!.advance(150))
    const shown = m.visual()
    act(() => { void m.flip() })
    expect(m.visual()).toBeCloseTo(shown, 6)
    act(() => clock!.advance(10000))
    expect(m.visual()).toBeCloseTo(100, 6)
  })

  it('starts from the settled box after a completed flip', async () => {
    clock = installTestClock({ timers: true })
    const m = mountBox()
    m.state.layoutX = 100
    let p!: Promise<void>
    act(() => { p = m.flip() })
    act(() => clock!.advance(10000))
    await act(async () => { await p })
    m.state.layoutX = 160
    act(() => { void m.flip() })
    expect(m.visual()).toBeCloseTo(100, 6)
    act(() => clock!.advance(10000))
    expect(m.visual()).toBeCloseTo(160, 6)
  })
})

// ============ F2503: morph hooks follow the live controller and the latest options ============

describe('F2503 morph hooks', () => {
  const A = 'M0 0 L100 0'
  const B = 'M0 100 L100 100'
  const C = 'M0 50 L100 50'

  it('useMorph: progress follows the replaced controller (reset to 0); same initialPath keeps it', () => {
    clock = installTestClock({ timers: true })
    const { result, rerender } = renderHook(({ p, k }) => { void k; return useMorph(p, { samples: 2 }) }, {
      initialProps: { p: A, k: 0 },
    })
    act(() => result.current.morphTo(B))
    act(() => clock!.advance(300))
    const mid = result.current.progress
    expect(mid).toBeGreaterThan(0)
    rerender({ p: A, k: 1 })
    expect(result.current.progress).toBe(mid)
    rerender({ p: C, k: 1 })
    expect(result.current.progress).toBe(0)
    expect(result.current.controller!.getProgress()).toBe(0)
  })

  it('useMorph under StrictMode: progress reset, no console error after unmount', () => {
    clock = installTestClock({ timers: true })
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      let api!: ReturnType<typeof useMorph>
      function H({ p }: { p: string }) { api = useMorph(p, { samples: 2 }); return null }
      const r = render(<React.StrictMode><H p={A} /></React.StrictMode>)
      act(() => api.morphTo(B))
      act(() => clock!.advance(300))
      expect(api.progress).toBeGreaterThan(0)
      r.rerender(<React.StrictMode><H p={C} /></React.StrictMode>)
      expect(api.progress).toBe(0)
      r.unmount()
      act(() => clock!.advance(5000))
      expect(err).not.toHaveBeenCalled()
    } finally {
      err.mockRestore()
    }
  })

  it('useMorphRef: progress resets when initialPath changes', () => {
    clock = installTestClock({ timers: true })
    let api!: ReturnType<typeof useMorphRef>
    function R({ p }: { p: string }) { api = useMorphRef(p, { samples: 2 }); return <svg><path ref={api.pathRef} /></svg> }
    const r = render(<R p={A} />)
    act(() => api.morphTo(B))
    act(() => clock!.advance(300))
    expect(api.progress).toBeGreaterThan(0)
    r.rerender(<R p={C} />)
    expect(api.progress).toBe(0)
  })

  it('useMorph / useMorphSequence / useMorphRef call the latest onComplete', () => {
    clock = installTestClock({ timers: true })
    const f1 = vi.fn(), s1 = vi.fn()
    const h1 = renderHook(({ cb }) => useMorph(A, { samples: 2, onComplete: cb }), { initialProps: { cb: f1 } })
    h1.rerender({ cb: s1 })
    act(() => h1.result.current.morphTo(B))

    const f2 = vi.fn(), s2 = vi.fn(), pf = vi.fn(), ps = vi.fn()
    const h2 = renderHook(({ cb, pr }) => useMorphSequence([A, B], { samples: 2, onComplete: cb, onProgress: pr }), {
      initialProps: { cb: f2, pr: pf },
    })
    h2.rerender({ cb: s2, pr: ps })
    act(() => h2.result.current.morphToNext())

    const f3 = vi.fn(), s3 = vi.fn()
    let api!: ReturnType<typeof useMorphRef>
    function R({ cb }: { cb: () => void }) { api = useMorphRef(A, { samples: 2, onComplete: cb }); return <svg><path ref={api.pathRef} /></svg> }
    const r3 = render(<R cb={f3} />)
    r3.rerender(<R cb={s3} />)
    act(() => api.morphTo(B))

    act(() => clock!.advance(5000))
    expect([f1.mock.calls.length, s1.mock.calls.length]).toEqual([0, 1])
    expect([f2.mock.calls.length, s2.mock.calls.length]).toEqual([0, 1])
    expect([f3.mock.calls.length, s3.mock.calls.length]).toEqual([0, 1])
    expect(pf).not.toHaveBeenCalled()
    expect(ps).toHaveBeenCalled()
  })

  it('an onComplete dropped in a later render is not called; an unmounted sequence never completes late', () => {
    clock = installTestClock({ timers: true })
    const f = vi.fn()
    const h = renderHook(({ cb }: { cb?: () => void }) => useMorphSequence([A, B], { samples: 2, onComplete: cb }), {
      initialProps: { cb: f } as { cb?: () => void },
    })
    h.rerender({})
    act(() => h.result.current.morphToNext())
    act(() => clock!.advance(5000))
    expect(f).not.toHaveBeenCalled()

    const g = vi.fn()
    const h2 = renderHook(() => useMorphSequence([A, B], { samples: 2, onComplete: g }))
    act(() => h2.result.current.morphToNext())
    act(() => clock!.advance(100))
    h2.unmount()
    act(() => clock!.advance(5000))
    expect(g).not.toHaveBeenCalled()
  })
})
