import React, { useEffect, useRef, useState } from 'react'
import { createSpringGroup } from '../../../index.js'
import type { SpringConfig } from '../../../types.js'

/**
 * Props for animated elements
 */
export interface AnimatedElementProps extends React.HTMLAttributes<HTMLElement> {
  /** Spring configuration */
  config?: SpringConfig
  ref?: React.Ref<HTMLElement>
}

/**
 * Create an animated component for a given tag
 */
function createAnimatedComponent<T extends React.ElementType>(
  tag: T
): React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<T> & AnimatedElementProps> {
  return React.forwardRef<HTMLElement, React.ComponentPropsWithoutRef<T> & AnimatedElementProps>(
    ({ children, style = {}, config = {}, ...props }, ref) => {
      const springRef = useRef<ReturnType<typeof createSpringGroup> | null>(null)
      const [animatedStyle, setAnimatedStyle] = useState<React.CSSProperties>({})

      // Extract numeric style values for animation
      const numericStyle: Record<string, number> = Object.fromEntries(
        Object.entries(style).filter((entry): entry is [string, number] => typeof entry[1] === 'number')
      )

      // Initialize spring
      useEffect(() => {
        const spring = createSpringGroup(
          Object.fromEntries(
            Object.keys(numericStyle).map((k) => [k, 0])
          ),
          config
        )
        spring.subscribe((values) => {
          setAnimatedStyle(values as React.CSSProperties)
        })
        springRef.current = spring

        return () => spring.destroy()
      }, [config.stiffness, config.damping])

      // Update when numeric style values change
      useEffect(() => {
        springRef.current?.set(numericStyle)
      }, [numericStyle])

      // Combine static and animated styles
      const staticStyle = Object.fromEntries(
        Object.entries(style).filter(([_, v]) => typeof v !== 'number')
      )

      return React.createElement(
        tag,
        {
          ...props,
          ref,
          style: { ...staticStyle, ...animatedStyle },
        },
        children
      )
    }
  )
}

/**
 * Animated components
 *
 * @example
 * ```tsx
 * <Animated.div
 *   style={{
 *     opacity: isVisible ? 1 : 0,
 *     transform: `translateX(${isOpen ? 100 : 0}px)`,
 *   }}
 *   config={{ stiffness: 120, damping: 14 }}
 * >
 *   Content automatically animates
 * </Animated.div>
 * ```
 */
export const Animated = {
  div: createAnimatedComponent('div'),
  span: createAnimatedComponent('span'),
  button: createAnimatedComponent('button'),
  a: createAnimatedComponent('a'),
  p: createAnimatedComponent('p'),
  h1: createAnimatedComponent('h1'),
  h2: createAnimatedComponent('h2'),
  h3: createAnimatedComponent('h3'),
  h4: createAnimatedComponent('h4'),
  h5: createAnimatedComponent('h5'),
  h6: createAnimatedComponent('h6'),
  ul: createAnimatedComponent('ul'),
  ol: createAnimatedComponent('ol'),
  li: createAnimatedComponent('li'),
  section: createAnimatedComponent('section'),
  article: createAnimatedComponent('article'),
  header: createAnimatedComponent('header'),
  footer: createAnimatedComponent('footer'),
  nav: createAnimatedComponent('nav'),
  main: createAnimatedComponent('main'),
  aside: createAnimatedComponent('aside'),
  img: createAnimatedComponent('img'),
}
