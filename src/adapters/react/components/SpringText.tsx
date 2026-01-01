/**
 * SpringText - Animated Text Components
 *
 * Unique SpringKit components for text animations.
 */

import React, { useRef, useEffect, useState, useMemo, memo } from 'react'
import { createSpringValue } from '../../../core/spring-value.js'
import type { SpringConfig } from '../../../types.js'

// ============ SpringText ============

export interface SpringTextProps {
  /** The text to display */
  children: string
  /** Animation mode */
  mode?: 'characters' | 'words' | 'lines'
  /** Stagger delay between elements (ms) */
  stagger?: number
  /** Animation direction */
  from?: 'left' | 'right' | 'top' | 'bottom' | 'center'
  /** Spring configuration */
  config?: SpringConfig
  /** Initial opacity */
  initialOpacity?: number
  /** Initial offset (px) */
  initialOffset?: number
  /** Whether to animate on mount */
  animateOnMount?: boolean
  /** Trigger animation (change to replay) */
  trigger?: unknown
  /** Callback when animation completes */
  onComplete?: () => void
  /** CSS class name */
  className?: string
  /** Inline styles */
  style?: React.CSSProperties
}

/**
 * Animated text with staggered character/word/line animations
 *
 * @example Character animation
 * ```tsx
 * <SpringText mode="characters" stagger={30}>
 *   Hello World
 * </SpringText>
 * ```
 *
 * @example Word animation from bottom
 * ```tsx
 * <SpringText
 *   mode="words"
 *   from="bottom"
 *   stagger={100}
 *   config={{ stiffness: 200, damping: 20 }}
 * >
 *   Welcome to SpringKit
 * </SpringText>
 * ```
 *
 * @example Trigger on state change
 * ```tsx
 * const [key, setKey] = useState(0)
 *
 * <SpringText trigger={key} mode="characters">
 *   {message}
 * </SpringText>
 *
 * <button onClick={() => setKey(k => k + 1)}>Replay</button>
 * ```
 */
export const SpringText = memo(function SpringText({
  children,
  mode = 'characters',
  stagger = 30,
  from = 'bottom',
  config = { stiffness: 200, damping: 20 },
  initialOpacity = 0,
  initialOffset = 20,
  animateOnMount = true,
  trigger,
  onComplete,
  className,
  style,
}: SpringTextProps) {
  const [elements, setElements] = useState<string[]>([])
  const [animatedValues, setAnimatedValues] = useState<number[]>([])
  const springsRef = useRef<ReturnType<typeof createSpringValue>[]>([])
  const completedRef = useRef(0)

  // Split text based on mode
  useEffect(() => {
    let parts: string[]
    switch (mode) {
      case 'words':
        parts = children.split(/(\s+)/)
        break
      case 'lines':
        parts = children.split('\n')
        break
      case 'characters':
      default:
        parts = children.split('')
    }
    setElements(parts)
    setAnimatedValues(new Array(parts.length).fill(0))
  }, [children, mode])

  // Create and run animations
  useEffect(() => {
    if (elements.length === 0) return

    // Cleanup old springs
    springsRef.current.forEach((s) => s.destroy())
    springsRef.current = []
    completedRef.current = 0

    // Create new springs
    const springs = elements.map((_, index) => {
      const spring = createSpringValue(0, {
        ...config,
        onUpdate: (value) => {
          setAnimatedValues((prev) => {
            const next = [...prev]
            next[index] = value
            return next
          })
        },
      })
      return spring
    })
    springsRef.current = springs

    // Animate with stagger
    if (animateOnMount || trigger !== undefined) {
      springs.forEach((spring, index) => {
        setTimeout(() => {
          spring.set(1)

          // Check completion
          const checkComplete = () => {
            if (!spring.isAnimating()) {
              completedRef.current++
              if (completedRef.current === elements.length) {
                onComplete?.()
              }
            } else {
              requestAnimationFrame(checkComplete)
            }
          }
          setTimeout(checkComplete, 50)
        }, index * stagger)
      })
    }

    return () => {
      springs.forEach((s) => s.destroy())
    }
  }, [elements, stagger, config, animateOnMount, trigger, onComplete])

  // Calculate transform based on direction
  const getTransform = (progress: number) => {
    const offset = (1 - progress) * initialOffset
    switch (from) {
      case 'left':
        return `translateX(${-offset}px)`
      case 'right':
        return `translateX(${offset}px)`
      case 'top':
        return `translateY(${-offset}px)`
      case 'bottom':
        return `translateY(${offset}px)`
      case 'center':
        return `scale(${0.5 + progress * 0.5})`
      default:
        return `translateY(${offset}px)`
    }
  }

  return (
    <span className={className} style={style}>
      {elements.map((element, index) => {
        const progress = animatedValues[index] ?? 0
        const opacity = initialOpacity + (1 - initialOpacity) * progress

        // Preserve whitespace
        if (element.match(/^\s+$/)) {
          return <span key={index}>{element}</span>
        }

        return (
          <span
            key={index}
            style={{
              display: 'inline-block',
              opacity,
              transform: getTransform(progress),
              whiteSpace: mode === 'lines' ? 'pre' : undefined,
            }}
          >
            {element}
          </span>
        )
      })}
    </span>
  )
})

// ============ SpringNumber ============

export interface SpringNumberProps {
  /** The number to display */
  value: number
  /** Number of decimal places */
  decimals?: number
  /** Format function */
  format?: (value: number) => string
  /** Spring configuration */
  config?: SpringConfig
  /** Prefix (e.g., "$") */
  prefix?: string
  /** Suffix (e.g., "%") */
  suffix?: string
  /** CSS class name */
  className?: string
  /** Inline styles */
  style?: React.CSSProperties
}

/**
 * Animated number counter with spring physics
 *
 * @example Basic counter
 * ```tsx
 * <SpringNumber value={1000} />
 * ```
 *
 * @example Currency
 * ```tsx
 * <SpringNumber
 *   value={99.99}
 *   prefix="$"
 *   decimals={2}
 * />
 * ```
 *
 * @example Percentage with format
 * ```tsx
 * <SpringNumber
 *   value={0.75}
 *   format={(v) => `${(v * 100).toFixed(1)}%`}
 * />
 * ```
 *
 * @example Custom config
 * ```tsx
 * <SpringNumber
 *   value={score}
 *   config={{ stiffness: 50, damping: 10 }}
 *   suffix=" points"
 * />
 * ```
 */
export const SpringNumber = memo(function SpringNumber({
  value,
  decimals = 0,
  format,
  config = { stiffness: 100, damping: 20 },
  prefix = '',
  suffix = '',
  className,
  style,
}: SpringNumberProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const springRef = useRef<ReturnType<typeof createSpringValue> | null>(null)
  const lastValueRef = useRef(value)

  // Initialize spring once
  useEffect(() => {
    springRef.current = createSpringValue(value, {
      ...config,
      onUpdate: setDisplayValue,
    })
    return () => {
      springRef.current?.destroy()
      springRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount

  // Update spring when value changes
  useEffect(() => {
    if (springRef.current && value !== lastValueRef.current) {
      springRef.current.set(value)
      lastValueRef.current = value
    }
  }, [value])

  const formattedValue = useMemo(() => {
    if (format) {
      return format(displayValue)
    }
    return displayValue.toFixed(decimals)
  }, [displayValue, decimals, format])

  return (
    <span className={className} style={style}>
      {prefix}{formattedValue}{suffix}
    </span>
  )
})

// ============ TypeWriter ============

export interface TypeWriterProps {
  /** Text to type */
  children: string
  /** Typing speed (ms per character) */
  speed?: number
  /** Delay before starting (ms) */
  delay?: number
  /** Show cursor */
  cursor?: boolean
  /** Cursor character */
  cursorChar?: string
  /** Loop the animation */
  loop?: boolean
  /** Pause at end before looping (ms) */
  pauseAtEnd?: number
  /** Delete speed when looping (ms) */
  deleteSpeed?: number
  /** Callback when typing completes */
  onComplete?: () => void
  /** CSS class name */
  className?: string
  /** Inline styles */
  style?: React.CSSProperties
}

/**
 * Typewriter effect with optional cursor and looping
 *
 * @example Basic typewriter
 * ```tsx
 * <TypeWriter speed={50}>
 *   Hello, I'm a typewriter effect!
 * </TypeWriter>
 * ```
 *
 * @example With cursor and loop
 * ```tsx
 * <TypeWriter
 *   speed={100}
 *   cursor
 *   cursorChar="|"
 *   loop
 *   pauseAtEnd={2000}
 * >
 *   Welcome to SpringKit
 * </TypeWriter>
 * ```
 */
export const TypeWriter = memo(function TypeWriter({
  children,
  speed = 50,
  delay = 0,
  cursor = true,
  cursorChar = '|',
  loop = false,
  pauseAtEnd = 1000,
  deleteSpeed = 30,
  onComplete,
  className,
  style,
}: TypeWriterProps) {
  const [displayText, setDisplayText] = useState('')
  const [showCursor, setShowCursor] = useState(cursor)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_isDeleting, setIsDeleting] = useState(false)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    let currentIndex = 0
    let isDeleteMode = false

    const tick = () => {
      if (!isDeleteMode) {
        // Typing
        if (currentIndex <= children.length) {
          setDisplayText(children.slice(0, currentIndex))
          currentIndex++
          timeoutRef.current = window.setTimeout(tick, speed)
        } else {
          // Finished typing
          onComplete?.()
          if (loop) {
            timeoutRef.current = window.setTimeout(() => {
              isDeleteMode = true
              setIsDeleting(true)
              tick()
            }, pauseAtEnd)
          }
        }
      } else {
        // Deleting
        if (currentIndex > 0) {
          currentIndex--
          setDisplayText(children.slice(0, currentIndex))
          timeoutRef.current = window.setTimeout(tick, deleteSpeed)
        } else {
          // Finished deleting, start over
          isDeleteMode = false
          setIsDeleting(false)
          timeoutRef.current = window.setTimeout(tick, speed)
        }
      }
    }

    // Start after delay
    timeoutRef.current = window.setTimeout(tick, delay)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [children, speed, delay, loop, pauseAtEnd, deleteSpeed, onComplete])

  // Cursor blinking
  useEffect(() => {
    if (!cursor) return

    const blink = setInterval(() => {
      setShowCursor((prev) => !prev)
    }, 500)

    return () => clearInterval(blink)
  }, [cursor])

  return (
    <span className={className} style={style}>
      {displayText}
      {cursor && (
        <span style={{ opacity: showCursor ? 1 : 0 }}>{cursorChar}</span>
      )}
    </span>
  )
})

// ============ SplitText ============

export interface SplitTextProps {
  /** Text to split */
  children: string
  /** Split mode */
  mode?: 'characters' | 'words' | 'lines'
  /** Render function for each element */
  render: (element: string, index: number, total: number) => React.ReactNode
  /** CSS class name for wrapper */
  className?: string
  /** Inline styles for wrapper */
  style?: React.CSSProperties
}

/**
 * Split text into individual elements for custom animations
 *
 * @example Custom character animation
 * ```tsx
 * <SplitText mode="characters">
 *   {(char, index, total) => (
 *     <motion.span
 *       initial={{ opacity: 0, y: 20 }}
 *       animate={{ opacity: 1, y: 0 }}
 *       transition={{ delay: index * 0.05 }}
 *     >
 *       {char}
 *     </motion.span>
 *   )}
 * </SplitText>
 * ```
 *
 * @example Word wave animation
 * ```tsx
 * const { scrollY } = useScroll()
 *
 * <SplitText mode="words">
 *   {(word, index) => {
 *     const y = useTransform(scrollY, [0, 500], [0, index * 10])
 *     return <span style={{ y: y.get() }}>{word} </span>
 *   }}
 * </SplitText>
 * ```
 */
export const SplitText = memo(function SplitText({
  children,
  mode = 'characters',
  render,
  className,
  style,
}: SplitTextProps) {
  const elements = useMemo(() => {
    switch (mode) {
      case 'words':
        return children.split(/(\s+)/)
      case 'lines':
        return children.split('\n')
      case 'characters':
      default:
        return children.split('')
    }
  }, [children, mode])

  return (
    <span className={className} style={style}>
      {elements.map((element, index) => (
        <React.Fragment key={index}>
          {render(element, index, elements.length)}
        </React.Fragment>
      ))}
    </span>
  )
})
