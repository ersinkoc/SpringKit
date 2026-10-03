import { describe, it, expect, afterEach, vi } from 'vitest'
import { spring } from '../../../src/core/spring'
import { globalLoop } from '../../../src/animation/loop'
import { createSpringValue } from '../../../src/core/spring-value'
import { installTestClock, type TestClock } from '../../../src/testing/index'

let clock: TestClock | null = null
afterEach(() => {
  clock?.uninstall()
  clock = null
})

describe('spring retargeted from its own onUpdate on the frame it settles', () => {
  it('keeps animating toward the new target instead of jumping to it', () => {
    clock = installTestClock()
    let retargetFrame = false
    const onComplete = vi.fn()
    const anim = spring(0, 100, {
      stiffness: 170,
      damping: 26,
      // Wide rest band: the first frame within 1 unit is the settling frame
      restDelta: 1,
      restSpeed: 100,
      onComplete,
      onUpdate: (v) => {
        // Bounce back once the value has (almost) arrived
        if (!retargetFrame && v > 99 && v < 100) {
          retargetFrame = true
          anim.setWithVelocity(0)
        }
      },
    })
    anim.start()
    while (!retargetFrame) clock.nextFrame()

    // Still at ~100, heading for 0: no teleport, no completion
    expect(anim.getValue()).toBeGreaterThan(98)
    expect(anim.isAnimating()).toBe(true)
    expect(onComplete).not.toHaveBeenCalled()

    clock.runAll()
    expect(anim.getValue()).toBe(0)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('a SpringValue retargeted by its own subscriber keeps moving smoothly', () => {
    clock = installTestClock()
    const value = createSpringValue(0, { stiffness: 170, damping: 26, restDelta: 1, restSpeed: 100 })
    const seen: number[] = []
    let bounced = false
    value.subscribe((v) => {
      seen.push(v)
      if (!bounced && v > 99 && v < 100) {
        bounced = true
        value.set(0)
      }
    })
    value.set(100)
    clock.runAll()
    expect(value.get()).toBe(0)
    // No frame-to-frame jump of the full distance
    let maxStep = 0
    for (let i = 1; i < seen.length; i++) maxStep = Math.max(maxStep, Math.abs(seen[i]! - seen[i - 1]!))
    expect(maxStep).toBeLessThan(50)
    value.destroy()
  })

  it('stop() from onUpdate on the settling frame does not fire onComplete', () => {
    clock = installTestClock()
    const onComplete = vi.fn()
    let stopped = false
    const anim = spring(0, 100, {
      stiffness: 170,
      damping: 26,
      // Wide rest band: the first frame within 1 unit is the settling frame
      restDelta: 1,
      restSpeed: 100,
      onComplete,
      onUpdate: (v) => {
        if (!stopped && v > 99 && v < 100) {
          stopped = true
          anim.stop()
        }
      },
    })
    anim.start()
    clock.runAll()
    expect(stopped).toBe(true)
    expect(onComplete).not.toHaveBeenCalled()
    expect(anim.isComplete()).toBe(false)
  })
})

describe('spring used after destroy()', () => {
  it('start() does nothing (and warns in development)', () => {
    clock = installTestClock()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const onStart = vi.fn()
    const anim = spring(0, 100, { onStart })
    anim.destroy()
    const sizeBefore = globalLoop.size
    expect(anim.start()).toBe(anim)
    expect(anim.isAnimating()).toBe(false)
    expect(globalLoop.size).toBe(sizeBefore)
    clock.advance(100)
    expect(anim.getValue()).toBe(0)
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
