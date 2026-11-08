import { expect, it } from 'vitest'
import { createMotionValue } from '../../../src/core/MotionValue'
import { bindStyle, bindAttribute, transformStyle, writeStyle } from '../../../src/dom'

it('binds independent styles and attributes with idempotent cleanup', () => {
  const element = document.createElement('div')
  const x = createMotionValue(10)
  const opacity = createMotionValue(0.2)
  const unbind = bindStyle(element, { x, opacity, width: 10, '--progress': 0.5 })
  const unbindAttribute = bindAttribute(element, 'data-progress', opacity)
  expect(element.style.transform).toContain('10px')
  expect(element.style.width).toBe('10px')
  opacity.jump(0.8)
  expect(element.style.opacity).toBe('0.8')
  expect(element.dataset.progress).toBe('0.8')
  unbind(); unbind(); unbindAttribute()
  opacity.jump(1)
  expect(element.style.opacity).toBe('0.8')
  x.destroy(); opacity.destroy()
})

it('preserves units, unitless CSS and independent transform axes', () => {
  const element = document.createElement('div')
  writeStyle(element, 'x', '50%')
  writeStyle(element, 'rotate', 45)
  writeStyle(element, 'zIndex', 2)
  writeStyle(element, 'lineHeight', 1.5)
  expect(element.style.transform).toContain('50%')
  expect(element.style.transform).toContain('45deg')
  expect(element.style.zIndex).toBe('2')
  expect(element.style.lineHeight).toBe('1.5')
  expect(transformStyle({ scale: 2, scaleZ: 3, skewX: 10 })).toContain('scaleZ(3)')
})

it('reads the initial value even when a compatible subscription only emits changes', () => {
  const element = document.createElement('div')
  const source = { get: () => 0.4, subscribe: () => () => {} }
  const detach = bindStyle(element, { opacity: source })
  const detachAttribute = bindAttribute(element, 'data-progress', source)
  expect(element.style.opacity).toBe('0.4')
  expect(element.dataset.progress).toBe('0.4')
  detach(); detachAttribute()
})
