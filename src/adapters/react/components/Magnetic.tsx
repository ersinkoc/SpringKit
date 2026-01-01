/**
 * Magnetic - Magnetic Attraction Components
 *
 * Unique SpringKit components for magnetic cursor effects.
 */

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  memo,
  forwardRef,
} from 'react'
import { createSpringValue } from '../../../core/spring-value.js'
import type { SpringConfig } from '../../../types.js'

// ============ Magnetic ============

export interface MagneticProps {
  /** Children to render */
  children: React.ReactNode
  /** Magnetic attraction strength (0-1) */
  strength?: number
  /** Distance from center to start attracting (px) */
  range?: number
  /** Spring configuration */
  config?: SpringConfig
  /** Whether the magnetic effect is enabled */
  enabled?: boolean
  /** Scale up when attracted */
  scaleOnHover?: number
  /** Maximum offset in pixels */
  maxOffset?: number
  /** CSS class name */
  className?: string
  /** Inline styles */
  style?: React.CSSProperties
  /** Callback when attraction starts */
  onAttract?: () => void
  /** Callback when attraction ends */
  onRelease?: () => void
}

/**
 * Magnetic attraction to cursor
 *
 * Creates an element that is attracted to the cursor when nearby,
 * like a magnet. Great for buttons, links, and interactive elements.
 *
 * @example Basic usage
 * ```tsx
 * <Magnetic>
 *   <button>Hover me!</button>
 * </Magnetic>
 * ```
 *
 * @example Strong attraction with scale
 * ```tsx
 * <Magnetic
 *   strength={0.8}
 *   range={150}
 *   scaleOnHover={1.1}
 *   config={{ stiffness: 400, damping: 25 }}
 * >
 *   <div className="card">Pull me!</div>
 * </Magnetic>
 * ```
 *
 * @example With callbacks
 * ```tsx
 * <Magnetic
 *   onAttract={() => console.log('Attracted!')}
 *   onRelease={() => console.log('Released!')}
 * >
 *   <span>Interactive element</span>
 * </Magnetic>
 * ```
 */
export const Magnetic = memo(forwardRef<HTMLDivElement, MagneticProps>(
  function Magnetic(
    {
      children,
      strength = 0.3,
      range = 100,
      config = { stiffness: 200, damping: 20 },
      enabled = true,
      scaleOnHover = 1,
      maxOffset = 50,
      className,
      style,
      onAttract,
      onRelease,
    },
    ref
  ) {
    const innerRef = useRef<HTMLDivElement>(null)
    const combinedRef = (node: HTMLDivElement | null) => {
      innerRef.current = node
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    }

    const springXRef = useRef<ReturnType<typeof createSpringValue> | null>(null)
    const springYRef = useRef<ReturnType<typeof createSpringValue> | null>(null)
    const springScaleRef = useRef<ReturnType<typeof createSpringValue> | null>(null)

    const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
    const isAttractedRef = useRef(false)

    // Initialize springs
    useEffect(() => {
      springXRef.current = createSpringValue(0, {
        ...config,
        onUpdate: (x) => setTransform((t) => ({ ...t, x })),
      })
      springYRef.current = createSpringValue(0, {
        ...config,
        onUpdate: (y) => setTransform((t) => ({ ...t, y })),
      })
      springScaleRef.current = createSpringValue(1, {
        ...config,
        onUpdate: (scale) => setTransform((t) => ({ ...t, scale })),
      })

      return () => {
        springXRef.current?.destroy()
        springYRef.current?.destroy()
        springScaleRef.current?.destroy()
      }
    }, [config])

    // Store callbacks in refs to avoid recreating handlers
    const onAttractRef = useRef(onAttract)
    const onReleaseRef = useRef(onRelease)
    onAttractRef.current = onAttract
    onReleaseRef.current = onRelease

    const handleMouseMove = useCallback(
      (e: MouseEvent) => {
        if (!enabled || !innerRef.current) return

        const rect = innerRef.current.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2

        const distanceX = e.clientX - centerX
        const distanceY = e.clientY - centerY
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY)

        if (distance < range) {
          // Within range - apply magnetic attraction
          const factor = 1 - distance / range
          let offsetX = distanceX * strength * factor
          let offsetY = distanceY * strength * factor

          // Clamp offset
          offsetX = Math.max(-maxOffset, Math.min(maxOffset, offsetX))
          offsetY = Math.max(-maxOffset, Math.min(maxOffset, offsetY))

          springXRef.current?.set(offsetX)
          springYRef.current?.set(offsetY)

          if (scaleOnHover !== 1) {
            const scaleFactor = 1 + (scaleOnHover - 1) * factor
            springScaleRef.current?.set(scaleFactor)
          }

          if (!isAttractedRef.current) {
            isAttractedRef.current = true
            onAttractRef.current?.()
          }
        } else {
          // Outside range - return to center
          springXRef.current?.set(0)
          springYRef.current?.set(0)
          springScaleRef.current?.set(1)

          if (isAttractedRef.current) {
            isAttractedRef.current = false
            onReleaseRef.current?.()
          }
        }
      },
      [enabled, range, strength, maxOffset, scaleOnHover]
    )

    const handleMouseLeave = useCallback(() => {
      springXRef.current?.set(0)
      springYRef.current?.set(0)
      springScaleRef.current?.set(1)

      if (isAttractedRef.current) {
        isAttractedRef.current = false
        onReleaseRef.current?.()
      }
    }, [])

    useEffect(() => {
      if (!enabled) return

      window.addEventListener('mousemove', handleMouseMove, { passive: true })
      window.addEventListener('mouseleave', handleMouseLeave, { passive: true })

      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseleave', handleMouseLeave)
      }
    }, [enabled, handleMouseMove, handleMouseLeave])

    return (
      <div
        ref={combinedRef}
        className={className}
        style={{
          display: 'inline-block',
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          willChange: 'transform',
          ...style,
        }}
      >
        {children}
      </div>
    )
  }
))

// ============ MagneticGroup ============

export interface MagneticGroupProps {
  /** Children (should be Magnetic components) */
  children: React.ReactNode
  /** Repel other magnetics when one is attracted */
  repel?: boolean
  /** Repulsion strength */
  repelStrength?: number
  /** CSS class name */
  className?: string
  /** Inline styles */
  style?: React.CSSProperties
}

/**
 * Group of magnetic elements that can interact with each other
 *
 * @example
 * ```tsx
 * <MagneticGroup repel>
 *   <Magnetic><button>A</button></Magnetic>
 *   <Magnetic><button>B</button></Magnetic>
 *   <Magnetic><button>C</button></Magnetic>
 * </MagneticGroup>
 * ```
 */
export const MagneticGroup = memo(function MagneticGroup({
  children,
  repel: _repel = false,
  repelStrength: _repelStrength = 0.2,
  className,
  style,
}: MagneticGroupProps) {
  // For now, just a wrapper - repulsion can be added later
  return (
    <div className={className} style={style}>
      {children}
    </div>
  )
})

// ============ MagneticCursor ============

export interface MagneticCursorProps {
  /** Cursor content */
  children?: React.ReactNode
  /** Cursor size (px) */
  size?: number
  /** Spring configuration */
  config?: SpringConfig
  /** Offset from actual cursor position */
  offset?: { x: number; y: number }
  /** Whether to show the cursor */
  visible?: boolean
  /** Z-index of the cursor */
  zIndex?: number
  /** CSS class name */
  className?: string
  /** Inline styles */
  style?: React.CSSProperties
}

/**
 * Custom cursor that follows the mouse with spring physics
 *
 * @example Basic custom cursor
 * ```tsx
 * <MagneticCursor size={20}>
 *   <div className="cursor-dot" />
 * </MagneticCursor>
 * ```
 *
 * @example Smooth trailing cursor
 * ```tsx
 * <MagneticCursor
 *   size={40}
 *   config={{ stiffness: 100, damping: 20 }}
 * >
 *   <div className="cursor-ring" />
 * </MagneticCursor>
 * ```
 */
export const MagneticCursor = memo(function MagneticCursor({
  children,
  size = 30,
  config = { stiffness: 150, damping: 15 },
  offset = { x: 0, y: 0 },
  visible = true,
  zIndex = 9999,
  className,
  style,
}: MagneticCursorProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const springXRef = useRef<ReturnType<typeof createSpringValue> | null>(null)
  const springYRef = useRef<ReturnType<typeof createSpringValue> | null>(null)

  useEffect(() => {
    springXRef.current = createSpringValue(0, {
      ...config,
      onUpdate: (x) => setPosition((p) => ({ ...p, x })),
    })
    springYRef.current = createSpringValue(0, {
      ...config,
      onUpdate: (y) => setPosition((p) => ({ ...p, y })),
    })

    return () => {
      springXRef.current?.destroy()
      springYRef.current?.destroy()
    }
  }, [config])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      springXRef.current?.set(e.clientX + offset.x)
      springYRef.current?.set(e.clientY + offset.y)
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [offset])

  if (!visible) return null

  return (
    <div
      className={className}
      style={{
        position: 'fixed',
        left: position.x - size / 2,
        top: position.y - size / 2,
        width: size,
        height: size,
        pointerEvents: 'none',
        zIndex,
        ...style,
      }}
    >
      {children ?? (
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            border: '2px solid currentColor',
            opacity: 0.5,
          }}
        />
      )}
    </div>
  )
})

// ============ useMagnetic Hook ============

export interface UseMagneticOptions {
  /** Magnetic attraction strength (0-1) */
  strength?: number
  /** Distance from center to start attracting (px) */
  range?: number
  /** Spring configuration */
  config?: SpringConfig
  /** Whether the magnetic effect is enabled */
  enabled?: boolean
  /** Maximum offset in pixels */
  maxOffset?: number
}

export interface UseMagneticReturn {
  /** Ref to attach to the element */
  ref: React.RefObject<HTMLElement>
  /** Current X offset */
  x: number
  /** Current Y offset */
  y: number
  /** Whether currently attracted */
  isAttracted: boolean
  /** Reset to center position */
  reset: () => void
}

/**
 * Hook for custom magnetic behavior
 *
 * @example
 * ```tsx
 * function CustomMagnetic() {
 *   const { ref, x, y, isAttracted } = useMagnetic({
 *     strength: 0.5,
 *     range: 100
 *   })
 *
 *   return (
 *     <button
 *       ref={ref}
 *       style={{
 *         transform: `translate(${x}px, ${y}px)`,
 *         background: isAttracted ? 'blue' : 'gray'
 *       }}
 *     >
 *       Magnetic Button
 *     </button>
 *   )
 * }
 * ```
 */
export function useMagnetic(options: UseMagneticOptions = {}): UseMagneticReturn {
  const {
    strength = 0.3,
    range = 100,
    config = { stiffness: 200, damping: 20 },
    enabled = true,
    maxOffset = 50,
  } = options

  const ref = useRef<HTMLElement>(null)
  const springXRef = useRef<ReturnType<typeof createSpringValue> | null>(null)
  const springYRef = useRef<ReturnType<typeof createSpringValue> | null>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const isAttractedRef = useRef(false)
  // Keep a state version for external consumers who need to react to changes
  const [isAttracted, setIsAttracted] = useState(false)

  useEffect(() => {
    springXRef.current = createSpringValue(0, {
      ...config,
      onUpdate: (x) => setPosition((p) => ({ ...p, x })),
    })
    springYRef.current = createSpringValue(0, {
      ...config,
      onUpdate: (y) => setPosition((p) => ({ ...p, y })),
    })

    return () => {
      springXRef.current?.destroy()
      springYRef.current?.destroy()
    }
  }, [config])

  useEffect(() => {
    if (!enabled) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current) return

      const rect = ref.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      const distanceX = e.clientX - centerX
      const distanceY = e.clientY - centerY
      const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY)

      if (distance < range) {
        const factor = 1 - distance / range
        let offsetX = distanceX * strength * factor
        let offsetY = distanceY * strength * factor

        offsetX = Math.max(-maxOffset, Math.min(maxOffset, offsetX))
        offsetY = Math.max(-maxOffset, Math.min(maxOffset, offsetY))

        springXRef.current?.set(offsetX)
        springYRef.current?.set(offsetY)

        if (!isAttractedRef.current) {
          isAttractedRef.current = true
          setIsAttracted(true)
        }
      } else {
        springXRef.current?.set(0)
        springYRef.current?.set(0)

        if (isAttractedRef.current) {
          isAttractedRef.current = false
          setIsAttracted(false)
        }
      }
    }

    const handleMouseLeave = () => {
      springXRef.current?.set(0)
      springYRef.current?.set(0)

      if (isAttractedRef.current) {
        isAttractedRef.current = false
        setIsAttracted(false)
      }
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [enabled, range, strength, maxOffset])

  const reset = useCallback(() => {
    springXRef.current?.set(0)
    springYRef.current?.set(0)
    isAttractedRef.current = false
    setIsAttracted(false)
  }, [])

  return {
    ref: ref as React.RefObject<HTMLElement>,
    x: position.x,
    y: position.y,
    isAttracted,
    reset,
  }
}
