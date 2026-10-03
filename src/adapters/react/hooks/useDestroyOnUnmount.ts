import { useEffect, useReducer, useRef } from 'react'

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
 * A hidden `<Activity>` also runs the cleanups (and the destroy, since nothing
 * is set up again soon), then sets the effects up again when it is shown -
 * without re-rendering. The hook then forces a re-render, in which the caller's
 * `isDestroyed()` / `null` checks recreate the resources.
 *
 * @internal
 */
export function useDestroyOnUnmount(destroy: () => void): void {
  const destroyRef = useRef(destroy)
  destroyRef.current = destroy
  const mountIdRef = useRef(0)
  const destroyedRef = useRef(false)
  const [, forceRender] = useReducer((n: number) => n + 1, 0)

  useEffect(() => {
    // Reading the *latest* id in the deferred cleanup is the whole point
    const mountIds = mountIdRef
    const mountId = ++mountIds.current
    if (destroyedRef.current) {
      // Set up again after the resources were destroyed (a hidden <Activity>
      // shown again): render again so they are recreated
      destroyedRef.current = false
      forceRender()
    }
    return () => {
      queueMicrotask(() => {
        // A newer setup ran (StrictMode remount) - keep the resources alive
        if (mountIds.current !== mountId) return
        destroyedRef.current = true
        destroyRef.current()
      })
    }
  }, [])
}
