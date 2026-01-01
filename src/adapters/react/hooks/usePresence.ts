import { useContext } from 'react'
import { PresenceContext } from '../context/PresenceContext.js'

/**
 * Hook for custom exit animation control in AnimatePresence
 *
 * Returns a tuple of [isPresent, safeToRemove]:
 * - isPresent: true when component should be visible, false when exiting
 * - safeToRemove: call this when your exit animation is complete
 *
 * @example
 * ```tsx
 * function Modal() {
 *   const [isPresent, safeToRemove] = usePresence()
 *
 *   useEffect(() => {
 *     if (!isPresent) {
 *       // Animate out, then call safeToRemove
 *       animate(element, { opacity: 0 }).then(safeToRemove)
 *     }
 *   }, [isPresent])
 *
 *   return <div>Modal content</div>
 * }
 *
 * // In parent:
 * <AnimatePresence>
 *   {showModal && <Modal key="modal" />}
 * </AnimatePresence>
 * ```
 */
export function usePresence(): [boolean, () => void] {
  const context = useContext(PresenceContext)

  // If not inside AnimatePresence, always present
  if (context === null) {
    return [true, () => {}]
  }

  return [context.isPresent, context.safeToRemove]
}

/**
 * Hook that returns whether the component is present
 *
 * Simpler alternative to usePresence when you only need the presence state
 * and are using built-in exit animations (via exit prop).
 *
 * @example
 * ```tsx
 * function Item() {
 *   const isPresent = useIsPresent()
 *   return <div style={{ opacity: isPresent ? 1 : 0 }}>Item</div>
 * }
 * ```
 */
export function useIsPresent(): boolean {
  const context = useContext(PresenceContext)
  return context === null ? true : context.isPresent
}

/**
 * Hook that returns custom data passed from AnimatePresence
 *
 * Useful for passing dynamic values to exit animations
 *
 * @example
 * ```tsx
 * <AnimatePresence custom={direction}>
 *   <Slide key={index} />
 * </AnimatePresence>
 *
 * function Slide() {
 *   const custom = usePresenceCustom<number>()
 *   const exitX = custom > 0 ? 100 : -100
 *   return <Animated.div exit={{ x: exitX }} />
 * }
 * ```
 */
export function usePresenceCustom<T = unknown>(): T | undefined {
  const context = useContext(PresenceContext)
  return context?.custom as T | undefined
}
