import { useCallback, useEffect, useRef, useState } from 'react'
import { createSpringGroup } from '@oxog/springkit'
import type { SpringGroup } from '@oxog/springkit'
import { useDestroyOnUnmount } from '../hooks/useDestroyOnUnmount.js'
import {
  animatableSignature,
  channelValuesOf,
  composeAnimatableRecord,
  defaultChannelKeysOf,
  hasKeys,
  parseAnimatableRecord,
  planTransition,
  type AnimatableValue,
  type ParsedValue,
} from './animatable.js'

/** Spring physics used by {@link useAnimatableValues} */
export interface AnimatablePhysics {
  stiffness: number
  damping: number
  mass: number
}

interface State {
  values: Record<string, ParsedValue>
  channels: Record<string, number>
}

function sameChannels(a: Record<string, number>, b: Record<string, number>): boolean {
  const keys = Object.keys(a)
  if (keys.length !== Object.keys(b).length) return false
  return keys.every((key) => a[key] === b[key])
}

/**
 * Spring-animate a record of numbers and animatable strings (colors, numbers
 * with units, complex strings; see `animatable.ts`).
 *
 * The first render returns `target` as is. When it changes, values whose
 * shape matches animate from where they are (keeping their velocity); new
 * keys and values whose shape changed ('50%' → '20px') jump.
 *
 * @internal
 */
export function useAnimatableValues(
  target: Record<string, AnimatableValue>,
  physics: AnimatablePhysics
): Record<string, AnimatableValue> {
  const [state, setState] = useState<State>(() => {
    const values = parseAnimatableRecord(target)
    return { values, channels: channelValuesOf(values, defaultChannelKeysOf) }
  })
  const shownRef = useRef(state)
  const appliedRef = useRef(state.values)
  const signatureRef = useRef<string | null>(null)
  if (signatureRef.current === null) signatureRef.current = animatableSignature(target)
  const springRef = useRef<SpringGroup<Record<string, number>> | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const latestRef = useRef(state.channels)
  const mountedRef = useRef(false)
  const physicsRef = useRef(physics)
  physicsRef.current = physics

  const show = useCallback((values: Record<string, ParsedValue>, channels: Record<string, number>) => {
    const shown = shownRef.current
    if (shown.values === values && sameChannels(shown.channels, channels)) return
    const next = { values, channels }
    shownRef.current = next
    if (mountedRef.current) setState(next)
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // The group lives in a ref: destroy it only on a real unmount (StrictMode
  // re-runs effects without re-rendering)
  useDestroyOnUnmount(() => {
    unsubscribeRef.current?.()
    unsubscribeRef.current = null
    springRef.current?.destroy()
    springRef.current = null
  })

  /** A spring group holding (at least) `keys`, continuing from the current values */
  const ensureGroup = useCallback(
    (keys: string[], startAt: Record<string, number>): SpringGroup<Record<string, number>> => {
      const current = springRef.current
      if (current && !current.isDestroyed() && keys.every((key) => key in latestRef.current)) {
        return current
      }
      const start: Record<string, number> = {}
      for (const key of keys) start[key] = latestRef.current[key] ?? startAt[key] ?? 0
      unsubscribeRef.current?.()
      current?.destroy()
      const group = createSpringGroup(start)
      springRef.current = group
      latestRef.current = start
      unsubscribeRef.current = group.subscribe((channels) => {
        latestRef.current = channels
        show(appliedRef.current, channels)
      })
      return group
    },
    [show]
  )

  useEffect(() => {
    const signature = animatableSignature(target)
    if (signature === signatureRef.current) return
    signatureRef.current = signature

    const next = parseAnimatableRecord(target)
    const plan = planTransition(appliedRef.current, next, defaultChannelKeysOf, false)
    const nextChannels = channelValuesOf(next, defaultChannelKeysOf)
    const keys = Object.keys(nextChannels)
    // Channels that keep animating start where they are; new ones at their target
    const spring = keys.length > 0 ? ensureGroup(keys, plan.jump) : springRef.current
    appliedRef.current = next
    if (spring) {
      if (hasKeys(plan.jump)) spring.jump(plan.jump)
      if (hasKeys(plan.set)) {
        const { stiffness, damping, mass } = physicsRef.current
        spring.set(plan.set, { stiffness, damping, mass })
      }
    }
    if (plan.structural || hasKeys(plan.jump)) {
      show(next, spring ? spring.get() : {})
    }
  })

  return composeAnimatableRecord(state.values, state.channels, defaultChannelKeysOf)
}
