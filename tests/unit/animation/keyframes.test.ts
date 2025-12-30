import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { keyframes, parseKeyframeArray, isKeyframeArray } from '@oxog/springkit'

describe('keyframes', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('creation', () => {
    it('should create keyframes animation from number array', () => {
      const anim = keyframes([0, 100, 50])
      expect(anim).toBeDefined()
      expect(anim.get()).toBe(0)
      expect(anim.isPlaying()).toBe(false)
      anim.destroy()
    })

    it('should create keyframes animation from keyframe objects', () => {
      const anim = keyframes([
        { value: 0 },
        { value: 100, config: { stiffness: 200 } },
        { value: 50 },
      ])
      expect(anim).toBeDefined()
      expect(anim.get()).toBe(0)
      anim.destroy()
    })

    it('should accept times option', () => {
      const anim = keyframes([0, 100, 0], {
        times: [0, 0.3, 1],
      })
      expect(anim).toBeDefined()
      anim.destroy()
    })
  })

  describe('play()', () => {
    it('should animate through keyframes', async () => {
      const onUpdate = vi.fn()
      const onComplete = vi.fn()

      const anim = keyframes([0, 100], {
        config: { stiffness: 1000, damping: 100 },
        onUpdate,
        onComplete,
      })

      await anim.play()

      expect(onUpdate).toHaveBeenCalled()
      expect(onComplete).toHaveBeenCalled()
      expect(anim.isPlaying()).toBe(false)
      anim.destroy()
    }, 5000)

    it('should call onKeyframe callback', async () => {
      const onKeyframe = vi.fn()

      const anim = keyframes([0, 100, 50], {
        config: { stiffness: 1000, damping: 100 },
        onKeyframe,
      })

      await anim.play()

      expect(onKeyframe).toHaveBeenCalledWith(0) // Initial
      expect(onKeyframe).toHaveBeenCalledWith(1) // Second keyframe
      expect(onKeyframe).toHaveBeenCalledWith(2) // Third keyframe
      anim.destroy()
    }, 10000)

    it('should not play if already playing', async () => {
      const onUpdate = vi.fn()
      const anim = keyframes([0, 100], {
        config: { stiffness: 500, damping: 50 },
        onUpdate,
      })

      const promise1 = anim.play()
      const promise2 = anim.play()

      await Promise.all([promise1, promise2])
      anim.destroy()
    })

    it('should not play if destroyed', async () => {
      const onUpdate = vi.fn()
      const anim = keyframes([0, 100], { onUpdate })

      anim.destroy()
      await anim.play()

      expect(onUpdate).not.toHaveBeenCalled()
    })
  })

  describe('pause() and resume()', () => {
    it('should pause animation', () => {
      const anim = keyframes([0, 100])
      anim.play()
      anim.pause()
      expect(anim.isPlaying()).toBe(false)
      anim.destroy()
    })

    it('should resume paused animation', async () => {
      const anim = keyframes([0, 100], {
        config: { stiffness: 1000, damping: 100 },
      })

      anim.play()
      anim.pause()
      expect(anim.isPlaying()).toBe(false)

      anim.resume()
      expect(anim.isPlaying()).toBe(true)

      // Wait for animation to complete
      await new Promise((r) => setTimeout(r, 500))
      anim.destroy()
    })
  })

  describe('stop()', () => {
    it('should stop and reset to initial value', () => {
      const anim = keyframes([0, 100])
      anim.play()
      anim.stop()

      expect(anim.isPlaying()).toBe(false)
      expect(anim.getCurrentKeyframe()).toBe(0)
      anim.destroy()
    })
  })

  describe('jumpTo()', () => {
    it('should jump to specific keyframe', () => {
      const onKeyframe = vi.fn()
      const anim = keyframes([0, 100, 50], { onKeyframe })

      anim.jumpTo(2)

      expect(anim.getCurrentKeyframe()).toBe(2)
      expect(onKeyframe).toHaveBeenCalledWith(2)
      anim.destroy()
    })

    it('should not jump to invalid index', () => {
      const anim = keyframes([0, 100, 50])

      anim.jumpTo(-1)
      expect(anim.getCurrentKeyframe()).toBe(0)

      anim.jumpTo(100)
      expect(anim.getCurrentKeyframe()).toBe(0)
      anim.destroy()
    })
  })

  describe('getCurrentKeyframe()', () => {
    it('should return current keyframe index', () => {
      const anim = keyframes([0, 100, 50])
      expect(anim.getCurrentKeyframe()).toBe(0)
      anim.destroy()
    })
  })

  describe('get()', () => {
    it('should return current value', () => {
      const anim = keyframes([50, 100])
      expect(anim.get()).toBe(50)
      anim.destroy()
    })
  })

  describe('destroy()', () => {
    it('should clean up resources', () => {
      const anim = keyframes([0, 100])
      anim.play()
      anim.destroy()

      expect(anim.isPlaying()).toBe(false)
    })

    it('should handle multiple destroy calls', () => {
      const anim = keyframes([0, 100])
      anim.destroy()
      expect(() => anim.destroy()).not.toThrow()
    })
  })
})

describe('parseKeyframeArray', () => {
  it('should convert number array to keyframe array', () => {
    const result = parseKeyframeArray([0, 100, 50])

    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ value: 0, at: undefined })
    expect(result[1]).toEqual({ value: 100, at: undefined })
    expect(result[2]).toEqual({ value: 50, at: undefined })
  })

  it('should include times if provided', () => {
    const result = parseKeyframeArray([0, 100, 50], [0, 0.5, 1])

    expect(result[0]).toEqual({ value: 0, at: 0 })
    expect(result[1]).toEqual({ value: 100, at: 0.5 })
    expect(result[2]).toEqual({ value: 50, at: 1 })
  })
})

describe('isKeyframeArray', () => {
  it('should return true for number arrays', () => {
    expect(isKeyframeArray([0, 100, 50])).toBe(true)
    expect(isKeyframeArray([1, 2, 3, 4, 5])).toBe(true)
    expect(isKeyframeArray([0])).toBe(true)
  })

  it('should return false for non-arrays', () => {
    expect(isKeyframeArray(100)).toBe(false)
    expect(isKeyframeArray('test')).toBe(false)
    expect(isKeyframeArray(null)).toBe(false)
    expect(isKeyframeArray(undefined)).toBe(false)
    expect(isKeyframeArray({})).toBe(false)
  })

  it('should return false for arrays with non-numbers', () => {
    expect(isKeyframeArray([0, 'test', 50])).toBe(false)
    expect(isKeyframeArray([{ value: 0 }])).toBe(false)
  })
})
