import { describe, it, expect, afterEach, vi } from 'vitest'
import * as React from 'react'
import { render, act, cleanup, screen, fireEvent } from '@testing-library/react'
import { Reorder } from '@oxog/springkit/react'
import { installTestClock, type TestClock } from '@oxog/springkit/testing'

// jsdom has no layout: getBoundingClientRect is mocked at the seam (50px per item).
function mockLayout(list: HTMLElement) {
  Array.from(list.children).forEach((child) => {
    const el = child as HTMLElement
    el.getBoundingClientRect = () => {
      const top = Array.from(list.children).indexOf(el) * 50
      return { left: 0, top, width: 200, height: 50, right: 200, bottom: top + 50, x: 0, y: top, toJSON() { return {} } } as DOMRect
    }
  })
}

interface Opts<T extends string | number> {
  onReorder?: (o: T[]) => void
  onDragStart?: Partial<Record<string, () => void>>
  onDragEnd?: Partial<Record<string, () => void>>
}

function tree<T extends string | number>(values: T[], o: Opts<T> = {}) {
  return (
    <Reorder.Group values={values} onReorder={o.onReorder ?? (() => {})} layoutDuration={0}>
      {values.map((v) => (
        <Reorder.Item key={v} value={v} onDragStart={o.onDragStart?.[String(v)]} onDragEnd={o.onDragEnd?.[String(v)]}>
          {`item-${v}`}
        </Reorder.Item>
      ))}
    </Reorder.Group>
  )
}

const tf = (label: string) => screen.getByText(`item-${label}`).style.transform
async function settle(clock: TestClock) { await act(async () => { clock.runAll() }) }

/** Collect window 'error' events (rethrown user-callback errors) so vitest does not flag them unhandled */
function captureErrors() {
  const errors: string[] = []
  const h = (e: ErrorEvent) => { errors.push(String(e.error?.message ?? e.message)); e.preventDefault() }
  window.addEventListener('error', h)
  return { errors, stop: () => window.removeEventListener('error', h) }
}

let clock: TestClock
afterEach(() => { cleanup(); clock?.uninstall() })

const down = (el: HTMLElement, y: number) => fireEvent.pointerDown(el, { clientX: 10, clientY: y, pointerId: 1 })
const move = (el: HTMLElement, y: number) => fireEvent.pointerMove(el, { clientX: 10, clientY: y, pointerId: 1 })
const up = (el: HTMLElement, y: number) => fireEvent.pointerUp(el, { clientX: 10, clientY: y, pointerId: 1 })
const ev = (id: number, y: number, extra: object = {}) => ({ clientX: 10, clientY: y, pointerId: id, ...extra })

async function mount(values: (string | number)[], onReorder = vi.fn()) {
  clock = installTestClock({ timers: true })
  const r = render(tree(values, { onReorder }))
  await settle(clock)
  mockLayout(screen.getByRole('listbox'))
  return { ...r, onReorder }
}

function StrictWrap({ values }: { values: string[] }) {
  return <React.StrictMode>{tree(values)}</React.StrictMode>
}

describe('F2101: dragged item removed mid-drag', () => {
  it('removing the dragged item mid-drag releases the displaced neighbours', async () => {
    const { rerender, onReorder } = await mount(['a', 'b', 'c'])
    const a = screen.getByText('item-a')
    down(a, 25); move(a, 85)
    await settle(clock)
    expect(tf('b')).toBe('translateY(-50px)')
    rerender(tree(['b', 'c'], { onReorder }))
    await settle(clock)
    expect(tf('b')).toBe('translateY(0px)')
    expect(tf('c')).toBe('translateY(0px)')
    expect(onReorder).not.toHaveBeenCalled()
  })

  it('a new drag works after the removal', async () => {
    const { rerender, onReorder } = await mount(['a', 'b', 'c'])
    const a = screen.getByText('item-a')
    down(a, 25); move(a, 85)
    rerender(tree(['b', 'c'], { onReorder }))
    await settle(clock)
    mockLayout(screen.getByRole('listbox'))
    const b = screen.getByText('item-b')
    down(b, 25); move(b, 85); up(b, 85)
    expect(onReorder).toHaveBeenCalledTimes(1)
    expect(onReorder).toHaveBeenCalledWith(['c', 'b'])
  })

  it('removing a different item mid-drag keeps the drag alive', async () => {
    const { rerender, onReorder } = await mount(['a', 'b', 'c'])
    const a = screen.getByText('item-a')
    down(a, 25); move(a, 85)
    rerender(tree(['a', 'b'], { onReorder }))
    await settle(clock)
    mockLayout(screen.getByRole('listbox'))
    move(a, 85)
    up(a, 85)
    expect(onReorder).toHaveBeenCalledWith(['b', 'a'])
  })

  it('handles a falsy dragged value (0) being removed', async () => {
    const { rerender, onReorder } = await mount([0, 1, 2])
    const z = screen.getByText('item-0')
    down(z, 25); move(z, 85)
    await settle(clock)
    expect(tf('1')).toBe('translateY(-50px)')
    rerender(tree([1, 2], { onReorder }))
    await settle(clock)
    expect(tf('1')).toBe('translateY(0px)')
  })

  it('control: an ordinary drag and drop still reorders', async () => {
    const { onReorder } = await mount(['a', 'b', 'c'])
    const a = screen.getByText('item-a')
    down(a, 25); move(a, 85); up(a, 85)
    expect(onReorder).toHaveBeenCalledWith(['b', 'a', 'c'])
  })

  it('works under StrictMode', async () => {
    clock = installTestClock({ timers: true })
    const { rerender } = render(<StrictWrap values={['a', 'b', 'c']} />)
    await settle(clock)
    mockLayout(screen.getByRole('listbox'))
    const a = screen.getByText('item-a')
    down(a, 25); move(a, 85)
    await settle(clock)
    rerender(<StrictWrap values={['b', 'c']} />)
    await settle(clock)
    expect(tf('b')).toBe('translateY(0px)')
  })
})

async function mountWith(o: Opts<string>) {
  clock = installTestClock({ timers: true })
  render(tree(['a', 'b', 'c'], o))
  await settle(clock)
  mockLayout(screen.getByRole('listbox'))
}

describe('F2102: throwing drag callbacks do not break the group', () => {
  it('throwing onDragEnd still reorders, restores neighbours and surfaces the error', async () => {
    const onReorder = vi.fn(); const cap = captureErrors()
    await mountWith({ onReorder, onDragEnd: { a: () => { throw new Error('end boom') } } })
    const a = screen.getByText('item-a')
    down(a, 25); move(a, 85); up(a, 85)
    await settle(clock)
    cap.stop()
    expect(onReorder).toHaveBeenCalledTimes(1)
    expect(onReorder).toHaveBeenCalledWith(['b', 'a', 'c'])
    expect(tf('b')).toBe('translateY(0px)')
    expect(tf('a')).toBe('translateY(0px)')
    expect(cap.errors).toEqual(['end boom'])
  })

  it('throwing onDragStart still leaves a fully working drag (origin, sizes, reorder)', async () => {
    const onReorder = vi.fn(); const cap = captureErrors()
    await mountWith({ onReorder, onDragStart: { a: () => { throw new Error('start boom') } } })
    const a = screen.getByText('item-a')
    down(a, 25); move(a, 85)
    expect(a.style.transform).toBe('translateY(60px)')
    up(a, 85)
    await settle(clock)
    cap.stop()
    expect(onReorder).toHaveBeenCalledWith(['b', 'a', 'c'])
    expect(cap.errors).toEqual(['start boom'])
  })

  it('both callbacks throwing, repeated drags keep working', async () => {
    const onReorder = vi.fn(); const cap = captureErrors()
    const boom = () => { throw new Error('boom') }
    await mountWith({ onReorder, onDragStart: { a: boom }, onDragEnd: { a: boom } })
    const a = screen.getByText('item-a')
    for (let i = 0; i < 2; i++) { down(a, 25); move(a, 85); up(a, 85); await settle(clock) }
    cap.stop()
    expect(onReorder).toHaveBeenCalledTimes(2)
    expect(tf('b')).toBe('translateY(0px)')
    expect(cap.errors.length).toBe(4)
  })

  it('control: no throwing callbacks, callbacks run in order start -> end -> reorder', async () => {
    const order: string[] = []; const onReorder = vi.fn(() => { order.push('reorder') })
    await mountWith({ onReorder, onDragStart: { a: () => { order.push('start') } }, onDragEnd: { a: () => { order.push('end') } } })
    const a = screen.getByText('item-a')
    down(a, 25); move(a, 85); up(a, 85)
    expect(order).toEqual(['start', 'end', 'reorder'])
  })
})

async function mountMulti() {
  clock = installTestClock({ timers: true })
  const onReorder = vi.fn(); const starts = vi.fn(); const ends = vi.fn()
  render(tree(['a', 'b', 'c'], { onReorder, onDragStart: { a: starts }, onDragEnd: { a: ends } }))
  await settle(clock)
  mockLayout(screen.getByRole('listbox'))
  return { onReorder, starts, ends, a: screen.getByText('item-a') }
}

describe('F2103: a second pointer does not hijack an active drag', () => {
  it('non-primary pointerdown while dragging is ignored', async () => {
    const { a, starts, onReorder } = await mountMulti()
    fireEvent.pointerDown(a, ev(1, 25)); fireEvent.pointerMove(a, ev(1, 85))
    fireEvent.pointerDown(a, ev(2, 30, { isPrimary: false }))
    fireEvent.pointerMove(a, ev(1, 90))
    expect(a.style.transform).toBe('translateY(65px)')
    fireEvent.pointerUp(a, ev(1, 90))
    expect(starts).toHaveBeenCalledTimes(1)
    expect(onReorder).toHaveBeenCalledWith(['b', 'a', 'c'])
  })

  it('moves, up and cancel from another pointer do not drive or end the drag', async () => {
    const { a, ends, onReorder } = await mountMulti()
    fireEvent.pointerDown(a, ev(1, 25)); fireEvent.pointerMove(a, ev(1, 85))
    fireEvent.pointerDown(a, ev(2, 30, { isPrimary: false }))
    fireEvent.pointerMove(a, ev(2, 400, { isPrimary: false }))
    expect(a.style.transform).toBe('translateY(60px)')
    fireEvent.pointerUp(a, ev(2, 400, { isPrimary: false }))
    fireEvent.pointerCancel(a, ev(2, 400, { isPrimary: false }))
    expect(ends).not.toHaveBeenCalled()
    expect(onReorder).not.toHaveBeenCalled()
    await settle(clock)
    expect(tf('b')).toBe('translateY(-50px)')
    fireEvent.pointerUp(a, ev(1, 85))
    expect(ends).toHaveBeenCalledTimes(1)
    expect(onReorder).toHaveBeenCalledWith(['b', 'a', 'c'])
    await settle(clock)
    expect(tf('b')).toBe('translateY(0px)')
  })

  it('pointercancel from the owning pointer still ends the drag, and a new drag then works', async () => {
    const { a, ends } = await mountMulti()
    fireEvent.pointerDown(a, ev(1, 25)); fireEvent.pointerMove(a, ev(1, 40))
    fireEvent.pointerCancel(a, ev(1, 40))
    expect(ends).toHaveBeenCalledTimes(1)
    fireEvent.pointerDown(a, ev(3, 25)); fireEvent.pointerMove(a, ev(3, 35))
    expect(a.style.transform).toBe('translateY(10px)')
  })

  it('a lost pointerup is recoverable: a new primary pointerdown restarts the drag', async () => {
    const { a, starts } = await mountMulti()
    fireEvent.pointerDown(a, ev(1, 25)); fireEvent.pointerMove(a, ev(1, 60))
    fireEvent.pointerDown(a, ev(5, 100)); fireEvent.pointerMove(a, ev(5, 120))
    expect(a.style.transform).toBe('translateY(20px)')
    expect(starts).toHaveBeenCalledTimes(2)
  })

  it('control: single pointer unchanged (mouse id 1, then touch id 0)', async () => {
    const { a, onReorder } = await mountMulti()
    fireEvent.pointerDown(a, ev(1, 25)); fireEvent.pointerMove(a, ev(1, 85)); fireEvent.pointerUp(a, ev(1, 85))
    fireEvent.pointerDown(a, ev(0, 25)); fireEvent.pointerMove(a, ev(0, 85)); fireEvent.pointerUp(a, ev(0, 85))
    expect(onReorder).toHaveBeenCalledTimes(2)
  })
})
