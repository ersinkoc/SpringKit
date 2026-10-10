import { useRef } from 'react'
import type { SpringConfig } from '@oxog/springkit'

function sameConfig(a: SpringConfig, b: SpringConfig): boolean {
  // Compare every value field (physics, and extras such as a trail's
  // `followDelay`). Callbacks are skipped on purpose: an inline arrow is new on
  // every render and must not count as a change.
  const x = a as Record<string, unknown>
  const y = b as Record<string, unknown>
  for (const key of new Set([...Object.keys(x), ...Object.keys(y)])) {
    if (typeof x[key] === 'function' || typeof y[key] === 'function') continue
    const p = x[key]
    const q = y[key]
    if (p !== q && !(p !== p && q !== q)) return false // === (so 0 equals -0), NaN equals NaN
  }
  return true
}

/**
 * Returns a referentially stable spring config that only changes when one of its
 * (non-function) values changes.
 *
 * Components commonly receive `config` as an inline object literal (or use a
 * default object literal), which is a new object on every render. Using such an
 * object directly as an effect dependency re-creates springs on every render,
 * resetting them mid-animation.
 *
 * @param config - Config passed by the user (may be undefined)
 * @param fallback - Default config used when `config` is undefined
 */
export function useStableSpringConfig(
  config: SpringConfig | undefined,
  fallback: SpringConfig
): SpringConfig {
  const next = config ?? fallback
  const ref = useRef(next)
  if (!sameConfig(ref.current, next)) {
    ref.current = next
  }
  return ref.current
}
