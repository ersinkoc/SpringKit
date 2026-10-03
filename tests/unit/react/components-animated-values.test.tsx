/**
 * Animated: string values (colors, units, complex strings) animate through
 * the spring instead of jumping
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, act, cleanup, screen, fireEvent } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import * as React from 'react'
import { Animated, AnimatePresence, MotionConfig } from '@oxog/springkit/react'
import { installTestClock, type TestClock } from '@oxog/springkit/testing'
import {
  parseAnimatableValue,
  composeAnimatableValue,
} from '../../../src/adapters/react/utils/animatable'

let clock: TestClock | null = null
afterEach(() => {
  cleanup()
  clock?.uninstall()
  clock = null
})

const config = { stiffness: 170, damping: 26 }

/** Advance frame by frame, sampling after each one */
async function advance(ms: number, onFrame?: () => void) {
  for (let t = 0; t < ms; t += 16) {
    await act(async () => {
      clock!.advance(Math.min(16, ms - t))
    })
    onFrame?.()
  }
}

/** Numbers in a CSS value */
const numbers = (value: string): number[] => (value.match(/-?\d*\.?\d+/g) ?? []).map(Number)

function rgba(value: string): [number, number, number, number] {
  const [r = NaN, g = NaN, b = NaN, a = 1] = numbers(value)
  return [r, g, b, a]
}

describe('Animated string values', () => {
  it('animates a background color through intermediate colors and settles on the target', async () => {
    clock = installTestClock({ timers: true })
    render(
      <Animated.div
        data-testid="el"
        config={config}
        initial={{ backgroundColor: '#ff0000' }}
        animate={{ backgroundColor: '#0000ff' }}
      />
    )
    const el = screen.getByTestId('el')
    expect(el.style.backgroundColor).toBe('rgb(255, 0, 0)')

    const seen: string[] = []
    await advance(200, () => seen.push(el.style.backgroundColor))
    const mixed = seen.filter((value) => {
      const [r, , b] = rgba(value)
      return r > 10 && r < 245 && b > 10 && b < 245
    })
    expect(mixed.length).toBeGreaterThan(0)

    await act(async () => {
      clock!.runAll()
    })
    expect(el.style.backgroundColor).toBe('rgb(0, 0, 255)')
  })

  it('settles on the exact target string (custom property)', async () => {
    clock = installTestClock({ timers: true })
    render(
      <Animated.div
        data-testid="el"
        config={config}
        initial={{ '--accent': '#ff0000' }}
        animate={{ '--accent': '#00f' }}
      />
    )
    const el = screen.getByTestId('el')
    expect(el.style.getPropertyValue('--accent')).toBe('#ff0000')
    await advance(100)
    expect(el.style.getPropertyValue('--accent')).toMatch(/^rgba?\(/)
    await act(async () => {
      clock!.runAll()
    })
    expect(el.style.getPropertyValue('--accent')).toBe('#00f')
  })

  it('fades from transparent without going dark (premultiplied alpha)', async () => {
    clock = installTestClock({ timers: true })
    render(
      <Animated.div
        data-testid="el"
        config={config}
        initial={{ backgroundColor: 'transparent' }}
        animate={{ backgroundColor: 'rgb(255, 200, 0)' }}
      />
    )
    const el = screen.getByTestId('el')
    let partial = 0
    await advance(400, () => {
      const [r, g, b, a] = rgba(el.style.backgroundColor)
      if (a > 0 && a < 1) {
        partial++
        // The hue stays the target's while the alpha fades in
        expect(r).toBe(255)
        expect(g).toBe(200)
        expect(b).toBe(0)
      }
    })
    expect(partial).toBeGreaterThan(0)
  })

  it("animates '%' and 'rem' values", async () => {
    clock = installTestClock({ timers: true })
    render(
      <Animated.div
        data-testid="el"
        config={config}
        initial={{ x: '0%', width: '10rem' }}
        animate={{ x: '50%', width: '20rem' }}
      />
    )
    const el = screen.getByTestId('el')
    expect(el.style.width).toBe('10rem')
    await advance(100)
    const x = numbers(/translateX\(([^)]+)\)/.exec(el.style.transform)![1]!)[0]!
    expect(el.style.transform).toMatch(/translateX\([\d.]+%\)/)
    expect(x).toBeGreaterThan(0)
    expect(x).toBeLessThan(50)
    expect(el.style.width).toMatch(/rem$/)
    const width = parseFloat(el.style.width)
    expect(width).toBeGreaterThan(10)
    expect(width).toBeLessThan(20)

    await act(async () => {
      clock!.runAll()
    })
    expect(el.style.transform).toBe('translateX(50%)')
    expect(el.style.width).toBe('20rem')
  })

  it('animates a box shadow token by token', async () => {
    clock = installTestClock({ timers: true })
    const from = '0px 0px 0px rgba(0, 0, 0, 0)'
    const to = '0px 4px 12px rgba(0, 0, 0, 0.3)'
    render(<Animated.div data-testid="el" config={config} initial={{ boxShadow: from }} animate={{ boxShadow: to }} />)
    const el = screen.getByTestId('el')
    await advance(100)
    const [, y, blur] = numbers(el.style.boxShadow)
    expect(y).toBeGreaterThan(0)
    expect(y).toBeLessThan(4)
    expect(blur).toBeGreaterThan(0)
    expect(blur).toBeLessThan(12)
    await act(async () => {
      clock!.runAll()
    })
    expect(numbers(el.style.boxShadow)).toEqual(numbers(to))
  })

  it('jumps when the units differ', async () => {
    clock = installTestClock({ timers: true })
    render(<Animated.div data-testid="el" config={config} initial={{ width: '50%' }} animate={{ width: '200px' }} />)
    const el = screen.getByTestId('el')
    expect(el.style.width).toBe('50%')
    // First frame: no intermediate value
    await advance(17)
    expect(el.style.width).toBe('200px')
  })

  it('jumps from a keyword (auto) to a length', async () => {
    clock = installTestClock({ timers: true })
    const { rerender } = render(<Animated.div data-testid="el" config={config} animate={{ height: 'auto' }} />)
    const el = screen.getByTestId('el')
    expect(el.style.height).toBe('auto')
    rerender(<Animated.div data-testid="el" config={config} animate={{ height: '120px' }} />)
    expect(el.style.height).toBe('120px')
  })

  it('retargets a color mid-flight continuously', async () => {
    clock = installTestClock({ timers: true })
    const { rerender } = render(
      <Animated.div
        data-testid="el"
        config={config}
        initial={{ backgroundColor: 'rgb(255, 0, 0)' }}
        animate={{ backgroundColor: 'rgb(0, 0, 255)' }}
      />
    )
    const el = screen.getByTestId('el')
    await advance(96)
    const before = rgba(el.style.backgroundColor)
    expect(before[0]).toBeLessThan(250)
    expect(before[0]).toBeGreaterThan(5)

    rerender(
      <Animated.div
        data-testid="el"
        config={config}
        initial={{ backgroundColor: 'rgb(255, 0, 0)' }}
        animate={{ backgroundColor: 'rgb(0, 255, 0)' }}
      />
    )
    let previous = before
    let maxStep = 0
    await advance(160, () => {
      const current = rgba(el.style.backgroundColor)
      for (let i = 0; i < 3; i++) maxStep = Math.max(maxStep, Math.abs(current[i]! - previous[i]!))
      previous = current
    })
    // No jump back to red or straight to green
    expect(maxStep).toBeLessThan(60)
    await act(async () => {
      clock!.runAll()
    })
    expect(el.style.backgroundColor).toBe('rgb(0, 255, 0)')
  })

  it('animates a whileHover color and back', async () => {
    clock = installTestClock({ timers: true })
    render(
      <Animated.button
        data-testid="el"
        config={config}
        animate={{ backgroundColor: '#ffffff' }}
        whileHover={{ backgroundColor: '#000000' }}
      />
    )
    const el = screen.getByTestId('el')
    expect(el.style.backgroundColor).toBe('rgb(255, 255, 255)')
    fireEvent.pointerEnter(el, { pointerType: 'mouse' })
    fireEvent.mouseEnter(el)
    await advance(64)
    const [gray] = rgba(el.style.backgroundColor)
    expect(gray).toBeGreaterThan(0)
    expect(gray).toBeLessThan(255)
    await act(async () => {
      clock!.runAll()
    })
    expect(el.style.backgroundColor).toBe('rgb(0, 0, 0)')

    fireEvent.mouseLeave(el)
    await advance(64)
    const [back] = rgba(el.style.backgroundColor)
    expect(back).toBeGreaterThan(0)
    expect(back).toBeLessThan(255)
    await act(async () => {
      clock!.runAll()
    })
    expect(el.style.backgroundColor).toBe('rgb(255, 255, 255)')
  })

  it('starts a string key without a previous value at its target', async () => {
    clock = installTestClock({ timers: true })
    render(<Animated.button data-testid="el" config={config} whileHover={{ color: 'red' }} />)
    const el = screen.getByTestId('el')
    expect(el.style.color).toBe('')
    fireEvent.pointerEnter(el, { pointerType: 'mouse' })
    fireEvent.mouseEnter(el)
    expect(el.style.color).toBe('red')
    fireEvent.mouseLeave(el)
    expect(el.style.color).toBe('')
  })

  it('animates a string transform from its identity when only whileHover sets it', async () => {
    clock = installTestClock({ timers: true })
    render(<Animated.div data-testid="el" config={config} whileHover={{ x: '20%' }} />)
    const el = screen.getByTestId('el')
    expect(el.style.transform).toBe('translateX(0%)')
    fireEvent.mouseEnter(el)
    await advance(48)
    const x = parseFloat(/translateX\(([^)]+)\)/.exec(el.style.transform)![1]!)
    expect(x).toBeGreaterThan(0)
    expect(x).toBeLessThan(20)
  })

  it('animates an exit color under AnimatePresence, then removes the element', async () => {
    clock = installTestClock({ timers: true })
    function App({ show }: { show: boolean }) {
      return (
        <AnimatePresence>
          {show && (
            <Animated.div
              key="box"
              data-testid="el"
              config={config}
              animate={{ backgroundColor: 'rgb(255, 0, 0)' }}
              exit={{ backgroundColor: 'rgba(255, 0, 0, 0)' }}
            />
          )}
        </AnimatePresence>
      )
    }
    const { rerender } = render(<App show />)
    const el = screen.getByTestId('el')
    expect(el.style.backgroundColor).toBe('rgb(255, 0, 0)')
    rerender(<App show={false} />)
    let partial = false
    await advance(160, () => {
      if (!el.isConnected) return
      const [r, , , a] = rgba(el.style.backgroundColor)
      if (a > 0 && a < 1) {
        partial = true
        expect(r).toBe(255)
      }
    })
    expect(partial).toBe(true)
    await act(async () => {
      clock!.runAll()
    })
    expect(screen.queryByTestId('el')).toBeNull()
  })

  it('jumps to string targets with reduced motion', async () => {
    clock = installTestClock({ timers: true })
    render(
      <MotionConfig reducedMotion="always">
        <Animated.div
          data-testid="el"
          config={config}
          initial={{ backgroundColor: '#ff0000', width: '10rem' }}
          animate={{ backgroundColor: '#0000ff', width: '20rem' }}
        />
      </MotionConfig>
    )
    const el = screen.getByTestId('el')
    expect(el.style.backgroundColor).toBe('rgb(0, 0, 255)')
    expect(el.style.width).toBe('20rem')
  })

  it('never renders hidden channel keys', async () => {
    clock = installTestClock({ timers: true })
    render(
      <Animated.div
        data-testid="el"
        config={config}
        initial={{ backgroundColor: 'red', boxShadow: '0 0 0 black', opacity: 0 }}
        animate={{ backgroundColor: 'blue', boxShadow: '0 2px 4px black', opacity: 1 }}
      />
    )
    const el = screen.getByTestId('el')
    await advance(64)
    const style = el.getAttribute('style') ?? ''
    expect(style).not.toContain('\u0000')
    for (let i = 0; i < el.style.length; i++) {
      expect(el.style.item(i)).not.toContain('\u0000')
    }
  })

  it('renders initial string values unchanged during SSR', () => {
    const html = renderToString(
      <Animated.div
        initial={{ backgroundColor: '#ff0000', x: '10%', boxShadow: '0 0 0 rgba(0,0,0,.3)' }}
        animate={{ backgroundColor: '#0000ff', x: '50%', boxShadow: '0 4px 12px rgba(0,0,0,.3)', color: '#00ff00' }}
      >
        x
      </Animated.div>
    )
    expect(html).toContain('background-color:#ff0000')
    expect(html).toContain('box-shadow:0 0 0 rgba(0,0,0,.3)')
    expect(html).toContain('transform:translateX(10%)')
    // No initial: rendered at the target
    expect(html).toContain('color:#00ff00')
  })
})

describe('animatable value helpers', () => {
  it('round-trips colors, units and complex strings exactly', () => {
    for (const value of ['#f00', 'transparent', 'red', '50%', '-2.5rem', 'blur(4px) brightness(1.2)', 'calc(100% - 20px)']) {
      const parsed = parseAnimatableValue(value)
      expect(composeAnimatableValue(parsed, parsed.channels)).toBe(value)
    }
  })

  it('keeps function names that are color names literal and detects named colors', () => {
    expect(parseAnimatableValue('0 0 4px red').template.kinds).toEqual(['n', 'n', 'n', 'c'])
    expect(parseAnimatableValue('translate3d(10px, 0, 0)').template.kinds).toEqual(['n', 'n', 'n'])
    expect(parseAnimatableValue('var(--x)').template.size).toBe(0)
  })

  it('matches templates only for the same shape', () => {
    const id = (v: string | number) => parseAnimatableValue(v).template.id
    expect(id('#fff')).toBe(id('rgba(0, 0, 0, 0.5)'))
    expect(id('10px')).toBe(id('20.5px'))
    expect(id('10px')).not.toBe(id('10%'))
    expect(id(10)).not.toBe(id('10'))
    expect(id('auto')).not.toBe(id('10px'))
  })

  it('clamps overshooting color channels and keeps the hue at zero alpha', () => {
    const target = parseAnimatableValue('rgba(255, 0, 0, 0)')
    expect(composeAnimatableValue(target, [10, 0, 0, -0.1])).toBe('rgba(255, 0, 0, 0)')
    const red = parseAnimatableValue('rgb(255, 0, 0)')
    // Overshoot past opaque white-ish: clamped
    expect(composeAnimatableValue(red, [300, -20, 0, 1.05])).toBe('rgb(255, 0, 0)')
  })
})
