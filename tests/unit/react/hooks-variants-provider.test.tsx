/**
 * VariantProvider stagger indexing, createMotionComponent and useAnimate
 * start values
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, act, cleanup } from '@testing-library/react'
import * as React from 'react'
import {
  VariantProvider,
  useVariants,
  useVariantContext,
  createMotionComponent,
} from '../../../src/adapters/react/hooks/useVariants'
import { useAnimate } from '../../../src/adapters/react/hooks/useAnimate'
import { installTestClock, type TestClock } from '@oxog/springkit/testing'

let clock: TestClock | null = null
afterEach(() => {
  cleanup()
  clock?.uninstall()
  clock = null
})

async function advance(ms: number) {
  for (let t = 0; t < ms; t += 16) {
    await act(async () => {
      clock!.advance(Math.min(16, ms - t))
    })
  }
}

const variants = { hidden: { opacity: 0 }, visible: { opacity: 1 } }
const spring = { stiffness: 600, damping: 60 }

describe('VariantProvider', () => {
  it('gives each direct child its stagger index and the child count', () => {
    const seen: Array<[number | undefined, number | undefined]> = []
    function Child() {
      const ctx = useVariantContext()
      seen.push([ctx.staggerIndex, ctx.staggerCount])
      return null
    }
    render(
      <VariantProvider variant="visible">
        <Child />
        <Child />
        <Child />
      </VariantProvider>
    )
    expect(seen).toEqual([
      [0, 3],
      [1, 3],
      [2, 3],
    ])
  })

  it('staggers children with transition.staggerChildren', async () => {
    clock = installTestClock({ timers: true })
    const opacities: number[] = [-1, -1, -1]
    function Item({ i }: { i: number }) {
      const { values } = useVariants({ variants, initial: 'hidden', spring })
      opacities[i] = Number(values.opacity)
      return null
    }
    render(
      <VariantProvider variant="visible" transition={{ staggerChildren: 100 }}>
        {[0, 1, 2].map((i) => (
          <Item key={i} i={i} />
        ))}
      </VariantProvider>
    )
    await advance(150)
    expect(opacities[0]).toBeGreaterThan(0.5)
    expect(opacities[1]).toBeGreaterThan(0)
    expect(opacities[2]).toBe(0)
    await advance(800)
    for (const o of opacities) expect(o).toBeGreaterThan(0.99)
  })
})

describe('createMotionComponent', () => {
  it('renders the element, forwards refs and props, and animates to the variant', async () => {
    clock = installTestClock({ timers: true })
    const MotionDiv = createMotionComponent('div', {
      variants: { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } },
      spring,
    })
    expect(MotionDiv.displayName).toBe('Motion(div)')

    const ref = React.createRef<HTMLDivElement>()
    const { getByTestId } = render(
      <MotionDiv
        ref={ref}
        data-testid="box"
        className="card"
        initial="hidden"
        animate="visible"
        style={{ color: 'red' }}
      />
    )
    const el = getByTestId('box')
    expect(ref.current).toBe(el)
    expect(el.className).toBe('card')
    expect(el.style.color).toBe('red')
    expect(Number(el.style.opacity)).toBe(0)
    expect(el.style.transform).toContain('translate(-20px, 0px)')
    expect(el.hasAttribute('variants')).toBe(false)

    await advance(800)
    expect(Number(el.style.opacity)).toBeGreaterThan(0.99)
  })

  it('inherits the variant from a VariantProvider', async () => {
    clock = installTestClock({ timers: true })
    const MotionLi = createMotionComponent('li', { variants, spring })
    const { getByTestId } = render(
      <VariantProvider variant="visible">
        <MotionLi data-testid="li" initial="hidden" />
      </VariantProvider>
    )
    await advance(800)
    expect(Number(getByTestId('li').style.opacity)).toBeGreaterThan(0.99)
  })
})

describe('useAnimate start values', () => {
  it('starts scale at 1 and opacity at the element value instead of 0', async () => {
    clock = installTestClock({ timers: true })
    let api: ReturnType<typeof useAnimate> | null = null
    function Box() {
      const result = useAnimate()
      api = result
      return <div ref={result[0] as React.Ref<HTMLDivElement>} data-testid="b" style={{ opacity: 0.5 }} />
    }
    const { getByTestId } = render(<Box />)
    const [, animate] = api!
    let done: Promise<void> | undefined
    await act(async () => {
      done = animate({ scale: 1.2, opacity: 1 }, { config: { stiffness: 300, damping: 30 } })
    })
    await advance(16)
    const el = getByTestId('b')
    const scale = Number(/scale\(([^)]+)\)/.exec(el.style.transform)?.[1])
    expect(scale).toBeGreaterThan(0.99)
    expect(Number(el.style.opacity)).toBeGreaterThan(0.49)
    await advance(1500)
    await done
    expect(Number(el.style.opacity)).toBeCloseTo(1, 2)
  })
})
