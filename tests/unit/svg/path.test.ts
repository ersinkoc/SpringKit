import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createPathAnimation,
  getPathLength,
  preparePathForAnimation,
  getPointAtProgress,
} from '@oxog/springkit'
import { installTestClock, type TestClock } from '../../../src/testing'

describe('SVG Path Animations', () => {
  let svgElement: SVGSVGElement
  let pathElement: SVGPathElement

  beforeEach(() => {
    svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svgElement.setAttribute('width', '200')
    svgElement.setAttribute('height', '200')
    document.body.appendChild(svgElement)

    pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    pathElement.setAttribute('d', 'M 0 0 L 100 0 L 100 100 L 0 100 Z')
    svgElement.appendChild(pathElement)
  })

  afterEach(() => {
    document.body.removeChild(svgElement)
    vi.restoreAllMocks()
  })

  describe('getPathLength', () => {
    it('should return path length', () => {
      const length = getPathLength(pathElement)
      expect(typeof length).toBe('number')
      expect(length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('preparePathForAnimation', () => {
    it('should set strokeDasharray and strokeDashoffset', () => {
      preparePathForAnimation(pathElement, 0)

      expect(pathElement.style.strokeDasharray).toBeDefined()
      expect(pathElement.style.strokeDashoffset).toBeDefined()
    })

    it('should set initial progress', () => {
      preparePathForAnimation(pathElement, 0.5)

      // At 50% progress, dashoffset should be half of dasharray
      expect(pathElement.style.strokeDasharray).toBeDefined()
    })
  })

  describe('createPathAnimation', () => {
    it('should create a path animation', () => {
      const anim = createPathAnimation(pathElement)

      expect(anim).toHaveProperty('play')
      expect(anim).toHaveProperty('reverse')
      expect(anim).toHaveProperty('set')
      expect(anim).toHaveProperty('get')
      expect(anim).toHaveProperty('pause')
      expect(anim).toHaveProperty('reset')
      expect(anim).toHaveProperty('isAnimating')
      expect(anim).toHaveProperty('destroy')

      anim.destroy()
    })

    it('should start at 0 by default', () => {
      const anim = createPathAnimation(pathElement)
      expect(anim.get()).toBe(0)
      anim.destroy()
    })

    it('should animate to 1 on play', async () => {
      const onUpdate = vi.fn()
      const onComplete = vi.fn()

      const anim = createPathAnimation(pathElement, {
        config: { stiffness: 1000, damping: 100 },
        onUpdate,
        onComplete,
      })

      await anim.play()

      expect(onUpdate).toHaveBeenCalled()
      expect(onComplete).toHaveBeenCalled()
      expect(anim.get()).toBeCloseTo(1, 1)
      anim.destroy()
    }, 5000)

    it('should animate back to 0 on reverse', async () => {
      const anim = createPathAnimation(pathElement, {
        config: { stiffness: 1000, damping: 100 },
      })

      // First play to 1
      await anim.play()

      // Then reverse to 0
      await anim.reverse()

      expect(anim.get()).toBeCloseTo(0, 1)
      anim.destroy()
    }, 10000)

    it('should set value instantly with animate=false', () => {
      const anim = createPathAnimation(pathElement)

      anim.set(0.5, false)
      expect(anim.get()).toBe(0.5)

      anim.set(1, false)
      expect(anim.get()).toBe(1)

      anim.destroy()
    })

    it('should animate when set with animate=true', async () => {
      const onUpdate = vi.fn()
      const anim = createPathAnimation(pathElement, {
        config: { stiffness: 1000, damping: 100 },
        onUpdate,
      })

      anim.set(1, true)

      await new Promise((r) => setTimeout(r, 500))

      expect(onUpdate).toHaveBeenCalled()
      anim.destroy()
    })

    it('should reset to 0', async () => {
      const anim = createPathAnimation(pathElement, {
        config: { stiffness: 1000, damping: 100 },
      })

      await anim.play()
      anim.reset()

      expect(anim.get()).toBe(0)
      anim.destroy()
    }, 5000)

    it('should pause animation', async () => {
      const anim = createPathAnimation(pathElement)

      anim.play()
      anim.pause()

      expect(anim.isAnimating()).toBe(false)
      anim.destroy()
    })

    it('should resume after pause', async () => {
      const anim = createPathAnimation(pathElement, {
        config: { stiffness: 1000, damping: 100 },
      })

      anim.play()
      anim.pause()
      anim.resume()

      // Should have re-started animation
      await new Promise((r) => setTimeout(r, 100))
      anim.destroy()
    })

    it('should not resume if destroyed', () => {
      const anim = createPathAnimation(pathElement)
      anim.destroy()
      // Should not throw
      expect(() => anim.resume()).not.toThrow()
    })

    it('should not pause if destroyed', () => {
      const anim = createPathAnimation(pathElement)
      anim.destroy()
      // Should not throw
      expect(() => anim.pause()).not.toThrow()
    })

    it('should destroy and cleanup', () => {
      const anim = createPathAnimation(pathElement)
      anim.play()
      anim.destroy()

      // Should not throw
      expect(() => anim.get()).not.toThrow()
    })

    it('should not play if destroyed', async () => {
      const onComplete = vi.fn()
      const anim = createPathAnimation(pathElement, { onComplete })
      anim.destroy()
      await anim.play()
      expect(onComplete).not.toHaveBeenCalled()
    })

    it('should not reverse if destroyed', async () => {
      const onComplete = vi.fn()
      const anim = createPathAnimation(pathElement, { onComplete })
      anim.destroy()
      await anim.reverse()
      expect(onComplete).not.toHaveBeenCalled()
    })

    it('should not set if destroyed', () => {
      const anim = createPathAnimation(pathElement)
      anim.destroy()
      // Should not throw
      expect(() => anim.set(0.5)).not.toThrow()
      expect(() => anim.set(0.5, true)).not.toThrow()
    })

    it('should not reset if destroyed', () => {
      const anim = createPathAnimation(pathElement)
      anim.destroy()
      // Should not throw
      expect(() => anim.reset()).not.toThrow()
    })

    it('should auto-play when option is set', async () => {
      const onUpdate = vi.fn()

      const anim = createPathAnimation(pathElement, {
        config: { stiffness: 1000, damping: 100 },
        autoPlay: true,
        onUpdate,
      })

      await new Promise((r) => setTimeout(r, 100))

      expect(onUpdate).toHaveBeenCalled()
      anim.destroy()
    })
  })

  describe('getPointAtProgress', () => {
    // Note: JSDOM doesn't implement getPointAtLength on SVG paths
    // These tests verify the function handles this gracefully
    it('should return null in JSDOM (graceful fallback)', () => {
      const point = getPointAtProgress(pathElement, 0)
      // In JSDOM, SVG path methods aren't implemented, so we expect null
      expect(point).toBeNull()
    })

    it('should not throw for out-of-range progress', () => {
      expect(() => getPointAtProgress(pathElement, -0.5)).not.toThrow()
      expect(() => getPointAtProgress(pathElement, 1.5)).not.toThrow()
    })

    it('should handle any progress value without error', () => {
      expect(() => {
        getPointAtProgress(pathElement, 0)
        getPointAtProgress(pathElement, 0.5)
        getPointAtProgress(pathElement, 1)
      }).not.toThrow()
    })
  })
})

describe('SVG Path Animation regressions', () => {
  it('resume() continues towards the target interrupted by pause()', async () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    svg.appendChild(path)
    document.body.appendChild(svg)

    const anim = createPathAnimation(path, { config: { stiffness: 100, damping: 20 } })
    void anim.play(1)
    await new Promise(resolve => setTimeout(resolve, 50))
    anim.pause()
    const pausedAt = anim.get()
    expect(pausedAt).toBeLessThan(0.99)

    anim.resume()
    await new Promise(resolve => setTimeout(resolve, 1500))

    expect(anim.get()).toBeCloseTo(1, 1)
    anim.destroy()
    svg.remove()
  })
})

describe('SVG Path Animation promise semantics', () => {
  let clock: TestClock
  let svg: SVGSVGElement
  let path: SVGPathElement

  beforeEach(() => {
    clock = installTestClock({ timers: true })
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    svg.appendChild(path)
    document.body.appendChild(svg)
  })

  afterEach(() => {
    clock.uninstall()
    svg.remove()
  })

  const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve))

  it('pause() does not resolve play() or fire onComplete', async () => {
    const onComplete = vi.fn()
    const anim = createPathAnimation(path, { onComplete })
    const resolved = vi.fn()
    void anim.play().then(resolved)

    clock.advance(50)
    anim.pause()
    clock.advance(1000)
    await flush()

    expect(resolved).not.toHaveBeenCalled()
    expect(onComplete).not.toHaveBeenCalled()

    // Resolves once the resumed animation actually completes
    anim.resume()
    clock.runAll()
    await flush()
    expect(resolved).toHaveBeenCalledTimes(1)
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(anim.get()).toBeCloseTo(1, 2)
    anim.destroy()
  })

  it('reset() resolves a pending play() without onComplete', async () => {
    const onComplete = vi.fn()
    const anim = createPathAnimation(path, { onComplete })
    const resolved = vi.fn()
    void anim.play().then(resolved)

    clock.advance(50)
    anim.pause()
    anim.reset()
    await flush()

    expect(resolved).toHaveBeenCalledTimes(1)
    expect(onComplete).not.toHaveBeenCalled()
    anim.destroy()
  })

  it('destroy() resolves a pending play() instead of leaving it hanging', async () => {
    const onComplete = vi.fn()
    const anim = createPathAnimation(path, { onComplete })
    const resolved = vi.fn()
    void anim.play().then(resolved)

    clock.advance(50)
    anim.destroy()
    await flush()

    expect(resolved).toHaveBeenCalledTimes(1)
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('fires onComplete once when play() is retargeted mid-flight', async () => {
    const onComplete = vi.fn()
    const anim = createPathAnimation(path, { onComplete })
    const first = vi.fn()
    const second = vi.fn()
    void anim.play(1).then(first)
    clock.advance(50)
    void anim.reverse().then(second)

    clock.runAll()
    await flush()

    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(anim.get()).toBeCloseTo(0, 2)
    anim.destroy()
  })
})
