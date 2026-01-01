// SpringKit - Physics-based spring animations with gesture support

// ============ Core ============

export { spring } from './core/spring.js'
export { createSpringValue } from './core/spring-value.js'
export { createSpringGroup } from './core/spring-group.js'
export {
  springPresets,
  physicsPresets,
  configFromDuration,
  configFromBounce,
  getPhysicsPreset,
  createFeeling,
  adjustSpeed,
  adjustBounce,
} from './core/config.js'
export type { PhysicsPresetName } from './core/config.js'

// ============ Variants System ============

export {
  resolveVariant,
  getVariant,
  mergeVariants,
  isTransformProperty,
  isAnimatable,
  parseValueWithUnit,
  buildTransformString,
  applyValuesToElement,
  calculateStaggerDelays,
  createOrchestration,
  variantPresets,
  createVariantPreset,
  isVariants,
  isVariant,
} from './core/variants.js'
export type {
  AnimationValues,
  VariantTransition,
  Variant,
  Variants,
  OrchestrationOptions,
  ResolvedVariant,
  OrchestrationSequence,
} from './core/variants.js'

// ============ Animation Orchestration ============

export { sequence, parallel, stagger } from './animation/sequence.js'
export { createTrail } from './animation/trail.js'
export { decay } from './animation/decay.js'
export { keyframes, parseKeyframeArray, isKeyframeArray } from './animation/keyframes.js'
export { animate, animateAll } from './animation/animate.js'
export type { AnimateTarget, AnimateOptions, AnimateControls } from './animation/animate.js'

// ============ Interpolation ============

export { interpolate } from './interpolation/interpolate.js'
export { interpolateColor } from './interpolation/color.js'

// ============ Gesture ============

export { createDragSpring } from './gesture/drag.js'
export { createScrollSpring } from './gesture/scroll.js'

// ============ Advanced Gestures ============

export {
  createPinchGesture,
  createRotateGesture,
  createSwipeGesture,
  createLongPressGesture,
  createGestures,
} from './gesture/advanced.js'
export type {
  PinchState,
  PinchConfig,
  RotateState,
  RotateConfig,
  SwipeState,
  SwipeConfig,
  LongPressState,
  LongPressConfig,
  GestureState,
  GestureConfig,
  GestureController,
} from './gesture/advanced.js'

// ============ Scroll-Linked Animations ============

export {
  createScrollProgress,
  createParallax,
  createScrollTrigger,
  createScrollLinkedValue,
  scrollEasings,
} from './scroll/scroll-linked.js'
export type {
  ScrollInfo,
  ScrollTriggerConfig,
  ParallaxConfig,
  ScrollLinkedConfig,
  ScrollProgress,
  Parallax,
  ScrollTrigger,
  ScrollLinkedValue,
} from './scroll/scroll-linked.js'

// ============ Timeline API ============

export {
  createTimeline,
  tween,
  allTo,
} from './animation/timeline.js'
export type {
  TimelineTarget,
  TimelineValues,
  TimelineOptions,
  TimelineProps,
  TimelinePosition,
  TimelineConfig,
  Timeline,
} from './animation/timeline.js'

// ============ SVG Morphing ============

export {
  createMorph,
  createMorphSequence,
  shapes,
} from './svg/morph.js'
export type {
  MorphConfig,
  MorphController,
} from './svg/morph.js'

// ============ Shared Layout Animations ============

export {
  createLayoutGroup,
  createSharedLayoutContext,
  createAutoLayout,
} from './layout/shared.js'
export type {
  LayoutMeasurement,
  LayoutAnimationConfig,
  LayoutGroup,
  SharedLayoutContext,
  AutoLayoutConfig,
} from './layout/shared.js'

// ============ Enhanced Stagger Patterns ============

export {
  linearStagger,
  reverseStagger,
  centerStagger,
  edgeStagger,
  gridStagger,
  waveStagger,
  spiralStagger,
  randomStagger,
  customStagger,
  applyStagger,
  staggerPresets,
} from './animation/stagger-patterns.js'
export type {
  StaggerPatternConfig,
  GridStaggerConfig,
  WaveStaggerConfig,
  SpiralStaggerConfig,
  RandomStaggerConfig,
  CustomStaggerFn,
} from './animation/stagger-patterns.js'

// ============ Utilities ============

export { clamp, lerp, mapRange, degToRad, radToDeg } from './utils/math.js'
export {
  parseColor,
  rgbToHex,
  hexToRgb,
  hslToRgb,
  rgbToHsl,
} from './utils/color.js'
export {
  validateSpringConfig,
  validateDragConfig,
  validateDecayConfig,
  clearWarnings,
} from './utils/warnings.js'

// ============ MotionValue ============

export {
  MotionValue,
  createMotionValue,
  transformValue,
  mapRange as motionMapRange,
} from './core/MotionValue.js'
export type {
  MotionValueSubscriber,
  MotionValueEvent,
  MotionValueOptions,
} from './core/MotionValue.js'

// ============ Physics Utilities ============

export {
  simulateSpring,
  calculatePeriod,
  calculateDampingRatio,
  isUnderdamped,
  isCriticallyDamped,
  isOverdamped,
} from './core/physics.js'

// ============ Global Loop ============

export { globalLoop, AnimationState } from './animation/loop.js'

// ============ SVG Animations ============

export {
  createPathAnimation,
  getPathLength,
  preparePathForAnimation,
  getPointAtProgress,
} from './svg/path.js'

// ============ Layout Animations (FLIP) ============

export {
  measureElement,
  createFlip,
  flip,
  flipBatch,
} from './layout/flip.js'
export type {
  MeasuredBox,
  FlipOptions,
  FlipAnimation,
} from './layout/flip.js'

// ============ Types ============

export * from './types.js'
