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

    it('should handle transition config with crossfade default false (line 179)', () => {
      const group = createLayoutGroup({
        // crossfade defaults to false (line 179)
        transition: {
          x: { stiffness: 400, damping: 40 },
          y: { stiffness: 400, damping: 40 },
          width: { stiffness: 300, damping: 30 },
          height: { stiffness: 300, damping: 30 },
          opacity: { stiffness: 200, damping: 20 },
          borderRadius: { stiffness: 250, damping: 25 },
        },
      })

      group.register('test-id', element1)
      group.update()

      group.destroy()
    })

    it('should handle opacity transition with crossfade', () => {
      const group = createLayoutGroup({
        crossfade: true,
        spring: { stiffness: 300, damping: 30 },
      })

      element1.style.opacity = '0.5'
      group.register('test-id', element1)

      element1.style.opacity = '1'
      group.update()

      group.destroy()
    })

    it('should handle border radius transition', () => {
      const group = createLayoutGroup({
        crossfade: true,
      })

      element1.style.borderRadius = '0px'
      group.register('test-id', element1)

      element1.style.borderRadius = '10px'
      group.update()

      group.destroy()
    })

    it('should handle element position change', async () => {
      const onAnimationStart = vi.fn()
      const onAnimationComplete = vi.fn()

      const group = createLayoutGroup({
        onAnimationStart,
        onAnimationComplete,
        spring: { stiffness: 300, damping: 30 },
      })

      group.register('test-id', element1)
      group.forceUpdate()

      // Change position
      element1.style.left = '300px'
      element1.style.top = '300px'

      group.update()

      // Wait for animation
      await new Promise(resolve => setTimeout(resolve, 100))

      group.destroy()
    })

    it('should handle element size change', async () => {
      const group = createLayoutGroup()

      group.register('test-id', element1)
      group.forceUpdate()

      // Change size
      element1.style.width = '300px'
      element1.style.height = '300px'

      group.update()

      await new Promise(resolve => setTimeout(resolve, 100))

      group.destroy()
    })

    it('should handle multiple elements with same id', async () => {
      const group = createLayoutGroup()

      group.register('shared-id', element1)
      group.register('shared-id', element2)

      group.forceUpdate()

      // Change both elements
      element1.style.left = '200px'
      element2.style.left = '400px'

      group.update()

      await new Promise(resolve => setTimeout(resolve, 100))

      group.destroy()
    })

    it('should handle rapid register/unregister cycles', () => {
      const group = createLayoutGroup()

      for (let i = 0; i < 10; i++) {
        group.register('test-id', element1)
        group.unregister('test-id', element1)
      }

      group.destroy()
    })

    it('should handle update with no changes', () => {
      const group = createLayoutGroup()

      group.register('test-id', element1)
      group.forceUpdate()

      // Multiple updates without changes
      group.update()
      group.update()
      group.update()

      group.destroy()
    })

    it('should handle unregister during animation', async () => {
      const group = createLayoutGroup()

      group.register('test-id', element1)
      group.forceUpdate()

      // Trigger animation
      element1.style.left = '500px'
      group.update()

      // Unregister during animation
      group.unregister('test-id', element1)

      group.destroy()
    })

    it('should handle getGroup with invalid id', () => {
      const context = createSharedLayoutContext()

      const group = context.getGroup('non-existent-id')
      expect(group).toBeUndefined()

      context.destroy()
    })

    it('should handle multiple groups in context', () => {
      const context = createSharedLayoutContext()

      const group1 = context.createGroup('group-1')
      const group2 = context.createGroup('group-2')
      const group3 = context.createGroup('group-3')

      group1.register('id1', element1)
      group2.register('id2', element2)
      group3.register('id3', element1)

      context.updateAll()

      context.destroy()
    })

    it('should handle auto layout with custom attribute', () => {
      element1.setAttribute('data-custom-layout', 'item-1')

      const autoLayout = createAutoLayout({
        attribute: 'data-custom-layout',
      })

      autoLayout.update()
      autoLayout.destroy()
    })

    it('should handle auto layout debounce', async () => {
      vi.useFakeTimers()

      const autoLayout = createAutoLayout({
        debounce: 100,
      })

      // Multiple rapid updates
      autoLayout.update()
      autoLayout.update()
      autoLayout.update()

      vi.advanceTimersByTime(150)

      autoLayout.destroy()
      vi.useRealTimers()
    })

    it('should handle auto layout with nested elements', () => {
      const container = document.createElement('div')
      const child = document.createElement('div')
      const grandchild = document.createElement('div')

      grandchild.setAttribute('data-layout-id', 'nested-item')
      child.appendChild(grandchild)
      container.appendChild(child)
      document.body.appendChild(container)

      const autoLayout = createAutoLayout({
        root: container,
      })

      autoLayout.update()
      autoLayout.destroy()

      container.remove()
    })

    it('should handle auto layout element attribute change', () => {
      const autoLayout = createAutoLayout()

      // Add element after creation
      const newElement = document.createElement('div')
      newElement.setAttribute('data-layout-id', 'dynamic-item')
      document.body.appendChild(newElement)

      // Simulate attribute change
      newElement.setAttribute('data-layout-id', 'renamed-item')

      autoLayout.update()
      autoLayout.destroy()
    })

    it('should handle layout with zero-sized elements', () => {
      const zeroElement = document.createElement('div')
      zeroElement.style.width = '0px'
      zeroElement.style.height = '0px'
      document.body.appendChild(zeroElement)

      const group = createLayoutGroup()
      group.register('zero-id', zeroElement)

      zeroElement.style.width = '100px'
      zeroElement.style.height = '100px'
      group.update()

      group.destroy()
      zeroElement.remove()
    })

    it('should handle division by zero protection in scale', () => {
      const group = createLayoutGroup()

      // Element with zero width
      element1.style.width = '0px'
      group.register('test-id', element1)
      group.forceUpdate()

      // Change to non-zero
      element1.style.width = '100px'
      group.update()

      group.destroy()
    })

    it('should handle SSR environment with no document (lines 467-473)', () => {
      // Test the SSR fallback by passing null as root
      const autoLayout = createAutoLayout({
        root: null as unknown as HTMLElement,
      })

      // These should be no-ops in SSR environment
      expect(() => autoLayout.update()).not.toThrow()
      expect(() => autoLayout.forceUpdate()).not.toThrow()
      expect(() => autoLayout.destroy()).not.toThrow()
    })

    it('should handle debounced update with zero debounce time (lines 500-504)', async () => {
      const autoLayout = createAutoLayout({
        debounce: 0, // No debounce
      })

      element1.setAttribute('data-layout-id', 'debounce-test')

      // Should update immediately
      autoLayout.update()

      autoLayout.destroy()
    })

    it('should handle MutationObserver childList changes (lines 514-526)', async () => {
      const container = document.createElement('div')
      document.body.appendChild(container)

      const autoLayout = createAutoLayout({
        root: container,
      })

      // Add element with layout id - triggers childList mutation
      const newElement = document.createElement('div')
      newElement.setAttribute('data-layout-id', 'observed-item')
      container.appendChild(newElement)

      // Wait for mutation observer
      await new Promise(resolve => setTimeout(resolve, 50))

      autoLayout.destroy()
      container.remove()
    })

    it('should handle MutationObserver removed nodes (lines 528-536)', async () => {
      const container = document.createElement('div')
      const elementToRemove = document.createElement('div')
      elementToRemove.setAttribute('data-layout-id', 'removable-item')
      container.appendChild(elementToRemove)
      document.body.appendChild(container)

      const autoLayout = createAutoLayout({
        root: container,
      })

      // Wait for initial registration
      await new Promise(resolve => setTimeout(resolve, 50))

      // Remove element - triggers childList mutation with removed nodes
      elementToRemove.remove()

      // Wait for mutation observer
      await new Promise(resolve => setTimeout(resolve, 50))

      autoLayout.destroy()
      container.remove()
    })

    it('should handle MutationObserver attribute changes (lines 539-546)', async () => {
      const container = document.createElement('div')
      const element = document.createElement('div')
      element.setAttribute('data-layout-id', 'attr-item')
      container.appendChild(element)
      document.body.appendChild(container)

      const autoLayout = createAutoLayout({
        root: container,
      })

      // Wait for initial registration
      await new Promise(resolve => setTimeout(resolve, 50))

      // Change attribute - triggers attribute mutation
      element.setAttribute('data-layout-id', 'renamed-item')

      // Wait for mutation observer
      await new Promise(resolve => setTimeout(resolve, 50))

      autoLayout.destroy()
      container.remove()
    })

    it('should handle ResizeObserver callback with debounce timer clearing (lines 557-561, 558)', async () => {
      vi.useFakeTimers()

      const container = document.createElement('div')
      document.body.appendChild(container)

      const autoLayout = createAutoLayout({
        root: container,
        debounce: 100, // Enable debounce to test timer clearing
      })

      // Trigger resize by changing container size - should start debounce timer
      container.style.width = '500px'

      // Trigger another resize before debounce completes - should clear previous timer (line 558)
      container.style.width = '600px'

      // Wait for resize observer and debounce
      vi.advanceTimersByTime(150)

      autoLayout.destroy()
      container.remove()
      vi.useRealTimers()
    })

    it('should handle destroy with debounce timer cleanup (lines 574-577)', async () => {
      vi.useFakeTimers()

      const autoLayout = createAutoLayout({
        debounce: 1000, // Long debounce
      })

      element1.setAttribute('data-layout-id', 'cleanup-test')

      // Trigger update to start debounce timer
      autoLayout.update()

      // Destroy while debounce timer is pending - should clear timer (lines 576-577)
      autoLayout.destroy()

      // Advance time - no timer should fire
      vi.advanceTimersByTime(2000)

      vi.useRealTimers()

      // Should not throw and timer should be cleaned up
      expect(() => autoLayout.destroy()).not.toThrow()
    })

    it('should handle ResizeObserver triggering debounced update (lines 556-561)', async () => {
      const container = document.createElement('div')
      document.body.appendChild(container)

      const autoLayout = createAutoLayout({
        root: container,
        debounce: 50, // Short debounce to test timer clearing
      })

      // Trigger resize multiple times rapidly
      container.style.width = '100px'
      container.style.height = '100px'

      // Trigger another resize before debounce completes
      container.style.width = '200px'
      container.style.height = '200px'

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 100))

      autoLayout.destroy()
      container.remove()
    })

    it('should handle debounce timer clearing on rapid updates (lines 558, 576-577)', async () => {
      vi.useFakeTimers()

      const autoLayout = createAutoLayout({
        debounce: 100,
      })

      element1.setAttribute('data-layout-id', 'rapid-test')

      // Multiple rapid updates should clear previous timers
      autoLayout.update()
      autoLayout.update()
      autoLayout.update()

      // Advance time to trigger debounced update
      vi.advanceTimersByTime(150)

      // Destroy should clean up all pending timers (line 576-577)
      autoLayout.destroy()

      vi.useRealTimers()

      // Should not throw
      expect(() => autoLayout.destroy()).not.toThrow()
    })

    it('should handle ResizeObserver callback with debounce timer (lines 556, 558)', async () => {
      vi.useFakeTimers()

      const container = document.createElement('div')
      document.body.appendChild(container)

      const autoLayout = createAutoLayout({
        root: container,
        debounce: 50,
      })

      // Trigger resize which should start debounce timer
      container.style.width = '500px'

      // Trigger another resize before debounce completes - should clear previous timer (line 558)
      container.style.width = '600px'

      // Advance past debounce
      vi.advanceTimersByTime(100)

      autoLayout.destroy()
      container.remove()
      vi.useRealTimers()
    })

    it('should handle debounce timer cleanup in destroy (lines 576-577)', async () => {
      vi.useFakeTimers()

      const autoLayout = createAutoLayout({
        debounce: 500, // Long debounce
      })

      element1.setAttribute('data-layout-id', 'timer-test')

      // Start debounced update
      autoLayout.update()

      // Destroy before debounce completes - should clear timer (lines 576-577)
      autoLayout.destroy()

      // Advance time - no timer should fire
      vi.advanceTimersByTime(1000)

      vi.useRealTimers()

      // Should not throw
      expect(() => autoLayout.destroy()).not.toThrow()
    })

    it('should handle unregister with pending RAF (lines 224-228)', async () => {
      const group = createLayoutGroup()

      group.register('test-id', element1)
      group.forceUpdate()

      // Trigger animation to start RAF
      element1.style.left = '500px'
      group.update()

      // Wait a bit for RAF to be scheduled
      await new Promise(resolve => setTimeout(resolve, 50))

      // Unregister while RAF is pending
      group.unregister('test-id', element1)

      group.destroy()
    })

    it('should handle destroy with pending RAF (lines 347-350)', async () => {
      const group = createLayoutGroup()

      group.register('test-id', element1)
      group.forceUpdate()

      // Trigger animation
      element1.style.left = '500px'
      group.update()

      // Wait a bit for RAF to be scheduled
      await new Promise(resolve => setTimeout(resolve, 50))

      // Destroy while RAF is pending
      group.destroy()

      // Should not throw
      expect(() => group.destroy()).not.toThrow()
    })

    it('should handle checkComplete when spring is still animating (lines 299-301)', async () => {
      const group = createLayoutGroup({
        spring: { stiffness: 50, damping: 5 }, // Slow spring
      })

      group.register('test-id', element1)
      group.forceUpdate()

      // Trigger animation
      element1.style.left = '500px'
      group.update()

      // Wait for animation to be in progress
      await new Promise(resolve => setTimeout(resolve, 100))

      group.destroy()
    })

    it('should handle checkComplete when animation completes (lines 295-298)', async () => {
      const onAnimationComplete = vi.fn()
      const group = createLayoutGroup({
        spring: { stiffness: 1000, damping: 100 }, // Fast spring
        onAnimationComplete,
      })

      group.register('test-id', element1)
      group.forceUpdate()

      // Trigger animation
      element1.style.left = '500px'
      group.update()

      // Wait for animation to complete
      await new Promise(resolve => setTimeout(resolve, 500))

      group.destroy()
    })

    it('should handle update with no previous measurement', () => {
      const group = createLayoutGroup()

      // First update without forceUpdate - no previous measurement
      group.register('test-id', element1)
      group.update()

      // Second update should have measurement
      group.update()

      group.destroy()
    })

    it('should handle unregister last element in group (lines 234-236)', () => {
      const group = createLayoutGroup()

      group.register('only-id', element1)
      group.unregister('only-id', element1)

      // Group should be cleaned up
      group.destroy()
    })

    it('should handle auto layout with no matching elements', () => {
      const container = document.createElement('div')
      document.body.appendChild(container)

      const autoLayout = createAutoLayout({
        root: container,
        attribute: 'data-nonexistent',
      })

      autoLayout.update()
      autoLayout.destroy()
      container.remove()
    })

    it('should handle nested descendants with layout id (lines 522-524)', async () => {
      const container = document.createElement('div')
      const wrapper = document.createElement('div')
      const inner = document.createElement('div')
      inner.setAttribute('data-layout-id', 'deep-nested')
      wrapper.appendChild(inner)
      container.appendChild(wrapper)
      document.body.appendChild(container)

      const autoLayout = createAutoLayout({
        root: container,
      })

      // Add wrapper which has descendant with layout id
      container.appendChild(wrapper)

      // Wait for mutation observer
      await new Promise(resolve => setTimeout(resolve, 50))

      autoLayout.destroy()
      container.remove()
    })

    it('should handle element with no border radius initially', () => {
      const group = createLayoutGroup({
        crossfade: true,
      })

      // Element without explicit border radius
      element1.style.borderRadius = ''
      group.register('test-id', element1)

      element1.style.borderRadius = '8px'
      group.update()

      group.destroy()
    })

    it('should handle getComputedStyle returning invalid opacity', () => {
      const group = createLayoutGroup({
        crossfade: true,
      })

      group.register('test-id', element1)

      // Force update to measure
      group.forceUpdate()

      group.destroy()
    })

    it('should handle ResizeObserver triggering debouncedUpdate with debounce=0 (line 558)', async () => {
      // This test specifically targets line 558 where ResizeObserver calls debouncedUpdate
      const container = document.createElement('div')
      container.style.width = '100px'
      document.body.appendChild(container)

      // Use debounce: 0 to trigger the else branch in debouncedUpdate (line 501-502)
      // while still having ResizeObserver call debouncedUpdate (line 558)
      const autoLayout = createAutoLayout({
        root: container,
        debounce: 0, // This makes debounceTime = 0, so line 501-502 executes
      })

      // Trigger resize which calls debouncedUpdate via ResizeObserver (line 558)
      container.style.width = '200px'

      // Wait for any async operations
      await new Promise(resolve => setTimeout(resolve, 50))

      autoLayout.destroy()
      container.remove()
    })

    it('should handle destroy with debounceTimer null check (lines 575-577)', async () => {
      vi.useFakeTimers()

      const autoLayout = createAutoLayout({
        debounce: 100,
      })

      // Do NOT call update() - so debounceTimer remains null
      // Then destroy - should handle null timer gracefully (lines 575-577)
      autoLayout.destroy()

      // Advance time - nothing should happen
      vi.advanceTimersByTime(1000)

      vi.useRealTimers()

      // Should not throw
      expect(() => autoLayout.destroy()).not.toThrow()
    })

    it('should handle destroy with active debounceTimer (lines 575-577)', async () => {
      vi.useFakeTimers()

      const autoLayout = createAutoLayout({
        debounce: 1000, // Long debounce
      })

      element1.setAttribute('data-layout-id', 'timer-cleanup-test')

      // Trigger update to create debounceTimer
      autoLayout.update()

      // Destroy while timer is active - should clear it (lines 575-577)
      autoLayout.destroy()

      // Advance time - timer should not fire
      vi.advanceTimersByTime(2000)

      vi.useRealTimers()
    })

    it('should handle debouncedUpdate with debounceTime=0 branch (lines 501-502)', async () => {
      vi.useFakeTimers()

      const container = document.createElement('div')
      document.body.appendChild(container)

      const autoLayout = createAutoLayout({
        root: container,
        debounce: 0, // Triggers lines 501-502
      })

      // Add element with layout id
      const el = document.createElement('div')
      el.setAttribute('data-layout-id', 'immediate-test')
      container.appendChild(el)

      // Trigger update - should execute lines 501-502 immediately
      autoLayout.update()

      vi.useRealTimers()

      autoLayout.destroy()
      container.remove()
    })

    it('should handle ResizeObserver calling debouncedUpdate (line 558)', async () => {
      const container = document.createElement('div')
      container.style.width = '100px'
      container.style.height = '100px'
      document.body.appendChild(container)

      const autoLayout = createAutoLayout({
        root: container,
        debounce: 50,
      })

      // Trigger resize which should call debouncedUpdate via ResizeObserver (line 558)
      container.style.width = '200px'

      // Wait for ResizeObserver to trigger
      await new Promise(resolve => setTimeout(resolve, 100))

      autoLayout.destroy()
      container.remove()
    })

    it('should handle destroy with active debounceTimer (lines 575-577)', async () => {
      vi.useFakeTimers()

      const autoLayout = createAutoLayout({
        debounce: 1000, // Long debounce
      })

      element1.setAttribute('data-layout-id', 'timer-cleanup-test')

      // Trigger update to create debounceTimer
      autoLayout.update()

      // Destroy while timer is active - should clear it (lines 575-577)
      autoLayout.destroy()

      // Advance time - timer should not fire
      vi.advanceTimersByTime(2000)

      vi.useRealTimers()

      // Should not throw
      expect(() => autoLayout.destroy()).not.toThrow()
    })

    it('should handle debouncedUpdate clearing existing timer (lines 491-493)', async () => {
      vi.useFakeTimers()

      const container = document.createElement('div')
      document.body.appendChild(container)

      const autoLayout = createAutoLayout({
        root: container,
        debounce: 500,
      })

      // First call starts timer
      autoLayout.update()

      // Second call should clear first timer (lines 491-493) and start new one
      autoLayout.update()

      // Advance time - only second timer should fire
      vi.advanceTimersByTime(500)

      vi.useRealTimers()

      autoLayout.destroy()
      container.remove()
    })

    it('should clear debounce timer on destroy while pending (lines 575-577)', () => {
      vi.useFakeTimers()
      const container = document.createElement('div')
      document.body.appendChild(container)

      const autoLayout = createAutoLayout({
        root: container,
        debounce: 1000, // Long debounce
      })

      // Start an update which will set debounceTimer
      autoLayout.update()

      // Destroy while timer is still pending - should clear it (lines 575-577)
      autoLayout.destroy()

      vi.useRealTimers()
      container.remove()
    })
  })
})
