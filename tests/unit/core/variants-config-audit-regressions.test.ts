/**
 * Regression tests from the evidence audit of src/core/variants.ts and
 * src/core/config.ts (findings F1401-F1403).
 */
import { describe, it, expect } from 'vitest'
import { getVariant, mergeVariants, calculateStaggerDelays } from '@oxog/springkit'

const EMPTY = { values: {}, transition: {} }

describe('variants audit regressions', () => {
  describe('F1401: getVariant with names that are Object.prototype members', () => {
    const variants = { visible: { opacity: 1 } }

    it('treats a missing prototype-named variant as missing (no resolver call, no throw)', () => {
      for (const name of [
        'constructor',
        'toString',
        'hasOwnProperty',
        'valueOf',
        '__proto__',
        'isPrototypeOf',
        'propertyIsEnumerable',
        'toLocaleString',
      ]) {
        expect(getVariant(variants, name, { x: 5 })).toEqual(EMPTY)
      }
    })

    it('still resolves variants that are own properties with those names', () => {
      expect(getVariant({ constructor: { opacity: 0.5 } }, 'constructor').values).toEqual({
        opacity: 0.5,
      })
      expect(
        getVariant({ toString: (c?: unknown) => ({ x: c as number }) }, 'toString', 9).values
      ).toEqual({ x: 9 })
      const parsed = JSON.parse('{"__proto__": {"opacity": 0.25}}')
      expect(getVariant(parsed, '__proto__').values).toEqual({ opacity: 0.25 })
    })

    it('still resolves variants inherited from a non-Object.prototype parent', () => {
      const child = Object.create({ base: { y: 4 } }) as Record<string, { y: number }>
      expect(getVariant(child, 'base').values).toEqual({ y: 4 })
    })
  })

  describe('F1402: mergeVariants with an explicit `transition: undefined`', () => {
    it('keeps the transition accumulated from earlier variants', () => {
      expect(
        mergeVariants({ transition: { delay: 5 } }, { opacity: 1, transition: undefined }).transition
      ).toEqual({ delay: 5 })
      expect(
        mergeVariants(
          { transition: { delay: 5 } },
          { transition: undefined },
          { transition: { duration: 7 } }
        ).transition
      ).toEqual({ delay: 5, duration: 7 })
    })

    it('does not invent a transition and does not alias the source transition', () => {
      expect(mergeVariants({ opacity: 1 }, { transition: undefined }).transition).toBeUndefined()
      const source = { delay: 5 }
      const out = mergeVariants({ transition: source }, { transition: undefined })
      out.transition!.delay = 99
      expect(source.delay).toBe(5)
    })
  })

  describe('F1403: calculateStaggerDelays with non-finite inputs', () => {
    it('ignores NaN / Infinity staggerChildren and delayChildren', () => {
      expect(calculateStaggerDelays(3, { staggerChildren: NaN, delayChildren: 10 })).toEqual([10, 10, 10])
      expect(calculateStaggerDelays(3, { staggerChildren: Infinity })).toEqual([0, 0, 0])
      expect(calculateStaggerDelays(3, { staggerChildren: 100, delayChildren: NaN })).toEqual([0, 100, 200])
      expect(
        calculateStaggerDelays(3, { staggerChildren: NaN, staggerDirection: -1, delayChildren: 5 })
      ).toEqual([5, 5, 5])
    })

    it('leaves finite inputs unchanged', () => {
      expect(calculateStaggerDelays(3, { staggerChildren: 100, delayChildren: 10 })).toEqual([10, 110, 210])
      expect(calculateStaggerDelays(3, { staggerChildren: 100, staggerDirection: -1 })).toEqual([200, 100, 0])
      expect(calculateStaggerDelays(0, { staggerChildren: NaN })).toEqual([])
    })
  })
})
