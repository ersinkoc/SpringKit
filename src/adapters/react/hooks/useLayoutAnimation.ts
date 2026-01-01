/**
 * React hooks for layout animations (FLIP)
 */
import { useRef, useCallback, createContext, type ReactNode, type RefCallback } from 'react'
import React from 'react'
import {
  createLayoutGroup,
  createSharedLayoutContext,
  createAutoLayout,
  measureElement,
  flip,
  type LayoutAnimationConfig,
  type LayoutGroup,
  type SharedLayoutContext,
  type AutoLayoutConfig,
  type LayoutMeasurement,
  type FlipOptions,
} from '../../../index.js'
import { useIsomorphicLayoutEffect } from '../utils/ssr.js'

// ============ Context ============

const LayoutGroupContext = createContext<LayoutGroup | null>(null)
const SharedLayoutContextReact = createContext<SharedLayoutContext | null>(null)

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
  const layoutGroupRef = useRef<LayoutGroup | null>(null)

  useIsomorphicLayoutEffect(() => {
    const layoutGroup = createLayoutGroup(options)
    layoutGroupRef.current = layoutGroup

    return () => {
      layoutGroup.destroy()
    }
  }, [])

  const register = useCallback((id: string, element: HTMLElement) => {
    layoutGroupRef.current?.register(id, element)
  }, [])

  const unregister = useCallback((id: string, element: HTMLElement) => {
    layoutGroupRef.current?.unregister(id, element)
  }, [])

  const update = useCallback(() => {
    layoutGroupRef.current?.update()
  }, [])

  const forceUpdate = useCallback(() => {
    layoutGroupRef.current?.forceUpdate()
  }, [])

  return {
    register,
    unregister,
    update,
    forceUpdate,
    layoutGroup: layoutGroupRef.current,
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
  const localGroupRef = useRef<LayoutGroup | null>(null)

  // Create local group if none provided
  useIsomorphicLayoutEffect(() => {
    if (!group) {
      localGroupRef.current = createLayoutGroup(config)
      return () => {
        localGroupRef.current?.destroy()
      }
    }
  }, [group])

  const ref = useCallback(
    (element: HTMLElement | null) => {
      const activeGroup = group ?? localGroupRef.current

      if (elementRef.current && activeGroup) {
        activeGroup.unregister(layoutId, elementRef.current)
      }

      elementRef.current = element

      if (element && activeGroup) {
        activeGroup.register(layoutId, element)
      }
    },
    [layoutId, group]
  )

  const update = useCallback(() => {
    const activeGroup = group ?? localGroupRef.current
    activeGroup?.update()
  }, [group])

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

  const ref = useCallback((element: HTMLElement | null) => {
    if (element) {
      lastMeasurementRef.current = measureElement(element)
    }
    elementRef.current = element
  }, [])

  const flipFn = useCallback(async (mutate?: () => void) => {
    if (!elementRef.current) return

    await flip(elementRef.current, mutate ?? (() => {}), options)

    lastMeasurementRef.current = measureElement(elementRef.current)
  }, [options])

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

  const containerRef = useCallback((element: HTMLElement | null) => {
    if (autoLayoutRef.current) {
      autoLayoutRef.current.destroy()
      autoLayoutRef.current = null
    }

    if (element) {
      autoLayoutRef.current = createAutoLayout(options)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
  const layoutGroupRef = useRef<LayoutGroup | null>(null)

  useIsomorphicLayoutEffect(() => {
    layoutGroupRef.current = createLayoutGroup(config)

    return () => {
      layoutGroupRef.current?.destroy()
    }
  }, [])

  return React.createElement(
    LayoutGroupContext.Provider,
    { value: layoutGroupRef.current },
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
  const sharedContextRef = useRef<SharedLayoutContext | null>(null)

  useIsomorphicLayoutEffect(() => {
    sharedContextRef.current = createSharedLayoutContext()

    return () => {
      sharedContextRef.current?.destroy()
    }
  }, [])

  return React.createElement(
    SharedLayoutContextReact.Provider,
    { value: sharedContextRef.current },
    children
  )
}

// ============ Export context for advanced use ============

export { LayoutGroupContext, SharedLayoutContextReact }
