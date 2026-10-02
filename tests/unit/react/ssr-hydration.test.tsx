/**
 * Hydration tests for the React adapter.
 *
 * The markup is rendered with `renderToString` in a server-like state (no
 * `matchMedia`, no `IntersectionObserver`), then the client environment is
 * switched to values that differ from the server defaults (reduced motion
 * preferred, every element in view) before hydrating with `hydrateRoot`.
 * Components must render the same markup on the server and on the first
 * client render, and only then update to the client values.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { hydrateRoot, type Root } from 'react-dom/client'
import { act } from '@testing-library/react'
import {
  Animated,
  AnimatePresence,
  MotionConfig,
  useMotionConfig,
  SpringText,
  SpringNumber,
  TypeWriter,
  SplitText,
  Spring,
  Trail,
  LazyMotion,
  MotionFeatureGuard,
  domMax,
  Reorder,
  Magnetic,
  Parallax,
  MouseParallax,
  TiltCard,
  createMotionComponent,
  useReducedMotion,
  useShouldAnimate,
  useInView,
  useScroll,
  useMotionValue,
  useMotionValueState,
  useVariants,
} from '../../../src/adapters/react/index'

// ============ Environment control ============

/** Client IntersectionObserver that reports every observed element as visible */
class VisibleIntersectionObserver {
  readonly root = null
  readonly rootMargin = '0px'
  readonly thresholds = [0]
  constructor(private readonly callback: IntersectionObserverCallback) {}
  observe(target: Element): void {
    const rect = target.getBoundingClientRect()
    this.callback(
      [{
        isIntersecting: true,
        intersectionRatio: 1,
        boundingClientRect: rect,
        intersectionRect: rect,
        rootBounds: null,
        target,
        time: 0,
      }],
      this as unknown as IntersectionObserver
    )
  }
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

/** Server-like globals: no media queries, no intersection observer */
function stubServerGlobals() {
  vi.stubGlobal('matchMedia', undefined)
  vi.stubGlobal('IntersectionObserver', undefined)
}

/** Client globals that differ from the server defaults */
function stubClientGlobals() {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }))
  vi.stubGlobal('IntersectionObserver', VisibleIntersectionObserver)
}

// ============ Hydration helper ============

let errorSpy: ReturnType<typeof vi.spyOn>
let warnSpy: ReturnType<typeof vi.spyOn>
let roots: Root[] = []
let containers: HTMLElement[] = []

beforeEach(() => {
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  act(() => {
    roots.forEach((root) => root.unmount())
  })
  containers.forEach((container) => container.remove())
  roots = []
  containers = []
  vi.unstubAllGlobals()
  errorSpy.mockRestore()
  warnSpy.mockRestore()
})

function formatCalls(spy: ReturnType<typeof vi.spyOn>): string {
  return spy.mock.calls.map((args) => args.map(String).join(' ')).join('\n')
}

/**
 * Render `element` on the "server", hydrate it on the "client" and assert that
 * hydration produced no mismatch (recoverable error or console error)
 */
async function serverRenderAndHydrate(element: React.ReactElement): Promise<{ container: HTMLElement; html: string }> {
  stubServerGlobals()
  const html = renderToString(element)

  stubClientGlobals()
  const container = document.createElement('div')
  container.innerHTML = html
  document.body.appendChild(container)
  containers.push(container)

  const recoverableErrors: unknown[] = []
  await act(async () => {
    roots.push(
      hydrateRoot(container, element, {
        onRecoverableError: (error) => recoverableErrors.push(error),
      })
    )
  })

  expect(recoverableErrors.map(String), 'recoverable hydration errors').toEqual([])
  expect(formatCalls(errorSpy), 'console.error during hydration').toBe('')
  expect(formatCalls(warnSpy), 'console.warn during hydration').toBe('')
  return { container, html }
}

async function flush(ms = 50) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms))
  })
}

// ============ Probe components ============

function ReducedMotionProbe() {
  const reduced = useReducedMotion()
  const shouldAnimate = useShouldAnimate()
  return <span data-reduced={String(reduced)} data-animate={String(shouldAnimate)}>{`reduced:${reduced}`}</span>
}

function MotionConfigProbe() {
  const { isReducedMotion } = useMotionConfig()
  return <span data-testid="cfg">{`config-reduced:${isReducedMotion}`}</span>
}

function InViewProbe() {
  const { ref, inView } = useInView()
  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} data-inview={String(inView)}>
      {inView ? 'visible' : 'hidden'}
    </div>
  )
}

function ScrollProbe() {
  const { scrollYProgress } = useScroll()
  const mv = useMotionValue(5)
  const value = useMotionValueState(mv)
  return <span>{`${scrollYProgress.get()}|${value}`}</span>
}

function VariantsProbe() {
  const { values } = useVariants({
    variants: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
    initial: 'hidden',
    animate: 'visible',
  })
  return <div style={{ opacity: values.opacity as number }}>variants</div>
}

const MotionItem = createMotionComponent('li', {
  variants: { hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } },
})

// ============ Tests ============

describe('hydration', () => {
  it('Animated with initial/animate hydrates without mismatch', async () => {
    const { container, html } = await serverRenderAndHydrate(
      <Animated.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>box</Animated.div>
    )
    expect(html).toContain('opacity:0')
    expect(container.textContent).toBe('box')
  })

  it('Animated inside MotionConfig reducedMotion="user" hydrates without mismatch when the client prefers reduced motion', async () => {
    const { container, html } = await serverRenderAndHydrate(
      <MotionConfig reducedMotion="user">
        <Animated.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>box</Animated.div>
        <MotionConfigProbe />
      </MotionConfig>
    )
    expect(html).toContain('opacity:0')
    expect(html).toContain('config-reduced:false')
    // After hydration MotionConfig picks up the client preference
    expect(container.textContent).toContain('config-reduced:true')
  })

  it('Animated gesture props hydrate without mismatch', async () => {
    await serverRenderAndHydrate(
      <Animated.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        whileInView={{ y: 0 }}
        drag="x"
      >
        press
      </Animated.button>
    )
  })

  it('SpringText hydrates without mismatch', async () => {
    const { container } = await serverRenderAndHydrate(<SpringText>Hello world</SpringText>)
    expect(container.textContent).toBe('Hello world')
  })

  it('SpringText (words, no mount animation) hydrates without mismatch', async () => {
    await serverRenderAndHydrate(<SpringText mode="words" animateOnMount={false}>Hello world</SpringText>)
  })

  it('SpringNumber / TypeWriter / SplitText hydrate without mismatch', async () => {
    await serverRenderAndHydrate(
      <div>
        <SpringNumber value={12.5} decimals={1} prefix="$" />
        <TypeWriter>typing</TypeWriter>
        <SplitText render={(el) => <b>{el}</b>}>ab</SplitText>
      </div>
    )
  })

  it.each(['sync', 'wait', 'popLayout'] as const)('AnimatePresence mode="%s" hydrates without mismatch', async (mode) => {
    const { container } = await serverRenderAndHydrate(
      <div style={{ position: 'relative' }}>
        <AnimatePresence mode={mode}>
          <Animated.div key="a" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>a</Animated.div>
          <Animated.div key="b" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>b</Animated.div>
        </AnimatePresence>
      </div>
    )
    expect(container.textContent).toBe('ab')
  })

  it('AnimatePresence initial={false} hydrates without mismatch', async () => {
    const { html } = await serverRenderAndHydrate(
      <AnimatePresence initial={false}>
        <Animated.div key="a" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>a</Animated.div>
      </AnimatePresence>
    )
    expect(html).toContain('opacity:1')
  })

  it('Trail and Spring hydrate without mismatch', async () => {
    const { container } = await serverRenderAndHydrate(
      <div>
        <Trail items={['a', 'b', 'c']} keys={(item) => item} from={{ opacity: 0 }} to={{ opacity: 1 }}>
          {(values, item) => <span style={{ opacity: values.opacity }}>{item}</span>}
        </Trail>
        <Spring from={{ opacity: 0 }} to={{ opacity: 1 }}>
          {(values) => <i style={{ opacity: values.opacity }}>s</i>}
        </Spring>
      </div>
    )
    expect(container.textContent).toBe('abcs')
  })

  it('useReducedMotion hydrates with the server default, then updates', async () => {
    const { container, html } = await serverRenderAndHydrate(<ReducedMotionProbe />)
    expect(html).toContain('reduced:false')
    expect(container.textContent).toBe('reduced:true')
    expect(container.querySelector('span')?.getAttribute('data-animate')).toBe('false')
  })

  it('useInView hydrates as not in view, then updates', async () => {
    const { container, html } = await serverRenderAndHydrate(<InViewProbe />)
    expect(html).toContain('hidden')
    await flush()
    expect(container.textContent).toBe('visible')
  })

  it('LazyMotion with async features hydrates without mismatch, then loads', async () => {
    const loader = () => Promise.resolve(domMax)
    const { container, html } = await serverRenderAndHydrate(
      <LazyMotion features={loader}>
        <span>content</span>
        <MotionFeatureGuard feature="layout" fallback={<span>fallback</span>}>
          <span>layout</span>
        </MotionFeatureGuard>
      </LazyMotion>
    )
    expect(html).toContain('content')
    await flush()
    expect(container.textContent).toBe('contentlayout')
  })

  it('Reorder, Magnetic and the parallax components hydrate without mismatch', async () => {
    await serverRenderAndHydrate(
      <div>
        <Reorder.Group values={['a', 'b']} onReorder={() => {}}>
          <Reorder.Item value="a">a</Reorder.Item>
          <Reorder.Item value="b">b</Reorder.Item>
        </Reorder.Group>
        <Magnetic><button type="button">m</button></Magnetic>
        <Parallax><span>p</span></Parallax>
        <MouseParallax><span>mp</span></MouseParallax>
        <TiltCard glare><span>t</span></TiltCard>
      </div>
    )
  })

  it('variants, createMotionComponent and MotionValue hooks hydrate without mismatch', async () => {
    await serverRenderAndHydrate(
      <div>
        <VariantsProbe />
        <ul><MotionItem initial="hidden" animate="visible">item</MotionItem></ul>
        <ScrollProbe />
      </div>
    )
  })
})

describe('browsers without IntersectionObserver', () => {
  it('useInView and Parallax hydrate without throwing and treat elements as visible', async () => {
    stubServerGlobals()
    const element = (
      <div>
        <InViewProbe />
        <Parallax><span>p</span></Parallax>
      </div>
    )
    const html = renderToString(element)
    const container = document.createElement('div')
    container.innerHTML = html
    document.body.appendChild(container)
    containers.push(container)

    // matchMedia and IntersectionObserver stay unavailable on the client
    await act(async () => {
      roots.push(hydrateRoot(container, element))
    })
    await flush()
    expect(container.textContent).toBe('visiblep')
    expect(formatCalls(errorSpy)).toBe('')
  })
})
