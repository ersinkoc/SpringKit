import { expect, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// Polyfill for PointerEvent in JSDOM environment
if (typeof global.PointerEvent === 'undefined') {
  // @ts-expect-error - Polyfilling missing API
  global.PointerEvent = class PointerEvent extends MouseEvent {
    public pointerId: number
    public width: number
    public height: number
    public pressure: number
    public tangentialPressure: number
    public tiltX: number
    public tiltY: number
    public twist: number
    public pointerType: string
    public isPrimary: boolean

    constructor(type: string, eventInit: any = {}) {
      super(type, eventInit)
      this.pointerId = eventInit.pointerId ?? 0
      this.width = eventInit.width ?? 1
      this.height = eventInit.height ?? 1
      this.pressure = eventInit.pressure ?? 0
      this.tangentialPressure = eventInit.tangentialPressure ?? 0
      this.tiltX = eventInit.tiltX ?? 0
      this.tiltY = eventInit.tiltY ?? 0
      this.twist = eventInit.twist ?? 0
      this.pointerType = eventInit.pointerType ?? 'mouse'
      this.isPrimary = eventInit.isPrimary ?? true
    }
  }
}

// Polyfill for setPointerCapture and releasePointerCapture on HTMLElement
if (typeof HTMLElement !== 'undefined' && !HTMLElement.prototype.setPointerCapture) {
  // Store captured pointers per element
  const capturedPointers = new WeakMap<HTMLElement, Set<number>>()

  HTMLElement.prototype.setPointerCapture = function (pointerId: number) {
    if (!capturedPointers.has(this)) {
      capturedPointers.set(this, new Set())
    }
    capturedPointers.get(this)!.add(pointerId)
  }

  HTMLElement.prototype.releasePointerCapture = function (pointerId: number) {
    const captured = capturedPointers.get(this)
    if (captured) {
      captured.delete(pointerId)
    }
  }

  HTMLElement.prototype.hasPointerCapture = function (pointerId: number): boolean {
    const captured = capturedPointers.get(this)
    return captured ? captured.has(pointerId) : false
  }
}

beforeEach(() => {
  cleanup()
})
