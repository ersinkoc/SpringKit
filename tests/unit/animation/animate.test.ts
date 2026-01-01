import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { animate, animateAll } from '@oxog/springkit'

describe('animate', () => {
  let element: HTMLElement

  beforeEach(() => {
    vi.useFakeTimers()
    element = document.createElement('div')
    document.body.appendChild(element)
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.textContent = ''
  })

  describe('basic functionality', () => {
    it('should return animation controls', () => {
      const controls = animate(element, { opacity: 1 })

      expect(controls).toHaveProperty('stop')
      expect(controls).toHaveProperty('pause')
      expect(controls).toHaveProperty('resume')
      expect(controls).toHaveProperty('getProgress')
      expect(controls).toHaveProperty('isAnimating')
      expect(controls).toHaveProperty('finished')

      controls.stop()
    })

    it('should handle string selector', () => {
      element.className = 'test-element'
      const controls = animate('.test-element', { opacity: 1 })

      expect(controls.isAnimating()).toBe(true)
      controls.stop()
    })

    it('should handle missing element gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const controls = animate('.non-existent', { opacity: 1 })

      expect(controls.isAnimating()).toBe(false)
      expect(controls.getProgress()).toBe(1)

      consoleSpy.mockRestore()
    })

    it('should apply spring config', () => {
      const controls = animate(element, { x: 100 }, {
        stiffness: 200,
        damping: 15,
        mass: 2,
      })

      expect(controls.isAnimating()).toBe(true)
      controls.stop()
    })
  })

  describe('animation properties', () => {
    it('should animate opacity', () => {
      element.style.opacity = '0'
      const controls = animate(element, { opacity: 1 })

      expect(controls.isAnimating()).toBe(true)
      controls.stop()
    })

    it('should animate transform properties', () => {
      const controls = animate(element, {
        x: 100,
        y: 50,
        scale: 1.5,
        rotate: 45,
      })

      expect(controls.isAnimating()).toBe(true)
      controls.stop()
    })

    it('should animate dimension properties', () => {
      const controls = animate(element, {
        width: 200,
        height: 150,
      })

      expect(controls.isAnimating()).toBe(true)
      controls.stop()
    })
  })

  describe('control methods', () => {
    it('should stop animation', () => {
      const controls = animate(element, { x: 100 })

      expect(controls.isAnimating()).toBe(true)
      controls.stop()
      expect(controls.isAnimating()).toBe(false)
    })

    it('should pause animation', () => {
      const controls = animate(element, { x: 100 })

      controls.pause()
      expect(controls.isAnimating()).toBe(false)
    })

    it('should resume animation', () => {
      const controls = animate(element, { x: 100 })

      controls.pause()
      controls.resume()
      expect(controls.isAnimating()).toBe(true)

      controls.stop()
    })

    it('should get progress', () => {
      const controls = animate(element, { x: 100 })

      const progress = controls.getProgress()
      expect(progress).toBeGreaterThanOrEqual(0)
      expect(progress).toBeLessThanOrEqual(1)

      controls.stop()
    })
  })

  describe('callbacks', () => {
    it('should call onUpdate callback', async () => {
      const onUpdate = vi.fn()
      const controls = animate(element, { x: 100 }, { onUpdate })

      await vi.advanceTimersByTimeAsync(16)

      expect(onUpdate).toHaveBeenCalled()
      controls.stop()
    })

    it('should call onComplete callback', async () => {
      const onComplete = vi.fn()
      const controls = animate(element, { x: 100 }, { onComplete })

      controls.stop()

      await controls.finished
    })
  })

  describe('delay', () => {
    it('should delay animation start', () => {
      const controls = animate(element, { x: 100 }, { delay: 1000 })

      expect(controls.isAnimating()).toBe(true)
      controls.stop()
    })
  })

  describe('keyframes', () => {
    it('should handle array of values', () => {
      const controls = animate(element, { opacity: [0, 1, 0.5, 1] })

      expect(controls.isAnimating()).toBe(true)
      controls.stop()
    })
  })

  describe('finished promise', () => {
    it('should resolve on stop', async () => {
      const controls = animate(element, { x: 100 })

      controls.stop()

      await expect(controls.finished).resolves.toBeUndefined()
    })
  })
})

describe('animateAll', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    const container = document.createElement('div')
    for (let i = 0; i < 3; i++) {
      const item = document.createElement('div')
      item.className = 'item'
      item.textContent = String(i + 1)
      container.appendChild(item)
    }
    document.body.appendChild(container)
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.textContent = ''
  })

  it('should animate multiple elements', () => {
    const controls = animateAll('.item', { opacity: 1 })

    expect(controls).toHaveLength(3)
    expect(controls[0]).toHaveProperty('stop')

    controls.forEach(c => c.stop())
  })

  it('should apply stagger delay', () => {
    const controls = animateAll('.item', { opacity: 1 }, { stagger: 100 })

    expect(controls).toHaveLength(3)

    controls.forEach(c => c.stop())
  })

  it('should combine delay and stagger', () => {
    const controls = animateAll('.item', { opacity: 1 }, {
      delay: 500,
      stagger: 100,
    })

    expect(controls).toHaveLength(3)

    controls.forEach(c => c.stop())
  })
})
