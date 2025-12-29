// Re-export all types for public use

// Core types
export type { SpringConfig, SpringPresets } from './core/config.js'
export type { SpringAnimation } from './core/spring.js'
export type { SpringValue } from './core/spring-value.js'
export type { SpringGroup } from './core/spring-group.js'

// Animation types
export type { StaggerOptions } from './animation/sequence.js'
export type { Trail, TrailConfig } from './animation/trail.js'
export type { DecayAnimation, DecayConfig } from './animation/decay.js'

// Interpolation types
export type { Interpolation, InterpolateOptions } from './interpolation/interpolate.js'
export type { ColorInterpolation } from './interpolation/color.js'

// Gesture types
export type { DragSpring, DragSpringConfig } from './gesture/drag.js'
export type { ScrollSpring, ScrollSpringConfig } from './gesture/scroll.js'

// Utility types
export type { RGB, HSL } from './utils/color.js'
