// Utils module - Math and color utilities
export { clamp, lerp, mapRange, degToRad, radToDeg } from './math.js'
export {
  parseColor,
  rgbToHex,
  hexToRgb,
  hslToRgb,
  rgbToHsl,
} from './color.js'
export type { RGB, HSL } from './color.js'
export {
  validateSpringConfig,
  validateDragConfig,
  validateDecayConfig,
  clearWarnings,
} from './warnings.js'
