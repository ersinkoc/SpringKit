/**
 * Parallax - Scroll & Mouse Parallax Components
 *
 * Unique SpringKit components for parallax effects with spring physics.
 */

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
  memo,
  forwardRef,
  createContext,
  useContext,
} from 'react'
import { createSpringValue } from '../../../core/spring-value.js'
import type { SpringConfig } from '../../../types.js'

// ============ Parallax (Scroll-based) ============

export interface ParallaxProps {
  /** Children to render */
  children: React.ReactNode
  /** Parallax speed multiplier (-1 to 1, 0 = no effect, negative = opposite direction) */
  speed?: number
  /** Parallax direction */
  direction?: 'vertical' | 'horizontal' | 'both'
  /** Spring configuration for smooth scrolling */
  config?: SpringConfig
  /** Whether the parallax effect is enabled */
  enabled?: boolean
  /** Offset from center (px) */
  offset?: { x?: number; y?: number }
  /** Root margin for intersection observer */
  rootMargin?: string
  /** Element type to render */
  as?: keyof React.JSX.IntrinsicElements
  /** CSS class name */
  className?: string
  /** Inline styles */
  style?: React.CSSProperties
}

/**
 * Scroll-based parallax component with spring physics
 *
 * Creates smooth parallax effects that respond to scroll position.
 *
 * @example Basic vertical parallax
 * ```tsx
 * <Parallax speed={0.5}>
 *   <img src="background.jpg" alt="Background" />
 * </Parallax>
 * ```
 *
 * @example Slow background, fast foreground
 * ```tsx
 * <div className="scene">
 *   <Parallax speed={-0.2}>
 *     <div className="background" />
 *   </Parallax>
 *   <Parallax speed={0.3}>
 *     <div className="foreground" />
 *   </Parallax>
 * </div>
 * ```
 *
 * @example Horizontal parallax
 * ```tsx
 * <Parallax speed={0.5} direction="horizontal">
 *   <div className="sliding-element" />
 * </Parallax>
 * ```
 */
export const Parallax = memo(forwardRef<HTMLDivElement, ParallaxProps>(
  function Parallax(
    {
      children,
      speed = 0.5,
      direction = 'vertical',
      config = { stiffness: 100, damping: 20 },
      enabled = true,
      offset = {},
      rootMargin = '100px',
      as: Component = 'div',
      className,
      style,
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
    const [transform, setTransform] = useState({ x: offset.x ?? 0, y: offset.y ?? 0 })
    const [isInView, setIsInView] = useState(false)

    // Initialize springs
    useEffect(() => {
      springXRef.current = createSpringValue(offset.x ?? 0, {
        ...config,
        onUpdate: (x) => setTransform((t) => ({ ...t, x })),
      })
      springYRef.current = createSpringValue(offset.y ?? 0, {
        ...config,
        onUpdate: (y) => setTransform((t) => ({ ...t, y })),
      })

      return () => {
        springXRef.current?.destroy()
        springYRef.current?.destroy()
      }
    }, [config, offset.x, offset.y])

    // Intersection observer
    useEffect(() => {
      if (!innerRef.current) return

      const observer = new IntersectionObserver(
        ([entry]) => {
          setIsInView(entry?.isIntersecting ?? false)
        },
        { rootMargin }
      )

      observer.observe(innerRef.current)
      return () => observer.disconnect()
    }, [rootMargin])

    // Scroll handler
    useEffect(() => {
      if (!enabled || !isInView) return

      const handleScroll = () => {
        if (!innerRef.current) return

        const rect = innerRef.current.getBoundingClientRect()
        const windowHeight = window.innerHeight
        const windowWidth = window.innerWidth

        // Calculate position relative to viewport center
        const centerY = (rect.top + rect.height / 2 - windowHeight / 2) / windowHeight
        const centerX = (rect.left + rect.width / 2 - windowWidth / 2) / windowWidth

        if (direction === 'vertical' || direction === 'both') {
          const yOffset = centerY * speed * 200 + (offset.y ?? 0)
          springYRef.current?.set(yOffset)
        }

        if (direction === 'horizontal' || direction === 'both') {
          const xOffset = centerX * speed * 200 + (offset.x ?? 0)
          springXRef.current?.set(xOffset)
        }
      }

      handleScroll() // Initial calculation
      window.addEventListener('scroll', handleScroll, { passive: true })
      window.addEventListener('resize', handleScroll, { passive: true })

      return () => {
        window.removeEventListener('scroll', handleScroll)
        window.removeEventListener('resize', handleScroll)
      }
    }, [enabled, isInView, speed, direction, offset])

    const transformStyle = useMemo(() => {
      const parts: string[] = []
      if (direction === 'vertical' || direction === 'both') {
        parts.push(`translateY(${transform.y}px)`)
      }
      if (direction === 'horizontal' || direction === 'both') {
        parts.push(`translateX(${transform.x}px)`)
      }
      return parts.join(' ') || 'none'
    }, [direction, transform])

    return React.createElement(
      Component as string,
      {
        ref: combinedRef,
        className,
        style: {
          transform: transformStyle,
          willChange: 'transform',
          ...style,
        },
      },
      children
    )
  }
))

// ============ MouseParallax ============

export interface MouseParallaxProps {
  /** Children to render */
  children: React.ReactNode
  /** Parallax strength (higher = more movement) */
  strength?: number
  /** Invert the effect */
  inverted?: boolean
  /** Spring configuration */
  config?: SpringConfig
  /** Whether the parallax effect is enabled */
  enabled?: boolean
  /** Container to track mouse within (defaults to window) */
  container?: React.RefObject<HTMLElement>
  /** Reset position when mouse leaves */
  resetOnLeave?: boolean
  /** Element type to render */
  as?: keyof React.JSX.IntrinsicElements
  /** CSS class name */
  className?: string
  /** Inline styles */
  style?: React.CSSProperties
}

/**
 * Mouse-based parallax component
 *
 * Creates parallax effects that respond to mouse position.
 *
 * @example Basic mouse parallax
 * ```tsx
 * <MouseParallax strength={20}>
 *   <div className="floating-element" />
 * </MouseParallax>
 * ```
 *
 * @example Layered parallax scene
 * ```tsx
 * <div className="scene">
 *   <MouseParallax strength={10}>
 *     <div className="layer-back" />
 *   </MouseParallax>
 *   <MouseParallax strength={30}>
 *     <div className="layer-front" />
 *   </MouseParallax>
 * </div>
 * ```
 *
 * @example Inverted (opposite direction)
 * ```tsx
 * <MouseParallax strength={20} inverted>
 *   <div className="background" />
 * </MouseParallax>
 * ```
 */
export const MouseParallax = memo(forwardRef<HTMLDivElement, MouseParallaxProps>(
  function MouseParallax(
    {
      children,
      strength = 20,
      inverted = false,
      config = { stiffness: 100, damping: 15 },
      enabled = true,
      container,
      resetOnLeave = true,
      as: Component = 'div',
      className,
      style,
    },
    ref
  ) {
    const springXRef = useRef<ReturnType<typeof createSpringValue> | null>(null)
    const springYRef = useRef<ReturnType<typeof createSpringValue> | null>(null)
    const [transform, setTransform] = useState({ x: 0, y: 0 })

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

      return () => {
        springXRef.current?.destroy()
        springYRef.current?.destroy()
      }
    }, [config])

    // Mouse handler
    useEffect(() => {
      if (!enabled) return

      // Capture target at mount time to ensure cleanup uses same target
      const target = container?.current ?? null
      const useWindow = target === null

      const handleMouseMove = (e: MouseEvent) => {
        let centerX: number
        let centerY: number
        let width: number
        let height: number

        if (target) {
          const rect = target.getBoundingClientRect()
          centerX = e.clientX - rect.left - rect.width / 2
          centerY = e.clientY - rect.top - rect.height / 2
          width = rect.width
          height = rect.height
        } else {
          centerX = e.clientX - window.innerWidth / 2
          centerY = e.clientY - window.innerHeight / 2
          width = window.innerWidth
          height = window.innerHeight
        }

        // Normalize to -1 to 1 range
        const normalizedX = (centerX / width) * 2
        const normalizedY = (centerY / height) * 2

        const factor = inverted ? -1 : 1
        const offsetX = normalizedX * strength * factor
        const offsetY = normalizedY * strength * factor

        springXRef.current?.set(offsetX)
        springYRef.current?.set(offsetY)
      }

      const handleMouseLeave = () => {
        if (resetOnLeave) {
          springXRef.current?.set(0)
          springYRef.current?.set(0)
        }
      }

      if (useWindow) {
        window.addEventListener('mousemove', handleMouseMove, { passive: true })
        window.addEventListener('mouseleave', handleMouseLeave, { passive: true })
      } else {
        target.addEventListener('mousemove', handleMouseMove, { passive: true })
        target.addEventListener('mouseleave', handleMouseLeave, { passive: true })
      }

      return () => {
        if (useWindow) {
          window.removeEventListener('mousemove', handleMouseMove)
          window.removeEventListener('mouseleave', handleMouseLeave)
        } else {
          target.removeEventListener('mousemove', handleMouseMove)
          target.removeEventListener('mouseleave', handleMouseLeave)
        }
      }
    }, [enabled, container, strength, inverted, resetOnLeave])

    return React.createElement(
      Component as string,
      {
        ref,
        className,
        style: {
          transform: `translate(${transform.x}px, ${transform.y}px)`,
          willChange: 'transform',
          ...style,
        },
      },
      children
    )
  }
))

// ============ TiltCard ============

export interface TiltCardProps {
  /** Children to render */
  children: React.ReactNode
  /** Maximum tilt angle (degrees) */
  maxTilt?: number
  /** Perspective (px) */
  perspective?: number
  /** Scale on hover */
  scale?: number
  /** Spring configuration */
  config?: SpringConfig
  /** Whether the tilt effect is enabled */
  enabled?: boolean
  /** Glare effect */
  glare?: boolean
  /** Maximum glare opacity */
  glareOpacity?: number
  /** CSS class name */
  className?: string
  /** Inline styles */
  style?: React.CSSProperties
  /** Callback when tilt changes */
  onTilt?: (tiltX: number, tiltY: number) => void
}

/**
 * 3D tilt card component
 *
 * Creates a card that tilts based on mouse position.
 *
 * @example Basic tilt card
 * ```tsx
 * <TiltCard>
 *   <div className="card">
 *     <h2>Hover me!</h2>
 *   </div>
 * </TiltCard>
 * ```
 *
 * @example With glare effect
 * ```tsx
 * <TiltCard maxTilt={15} scale={1.05} glare>
 *   <div className="premium-card">
 *     Premium Content
 *   </div>
 * </TiltCard>
 * ```
 */
export const TiltCard = memo(forwardRef<HTMLDivElement, TiltCardProps>(
  function TiltCard(
    {
      children,
      maxTilt = 20,
      perspective = 1000,
      scale = 1,
      config = { stiffness: 300, damping: 20 },
      enabled = true,
      glare = false,
      glareOpacity = 0.2,
      className,
      style,
      onTilt,
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

    const springTiltXRef = useRef<ReturnType<typeof createSpringValue> | null>(null)
    const springTiltYRef = useRef<ReturnType<typeof createSpringValue> | null>(null)
    const springScaleRef = useRef<ReturnType<typeof createSpringValue> | null>(null)
    const springGlareRef = useRef<ReturnType<typeof createSpringValue> | null>(null)

    const [tilt, setTilt] = useState({ x: 0, y: 0, scale: 1, glareX: 50, glareY: 50, glareOpacity: 0 })

    // Initialize springs
    useEffect(() => {
      springTiltXRef.current = createSpringValue(0, {
        ...config,
        onUpdate: (x) => setTilt((t) => ({ ...t, x })),
      })
      springTiltYRef.current = createSpringValue(0, {
        ...config,
        onUpdate: (y) => setTilt((t) => ({ ...t, y })),
      })
      springScaleRef.current = createSpringValue(1, {
        ...config,
        onUpdate: (s) => setTilt((t) => ({ ...t, scale: s })),
      })
      springGlareRef.current = createSpringValue(0, {
        ...config,
        onUpdate: (o) => setTilt((t) => ({ ...t, glareOpacity: o })),
      })

      return () => {
        springTiltXRef.current?.destroy()
        springTiltYRef.current?.destroy()
        springScaleRef.current?.destroy()
        springGlareRef.current?.destroy()
      }
    }, [config])

    const handleMouseMove = useCallback(
      (e: React.MouseEvent) => {
        if (!enabled || !innerRef.current) return

        const rect = innerRef.current.getBoundingClientRect()
        const centerX = (e.clientX - rect.left) / rect.width - 0.5
        const centerY = (e.clientY - rect.top) / rect.height - 0.5

        const tiltX = centerY * maxTilt * -1 // Invert for natural feel
        const tiltY = centerX * maxTilt

        springTiltXRef.current?.set(tiltX)
        springTiltYRef.current?.set(tiltY)
        springScaleRef.current?.set(scale)

        if (glare) {
          springGlareRef.current?.set(glareOpacity)
          setTilt((t) => ({
            ...t,
            glareX: (centerX + 0.5) * 100,
            glareY: (centerY + 0.5) * 100,
          }))
        }

        onTilt?.(tiltX, tiltY)
      },
      [enabled, maxTilt, scale, glare, glareOpacity, onTilt]
    )

    const handleMouseLeave = useCallback(() => {
      springTiltXRef.current?.set(0)
      springTiltYRef.current?.set(0)
      springScaleRef.current?.set(1)
      springGlareRef.current?.set(0)
    }, [])

    return (
      <div
        ref={combinedRef}
        className={className}
        style={{
          perspective: `${perspective}px`,
          ...style,
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div
          style={{
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${tilt.scale})`,
            transformStyle: 'preserve-3d',
            width: '100%',
            height: '100%',
          }}
        >
          {children}
          {glare && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, white, transparent)`,
                opacity: tilt.glareOpacity,
                borderRadius: 'inherit',
              }}
            />
          )}
        </div>
      </div>
    )
  }
))

// ============ ParallaxContainer ============

interface ParallaxContextValue {
  scrollProgress: number
  containerRef: React.RefObject<HTMLElement>
}

const ParallaxContext = createContext<ParallaxContextValue | null>(null)

export interface ParallaxContainerProps {
  /** Children to render */
  children: React.ReactNode
  /** Height multiplier for scroll (1 = viewport height) */
  pages?: number
  /** CSS class name */
  className?: string
  /** Inline styles */
  style?: React.CSSProperties
}

/**
 * Container for managing multiple parallax layers
 *
 * @example
 * ```tsx
 * <ParallaxContainer pages={3}>
 *   <ParallaxLayer offset={0} speed={0.5}>
 *     <div>Layer 1</div>
 *   </ParallaxLayer>
 *   <ParallaxLayer offset={1} speed={1}>
 *     <div>Layer 2</div>
 *   </ParallaxLayer>
 * </ParallaxContainer>
 * ```
 */
export const ParallaxContainer = memo(function ParallaxContainer({
  children,
  pages = 1,
  className,
  style,
}: ParallaxContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const scrollTop = container.scrollTop
      const maxScroll = container.scrollHeight - container.clientHeight
      setScrollProgress(maxScroll > 0 ? scrollTop / maxScroll : 0)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  const contextValue = useMemo(
    () => ({ scrollProgress, containerRef: containerRef as React.RefObject<HTMLElement> }),
    [scrollProgress]
  )

  return (
    <ParallaxContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        className={className}
        style={{
          height: '100vh',
          overflow: 'auto',
          position: 'relative',
          ...style,
        }}
      >
        <div style={{ height: `${pages * 100}vh`, position: 'relative' }}>
          {children}
        </div>
      </div>
    </ParallaxContext.Provider>
  )
})

export interface ParallaxLayerProps {
  /** Children to render */
  children: React.ReactNode
  /** Page offset (0 = start, 1 = second page, etc.) */
  offset?: number
  /** Speed factor (0 = fixed, 1 = normal scroll, 2 = 2x scroll) */
  speed?: number
  /** Horizontal offset */
  horizontal?: boolean
  /** Sticky positioning within offset range */
  sticky?: { start: number; end: number }
  /** CSS class name */
  className?: string
  /** Inline styles */
  style?: React.CSSProperties
}

/**
 * Layer within a ParallaxContainer
 */
export const ParallaxLayer = memo(function ParallaxLayer({
  children,
  offset = 0,
  speed = 1,
  horizontal = false,
  sticky,
  className,
  style,
}: ParallaxLayerProps) {
  const context = useContext(ParallaxContext)
  const [transform, setTransform] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!context) return

    const progress = context.scrollProgress
    const pageHeight = 100 // vh

    if (sticky) {
      // Sticky positioning
      const stickyRange = sticky.end - sticky.start
      if (progress >= sticky.start && progress <= sticky.end) {
        // stickyProgress is calculated but not used yet (reserved for sticky animations)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _stickyProgress = (progress - sticky.start) / stickyRange
        setTransform({
          x: 0,
          y: sticky.start * pageHeight,
        })
      } else if (progress < sticky.start) {
        setTransform({ x: 0, y: offset * pageHeight })
      } else {
        setTransform({ x: 0, y: sticky.end * pageHeight })
      }
    } else {
      // Normal parallax
      const base = offset * pageHeight
      const parallaxOffset = progress * pageHeight * (1 - speed)
      if (horizontal) {
        setTransform({ x: parallaxOffset, y: base })
      } else {
        setTransform({ x: 0, y: base + parallaxOffset })
      }
    }
  }, [context?.scrollProgress, offset, speed, horizontal, sticky]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        transform: `translate(${transform.x}vh, ${transform.y}vh)`,
        willChange: 'transform',
        ...style,
      }}
    >
      {children}
    </div>
  )
})

export function useParallaxContext() {
  return useContext(ParallaxContext)
}
