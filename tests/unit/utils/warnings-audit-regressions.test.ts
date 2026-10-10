import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { validateAnimationValue, clearWarnings } from '../../../src/utils/warnings.js'

describe('warnings audit regressions', () => {
  let errSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    clearWarnings()
    errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    errSpy.mockRestore()
    clearWarnings()
  })

  describe('F2903: validateAnimationValue never throws', () => {
    it('returns 0 for Symbols, null-prototype objects and objects whose toString throws', () => {
      expect(validateAnimationValue(Symbol('x') as never, 'ctx')).toBe(0)
      expect(validateAnimationValue(Object.create(null) as never, 'ctx')).toBe(0)
      expect(
        validateAnimationValue(
          {
            toString() {
              throw new Error('boom')
            },
          } as never,
          'ctx'
        )
      ).toBe(0)
      expect(errSpy).toHaveBeenCalled()
    })

    it('survives a fully hostile Proxy', () => {
      const hostile = new Proxy(
        {},
        {
          get() {
            throw new Error('get')
          },
          getPrototypeOf() {
            throw new Error('proto')
          },
        }
      )
      expect(validateAnimationValue(hostile as never, 'ctx')).toBe(0)
      expect(String(errSpy.mock.calls[0]?.[0])).toContain('[unprintable value]')
    })

    it('keeps the message format for ordinary invalid values and still deduplicates', () => {
      expect(validateAnimationValue(null as never, 'c')).toBe(0)
      expect(validateAnimationValue(null as never, 'c')).toBe(0)
      expect(validateAnimationValue(Symbol('desc') as never, 'c')).toBe(0)
      expect(validateAnimationValue(NaN, 'c')).toBe(0)
      expect(errSpy.mock.calls.map((call: unknown[]) => call[0])).toEqual([
        '[SpringKit] Invalid animation value in c: expected number, got null',
        '[SpringKit] Invalid animation value in c: expected number, got Symbol(desc)',
        '[SpringKit] Invalid animation value in c: expected number, got NaN',
      ])
      expect(validateAnimationValue(3, 'c')).toBe(3)
    })
  })
})
