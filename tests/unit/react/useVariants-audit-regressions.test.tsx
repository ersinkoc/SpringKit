/**
 * Audit regressions for useVariants / VariantProvider:
 *  - F2301 parent delayChildren without staggerChildren was ignored, and the element's own
 *    transition.delay was dropped whenever a stagger applied
 *  - F2302 VariantProvider `custom` never reached the children's function variants
 *  - F2303 a setVariant() override survived a change of the inherited parent variant and was
 *    dropped as soon as `animate` was an inline object literal
 */
import { it, expect, afterEach, describe } from 'vitest'
import { render, act, cleanup } from '@testing-library/react'
import * as React from 'react'
import { VariantProvider, useVariants } from '../../../src/adapters/react/hooks/useVariants'
import { installTestClock, type TestClock } from '@oxog/springkit/testing'

let clock: TestClock | null = null
afterEach(() => {
  cleanup()
  clock?.uninstall()
  clock = null
})
async function advance(ms: number) {
  for (let t = 0; t < ms; t += 16) await act(async () => { clock!.advance(Math.min(16, ms - t)) })
}
const spring = { stiffness: 600, damping: 60 }
const plain = { hidden: { opacity: 0 }, visible: { opacity: 1 } }

/** opacity of child 0 sampled at each (cumulative) time */
async function samples(
  transition: Record<string, unknown> | undefined,
  times: number[],
  variants: Record<string, any> = plain,
  count = 1
): Promise<number[]> {
  clock = installTestClock({ startTime: 0, timers: true })
  const o: number[] = Array(count).fill(-1)
  function Item({ i }: { i: number }) {
    o[i] = Number(useVariants({ variants, initial: 'hidden', spring }).values.opacity)
    return null
  }
  const kids = Array.from({ length: count }, (_, i) => <Item key={i} i={i} />)
  render(transition ? <VariantProvider variant="visible" transition={transition as any}>{kids}</VariantProvider> : <>{kids}</>)
  const out: number[] = []
  let at = 0
  for (const t of times) { await advance(t - at); at = t; out.push(o[0]!) }
  cleanup(); clock.uninstall(); clock = null
  return out
}

describe('F2301 orchestration delays', () => {
  it('delayChildren alone delays every child', async () => {
    const [a, b, c] = await samples({ delayChildren: 300 }, [200, 330, 900])
    expect(a).toBeLessThan(0.01)
    expect(b).toBeGreaterThan(0)
    expect(c).toBeGreaterThan(0.99)
  })
  it('own transition.delay adds to the stagger position', async () => {
    const v = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { delay: 400 } } }
    const [a, b, c] = await samples({ staggerChildren: 50 }, [300, 430, 1200], v)
    expect(a).toBeLessThan(0.01)
    expect(b).toBeGreaterThan(0)
    expect(c).toBeGreaterThan(0.99)
  })
  it('own delay still works through the animate prop (control)', async () => {
    const v = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { delay: 400 } } }
    clock = installTestClock({ startTime: 0, timers: true })
    let o = -1
    function Item() { o = Number(useVariants({ variants: v, initial: 'hidden', animate: 'visible', spring }).values.opacity); return null }
    render(<Item />)
    await advance(300)
    expect(o).toBeLessThan(0.01)
    await advance(300)
    expect(o).toBeGreaterThan(0)
  })
  it('delayChildren 0 / negative / NaN / undefined do not delay', async () => {
    for (const d of [0, -100, NaN, undefined]) {
      const [a] = await samples({ delayChildren: d as number }, [120])
      expect(a, 'delayChildren=' + d).toBeGreaterThan(0)
    }
  })
  it('stagger + delayChildren is unchanged (control)', async () => {
    const [a, b] = await samples({ staggerChildren: 50, delayChildren: 300 }, [200, 400])
    expect(a).toBeLessThan(0.01)
    expect(b).toBeGreaterThan(0)
  })
  it("delayChildren adds to the when: 'beforeChildren' settle time", async () => {
    const ps = { stiffness: 200, damping: 20 }
    const [a, b] = await samples({ when: 'beforeChildren', spring: ps, delayChildren: 400 }, [500, 2600])
    expect(a).toBeLessThan(0.01)
    expect(b).toBeGreaterThan(0.9)
  })
  it('a child own transition.delayChildren (meant for its kids) does not delay the child', async () => {
    const v = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { delayChildren: 500 } } }
    const [a] = await samples({ spring }, [120], v)
    expect(a).toBeGreaterThan(0)
  })
  it('unmount during the delay leaves no pending timers or frames', async () => {
    clock = installTestClock({ startTime: 0, timers: true })
    function Item() { useVariants({ variants: plain, initial: 'hidden', spring }); return null }
    const { unmount } = render(<VariantProvider variant="visible" transition={{ delayChildren: 5000 }}><Item /></VariantProvider>)
    await advance(100)
    unmount()
    clock.advance(20_000)
    expect(clock.pendingTimers).toBe(0)
    expect(clock.pendingFrames).toBe(0)
  })
})

const customVariants = {
  hidden: { x: -10 },
  visible: (c?: unknown) => ({ x: typeof c === 'number' ? c : 1 }),
}

function CustomProbe({ opts, out }: { opts: Record<string, unknown>; out: { x: number } }) {
  out.x = Number(useVariants({ variants: customVariants, initial: 'hidden', spring, ...opts }).values.x)
  return null
}

describe('F2302 provider custom', () => {
  it('inherits provider custom, including a falsy 0', async () => {
    clock = installTestClock({ startTime: 0, timers: true })
    const a = { x: NaN }, z = { x: NaN }
    render(<><VariantProvider variant="visible" custom={40}><CustomProbe opts={{}} out={a} /></VariantProvider>
      <VariantProvider variant="visible" custom={0}><CustomProbe opts={{}} out={z} /></VariantProvider></>)
    await advance(1500)
    expect(a.x).toBeCloseTo(40, 1)
    expect(z.x).toBeCloseTo(0, 1)
  })
  it('own custom wins over the provider (also a falsy 0)', async () => {
    clock = installTestClock({ startTime: 0, timers: true })
    const a = { x: NaN }, z = { x: NaN }
    render(<VariantProvider variant="visible" custom={40}><CustomProbe opts={{ custom: 7 }} out={a} /><CustomProbe opts={{ custom: 0 }} out={z} /></VariantProvider>)
    await advance(1500)
    expect(a.x).toBeCloseTo(7, 1)
    expect(z.x).toBeCloseTo(0, 1)
  })
  it('inherit: false ignores the provider custom', async () => {
    clock = installTestClock({ startTime: 0, timers: true })
    const a = { x: NaN }
    render(<VariantProvider variant="visible" custom={40}><CustomProbe opts={{ inherit: false, animate: 'visible' }} out={a} /></VariantProvider>)
    await advance(1500)
    expect(a.x).toBeCloseTo(1, 1)
  })
  it('a changed provider custom re-resolves the child target', async () => {
    clock = installTestClock({ startTime: 0, timers: true })
    const a = { x: NaN }
    const tree = (c: number) => <VariantProvider variant="visible" custom={c}><CustomProbe opts={{}} out={a} /></VariantProvider>
    const { rerender } = render(tree(40))
    await advance(1500)
    rerender(tree(90))
    await advance(1500)
    expect(a.x).toBeCloseTo(90, 1)
  })
  it('no provider custom: unchanged (control)', async () => {
    clock = installTestClock({ startTime: 0, timers: true })
    const a = { x: NaN }
    render(<VariantProvider variant="visible"><CustomProbe opts={{}} out={a} /></VariantProvider>)
    await advance(1500)
    expect(a.x).toBeCloseTo(1, 1)
  })
})

const overrideVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 }, dim: { opacity: 0.5 } }

describe('F2303 setVariant override', () => {
  it('inherited variant change takes over; unrelated re-renders keep the override', async () => {
    clock = installTestClock({ startTime: 0, timers: true })
    let api!: ReturnType<typeof useVariants>
    function Child() { api = useVariants({ variants: overrideVariants, spring }); return null }
    const tree = (v: string) => <VariantProvider variant={v}><Child /></VariantProvider>
    const { rerender } = render(tree('visible'))
    await advance(300)
    act(() => api.setVariant('dim'))
    await advance(300)
    rerender(tree('visible')); rerender(tree('visible'))
    await advance(300)
    expect(api.currentVariant).toBe('dim')
    rerender(tree('hidden'))
    await advance(600)
    expect(api.currentVariant).toBe('hidden')
    expect(Number(api.values.opacity)).toBeLessThan(0.01)
    // a second override after the takeover works again
    act(() => api.setVariant('dim'))
    await advance(600)
    expect(api.currentVariant).toBe('dim')
    expect(Number(api.values.opacity)).toBeCloseTo(0.5, 1)
  })
  it('inline animate object keeps the override until its content changes', async () => {
    clock = installTestClock({ startTime: 0, timers: true })
    let api!: ReturnType<typeof useVariants>
    function Inline({ o }: { o: number }) { api = useVariants({ variants: overrideVariants, animate: { opacity: o }, spring }); return null }
    const { rerender } = render(<Inline o={1} />)
    await advance(300)
    act(() => api.setVariant('dim'))
    await advance(300)
    rerender(<Inline o={1} />)
    await advance(300)
    expect(api.currentVariant).toBe('dim')
    expect(Number(api.values.opacity)).toBeCloseTo(0.5, 1)
    rerender(<Inline o={0.2} />)
    await advance(600)
    expect(Number(api.values.opacity)).toBeCloseTo(0.2, 1)
  })
  it('string animate change still takes over (control)', async () => {
    clock = installTestClock({ startTime: 0, timers: true })
    let api!: ReturnType<typeof useVariants>
    function S({ a }: { a: string }) { api = useVariants({ variants: overrideVariants, animate: a, spring }); return null }
    const { rerender } = render(<S a="visible" />)
    await advance(300)
    act(() => api.setVariant('dim'))
    await advance(300)
    expect(api.currentVariant).toBe('dim')
    rerender(<S a="hidden" />)
    await advance(600)
    expect(api.currentVariant).toBe('hidden')
  })
  it('inherit: false is not driven by the parent variant', async () => {
    clock = installTestClock({ startTime: 0, timers: true })
    let api!: ReturnType<typeof useVariants>
    function C() { api = useVariants({ variants: overrideVariants, animate: 'visible', inherit: false, spring }); return null }
    const tree = (v: string) => <VariantProvider variant={v}><C /></VariantProvider>
    const { rerender } = render(tree('visible'))
    await advance(300)
    act(() => api.setVariant('dim'))
    await advance(300)
    rerender(tree('hidden'))
    await advance(300)
    expect(api.currentVariant).toBe('dim')
  })
  it('gated completion: onAnimationComplete never reports the superseded override variant', async () => {
    clock = installTestClock({ startTime: 0, timers: true })
    const done: string[] = []
    let api!: ReturnType<typeof useVariants>
    function Child() { api = useVariants({ variants: overrideVariants, spring, onAnimationComplete: (n) => done.push(n) }); return null }
    const tree = (v: string) => <VariantProvider variant={v}><Child /></VariantProvider>
    const { rerender } = render(tree('visible'))
    await advance(3000)
    done.length = 0
    act(() => api.setVariant('dim'))
    await advance(10)          // 'dim' animation not yet settled
    rerender(tree('hidden'))   // superseded before it completes
    await advance(3000)
    expect(done).toEqual(['hidden'])
  })
})
