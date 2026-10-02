import { useState, useRef, useEffect, useCallback, type RefObject } from 'react'
import { isBrowser } from '../utils/ssr.js'
import { useElementEffect } from './useElementEffect.js'

function hasIntersectionObserver(): boolean {
  return typeof IntersectionObserver !== 'undefined'
}

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

  // Re-attaches when the observed element (or root) changes - including an
  // element that mounts after the hook first ran (conditional rendering)
  useElementEffect(() => {
    // SSR safety
    if (!isBrowser) return

    const element = ref.current
    if (!element) return

    // Skip if already triggered with once option
    if (once && hasTriggered.current) return

    // No IntersectionObserver (old browsers / some WebViews): treat the element
    // as visible rather than throwing, so in-view gated content still appears
    if (!hasIntersectionObserver()) {
      hasTriggered.current = true
      setInView(true)
      return
    }

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
  }, () => [ref.current, root?.current ?? null, once, amount, margin])

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

  // Re-attaches when the observed element (or root) changes - including an
  // element that mounts after the hook first ran (conditional rendering)
  useElementEffect(() => {
    if (!isBrowser) return

    const element = ref.current
    if (!element) return

    if (once && hasTriggered.current) return
    if (!hasIntersectionObserver()) return

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
  }, () => [ref.current, root?.current ?? null, once, amount, margin])

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
  // Elements whose ref was detached; removed for real in a microtask unless the
  // same id is re-attached first (inline ref callbacks detach/attach every render)
  const detachedRef = useRef<Map<string, HTMLElement>>(new Map())
  // Ids that already entered the viewport while `once` is enabled
  const triggeredRef = useRef<Set<string>>(new Set())

  const { once = false, amount = 'some', margin = '0px', root } = options
  const onceRef = useRef(once)
  onceRef.current = once

  useEffect(() => {
    if (!isBrowser || !hasIntersectionObserver()) return

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
        const updates: Array<[string, boolean]> = []

        entries.forEach((entry) => {
          const id = (entry.target as HTMLElement).dataset.inviewId
          if (!id) return
          updates.push([id, entry.isIntersecting])

          if (entry.isIntersecting && once) {
            triggeredRef.current.add(id)
            observer.unobserve(entry.target)
          }
        })

        if (updates.length === 0) return

        setInViewMap((prev) => {
          // Keep the same Map when nothing changed to avoid needless re-renders
          if (updates.every(([id, value]) => prev.get(id) === value)) return prev
          const next = new Map(prev)
          updates.forEach(([id, value]) => next.set(id, value))
          return next
        })
      },
      {
        root: root?.current ?? null,
        rootMargin: margin,
        threshold,
      }
    )
    observerRef.current = observer

    // Observe all registered elements
    elementsRef.current.forEach((element, id) => {
      if (once && triggeredRef.current.has(id)) return
      observer.observe(element)
    })

    return () => {
      observer.disconnect()
      if (observerRef.current === observer) {
        observerRef.current = null
      }
    }
  }, [once, amount, margin, root])

  const setRef = useCallback((id: string, element: HTMLElement | null) => {
    const elements = elementsRef.current
    const detached = detachedRef.current

    if (element) {
      // Re-attached within the same commit: keep the existing observation
      const pending = detached.get(id)
      if (pending !== undefined) {
        detached.delete(id)
        if (pending === element) {
          elements.set(id, element)
          return
        }
        observerRef.current?.unobserve(pending)
      }

      const existing = elements.get(id)
      if (existing === element) return
      if (existing) observerRef.current?.unobserve(existing)

      element.dataset.inviewId = id
      elements.set(id, element)
      if (!(onceRef.current && triggeredRef.current.has(id))) {
        observerRef.current?.observe(element)
      }
      return
    }

    const existing = elements.get(id)
    if (!existing) return
    elements.delete(id)
    detached.set(id, existing)

    queueMicrotask(() => {
      // Re-attached (or replaced) in the meantime
      if (detached.get(id) !== existing) return
      detached.delete(id)
      observerRef.current?.unobserve(existing)
      // Also remove from inViewMap to prevent memory leak
      setInViewMap((prev) => {
        if (!prev.has(id)) return prev
        const next = new Map(prev)
        next.delete(id)
        return next
      })
    })
  }, [])

  const getInView = (id: string): boolean => {
    return inViewMap.get(id) ?? false
  }

  return { setRef, getInView, inViewMap }
}
