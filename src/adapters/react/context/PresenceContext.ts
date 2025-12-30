import { createContext } from 'react'

/**
 * Context value for presence state in AnimatePresence
 */
export interface PresenceContextValue {
  /** Unique ID for this presence instance */
  id: string
  /** Whether the component is present in the tree */
  isPresent: boolean
  /** Call this when exit animation is complete to allow unmounting */
  safeToRemove: () => void
  /** Custom data passed from AnimatePresence */
  custom?: unknown
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
