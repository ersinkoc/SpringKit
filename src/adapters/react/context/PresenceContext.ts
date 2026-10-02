import { createContext } from 'react'

/**
 * Context value for presence state in AnimatePresence
 */
export interface PresenceContextValue {
  /** Unique ID for this presence instance */
  id: string
  /** Whether the component is present in the tree */
  isPresent: boolean
  /**
   * Call this when exit animation is complete to allow unmounting.
   * Reading it (as `usePresence()` and `Animated` do) tells AnimatePresence that
   * the child handles its exit; a child that never reads it is removed as soon
   * as it starts exiting.
   */
  safeToRemove: () => void
  /** Custom data passed from AnimatePresence */
  custom?: unknown
  /**
   * False when the child should skip its initial (mount) animation,
   * e.g. `<AnimatePresence initial={false}>` on first render
   */
  initial?: boolean
}

/**
 * Context for managing presence state in AnimatePresence
 *
 * When a child is removed from AnimatePresence, it stays mounted
 * while its exit animation plays. This context provides:
 * - isPresent: false when the child should animate out
 * - safeToRemove: callback to signal animation completion
 */
export const PresenceContext = createContext<PresenceContextValue | null>(null)

PresenceContext.displayName = 'PresenceContext'
