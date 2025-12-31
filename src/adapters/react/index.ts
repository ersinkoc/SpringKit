// React adapter for SpringKit

// ============ Core Hooks ============

export { useSpring } from './hooks/useSpring.js'
export { useSpringValue } from './hooks/useSpringValue.js'
export { useSprings } from './hooks/useSprings.js'
export { useTrail } from './hooks/useTrail.js'
export { useDrag } from './hooks/useDrag.js'
export { useGesture } from './hooks/useGesture.js'
export { usePresence, useIsPresent, usePresenceCustom } from './hooks/usePresence.js'
export { useAnimate } from './hooks/useAnimate.js'
export type { AnimationTarget, AnimateOptions, AnimateFunction, AnimationControls, UseAnimateReturn } from './hooks/useAnimate.js'

// ============ MotionValue Hooks ============

export {
  useMotionValue,
  useMotionValueState,
  useMotionValueSync,
  useMotionValues,
} from './hooks/useMotionValue.js'

export {
  useTransform,
  useCombinedTransform,
  useVelocityTransform,
  useSpringTransform,
} from './hooks/useTransform.js'
export type { UseTransformOptions } from './hooks/useTransform.js'

// ============ Viewport & Scroll Hooks ============

export {
  useInView,
  useInViewCallback,
  useInViewMultiple,
} from './hooks/useInView.js'
export type { UseInViewOptions, UseInViewReturn } from './hooks/useInView.js'

export {
  useScroll,
  useScrollVelocity,
} from './hooks/useScroll.js'
export type { UseScrollOptions, UseScrollReturn } from './hooks/useScroll.js'

// ============ Gesture State Hooks ============

export {
  useGestureState,
  useHover,
  useTap,
  useFocus,
  useInteractionState,
  useGestureAnimation,
} from './hooks/useGestureState.js'
export type { GestureState, UseGestureStateOptions, UseGestureStateReturn } from './hooks/useGestureState.js'

// ============ Accessibility Hooks ============

export {
  useReducedMotion,
  getReducedMotionPreference,
  useReducedMotionConfig,
  useShouldAnimate,
  useReducedMotionValue,
} from './hooks/useReducedMotion.js'

// ============ Scroll-Linked Animation Hooks ============

export {
  useScrollProgress,
  useParallax,
  useScrollTrigger,
  useScrollLinkedValue,
} from './hooks/useScrollLinked.js'
export type {
  UseScrollProgressOptions,
  UseScrollProgressReturn,
  UseParallaxOptions,
  UseParallaxReturn,
  UseScrollTriggerOptions,
  UseScrollTriggerReturn,
  UseScrollLinkedValueOptions,
} from './hooks/useScrollLinked.js'

// ============ Timeline Hooks ============

export {
  useTimeline,
  useTimelineState,
} from './hooks/useTimeline.js'
export type {
  UseTimelineOptions,
  UseTimelineReturn,
  UseTimelineStateReturn,
} from './hooks/useTimeline.js'

// ============ SVG Morphing Hooks ============

export {
  useMorph,
  useMorphSequence,
  useMorphRef,
} from './hooks/useMorph.js'
export type {
  UseMorphOptions,
  UseMorphReturn,
  UseMorphSequenceOptions,
  UseMorphSequenceReturn,
} from './hooks/useMorph.js'

// ============ Layout Animation Hooks ============

export {
  useLayoutGroup,
  useLayoutId,
  useFlip,
  useAutoLayout,
  LayoutGroupProvider,
  SharedLayoutProvider,
  LayoutGroupContext,
  SharedLayoutContextReact,
} from './hooks/useLayoutAnimation.js'
export type {
  UseLayoutGroupOptions,
  UseLayoutGroupReturn,
  UseLayoutIdOptions,
  UseLayoutIdReturn,
  UseFlipOptions,
  UseFlipReturn,
  UseAutoLayoutOptions,
  UseAutoLayoutReturn,
  LayoutGroupProviderProps,
  SharedLayoutProviderProps,
} from './hooks/useLayoutAnimation.js'

// ============ Components ============

export { Spring } from './components/Spring.js'
export { Animated } from './components/Animated.js'
export type { AnimatedStyle, AnimatedElementProps } from './components/Animated.js'
export { Trail } from './components/Trail.js'
export { AnimatePresence } from './components/AnimatePresence.js'
export type { AnimatePresenceProps, AnimatePresenceMode } from './components/AnimatePresence.js'
export { PresenceChild } from './components/PresenceChild.js'
export type { PresenceChildProps } from './components/PresenceChild.js'
export { MotionConfig, useMotionConfig } from './components/MotionConfig.js'
export type { MotionConfigProps, MotionContextValue, ReducedMotionMode } from './components/MotionConfig.js'

// ============ Context ============

export { PresenceContext } from './context/PresenceContext.js'
export type { PresenceContextValue } from './context/PresenceContext.js'

// ============ Utils ============

export {
  isBrowser,
  isServer,
  useIsomorphicLayoutEffect,
  shouldSkipAnimation,
  safeRequestAnimationFrame,
  safeCancelAnimationFrame,
} from './utils/ssr.js'

// ============ Re-export core types ============

export * from '../../types.js'

// Re-export MotionValue from core
export {
  MotionValue,
  createMotionValue,
  transformValue,
  mapRange,
} from '../../core/MotionValue.js'
export type {
  MotionValueSubscriber,
  MotionValueEvent,
  MotionValueOptions,
} from '../../core/MotionValue.js'
