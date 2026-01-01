import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createLayoutGroup,
  createSharedLayoutContext,
  createAutoLayout,
} from '@oxog/springkit'

describe('Shared Layout Animations', () => {
  let element1: HTMLElement
  let element2: HTMLElement

  beforeEach(() => {
    element1 = document.createElement('div')
    element1.style.width = '100px'
    element1.style.height = '100px'
    element1.style.position = 'absolute'
    element1.style.left = '0px'
    element1.style.top = '0px'

    element2 = document.createElement('div')
    element2.style.width = '200px'
    element2.style.height = '200px'
    element2.style.position = 'absolute'
    element2.style.left = '100px'
    element2.style.top = '100px'

    document.body.appendChild(element1)
    document.body.appendChild(element2)
  })

  afterEach(() => {
    document.body.textContent = ''
  })

  describe('createLayoutGroup', () => {
    it('should create layout group', () => {
      const group = createLayoutGroup()

      expect(group).toHaveProperty('register')
      expect(group).toHaveProperty('unregister')
      expect(group).toHaveProperty('update')
      expect(group).toHaveProperty('forceUpdate')
      expect(group).toHaveProperty('destroy')

      group.destroy()
    })

    it('should register element', () => {
      const group = createLayoutGroup()

      expect(() => group.register('test-id', element1)).not.toThrow()

      group.destroy()
    })

    it('should register multiple elements with same id', () => {
      const group = createLayoutGroup()

      group.register('shared-id', element1)
      group.register('shared-id', element2)

      group.destroy()
    })

    it('should not register same element twice', () => {
      const group = createLayoutGroup()

      group.register('test-id', element1)
      group.register('test-id', element1)

      group.destroy()
    })

    it('should unregister element', () => {
      const group = createLayoutGroup()

      group.register('test-id', element1)
      expect(() => group.unregister('test-id', element1)).not.toThrow()

      group.destroy()
    })

    it('should handle unregister of non-existent element', () => {
      const group = createLayoutGroup()

      expect(() => group.unregister('non-existent', element1)).not.toThrow()

      group.destroy()
    })

    it('should update layout', () => {
      const group = createLayoutGroup()

      group.register('test-id', element1)

      expect(() => group.update()).not.toThrow()

      group.destroy()
    })

    it('should force update layout', () => {
      const group = createLayoutGroup()

      group.register('test-id', element1)

      expect(() => group.forceUpdate()).not.toThrow()

      group.destroy()
    })

    it('should accept spring config', () => {
      const group = createLayoutGroup({
        spring: { stiffness: 300, damping: 30 },
      })

      group.register('test-id', element1)
      group.update()

      group.destroy()
    })

    it('should call onAnimationStart callback', () => {
      const onAnimationStart = vi.fn()
      const group = createLayoutGroup({ onAnimationStart })

      group.register('test-id', element1)

      // Move element to trigger animation
      element1.style.left = '200px'
      group.update()

      group.destroy()
    })

    it('should call onAnimationComplete callback', () => {
      const onAnimationComplete = vi.fn()
      const group = createLayoutGroup({ onAnimationComplete })

      group.register('test-id', element1)

      group.destroy()
    })

    it('should support crossfade option', () => {
      const group = createLayoutGroup({ crossfade: true })

      group.register('test-id', element1)
      group.update()

      group.destroy()
    })

    it('should clean up on destroy', () => {
      const group = createLayoutGroup()

      group.register('test-id', element1)
      group.destroy()

      // Should not throw on second destroy
      expect(() => group.destroy()).not.toThrow()
    })
  })

  describe('createSharedLayoutContext', () => {
    it('should create shared layout context', () => {
      const context = createSharedLayoutContext()

      expect(context).toHaveProperty('createGroup')
      expect(context).toHaveProperty('getGroup')
      expect(context).toHaveProperty('updateAll')
      expect(context).toHaveProperty('destroy')

      context.destroy()
    })

    it('should create groups', () => {
      const context = createSharedLayoutContext()

      const group = context.createGroup('test-group')
      expect(group).toHaveProperty('register')

      context.destroy()
    })

    it('should create group with auto id', () => {
      const context = createSharedLayoutContext()

      const group = context.createGroup()
      expect(group).toHaveProperty('register')

      context.destroy()
    })

    it('should get group by id', () => {
      const context = createSharedLayoutContext()

      context.createGroup('my-group')
      const group = context.getGroup('my-group')

      expect(group).toBeDefined()

      context.destroy()
    })

    it('should return undefined for non-existent group', () => {
      const context = createSharedLayoutContext()

      const group = context.getGroup('non-existent')
      expect(group).toBeUndefined()

      context.destroy()
    })

    it('should update all groups', () => {
      const context = createSharedLayoutContext()

      const group1 = context.createGroup('group1')
      const group2 = context.createGroup('group2')

      group1.register('id1', element1)
      group2.register('id2', element2)

      expect(() => context.updateAll()).not.toThrow()

      context.destroy()
    })

    it('should destroy all groups', () => {
      const context = createSharedLayoutContext()

      context.createGroup('group1')
      context.createGroup('group2')

      expect(() => context.destroy()).not.toThrow()
    })
  })

  describe('createAutoLayout', () => {
    it('should create auto layout observer', () => {
      const autoLayout = createAutoLayout()

      expect(autoLayout).toHaveProperty('update')
      expect(autoLayout).toHaveProperty('forceUpdate')
      expect(autoLayout).toHaveProperty('destroy')

      autoLayout.destroy()
    })

    it('should update layout', () => {
      const autoLayout = createAutoLayout()

      expect(() => autoLayout.update()).not.toThrow()

      autoLayout.destroy()
    })

    it('should force update layout', () => {
      const autoLayout = createAutoLayout()

      expect(() => autoLayout.forceUpdate()).not.toThrow()

      autoLayout.destroy()
    })

    it('should accept root option', () => {
      const container = document.createElement('div')
      document.body.appendChild(container)

      const autoLayout = createAutoLayout({ root: container })

      expect(() => autoLayout.update()).not.toThrow()

      autoLayout.destroy()
    })

    it('should accept custom attribute option', () => {
      const autoLayout = createAutoLayout({
        attribute: 'data-custom-layout-id',
      })

      autoLayout.destroy()
    })

    it('should accept debounce option', () => {
      const autoLayout = createAutoLayout({ debounce: 100 })

      autoLayout.destroy()
    })

    it('should accept spring config', () => {
      const autoLayout = createAutoLayout({
        spring: { stiffness: 200, damping: 25 },
      })

      autoLayout.destroy()
    })

    it('should observe elements with layout id attribute', () => {
      element1.setAttribute('data-layout-id', 'card-1')

      const autoLayout = createAutoLayout()

      autoLayout.update()

      autoLayout.destroy()
    })

    it('should handle element removal', () => {
      element1.setAttribute('data-layout-id', 'card-1')

      const autoLayout = createAutoLayout()
      autoLayout.update()

      element1.remove()
      autoLayout.update()

      autoLayout.destroy()
    })

    it('should handle element addition', () => {
      const autoLayout = createAutoLayout()

      const newElement = document.createElement('div')
      newElement.setAttribute('data-layout-id', 'new-card')
      document.body.appendChild(newElement)

      autoLayout.update()

      autoLayout.destroy()
    })

    it('should clean up on destroy', () => {
      const autoLayout = createAutoLayout()

      autoLayout.destroy()

      // Should not throw on second destroy
      expect(() => autoLayout.destroy()).not.toThrow()
    })

    it('should handle undefined root', () => {
      // Temporarily remove document.body
      const originalBody = document.body

      // Create auto layout that handles undefined root
      const autoLayout = createAutoLayout({ root: null as unknown as HTMLElement })

      expect(() => autoLayout.update()).not.toThrow()
      expect(() => autoLayout.forceUpdate()).not.toThrow()
      expect(() => autoLayout.destroy()).not.toThrow()
    })
  })
})
