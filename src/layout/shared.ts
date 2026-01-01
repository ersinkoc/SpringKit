/**
 * Shared Layout Animations - Cross-component FLIP animations with layoutId
 *
 * Enables smooth transitions between components that share the same layoutId,
 * similar to Framer Motion's layout animations.
 */

import { createSpringGroup, type SpringGroup } from '../core/spring-group.js'
import type { SpringConfig } from '../core/config.js'

// ============ Types ============

/**
 * Element measurement for FLIP
 */
export interface LayoutMeasurement {
  x: number
  y: number
  width: number
  height: number
  opacity?: number
  borderRadius?: number
  scaleX?: number
  scaleY?: number
}

/**
 * Shared layout element info
 */
interface SharedLayoutElement {
  id: string
  element: HTMLElement
  measurement: LayoutMeasurement
  spring: SpringGroup<Record<string, number>> | null
  isAnimating: boolean
  pendingRafId: number | null
}

/**
 * Layout animation configuration
 */
export interface LayoutAnimationConfig {
  /** Spring configuration */
  spring?: SpringConfig
  /** Duration hint for spring (optional) */
  duration?: number
  /** Callback when animation starts */
  onAnimationStart?: (id: string) => void
  /** Callback when animation completes */
  onAnimationComplete?: (id: string) => void
  /** Enable crossfade during transition */
  crossfade?: boolean
  /** Custom transition properties */
  transition?: {
    x?: SpringConfig
    y?: SpringConfig
    width?: SpringConfig
    height?: SpringConfig
    opacity?: SpringConfig
    borderRadius?: SpringConfig
  }
}

/**
 * Layout group for managing shared elements
 */
export interface LayoutGroup {
  /** Register element with layoutId */
  register(id: string, element: HTMLElement): void
  /** Unregister element */
  unregister(id: string, element: HTMLElement): void
  /** Update layout (call after DOM changes) */
  update(): void
  /** Force re-measure all elements */
  forceUpdate(): void
  /** Destroy and cleanup */
  destroy(): void
}

/**
 * Shared layout context for cross-component animations
 */
export interface SharedLayoutContext {
  /** Register a layout group */
  createGroup(id?: string): LayoutGroup
  /** Get group by id */
  getGroup(id: string): LayoutGroup | undefined
  /** Update all groups */
  updateAll(): void
  /** Destroy all groups */
  destroy(): void
}

// ============ Measurement Utilities ============

/**
 * Measure element position and size
 */
function measureElement(element: HTMLElement): LayoutMeasurement {
  const rect = element.getBoundingClientRect()
  const styles = getComputedStyle(element)

  return {
    x: rect.left + window.scrollX,
    y: rect.top + window.scrollY,
    width: rect.width,
    height: rect.height,
    opacity: parseFloat(styles.opacity) || 1,
    borderRadius: parseFloat(styles.borderRadius) || 0,
    scaleX: 1,
    scaleY: 1,
  }
}

/**
 * Apply FLIP transform to element
 */
function applyTransform(
  element: HTMLElement,
  from: LayoutMeasurement,
  to: LayoutMeasurement,
  current: Record<string, number>
): void {
  // Calculate deltas
  const dx = current.x !== undefined ? from.x - to.x + (current.x - from.x) : 0
  const dy = current.y !== undefined ? from.y - to.y + (current.y - from.y) : 0
  const scaleX = current.width !== undefined ? current.width / to.width : 1
  const scaleY = current.height !== undefined ? current.height / to.height : 1

  // Apply transform
  element.style.transform = `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`
  element.style.transformOrigin = 'top left'

  // Apply opacity if transitioning
  if (current.opacity !== undefined) {
    element.style.opacity = String(current.opacity)
  }

  // Apply border radius (scale-compensated)
  if (current.borderRadius !== undefined) {
    const compensatedRadius = current.borderRadius / Math.max(scaleX, scaleY)
    element.style.borderRadius = `${compensatedRadius}px`
  }
}

/**
 * Reset element transform
 */
function resetTransform(element: HTMLElement): void {
  element.style.transform = ''
  element.style.transformOrigin = ''
  element.style.opacity = ''
  element.style.borderRadius = ''
}

// ============ Layout Group Implementation ============

/**
 * Create a layout group for managing shared layout elements
 *
 * @example
 * ```ts
 * const group = createLayoutGroup({
 *   spring: { stiffness: 300, damping: 30 },
 * })
 *
 * // Register elements with same layoutId
 * group.register('card-1', cardElement)
 *
 * // After DOM changes
 * group.update()
 * ```
 */
export function createLayoutGroup(config: LayoutAnimationConfig = {}): LayoutGroup {
  const {
    spring: defaultSpring = { stiffness: 300, damping: 30 },
    onAnimationStart,
    onAnimationComplete,
    crossfade = false,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    transition: _transition = {},
  } = config

  const elements = new Map<string, SharedLayoutElement[]>()
  const previousMeasurements = new Map<string, LayoutMeasurement>()

  const register = (id: string, element: HTMLElement): void => {
    if (!elements.has(id)) {
      elements.set(id, [])
    }

    const existing = elements.get(id)!
    const alreadyRegistered = existing.some(e => e.element === element)

    if (!alreadyRegistered) {
      const measurement = measureElement(element)
      existing.push({
        id,
        element,
        measurement,
        spring: null,
        isAnimating: false,
        pendingRafId: null,
      })

      // Store measurement for future animations
      if (!previousMeasurements.has(id)) {
        previousMeasurements.set(id, measurement)
      }
    }
  }

  const unregister = (id: string, element: HTMLElement): void => {
    const group = elements.get(id)
    if (!group) return

    const index = group.findIndex(e => e.element === element)
    if (index !== -1) {
      const entry = group[index]!

      // Store final measurement before removal
      previousMeasurements.set(id, measureElement(element))

      // Cancel pending RAF to prevent memory leak
      if (entry.pendingRafId !== null) {
        cancelAnimationFrame(entry.pendingRafId)
        entry.pendingRafId = null
      }

      // Cleanup spring
      entry.spring?.destroy()
      group.splice(index, 1)

      if (group.length === 0) {
        elements.delete(id)
      }
    }
  }

  const animateElement = (
    entry: SharedLayoutElement,
    from: LayoutMeasurement,
    to: LayoutMeasurement
  ): void => {
    // Cleanup previous animation
    entry.spring?.destroy()

    // Create spring with initial values
    const initialValues: Record<string, number> = {
      x: from.x,
      y: from.y,
      width: from.width,
      height: from.height,
    }

    if (crossfade) {
      initialValues.opacity = from.opacity ?? 1
    }

    if (from.borderRadius !== undefined) {
      initialValues.borderRadius = from.borderRadius
    }

    entry.spring = createSpringGroup(initialValues, defaultSpring)
    entry.isAnimating = true

    onAnimationStart?.(entry.id)

    entry.spring.subscribe((values: Record<string, number>) => {
      applyTransform(entry.element, from, to, values)
    })

    // Set target values
    const targetValues: Record<string, number> = {
      x: to.x,
      y: to.y,
      width: to.width,
      height: to.height,
    }

    if (crossfade) {
      targetValues.opacity = to.opacity ?? 1
    }

    if (to.borderRadius !== undefined) {
      targetValues.borderRadius = to.borderRadius
    }

    entry.spring.set(targetValues)

    // Check for animation completion
    const checkComplete = () => {
      entry.pendingRafId = null

      if (entry.spring && !entry.spring.isAnimating()) {
        entry.isAnimating = false
        resetTransform(entry.element)
        onAnimationComplete?.(entry.id)
      } else if (entry.isAnimating) {
        entry.pendingRafId = requestAnimationFrame(checkComplete)
      }
    }

    entry.pendingRafId = requestAnimationFrame(checkComplete)
  }

  const update = (): void => {
    for (const [id, group] of elements) {
      for (const entry of group) {
        const previousMeasurement = previousMeasurements.get(id)
        const currentMeasurement = measureElement(entry.element)

        // Check if position/size changed
        if (previousMeasurement) {
          const hasChanged =
            previousMeasurement.x !== currentMeasurement.x ||
            previousMeasurement.y !== currentMeasurement.y ||
            previousMeasurement.width !== currentMeasurement.width ||
            previousMeasurement.height !== currentMeasurement.height

          if (hasChanged) {
            animateElement(entry, previousMeasurement, currentMeasurement)
          }
        }

        // Update stored measurement
        entry.measurement = currentMeasurement
        previousMeasurements.set(id, currentMeasurement)
      }
    }
  }

  const forceUpdate = (): void => {
    // Re-measure all elements
    for (const [id, group] of elements) {
      for (const entry of group) {
        entry.measurement = measureElement(entry.element)
        previousMeasurements.set(id, entry.measurement)
      }
    }
  }

  const destroy = (): void => {
    for (const group of elements.values()) {
      for (const entry of group) {
        // Cancel pending RAF to prevent memory leak
        if (entry.pendingRafId !== null) {
          cancelAnimationFrame(entry.pendingRafId)
          entry.pendingRafId = null
        }
        entry.spring?.destroy()
        resetTransform(entry.element)
      }
    }
    elements.clear()
    previousMeasurements.clear()
  }

  return {
    register,
    unregister,
    update,
    forceUpdate,
    destroy,
  }
}

// ============ Shared Layout Context ============

let groupIdCounter = 0

/**
 * Create a shared layout context for managing multiple layout groups
 *
 * @example
 * ```ts
 * const context = createSharedLayoutContext()
 *
 * // Create groups for different animation contexts
 * const listGroup = context.createGroup('list')
 * const cardGroup = context.createGroup('cards')
 *
 * // Register elements
 * listGroup.register('item-1', element1)
 * cardGroup.register('card-1', element2)
 *
 * // After route change or DOM update
 * context.updateAll()
 * ```
 */
export function createSharedLayoutContext(): SharedLayoutContext {
  const groups = new Map<string, LayoutGroup>()

  return {
    createGroup(id?: string) {
      const groupId = id ?? `layout-group-${groupIdCounter++}`
      const group = createLayoutGroup()
      groups.set(groupId, group)
      return group
    },

    getGroup(id: string) {
      return groups.get(id)
    },

    updateAll() {
      for (const group of groups.values()) {
        group.update()
      }
    },

    destroy() {
      for (const group of groups.values()) {
        group.destroy()
      }
      groups.clear()
    },
  }
}

// ============ Auto Layout Observer ============

/**
 * Configuration for auto layout observer
 */
export interface AutoLayoutConfig extends LayoutAnimationConfig {
  /** Root element to observe (default: document.body) */
  root?: HTMLElement
  /** Attribute name for layout ID (default: 'data-layout-id') */
  attribute?: string
  /** Debounce time for mutations (ms) */
  debounce?: number
}

/**
 * Create auto layout observer that automatically animates
 * elements with layoutId attribute
 *
 * @example
 * ```html
 * <div data-layout-id="card-1">Content</div>
 * ```
 *
 * ```ts
 * const observer = createAutoLayout({
 *   spring: { stiffness: 200, damping: 20 },
 * })
 *
 * // Elements with data-layout-id will automatically animate
 * // when their position changes
 *
 * observer.destroy() // Cleanup when done
 * ```
 */
export function createAutoLayout(config: AutoLayoutConfig = {}): {
  update(): void
  forceUpdate(): void
  destroy(): void
} {
  const {
    root = typeof document !== 'undefined' ? document.body : null,
    attribute = 'data-layout-id',
    debounce: debounceTime = 0,
    ...layoutConfig
  } = config

  if (!root) {
    return {
      update: () => {},
      forceUpdate: () => {},
      destroy: () => {},
    }
  }

  const group = createLayoutGroup(layoutConfig)
  let observer: MutationObserver | null = null
  let resizeObserver: ResizeObserver | null = null
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  const scanAndRegister = () => {
    const elements = root.querySelectorAll(`[${attribute}]`)
    elements.forEach((el) => {
      const id = el.getAttribute(attribute)
      if (id && el instanceof HTMLElement) {
        group.register(id, el)
      }
    })
  }

  const debouncedUpdate = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    if (debounceTime > 0) {
      debounceTimer = setTimeout(() => {
        scanAndRegister()
        group.update()
      }, debounceTime)
    } else {
      scanAndRegister()
      group.update()
    }
  }

  // Initial scan
  scanAndRegister()

  // Observe DOM changes
  observer = new MutationObserver((mutations) => {
    let shouldUpdate = false

    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        // Check added nodes
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            if (node.hasAttribute(attribute)) {
              shouldUpdate = true
            }
            // Check descendants
            if (node.querySelector(`[${attribute}]`)) {
              shouldUpdate = true
            }
          }
        })

        // Check removed nodes
        mutation.removedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            const id = node.getAttribute(attribute)
            if (id) {
              group.unregister(id, node)
            }
          }
        })
      }

      if (mutation.type === 'attributes' && mutation.attributeName === attribute) {
        shouldUpdate = true
      }
    }

    if (shouldUpdate) {
      debouncedUpdate()
    }
  })

  observer.observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [attribute],
  })

  // Observe resize changes
  resizeObserver = new ResizeObserver(() => {
    debouncedUpdate()
  })

  resizeObserver.observe(root)

  return {
    update: () => {
      scanAndRegister()
      group.update()
    },

    forceUpdate: () => {
      scanAndRegister()
      group.forceUpdate()
    },

    destroy: () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      observer?.disconnect()
      resizeObserver?.disconnect()
      group.destroy()
    },
  }
}
