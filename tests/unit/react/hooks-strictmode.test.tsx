/**
 * Regression tests: hooks that create resources during render and destroy them
 * in an effect cleanup must survive React StrictMode's simulated
 * unmount/remount (cleanup + setup without a re-render).
 */
import { describe, it, expect } from 'vitest'
import { render, act } from '@testing-library/react'
import * as React from 'react'
import type { MotionValue } from '../../../src/core/MotionValue'
import { useMotionValue, useMotionValues } from '../../../src/adapters/react/hooks/useMotionValue'
import { useSpringValue } from '../../../src/adapters/react/hooks/useSpringValue'
import { useSpring } from '../../../src/adapters/react/hooks/useSpring'
import {
  useTransform,
  useCombinedTransform,
  useSpringTransform,
  useMotionTemplate,
  useTime,
  useSmooth,
  useDelay,
  useVelocity,
  useVelocityTransform,
  useWillChange,
} from '../../../src/adapters/react/hooks/useTransform'
import { useScroll, useScrollVelocity } from '../../../src/adapters/react/hooks/useScroll'
import { useSpringState, useChain } from '../../../src/adapters/react/hooks/usePhysics'

const flushMicrotasks = () => act(async () => { await Promise.resolve() })

function renderStrict(ui: React.ReactElement) {
  return render(<React.StrictMode>{ui}</React.StrictMode>)
}

describe('hooks under React.StrictMode', () => {
  it('useMotionValue returns a live MotionValue after the simulated remount', async () => {
    let mv!: MotionValue<number>
    function C() {
      mv = useMotionValue(0)
      return null
    }
    renderStrict(<C />)
    await flushMicrotasks()
    expect(mv.isDestroyed()).toBe(false)
    mv.jump(5)
    expect(mv.get()).toBe(5)
  })

  it('useMotionValue still destroys its value on real unmount', async () => {
    let mv!: MotionValue<number>
    function C() {
      mv = useMotionValue(0)
      return null
    }
    const { unmount } = renderStrict(<C />)
    unmount()
    await flushMicrotasks()
    expect(mv.isDestroyed()).toBe(true)
  })

  it('useMotionValues returns live values after the simulated remount', async () => {
    let values!: { x: MotionValue<number> }
    function C() {
      values = useMotionValues({ x: 1 })
      return null
    }
    renderStrict(<C />)
    await flushMicrotasks()
    expect(values.x.isDestroyed()).toBe(false)
  })

  it('useSpringValue returns a live spring after the simulated remount', async () => {
    let spring!: ReturnType<typeof useSpringValue>
    function C() {
      spring = useSpringValue(0)
      return null
    }
    renderStrict(<C />)
    await flushMicrotasks()
    expect(spring.isDestroyed()).toBe(false)
    spring.jump(3)
    expect(spring.get()).toBe(3)
  })

  it('useSpring keeps animating towards new targets', async () => {
    let latest: { x: number } = { x: -1 }
    function C({ x }: { x: number }) {
      latest = useSpring({ x }, { stiffness: 1000, damping: 100 })
      return null
    }
    const { rerender } = renderStrict(<C x={0} />)
    await flushMicrotasks()
    rerender(<React.StrictMode><C x={100} /></React.StrictMode>)
    // let the global RAF loop run
    await act(async () => {
      await new Promise((r) => setTimeout(r, 200))
    })
    expect(latest.x).toBeGreaterThan(0)
  })

  it('useTransform keeps updating its derived value', async () => {
    let source!: MotionValue<number>
    let derived!: MotionValue<number>
    function C() {
      source = useMotionValue(0)
      derived = useTransform(source, [0, 100], [0, 1])
      return null
    }
    renderStrict(<C />)
    await flushMicrotasks()
    expect(derived.isDestroyed()).toBe(false)
    source.jump(50)
    expect(derived.get()).toBe(0.5)
  })

  it('useCombinedTransform keeps updating its derived value', async () => {
    let a!: MotionValue<number>
    let derived!: MotionValue<number>
    const sum = ([x, y]: number[]) => x! + y!
    function C() {
      a = useMotionValue(1)
      const b = useMotionValue(2)
      derived = useCombinedTransform([a, b], sum)
      return null
    }
    renderStrict(<C />)
    await flushMicrotasks()
    a.jump(10)
    expect(derived.get()).toBe(12)
  })

  it('useSpringTransform returns a live value', async () => {
    let derived!: MotionValue<number>
    function C() {
      const source = useMotionValue(0)
      derived = useSpringTransform(source, [0, 1], [0, 10])
      return null
    }
    renderStrict(<C />)
    await flushMicrotasks()
    expect(derived.isDestroyed()).toBe(false)
  })

  it('useMotionTemplate keeps updating its string', async () => {
    let x!: MotionValue<number>
    let tpl!: MotionValue<string>
    function C() {
      x = useMotionValue(0)
      tpl = useMotionTemplate`translateX(${x}px)`
      return null
    }
    renderStrict(<C />)
    await flushMicrotasks()
    x.jump(7)
    expect(tpl.get()).toBe('translateX(7px)')
  })

  it('useTime, useSmooth, useDelay, useVelocity, useVelocityTransform, useWillChange return live values', async () => {
    const out: Record<string, MotionValue<unknown>> = {}
    function C() {
      const source = useMotionValue(0)
      out.time = useTime()
      out.smooth = useSmooth(source, 0.5)
      out.delay = useDelay(source, 1)
      out.velocity = useVelocity(source)
      out.velocityTransform = useVelocityTransform(source, (v) => v)
      out.willChange = useWillChange([source])
      return null
    }
    renderStrict(<C />)
    await flushMicrotasks()
    for (const [name, value] of Object.entries(out)) {
      expect({ name, destroyed: value.isDestroyed() }).toEqual({ name, destroyed: false })
    }
  })

  it('useScroll updates its MotionValues on scroll', async () => {
    let scrollY!: MotionValue<number>
    function C() {
      scrollY = useScroll().scrollY
      return null
    }
    renderStrict(<C />)
    await flushMicrotasks()
    expect(scrollY.isDestroyed()).toBe(false)
    Object.defineProperty(window, 'scrollY', { value: 120, configurable: true, writable: true })
    await act(async () => {
      window.dispatchEvent(new Event('scroll'))
      await new Promise((r) => setTimeout(r, 50))
    })
    expect(scrollY.get()).toBe(120)
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true, writable: true })
  })

  it('useScrollVelocity returns a live value', async () => {
    let v!: MotionValue<number>
    function C() {
      v = useScrollVelocity()
      return null
    }
    renderStrict(<C />)
    await flushMicrotasks()
    expect(v.isDestroyed()).toBe(false)
  })

  it('useSpringState setter still animates and syncs the MotionValue', async () => {
    let api!: ReturnType<typeof useSpringState>
    function C() {
      api = useSpringState(0, { stiffness: 1000, damping: 100 })
      return null
    }
    renderStrict(<C />)
    await flushMicrotasks()
    act(() => api[1](100))
    await act(async () => {
      await new Promise((r) => setTimeout(r, 200))
    })
    expect(api[0]).toBeGreaterThan(0)
    expect(api[2].get()).toBeGreaterThan(0)
  })

  it('useChain springs survive the simulated remount', async () => {
    let chain!: ReturnType<typeof useChain>
    function C() {
      chain = useChain([{ to: { x: 100 }, config: { stiffness: 1000, damping: 100 } }])
      return null
    }
    renderStrict(<C />)
    await flushMicrotasks()
    act(() => chain.play())
    await act(async () => {
      await new Promise((r) => setTimeout(r, 200))
    })
    expect(chain.values.x!.get()).toBeGreaterThan(0)
  })
})
