// Animation module - Orchestration and effects
export { sequence, parallel, stagger } from './sequence.js'
export type { StaggerOptions } from './sequence.js'
export { createTrail } from './trail.js'
export type { Trail, TrailConfig } from './trail.js'
export { decay } from './decay.js'
export type { DecayAnimation, DecayConfig } from './decay.js'
export { globalLoop, AnimationState } from './loop.js'
export type { Animatable, CleanupCallback } from './loop.js'
