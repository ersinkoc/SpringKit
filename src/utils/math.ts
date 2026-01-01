/**
 * Clamp a value between a minimum and maximum
 * @param value - The value to clamp
 * @param min - The minimum allowed value
 * @param max - The maximum allowed value
 * @returns The clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  // Handle inverted min/max (swap them)
  const actualMin = Math.min(min, max)
  const actualMax = Math.max(min, max)
  return Math.max(actualMin, Math.min(actualMax, value))
}

/**
 * Linear interpolation between two values
 * @param a - The start value
 * @param b - The end value
 * @param t - The interpolation factor (0-1)
 * @returns The interpolated value
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Map a value from one range to another
 * @param value - The value to map
 * @param inMin - The minimum of the input range
 * @param inMax - The maximum of the input range
 * @param outMin - The minimum of the output range
 * @param outMax - The maximum of the output range
 * @returns The mapped value
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  // Guard against division by zero - return outMin when input range is zero
  const inputRange = inMax - inMin
  if (inputRange === 0) {
    return outMin
  }
  return ((value - inMin) * (outMax - outMin)) / inputRange + outMin
}

/**
 * Convert degrees to radians
 * @param degrees - The angle in degrees
 * @returns The angle in radians
 */
export function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * Convert radians to degrees
 * @param radians - The angle in radians
 * @returns The angle in degrees
 */
export function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI
}
