import * as React from 'react'
import {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react'
import { createSpringValue } from '@oxog/springkit'
import type { SpringConfig } from '@oxog/springkit'

// ============ Types ============

export interface ReorderGroupProps<T> {
  /** The list of items to render */
  values: T[]
  /** Callback when items are reordered */
  onReorder: (newOrder: T[]) => void
  /** Axis of reordering */
  axis?: 'x' | 'y'
  /** Spring configuration for animations */
  config?: SpringConfig
  /** CSS class name */
  className?: string
  /** Inline styles */
  style?: React.CSSProperties
  /** Children (must be Reorder.Item components) */
  children: React.ReactNode
  /** Element type to render */
  as?: keyof React.JSX.IntrinsicElements
  /** Layout animation duration in ms (0 to disable) */
  layoutDuration?: number
}

export interface ReorderItemProps<T> {
  /** The value this item represents */
  value: T
  /** CSS class name */
  className?: string
  /** Inline styles */
  style?: React.CSSProperties
  /** Children content */
  children: React.ReactNode
  /** Element type to render */
  as?: keyof React.JSX.IntrinsicElements
  /** Whether this item can be dragged */
  dragEnabled?: boolean
  /** Callback when drag starts */
  onDragStart?: () => void
  /** Callback when drag ends */
  onDragEnd?: () => void
}

interface ReorderContextValue<T = unknown> {
  values: T[]
  axis: 'x' | 'y'
  config: SpringConfig
  registerItem: (value: T, element: HTMLElement) => void
  unregisterItem: (value: T) => void
  onDragStart: (value: T) => void
  onDrag: (value: T, offset: number) => void
  onDragEnd: (value: T) => void
  /** Move an item directly to a new index (used for keyboard reordering) */
  moveItem: (value: T, toIndex: number) => void
  getDraggingValue: () => T | null
  getItemOffset: (value: T) => number
  layoutDuration: number
}

// ============ Context ============

const DEFAULT_REORDER_CONFIG: SpringConfig = { stiffness: 300, damping: 30 }

const ReorderContext = createContext<ReorderContextValue | null>(null)

function useReorderContext<T>(): ReorderContextValue<T> {
  const context = useContext(ReorderContext)
  if (!context) {
    throw new Error('Reorder.Item must be used within a Reorder.Group')
  }
  return context as ReorderContextValue<T>
}

// ============ Reorder.Group ============

function ReorderGroupComponent<T>(
  {
    values,
    onReorder,
    axis = 'y',
    config = DEFAULT_REORDER_CONFIG,
    className,
    style,
    children,
    as: Component = 'ul',
    layoutDuration = 200,
  }: ReorderGroupProps<T>,
  ref: React.Ref<HTMLElement>
) {
  const itemsRef = useRef<Map<T, HTMLElement>>(new Map())
  const sizesRef = useRef<Map<T, number>>(new Map())
  const [draggingValue, setDraggingValue] = useState<T | null>(null)
  const [offsets, setOffsetsState] = useState<Map<T, number>>(new Map())
  // Mirror of offsets so drag end always sees the latest values, even if the
  // last pointermove's state update hasn't been rendered yet
  const offsetsRef = useRef<Map<T, number>>(offsets)
  const setOffsets = useCallback((next: Map<T, number>) => {
    offsetsRef.current = next
    setOffsetsState(next)
  }, [])
  const dragStartIndexRef = useRef<number>(-1)
  const currentOrderRef = useRef<T[]>(values)
  const onReorderRef = useRef(onReorder)
  onReorderRef.current = onReorder

  // Keep order in sync with values
  useEffect(() => {
    currentOrderRef.current = values
  }, [values])

  // Register an item's element
  const registerItem = useCallback((value: T, element: HTMLElement) => {
    itemsRef.current.set(value, element)
    const rect = element.getBoundingClientRect()
    sizesRef.current.set(value, axis === 'y' ? rect.height : rect.width)
  }, [axis])

  // Unregister an item
  const unregisterItem = useCallback((value: T) => {
    itemsRef.current.delete(value)
    sizesRef.current.delete(value)
  }, [])

  // Handle drag start
  const handleDragStart = useCallback((value: T) => {
    setDraggingValue(value)
    dragStartIndexRef.current = currentOrderRef.current.indexOf(value)

    // Re-measure item sizes (layout may have changed since they registered)
    itemsRef.current.forEach((element, itemValue) => {
      const rect = element.getBoundingClientRect()
      sizesRef.current.set(itemValue, axis === 'y' ? rect.height : rect.width)
    })
  }, [axis])

  // Handle drag movement
  const handleDrag = useCallback((value: T, offset: number) => {
    const currentIndex = currentOrderRef.current.indexOf(value)
    if (currentIndex === -1) return

    const sizes = sizesRef.current
    const order = [...currentOrderRef.current]

    // Calculate which items need to shift
    const newOffsets = new Map<T, number>()
    let accumulatedOffset = 0

    const itemSize = sizes.get(value) || 0

    if (offset > 0) {
      // Moving forward
      for (let i = currentIndex + 1; i < order.length; i++) {
        const otherValue = order[i]
        if (otherValue === undefined) continue
        const otherSize = sizes.get(otherValue) || 0
        accumulatedOffset += otherSize

        if (offset > accumulatedOffset - otherSize / 2) {
          newOffsets.set(otherValue, -itemSize)
        } else {
          newOffsets.set(otherValue, 0)
        }
      }
    } else if (offset < 0) {
      // Moving backward
      for (let i = currentIndex - 1; i >= 0; i--) {
        const otherValue = order[i]
        if (otherValue === undefined) continue
        const otherSize = sizes.get(otherValue) || 0
        accumulatedOffset -= otherSize

        if (offset < accumulatedOffset + otherSize / 2) {
          newOffsets.set(otherValue, itemSize)
        } else {
          newOffsets.set(otherValue, 0)
        }
      }
    }

    setOffsets(newOffsets)
  }, [setOffsets])

  // Handle drag end
  const handleDragEnd = useCallback((value: T) => {
    const currentIndex = currentOrderRef.current.indexOf(value)
    if (currentIndex === -1) {
      setDraggingValue(null)
      setOffsets(new Map())
      return
    }

    // Calculate final order based on offsets
    const order = [...currentOrderRef.current]

    // Find items that were shifted
    let targetIndex = currentIndex
    offsetsRef.current.forEach((offset, otherValue) => {
      const otherIndex = order.indexOf(otherValue)
      if (offset < 0 && otherIndex > currentIndex) {
        // Item moved backward, we move forward
        targetIndex = Math.max(targetIndex, otherIndex)
      } else if (offset > 0 && otherIndex < currentIndex) {
        // Item moved forward, we move backward
        targetIndex = Math.min(targetIndex, otherIndex)
      }
    })

    // Create new order if changed
    if (targetIndex !== currentIndex) {
      const newOrder = [...order]
      const [removed] = newOrder.splice(currentIndex, 1)
      if (removed !== undefined) {
        newOrder.splice(targetIndex, 0, removed)
        onReorderRef.current(newOrder)
      }
    }

    setDraggingValue(null)
    setOffsets(new Map())
  }, [setOffsets])

  // Move an item directly to a new index
  const moveItem = useCallback((value: T, toIndex: number) => {
    const order = [...currentOrderRef.current]
    const fromIndex = order.indexOf(value)
    if (fromIndex === -1) return
    const clampedIndex = Math.max(0, Math.min(order.length - 1, toIndex))
    if (clampedIndex === fromIndex) return
    order.splice(fromIndex, 1)
    order.splice(clampedIndex, 0, value)
    onReorderRef.current(order)
  }, [])

  // Get dragging value
  const getDraggingValue = useCallback(() => draggingValue, [draggingValue])

  // Get item offset
  const getItemOffset = useCallback((value: T) => offsets.get(value) || 0, [offsets])

  const contextValue = useMemo<ReorderContextValue<T>>(() => ({
    values,
    axis,
    config,
    registerItem,
    unregisterItem,
    onDragStart: handleDragStart,
    onDrag: handleDrag,
    onDragEnd: handleDragEnd,
    moveItem,
    getDraggingValue,
    getItemOffset,
    layoutDuration,
  }), [
    values,
    axis,
    config,
    registerItem,
    unregisterItem,
    handleDragStart,
    handleDrag,
    handleDragEnd,
    moveItem,
    getDraggingValue,
    getItemOffset,
    layoutDuration,
  ])

  return React.createElement(
    ReorderContext.Provider,
    { value: contextValue as ReorderContextValue },
    React.createElement(
      Component as string,
      {
        ref,
        className,
        role: 'listbox',
        'aria-label': 'Reorderable list',
        'aria-orientation': axis === 'x' ? 'horizontal' : 'vertical',
        style: {
          listStyle: 'none',
          padding: 0,
          margin: 0,
          ...style,
        },
      },
      children
    )
  )
}

// ============ Reorder.Item ============

function ReorderItemComponent<T>(
  {
    value,
    className,
    style,
    children,
    as: Component = 'li',
    dragEnabled = true,
    onDragStart,
    onDragEnd,
  }: ReorderItemProps<T>,
  ref: React.Ref<HTMLElement>
) {
  const context = useReorderContext<T>()
  const { registerItem, unregisterItem } = context
  const elementRef = useRef<HTMLElement | null>(null)
  const springRef = useRef<ReturnType<typeof createSpringValue> | null>(null)
  const [offset, setOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  // Ref mirror so pointer handlers see the drag state before React re-renders
  const isDraggingRef = useRef(false)
  // Pointer position (client coordinates) when the drag started
  const dragStartPos = useRef({ x: 0, y: 0 })
  const dragOffset = useRef(0)

  // Combine refs
  const setRef = useCallback((node: HTMLElement | null) => {
    elementRef.current = node
    if (typeof ref === 'function') {
      ref(node)
    } else if (ref) {
      (ref as React.MutableRefObject<HTMLElement | null>).current = node
    }
  }, [ref])

  // Register with the group. Only re-run when the value (or the stable
  // register functions) change - not on every context update, which would
  // drop the item's measured size in the middle of a drag.
  useEffect(() => {
    const element = elementRef.current
    if (element) registerItem(value, element)
    return () => {
      unregisterItem(value)
    }
  }, [value, registerItem, unregisterItem])

  // Destroy spring on unmount
  useEffect(() => {
    return () => {
      springRef.current?.destroy()
      springRef.current = null
    }
  }, [])

  // Animate offset changes from other items being dragged
  const targetOffset = context.getItemOffset(value)
  const springConfig = context.config
  // Index in the list: when it changes (the drop reordered the list), the
  // displacement offset is replaced by the new DOM position, so the offset
  // must jump instead of sliding back from the displaced position
  const index = context.values.indexOf(value)
  const indexRef = useRef(index)
  useEffect(() => {
    const moved = indexRef.current !== index
    indexRef.current = index
    if (isDragging) return // Don't animate if we're the one dragging

    if (!springRef.current) {
      springRef.current = createSpringValue(0, {
        ...springConfig,
        onUpdate: setOffset,
      })
    }

    if (moved) {
      springRef.current.jump(targetOffset)
      setOffset(targetOffset)
    } else {
      springRef.current.set(targetOffset)
    }
  }, [targetOffset, isDragging, springConfig, index])

  // Handle pointer down
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!dragEnabled) return

    e.preventDefault()
    e.stopPropagation()
    isDraggingRef.current = true
    setIsDragging(true)
    springRef.current?.stop()
    onDragStart?.()
    context.onDragStart(value)

    dragStartPos.current = { x: e.clientX, y: e.clientY }
    dragOffset.current = 0

    // Set pointer capture on the actual element ref for reliable drag tracking
    const element = elementRef.current
    if (element && typeof element.setPointerCapture === 'function') {
      try {
        element.setPointerCapture(e.pointerId)
      } catch {
        // Pointer may no longer be active
      }
    }
  }, [dragEnabled, context, value, onDragStart])

  // Handle pointer move
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return

    // Offset is the pointer movement since the drag started
    dragOffset.current = context.axis === 'y'
      ? e.clientY - dragStartPos.current.y
      : e.clientX - dragStartPos.current.x
    context.onDrag(value, dragOffset.current)

    // Update visual position
    setOffset(dragOffset.current)
  }, [context, value])

  // Handle pointer up
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false

    // Release pointer capture on the element ref
    const element = elementRef.current
    if (element && typeof element.releasePointerCapture === 'function') {
      try {
        element.releasePointerCapture(e.pointerId)
      } catch {
        // Capture may already have been released (e.g. pointercancel)
      }
    }

    setIsDragging(false)
    onDragEnd?.()
    context.onDragEnd(value)

    // Animate back to final position
    springRef.current?.jump(0)
    setOffset(0)
    dragOffset.current = 0
  }, [context, value, onDragEnd])

  const transformProp = context.axis === 'y'
    ? `translateY(${offset}px)`
    : `translateX(${offset}px)`

  // Handle keyboard navigation for accessibility
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!dragEnabled) return

    const currentIndex = context.values.indexOf(value)
    if (currentIndex === -1) return

    let newIndex = currentIndex
    const isVertical = context.axis === 'y'

    switch (e.key) {
      case 'ArrowUp':
        if (isVertical && currentIndex > 0) {
          newIndex = currentIndex - 1
          e.preventDefault()
        }
        break
      case 'ArrowDown':
        if (isVertical && currentIndex < context.values.length - 1) {
          newIndex = currentIndex + 1
          e.preventDefault()
        }
        break
      case 'ArrowLeft':
        if (!isVertical && currentIndex > 0) {
          newIndex = currentIndex - 1
          e.preventDefault()
        }
        break
      case 'ArrowRight':
        if (!isVertical && currentIndex < context.values.length - 1) {
          newIndex = currentIndex + 1
          e.preventDefault()
        }
        break
      case 'Home':
        newIndex = 0
        e.preventDefault()
        break
      case 'End':
        newIndex = context.values.length - 1
        e.preventDefault()
        break
    }

    // Move item if index changed
    if (newIndex !== currentIndex) {
      context.moveItem(value, newIndex)
    }
  }, [dragEnabled, context, value])

  return React.createElement(
    Component as string,
    {
      ref: setRef,
      className,
      role: 'option',
      'aria-selected': isDragging,
      'aria-grabbed': isDragging,
      tabIndex: dragEnabled ? 0 : -1,
      style: {
        transform: transformProp,
        transition: !isDragging && context.layoutDuration > 0
          ? `transform ${context.layoutDuration}ms ease-out`
          : undefined,
        cursor: dragEnabled ? (isDragging ? 'grabbing' : 'grab') : undefined,
        userSelect: 'none',
        touchAction: 'none',
        zIndex: isDragging ? 1 : 0,
        position: 'relative',
        ...style,
      },
      onPointerDown: dragEnabled ? handlePointerDown : undefined,
      onPointerMove: dragEnabled ? handlePointerMove : undefined,
      onPointerUp: dragEnabled ? handlePointerUp : undefined,
      onPointerCancel: dragEnabled ? handlePointerUp : undefined,
      onKeyDown: dragEnabled ? handleKeyDown : undefined,
    },
    children
  )
}

// ============ Export ============

const ReorderGroupWithRef = React.forwardRef(ReorderGroupComponent)
ReorderGroupWithRef.displayName = 'Reorder.Group'

const ReorderItemWithRef = React.forwardRef(ReorderItemComponent)
ReorderItemWithRef.displayName = 'Reorder.Item'

const ReorderGroup = ReorderGroupWithRef as <T>(
  props: ReorderGroupProps<T> & { ref?: React.Ref<HTMLElement> }
) => React.ReactElement

const ReorderItem = ReorderItemWithRef as <T>(
  props: ReorderItemProps<T> & { ref?: React.Ref<HTMLElement> }
) => React.ReactElement

/**
 * Drag-to-reorder components
 *
 * @example Basic usage
 * ```tsx
 * function ReorderableList() {
 *   const [items, setItems] = useState(['A', 'B', 'C', 'D'])
 *
 *   return (
 *     <Reorder.Group values={items} onReorder={setItems}>
 *       {items.map((item) => (
 *         <Reorder.Item key={item} value={item}>
 *           {item}
 *         </Reorder.Item>
 *       ))}
 *     </Reorder.Group>
 *   )
 * }
 * ```
 *
 * @example Horizontal reordering
 * ```tsx
 * <Reorder.Group
 *   axis="x"
 *   values={tabs}
 *   onReorder={setTabs}
 *   style={{ display: 'flex' }}
 * >
 *   {tabs.map((tab) => (
 *     <Reorder.Item key={tab.id} value={tab}>
 *       {tab.title}
 *     </Reorder.Item>
 *   ))}
 * </Reorder.Group>
 * ```
 *
 * @example With custom styling
 * ```tsx
 * <Reorder.Group
 *   values={items}
 *   onReorder={setItems}
 *   config={{ stiffness: 400, damping: 25 }}
 * >
 *   {items.map((item) => (
 *     <Reorder.Item
 *       key={item.id}
 *       value={item}
 *       className="reorder-item"
 *       onDragStart={() => console.log('Started dragging', item)}
 *       onDragEnd={() => console.log('Stopped dragging', item)}
 *     >
 *       <GripIcon />
 *       <span>{item.name}</span>
 *     </Reorder.Item>
 *   ))}
 * </Reorder.Group>
 * ```
 */
export const Reorder = {
  Group: ReorderGroup,
  Item: ReorderItem,
}
