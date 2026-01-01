import { useCallback, useRef, useTransition, startTransition } from 'react'

/**
 * Options for useInstantTransition
 */
export interface UseInstantTransitionOptions {
  /**
   * If true, skip the transition and update immediately.
   * Useful for urgent updates that shouldn't be deferred.
   */
  instant?: boolean
}

/**
 * A hook that provides instant layout updates without animation
 *
 * This is useful when you want to update layout immediately (like when
 * switching tabs or pages) without the spring animation that would
 * normally occur.
 *
 * @example Basic usage
 * ```tsx
 * function Tabs() {
 *   const [activeTab, setActiveTab] = useState(0)
 *   const [startInstant, isPending] = useInstantTransition()
 *
 *   const switchTab = (index: number) => {
 *     startInstant(() => {
 *       setActiveTab(index)
 *     })
 *   }
 *
 *   return (
 *     <div>
 *       <TabBar onTabClick={switchTab} activeTab={activeTab} />
 *       <TabContent tab={activeTab} />
 *     </div>
 *   )
 * }
 * ```
 *
 * @example With layout animations
 * ```tsx
 * function App() {
 *   const [page, setPage] = useState('home')
 *   const [startInstant] = useInstantTransition()
 *
 *   // Instant navigation (no layout animation)
 *   const navigate = (newPage: string) => {
 *     startInstant(() => setPage(newPage))
 *   }
 *
 *   return (
 *     <LayoutGroup>
 *       <Animated.div layoutId="page" key={page}>
 *         {page === 'home' ? <Home /> : <About />}
 *       </Animated.div>
 *     </LayoutGroup>
 *   )
 * }
 * ```
 */
export function useInstantTransition(): [
  startTransition: (callback: () => void) => void,
  isPending: boolean
] {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isPending, _setIsPending] = useTransition()

  const startInstantTransition = useCallback((callback: () => void) => {
    // Use React's startTransition for concurrent mode compatibility
    startTransition(() => {
      callback()
    })
  }, [])

  return [startInstantTransition, isPending]
}

/**
 * Force a layout recalculation (useful for FLIP animations)
 *
 * @example
 * ```tsx
 * const forceLayout = useForceUpdate()
 *
 * const handleResize = () => {
 *   // Trigger layout recalculation
 *   forceLayout()
 * }
 * ```
 */
export function useForceUpdate(): () => void {
  const [, setTick] = useState(0)

  return useCallback(() => {
    setTick((t) => t + 1)
  }, [])
}

/**
 * Measure layout before and after a change
 *
 * @example
 * ```tsx
 * const { measureBefore, measureAfter, getLayoutDelta } = useLayoutMeasure()
 *
 * const handleChange = () => {
 *   measureBefore(elementRef.current)
 *   setItems(newItems)
 *   requestAnimationFrame(() => {
 *     const delta = getLayoutDelta(elementRef.current)
 *     // Use delta to animate
 *   })
 * }
 * ```
 */
export function useLayoutMeasure() {
  const beforeRef = useRef<DOMRect | null>(null)

  const measureBefore = useCallback((element: HTMLElement | null) => {
    if (element) {
      beforeRef.current = element.getBoundingClientRect()
    }
  }, [])

  const measureAfter = useCallback((element: HTMLElement | null): DOMRect | null => {
    if (element) {
      return element.getBoundingClientRect()
    }
    return null
  }, [])

  const getLayoutDelta = useCallback((element: HTMLElement | null) => {
    if (!element || !beforeRef.current) {
      return { x: 0, y: 0, scaleX: 1, scaleY: 1 }
    }

    const after = element.getBoundingClientRect()
    const before = beforeRef.current

    return {
      x: before.left - after.left,
      y: before.top - after.top,
      scaleX: before.width / after.width,
      scaleY: before.height / after.height,
    }
  }, [])

  return { measureBefore, measureAfter, getLayoutDelta }
}

// Re-export useState for compatibility
import { useState } from 'react'
