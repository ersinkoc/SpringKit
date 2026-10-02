import { useRef } from 'react'
import type { SpringConfig } from '@oxog/springkit'

const PHYSICS_KEYS = [
  'stiffness',
  'damping',
  'mass',
  'velocity',
  'restSpeed',
  'restDelta',
  'clamp',
] as const

function samePhysics(a: SpringConfig, b: SpringConfig): boolean {
  return PHYSICS_KEYS.every((key) => a[key] === b[key])
}

/**
 * Returns a referentially stable spring config that only changes when one of its
 * physics values changes.
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
  if (!samePhysics(ref.current, next)) {
    ref.current = next
  }
  return ref.current
}
