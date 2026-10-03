/**
 * Animatable values: numbers, colors, numbers with units and complex strings
 * (box shadows, filters, transform strings) decomposed into numeric channels.
 *
 * Every animatable value is split into a {@link ValueTemplate} (the literal
 * text and the kind of each token) and a flat list of numeric channels. The
 * channels of all values are driven by one spring group, so strings get the
 * same physics as plain numbers (velocity preservation, retargeting, reduced
 * motion...) without special cases. Rendering recomposes the string from the
 * template and the current channel values.
 *
 * - Colors (hex, rgb[a](), hsl[a](), `transparent`, CSS names) use four
 *   channels in premultiplied RGBA (`r*a, g*a, b*a, a`), so fading from
 *   `transparent` doesn't pass through a dark tint. Channels are clamped on
 *   output (springs overshoot): rgb 0-255, alpha 0-1.
 * - Numbers inside strings (`'50%'`, `'20rem'`, `'0 4px 12px rgba(...)'`)
 *   are one channel each; the surrounding text must match exactly.
 * - Two values can only be animated between when their templates match (same
 *   literal text, same token kinds in the same places). Otherwise the value
 *   jumps: `'auto'` → `'100px'`, `'50%'` → `'200px'`, a number → `'10px'`.
 *
 * @internal
 */
import { isColorString, parseColorRGBA, formatRGBA } from '@oxog/springkit'

export type AnimatableValue = number | string

type RGBAColor = ReturnType<typeof parseColorRGBA>

/** 'n' = one number channel, 'c' = four premultiplied RGBA channels */
type TokenKind = 'n' | 'c'

/** The non-numeric shape of a value */
export interface ValueTemplate {
  /** Two values with the same id can be interpolated channel by channel */
  readonly id: string
  /** A plain JS number (rendered as a number, e.g. `opacity: 0.5`) */
  readonly numeric: boolean
  /** Literal text around the tokens (`kinds.length + 1` entries) */
  readonly parts: readonly string[]
  readonly kinds: readonly TokenKind[]
  /** Number of channels */
  readonly size: number
}

/** A value decomposed into its template and channels */
export interface ParsedValue {
  /** The value as written (returned verbatim when the channels match it) */
  readonly raw: AnimatableValue
  readonly template: ValueTemplate
  readonly channels: readonly number[]
  /** Straight (non-premultiplied) color of each color token, for alpha ≈ 0 */
  readonly colors: readonly (RGBAColor | undefined)[]
}

const NUMERIC_TEMPLATE: ValueTemplate = {
  id: '\u0003number',
  numeric: true,
  parts: ['', ''],
  kinds: ['n'],
  size: 1,
}

/**
 * Colors, words (checked against the CSS color names) and numbers inside a
 * string. Same idea as `useTransform`'s string interpolation. `url(...)` is
 * matched first so `url(#fade)` isn't read as a hex color.
 */
const TOKEN_REGEX =
  /\burl\([^)]*\)|#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b|(?:rgba?|hsla?)\([^)]*\)|[a-z][a-z0-9-]*|[-+]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi

/** Below this alpha the color of a token is undefined (fully transparent) */
const ALPHA_EPSILON = 1e-6

function parseString(value: string): ParsedValue {
  const parts: string[] = []
  const kinds: TokenKind[] = []
  const channels: number[] = []
  const colors: (RGBAColor | undefined)[] = []
  let literal = ''
  let last = 0

  for (const match of value.matchAll(TOKEN_REGEX)) {
    const text = match[0]
    const index = match.index ?? 0
    const first = text.charCodeAt(0)
    const isNumber = (first >= 48 && first <= 57) || text[0] === '.' || text[0] === '-' || text[0] === '+'
    let color: RGBAColor | null = null
    if (!isNumber) {
      const isFunction = text.endsWith(')')
      // rgba(var(--x)) and friends: not a literal color
      const nested = isFunction && text.indexOf('(') !== text.lastIndexOf('(')
      // A word followed by '(' is a function name (e.g. `blur(`), not a color
      const isCall = !isFunction && value[index + text.length] === '('
      if (!nested && !isCall && isColorString(text)) color = parseColorRGBA(text)
      if (!color) continue // literal text
    }
    literal += value.slice(last, index)
    parts.push(literal)
    literal = ''
    last = index + text.length
    if (color) {
      kinds.push('c')
      const a = Math.max(0, Math.min(1, color.a))
      channels.push(color.r * a, color.g * a, color.b * a, a)
      colors.push(color)
    } else {
      kinds.push('n')
      channels.push(parseFloat(text))
      colors.push(undefined)
    }
  }
  literal += value.slice(last)
  parts.push(literal)

  return {
    raw: value,
    template: {
      id: `${kinds.join('')}\u0001${parts.join('\u0002')}`,
      numeric: false,
      parts,
      kinds,
      size: channels.length,
    },
    channels,
    colors,
  }
}

// Parsing runs on every render of an animating component: cache the strings
const cache = new Map<string, ParsedValue>()
const CACHE_LIMIT = 500

/** Decompose a value into its template and channels */
export function parseAnimatableValue(value: AnimatableValue): ParsedValue {
  if (typeof value === 'number') {
    return { raw: value, template: NUMERIC_TEMPLATE, channels: [value], colors: [] }
  }
  let parsed = cache.get(value)
  if (!parsed) {
    parsed = parseString(value)
    if (cache.size >= CACHE_LIMIT) cache.clear()
    cache.set(value, parsed)
  }
  return parsed
}

/** Round away float noise (and exponent notation, which CSS rejects) */
const formatNumber = (value: number): string => String(Math.round(value * 1e6) / 1e6 || 0)

/**
 * Recompose a value from channel values in the shape of `target`. Returns
 * `target.raw` verbatim when the channels are exactly the target's (an
 * animation that settled), or when a channel is missing.
 */
export function composeAnimatableValue(
  target: ParsedValue,
  channels: readonly (number | undefined)[]
): AnimatableValue {
  const { template } = target
  if (template.numeric) return channels[0] ?? target.raw

  let exact = true
  for (let i = 0; i < template.size; i++) {
    const value = channels[i]
    if (value === undefined) return target.raw
    if (value !== target.channels[i]) exact = false
  }
  if (exact) return target.raw

  let result = template.parts[0] ?? ''
  let c = 0
  for (let i = 0; i < template.kinds.length; i++) {
    if (template.kinds[i] === 'n') {
      result += formatNumber(channels[c]!)
      c += 1
    } else {
      const alpha = channels[c + 3]!
      if (alpha <= ALPHA_EPSILON) {
        // Fully transparent: keep the target's hue
        const color = target.colors[i] ?? { r: 0, g: 0, b: 0, a: 0 }
        result += formatRGBA({ r: color.r, g: color.g, b: color.b, a: 0 })
      } else {
        // Un-premultiply with the unclamped alpha (the channels overshoot
        // together), then clamp in formatRGBA
        result += formatRGBA({
          r: channels[c]! / alpha,
          g: channels[c + 1]! / alpha,
          b: channels[c + 2]! / alpha,
          a: alpha,
        })
      }
      c += 4
    }
    result += template.parts[i + 1] ?? ''
  }
  return result
}

/**
 * Hidden spring-group key of channel `index` of a value. The NUL prefix can't
 * collide with a CSS property name, and these keys are never rendered.
 */
export function hiddenChannelKey(key: string, index: number): string {
  return `\u0000${key}\u0000${index}`
}

/** Maps a value key (and its parsed value) to its spring-group channel keys */
export type ChannelKeysOf = (key: string, value: ParsedValue) => string[]

/**
 * Default layout: a plain number keeps its own key as its only channel, any
 * string uses hidden channel keys.
 */
export const defaultChannelKeysOf: ChannelKeysOf = (key, value) => {
  if (value.template.numeric) return [key]
  const keys: string[] = []
  for (let i = 0; i < value.template.size; i++) keys.push(hiddenChannelKey(key, i))
  return keys
}

/** Parse every value of a record */
export function parseAnimatableRecord(
  values: Record<string, AnimatableValue>
): Record<string, ParsedValue> {
  const result: Record<string, ParsedValue> = {}
  for (const key in values) result[key] = parseAnimatableValue(values[key]!)
  return result
}

/** Flat channel values of parsed values, keyed by spring-group key */
export function channelValuesOf(
  values: Record<string, ParsedValue>,
  keysOf: ChannelKeysOf
): Record<string, number> {
  const result: Record<string, number> = {}
  for (const key in values) {
    const value = values[key]!
    const keys = keysOf(key, value)
    for (let i = 0; i < keys.length; i++) result[keys[i]!] = value.channels[i]!
  }
  return result
}

/** Recompose every value from the spring-group channel values */
export function composeAnimatableRecord(
  values: Record<string, ParsedValue>,
  channels: Record<string, number>,
  keysOf: ChannelKeysOf
): Record<string, AnimatableValue> {
  const result: Record<string, AnimatableValue> = {}
  for (const key in values) {
    const value = values[key]!
    result[key] = composeAnimatableValue(
      value,
      keysOf(key, value).map((channelKey) => channels[channelKey])
    )
  }
  return result
}

/** Identity of a record of values (typed: `5` and `'5'` differ) */
export function animatableSignature(values: Record<string, AnimatableValue>): string {
  let signature = ''
  for (const key in values) {
    const value = values[key]!
    signature += `${key}\u0001${typeof value === 'number' ? 'n' : 's'}${String(value)}\u0002`
  }
  return signature
}

export interface TransitionPlan {
  /** Channels to set instantly (new keys, template changes, `instant`) */
  jump: Record<string, number>
  /** Channels to animate */
  set: Record<string, number>
  /**
   * A key appeared, disappeared or changed template: what the channels mean
   * changed, so the rendered values must be recomposed right away
   */
  structural: boolean
}

/**
 * Plan the transition from the values currently shown (`from`) to `to`.
 * Values with the same template animate; a key without a previous value, or
 * whose template changed, starts at its target (jumps).
 */
export function planTransition(
  from: Record<string, ParsedValue>,
  to: Record<string, ParsedValue>,
  keysOf: ChannelKeysOf,
  instant: boolean
): TransitionPlan {
  const plan: TransitionPlan = { jump: {}, set: {}, structural: false }
  for (const key in to) {
    const next = to[key]!
    const previous = from[key]
    const sameTemplate = previous !== undefined && previous.template.id === next.template.id
    if (!sameTemplate) plan.structural = true
    const destination = sameTemplate && !instant ? plan.set : plan.jump
    const keys = keysOf(key, next)
    for (let i = 0; i < keys.length; i++) destination[keys[i]!] = next.channels[i]!
  }
  for (const key in from) {
    if (!(key in to)) plan.structural = true
  }
  return plan
}

/** Whether a record has at least one key */
export function hasKeys(record: object): boolean {
  for (const _ in record) return true
  return false
}
