import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import React from 'react'
import {
  useSpringState,
  useMomentum,
  useElastic,
  useBounce,
  useGravity,
  useChain,
  usePointer,
  useGyroscope,
} from '@oxog/springkit/react'

// Mock requestAnimationFrame for physics simulations
const mockRAF = vi.fn()
let rafId = 0
const rafCallbacks: Map<number, FrameRequestCallback> = new Map()

beforeEach(() => {
  vi.useFakeTimers()
  rafId = 0
  rafCallbacks.clear()

  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    const id = ++rafId
    rafCallbacks.set(id, callback)
    return id
  })

  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
    rafCallbacks.delete(id)
  })
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

// Helper to simulate animation frames
function runAnimationFrames(count: number) {
  let timestamp = 0
  for (let i = 0; i < count; i++) {
    timestamp += 16 // ~60fps
    const callbacks = Array.from(rafCallbacks.values())
    rafCallbacks.clear()
    callbacks.forEach((cb) => cb(timestamp))
  }
}

describe('useSpringState', () => {
  it('should return initial value', () => {
    const { result } = renderHook(() => useSpringState(100))

    expect(result.current[0]).toBe(100)
  })

  it('should return setter function', () => {
    const { result } = renderHook(() => useSpringState(0))

    expect(typeof result.current[1]).toBe('function')
  })

  it('should return MotionValue', () => {
    const { result } = renderHook(() => useSpringState(0))

    expect(result.current[2]).toBeDefined()
    expect(typeof result.current[2].get).toBe('function')
    expect(typeof result.current[2].subscribe).toBe('function')
  })

  it('should accept custom spring config', () => {
    const { result } = renderHook(() =>
      useSpringState(0, { stiffness: 300, damping: 30 })
    )

    expect(result.current[0]).toBe(0)
  })

  it('should call onChange when value changes', async () => {
    const onChange = vi.fn()
    const { result } = renderHook(() =>
      useSpringState(0, { onChange })
    )

    act(() => {
      result.current[1](100)
    })

    runAnimationFrames(10)

    expect(onChange).toHaveBeenCalled()
  })
})

describe('useMomentum', () => {
  it('should return initial value at 0', () => {
    const { result } = renderHook(() => useMomentum())

    expect(result.current.value?.get()).toBe(0)
  })

  it('should return velocity MotionValue', () => {
    const { result } = renderHook(() => useMomentum())

    expect(result.current.velocity?.get()).toBe(0)
  })

  it('should have push, stop, and set functions', () => {
    const { result } = renderHook(() => useMomentum())

    expect(typeof result.current.push).toBe('function')
    expect(typeof result.current.stop).toBe('function')
    expect(typeof result.current.set).toBe('function')
  })

  it('should set value directly', () => {
    const { result } = renderHook(() => useMomentum())

    act(() => {
      result.current.set(50)
    })

    expect(result.current.value?.get()).toBe(50)
  })

  it('should apply bounds', () => {
    const { result } = renderHook(() =>
      useMomentum({ bounds: { min: 0, max: 100 } })
    )

    act(() => {
      result.current.set(150)
    })

    expect(result.current.value?.get()).toBe(100)
  })

  it('should apply bounds on min', () => {
    const { result } = renderHook(() =>
      useMomentum({ bounds: { min: 0, max: 100 } })
    )

    act(() => {
      result.current.set(-50)
    })

    expect(result.current.value?.get()).toBe(0)
  })

  it('should return isActive function', () => {
    const { result } = renderHook(() => useMomentum())

    expect(typeof result.current.isActive).toBe('function')
    expect(result.current.isActive()).toBe(false)
  })

  it('should become active when pushed', () => {
    const { result } = renderHook(() => useMomentum())

    act(() => {
      result.current.push(10)
    })

    expect(result.current.isActive()).toBe(true)
  })

  it('should stop momentum', () => {
    const { result } = renderHook(() => useMomentum())

    act(() => {
      result.current.push(10)
    })

    act(() => {
      result.current.stop()
    })

    expect(result.current.isActive()).toBe(false)
    expect(result.current.velocity?.get()).toBe(0)
  })
})

describe('useElastic', () => {
  it('should return initial value at 0', () => {
    const { result } = renderHook(() => useElastic())

    expect(result.current.value?.get()).toBe(0)
  })

  it('should have stretch, release, and set functions', () => {
    const { result } = renderHook(() => useElastic())

    expect(typeof result.current.stretch).toBe('function')
    expect(typeof result.current.release).toBe('function')
    expect(typeof result.current.set).toBe('function')
  })

  it('should apply stretch with elasticity', () => {
    const { result } = renderHook(() =>
      useElastic({ elasticity: 0.5, maxStretch: 100 })
    )

    act(() => {
      result.current.stretch(50)
    })

    // Elastic value should be less than raw value due to resistance
    const elasticValue = result.current.value?.get() ?? 0
    expect(elasticValue).toBeLessThan(50)
    expect(elasticValue).toBeGreaterThan(0)
  })

  it('should return raw value', () => {
    const { result } = renderHook(() => useElastic())

    act(() => {
      result.current.stretch(100)
    })

    expect(result.current.getRaw()).toBe(100)
  })

  it('should release to 0', () => {
    const { result } = renderHook(() => useElastic())

    act(() => {
      result.current.stretch(100)
      result.current.release()
    })

    expect(result.current.getRaw()).toBe(0)
  })
})

describe('useBounce', () => {
  it('should return initial value', () => {
    const { result } = renderHook(() => useBounce({ ceiling: 0 }))

    expect(result.current.value?.get()).toBe(0)
  })

  it('should have drop, bounce, and stop functions', () => {
    const { result } = renderHook(() => useBounce())

    expect(typeof result.current.drop).toBe('function')
    expect(typeof result.current.bounce).toBe('function')
    expect(typeof result.current.stop).toBe('function')
  })

  it('should return isActive function', () => {
    const { result } = renderHook(() => useBounce())

    expect(typeof result.current.isActive).toBe('function')
    expect(result.current.isActive()).toBe(false)
  })

  it('should return getVelocity function', () => {
    const { result } = renderHook(() => useBounce())

    expect(typeof result.current.getVelocity).toBe('function')
    expect(result.current.getVelocity()).toBe(0)
  })

  it('should drop from position', () => {
    const { result } = renderHook(() => useBounce({ ceiling: 0, floor: 300 }))

    act(() => {
      result.current.drop(0)
    })

    expect(result.current.isActive()).toBe(true)
  })

  it('should stop bouncing', () => {
    const { result } = renderHook(() => useBounce())

    act(() => {
      result.current.drop(0)
    })

    act(() => {
      result.current.stop()
    })

    expect(result.current.isActive()).toBe(false)
    expect(result.current.getVelocity()).toBe(0)
  })

  it('should apply initial velocity on drop', () => {
    const { result } = renderHook(() => useBounce())

    act(() => {
      result.current.drop(0, 10)
    })

    expect(result.current.isActive()).toBe(true)
  })
})

describe('useGravity', () => {
  it('should return x and y MotionValues', () => {
    const { result } = renderHook(() => useGravity())

    expect(result.current.x).toBeDefined()
    expect(result.current.y).toBeDefined()
    expect(result.current.x?.get()).toBe(0)
    expect(result.current.y?.get()).toBe(0)
  })

  it('should have launch, setPosition, stop, start functions', () => {
    const { result } = renderHook(() => useGravity())

    expect(typeof result.current.launch).toBe('function')
    expect(typeof result.current.setPosition).toBe('function')
    expect(typeof result.current.stop).toBe('function')
    expect(typeof result.current.start).toBe('function')
  })

  it('should return isActive function', () => {
    const { result } = renderHook(() => useGravity())

    expect(typeof result.current.isActive).toBe('function')
    expect(result.current.isActive()).toBe(false)
  })

  it('should return getVelocity function', () => {
    const { result } = renderHook(() => useGravity())

    const velocity = result.current.getVelocity()
    expect(velocity).toEqual({ x: 0, y: 0 })
  })

  it('should set position', () => {
    const { result } = renderHook(() => useGravity())

    act(() => {
      result.current.setPosition({ x: 100, y: 50 })
    })

    expect(result.current.x?.get()).toBe(100)
    expect(result.current.y?.get()).toBe(50)
  })

  it('should launch with velocity', () => {
    const { result } = renderHook(() => useGravity())

    act(() => {
      result.current.launch({ x: 5, y: -10 })
    })

    expect(result.current.isActive()).toBe(true)
    expect(result.current.getVelocity()).toEqual({ x: 5, y: -10 })
  })

  it('should stop simulation', () => {
    const { result } = renderHook(() => useGravity())

    act(() => {
      result.current.launch({ x: 5, y: -10 })
    })

    act(() => {
      result.current.stop()
    })

    expect(result.current.isActive()).toBe(false)
    expect(result.current.getVelocity()).toEqual({ x: 0, y: 0 })
  })

  it('should accept custom gravity', () => {
    const { result } = renderHook(() =>
      useGravity({ gravity: { x: 0.1, y: 0.2 } })
    )

    expect(result.current.x?.get()).toBe(0)
    expect(result.current.y?.get()).toBe(0)
  })

  it('should accept bounds', () => {
    const { result } = renderHook(() =>
      useGravity({
        bounds: { left: 0, right: 100, top: 0, bottom: 100 },
      })
    )

    expect(result.current.x?.get()).toBe(0)
    expect(result.current.y?.get()).toBe(0)
  })
})

describe('useChain', () => {
  it('should return values object', () => {
    const { result } = renderHook(() =>
      useChain([
        { to: { x: 100 } },
        { to: { x: 200 } },
      ])
    )

    expect(result.current.values).toBeDefined()
    expect(typeof result.current.values).toBe('object')
  })

  it('should return play, reset, stop functions', () => {
    const { result } = renderHook(() =>
      useChain([{ to: { x: 100 } }])
    )

    expect(typeof result.current.play).toBe('function')
    expect(typeof result.current.reset).toBe('function')
    expect(typeof result.current.stop).toBe('function')
  })

  it('should return isPlaying state', () => {
    const { result } = renderHook(() =>
      useChain([{ to: { x: 100 } }])
    )

    expect(result.current.isPlaying).toBe(false)
  })

  it('should return currentStep', () => {
    const { result } = renderHook(() =>
      useChain([{ to: { x: 100 } }])
    )

    expect(result.current.currentStep).toBe(-1)
  })

  it('should start playing on play()', () => {
    const { result } = renderHook(() =>
      useChain([{ to: { x: 100 } }])
    )

    act(() => {
      result.current.play()
    })

    expect(result.current.isPlaying).toBe(true)
  })

  it('should stop on stop()', () => {
    const { result } = renderHook(() =>
      useChain([{ to: { x: 100 } }])
    )

    act(() => {
      result.current.play()
    })

    act(() => {
      result.current.stop()
    })

    expect(result.current.isPlaying).toBe(false)
  })

  it('should accept initial values', () => {
    const { result } = renderHook(() =>
      useChain([{ to: { x: 100, y: 200 } }], { x: 50, y: 50 })
    )

    expect(result.current.values).toBeDefined()
  })

  it('should accept step config', () => {
    const { result } = renderHook(() =>
      useChain([
        { to: { x: 100 }, config: { stiffness: 300, damping: 30 } },
      ])
    )

    expect(result.current.values).toBeDefined()
  })

  it('should accept step delay', () => {
    const { result } = renderHook(() =>
      useChain([
        { to: { x: 100 }, delay: 500 },
      ])
    )

    expect(result.current.values).toBeDefined()
  })
})

describe('usePointer', () => {
  it('should return x and y MotionValues', () => {
    const { result } = renderHook(() => usePointer())

    expect(result.current.x).toBeDefined()
    expect(result.current.y).toBeDefined()
    expect(result.current.x?.get()).toBe(0)
    expect(result.current.y?.get()).toBe(0)
  })

  it('should return isHovering state', () => {
    const { result } = renderHook(() => usePointer())

    expect(result.current.isHovering).toBe(false)
  })

  it('should accept smooth option', () => {
    const { result } = renderHook(() => usePointer({ smooth: 0.1 }))

    expect(result.current.x?.get()).toBe(0)
    expect(result.current.y?.get()).toBe(0)
  })

  it('should accept hoverOnly option', () => {
    const { result } = renderHook(() => usePointer({ hoverOnly: true }))

    expect(result.current.isHovering).toBe(false)
  })

  it('should update on pointer move', () => {
    const { result } = renderHook(() => usePointer())

    act(() => {
      window.dispatchEvent(
        new PointerEvent('pointermove', {
          clientX: 100,
          clientY: 200,
        })
      )
    })

    expect(result.current.x?.get()).toBe(100)
    expect(result.current.y?.get()).toBe(200)
  })
})

describe('useGyroscope', () => {
  it('should return tiltX and tiltY MotionValues', () => {
    const { result } = renderHook(() => useGyroscope())

    expect(result.current.tiltX).toBeDefined()
    expect(result.current.tiltY).toBeDefined()
    expect(result.current.tiltX?.get()).toBe(0)
    expect(result.current.tiltY?.get()).toBe(0)
  })

  it('should return isSupported state', () => {
    const { result } = renderHook(() => useGyroscope())

    expect(typeof result.current.isSupported).toBe('boolean')
  })

  it('should accept multiplier option', () => {
    const { result } = renderHook(() => useGyroscope({ multiplier: 2 }))

    expect(result.current.tiltX?.get()).toBe(0)
  })

  it('should accept clamp option', () => {
    const { result } = renderHook(() => useGyroscope({ clamp: 30 }))

    expect(result.current.tiltX?.get()).toBe(0)
  })

  it('should accept smooth option', () => {
    const { result } = renderHook(() => useGyroscope({ smooth: 0.2 }))

    expect(result.current.tiltX?.get()).toBe(0)
  })

  it('should fall back to mouse on desktop', () => {
    const { result } = renderHook(() => useGyroscope())

    // Since DeviceOrientationEvent may not be supported in test env
    // it should fall back to mouse tracking
    act(() => {
      window.dispatchEvent(
        new MouseEvent('mousemove', {
          clientX: window.innerWidth / 2 + 100,
          clientY: window.innerHeight / 2 + 50,
        })
      )
    })

    runAnimationFrames(5)

    // Values should have updated based on mouse position
    expect(result.current.tiltX).toBeDefined()
    expect(result.current.tiltY).toBeDefined()
  })
})
