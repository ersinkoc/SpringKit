import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, act, cleanup, screen } from '@testing-library/react'
import * as React from 'react'
import {
  MotionConfig,
  useMotionConfig,
  LazyMotion,
  MotionFeatureGuard,
} from '@oxog/springkit/react'
import type { FeatureBundle } from '@oxog/springkit/react'

function ShowConfig() {
  const ctx = useMotionConfig()
  return (
    <div
      data-testid="cfg"
      data-reduced={String(ctx.isReducedMotion)}
      data-initial={String(ctx.initial)}
      data-stiffness={String(ctx.config.stiffness)}
    />
  )
}

// Tests below install their own matchMedia; restore whatever was there
// before (deleting it would leak into later test files)
const originalMatchMedia = Object.getOwnPropertyDescriptor(window, 'matchMedia')

describe('MotionConfig (regressions)', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    if (originalMatchMedia) Object.defineProperty(window, 'matchMedia', originalMatchMedia)
    else delete (window as { matchMedia?: unknown }).matchMedia
  })

  it('nested MotionConfig inherits reducedMotion and initial from its parent', () => {
    render(
      <MotionConfig reducedMotion="always" initial={false} config={{ stiffness: 50 }}>
        <MotionConfig config={{ damping: 5 }}>
          <ShowConfig />
        </MotionConfig>
      </MotionConfig>
    )
    const el = screen.getByTestId('cfg')
    expect(el).toHaveAttribute('data-reduced', 'true')
    expect(el).toHaveAttribute('data-initial', 'false')
    expect(el).toHaveAttribute('data-stiffness', '50')
  })

  it('reducedMotion="user" follows changes of the OS preference', () => {
    let matches = false
    const listeners = new Set<() => void>()
    window.matchMedia = vi.fn().mockImplementation(() => ({
      get matches() {
        return matches
      },
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: (_: string, cb: () => void) => listeners.add(cb),
      removeEventListener: (_: string, cb: () => void) => listeners.delete(cb),
    })) as unknown as typeof window.matchMedia

    render(
      <MotionConfig reducedMotion="user">
        <ShowConfig />
      </MotionConfig>
    )
    expect(screen.getByTestId('cfg')).toHaveAttribute('data-reduced', 'false')

    act(() => {
      matches = true
      listeners.forEach((cb) => cb())
    })
    expect(screen.getByTestId('cfg')).toHaveAttribute('data-reduced', 'true')
  })
})

describe('LazyMotion (regressions)', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('ignores a slow earlier loader that resolves after a newer one', async () => {
    let resolveSlow!: (bundle: FeatureBundle) => void
    const slow = () => new Promise<FeatureBundle>((resolve) => { resolveSlow = resolve })
    const fast = () => Promise.resolve<FeatureBundle>({ layout: false })

    const ui = (features: () => Promise<FeatureBundle>) => (
      <LazyMotion features={features}>
        <MotionFeatureGuard feature="layout" fallback={<span>no-layout</span>}>
          <span>layout</span>
        </MotionFeatureGuard>
      </LazyMotion>
    )

    const { rerender } = render(ui(slow))
    rerender(ui(fast))
    await act(async () => {})
    expect(screen.getByText('no-layout')).toBeInTheDocument()

    await act(async () => {
      resolveSlow({ layout: true })
    })
    expect(screen.getByText('no-layout')).toBeInTheDocument()
  })

  it('renders children (without optional features) when the loader rejects', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const failing = () => Promise.reject(new Error('chunk failed'))

    render(
      <LazyMotion features={failing}>
        <MotionFeatureGuard feature="layout" fallback={<span>fallback</span>}>
          <span>layout</span>
        </MotionFeatureGuard>
      </LazyMotion>
    )
    await act(async () => {})

    expect(screen.getByText('fallback')).toBeInTheDocument()
    expect(errorSpy).toHaveBeenCalled()
  })
})
