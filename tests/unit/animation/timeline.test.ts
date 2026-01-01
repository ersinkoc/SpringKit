import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createTimeline, tween, allTo } from '@oxog/springkit'

describe('Timeline', () => {
  let element: HTMLElement

  beforeEach(() => {
    vi.useFakeTimers()
    element = document.createElement('div')
    document.body.appendChild(element)
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.textContent = ''
  })

  describe('createTimeline', () => {
    it('should create a timeline', () => {
      const tl = createTimeline()

      expect(tl).toHaveProperty('to')
      expect(tl).toHaveProperty('from')
      expect(tl).toHaveProperty('fromTo')
      expect(tl).toHaveProperty('addLabel')
      expect(tl).toHaveProperty('call')
      expect(tl).toHaveProperty('set')
      expect(tl).toHaveProperty('addPause')
      expect(tl).toHaveProperty('play')
      expect(tl).toHaveProperty('pause')
      expect(tl).toHaveProperty('resume')
      expect(tl).toHaveProperty('reverse')
      expect(tl).toHaveProperty('restart')
      expect(tl).toHaveProperty('seek')
      expect(tl).toHaveProperty('kill')
      expect(tl).toHaveProperty('time')
      expect(tl).toHaveProperty('duration')
      expect(tl).toHaveProperty('progress')
      expect(tl).toHaveProperty('isPlaying')
      expect(tl).toHaveProperty('isReversed')
      expect(tl).toHaveProperty('getById')

      tl.kill()
    })

    it('should support defaults config', () => {
      const tl = createTimeline({
        defaults: { stiffness: 200, damping: 20 },
      })

      tl.to(element, { x: 100 })
      expect(tl.duration()).toBeGreaterThan(0)

      tl.kill()
    })

    it('should support autoplay', () => {
      const tl = createTimeline({ autoplay: true })
        .to(element, { x: 100 })

      expect(tl.isPlaying()).toBe(true)

      tl.kill()
    })

    it('should support repeat', () => {
      const tl = createTimeline({ repeat: 2 })
        .to(element, { x: 100 })

      tl.play()
      expect(tl.isPlaying()).toBe(true)

      tl.kill()
    })

    it('should support yoyo', () => {
      const tl = createTimeline({ yoyo: true, repeat: 1 })
        .to(element, { x: 100 })

      tl.play()
      expect(tl.isPlaying()).toBe(true)

      tl.kill()
    })
  })

  describe('to()', () => {
    it('should add animation segment', () => {
      const tl = createTimeline()
        .to(element, { x: 100, duration: 0.5 })

      expect(tl.duration()).toBe(0.5)

      tl.kill()
    })

    it('should chain animations', () => {
      const tl = createTimeline()
        .to(element, { x: 100, duration: 0.5 })
        .to(element, { y: 100, duration: 0.5 })

      expect(tl.duration()).toBe(1)

      tl.kill()
    })

    it('should support position parameter', () => {
      const tl = createTimeline()
        .to(element, { x: 100, duration: 0.5 })
        .to(element, { y: 100, duration: 0.5 }, '<')

      expect(tl.duration()).toBe(0.5)

      tl.kill()
    })

    it('should support relative position', () => {
      const tl = createTimeline()
        .to(element, { x: 100, duration: 0.5 })
        .to(element, { y: 100, duration: 0.5 }, '+=0.2')

      expect(tl.duration()).toBe(1.2)

      tl.kill()
    })

    it('should support string selector', () => {
      element.className = 'test-element'
      const tl = createTimeline()
        .to('.test-element', { x: 100, duration: 0.5 })

      expect(tl.duration()).toBe(0.5)

      tl.kill()
    })
  })

  describe('from()', () => {
    it('should animate from initial values', () => {
      const tl = createTimeline()
        .from(element, { x: 100, duration: 0.5 })

      expect(tl.duration()).toBe(0.5)

      tl.kill()
    })
  })

  describe('fromTo()', () => {
    it('should animate from/to values', () => {
      const tl = createTimeline()
        .fromTo(element, { x: 0 }, { x: 100, duration: 0.5 })

      expect(tl.duration()).toBe(0.5)

      tl.kill()
    })
  })

  describe('addLabel()', () => {
    it('should add label at current position', () => {
      const tl = createTimeline()
        .to(element, { x: 100, duration: 0.5 })
        .addLabel('middle')
        .to(element, { y: 100, duration: 0.5 })

      expect(tl.duration()).toBe(1)

      tl.kill()
    })

    it('should add label at specific position', () => {
      const tl = createTimeline()
        .addLabel('start', 0)
        .to(element, { x: 100, duration: 0.5 })

      tl.kill()
    })
  })

  describe('call()', () => {
    it('should add callback at position', () => {
      const callback = vi.fn()
      const tl = createTimeline()
        .to(element, { x: 100, duration: 0.5 })
        .call(callback)

      expect(tl.duration()).toBe(0.5)

      tl.kill()
    })
  })

  describe('set()', () => {
    it('should set properties instantly', () => {
      const tl = createTimeline()
        .set(element, { opacity: 0 })
        .to(element, { x: 100, duration: 0.5 })

      tl.kill()
    })
  })

  describe('addPause()', () => {
    it('should add pause at position', () => {
      const tl = createTimeline()
        .to(element, { x: 100, duration: 0.5 })
        .addPause()
        .to(element, { y: 100, duration: 0.5 })

      expect(tl.duration()).toBe(1)

      tl.kill()
    })
  })

  describe('playback controls', () => {
    it('should play timeline', () => {
      const tl = createTimeline()
        .to(element, { x: 100, duration: 0.5 })

      tl.play()
      expect(tl.isPlaying()).toBe(true)

      tl.kill()
    })

    it('should pause timeline', () => {
      const tl = createTimeline()
        .to(element, { x: 100, duration: 0.5 })
        .play()

      tl.pause()
      expect(tl.isPlaying()).toBe(false)

      tl.kill()
    })

    it('should resume timeline', () => {
      const tl = createTimeline()
        .to(element, { x: 100, duration: 0.5 })
        .play()
        .pause()

      tl.resume()
      expect(tl.isPlaying()).toBe(true)

      tl.kill()
    })

    it('should reverse timeline', () => {
      const tl = createTimeline()
        .to(element, { x: 100, duration: 0.5 })
        .play()

      tl.reverse()
      expect(tl.isReversed()).toBe(true)

      tl.kill()
    })

    it('should restart timeline', () => {
      const tl = createTimeline()
        .to(element, { x: 100, duration: 0.5 })
        .play()

      tl.restart()
      expect(tl.time()).toBe(0)
      expect(tl.isPlaying()).toBe(true)

      tl.kill()
    })

    it('should seek to position', () => {
      const tl = createTimeline()
        .to(element, { x: 100, duration: 1 })

      tl.seek(0.5)
      expect(tl.time()).toBe(0.5)

      tl.kill()
    })

    it('should seek to label', () => {
      const tl = createTimeline()
        .to(element, { x: 100, duration: 0.5 })
        .addLabel('middle')
        .to(element, { y: 100, duration: 0.5 })

      tl.seek('middle')
      expect(tl.time()).toBe(0.5)

      tl.kill()
    })
  })

  describe('state methods', () => {
    it('should get current time', () => {
      const tl = createTimeline()
        .to(element, { x: 100, duration: 1 })

      expect(tl.time()).toBe(0)

      tl.kill()
    })

    it('should get duration', () => {
      const tl = createTimeline()
        .to(element, { x: 100, duration: 1 })

      expect(tl.duration()).toBe(1)

      tl.kill()
    })

    it('should get progress', () => {
      const tl = createTimeline()
        .to(element, { x: 100, duration: 1 })

      expect(tl.progress()).toBe(0)

      tl.kill()
    })
  })

  describe('callbacks', () => {
    it('should call onStart', () => {
      const onStart = vi.fn()
      const tl = createTimeline({ onStart })
        .to(element, { x: 100, duration: 0.5 })
        .play()

      expect(onStart).toHaveBeenCalled()

      tl.kill()
    })

    it('should call onUpdate', async () => {
      const onUpdate = vi.fn()
      const tl = createTimeline({ onUpdate })
        .to(element, { x: 100, duration: 0.5 })
        .play()

      await vi.advanceTimersByTimeAsync(16)

      tl.kill()
    })
  })

  describe('kill()', () => {
    it('should stop and cleanup timeline', () => {
      const tl = createTimeline()
        .to(element, { x: 100, duration: 0.5 })
        .play()

      tl.kill()
      expect(tl.isPlaying()).toBe(false)
    })
  })

  describe('getById()', () => {
    it('should return undefined for non-existent id', () => {
      const tl = createTimeline()
        .to(element, { x: 100, duration: 0.5 })

      const segment = tl.getById('non-existent')
      expect(segment).toBeUndefined()

      tl.kill()
    })
  })
})

describe('tween', () => {
  let element: HTMLElement

  beforeEach(() => {
    vi.useFakeTimers()
    element = document.createElement('div')
    document.body.appendChild(element)
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.textContent = ''
  })

  it('should create and play a simple tween', () => {
    const tl = tween(element, { x: 100, duration: 0.5 })

    expect(tl.isPlaying()).toBe(true)

    tl.kill()
  })
})

describe('allTo', () => {
  let elements: HTMLElement[]

  beforeEach(() => {
    vi.useFakeTimers()
    elements = [
      document.createElement('div'),
      document.createElement('div'),
      document.createElement('div'),
    ]
    elements.forEach(el => document.body.appendChild(el))
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.textContent = ''
  })

  it('should animate all targets simultaneously', () => {
    const tl = allTo(elements, { x: 100, duration: 0.5 })

    expect(tl.isPlaying()).toBe(true)
    expect(tl.duration()).toBe(0.5)

    tl.kill()
  })
})
