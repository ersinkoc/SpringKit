import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { measureElement, createFlip, flip, flipBatch } from '@oxog/springkit'

describe('FLIP Layout Animations', () => {
  let container: HTMLDivElement
  let element: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    container.style.position = 'relative'
    container.style.width = '500px'
    container.style.height = '500px'
    document.body.appendChild(container)

    element = document.createElement('div')
    element.style.position = 'absolute'
    element.style.width = '100px'
    element.style.height = '100px'
    element.style.left = '0px'
    element.style.top = '0px'
    container.appendChild(element)
  })

  afterEach(() => {
    document.body.removeChild(container)
    vi.restoreAllMocks()
  })

  describe('measureElement', () => {
    it('should measure element dimensions', () => {
      const box = measureElement(element)

      expect(box).toHaveProperty('x')
      expect(box).toHaveProperty('y')
      expect(box).toHaveProperty('width')
      expect(box).toHaveProperty('height')
      expect(typeof box.x).toBe('number')
      expect(typeof box.y).toBe('number')
      expect(typeof box.width).toBe('number')
      expect(typeof box.height).toBe('number')
    })

    it('should include scroll offset', () => {
      // The measurement should include window.scrollX and window.scrollY
      const box = measureElement(element)
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.y).toBeGreaterThanOrEqual(0)
    })
  })

  describe('createFlip', () => {
    it('should create a FLIP animation', () => {
      const first = { x: 0, y: 0, width: 100, height: 100 }
      const last = { x: 50, y: 50, width: 100, height: 100 }

      const anim = createFlip(element, first, last)

      expect(anim).toHaveProperty('play')
      expect(anim).toHaveProperty('cancel')
      expect(anim).toHaveProperty('isAnimating')
      expect(anim).toHaveProperty('getProgress')
    })

    it('should apply initial transform (inversion)', () => {
      const first = { x: 0, y: 0, width: 100, height: 100 }
      const last = { x: 100, y: 100, width: 100, height: 100 }

      const anim = createFlip(element, first, last)

      // Should have applied inverse transform
      expect(element.style.transform).toContain('translate')
      anim.cancel()
    })

    it('should animate to final position', async () => {
      const first = { x: 0, y: 0, width: 100, height: 100 }
      const last = { x: 50, y: 0, width: 100, height: 100 }

      const onComplete = vi.fn()
      const anim = createFlip(element, first, last, {
        config: { stiffness: 1000, damping: 100 },
        onComplete,
      })

      await anim.play()

      expect(onComplete).toHaveBeenCalled()
      expect(anim.isAnimating()).toBe(false)
    }, 5000)

    it('should call onUpdate during animation', async () => {
      const first = { x: 0, y: 0, width: 100, height: 100 }
      const last = { x: 50, y: 0, width: 100, height: 100 }

      const onUpdate = vi.fn()
      const anim = createFlip(element, first, last, {
        config: { stiffness: 1000, damping: 100 },
        onUpdate,
      })

      await anim.play()

      expect(onUpdate).toHaveBeenCalled()
      // Progress should go from 0 to 1
      const calls = onUpdate.mock.calls
      expect(calls[0][0]).toBe(0) // First call with 0
      expect(calls[calls.length - 1][0]).toBeCloseTo(1, 1) // Last call close to 1
    }, 5000)

    it('should handle size changes', async () => {
      const first = { x: 0, y: 0, width: 100, height: 100 }
      const last = { x: 0, y: 0, width: 200, height: 200 }

      const anim = createFlip(element, first, last, {
        config: { stiffness: 1000, damping: 100 },
        size: true,
      })

      // Should have transform origin set
      expect(element.style.transformOrigin).toBe('0 0')

      await anim.play()
    }, 5000)

    it('should be cancellable', () => {
      const first = { x: 0, y: 0, width: 100, height: 100 }
      const last = { x: 100, y: 100, width: 100, height: 100 }

      const anim = createFlip(element, first, last)
      anim.play()
      anim.cancel()

      expect(anim.isAnimating()).toBe(false)
    })

    it('should cancel during animation and resolve', async () => {
      const first = { x: 0, y: 0, width: 100, height: 100 }
      const last = { x: 200, y: 200, width: 100, height: 100 }

      const anim = createFlip(element, first, last, {
        config: { stiffness: 50, damping: 5 }, // Slow animation
      })

      const playPromise = anim.play()

      // Cancel during animation
      await new Promise((r) => setTimeout(r, 20))
      anim.cancel()

      // Promise should resolve
      await playPromise
      expect(anim.isAnimating()).toBe(false)
    })

    it('should not play if already cancelled', async () => {
      const first = { x: 0, y: 0, width: 100, height: 100 }
      const last = { x: 100, y: 100, width: 100, height: 100 }

      const anim = createFlip(element, first, last)
      anim.cancel()
      await anim.play()

      expect(anim.isAnimating()).toBe(false)
    })

    it('should respect position option', async () => {
      const first = { x: 0, y: 0, width: 100, height: 100 }
      const last = { x: 100, y: 100, width: 100, height: 100 }

      const anim = createFlip(element, first, last, {
        config: { stiffness: 1000, damping: 100 },
        position: false,
      })

      await anim.play()
      // Animation should complete without errors
    }, 5000)
  })

  describe('flip helper', () => {
    it('should handle full FLIP flow', async () => {
      element.style.left = '0px'

      await flip(
        element,
        () => {
          element.style.left = '100px'
        },
        { config: { stiffness: 1000, damping: 100 } }
      )

      expect(element.style.left).toBe('100px')
    }, 5000)

    it('should handle async mutations', async () => {
      element.style.left = '0px'

      await flip(
        element,
        async () => {
          await new Promise((r) => setTimeout(r, 10))
          element.style.left = '100px'
        },
        { config: { stiffness: 1000, damping: 100 } }
      )

      expect(element.style.left).toBe('100px')
    }, 5000)
  })

  describe('flipBatch', () => {
    it('should animate multiple elements', async () => {
      const element2 = document.createElement('div')
      element2.style.position = 'absolute'
      element2.style.width = '100px'
      element2.style.height = '100px'
      element2.style.left = '0px'
      element2.style.top = '100px'
      container.appendChild(element2)

      element.style.left = '0px'
      element2.style.left = '0px'

      await flipBatch(
        [element, element2],
        () => {
          element.style.left = '100px'
          element2.style.left = '200px'
        },
        { config: { stiffness: 1000, damping: 100 } }
      )

      expect(element.style.left).toBe('100px')
      expect(element2.style.left).toBe('200px')

      container.removeChild(element2)
    }, 5000)
  })
})
