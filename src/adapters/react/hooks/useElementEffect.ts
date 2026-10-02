import { useEffect, useRef } from 'react'

function sameDeps(a: readonly unknown[], b: readonly unknown[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) return false
  }
  return true
}

/**
 * Like `useEffect`, but its dependencies are read AFTER each commit by
 * `getDeps`, so they can include `ref.current` values. React deps are captured
 * during render and can't see a ref that is assigned later (an element that is
 * conditionally rendered, or a ref attached after the hook first ran).
 *
 * The comparison runs after every commit (cheap: a shallow `Object.is` check);
 * `effect` only re-runs - after cleaning up the previous run - when one of the
 * values changed. The last cleanup runs on unmount. Under StrictMode the
 * simulated unmount cleans up and the remount sets the effect up again.
 *
 * @internal
 */
export function useElementEffect(
  effect: (deps: readonly unknown[]) => void | (() => void),
  getDeps: () => readonly unknown[]
): void {
  const stateRef = useRef<{ deps: readonly unknown[]; cleanup: (() => void) | undefined } | null>(null)

  // No deps on purpose: compare the (ref-derived) values after every commit
  useEffect(() => {
    const deps = getDeps()
    const previous = stateRef.current
    if (previous && sameDeps(previous.deps, deps)) return
    previous?.cleanup?.()
    // Record the deps before running the effect so a throwing effect isn't
    // retried on every commit
    stateRef.current = { deps, cleanup: undefined }
    stateRef.current.cleanup = effect(deps) || undefined
  })

  useEffect(() => {
    const state = stateRef
    return () => {
      state.current?.cleanup?.()
      state.current = null
    }
  }, [])
}
