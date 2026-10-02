import * as React from 'react'
import { useRef, useCallback, cloneElement } from 'react'
import { useIsomorphicLayoutEffect } from '../utils/ssr.js'

/** Layout of an exiting element relative to its offset parent */
interface PopLayout {
  top: number
  left: number
  width: number
  height: number
}

interface PopChildMeasureProps {
  isPresent: boolean
  elementRef: React.RefObject<HTMLElement | null>
  layoutRef: React.MutableRefObject<PopLayout | null>
  children: React.ReactElement
}

/**
 * Measures the child right before the commit in which it starts exiting, i.e.
 * before entering siblings are inserted and could shift it.
 */
class PopChildMeasure extends React.Component<PopChildMeasureProps> {
  override getSnapshotBeforeUpdate(prevProps: PopChildMeasureProps): null {
    const element = this.props.elementRef.current
    if (
      prevProps.isPresent &&
      !this.props.isPresent &&
      element &&
      typeof HTMLElement !== 'undefined' &&
      element instanceof HTMLElement
    ) {
      const computed = getComputedStyle(element)
      this.props.layoutRef.current = {
        // `top`/`left` position the margin box, offsetTop/Left the border box
        top: element.offsetTop - (parseFloat(computed.marginTop) || 0),
        left: element.offsetLeft - (parseFloat(computed.marginLeft) || 0),
        width: element.offsetWidth,
        height: element.offsetHeight,
      }
    }
    return null
  }

  // Required alongside getSnapshotBeforeUpdate
  override componentDidUpdate(): void {}

  override render(): React.ReactNode {
    return this.props.children
  }
}

/** The ref of a React element (moved from `element.ref` to `props.ref` in React 19) */
function getElementRef(element: React.ReactElement): React.Ref<unknown> | undefined {
  if (parseInt(React.version, 10) >= 19) {
    return (element.props as { ref?: React.Ref<unknown> }).ref
  }
  return (element as unknown as { ref?: React.Ref<unknown> }).ref ?? undefined
}

const POP_PROPERTIES = ['position', 'top', 'left', 'width', 'height', 'box-sizing'] as const

/**
 * Pops an exiting child out of the document flow (`position: absolute` at its
 * last in-flow position and size) so that its siblings reflow immediately while
 * its exit animation plays. Used by `<AnimatePresence mode="popLayout">`.
 *
 * The child must render a DOM element and forward its ref (e.g. `Animated.div`
 * or a `forwardRef` component); its offset parent should be positioned.
 */
export function PopChild({
  children,
  isPresent,
}: {
  children: React.ReactElement
  isPresent: boolean
}) {
  const elementRef = useRef<HTMLElement | null>(null)
  const layoutRef = useRef<PopLayout | null>(null)
  const childRef = getElementRef(children)

  const setRef = useCallback(
    (node: HTMLElement | null) => {
      elementRef.current = node
      if (typeof childRef === 'function') {
        childRef(node)
      } else if (childRef && typeof childRef === 'object') {
        (childRef as React.MutableRefObject<unknown>).current = node
      }
    },
    [childRef]
  )

  useIsomorphicLayoutEffect(() => {
    if (isPresent) return
    const element = elementRef.current
    const layout = layoutRef.current
    if (!element || !layout) return

    const { style } = element
    const previous = POP_PROPERTIES.map(
      (property) => [property, style.getPropertyValue(property), style.getPropertyPriority(property)] as const
    )
    const values: Record<(typeof POP_PROPERTIES)[number], string> = {
      position: 'absolute',
      top: `${layout.top}px`,
      left: `${layout.left}px`,
      width: `${layout.width}px`,
      height: `${layout.height}px`,
      'box-sizing': 'border-box',
    }
    for (const property of POP_PROPERTIES) {
      style.setProperty(property, values[property], 'important')
    }

    // Restore the element if it is re-added while exiting (no-op on unmount)
    return () => {
      for (const [property, value, priority] of previous) {
        if (value) style.setProperty(property, value, priority)
        else style.removeProperty(property)
      }
    }
  }, [isPresent])

  return (
    <PopChildMeasure isPresent={isPresent} elementRef={elementRef} layoutRef={layoutRef}>
      {cloneElement(children as React.ReactElement<{ ref?: React.Ref<HTMLElement> }>, { ref: setRef })}
    </PopChildMeasure>
  )
}
