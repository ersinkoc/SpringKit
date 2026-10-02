/**
 * Regression tests for useInView hooks
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import * as React from 'react'
import { useInViewMultiple } from '../../../src/adapters/react/hooks/useInView'

// IntersectionObserver that reports every observed element as intersecting,
// synchronously (other test files may replace the global mock)
class SyncIntersectionObserver {
  constructor(private callback: IntersectionObserverCallback) {}
  observe(target: Element) {
    this.callback(
      [{ isIntersecting: true, intersectionRatio: 1, target } as unknown as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    )
  }
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', SyncIntersectionObserver)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useInViewMultiple', () => {
  it('does not loop / flicker with the documented inline ref callback', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    let renders = 0
    let api!: ReturnType<typeof useInViewMultiple>
    function List() {
      renders++
      api = useInViewMultiple()
      return (
        <ul>
          {['a', 'b'].map((id) => (
            <li key={id} ref={(el) => api.setRef(id, el)}>
              {id}
            </li>
          ))}
        </ul>
      )
    }

    let thrown: unknown = null
    try {
      render(<List />)
      await act(async () => { await Promise.resolve() })
    } catch (e) {
      thrown = e
    }
    errors.mockRestore()

    expect(thrown).toBeNull()
    expect(renders).toBeLessThan(10)
    expect(api.getInView('a')).toBe(true)
    expect(api.getInView('b')).toBe(true)
  })

  it('removes an element from the map when it is really unmounted', async () => {
    let api!: ReturnType<typeof useInViewMultiple>
    function List({ ids }: { ids: string[] }) {
      api = useInViewMultiple()
      return (
        <ul>
          {ids.map((id) => (
            <li key={id} ref={(el) => api.setRef(id, el)}>
              {id}
            </li>
          ))}
        </ul>
      )
    }
    const { rerender } = render(<List ids={['a', 'b']} />)
    await act(async () => { await Promise.resolve() })
    rerender(<List ids={['a']} />)
    await act(async () => { await Promise.resolve() })
    expect(api.inViewMap.has('b')).toBe(false)
    expect(api.getInView('a')).toBe(true)
  })
})
