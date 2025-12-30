// SpringKit - Physics-based spring animations with gesture support

// ============ Core ============

export { spring } from './core/spring.js'
export { createSpringValue } from './core/spring-value.js'
export { createSpringGroup } from './core/spring-group.js'
export {
  springPresets,
  configFromDuration,
  configFromBounce,
} from './core/config.js'

// ============ Animation Orchestration ============

export { sequence, parallel, stagger } from './animation/sequence.js'
export { createTrail } from './animation/trail.js'
export { decay } from './animation/decay.js'
export { keyframes, parseKeyframeArray, isKeyframeArray } from './animation/keyframes.js'

// ============ Interpolation ============

export { interpolate } from './interpolation/interpolate.js'
export { interpolateColor } from './interpolation/color.js'

// ============ Gesture ============

export { createDragSpring } from './gesture/drag.js'
export { createScrollSpring } from './gesture/scroll.js'

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

// ============ Types ============

export * from './types.js'
