import { describe, it, expect, vi, afterEach } from 'vitest'
import { animateNative } from '../../../src/native/animate-native'

afterEach(() => {
  vi.restoreAllMocks()
})

/** Fake WAAPI Animation: the `currentTime` setter throws like browsers do for non-finite values */
class FakeAnimation {
  playbackRate = 1
  finished = new Promise<FakeAnimation>(() => {})
  times: number[] = []
  set currentTime(value: number) {
    if (!Number.isFinite(value)) throw new TypeError('currentTime: non-finite')
    this.times.push(value)
  }
  updatePlaybackRate(rate: number) {
    this.playbackRate = rate
  }
  play() {}
  pause() {}
  reverse() {}
  finish() {}
  cancel() {}
  commitStyles() {}
}

function withFakeWaapi(delay?: number) {
  const el = document.createElement('div')
  const animation = new FakeAnimation()
  const seenDelays: number[] = []
  ;(el as unknown as { animate: (k: unknown, t: { delay: number }) => unknown }).animate = (
    _keyframes,
    timing
  ) => {
    seenDelays.push(timing.delay)
    // EffectTiming.delay is a restricted double: browsers throw on NaN / Infinity
    if (!Number.isFinite(timing.delay)) throw new TypeError('EffectTiming.delay: non-finite')
    return animation
  }
  const controls = animateNative(el, { opacity: [0, 1] }, delay === undefined ? {} : { delay })
  return { controls, animation, seenDelays }
}

describe('native audit regressions', () => {
  describe('F1701: onComplete errors are isolated without WAAPI', () => {
    it('logs a throwing onComplete instead of throwing from animateNative()', async () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {})
      const el = document.createElement('div') // jsdom: no element.animate
      const boom = new Error('boom')
      let controls: ReturnType<typeof animateNative> | undefined
      expect(() => {
        controls = animateNative(el, { opacity: [0, 1] }, {
          onComplete: () => {
            throw boom
          },
        })
      }).not.toThrow()
      expect(el.style.opacity).toBe('1')
      expect(error).toHaveBeenCalledWith('[SpringKit]', boom)
      expect(controls!.animation).toBeNull()
      await expect(controls!.finished).resolves.toBeUndefined()
    })
  })

  describe('F1702: non-finite delay / seek', () => {
    it('passes a finite delay to element.animate()', () => {
      expect(withFakeWaapi(100).seenDelays).toEqual([100])
      for (const delay of [NaN, Infinity, -Infinity, -5]) {
        expect(withFakeWaapi(delay).seenDelays).toEqual([0])
      }
    })

    it('seek(NaN) goes to the start instead of throwing', () => {
      const { controls, animation } = withFakeWaapi(100)
      expect(() => controls.seek(NaN)).not.toThrow()
      controls.seek(Infinity)
      controls.seek(50)
      expect(animation.times).toEqual([100, 100 + controls.duration, 150])
    })

    it('seeks relative to a sanitised delay', () => {
      const { controls, animation } = withFakeWaapi(NaN)
      controls.seek(30)
      expect(animation.times).toEqual([30])
    })
  })
})
