/**
 * useVariants / createMotionComponent: string values (colors, units) animate,
 * and `transition.when: 'beforeChildren'`
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, act, cleanup } from '@testing-library/react'
import * as React from 'react'
import {
  useVariants,
  VariantProvider,
  createMotionComponent,
} from '../../../src/adapters/react/hooks/useVariants'
import { solveSpring } from '@oxog/springkit'
import { installTestClock, type TestClock } from '@oxog/springkit/testing'

let clock: TestClock | null = null
afterEach(() => {
  cleanup()
  clock?.uninstall()
  clock = null
})

async function advance(ms: number, onFrame?: () => void) {
  for (let t = 0; t < ms; t += 16) {
    await act(async () => {
      clock!.advance(Math.min(16, ms - t))
    })
    onFrame?.()
  }
}

/** Run until settled (each act() lets React commit what the timers started) */
async function settle() {
  for (let i = 0; i < 5; i++) {
    await act(async () => {
      clock!.runAll()
    })
  }
}

const spring = { stiffness: 300, damping: 30 }
const numbers = (value: string): number[] => (value.match(/-?\d*\.?\d+/g) ?? []).map(Number)

describe('useVariants string values', () => {
  it('animates colors through intermediate values and settles on the exact target string', async () => {
    clock = installTestClock({ timers: true })
    const seen: unknown[] = []
    let api!: ReturnType<typeof useVariants>
    function C() {
      api = useVariants({
        variants: {
          hidden: { backgroundColor: '#000000' },
          visible: { backgroundColor: '#ffffff' },
        },
        initial: 'hidden',
        animate: 'visible',
        spring,
      })
      seen.push(api.values.backgroundColor)
      return null
    }
    render(<C />)
    expect(seen[0]).toBe('#000000')
    await advance(100)
    const mixed = seen.filter((value) => {
      if (typeof value !== 'string' || !value.startsWith('rgb')) return false
      const [r = 0] = numbers(value)
      return r > 5 && r < 250
    })
    expect(mixed.length).toBeGreaterThan(0)
    await settle()
    expect(api.values.backgroundColor).toBe('#ffffff')
  })

  it("animates '%' values and keeps px strings for x/y as numbers", async () => {
    clock = installTestClock({ timers: true })
    let api!: ReturnType<typeof useVariants>
    function C() {
      api = useVariants({
        variants: {
          hidden: { x: '0%', y: '10px', width: '10rem' },
          visible: { x: '100%', y: '30px', width: '20rem' },
        },
        initial: 'hidden',
        animate: 'visible',
        spring,
      })
      return null
    }
    render(<C />)
    expect(api.values.y).toBe(10)
    await advance(64)
    expect(String(api.values.x)).toMatch(/^[\d.]+%$/)
    const x = parseFloat(String(api.values.x))
    expect(x).toBeGreaterThan(0)
    expect(x).toBeLessThan(100)
    expect(typeof api.values.y).toBe('number')
    expect(api.values.y as number).toBeGreaterThan(10)
    expect(String(api.values.width)).toMatch(/rem$/)
    await settle()
    expect(api.values.x).toBe('100%')
    expect(api.values.y).toBe(30)
    expect(api.values.width).toBe('20rem')
  })

  it('jumps when the units differ', async () => {
    clock = installTestClock({ timers: true })
    const seen: unknown[] = []
    function C() {
      const { values } = useVariants({
        variants: { hidden: { width: '50%' }, visible: { width: '200px' } },
        initial: 'hidden',
        animate: 'visible',
        spring,
      })
      seen.push(values.width)
      return null
    }
    render(<C />)
    await advance(100)
    expect(seen[0]).toBe('50%')
    expect(seen[seen.length - 1]).toBe('200px')
    expect(seen.every((value) => value === '50%' || value === '200px')).toBe(true)
  })

  it('retargets a color mid-flight continuously (setVariant)', async () => {
    clock = installTestClock({ timers: true })
    let api!: ReturnType<typeof useVariants>
    function C() {
      api = useVariants({
        variants: {
          red: { color: 'rgb(255, 0, 0)' },
          blue: { color: 'rgb(0, 0, 255)' },
          green: { color: 'rgb(0, 255, 0)' },
        },
        initial: 'red',
        animate: 'blue',
        spring,
      })
      return null
    }
    render(<C />)
    await advance(64)
    let previous = numbers(String(api.values.color))
    act(() => api.setVariant('green'))
    let maxStep = 0
    await advance(160, () => {
      const current = numbers(String(api.values.color))
      for (let i = 0; i < 3; i++) maxStep = Math.max(maxStep, Math.abs(current[i]! - previous[i]!))
      previous = current
    })
    expect(maxStep).toBeLessThan(80)
    await settle()
    expect(api.values.color).toBe('rgb(0, 255, 0)')
  })

  it('animates colors under StrictMode', async () => {
    clock = installTestClock({ timers: true })
    let api!: ReturnType<typeof useVariants>
    function C() {
      api = useVariants({
        variants: { a: { color: '#ff0000' }, b: { color: '#0000ff' } },
        initial: 'a',
        animate: 'b',
        spring,
      })
      return null
    }
    render(
      <React.StrictMode>
        <C />
      </React.StrictMode>
    )
    await advance(48)
    expect(String(api.values.color)).toMatch(/^rgb/)
    await settle()
    expect(api.values.color).toBe('#0000ff')
  })
})

describe('createMotionComponent string values', () => {
  it('animates a background color on the element', async () => {
    clock = installTestClock({ timers: true })
    const MotionDiv = createMotionComponent('div', {
      variants: {
        hidden: { backgroundColor: 'transparent', opacity: 0 },
        visible: { backgroundColor: 'rgb(0, 128, 255)', opacity: 1 },
      },
      spring,
    })
    const { getByTestId } = render(<MotionDiv data-testid="box" initial="hidden" animate="visible" />)
    const el = getByTestId('box')
    expect(el.style.backgroundColor).toBe('transparent')
    let partial = 0
    await advance(160, () => {
      const [r = 0, g = 0, b = 0, a = 1] = numbers(el.style.backgroundColor)
      if (a > 0 && a < 1) {
        partial++
        // Premultiplied: the hue doesn't go dark while fading in
        expect([r, g, b]).toEqual([0, 128, 255])
      }
    })
    expect(partial).toBeGreaterThan(0)
    await settle()
    expect(el.style.backgroundColor).toBe('rgb(0, 128, 255)')
  })
})

describe("transition.when: 'beforeChildren'", () => {
  const variants = { hidden: { opacity: 0 }, visible: { opacity: 1 } }
  const parentSpring = { stiffness: 200, damping: 20 }

  it('starts the children once the parent has settled', async () => {
    clock = installTestClock({ timers: true })
    const parentSettle = solveSpring({ ...parentSpring, mass: 1 }, 0, 1).duration
    const opacities = [-1, -1]
    function Item({ i }: { i: number }) {
      const { values } = useVariants({ variants, initial: 'hidden', spring })
      opacities[i] = Number(values.opacity)
      return null
    }
    render(
      <VariantProvider
        variant="visible"
        transition={{ when: 'beforeChildren', spring: parentSpring, staggerChildren: 200 }}
      >
        <Item i={0} />
        <Item i={1} />
      </VariantProvider>
    )
    await advance(parentSettle - 40)
    expect(opacities).toEqual([0, 0])
    await advance(140)
    expect(opacities[0]).toBeGreaterThan(0)
    expect(opacities[1]).toBe(0)
    await settle()
    expect(opacities).toEqual([1, 1])
  })

  it('does not delay the children without `when`', async () => {
    clock = installTestClock({ timers: true })
    let opacity = -1
    function Item() {
      const { values } = useVariants({ variants, initial: 'hidden', spring })
      opacity = Number(values.opacity)
      return null
    }
    render(
      <VariantProvider variant="visible" transition={{ spring: parentSpring }}>
        <Item />
      </VariantProvider>
    )
    await advance(100)
    expect(opacity).toBeGreaterThan(0)
  })
})
