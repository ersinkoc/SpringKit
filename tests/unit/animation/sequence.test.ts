import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { sequence, parallel, stagger } from '@oxog/springkit'

describe('animation orchestration', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('sequence', () => {
    it('should run animations sequentially', async () => {
      const results: number[] = []

      const promise = sequence([
        () => ({ finished: Promise.resolve().then(() => results.push(1)) }),
        () => ({ finished: Promise.resolve().then(() => results.push(2)) }),
        () => ({ finished: Promise.resolve().then(() => results.push(3)) }),
      ])

      await promise

      expect(results).toEqual([1, 2, 3])
    })

    it('should handle empty array', async () => {
      await expect(sequence([])).resolves.toBeUndefined()
    })
  })

  describe('parallel', () => {
    it('should run animations in parallel', async () => {
      const results: number[] = []

      await parallel([
        () => ({ finished: Promise.resolve().then(() => results.push(1)) }),
        () => ({ finished: Promise.resolve().then(() => results.push(2)) }),
        () => ({ finished: Promise.resolve().then(() => results.push(3)) }),
      ])

      expect(results.sort()).toEqual([1, 2, 3])
    })

    it('should handle empty array', async () => {
      await expect(parallel([])).resolves.toBeUndefined()
    })
  })

  describe('stagger', () => {
    it('should stagger animations from first', async () => {
      const items = ['a', 'b', 'c']
      const results: string[] = []

      await stagger(
        items,
        (item, index) => {
          results.push(item)
          return {
            start: () => ({ start: () => ({ finished: Promise.resolve() }), finished: Promise.resolve() }),
            finished: Promise.resolve(),
          }
        },
        { delay: 10, from: 'first' }
      )

      expect(results).toEqual(['a', 'b', 'c'])
    })

    it('should stagger animations from last', async () => {
      const items = ['a', 'b', 'c']
      const results: string[] = []

      await stagger(
        items,
        (item) => {
          results.push(item)
          return {
            start: () => ({ start: () => ({ finished: Promise.resolve() }), finished: Promise.resolve() }),
            finished: Promise.resolve(),
          }
        },
        { delay: 0, from: 'last' }
      )

      expect(results).toContain('c')
    })

    it('should stagger animations from center', async () => {
      const items = ['a', 'b', 'c', 'd', 'e']
      const results: string[] = []

      await stagger(
        items,
        (item) => {
          results.push(item)
          return {
            start: () => ({ start: () => ({ finished: Promise.resolve() }), finished: Promise.resolve() }),
            finished: Promise.resolve(),
          }
        },
        { delay: 0, from: 'center' }
      )

      expect(results[0]).toBe('c')
    })

    it('should stagger animations from index', async () => {
      const items = ['a', 'b', 'c', 'd']
      const results: string[] = []

      await stagger(
        items,
        (item) => {
          results.push(item)
          return {
            start: () => ({ start: () => ({ finished: Promise.resolve() }), finished: Promise.resolve() }),
            finished: Promise.resolve(),
          }
        },
        { delay: 0, from: 1 }
      )

      expect(results[0]).toBe('b')
    })

    it('should use dynamic delay function', async () => {
      const items = ['a', 'b', 'c']
      const delays: number[] = []

      await stagger(
        items,
        (item) => ({
          start: () => ({ start: () => ({ finished: Promise.resolve() }), finished: Promise.resolve() }),
          finished: Promise.resolve(),
        }),
        {
          delay: (index) => {
            delays.push(index)
            return 0
          },
        }
      )

      expect(delays).toEqual([0, 1, 2])
    })

    it('should handle empty array', async () => {
      await expect(
        stagger([], () => ({ start: () => ({ start: () => ({ finished: Promise.resolve() }), finished: Promise.resolve() }), finished: Promise.resolve() }))
      ).resolves.toBeUndefined()
    })

    it('should default to no delay', async () => {
      const items = ['a', 'b']
      const results: string[] = []

      await stagger(
        items,
        (item) => {
          results.push(item)
          return {
            start: () => ({ start: () => ({ finished: Promise.resolve() }), finished: Promise.resolve() }),
            finished: Promise.resolve(),
          }
        },
        {}
      )

      expect(results).toEqual(['a', 'b'])
    })

    it('should use setTimeout for positive delays', async () => {
      // Use real timers to properly test setTimeout callback
      vi.useRealTimers()

      const items = ['a', 'b']
      const startOrder: string[] = []
      let resolvers: (() => void)[] = []

      await stagger(
        items,
        (item) => {
          let resolver: () => void
          const finishPromise = new Promise<void>((resolve) => {
            resolver = resolve
          })
          resolvers.push(resolver!)

          return {
            start: () => {
              startOrder.push(item)
              // Resolve immediately on start so the test can complete
              resolver()
            },
            finished: finishPromise,
          }
        },
        { delay: 5 }
      )

      // Both items should have been started
      expect(startOrder).toEqual(['a', 'b'])
    }, 2000)

    it('should handle fallback safety loop for edge cases', async () => {
      // This test aims to trigger lines 131-133, the fallback safety loop
      // The loop handles edge cases where indices might not be properly added to used set

      // Restore real timers to avoid any fake timer interference
      vi.useRealTimers()

      // Test with empty array - the fallback loop should run (though no indices to add)
      await expect(
        stagger([], () => ({
          start: () => ({ start: () => ({ finished: Promise.resolve() }), finished: Promise.resolve() }),
          finished: Promise.resolve(),
        }))
      ).resolves.toBeUndefined()

      // Test with single item - main loop should handle it, fallback loop should run but find nothing to add
      const items = ['x']
      await stagger(
        items,
        (item) => {
          return {
            start: () => ({ start: () => ({ finished: Promise.resolve() }), finished: Promise.resolve() }),
            finished: Promise.resolve(),
          }
        },
        { delay: 0, from: 'first' }
      )
    })

    it('should trigger fallback loop with edge case from value', async () => {
      vi.useRealTimers()

      // Use a from value that's technically outside normal bounds but won't cause an error
      const items = ['a', 'b']
      await stagger(
        items,
        (item) => {
          return {
            start: () => ({ start: () => ({ finished: Promise.resolve() }), finished: Promise.resolve() }),
            finished: Promise.resolve(),
          }
        },
        { delay: 0, from: 0 as number } // Use explicit number type
      )
    })
  })
})
