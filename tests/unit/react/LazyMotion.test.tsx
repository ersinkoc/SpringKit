import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import React from 'react'
import {
  LazyMotion,
  useLazyMotion,
  useMotionFeature,
  domAnimation,
  domMax,
  domMin,
  MotionFeatureGuard,
  createAsyncFeatures,
  mergeFeatures,
} from '@oxog/springkit/react'

beforeEach(() => {
  cleanup()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('LazyMotion', () => {
  describe('basic rendering', () => {
    it('should render children', () => {
      render(
        <LazyMotion features={domAnimation}>
          <div data-testid="child">Child Content</div>
        </LazyMotion>
      )

      expect(screen.getByTestId('child')).toBeInTheDocument()
    })

    it('should render with domAnimation features', () => {
      render(
        <LazyMotion features={domAnimation}>
          <div data-testid="child">Content</div>
        </LazyMotion>
      )

      expect(screen.getByTestId('child')).toBeInTheDocument()
    })

    it('should render with domMax features', () => {
      render(
        <LazyMotion features={domMax}>
          <div data-testid="child">Content</div>
        </LazyMotion>
      )

      expect(screen.getByTestId('child')).toBeInTheDocument()
    })

    it('should render with domMin features', () => {
      render(
        <LazyMotion features={domMin}>
          <div data-testid="child">Content</div>
        </LazyMotion>
      )

      expect(screen.getByTestId('child')).toBeInTheDocument()
    })

    it('should render with custom features', () => {
      render(
        <LazyMotion features={{ animations: true, layout: true }}>
          <div data-testid="child">Content</div>
        </LazyMotion>
      )

      expect(screen.getByTestId('child')).toBeInTheDocument()
    })
  })

  describe('strict mode', () => {
    it('should accept strict prop', () => {
      render(
        <LazyMotion features={domAnimation} strict>
          <div data-testid="child">Content</div>
        </LazyMotion>
      )

      expect(screen.getByTestId('child')).toBeInTheDocument()
    })

    it('should default strict to false', () => {
      render(
        <LazyMotion features={domAnimation}>
          <div data-testid="child">Content</div>
        </LazyMotion>
      )

      expect(screen.getByTestId('child')).toBeInTheDocument()
    })
  })

  describe('async features', () => {
    it('should accept async feature loader', async () => {
      const loadFeatures = async () => domAnimation

      render(
        <LazyMotion features={loadFeatures}>
          <div data-testid="child">Content</div>
        </LazyMotion>
      )

      await waitFor(() => {
        expect(screen.getByTestId('child')).toBeInTheDocument()
      })
    })

    it('should load async features', async () => {
      const loadFeatures = vi.fn().mockResolvedValue(domMax)

      render(
        <LazyMotion features={loadFeatures}>
          <div>Content</div>
        </LazyMotion>
      )

      await waitFor(() => {
        expect(loadFeatures).toHaveBeenCalled()
      })
    })
  })
})

describe('useLazyMotion', () => {
  it('should return features', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LazyMotion features={domAnimation}>{children}</LazyMotion>
    )

    const { result } = renderHook(() => useLazyMotion(), { wrapper })

    expect(result.current.features).toBeDefined()
    expect(result.current.features.animations).toBe(true)
    expect(result.current.features.gestures).toBe(true)
  })

  it('should return isStrict', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LazyMotion features={domAnimation} strict>
        {children}
      </LazyMotion>
    )

    const { result } = renderHook(() => useLazyMotion(), { wrapper })

    expect(result.current.isStrict).toBe(true)
  })

  it('should return isLoaded', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LazyMotion features={domAnimation}>{children}</LazyMotion>
    )

    const { result } = renderHook(() => useLazyMotion(), { wrapper })

    expect(result.current.isLoaded).toBe(true)
  })

  it('should return default context outside LazyMotion', () => {
    const { result } = renderHook(() => useLazyMotion())

    expect(result.current.features).toBeDefined()
    expect(result.current.isStrict).toBe(false)
    expect(result.current.isLoaded).toBe(true)
  })
})

describe('useMotionFeature', () => {
  it('should return true for available feature', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LazyMotion features={domAnimation}>{children}</LazyMotion>
    )

    const { result } = renderHook(() => useMotionFeature('animations'), {
      wrapper,
    })

    expect(result.current).toBe(true)
  })

  it('should return false for unavailable feature', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LazyMotion features={domMin}>{children}</LazyMotion>
    )

    const { result } = renderHook(() => useMotionFeature('layout'), { wrapper })

    expect(result.current).toBe(false)
  })

  it('should check gestures feature', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LazyMotion features={domAnimation}>{children}</LazyMotion>
    )

    const { result } = renderHook(() => useMotionFeature('gestures'), {
      wrapper,
    })

    expect(result.current).toBe(true)
  })

  it('should check layout feature', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LazyMotion features={domMax}>{children}</LazyMotion>
    )

    const { result } = renderHook(() => useMotionFeature('layout'), { wrapper })

    expect(result.current).toBe(true)
  })

  it('should check svg feature', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LazyMotion features={domMax}>{children}</LazyMotion>
    )

    const { result } = renderHook(() => useMotionFeature('svg'), { wrapper })

    expect(result.current).toBe(true)
  })

  it('should check scroll feature', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LazyMotion features={domMax}>{children}</LazyMotion>
    )

    const { result } = renderHook(() => useMotionFeature('scroll'), { wrapper })

    expect(result.current).toBe(true)
  })
})

describe('MotionFeatureGuard', () => {
  it('should render children when feature is available', () => {
    render(
      <LazyMotion features={domAnimation}>
        <MotionFeatureGuard feature="animations">
          <div data-testid="content">Animations available</div>
        </MotionFeatureGuard>
      </LazyMotion>
    )

    expect(screen.getByTestId('content')).toBeInTheDocument()
  })

  it('should render fallback when feature is not available', () => {
    render(
      <LazyMotion features={domMin}>
        <MotionFeatureGuard
          feature="layout"
          fallback={<div data-testid="fallback">No layout</div>}
        >
          <div data-testid="content">Layout available</div>
        </MotionFeatureGuard>
      </LazyMotion>
    )

    expect(screen.getByTestId('fallback')).toBeInTheDocument()
    expect(screen.queryByTestId('content')).not.toBeInTheDocument()
  })

  it('should render nothing when feature is not available and no fallback', () => {
    const { container } = render(
      <LazyMotion features={domMin}>
        <MotionFeatureGuard feature="layout">
          <div data-testid="content">Layout available</div>
        </MotionFeatureGuard>
      </LazyMotion>
    )

    expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    // Container should have the LazyMotion content but no guarded content
  })
})

describe('domAnimation', () => {
  it('should have animations enabled', () => {
    expect(domAnimation.animations).toBe(true)
  })

  it('should have gestures enabled', () => {
    expect(domAnimation.gestures).toBe(true)
  })

  it('should not have layout enabled', () => {
    expect(domAnimation.layout).toBeUndefined()
  })
})

describe('domMax', () => {
  it('should have animations enabled', () => {
    expect(domMax.animations).toBe(true)
  })

  it('should have gestures enabled', () => {
    expect(domMax.gestures).toBe(true)
  })

  it('should have layout enabled', () => {
    expect(domMax.layout).toBe(true)
  })

  it('should have svg enabled', () => {
    expect(domMax.svg).toBe(true)
  })

  it('should have scroll enabled', () => {
    expect(domMax.scroll).toBe(true)
  })
})

describe('domMin', () => {
  it('should have animations enabled', () => {
    expect(domMin.animations).toBe(true)
  })

  it('should not have gestures enabled', () => {
    expect(domMin.gestures).toBeUndefined()
  })

  it('should not have layout enabled', () => {
    expect(domMin.layout).toBeUndefined()
  })
})

describe('createAsyncFeatures', () => {
  it('should create async feature loader', async () => {
    const loadFeatures = createAsyncFeatures({
      animations: true,
      gestures: true,
    })

    const features = await loadFeatures()

    expect(features.animations).toBe(true)
    expect(features.gestures).toBe(true)
  })

  it('should handle async feature loaders', async () => {
    const loadAnimations = vi.fn().mockResolvedValue(undefined)

    const loadFeatures = createAsyncFeatures({
      animations: loadAnimations,
      gestures: true,
    })

    const features = await loadFeatures()

    expect(loadAnimations).toHaveBeenCalled()
    expect(features.animations).toBe(true)
    expect(features.gestures).toBe(true)
  })

  it('should handle mixed sync and async features', async () => {
    const loadLayout = vi.fn().mockResolvedValue(undefined)

    const loadFeatures = createAsyncFeatures({
      animations: true,
      layout: loadLayout,
    })

    const features = await loadFeatures()

    expect(features.animations).toBe(true)
    expect(features.layout).toBe(true)
  })
})

describe('mergeFeatures', () => {
  it('should merge feature bundles', () => {
    const bundle1 = { animations: true }
    const bundle2 = { gestures: true }

    const merged = mergeFeatures(bundle1, bundle2)

    expect(merged.animations).toBe(true)
    expect(merged.gestures).toBe(true)
  })

  it('should override with later bundles', () => {
    const bundle1 = { animations: true, layout: false }
    const bundle2 = { layout: true }

    const merged = mergeFeatures(bundle1, bundle2)

    expect(merged.animations).toBe(true)
    expect(merged.layout).toBe(true)
  })

  it('should handle empty bundles', () => {
    const merged = mergeFeatures({}, { animations: true }, {})

    expect(merged.animations).toBe(true)
  })

  it('should merge multiple bundles', () => {
    const merged = mergeFeatures(
      { animations: true },
      { gestures: true },
      { layout: true },
      { svg: true }
    )

    expect(merged.animations).toBe(true)
    expect(merged.gestures).toBe(true)
    expect(merged.layout).toBe(true)
    expect(merged.svg).toBe(true)
  })
})
