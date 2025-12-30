import { useLayoutEffect, useEffect } from 'react'

/**
 * Whether we're running in a browser environment
 */
export const isBrowser = typeof window !== 'undefined'

/**
 * Whether we're running in a server environment (SSR)
 */
export const isServer = !isBrowser

/**
 * SSR-safe version of useLayoutEffect
 *
 * Uses useLayoutEffect in the browser and useEffect on the server
 * to avoid React SSR warnings about useLayoutEffect.
 */
export const useIsomorphicLayoutEffect = isBrowser ? useLayoutEffect : useEffect

/**
 * Check if we should skip animations (e.g., during SSR or initial hydration)
 */
export function shouldSkipAnimation(): boolean {
  // Skip on server
  if (isServer) return true

  // Could add hydration detection here if needed
  return false
}

/**
 * Safe requestAnimationFrame that works on server
 */
export function safeRequestAnimationFrame(callback: FrameRequestCallback): number {
  if (isBrowser && typeof requestAnimationFrame !== 'undefined') {
    return requestAnimationFrame(callback)
  }
  // Return a dummy ID on server
  return 0
}

/**
 * Safe cancelAnimationFrame that works on server
 */
export function safeCancelAnimationFrame(id: number): void {
  if (isBrowser && typeof cancelAnimationFrame !== 'undefined') {
    cancelAnimationFrame(id)
  }
}
