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
  /** The element's own inline styles, saved while a FLIP animation runs */
  savedStyles: SavedStyles | null
}

/**
 * Inline styles a FLIP animation writes to, saved so they can be restored
 */
interface SavedStyles {
  transform: string
  transformOrigin: string
  opacity: string
  borderRadius: string
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
  /**
   * Per-property spring configs, merged over `spring` for that property
   * (e.g. a softer `opacity` crossfade than the `x`/`y` movement)
   */
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
  /**
   * Create and register a layout group. Creating a group with an id that is
   * already in use destroys the previous group (resetting its elements) and
   * replaces it with the new one. `config` is passed to `createLayoutGroup`.
   */
  createGroup(id?: string, config?: LayoutAnimationConfig): LayoutGroup
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
    // Note: `|| 1` would turn a real opacity of 0 into 1
    opacity: Number.isNaN(parseFloat(styles.opacity)) ? 1 : parseFloat(styles.opacity),
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
  const scaleX = current.width !== undefined && to.width !== 0 ? current.width / to.width : 1
  const scaleY = current.height !== undefined && to.height !== 0 ? current.height / to.height : 1

  // Apply transform
  element.style.transform = `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`
  element.style.transformOrigin = 'top left'

  // Apply opacity if transitioning
  if (current.opacity !== undefined) {
    element.style.opacity = String(current.opacity)
  }

  // Apply border radius, compensated per axis so a non-uniform scale doesn't
  // turn round corners into ellipses
  if (current.borderRadius !== undefined) {
    const radiusX = scaleX === 0 ? 0 : current.borderRadius / scaleX
    const radiusY = scaleY === 0 ? 0 : current.borderRadius / scaleY
    element.style.borderRadius = radiusX === radiusY ? `${radiusX}px` : `${radiusX}px / ${radiusY}px`
  }
}

/**
 * Save the element's own inline styles before a FLIP animation writes to them
 * (no-op if they are already saved, i.e. an animation is being interrupted)
 */
function saveStyles(entry: SharedLayoutElement): void {
  if (entry.savedStyles) return
  const { style } = entry.element
  entry.savedStyles = {
    transform: style.transform,
    transformOrigin: style.transformOrigin,
    opacity: style.opacity,
    borderRadius: style.borderRadius,
  }
}

/**
 * Stop the entry's animation and restore the element's own inline styles
 * (instead of clearing them, which would wipe the user's transform/opacity)
 */
function resetTransform(entry: SharedLayoutElement): void {
  if (entry.pendingRafId !== null) {
    cancelAnimationFrame(entry.pendingRafId)
    entry.pendingRafId = null
  }
  // Destroying the spring also drops its pending (microtask) notification,
  // which would otherwise re-apply a FLIP frame after the reset
  entry.spring?.destroy()
  entry.spring = null
  entry.isAnimating = false

  const saved = entry.savedStyles
  if (!saved) return
  entry.savedStyles = null
  const { style } = entry.element
  style.transform = saved.transform
  style.transformOrigin = saved.transformOrigin
  style.opacity = saved.opacity
  style.borderRadius = saved.borderRadius
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
    transition = {},
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
        savedStyles: null,
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

      // Stop the animation (RAF + spring) and give the element its own
      // inline styles back, in case it stays in the document
      resetTransform(entry)
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
    // Cleanup previous animation, including its completion check loop
    // (otherwise two loops run and onAnimationComplete fires twice)
    if (entry.pendingRafId !== null) {
      cancelAnimationFrame(entry.pendingRafId)
      entry.pendingRafId = null
    }
    entry.spring?.destroy()

    // Remember the element's own inline styles so they can be restored
    saveStyles(entry)

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

    // Each property animates with its own transition (if any) merged over
    // the default spring
    for (const [key, value] of Object.entries(targetValues)) {
      const propertyConfig = transition[key as keyof typeof transition]
      entry.spring.set({ [key]: value }, propertyConfig ?? {})
    }

    // Check for animation completion
    const checkComplete = () => {
      entry.pendingRafId = null

      if (entry.spring && !entry.spring.isAnimating()) {
        resetTransform(entry)
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
        let previousMeasurement = previousMeasurements.get(id)

        // Interrupting a running animation: getBoundingClientRect includes the
        // FLIP transform, so start from the current visual box and measure the
        // real layout box with the transform removed
        if (entry.isAnimating) {
          previousMeasurement = measureElement(entry.element)
          resetTransform(entry)
        }

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
        // Cancels the pending RAF and spring, restores the inline styles
        resetTransform(entry)
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
    createGroup(id?: string, config?: LayoutAnimationConfig) {
      const groupId = id ?? `layout-group-${groupIdCounter++}`
      // Don't leak the group being replaced (its RAF loops and springs)
      groups.get(groupId)?.destroy()
      const group = createLayoutGroup(config)
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

        // Check removed nodes (and their descendants)
        mutation.removedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            const removed = [node, ...Array.from(node.querySelectorAll(`[${attribute}]`))]
            for (const el of removed) {
              const id = el.getAttribute(attribute)
              if (id && el instanceof HTMLElement) {
                group.unregister(id, el)
              }
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
