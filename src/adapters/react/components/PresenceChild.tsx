import React, { useMemo, useCallback, useRef, useEffect } from 'react'
import { PresenceContext, type PresenceContextValue } from '../context/PresenceContext.js'

export interface PresenceChildProps {
  /** Unique identifier for this child */
  id: string
  /** The child element to render */
  children: React.ReactElement
  /** Whether this child is currently present in the tree */
  isPresent: boolean
  /** Callback when exit animation is complete and child can be removed */
  onExitComplete: (id: string) => void
  /** Custom data to pass to the child via context */
  custom?: unknown
}

/**
 * Wrapper component that provides presence context to a child in AnimatePresence
 *
 * This component is internal and used by AnimatePresence to manage
 * the lifecycle of exiting children.
 */
export function PresenceChild({
  id,
  children,
  isPresent,
  onExitComplete,
  custom,
}: PresenceChildProps) {
  const presenceIdRef = useRef(id)

  // Update ref on id change (shouldn't happen but be safe)
  presenceIdRef.current = id

  // Memoized callback for safeToRemove
  const safeToRemove = useCallback(() => {
    onExitComplete(presenceIdRef.current)
  }, [onExitComplete])

  // Create stable context value
  const contextValue = useMemo<PresenceContextValue>(
    () => ({
      id,
      isPresent,
      safeToRemove,
      custom,
    }),
    [id, isPresent, safeToRemove, custom]
  )

  // Auto-call safeToRemove after a timeout if exit animation doesn't complete
  // This prevents "zombie" children from staying in the tree forever
  const hasExited = useRef(false)
  useEffect(() => {
    if (!isPresent && !hasExited.current) {
      hasExited.current = true

      // Set a generous timeout for exit animations
      // If the animation hasn't called safeToRemove by then, force removal
      const timeout = setTimeout(() => {
        safeToRemove()
      }, 10000) // 10 seconds max for exit animation

      return () => clearTimeout(timeout)
    }

    // Reset when becoming present again
    if (isPresent) {
      hasExited.current = false
    }
  }, [isPresent, safeToRemove])

  return (
    <PresenceContext.Provider value={contextValue}>
      {children}
    </PresenceContext.Provider>
  )
}
