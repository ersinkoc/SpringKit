import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  resolveVariant,
  getVariant,
  mergeVariants,
  isTransformProperty,
  isAnimatable,
  parseValueWithUnit,
  buildTransformString,
  applyValuesToElement,
  calculateStaggerDelays,
  createOrchestration,
  variantPresets,
  createVariantPreset,
  isVariants,
  isVariant,
} from '@oxog/springkit'

describe('Variants System', () => {
  describe('resolveVariant', () => {
    it('should resolve static variant', () => {
      const variant = { x: 100, opacity: 1 }
      const resolved = resolveVariant(variant)

      expect(resolved.values).toEqual({ x: 100, opacity: 1 })
      expect(resolved.transition).toEqual({})
    })

    it('should resolve function variant', () => {
      const variant = (custom: number) => ({ x: custom, opacity: 1 })
      const resolved = resolveVariant(variant, 200)

      expect(resolved.values).toEqual({ x: 200, opacity: 1 })
    })

    it('should extract transition from variant', () => {
      const variant = {
        x: 100,
        transition: { delay: 100, staggerChildren: 0.1 },
      }
      const resolved = resolveVariant(variant)

      expect(resolved.values).toEqual({ x: 100 })
      expect(resolved.transition).toEqual({ delay: 100, staggerChildren: 0.1 })
    })

    it('should return empty values for undefined variant', () => {
      const resolved = resolveVariant(undefined)

      expect(resolved.values).toEqual({})
      expect(resolved.transition).toEqual({})
    })
  })

  describe('getVariant', () => {
    it('should get variant by name', () => {
      const variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
      }

      const resolved = getVariant(variants, 'visible')
      expect(resolved.values).toEqual({ opacity: 1 })
    })

    it('should handle function variants with custom', () => {
      const variants = {
        custom: (i: number) => ({ x: i * 10 }),
      }

      const resolved = getVariant(variants, 'custom', 5)
      expect(resolved.values).toEqual({ x: 50 })
    })

    it('should return empty for missing variant', () => {
      const variants = { visible: { opacity: 1 } }

      const resolved = getVariant(variants, 'missing')
      expect(resolved.values).toEqual({})
    })

    it('should return empty for undefined variants', () => {
      const resolved = getVariant(undefined, 'visible')
      expect(resolved.values).toEqual({})
    })
  })

  describe('mergeVariants', () => {
    it('should merge multiple variants', () => {
      const variant1 = { x: 100, opacity: 0.5 }
      const variant2 = { y: 50, opacity: 1 }

      const merged = mergeVariants(variant1, variant2)

      expect(merged).toEqual({ x: 100, y: 50, opacity: 1 })
    })

    it('should merge transitions', () => {
      const variant1 = { x: 100, transition: { delay: 100 } }
      const variant2 = { y: 50, transition: { staggerChildren: 0.1 } }

      const merged = mergeVariants(variant1, variant2)

      expect(merged.transition).toHaveProperty('staggerChildren', 0.1)
    })

    it('should handle undefined variants', () => {
      const variant = { x: 100 }

      const merged = mergeVariants(undefined, variant, undefined)

      expect(merged).toEqual({ x: 100 })
    })
  })

  describe('isTransformProperty', () => {
    it('should identify transform properties', () => {
      expect(isTransformProperty('x')).toBe(true)
      expect(isTransformProperty('y')).toBe(true)
      expect(isTransformProperty('scale')).toBe(true)
      expect(isTransformProperty('rotate')).toBe(true)
      expect(isTransformProperty('skewX')).toBe(true)
    })

    it('should reject non-transform properties', () => {
      expect(isTransformProperty('opacity')).toBe(false)
      expect(isTransformProperty('width')).toBe(false)
      expect(isTransformProperty('backgroundColor')).toBe(false)
    })
  })

  describe('isAnimatable', () => {
    it('should identify animatable values', () => {
      expect(isAnimatable(100)).toBe(true)
      expect(isAnimatable('100px')).toBe(true)
      expect(isAnimatable('#ff0000')).toBe(true)
    })

    it('should reject non-animatable values', () => {
      expect(isAnimatable(null)).toBe(false)
      expect(isAnimatable(undefined)).toBe(false)
      expect(isAnimatable({})).toBe(false)
      expect(isAnimatable([])).toBe(false)
    })
  })

  describe('parseValueWithUnit', () => {
    it('should parse number values', () => {
      expect(parseValueWithUnit(100)).toEqual({ value: 100, unit: '' })
    })

    it('should parse px values', () => {
      expect(parseValueWithUnit('100px')).toEqual({ value: 100, unit: 'px' })
    })

    it('should parse percentage values', () => {
      expect(parseValueWithUnit('50%')).toEqual({ value: 50, unit: '%' })
    })

    it('should parse negative values', () => {
      expect(parseValueWithUnit('-100px')).toEqual({ value: -100, unit: 'px' })
    })

    it('should parse decimal values', () => {
      expect(parseValueWithUnit('1.5em')).toEqual({ value: 1.5, unit: 'em' })
    })

    it('should handle invalid values', () => {
      expect(parseValueWithUnit('invalid')).toEqual({ value: 0, unit: '' })
    })
  })

  describe('buildTransformString', () => {
    it('should build translate transform', () => {
      const result = buildTransformString({ x: 100, y: 50 })
      expect(result).toBe('translate(100px, 50px)')
    })

    it('should build scale transform', () => {
      const result = buildTransformString({ scale: 1.5 })
      expect(result).toBe('scale(1.5)')
    })

    it('should build individual scale transforms', () => {
      const result = buildTransformString({ scaleX: 2, scaleY: 0.5 })
      expect(result).toContain('scaleX(2)')
      expect(result).toContain('scaleY(0.5)')
    })

    it('should build rotate transform', () => {
      const result = buildTransformString({ rotate: 45 })
      expect(result).toBe('rotate(45deg)')
    })

    it('should build skew transform', () => {
      const result = buildTransformString({ skewX: 10, skewY: 5 })
      expect(result).toContain('skewX(10deg)')
      expect(result).toContain('skewY(5deg)')
    })

    it('should combine multiple transforms', () => {
      const result = buildTransformString({ x: 100, scale: 2, rotate: 45 })
      expect(result).toContain('translate(100px, 0px)')
      expect(result).toContain('scale(2)')
      expect(result).toContain('rotate(45deg)')
    })
  })

  describe('applyValuesToElement', () => {
    let element: HTMLElement

    beforeEach(() => {
      element = document.createElement('div')
    })

    it('should apply transform values', () => {
      applyValuesToElement(element, { x: 100, y: 50 })
      expect(element.style.transform).toContain('translate')
    })

    it('should apply opacity', () => {
      applyValuesToElement(element, { opacity: 0.5 })
      expect(element.style.opacity).toBe('0.5')
    })

    it('should apply backgroundColor', () => {
      applyValuesToElement(element, { backgroundColor: '#ff0000' })
      // Browser may normalize to rgb format
      expect(element.style.backgroundColor).toMatch(/#ff0000|rgb\(255,\s*0,\s*0\)/)
    })

    it('should apply borderRadius', () => {
      applyValuesToElement(element, { borderRadius: 10 })
      expect(element.style.borderRadius).toBe('10px')
    })

    it('should apply width and height', () => {
      applyValuesToElement(element, { width: 200, height: 100 })
      expect(element.style.width).toBe('200px')
      expect(element.style.height).toBe('100px')
    })
  })

  describe('calculateStaggerDelays', () => {
    it('should calculate stagger delays', () => {
      const delays = calculateStaggerDelays(5, { staggerChildren: 100 })

      expect(delays).toEqual([0, 100, 200, 300, 400])
    })

    it('should apply delay to children', () => {
      const delays = calculateStaggerDelays(3, {
        staggerChildren: 100,
        delayChildren: 500,
      })

      expect(delays).toEqual([500, 600, 700])
    })

    it('should support reverse direction', () => {
      const delays = calculateStaggerDelays(3, {
        staggerChildren: 100,
        staggerDirection: -1,
      })

      expect(delays).toEqual([200, 100, 0])
    })
  })

  describe('createOrchestration', () => {
    it('should execute parent and children', async () => {
      const parentFn = vi.fn().mockResolvedValue(undefined)
      const childFn1 = vi.fn().mockResolvedValue(undefined)
      const childFn2 = vi.fn().mockResolvedValue(undefined)

      const orchestration = createOrchestration(parentFn, [childFn1, childFn2])

      await orchestration.execute()

      expect(parentFn).toHaveBeenCalled()
      expect(childFn1).toHaveBeenCalled()
      expect(childFn2).toHaveBeenCalled()
    })

    it('should execute beforeChildren', async () => {
      const order: string[] = []
      const parentFn = vi.fn().mockImplementation(async () => { order.push('parent') })
      const childFn = vi.fn().mockImplementation(async () => { order.push('child') })

      const orchestration = createOrchestration(parentFn, [childFn], {
        when: 'beforeChildren',
      })

      await orchestration.execute()

      expect(order).toEqual(['parent', 'child'])
    })

    it('should execute afterChildren', async () => {
      const order: string[] = []
      const parentFn = vi.fn().mockImplementation(async () => { order.push('parent') })
      const childFn = vi.fn().mockImplementation(async () => { order.push('child') })

      const orchestration = createOrchestration(parentFn, [childFn], {
        when: 'afterChildren',
      })

      await orchestration.execute()

      expect(order).toEqual(['child', 'parent'])
    })

    it('should apply delay', async () => {
      vi.useFakeTimers()

      const parentFn = vi.fn().mockResolvedValue(undefined)

      const orchestration = createOrchestration(parentFn, [], { delay: 100 })
      const promise = orchestration.parent()

      expect(parentFn).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(100)
      await promise

      expect(parentFn).toHaveBeenCalled()

      vi.useRealTimers()
    })
  })

  describe('variantPresets', () => {
    it('should have fadeIn preset', () => {
      expect(variantPresets.fadeIn).toBeDefined()
      expect(variantPresets.fadeIn.initial).toEqual({ opacity: 0 })
      expect(variantPresets.fadeIn.animate).toEqual({ opacity: 1 })
    })

    it('should have fadeInUp preset', () => {
      expect(variantPresets.fadeInUp).toBeDefined()
      expect(variantPresets.fadeInUp.initial).toHaveProperty('y')
    })

    it('should have scaleIn preset', () => {
      expect(variantPresets.scaleIn).toBeDefined()
      expect(variantPresets.scaleIn.initial).toHaveProperty('scale')
    })

    it('should have popIn preset', () => {
      expect(variantPresets.popIn).toBeDefined()
      expect(variantPresets.popIn.animate.transition).toBeDefined()
    })

    it('should have staggerContainer preset', () => {
      expect(variantPresets.staggerContainer).toBeDefined()
      expect(variantPresets.staggerContainer.animate.transition).toHaveProperty('staggerChildren')
    })

    it('should have all slide presets', () => {
      expect(variantPresets.slideUp).toBeDefined()
      expect(variantPresets.slideDown).toBeDefined()
      expect(variantPresets.slideLeft).toBeDefined()
      expect(variantPresets.slideRight).toBeDefined()
    })
  })

  describe('createVariantPreset', () => {
    it('should create custom preset', () => {
      const preset = createVariantPreset(
        { opacity: 0 },
        { opacity: 1 }
      )

      expect(preset.initial).toEqual({ opacity: 0 })
      expect(preset.animate).toEqual({ opacity: 1 })
      expect(preset.exit).toEqual({ opacity: 0 })
    })

    it('should use custom exit', () => {
      const preset = createVariantPreset(
        { opacity: 0 },
        { opacity: 1 },
        { opacity: 0.5 }
      )

      expect(preset.exit).toEqual({ opacity: 0.5 })
    })
  })

  describe('isVariants', () => {
    it('should identify variants object', () => {
      expect(isVariants({ hidden: { opacity: 0 }, visible: { opacity: 1 } })).toBe(true)
    })

    it('should identify function variants', () => {
      expect(isVariants({ custom: () => ({ opacity: 1 }) })).toBe(true)
    })

    it('should reject non-variants', () => {
      expect(isVariants(null)).toBe(false)
      expect(isVariants([])).toBe(false)
      expect(isVariants('string')).toBe(false)
    })
  })

  describe('isVariant', () => {
    it('should identify variant object', () => {
      expect(isVariant({ opacity: 1, x: 100 })).toBe(true)
    })

    it('should reject non-variant values', () => {
      expect(isVariant(null)).toBe(false)
      expect(isVariant([])).toBe(false)
      expect(isVariant('string')).toBe(false)
    })
  })
})
