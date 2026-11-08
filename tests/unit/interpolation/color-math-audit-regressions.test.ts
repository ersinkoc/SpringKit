import { describe, it, expect, vi, afterEach } from 'vitest'
import { parseColorRGBA, isColorString } from '../../../src/utils/color'
import { namedColorToRgb } from '../../../src/utils/named-colors'
import { interpolate } from '../../../src/interpolation/interpolate'
import { interpolateColor } from '../../../src/interpolation/color'
import { clearWarnings } from '../../../src/utils/warnings'

afterEach(() => {
  vi.restoreAllMocks()
  clearWarnings()
})

// Evidence: .temp_files/ledger_src-color-interpolation-math.md (F1601-F1603)
describe('F1601 - inherited object keys are not CSS color names', () => {
  it('rejects "constructor" / "__proto__" in any case', () => {
    for (const k of ['constructor', '__proto__', 'Constructor', 'CONSTRUCTOR']) {
      expect(namedColorToRgb(k)).toBeNull()
      expect(isColorString(k)).toBe(false)
    }
  })

  it('falls through to the unknown-color warning and black', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(parseColorRGBA('constructor')).toEqual({ r: 0, g: 0, b: 0, a: 1 })
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('still resolves real names including aliases and black', () => {
    expect(namedColorToRgb('Red')).toEqual({ r: 255, g: 0, b: 0 })
    expect(namedColorToRgb('darkgrey')).toEqual({ r: 169, g: 169, b: 169 })
    expect(namedColorToRgb('black')).toEqual({ r: 0, g: 0, b: 0 })
  })
})

describe('F1602 - rgb() channels are clamped to 0-255 at parse time', () => {
  it('clamps numeric and percentage channels', () => {
    expect(parseColorRGBA('rgb(300, -20, 0)')).toEqual({ r: 255, g: 0, b: 0, a: 1 })
    expect(parseColorRGBA('rgb(150%, -10%, 50%)')).toEqual({ r: 255, g: 0, b: 128, a: 1 })
    expect(parseColorRGBA('rgba(999 -1 256 / 0.5)')).toEqual({ r: 255, g: 0, b: 255, a: 0.5 })
  })

  it('leaves in-range channels untouched', () => {
    expect(parseColorRGBA('rgb(0, 255, 255)')).toEqual({ r: 0, g: 255, b: 255, a: 1 })
    expect(parseColorRGBA('rgb(127.5, 0.4, 254.6)')).toEqual({ r: 128, g: 0, b: 255, a: 1 })
  })

  it('interpolates from the clamped color', () => {
    const c = interpolateColor(() => 0.5, [0, 1], ['rgb(300, 0, 0)', 'rgb(0, 0, 0)'])
    expect(c.get()).toBe('rgb(128, 0, 0)')
  })
})

describe('F1603 - infinite input segments never produce NaN', () => {
  it('interpolate() treats an infinite segment as degenerate', () => {
    expect(interpolate(() => 5, [-Infinity, Infinity], [0, 1]).get()).toBe(0)
    expect(interpolate(() => -5, [-Infinity, 0], [0, 1]).get()).toBe(0)
  })

  it('interpolateColor() never emits NaN', () => {
    expect(interpolateColor(() => 5, [-Infinity, Infinity], ['red', 'blue']).get()).toBe('rgb(255, 0, 0)')
    expect(interpolateColor(() => -5, [-Infinity, 0], ['red', 'blue']).get()).toBe('rgb(255, 0, 0)')
  })

  it('finite and half-infinite ranges are unchanged', () => {
    expect(interpolate(() => 5, [0, 10], [0, 1]).get()).toBe(0.5)
    expect(interpolate(() => 5, [0, Infinity], [0, 1]).get()).toBe(0)
    expect(interpolateColor(() => 5, [0, 10], ['#000000', '#ffffff']).get()).toBe('rgb(128, 128, 128)')
  })
})
