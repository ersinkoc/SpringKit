/**
 * React hooks for layout animations (FLIP)
 */
import { useRef, useCallback, useState, createContext, type ReactNode, type RefCallback } from 'react'
import * as React from 'react'
import {
  createLayoutGroup,
  createSharedLayoutContext,
  createAutoLayout,
  measureElement,
  flip,
  createFlip,
  type LayoutAnimationConfig,
  type LayoutGroup,
  type SharedLayoutContext,
  type AutoLayoutConfig,
  type LayoutMeasurement,
  type FlipOptions,
} from '@oxog/springkit'
import { useDestroyOnUnmount } from './useDestroyOnUnmount.js'

// ============ Context ============

const LayoutGroupContext = createContext<LayoutGroup | null>(null)
const SharedLayoutContextReact = createContext<SharedLayoutContext | null>(null)

/**
 * Animation callbacks that call the latest `config` stored in `ref`.
 *
 * The layout groups are created once (first render) and read their config only
 * then, so a callback passed inline would stay bound to the first render's
 * closure. Spread this over the config instead.
 */
function latestCallbacks(
  ref: { readonly current: LayoutAnimationConfig | undefined }
): Pick<LayoutAnimationConfig, 'onAnimationStart' | 'onAnimationComplete'> {
  return {
    onAnimationStart: (id) => ref.current?.onAnimationStart?.(id),
    onAnimationComplete: (id) => ref.current?.onAnimationComplete?.(id),
  }
}

// ============ useLayoutGroup ============

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UseLayoutGroupOptions extends LayoutAnimationConfig {}

export interface UseLayoutGroupReturn {
  /** Register an element with a layoutId */
  register: (id: string, element: HTMLElement) => void
  /** Unregister an element */
  unregister: (id: string, element: HTMLElement) => void
  /** Trigger layout update */
  update: () => void
  /** Force re-measure all elements */
  forceUpdate: () => void
  /** The layout group controller */
  layoutGroup: LayoutGroup | null
}

/**
 * Create a layout animation group
 *
 * @example
 * ```tsx
 * function ReorderableList({ items }) {
 *   const { register, unregister, update } = useLayoutGroup()
 *
 *   const handleReorder = () => {
 *     // Reorder items...
 *     update()
 *   }
 *
 *   return (
 *     <ul>
 *       {items.map((item) => (
 *         <li
 *           key={item.id}
 *           ref={(el) => {
 *             if (el) register(item.id, el)
 *           }}
 *         >
 *           {item.name}
 *         </li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 */
export function useLayoutGroup(
  options: UseLayoutGroupOptions = {}
): UseLayoutGroupReturn {
  // Created during the first render (it only allocates bookkeeping maps) so it
  // already exists when children's ref callbacks call register() in the
  // initial commit - those run before this component's layout effects
  const optionsRef = useRef(options)
  optionsRef.current = options
  const [layoutGroup] = useState(() =>
    createLayoutGroup({ ...options, ...latestCallbacks(optionsRef) })
  )

  useDestroyOnUnmount(() => {
    layoutGroup.destroy()
  })

  const register = useCallback((id: string, element: HTMLElement) => {
    layoutGroup.register(id, element)
  }, [layoutGroup])

  const unregister = useCallback((id: string, element: HTMLElement) => {
    layoutGroup.unregister(id, element)
  }, [layoutGroup])

  const update = useCallback(() => {
    layoutGroup.update()
  }, [layoutGroup])

  const forceUpdate = useCallback(() => {
    layoutGroup.forceUpdate()
  }, [layoutGroup])

  return {
    register,
    unregister,
    update,
    forceUpdate,
    layoutGroup,
  }
}

// ============ useLayoutId ============

export interface UseLayoutIdOptions extends LayoutAnimationConfig {
  /** The layout group to use (from useLayoutGroup) */
  group?: LayoutGroup | null
}

export interface UseLayoutIdReturn {
  /** Ref callback to attach to the element */
  ref: RefCallback<HTMLElement>
  /** Manually trigger layout update */
  update: () => void
}

/**
 * Register an element with a layout ID for shared animations
 *
 * @example
 * ```tsx
 * function Card({ id, layoutGroup }) {
 *   const { ref } = useLayoutId(id, { group: layoutGroup })
 *
 *   return <div ref={ref}>Card {id}</div>
 * }
 * ```
 */
export function useLayoutId(
  layoutId: string,
  options: UseLayoutIdOptions = {}
): UseLayoutIdReturn {
  const { group, ...config } = options
  const elementRef = useRef<HTMLElement | null>(null)

  // Local group used when none is provided. Created during render so it exists
  // when the ref callback runs in the initial commit (before layout effects).
  const optionsRef = useRef(options)
  optionsRef.current = options
  const [localGroup] = useState(() =>
    createLayoutGroup({ ...config, ...latestCallbacks(optionsRef) })
  )

  useDestroyOnUnmount(() => {
    localGroup.destroy()
  })

  const ref = useCallback(
    (element: HTMLElement | null) => {
      const activeGroup = group ?? localGroup

      if (elementRef.current && activeGroup) {
        activeGroup.unregister(layoutId, elementRef.current)
      }

      elementRef.current = element

      if (element && activeGroup) {
        activeGroup.register(layoutId, element)
      }
    },
    [layoutId, group, localGroup]
  )

  const update = useCallback(() => {
    const activeGroup = group ?? localGroup
    activeGroup.update()
  }, [group, localGroup])

  return { ref, update }
}

// ============ useFlip ============

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UseFlipOptions extends FlipOptions {}

export interface UseFlipReturn {
  /** Ref callback to attach to the element */
  ref: RefCallback<HTMLElement>
  /** Animate the element from its last position */
  flip: (mutate?: () => void) => Promise<void>
  /** Get current measurement */
  measure: () => LayoutMeasurement | null
}

/**
 * Create a FLIP animation for an element
 *
 * @example
 * ```tsx
 * function ExpandingCard({ isExpanded }) {
 *   const { ref, flip: flipAnim } = useFlip()
 *
 *   useEffect(() => {
 *     flipAnim()
 *   }, [isExpanded, flipAnim])
 *
 *   return (
 *     <div
 *       ref={ref}
 *       className={isExpanded ? 'expanded' : 'collapsed'}
 *     >
 *       Content
 *     </div>
 *   )
 * }
 * ```
 */
export function useFlip(options: UseFlipOptions = {}): UseFlipReturn {
  const elementRef = useRef<HTMLElement | null>(null)
  const lastMeasurementRef = useRef<LayoutMeasurement | null>(null)
  // Latest options without changing flip()'s identity (it is meant to be used
  // as an effect dependency; inline options would re-run that effect each render)
  const optionsRef = useRef(options)
  optionsRef.current = options

  const ref = useCallback((element: HTMLElement | null) => {
    if (element) {
      lastMeasurementRef.current = measureElement(element)
    }
    elementRef.current = element
  }, [])

  // The FLIP started by the latest flip() without `mutate`, and the number of
  // the latest flip() call (a superseded call must not refresh the measurement)
  const activeFlipRef = useRef<ReturnType<typeof createFlip> | null>(null)
  const callIdRef = useRef(0)

  const flipFn = useCallback(async (mutate?: () => void) => {
    const element = elementRef.current
    if (!element) return
    const callId = ++callIdRef.current

    if (mutate) {
      await flip(element, mutate, optionsRef.current)
    } else {
      // The layout already changed (e.g. flip() called from an effect after a
      // re-render): animate from the last known box to the current one
      let first = lastMeasurementRef.current ?? measureElement(element)
      let last: LayoutMeasurement
      const running = activeFlipRef.current
      if (running?.isAnimating()) {
        // A previous FLIP is still running. The box measured now has its
        // transform applied on top of the new layout, so stop it to measure
        // `last` without it, and start from where the element was shown: the
        // previous layout box moved by the running FLIP's offset/scale
        const shown = measureElement(element)
        running.cancel()
        last = measureElement(element)
        first = {
          x: first.x + (shown.x - last.x),
          y: first.y + (shown.y - last.y),
          width: last.width === 0 ? first.width : (first.width * shown.width) / last.width,
          height: last.height === 0 ? first.height : (first.height * shown.height) / last.height,
        }
      } else {
        last = measureElement(element)
      }
      // `last` is the layout box (no transform) to compare the next flip() with
      lastMeasurementRef.current = last
      const animation = createFlip(element, first, last, optionsRef.current)
      activeFlipRef.current = animation
      await animation.play()
      if (activeFlipRef.current === animation) activeFlipRef.current = null
    }

    // Superseded by a newer flip(): its transform is applied now, so measuring
    // would store a skewed box (the newer call refreshes it when it completes)
    if (callId === callIdRef.current && elementRef.current) {
      lastMeasurementRef.current = measureElement(elementRef.current)
    }
  }, [])

  const measure = useCallback(() => {
    if (!elementRef.current) return null
    return measureElement(elementRef.current)
  }, [])

  return { ref, flip: flipFn, measure }
}

// ============ useAutoLayout ============

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UseAutoLayoutOptions extends AutoLayoutConfig {}

export interface UseAutoLayoutReturn {
  /** Ref callback to attach to the container */
  containerRef: RefCallback<HTMLElement>
  /** Trigger layout update */
  update: () => void
  /** Force re-measure and animate */
  forceUpdate: () => void
}

/**
 * Automatically animate layout changes for child elements
 *
 * @example
 * ```tsx
 * function AutoAnimatedList({ items }) {
 *   const { containerRef, update } = useAutoLayout({
 *     spring: { stiffness: 150, damping: 15 },
 *   })
 *
 *   return (
 *     <ul ref={containerRef}>
 *       {items.map((item) => (
 *         <li key={item.id}>{item.name}</li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 */
export function useAutoLayout(
  options: UseAutoLayoutOptions = {}
): UseAutoLayoutReturn {
  const autoLayoutRef = useRef<ReturnType<typeof createAutoLayout> | null>(null)
  const optionsRef = useRef(options)
  optionsRef.current = options

  const containerRef = useCallback((element: HTMLElement | null) => {
    if (autoLayoutRef.current) {
      autoLayoutRef.current.destroy()
      autoLayoutRef.current = null
    }

    if (element) {
      // Observe the container this ref is attached to (not the whole document)
      const currentOptions = optionsRef.current
      autoLayoutRef.current = createAutoLayout({
        ...currentOptions,
        ...latestCallbacks(optionsRef),
        root: currentOptions.root ?? element,
      })
    }
  }, [])

  const update = useCallback(() => {
    autoLayoutRef.current?.update()
  }, [])

  const forceUpdate = useCallback(() => {
    autoLayoutRef.current?.forceUpdate()
  }, [])

  return { containerRef, update, forceUpdate }
}

// ============ LayoutGroup Provider ============

export interface LayoutGroupProviderProps {
  children: ReactNode
  config?: LayoutAnimationConfig
}

/**
 * Provider for layout group context
 */
export function LayoutGroupProvider({
  children,
  config,
}: LayoutGroupProviderProps): React.ReactElement {
  // Created during render so the context value is available to children on
  // the first render (a ref filled in an effect never reached the Provider)
  const configRef = useRef(config)
  configRef.current = config
  const [layoutGroup] = useState(() =>
    createLayoutGroup({ ...config, ...latestCallbacks(configRef) })
  )

  useDestroyOnUnmount(() => {
    layoutGroup.destroy()
  })

  return React.createElement(
    LayoutGroupContext.Provider,
    { value: layoutGroup },
    children
  )
}

// ============ SharedLayout Provider ============

export interface SharedLayoutProviderProps {
  children: ReactNode
  config?: LayoutAnimationConfig
}

/**
 * Provider for shared layout context
 */
export function SharedLayoutProvider({
  children,
}: SharedLayoutProviderProps): React.ReactElement {
  // Created during render so the context value is available to children on
  // the first render (a ref filled in an effect never reached the Provider)
  const [sharedContext] = useState(() => createSharedLayoutContext())

  useDestroyOnUnmount(() => {
    sharedContext.destroy()
  })

  return React.createElement(
    SharedLayoutContextReact.Provider,
    { value: sharedContext },
    children
  )
}

// ============ Export context for advanced use ============

export { LayoutGroupContext, SharedLayoutContextReact }
