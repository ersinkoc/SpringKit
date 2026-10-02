import * as React from 'react'
import { useMemo, useCallback, useRef, useEffect } from 'react'
import { PresenceContext, type PresenceContextValue } from '../context/PresenceContext.js'
import { PopChild } from './PopChild.js'

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
  /** Set to false to tell children to skip their initial (mount) animation */
  initial?: boolean
  /** Pop the child out of the layout flow while it exits (AnimatePresence mode="popLayout") */
  popLayout?: boolean
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
  initial,
  popLayout = false,
}: PresenceChildProps) {
  const presenceIdRef = useRef(id)
  const onExitCompleteRef = useRef(onExitComplete)

  // Keep refs current (id shouldn't change, but be safe)
  presenceIdRef.current = id
  onExitCompleteRef.current = onExitComplete

  // Stable safeToRemove: an unstable onExitComplete prop must not re-create the
  // context value or reset the fallback exit timer on every render
  const safeToRemove = useCallback(() => {
    onExitCompleteRef.current(presenceIdRef.current)
  }, [])

  // Whether anything in the subtree has read `safeToRemove` (usePresence(),
  // Animated, or a direct PresenceContext consumer). Only such children can
  // animate out; anything else is removed as soon as it starts exiting.
  const hasExitHandlerRef = useRef(false)

  // Create stable context value
  const contextValue = useMemo<PresenceContextValue>(
    () => ({
      id,
      isPresent,
      get safeToRemove() {
        hasExitHandlerRef.current = true
        return safeToRemove
      },
      custom,
      initial,
    }),
    [id, isPresent, safeToRemove, custom, initial]
  )

  // Auto-call safeToRemove after a timeout if exit animation doesn't complete.
  // This prevents "zombie" children from staying in the tree forever.
  // The timer is (re)armed every time this effect runs while exiting, so it also
  // survives React StrictMode's mount/unmount/mount effect cycle.
  useEffect(() => {
    if (isPresent) return

    // Nothing will ever call safeToRemove (e.g. a plain DOM child): remove it
    // now instead of after the fallback timeout. Consumers re-render with the
    // new context value before this effect runs, so they have registered.
    if (!hasExitHandlerRef.current) {
      safeToRemove()
      return
    }

    // If exitTimeout is 0 or negative, don't set a timeout
    // (rely on the exit animation to call safeToRemove)
    if (exitTimeout <= 0) return

    const timeout = setTimeout(safeToRemove, exitTimeout)
    return () => clearTimeout(timeout)
  }, [isPresent, safeToRemove, exitTimeout])

  return (
    <PresenceContext.Provider value={contextValue}>
      {popLayout ? <PopChild isPresent={isPresent}>{children}</PopChild> : children}
    </PresenceContext.Provider>
  )
}
