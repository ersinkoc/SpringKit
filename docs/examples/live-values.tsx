import * as React from 'react'
import { createMotionValue, animate, defineSpring, animateNative } from '@oxog/springkit'
import { Animated, MotionConfig, useBounce, useMotionValue, useReducedMotion } from '@oxog/springkit/react'
import { bindStyle } from '@oxog/springkit/dom'

export function LiveCard() {
  const opacity = useMotionValue(0.5)
  return <Animated.div style={{ opacity }} onClick={() => opacity.set(1)}>Card</Animated.div>
}

export function BouncingCard() {
  const { value, drop } = useBounce({ floor: 300 })
  return <Animated.div style={{ y: value }} onClick={() => drop(0)}>Drop</Animated.div>
}

export function AccessibleCard() {
  const reduced = useReducedMotion()
  return <MotionConfig reducedMotion={reduced ? 'always' : 'user'}><Animated.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Content</Animated.div></MotionConfig>
}

export function bindVanillaCard(element: HTMLElement) {
  const opacity = createMotionValue(0)
  const detach = bindStyle(element, { opacity })
  opacity.set(1)
  return () => { detach(); opacity.destroy() }
}

export async function animateColor(element: HTMLElement) {
  await animate(element, { backgroundColor: ['#f00', '#00f'], width: ['0%', '50%'] }, { duration: 500 }).finished
  await animateNative(element, { opacity: [0.5, 1] }, defineSpring({ duration: 400, bounce: 0.2 })).finished
}
