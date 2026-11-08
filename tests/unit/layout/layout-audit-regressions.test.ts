import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createLayoutGroup, createAutoLayout, flip, flipBatch, type LayoutGroup } from '@oxog/springkit'
import { installTestClock, type TestClock } from '../../../src/testing'

const rect = (x: number, y: number, w: number, h: number) =>
  ({ left: x, top: y, right: x + w, bottom: y + h, width: w, height: h, x, y, toJSON: () => ({}) }) as DOMRect

const settle = async () => {
  for (let i = 0; i < 10; i++) await Promise.resolve()
}

const deferred = () => {
  let release!: () => void
  const promise = new Promise<void>((resolve) => {
    release = resolve
  })
  return { promise, release }
}

describe('layout audit regressions', () => {
  let clock: TestClock

  beforeEach(() => {
    clock = installTestClock({ timers: true })
  })

  afterEach(() => {
    clock.uninstall()
    document.body.textContent = ''
  })

  /** Like a browser: a detached element measures as an all-zero box */
  const makeEl = (box: { x: number; y: number; w: number; h: number }): HTMLElement => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    el.getBoundingClientRect = () =>
      el.isConnected ? rect(box.x, box.y, box.w, box.h) : rect(0, 0, 0, 0)
    return el
  }

  describe('unregister of a detached element (F601)', () => {
    it('the next element with the same id animates from the removed element box', () => {
      const group = createLayoutGroup()
      const a = makeEl({ x: 50, y: 60, w: 100, h: 100 })
      group.register('card', a)
      a.remove()
      group.unregister('card', a)

      const b = makeEl({ x: 300, y: 300, w: 100, h: 100 })
      group.register('card', b)
      group.update()

      expect(b.style.transform).toBe('translate(-250px, -240px) scale(1, 1)')
      group.destroy()
    })

    it('still measures a connected element live when unregistering', () => {
      const group = createLayoutGroup()
      const box = { x: 50, y: 60, w: 100, h: 100 }
      const a = makeEl(box)
      group.register('card', a)
      box.x = 90
      group.unregister('card', a)

      const b = makeEl({ x: 300, y: 300, w: 100, h: 100 })
      group.register('card', b)
      group.update()

      expect(b.style.transform).toBe('translate(-210px, -240px) scale(1, 1)')
      group.destroy()
    })

    it('createAutoLayout carries the removed element box over to its replacement', async () => {
      const a = makeEl({ x: 10, y: 20, w: 100, h: 100 })
      a.setAttribute('data-layout-id', 'hero')
      const auto = createAutoLayout()
      a.remove()
      await settle()

      const b = makeEl({ x: 210, y: 220, w: 100, h: 100 })
      b.setAttribute('data-layout-id', 'hero')
      await settle()

      expect(b.style.transform).toBe('translate(-200px, -200px) scale(1, 1)')
      auto.destroy()
    })
  })

  describe('overlapping flip() calls on one element (F602)', () => {
    const setup = () => {
      const el = document.createElement('div')
      document.body.appendChild(el)
      const layout = { x: 0 }
      // Like a browser: the measured box includes the inline translate()
      el.getBoundingClientRect = () => {
        const m = /translate\((-?[\d.]+)px/.exec(el.style.transform)
        return rect(layout.x + (m ? parseFloat(m[1]!) : 0), 0, 100, 100)
      }
      return { el, layout }
    }

    it('measures the last box without the FLIP another call started meanwhile', async () => {
      const { el, layout } = setup()
      const gateA = deferred()
      const gateB = deferred()
      const a = flip(el, async () => {
        await gateA.promise
        layout.x = 100
      })
      const b = flip(el, async () => {
        await gateB.promise
        layout.x = 150
      })

      gateA.release()
      await settle()
      expect(el.style.transform).toBe('translate(-100px, 0px)')

      gateB.release()
      await settle()
      expect(el.style.transform).toBe('translate(-150px, 0px)')

      clock.runAll()
      await Promise.all([a, b])
      expect(el.style.transform).toBe('')
    })

    it('keeps the element own transform when one FLIP replaces the other', async () => {
      const { el, layout } = setup()
      el.style.transform = 'rotate(5deg)'
      const gateA = deferred()
      const gateB = deferred()
      const a = flip(el, async () => {
        await gateA.promise
        layout.x = 100
      })
      const b = flip(el, async () => {
        await gateB.promise
        layout.x = 150
      })
      gateA.release()
      await settle()
      gateB.release()
      await settle()
      clock.runAll()
      await Promise.all([a, b])
      expect(el.style.transform).toBe('rotate(5deg)')
    })

    it('flipBatch also ignores a FLIP started while its mutate was pending', async () => {
      const { el, layout } = setup()
      const gateBatch = deferred()
      const gateFlip = deferred()
      const batch = flipBatch([el], async () => {
        await gateBatch.promise
        layout.x = 150
      })
      const single = flip(el, async () => {
        await gateFlip.promise
        layout.x = 150
      })

      gateFlip.release()
      await settle()
      expect(el.style.transform).toBe('translate(-150px, 0px)')

      gateBatch.release()
      await settle()
      expect(el.style.transform).toBe('translate(-150px, 0px)')

      clock.runAll()
      await Promise.all([batch, single])
      expect(el.style.transform).toBe('')
    })
  })

  describe('onAnimationStart destroying the group (F603)', () => {
    const makeMovable = () => {
      const box = { x: 0, y: 0, w: 100, h: 100 }
      return { box, el: makeEl(box) }
    }

    it('update() does not throw and leaves nothing running when the callback destroys the group', () => {
      const { box, el } = makeMovable()
      const holder: { group: LayoutGroup | null } = { group: null }
      let starts = 0
      holder.group = createLayoutGroup({
        onAnimationStart: () => {
          starts++
          holder.group!.destroy()
        },
      })
      holder.group.register('a', el)
      box.x = 100

      expect(() => holder.group!.update()).not.toThrow()
      expect(starts).toBe(1)
      expect(el.style.transform).toBe('')
      expect(clock.pendingFrames).toBe(0)
    })

    it('does not animate the remaining entries of a group destroyed mid-update', () => {
      const first = makeMovable()
      const second = makeMovable()
      second.box.x = 500
      const holder: { group: LayoutGroup | null } = { group: null }
      let starts = 0
      holder.group = createLayoutGroup({
        onAnimationStart: () => {
          starts++
          holder.group!.destroy()
        },
      })
      holder.group.register('a', first.el)
      holder.group.register('a', second.el)
      first.box.x = 100
      second.box.x = 700

      expect(() => holder.group!.update()).not.toThrow()
      expect(starts).toBe(1)
      expect(second.el.style.transform).toBe('')
      expect(clock.pendingFrames).toBe(0)
    })

    it('keeps animating other entries when the callback unregisters its own element', () => {
      const first = makeMovable()
      const second = makeMovable()
      second.box.x = 500
      first.el.style.opacity = '0.5'
      const holder: { group: LayoutGroup | null } = { group: null }
      let starts = 0
      holder.group = createLayoutGroup({
        onAnimationStart: () => {
          starts++
          if (starts === 1) holder.group!.unregister('a', first.el)
        },
      })
      holder.group.register('a', first.el)
      holder.group.register('a', second.el)
      first.box.x = 100
      second.box.x = 700

      expect(() => holder.group!.update()).not.toThrow()
      expect(first.el.style.opacity).toBe('0.5')
      expect(first.el.style.transform).toBe('')
      expect(starts).toBe(2)
      expect(second.el.style.transform.startsWith('translate(')).toBe(true)
      holder.group.destroy()
    })
  })
})
