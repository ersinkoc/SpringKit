import * as React from 'react'
import {
  useRef,
  useState,
  useLayoutEffect,
  useEffect,
  useCallback,
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
   * - 'popLayout': Like 'sync', but exiting children are popped out of the
   *   layout flow (`position: absolute` at their last position and size) so
   *   their siblings reflow immediately. Exiting children must render a DOM
   *   element and forward their ref (e.g. `Animated.div`), and their offset
   *   parent should be positioned (e.g. `position: relative`).
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
 * A removed child stays mounted until its exit completes: `Animated` elements
 * with an `exit` prop, or components calling `safeToRemove` from
 * `usePresence()`. Children that do neither (e.g. plain DOM elements) are
 * removed right away.
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
 * @example Pop exiting children out of the layout
 * ```tsx
 * <ul style={{ position: 'relative' }}>
 *   <AnimatePresence mode="popLayout">
 *     {items.map((item) => (
 *       <Animated.li key={item.id} exit={{ opacity: 0 }}>{item.label}</Animated.li>
 *     ))}
 *   </AnimatePresence>
 * </ul>
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

  // Committed set of children that are exiting (keyed by child key)
  const [exitingChildren, setExitingChildren] = useState<ChildMap>({})

  // Children and render order from the last commit, used to detect removals
  const prevChildrenRef = useRef<ChildMap>({})
  const prevOrderRef = useRef<string[]>([])

  // Mirror of the committed exiting set, used to dedupe safeToRemove calls
  const exitingRef = useRef<ChildMap>({})

  // Latest onExitComplete, so the completion handler can keep a stable identity
  const onExitCompleteRef = useRef(onExitComplete)
  onExitCompleteRef.current = onExitComplete

  // Convert current children to map, plus their keys in render order (object key
  // order can't be used: integer-like keys such as "2" would be sorted first)
  const currentChildren = getChildrenMap(children)
  const currentKeys: string[] = []
  Children.forEach(children, (child) => {
    if (isValidElement(child)) {
      const key = getChildKey(child)
      if (key && !currentKeys.includes(key)) currentKeys.push(key)
    }
  })

  // Keys rendered in the last commit
  const prevOrder = prevOrderRef.current

  // Derive the exiting set during render so that a removed child stays mounted in
  // the very render it is removed in (detecting removals in an effect would unmount
  // and remount it, losing its state). Children that were re-added stop exiting.
  const derivedExiting: ChildMap = {}
  for (const key in exitingChildren) {
    const child = exitingChildren[key]
    if (child && !(key in currentChildren)) derivedExiting[key] = child
  }
  for (const key in prevChildrenRef.current) {
    const child = prevChildrenRef.current[key]
    // Only children that were actually rendered can exit (in 'wait' mode an
    // entering child may never have been mounted)
    if (child && !(key in currentChildren) && prevOrder.includes(key)) {
      derivedExiting[key] = child
    }
  }

  // In 'wait' mode, don't render entering children until exits complete
  const showEntering = mode !== 'wait' || Object.keys(derivedExiting).length === 0

  // Render order: current children in order, with each exiting child re-inserted
  // after the key that preceded it in the previous render (keeps list positions).
  // Children that are already mounted stay mounted while others exit in 'wait'
  // mode; only new ones are held back.
  const renderedOrder: string[] = showEntering
    ? [...currentKeys]
    : currentKeys.filter((key) => prevOrder.includes(key))
  const exitingKeys = Object.keys(derivedExiting).sort(
    (a, b) => prevOrder.indexOf(a) - prevOrder.indexOf(b)
  )
  for (const key of exitingKeys) {
    let insertAt = 0
    for (let i = prevOrder.indexOf(key) - 1; i >= 0; i--) {
      const index = renderedOrder.indexOf(prevOrder[i]!)
      if (index !== -1) {
        insertAt = index + 1
        break
      }
    }
    renderedOrder.splice(insertAt, 0, key)
  }

  // Commit the derived state
  useIsomorphicLayoutEffect(() => {
    exitingRef.current = derivedExiting
    prevChildrenRef.current = currentChildren
    prevOrderRef.current = renderedOrder

    const prevKeys = Object.keys(exitingChildren)
    const nextKeys = Object.keys(derivedExiting)
    if (
      prevKeys.length !== nextKeys.length ||
      nextKeys.some((key) => exitingChildren[key] !== derivedExiting[key])
    ) {
      setExitingChildren(derivedExiting)
    }

    // After initial mount, unset the flag
    if (isInitialMount.current) {
      isInitialMount.current = false
    }
  })

  // Handle exit completion. Stable identity so PresenceChild's fallback timer is
  // not reset by re-renders; duplicate or stale calls are ignored.
  const handleExitComplete = useCallback((key: string) => {
    if (!(key in exitingRef.current)) return

    const next = { ...exitingRef.current }
    delete next[key]
    exitingRef.current = next

    setExitingChildren((prev) => {
      if (!(key in prev)) return prev
      const updated = { ...prev }
      delete updated[key]
      return updated
    })

    // Fire callback when all exits are complete
    if (Object.keys(next).length === 0) {
      onExitCompleteRef.current?.()
    }
  }, [])

  if (showEntering) {
    Children.forEach(children, (child) => {
      if (isValidElement(child) && !getChildKey(child)) {
        console.warn(
          'AnimatePresence: Every child must have a unique "key" prop.'
        )
      }
    })
  }

  // Skip initial animation if initial={false} and this is first mount
  const skipInitial = isInitialMount.current && initial === false

  const allChildren: React.ReactElement[] = []
  for (const key of renderedOrder) {
    const exitingChild = derivedExiting[key]
    const child = exitingChild ?? currentChildren[key]
    if (!child) continue

    allChildren.push(
      <PresenceChild
        key={`presence-${key}`}
        id={key}
        isPresent={!exitingChild}
        onExitComplete={handleExitComplete}
        custom={custom}
        initial={skipInitial ? false : undefined}
        popLayout={mode === 'popLayout'}
      >
        {cloneElement(child, { key })}
      </PresenceChild>
    )
  }

  return <>{allChildren}</>
}
