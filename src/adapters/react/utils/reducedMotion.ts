import { useContext } from 'react'
import { MotionContext } from '../components/MotionConfig.js'
import { useReducedMotion } from '../hooks/useReducedMotion.js'

/**
 * Whether motion should be reduced for a component.
 *
 * Honors the nearest `<MotionConfig reducedMotion>` ('always' / 'never') and,
 * for 'user' (the default, also without any MotionConfig), the OS
 * `prefers-reduced-motion` setting.
 */
export function useShouldReduceMotion(): boolean {
  const motionConfig = useContext(MotionContext)
  const prefersReducedMotion = useReducedMotion()
  if (motionConfig.reducedMotion === 'always') return true
  if (motionConfig.reducedMotion === 'never') return false
  return motionConfig.isReducedMotion || prefersReducedMotion
}
