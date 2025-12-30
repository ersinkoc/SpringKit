// Core module - Spring animations fundamentals
export { spring } from './spring.js'
export type { SpringAnimation } from './spring.js'
export { createSpringValue } from './spring-value.js'
export type { SpringValue } from './spring-value.js'
export { createSpringGroup } from './spring-group.js'
export type { SpringGroup } from './spring-group.js'
export {
  springPresets,
  configFromDuration,
  configFromBounce,
  defaultConfig,
} from './config.js'
export type { SpringConfig, SpringPresets } from './config.js'
export {
  simulateSpring,
  calculatePeriod,
  calculateDampingRatio,
  isUnderdamped,
  isCriticallyDamped,
  isOverdamped,
} from './physics.js'
export type { SimulationResult } from './physics.js'

// MotionValue - High-performance animated values
export {
  MotionValue,
  createMotionValue,
  transformValue,
  mapRange,
} from './MotionValue.js'
export type {
  MotionValueSubscriber,
  MotionValueEvent,
  MotionValueOptions,
} from './MotionValue.js'
