import React, { useMemo, useCallback, useRef, useEffect } from 'react'
import { PresenceContext, type PresenceContextValue } from '../context/PresenceContext.js'

/** Default timeout for exit animations (10 seconds) */
export const DEFAULT_EXIT_TIMEOUT = 10000

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
  /** Maximum time to wait for exit animation before forcing removal (ms). Set to 0 to disable. Default: 10000 */
  exitTimeout?: number
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
  exitTimeout = DEFAULT_EXIT_TIMEOUT,
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
  const hasExitedRef = useRef(false)
  const hasCalledRemoveRef = useRef(false)

  useEffect(() => {
    // Reset when becoming present again
    if (isPresent) {
      hasExitedRef.current = false
      hasCalledRemoveRef.current = false
      return
    }

    // Already processed exit
    if (hasExitedRef.current) return

    hasExitedRef.current = true

    // If exitTimeout is 0 or negative, don't set a timeout (rely on animation to call safeToRemove)
    if (exitTimeout <= 0) return

    // Set a configurable timeout for exit animations
    // If the animation hasn't called safeToRemove by then, force removal
    const timeout = setTimeout(() => {
      // Only call if not already called
      if (!hasCalledRemoveRef.current) {
        hasCalledRemoveRef.current = true
        safeToRemove()
      }
    }, exitTimeout)

    return () => clearTimeout(timeout)
  }, [isPresent, safeToRemove, exitTimeout])

  return (
    <PresenceContext.Provider value={contextValue}>
      {children}
    </PresenceContext.Provider>
  )
}
