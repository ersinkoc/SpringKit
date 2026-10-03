import { describe, it, expect, vi, afterEach } from 'vitest'
import { parseColorRGBA, isColorString } from '../../../src/utils/color'
import { interpolateColor } from '../../../src/interpolation/color'
import { clearWarnings } from '../../../src/utils/warnings'

afterEach(() => {
  vi.restoreAllMocks()
  clearWarnings()
})

describe('CSS named colors', () => {
  it('parses named colors case-insensitively', () => {
    expect(parseColorRGBA('red')).toEqual({ r: 255, g: 0, b: 0, a: 1 })
    expect(parseColorRGBA(' RebeccaPurple ')).toEqual({ r: 102, g: 51, b: 153, a: 1 })
    expect(parseColorRGBA('cornflowerblue')).toEqual({ r: 100, g: 149, b: 237, a: 1 })
  })

  it('still resolves transparent and hex', () => {
    expect(parseColorRGBA('transparent').a).toBe(0)
    expect(parseColorRGBA('#00ff00')).toEqual({ r: 0, g: 255, b: 0, a: 1 })
  })

  it('warns once for unrecognized colors instead of failing silently', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(parseColorRGBA('not-a-color')).toEqual({ r: 0, g: 0, b: 0, a: 1 })
    parseColorRGBA('not-a-color')
    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0]![0])).toContain('not-a-color')
  })

  it('isColorString recognizes every supported format and rejects others', () => {
    for (const c of ['#fff', '#ffff', '#a0b1c2', '#a0b1c2ff', 'rgb(1 2 3)', 'rgba(1,2,3,.5)', 'hsl(10 50% 50%)', 'transparent', 'red', 'Navy']) {
      expect(isColorString(c)).toBe(true)
    }
    for (const v of ['10px', 'auto', 'redish', '#12', '', 42, null]) {
      expect(isColorString(v)).toBe(false)
    }
  })

  it('interpolates between named colors', () => {
    let t = 0.5
    const mid = interpolateColor(() => t, [0, 1], ['red', 'blue'])
    expect(mid.get()).toMatch(/^(#|rgb)/)
    t = 1
    expect(['#0000ff', 'rgb(0, 0, 255)']).toContain(mid.get().toLowerCase())
  })
})
