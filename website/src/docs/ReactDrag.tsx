import { useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Hand, ArrowRight } from 'lucide-react'
import { Animated, type PanInfo } from '@oxog/springkit/react'
import { Card, CardContent } from '@/components/ui/card'
import { DocLayout, DocSection, CodeBlock, PropsTable, type PropRow } from '@/components/docs'

const DRAG_PROPS: PropRow[] = [
  {
    name: 'drag',
    type: "boolean | 'x' | 'y' | 'both'",
    default: 'off',
    description: (
      <>
        Make the element draggable. <code>true</code> / <code>'both'</code> move on both axes,{' '}
        <code>'x'</code> / <code>'y'</code> lock to one. The offset is applied as a{' '}
        <code>translate3d()</code> in front of the animated transform and kept after release.
      </>
    ),
  },
  {
    name: 'dragConstraints',
    type: '{ top?, left?, right?, bottom? } | RefObject<Element>',
    default: 'unbounded',
    description: (
      <>
        A box in px relative to the element's resting position (missing sides are unbounded), or a
        ref to a container the element must stay inside. A container ref is re-measured when the
        window, the container or the element resizes; an idle element left outside springs back in.
      </>
    ),
  },
  {
    name: 'dragElastic',
    type: 'number | boolean | { top?, left?, right?, bottom? }',
    default: '0.5',
    description: (
      <>
        How far the element can be pulled past its constraints, 0 (not at all) to 1 (freely).{' '}
        <code>true</code> = 0.5, <code>false</code> = 0. In the per-side form an edge you leave out is
        not elastic (0, as in Framer Motion; it was 0.5 in 1.x): <code>{'{ right: 0.4 }'}</code> only
        stretches past the right edge.
        Also decides whether momentum overshoots a boundary and springs back (&gt; 0) or stops dead (0).
      </>
    ),
  },
  {
    name: 'dragMomentum',
    type: 'boolean',
    default: 'true',
    description: 'Keep moving with the release velocity and slow down (a decay() per axis).',
  },
  {
    name: 'dragTransition',
    type: '{ deceleration?, modifyTarget?, bounceStiffness?, bounceDamping? }',
    default: '{ 0.998, —, 200, 40 }',
    description: (
      <>
        Tunes the release animation. <code>deceleration</code>: fraction of velocity kept per ms,
        in (0, 1) (default 0.998, higher glides further). <code>modifyTarget(target)</code>: change
        where momentum comes to rest, per axis (e.g. snap to a grid). <code>bounceStiffness</code> /{' '}
        <code>bounceDamping</code>: the spring that returns the element to a boundary or the origin
        (default 200 / 40).
      </>
    ),
  },
  {
    name: 'dragSnapToOrigin',
    type: 'boolean',
    default: 'false',
    description: 'Spring back to the resting position (0, 0) on release.',
  },
  {
    name: 'dragDirectionLock',
    type: 'boolean',
    default: 'false',
    description: (
      <>
        With <code>drag</code> on both axes, lock to the axis the pointer first moves along (decided
        after 3px). Reported through <code>onDirectionLock</code>.
      </>
    ),
  },
  {
    name: 'dragThreshold',
    type: 'number (px)',
    default: '3',
    description: (
      <>
        Distance the pointer must move after pointerdown before the drag starts, so a click is not a
        drag. <code>0</code> starts the drag on pointerdown. A press that crosses it does not fire{' '}
        <code>onTap</code>.
      </>
    ),
  },
  {
    name: 'dragListener',
    type: 'boolean',
    default: 'true',
    description: (
      <>
        Whether a pointerdown on the element itself starts a drag. Set to <code>false</code> to start
        drags only through <code>dragControls</code> (drag handles).
      </>
    ),
  },
  {
    name: 'dragControls',
    type: 'DragControls',
    default: '—',
    description: (
      <>
        Controls from <code>useDragControls()</code>: start a drag from another element, or{' '}
        <code>stop()</code> / <code>cancel()</code> it. Requires <code>drag</code>. One controls object
        can drive several elements.
      </>
    ),
  },
  {
    name: 'whileDrag',
    type: 'AnimatedStyle',
    default: '—',
    description: 'Values animated to while a drag is active (after the threshold), e.g. { scale: 1.1 }.',
  },
  {
    name: 'onDragStart',
    type: '(event: PointerEvent, info: PanInfo) => void',
    default: '—',
    description: 'The pointer moved dragThreshold px (with the move event that crossed it), or pointerdown when the threshold is 0.',
  },
  {
    name: 'onDrag',
    type: '(event: PointerEvent, info: PanInfo) => void',
    default: '—',
    description: 'Every pointer move while dragging.',
  },
  {
    name: 'onDragEnd',
    type: '(event: PointerEvent, info: PanInfo) => void',
    default: '—',
    description: (
      <>
        Release, <code>pointercancel</code>, <code>dragControls.stop()</code> /{' '}
        <code>cancel()</code>. Not called for a press that never crossed the threshold.
      </>
    ),
  },
  {
    name: 'onDragTransitionEnd',
    type: '() => void',
    default: '—',
    description: (
      <>
        The release animation (momentum, bounce or snap back) settled; right after{' '}
        <code>onDragEnd</code> when there is nothing to animate. Not called when the animation is
        interrupted (new pointerdown, <code>stop()</code> / <code>cancel()</code>, drag disabled,
        unmount).
      </>
    ),
  },
  {
    name: 'onDirectionLock',
    type: "(axis: 'x' | 'y') => void",
    default: '—',
    description: <>Called once the axis is locked (<code>dragDirectionLock</code>).</>,
  },
]

const PAN_INFO: PropRow[] = [
  { name: 'point', type: '{ x, y }', description: 'Pointer position in viewport coordinates (clientX / clientY).' },
  { name: 'delta', type: '{ x, y }', description: 'Pointer movement since the previous event.' },
  { name: 'offset', type: '{ x, y }', description: 'Pointer movement since the pointerdown that started the gesture.' },
  { name: 'velocity', type: '{ x, y }', description: 'Pointer velocity in px/s, from the samples of the last ~100ms (0 if the pointer stood still before release).' },
]

const CONTROLS: PropRow[] = [
  {
    name: 'start(event, options?)',
    type: '(PointerEvent | React.PointerEvent, { snapToCursor?, cursorOffset? }) => void',
    description: (
      <>
        Start a drag from a pointer event, usually a handle's <code>onPointerDown</code>. As with the
        element's own listener, callbacks and <code>whileDrag</code> begin once the pointer has moved{' '}
        <code>dragThreshold</code> px. <code>snapToCursor</code> centers the element under the pointer
        (plus <code>cursorOffset</code>).
      </>
    ),
  },
  {
    name: 'stop()',
    type: '() => void',
    description: (
      <>
        End the active drag (and any momentum / snap-back): the element jumps to its resting position
        without momentum. <code>onDragEnd</code> is called for an active drag.
      </>
    ),
  },
  {
    name: 'cancel()',
    type: '() => void',
    description: (
      <>
        End the drag without momentum (<code>onDragEnd</code> gets zero velocity) and <em>animate</em>{' '}
        back inside the constraints (or to the origin with <code>dragSnapToOrigin</code>). While idle,
        it interrupts a running release animation the same way, without callbacks.
      </>
    ),
  },
  {
    name: 'isDragging()',
    type: '() => boolean',
    description: 'Whether a gesture started by these controls or the element is in progress.',
  },
]

function MiniDragDemo() {
  const containerRef = useRef<HTMLDivElement>(null)
  const readoutRef = useRef<HTMLParagraphElement>(null)

  const handleDrag = useCallback((_event: PointerEvent, info: PanInfo) => {
    if (!readoutRef.current) return
    readoutRef.current.textContent =
      `offset ${info.offset.x.toFixed(0)}, ${info.offset.y.toFixed(0)} px · ` +
      `velocity ${info.velocity.x.toFixed(0)}, ${info.velocity.y.toFixed(0)} px/s`
  }, [])

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="relative h-44 rounded-xl bg-black/20 border border-dashed border-white/15 flex items-center justify-center overflow-hidden"
      >
        <Animated.div
          drag
          dragConstraints={containerRef}
          whileDrag={{ scale: 1.1 }}
          onDrag={handleDrag}
          role="img"
          aria-roledescription="draggable"
          aria-label="Draggable box constrained to its container"
          className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg cursor-grab active:cursor-grabbing"
        />
      </div>
      <p ref={readoutRef} className="text-xs font-mono text-white/50 text-center">
        Drag and fling the box
      </p>
    </div>
  )
}

export function ReactDrag() {
  return (
    <DocLayout
      title="Animated Drag"
      description="Pointer-based drag for any Animated element: constraints, elasticity, momentum and drag handles"
      icon={Hand}
    >
      <DocSection title="Basic Usage">
        <p className="text-muted-foreground mb-4">
          Add <code>drag</code> to any <code>Animated</code> element. It works with mouse, pen and touch
          (the right <code>touch-action</code> is set for you: <code>none</code>, or <code>pan-y</code> /{' '}
          <code>pan-x</code> for a single-axis drag, so the page can still scroll the other way).
        </p>
        <Card>
          <CardContent className="pt-6">
            <MiniDragDemo />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { useRef } from 'react'
import { Animated, type PanInfo } from '@oxog/springkit/react'

function Box() {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div ref={containerRef} className="h-44">
      <Animated.div
        drag
        dragConstraints={containerRef}
        whileDrag={{ scale: 1.1 }}
        onDrag={(event: PointerEvent, info: PanInfo) => {
          console.log(info.offset, info.velocity) // px, px/s
        }}
      />
    </div>
  )
}`} />
          </CardContent>
        </Card>
        <Link
          to="/examples/drag"
          className="inline-flex items-center gap-2 text-sm text-orange-300 hover:text-orange-200"
        >
          Interactive example with every option <ArrowRight className="w-4 h-4" />
        </Link>
      </DocSection>

      <DocSection title="Drag Props">
        <p className="text-muted-foreground mb-4">
          Defaults are taken from the implementation. The native HTML5 <code>onDrag*</code> handlers
          are replaced by these pointer-based callbacks.
        </p>
        <PropsTable rows={DRAG_PROPS} caption="Animated drag props" />
      </DocSection>

      <DocSection title="PanInfo">
        <p className="text-muted-foreground mb-4">
          The second argument of <code>onDragStart</code>, <code>onDrag</code> and{' '}
          <code>onDragEnd</code> (same shape as Framer Motion's <code>PanInfo</code>). The first
          argument is the native <code>PointerEvent</code>, not a React event.
        </p>
        <PropsTable rows={PAN_INFO} caption="PanInfo fields" />
      </DocSection>

      <DocSection title="Momentum & Snapping">
        <p className="text-muted-foreground mb-4">
          On release each axis continues with a <code>decay()</code> and bounces off the constraints
          with the bounce spring. <code>modifyTarget</code> rescales the decay so it lands exactly on
          the value you return. It only runs when there is release velocity: a slow release stays where
          it was dropped.
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`<Animated.div
  drag="x"
  dragConstraints={{ left: 0, right: 320 }}
  dragElastic={0.2}
  dragTransition={{
    deceleration: 0.995,                          // stops sooner than 0.998
    modifyTarget: (t) => Math.round(t / 80) * 80, // land on 80px steps
    bounceStiffness: 300,
    bounceDamping: 20,
  }}
/>`} />
          </CardContent>
        </Card>
        <p className="text-sm text-muted-foreground">
          Drag honors <code>prefers-reduced-motion</code> by default, without a{' '}
          <code>MotionConfig</code>: with reduced motion (the OS setting, or{' '}
          <code>{'<MotionConfig reducedMotion="always">'}</code>) the release animation is skipped and
          the element jumps to where momentum would have come to rest. The pointer itself is still
          followed 1:1. <code>{'<MotionConfig reducedMotion="never">'}</code> opts out.
        </p>
      </DocSection>

      <DocSection title="Drag Handles: useDragControls">
        <p className="text-muted-foreground mb-4">
          Start the drag from another element and turn off the element's own listener. Because{' '}
          <code>dragListener</code> is off, set <code>touch-action: none</code> on the handle yourself.
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { Animated, useDragControls } from '@oxog/springkit/react'

function Card() {
  const controls = useDragControls()

  return (
    <Animated.div drag dragControls={controls} dragListener={false}>
      <button
        aria-label="Drag handle"
        style={{ touchAction: 'none' }}
        onPointerDown={(e) => controls.start(e)}
      >
        ⋮⋮
      </button>
      Card content (text stays selectable)
      <button onClick={() => controls.cancel()}>Put back</button>
    </Animated.div>
  )
}`} />
          </CardContent>
        </Card>
        <PropsTable rows={CONTROLS} caption="DragControls methods" />
      </DocSection>
    </DocLayout>
  )
}
