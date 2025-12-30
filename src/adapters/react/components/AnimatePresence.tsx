import React, {
  useRef,
  useState,
  useLayoutEffect,
  useEffect,
  Children,
  isValidElement,
  cloneElement,
} from 'react'
import { PresenceChild } from './PresenceChild.js'

// SSR-safe useLayoutEffect
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect

export type AnimatePresenceMode = 'sync' | 'wait' | 'popLayout'

export interface AnimatePresenceProps {
  /**
   * Children to animate. Each direct child must have a unique key.
   */
  children?: React.ReactNode

  /**
   * Custom data passed to exit animations via usePresenceCustom()
   * Useful for dynamic exit directions (e.g., slide left vs right)
   */
  custom?: unknown

  /**
   * Whether to animate the initial mount of children.
   * Set to false to skip initial animations.
   * @default true
   */
  initial?: boolean

  /**
   * Controls how children animate relative to each other:
   * - 'sync': Exiting and entering children animate simultaneously (default)
   * - 'wait': Wait for exiting children to finish before entering new children
   * - 'popLayout': Like 'sync' but uses FLIP for position animations
   * @default 'sync'
   */
  mode?: AnimatePresenceMode

  /**
   * Callback fired when all exiting children have finished animating
   */
  onExitComplete?: () => void
}

interface ChildMap {
  [key: string]: React.ReactElement
}

/**
 * Get unique key from React element
 */
function getChildKey(child: React.ReactElement): string {
  return child.key !== null ? String(child.key) : ''
}

/**
 * Convert children array to keyed map
 */
function getChildrenMap(children: React.ReactNode): ChildMap {
  const map: ChildMap = {}

  Children.forEach(children, (child) => {
    if (isValidElement(child)) {
      const key = getChildKey(child)
      if (key) {
        map[key] = child
      }
    }
  })

  return map
}

/**
 * AnimatePresence enables exit animations for children when they're removed.
 *
 * Wrap any components that may be conditionally rendered. Each direct child
 * must have a unique `key` prop for AnimatePresence to track them.
 *
 * @example Basic usage
 * ```tsx
 * import { AnimatePresence, Animated } from '@oxog/springkit/react'
 *
 * function App() {
 *   const [isVisible, setIsVisible] = useState(true)
 *
 *   return (
 *     <AnimatePresence>
 *       {isVisible && (
 *         <Animated.div
 *           key="box"
 *           initial={{ opacity: 0 }}
 *           animate={{ opacity: 1 }}
 *           exit={{ opacity: 0 }}
 *         >
 *           I fade in and out
 *         </Animated.div>
 *       )}
 *     </AnimatePresence>
 *   )
 * }
 * ```
 *
 * @example Wait mode
 * ```tsx
 * <AnimatePresence mode="wait">
 *   <Page key={currentPage} />
 * </AnimatePresence>
 * ```
 *
 * @example Custom exit data
 * ```tsx
 * <AnimatePresence custom={direction}>
 *   <Slide key={index} />
 * </AnimatePresence>
 *
 * // In Slide component:
 * const direction = usePresenceCustom<number>()
 * ```
 */
export function AnimatePresence({
  children,
  custom,
  initial = true,
  mode = 'sync',
  onExitComplete,
}: AnimatePresenceProps) {
  // Track whether this is the first render (for initial prop)
  const isInitialMount = useRef(true)

  // Track which children are exiting (keyed by child key)
  const [exitingChildren, setExitingChildren] = useState<ChildMap>({})

  // Previous children for comparison
  const prevChildrenRef = useRef<ChildMap>({})

  // Force update trigger for 'wait' mode
  const [, forceUpdate] = useState(0)

  // Track pending exits for onExitComplete callback
  const pendingExitCount = useRef(0)

  // Convert current children to map
  const currentChildren = getChildrenMap(children)

  // Detect removed children on each render
  useIsomorphicLayoutEffect(() => {
    const prevChildren = prevChildrenRef.current
    const newExiting: ChildMap = {}

    // Find children that were removed
    for (const key in prevChildren) {
      if (!(key in currentChildren)) {
        const prevChild = prevChildren[key]
        // Child was removed, keep it for exit animation
        if (prevChild) {
          newExiting[key] = prevChild
        }
      }
    }

    // Update exiting children if there are any
    if (Object.keys(newExiting).length > 0) {
      setExitingChildren((prev) => ({ ...prev, ...newExiting }))
      pendingExitCount.current += Object.keys(newExiting).length
    }

    // Store current as previous for next render
    prevChildrenRef.current = currentChildren

    // After initial mount, unset the flag
    if (isInitialMount.current) {
      isInitialMount.current = false
    }
  })

  // Handle exit completion
  const handleExitComplete = (key: string) => {
    setExitingChildren((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })

    pendingExitCount.current--

    // Fire callback when all exits are complete
    if (pendingExitCount.current === 0 && onExitComplete) {
      onExitComplete()
    }

    // Force re-render for 'wait' mode
    if (mode === 'wait') {
      forceUpdate((n) => n + 1)
    }
  }

  // In 'wait' mode, don't render entering children until exits complete
  const showEntering = mode !== 'wait' || Object.keys(exitingChildren).length === 0

  // Combine current and exiting children for rendering
  const allChildren: React.ReactElement[] = []

  // First, add exiting children (they animate out)
  for (const key in exitingChildren) {
    const exitingChild = exitingChildren[key]
    if (!exitingChild) continue

    allChildren.push(
      <PresenceChild
        key={`presence-${key}`}
        id={key}
        isPresent={false}
        onExitComplete={handleExitComplete}
        custom={custom}
      >
        {cloneElement(exitingChild, {
          key,
        })}
      </PresenceChild>
    )
  }

  // Then, add current children (if allowed by mode)
  if (showEntering) {
    Children.forEach(children, (child) => {
      if (isValidElement(child)) {
        const key = getChildKey(child)
        if (!key) {
          console.warn(
            'AnimatePresence: Every child must have a unique "key" prop.'
          )
          return
        }

        // Skip initial animation if initial={false} and this is first mount
        const shouldAnimate = !(isInitialMount.current && initial === false)

        allChildren.push(
          <PresenceChild
            key={`presence-${key}`}
            id={key}
            isPresent={true}
            onExitComplete={handleExitComplete}
            custom={custom}
          >
            {cloneElement(child, {
              key,
              // Pass down animation state - child components can use this
              ...(shouldAnimate ? {} : { 'data-initial-skip': true }),
            })}
          </PresenceChild>
        )
      }
    })
  }

  return <>{allChildren}</>
}
