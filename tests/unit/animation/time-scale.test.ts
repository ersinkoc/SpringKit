import { describe, it, expect, afterEach, vi } from 'vitest'
import { globalLoop } from '../../../src/animation/loop'
import { spring } from '../../../src/core/spring'
import { decay } from '../../../src/animation/decay'
import { animateNative } from '../../../src/native/animate-native'
import { installTestClock, type TestClock } from '../../../src/testing/index'

let clock: TestClock | null = null
afterEach(() => {
  globalLoop.setTimeScale(1)
  clock?.uninstall()
  clock = null
})

const runSpringFor = (ms: number) => {
  const anim = spring(0, 100, { stiffness: 180, damping: 20 })
  anim.start()
  clock!.advance(ms)
  const value = anim.getValue()
  anim.destroy()
  return value
}

describe('globalLoop time scale', () => {
  it('defaults to 1 and sanitizes input', () => {
    expect(globalLoop.getTimeScale()).toBe(1)
    globalLoop.setTimeScale(-2)
    expect(globalLoop.getTimeScale()).toBe(0)
    globalLoop.setTimeScale(NaN)
    expect(globalLoop.getTimeScale()).toBe(0)
    globalLoop.setTimeScale(0.25)
    expect(globalLoop.getTimeScale()).toBe(0.25)
  })

  it('plays springs in slow motion: 200ms at 0.5x equals 100ms at 1x', () => {
    clock = installTestClock({ startTime: 0 })
    const normal = runSpringFor(100)
    globalLoop.setTimeScale(0.5)
    const slow = runSpringFor(200)
    expect(slow).toBeGreaterThan(5)
    expect(Math.abs(slow - normal)).toBeLessThan(1e-9)
  })

  it('speeds animations up', () => {
    clock = installTestClock({ startTime: 0 })
    const normal = runSpringFor(100)
    globalLoop.setTimeScale(2)
    const fast = runSpringFor(50)
    expect(Math.abs(fast - normal)).toBeLessThan(1e-9)
  })

  it('freezes everything at 0 and resumes seamlessly', () => {
    clock = installTestClock({ startTime: 0 })
    let value = 0
    const anim = decay({ velocity: 1000, onUpdate: (v) => (value = v) })
    anim.start()
    clock.advance(100)
    const before = value
    globalLoop.setTimeScale(0)
    clock.advance(1000)
    expect(value).toBe(before)
    globalLoop.setTimeScale(1)
    clock.advance(100)
    expect(value).toBeGreaterThan(before)
    anim.destroy()
  })

  it('notifies listeners only on change', () => {
    const listener = vi.fn()
    const off = globalLoop.onTimeScaleChange(listener)
    globalLoop.setTimeScale(0.5)
    globalLoop.setTimeScale(0.5)
    off()
    globalLoop.setTimeScale(1)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith(0.5)
  })

  it('applies to native (WAAPI) animations while they run', async () => {
    const el = document.createElement('div')
    let resolve!: () => void
    const fake = {
      finished: new Promise<void>((r) => (resolve = r)),
      commitStyles: vi.fn(),
      cancel: vi.fn(),
      updatePlaybackRate: vi.fn(),
    }
    ;(el as unknown as { animate: () => unknown }).animate = () => fake

    globalLoop.setTimeScale(0.2)
    const controls = animateNative(el, { opacity: [0, 1] })
    expect(fake.updatePlaybackRate).toHaveBeenLastCalledWith(0.2)

    globalLoop.setTimeScale(1)
    expect(fake.updatePlaybackRate).toHaveBeenLastCalledWith(1)

    resolve()
    await controls.finished
    globalLoop.setTimeScale(0.3)
    // unsubscribed once finished
    expect(fake.updatePlaybackRate).toHaveBeenCalledTimes(2)
  })
})
