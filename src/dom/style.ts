export type StyleValues = Record<string, number | string | undefined>
export interface ReadableValue<T = number | string> {
  get(): T
  subscribe(callback: (value: T) => void): () => void
}
export type StyleBindings = Record<string, number | string | ReadableValue<number | string>>

const unitless = new Set([
  'animationIterationCount', 'aspectRatio', 'borderImageOutset', 'borderImageSlice', 'borderImageWidth',
  'boxFlex', 'boxFlexGroup', 'boxOrdinalGroup', 'columnCount', 'columns', 'fillOpacity', 'flex',
  'flexGrow', 'flexPositive', 'flexShrink', 'flexNegative', 'flexOrder', 'floodOpacity', 'fontWeight',
  'gridArea', 'gridRow', 'gridRowEnd', 'gridRowSpan', 'gridRowStart', 'gridColumn', 'gridColumnEnd',
  'gridColumnSpan', 'gridColumnStart', 'lineClamp', 'lineHeight', 'opacity', 'order', 'orphans',
  'scale', 'stopOpacity', 'strokeDasharray', 'strokeDashoffset', 'strokeMiterlimit', 'strokeOpacity',
  'strokeWidth', 'tabSize', 'widows', 'zIndex', 'zoom', 'WebkitLineClamp',
])
const transforms = new WeakMap<Element, StyleValues>()
const transformKeys = new Set(['x', 'y', 'z', 'scale', 'scaleX', 'scaleY', 'scaleZ', 'rotate', 'rotateX', 'rotateY', 'rotateZ', 'skew', 'skewX', 'skewY', 'perspective'])
const cssName = (property: string) => property.startsWith('--') ? property : property.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`)
const unit = (value: number | string | undefined, suffix: string, fallback = 0) => typeof value === 'string' ? value : `${value ?? fallback}${suffix}`

/** Shared transform serialization. Numbers use px/degrees; strings keep their units. */
export function transformStyle(values: StyleValues): string {
  const parts: string[] = []
  if (values.perspective !== undefined) parts.push(`perspective(${unit(values.perspective, 'px')})`)
  if (values.x !== undefined || values.y !== undefined || values.z !== undefined) parts.push(`translate3d(${unit(values.x, 'px')}, ${unit(values.y, 'px')}, ${unit(values.z, 'px')})`)
  if (values.scale !== undefined) parts.push(`scale(${values.scale})`)
  else if (values.scaleX !== undefined || values.scaleY !== undefined) parts.push(`scale(${values.scaleX ?? 1}, ${values.scaleY ?? 1})`)
  if (values.scaleZ !== undefined) parts.push(`scaleZ(${values.scaleZ})`)
  for (const key of ['rotateX', 'rotateY', 'rotate', 'skew', 'skewX', 'skewY']) {
    const value = values[key] ?? (key === 'rotate' ? values.rotateZ : undefined)
    if (value !== undefined) parts.push(`${key}(${unit(value, 'deg')})`)
  }
  return parts.join(' ')
}

/** Write one CSS property or transform shorthand on an HTML or SVG element. */
export function writeStyle(element: Element, property: string, value: number | string): void {
  const style = (element as HTMLElement | SVGElement).style
  if (!style) return
  if (transformKeys.has(property)) {
    const values = transforms.get(element) ?? {}
    transforms.set(element, values)
    values[property] = value
    style.transform = transformStyle(values)
  } else {
    const suffix = typeof value === 'number' && value !== 0 && !property.startsWith('--') && !unitless.has(property) ? 'px' : ''
    style.setProperty(cssName(property), `${value}${suffix}`)
  }
}

/** Write a resolved CSS style object (including ordinary CSS transform strings). */
export function writeStyles(element: Element, values: StyleValues): void {
  for (const key in values) if (values[key] !== undefined) writeStyle(element, key, values[key]!)
}

/** Current shorthand value or authored/computed CSS value. */
export function readStyle(element: Element, property: string): number | string {
  if (transformKeys.has(property)) return transforms.get(element)?.[property] ?? (property.startsWith('scale') ? 1 : 0)
  const value = (element as HTMLElement | SVGElement).style?.getPropertyValue(cssName(property)) || getComputedStyle(element).getPropertyValue(cssName(property))
  return value || (property === 'opacity' ? 1 : 0)
}

const isReadable = (value: StyleBindings[string]): value is ReadableValue<number | string> => typeof value === 'object' && value !== null && typeof value.subscribe === 'function'

/** Bind live values without a framework render; cleanup detaches every subscription. */
export function bindStyle(element: Element, values: StyleBindings): () => void {
  const unsubscribers: (() => void)[] = []
  for (const [key, value] of Object.entries(values)) {
    if (isReadable(value)) {
      writeStyle(element, key, value.get())
      unsubscribers.push(value.subscribe(next => writeStyle(element, key, next)))
    }
    else writeStyle(element, key, value)
  }
  return () => { for (const unsubscribe of unsubscribers.splice(0)) unsubscribe() }
}

/** Bind a live value to an attribute, including SVG path data. */
export function bindAttribute(element: Element, name: string, value: ReadableValue<number | string>): () => void {
  element.setAttribute(name, String(value.get()))
  return value.subscribe(next => element.setAttribute(name, String(next)))
}
