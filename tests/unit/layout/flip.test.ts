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
      expect(calls[0]![0]).toBe(0) // First call with 0
      expect(calls[calls.length - 1]![0]).toBeCloseTo(1, 1) // Last call close to 1
    }, 5000)

    it('should handle size changes', async () => {
      const first = { x: 0, y: 0, width: 100, height: 100 }
      const last = { x: 0, y: 0, width: 200, height: 200 }

      const anim = createFlip(element, first, last, {
        config: { stiffness: 1000, damping: 100 },
        size: true,
      })

      // The element's own transform-origin is left untouched
      expect(element.style.transformOrigin).toBe('')

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

    it('should handle zero-sized elements (division by zero guard)', () => {
      const first = { x: 0, y: 0, width: 100, height: 100 }
      const last = { x: 0, y: 0, width: 0, height: 0 } // Zero-sized element

      // Should not throw
      const anim = createFlip(element, first, last, { size: true })
      expect(anim).toBeDefined()
      anim.cancel()
    })

    it('should handle onUpdate callback errors gracefully', async () => {
      const first = { x: 0, y: 0, width: 100, height: 100 }
      const last = { x: 50, y: 0, width: 100, height: 100 }

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const anim = createFlip(element, first, last, {
        config: { stiffness: 1000, damping: 100 },
        onUpdate: () => {
          throw new Error('Test error')
        },
      })

      // Should not throw even with callback error
      await anim.play()

      consoleSpy.mockRestore()
    }, 5000)

    it('should handle onComplete callback errors gracefully', async () => {
      const first = { x: 0, y: 0, width: 100, height: 100 }
      const last = { x: 50, y: 0, width: 100, height: 100 }

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const anim = createFlip(element, first, last, {
        config: { stiffness: 1000, damping: 100 },
        onComplete: () => {
          throw new Error('Test error')
        },
      })

      // Should not throw even with callback error
      await anim.play()

      consoleSpy.mockRestore()
    }, 5000)

    it('should handle cancel during spring subscription callback (lines 175-179)', async () => {
      const first = { x: 0, y: 0, width: 100, height: 100 }
      const last = { x: 50, y: 0, width: 100, height: 100 }

      const anim = createFlip(element, first, last, {
        config: { stiffness: 100, damping: 10 }, // Slow animation
      })

      const playPromise = anim.play()

      // Wait a bit for animation to start
      await new Promise((r) => setTimeout(r, 50))

      // Cancel during animation - this triggers the cancelled check in subscribe callback
      anim.cancel()

      // Promise should resolve
      await playPromise

      expect(anim.isAnimating()).toBe(false)
    })

    it('should handle cancel during checkComplete (lines 190-195)', async () => {
      const first = { x: 0, y: 0, width: 100, height: 100 }
      const last = { x: 50, y: 0, width: 100, height: 100 }

      const anim = createFlip(element, first, last, {
        config: { stiffness: 1000, damping: 100 },
      })

      const playPromise = anim.play()

      // Cancel immediately to hit the checkComplete cancelled branch
      anim.cancel()

      // Promise should resolve
      await playPromise

      expect(anim.isAnimating()).toBe(false)
    })

    it('should handle size option with no size change (deltaWidth/deltaHeight = 1)', async () => {
      const first = { x: 0, y: 0, width: 100, height: 100 }
      const last = { x: 50, y: 50, width: 100, height: 100 } // Same size, different position

      const anim = createFlip(element, first, last, {
        config: { stiffness: 1000, damping: 100 },
        size: true,
        position: true,
      })

      // Should apply transform without scale since size hasn't changed
      expect(element.style.transform).toContain('translate')

      await anim.play()
    }, 5000)

    it('should handle both position and size false', async () => {
      const first = { x: 0, y: 0, width: 100, height: 100 }
      const last = { x: 50, y: 50, width: 200, height: 200 }

      const anim = createFlip(element, first, last, {
        config: { stiffness: 1000, damping: 100 },
        size: false,
        position: false,
      })

      // Should have empty transform (no position, no size)
      expect(element.style.transform).toBe('')

      await anim.play()
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

describe('FLIP regressions', () => {
  it('keeps the element\'s existing transform during the animation', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    el.style.transform = 'rotate(45deg)'

    const animation = createFlip(
      el,
      { x: 0, y: 0, width: 100, height: 100 },
      { x: 100, y: 0, width: 100, height: 100 }
    )

    expect(el.style.transform).toContain('translate(-100px, 0px)')
    expect(el.style.transform).toContain('rotate(45deg)')

    animation.cancel()
    expect(el.style.transform).toBe('rotate(45deg)')
    el.remove()
  })
})

describe('FLIP transform-origin and border radius', () => {
  let el: HTMLDivElement

  beforeEach(() => {
    el = document.createElement('div')
    document.body.appendChild(el)
  })

  afterEach(() => {
    el.remove()
  })

  /**
   * Map a point (relative to the element's layout box) through the
   * translate/scale functions of a CSS transform applied around `origin`,
   * returning page coordinates for a layout box at `box`.
   */
  const mapPoint = (
    transform: string,
    origin: { x: number; y: number },
    box: { x: number; y: number },
    px: number,
    py: number
  ) => {
    const fns = [...transform.matchAll(/(translate|scale)\(([-\d.e]+)(?:px)?, ([-\d.e]+)(?:px)?\)/g)]
    let x = px - origin.x
    let y = py - origin.y
    // CSS applies the rightmost function first
    for (const fn of fns.reverse()) {
      const a = parseFloat(fn[2]!)
      const b = parseFloat(fn[3]!)
      if (fn[1] === 'translate') {
        x += a
        y += b
      } else {
        x *= a
        y *= b
      }
    }
    return { x: box.x + origin.x + x, y: box.y + origin.y + y }
  }

  const expectInvertedToFirst = (
    first: { x: number; y: number; width: number; height: number },
    last: { x: number; y: number; width: number; height: number },
    origin: { x: number; y: number }
  ) => {
    const topLeft = mapPoint(el.style.transform, origin, last, 0, 0)
    const bottomRight = mapPoint(el.style.transform, origin, last, last.width, last.height)
    expect(topLeft.x).toBeCloseTo(first.x)
    expect(topLeft.y).toBeCloseTo(first.y)
    expect(bottomRight.x).toBeCloseTo(first.x + first.width)
    expect(bottomRight.y).toBeCloseTo(first.y + first.height)
  }

  it('does not change transform-origin, so existing rotate/scale render unchanged', () => {
    el.style.transform = 'rotate(30deg)'
    const animation = createFlip(
      el,
      { x: 0, y: 0, width: 200, height: 100 },
      { x: 0, y: 0, width: 100, height: 100 }
    )

    expect(el.style.transformOrigin).toBe('')
    expect(el.style.transform).toContain('rotate(30deg)')
    animation.cancel()
    expect(el.style.transform).toBe('rotate(30deg)')
    expect(el.style.transformOrigin).toBe('')
  })

  it('places the element exactly on the first box with the default center origin', () => {
    const first = { x: 10, y: 20, width: 200, height: 50 }
    const last = { x: 110, y: 120, width: 100, height: 100 }
    const animation = createFlip(el, first, last)

    // The position translate stays the plain layout delta
    expect(el.style.transform.startsWith('translate(-100px, -100px)')).toBe(true)
    expectInvertedToFirst(first, last, { x: 50, y: 50 })
    animation.cancel()
  })

  it('places the element exactly on the first box with an explicit transform-origin', () => {
    el.style.transformOrigin = 'right bottom'
    const first = { x: 0, y: 0, width: 200, height: 300 }
    const last = { x: 40, y: 10, width: 100, height: 100 }
    const animation = createFlip(el, first, last)

    expectInvertedToFirst(first, last, { x: 100, y: 100 })
    expect(el.style.transformOrigin).toBe('right bottom')
    animation.cancel()
    expect(el.style.transformOrigin).toBe('right bottom')
  })

  it('places the element on the first box when only the size is animated', () => {
    el.style.transformOrigin = '25% 10px'
    const first = { x: 0, y: 0, width: 50, height: 400 }
    const last = { x: 0, y: 0, width: 100, height: 100 }
    const animation = createFlip(el, first, last, { position: false })

    expectInvertedToFirst(first, last, { x: 25, y: 10 })
    animation.cancel()
  })

  it('keeps the previous output when the origin is the top-left corner', () => {
    el.style.transformOrigin = '0 0'
    const animation = createFlip(
      el,
      { x: 0, y: 0, width: 200, height: 100 },
      { x: 50, y: 0, width: 100, height: 100 }
    )
    expect(el.style.transform).toBe('translate(-50px, 0px) scale(2, 1)')
    animation.cancel()
  })

  it('does not touch border radius unless correctBorderRadius is set', () => {
    el.style.borderRadius = '10px'
    const animation = createFlip(
      el,
      { x: 0, y: 0, width: 200, height: 100 },
      { x: 0, y: 0, width: 100, height: 100 }
    )
    expect(el.style.borderRadius).toBe('10px')
    animation.cancel()
  })

  it('counter-scales border radius per axis with correctBorderRadius and restores it', () => {
    el.style.borderRadius = '10px'
    const animation = createFlip(
      el,
      { x: 0, y: 0, width: 200, height: 100 },
      { x: 0, y: 0, width: 100, height: 100 },
      { correctBorderRadius: true }
    )
    // scale(2, 1): horizontal radius halves so corners stay circular on screen
    expect(el.style.borderRadius).toBe('5px / 10px')
    animation.cancel()
    expect(el.style.borderRadius).toBe('10px')
  })
})
