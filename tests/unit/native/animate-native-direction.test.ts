import { describe, it, expect, afterEach } from 'vitest'
import { globalLoop } from '../../../src/animation/loop'
import { animateNative } from '../../../src/native/animate-native'

afterEach(() => {
  globalLoop.setTimeScale(1)
})

/** Minimal WAAPI Animation model: reverse() flips the playback direction */
function fakeAnimation() {
  const fake = {
    playbackRate: 1,
    finished: new Promise<void>(() => {}),
    commitStyles() {},
    cancel() {},
    play() {},
    reverse() {
      fake.playbackRate = -fake.playbackRate
    },
    updatePlaybackRate(rate: number) {
      fake.playbackRate = rate
    },
  }
  return fake
}

describe('animateNative() direction × time scale', () => {
  it('a time scale change keeps a reversed animation playing backwards', () => {
    const el = document.createElement('div')
    const fake = fakeAnimation()
    ;(el as unknown as { animate: () => unknown }).animate = () => fake

    const controls = animateNative(el, { opacity: [0, 1] })
    controls.reverse()
    expect(fake.playbackRate).toBe(-1)

    globalLoop.setTimeScale(0.5)
    expect(fake.playbackRate).toBe(-0.5)
    globalLoop.setTimeScale(1)
    expect(fake.playbackRate).toBe(-1)

    controls.reverse()
    expect(fake.playbackRate).toBe(1)
    controls.cancel()
  })

  it('reverse() while frozen (time scale 0) resumes backwards when unfrozen', () => {
    const el = document.createElement('div')
    const fake = fakeAnimation()
    ;(el as unknown as { animate: () => unknown }).animate = () => fake

    globalLoop.setTimeScale(0)
    const controls = animateNative(el, { opacity: [0, 1] })
    expect(fake.playbackRate).toBe(0)
    controls.reverse()
    globalLoop.setTimeScale(1)
    expect(fake.playbackRate).toBe(-1)
    controls.cancel()
  })
})
