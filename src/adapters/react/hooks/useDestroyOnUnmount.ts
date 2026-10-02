import { useEffect, useRef } from 'react'

/**
 * Run `destroy` when the component really unmounts.
 *
 * React StrictMode (dev) simulates an unmount/remount right after mount: it runs
 * every effect cleanup and then every effect setup again WITHOUT re-rendering.
 * Destroying render-created resources (MotionValues, springs, ...) synchronously
 * in a cleanup therefore leaves the component - and any child that already
 * received the instance during render - holding a dead instance until some
 * unrelated re-render happens (or forever, for effects with `[]` deps).
 *
 * The cleanup is deferred to a microtask and cancelled when the effect is set
 * up again (the simulated remount happens synchronously, before the microtask).
 *
 * @internal
 */
export function useDestroyOnUnmount(destroy: () => void): void {
  const destroyRef = useRef(destroy)
  destroyRef.current = destroy
  const mountIdRef = useRef(0)

  useEffect(() => {
    // Reading the *latest* id in the deferred cleanup is the whole point
    const mountIds = mountIdRef
    const mountId = ++mountIds.current
    return () => {
      queueMicrotask(() => {
        // A newer setup ran (StrictMode remount) - keep the resources alive
        if (mountIds.current !== mountId) return
        destroyRef.current()
      })
    }
  }, [])
}
