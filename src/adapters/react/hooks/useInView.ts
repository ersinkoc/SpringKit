import { useState, useRef, useEffect, type RefObject } from 'react'
import { isBrowser } from '../utils/ssr.js'

export interface UseInViewOptions {
  /**
   * Only trigger once when element enters viewport
   * @default false
   */
  once?: boolean

  /**
   * How much of the element should be visible
   * - 'some': Any part visible (default)
   * - 'all': Entire element visible
   * - number: Percentage (0-1)
   * @default 'some'
   */
  amount?: 'some' | 'all' | number

  /**
   * Margin around the root (viewport)
   * Same format as CSS margin: "10px" or "10px 20px" etc.
   * @default "0px"
   */
  margin?: string

  /**
   * Root element for intersection (null = viewport)
   */
  root?: RefObject<Element | null>
}

export interface UseInViewReturn {
  /** Ref to attach to the target element */
  ref: RefObject<HTMLElement | null>
  /** Whether the element is currently in view */
  inView: boolean
  /** IntersectionObserverEntry for advanced usage */
  entry?: IntersectionObserverEntry
}

/**
 * Detect when an element enters/exits the viewport
 *
 * SSR-safe: Returns false on server, activates on client.
 *
 * @example Basic usage
 * ```tsx
 * function AnimatedBox() {
 *   const { ref, inView } = useInView()
 *
 *   return (
 *     <div
 *       ref={ref}
 *       style={{ opacity: inView ? 1 : 0 }}
 *     >
 *       I fade in when visible
 *     </div>
 *   )
 * }
 * ```
 *
 * @example Trigger once
 * ```tsx
 * function LazyLoad() {
 *   const { ref, inView } = useInView({ once: true })
 *
 *   return (
 *     <div ref={ref}>
 *       {inView && <ExpensiveComponent />}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example With amount threshold
 * ```tsx
 * function FullyVisible() {
 *   const { ref, inView } = useInView({ amount: 'all' })
 *   // or amount: 0.5 for 50% visible
 * }
 * ```
 */
export function useInView(options: UseInViewOptions = {}): UseInViewReturn {
  const {
    once = false,
    amount = 'some',
    margin = '0px',
    root,
  } = options

  const ref = useRef<HTMLElement | null>(null)
  const [inView, setInView] = useState(false)
  const [entry, setEntry] = useState<IntersectionObserverEntry | undefined>()
  const hasTriggered = useRef(false)

  useEffect(() => {
    // SSR safety
    if (!isBrowser) return

    const element = ref.current
    if (!element) return

    // Skip if already triggered with once option
    if (once && hasTriggered.current) return

    // Calculate threshold
    let threshold: number | number[]
    if (amount === 'some') {
      threshold = 0
    } else if (amount === 'all') {
      threshold = 1
    } else {
      threshold = amount
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [observerEntry] = entries

        if (observerEntry) {
          const isIntersecting = observerEntry.isIntersecting

          setEntry(observerEntry)
          setInView(isIntersecting)

          if (isIntersecting && once) {
            hasTriggered.current = true
            observer.disconnect()
          }
        }
      },
      {
        root: root?.current ?? null,
        rootMargin: margin,
        threshold,
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [once, amount, margin, root])

  return { ref, inView, entry }
}

/**
 * Create an InView trigger with a callback
 *
 * @example
 * ```tsx
 * function LazyImage({ src }) {
 *   const [loaded, setLoaded] = useState(false)
 *   const ref = useInViewCallback(() => setLoaded(true), { once: true })
 *
 *   return (
 *     <div ref={ref}>
 *       {loaded ? <img src={src} /> : <Placeholder />}
 *     </div>
 *   )
 * }
 * ```
 */
export function useInViewCallback(
  callback: (entry: IntersectionObserverEntry) => void,
  options: UseInViewOptions = {}
): RefObject<HTMLElement | null> {
  const ref = useRef<HTMLElement | null>(null)
  const callbackRef = useRef(callback)
  const hasTriggered = useRef(false)

  // Keep callback ref updated
  callbackRef.current = callback

  const { once = false, amount = 'some', margin = '0px', root } = options

  useEffect(() => {
    if (!isBrowser) return

    const element = ref.current
    if (!element) return

    if (once && hasTriggered.current) return

    let threshold: number
    if (amount === 'some') {
      threshold = 0
    } else if (amount === 'all') {
      threshold = 1
    } else {
      threshold = amount
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries

        if (entry?.isIntersecting) {
          callbackRef.current(entry)

          if (once) {
            hasTriggered.current = true
            observer.disconnect()
          }
        }
      },
      {
        root: root?.current ?? null,
        rootMargin: margin,
        threshold,
      }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [once, amount, margin, root])

  return ref
}

/**
 * Track multiple elements' visibility
 *
 * @example
 * ```tsx
 * function AnimatedList({ items }) {
 *   const { setRef, getInView } = useInViewMultiple({ stagger: 100 })
 *
 *   return (
 *     <ul>
 *       {items.map((item, i) => (
 *         <li
 *           key={item.id}
 *           ref={(el) => setRef(item.id, el)}
 *           style={{ opacity: getInView(item.id) ? 1 : 0 }}
 *         >
 *           {item.text}
 *         </li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 */
export function useInViewMultiple(options: UseInViewOptions = {}) {
  const elementsRef = useRef<Map<string, HTMLElement>>(new Map())
  const [inViewMap, setInViewMap] = useState<Map<string, boolean>>(new Map())
  const observerRef = useRef<IntersectionObserver | null>(null)

  const { once = false, amount = 'some', margin = '0px', root } = options

  useEffect(() => {
    if (!isBrowser) return

    let threshold: number
    if (amount === 'some') {
      threshold = 0
    } else if (amount === 'all') {
      threshold = 1
    } else {
      threshold = amount
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        setInViewMap((prev) => {
          const next = new Map(prev)

          entries.forEach((entry) => {
            const id = (entry.target as HTMLElement).dataset.inviewId
            if (id) {
              next.set(id, entry.isIntersecting)

              if (entry.isIntersecting && once) {
                observerRef.current?.unobserve(entry.target)
              }
            }
          })

          return next
        })
      },
      {
        root: root?.current ?? null,
        rootMargin: margin,
        threshold,
      }
    )

    // Observe all registered elements
    elementsRef.current.forEach((element) => {
      observerRef.current?.observe(element)
    })

    return () => {
      observerRef.current?.disconnect()
    }
  }, [once, amount, margin, root])

  const setRef = (id: string, element: HTMLElement | null) => {
    if (element) {
      element.dataset.inviewId = id
      elementsRef.current.set(id, element)
      observerRef.current?.observe(element)
    } else {
      const existing = elementsRef.current.get(id)
      if (existing) {
        observerRef.current?.unobserve(existing)
        elementsRef.current.delete(id)
      }
    }
  }

  const getInView = (id: string): boolean => {
    return inViewMap.get(id) ?? false
  }

  return { setRef, getInView, inViewMap }
}
