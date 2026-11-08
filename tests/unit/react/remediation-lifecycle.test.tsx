import * as React from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { act, cleanup, render, renderHook } from '@testing-library/react'
import { LazyMotion, useLazyMotion, useVariants, type FeatureBundle } from '../../../src/adapters/react'
import { installTestClock, type TestClock } from '../../../src/testing'
let clock: TestClock | undefined
afterEach(() => { cleanup(); clock?.uninstall(); vi.restoreAllMocks() })

it('invalidates completed loader state while its replacement is pending', async () => {
  const state: { current?: ReturnType<typeof useLazyMotion> } = {}
  function Consumer() { state.current = useLazyMotion(); return null }
  const first = async () => ({ gestures: true })
  let resolve!: (value: FeatureBundle) => void
  const second = () => new Promise<FeatureBundle>(r => { resolve = r })
  const ui = (loader: () => Promise<FeatureBundle>) => <LazyMotion features={loader}><Consumer /></LazyMotion>
  const { rerender } = render(ui(first))
  await act(async () => { await Promise.resolve() })
  expect(state.current?.features.gestures).toBe(true)
  rerender(ui(second))
  expect(state.current?.isLoaded).toBe(false)
  expect(state.current?.features).toEqual({})
  await act(async () => resolve({ gestures: false }))
  expect(state.current?.isLoaded).toBe(true)
  expect(state.current?.features.gestures).toBe(false)
})

it('reports actual rest for long travel, and reports completion again after same-name retargets', async () => {
  clock = installTestClock()
  const complete = vi.fn()
  const { result, rerender } = renderHook(({ x }) => useVariants({
    initial: { x: 0 }, animate: 'visible', variants: { visible: { x } },
    spring: { stiffness: 60, damping: 6 }, onAnimationComplete: complete,
  }), { initialProps: { x: 1000 } })
  for (let i = 0; i < 600 && complete.mock.calls.length === 0; i++) await act(async () => { clock!.nextFrame() })
  expect(complete).toHaveBeenCalledTimes(1)
  const atRest = Number(result.current.values.x)
  expect(Math.abs(atRest - 1000)).toBeLessThanOrEqual(0.01)
  await act(async () => clock!.advance(100))
  expect(result.current.values.x).toBe(atRest)
  rerender({ x: 500 })
  for (let i = 0; i < 600 && complete.mock.calls.length < 2; i++) await act(async () => { clock!.nextFrame() })
  expect(complete).toHaveBeenCalledTimes(2)
  expect(result.current.values.x).toBe(500)
  expect(result.current.isAnimating).toBe(false)
})
