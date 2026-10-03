import { describe, it, expect, afterEach, vi } from 'vitest'
import { globalLoop } from '../../../src/animation/loop'
import { animateNative } from '../../../src/native/animate-native'

afterEach(() => {
  globalLoop.setTimeScale(1)
})

/** WAAPI Animation model: a new `finished` promise per run, like browsers */
class FakeAnimation {
  playbackRate = 1
  playState: 'running' | 'paused' | 'finished' | 'idle' = 'running'
  finished!: Promise<FakeAnimation>
  private resolveRun!: (a: FakeAnimation) => void
  private rejectRun!: (e: unknown) => void
  rates: number[] = []
  constructor() {
    this.newRun()
  }
  private newRun() {
    this.finished = new Promise((resolve, reject) => {
      this.resolveRun = resolve
      this.rejectRun = reject
    })
    this.finished.catch(() => {})
  }
  updatePlaybackRate(rate: number) {
    this.playbackRate = rate
    this.rates.push(rate)
  }
  play() {
    if (this.playState === 'finished' || this.playState === 'idle') this.newRun()
    this.playState = 'running'
  }
  pause() {
    this.playState = 'paused'
  }
  reverse() {
    this.playbackRate = -this.playbackRate
    this.play()
  }
  finish() {
    this.playState = 'finished'
    this.resolveRun(this)
  }
  cancel() {
    if (this.playState !== 'idle' && this.playState !== 'finished') {
      this.rejectRun(new Error('AbortError'))
    }
    this.playState = 'idle'
    this.newRun()
  }
  commitStyles() {}
}

const flush = async () => {
  for (let i = 0; i < 5; i++) await Promise.resolve()
}

function setup(options: Parameters<typeof animateNative>[2] = {}) {
  const el = document.createElement('div')
  const fake = new FakeAnimation()
  ;(el as unknown as { animate: () => unknown }).animate = () => fake
  return { fake, controls: animateNative(el, { opacity: [0, 1] }, options) }
}

describe('animateNative() lifecycle', () => {
  it('releases the time scale listener while paused and re-applies the scale on play()', () => {
    const { fake, controls } = setup()
    controls.pause()
    globalLoop.setTimeScale(0.25)
    // Not listening while paused: nothing is applied (and nothing retained)
    expect(fake.rates).toEqual([])
    controls.play()
    expect(fake.playbackRate).toBe(0.25)
    globalLoop.setTimeScale(0.5)
    expect(fake.playbackRate).toBe(0.5)
    controls.cancel()
  })

  it('with persist: false, a replay follows the time scale and fires onComplete again', async () => {
    const onComplete = vi.fn()
    const { fake, controls } = setup({ persist: false, onComplete })
    controls.finish()
    await flush()
    expect(onComplete).toHaveBeenCalledTimes(1)
    globalLoop.setTimeScale(0.5)
    expect(fake.rates).toEqual([]) // finished: not listening

    controls.play()
    expect(fake.playbackRate).toBe(0.5)
    globalLoop.setTimeScale(2)
    expect(fake.playbackRate).toBe(2)
    const second = controls.finished
    controls.finish()
    await second
    await flush()
    expect(onComplete).toHaveBeenCalledTimes(2)
  })

  it('cancel() releases the listener right away', () => {
    const { fake, controls } = setup()
    controls.cancel()
    globalLoop.setTimeScale(0.3)
    expect(fake.rates).toEqual([])
  })
})
