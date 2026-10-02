/**
 * React hooks for SVG morphing
 */
import { useState, useRef, useCallback } from 'react'
import {
  createMorph,
  createMorphSequence,
  type MorphConfig,
  type MorphController,
} from '@oxog/springkit'
import { useIsomorphicLayoutEffect } from '../utils/ssr.js'
import { useDestroyOnUnmount } from './useDestroyOnUnmount.js'

// ============ useMorph ============

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UseMorphOptions extends MorphConfig {}

export interface UseMorphReturn {
  /** Current morphed path string */
  path: string
  /** Current morph progress (0-1) */
  progress: number
  /** Morph to a new path */
  morphTo: (path: string) => void
  /** Set progress directly */
  setProgress: (progress: number) => void
  /**
   * The morph controller instance. Available from the first render; replaced
   * when `initialPath` changes.
   */
  controller: MorphController | null
}

/**
 * Create an SVG path morph animation
 *
 * @example
 * ```tsx
 * const circlePath = 'M50,50 m-25,0 a25,25 0 1,0 50,0 a25,25 0 1,0 -50,0'
 * const starPath = 'M50,25 L58,42 L75,42 L62,52 L67,70 L50,60 L33,70 L38,52 L25,42 L42,42 Z'
 *
 * function MorphingShape() {
 *   const { path, morphTo } = useMorph(circlePath, {
 *     spring: { stiffness: 120, damping: 14 },
 *   })
 *
 *   return (
 *     <svg onClick={() => morphTo(starPath)}>
 *       <path d={path} fill="blue" />
 *     </svg>
 *   )
 * }
 * ```
 */
export function useMorph(
  initialPath: string,
  options: UseMorphOptions = {}
): UseMorphReturn {
  const [path, setPath] = useState(initialPath)
  const [progress, setProgressState] = useState(0)
  // Controller + the initialPath it was created for
  const morphRef = useRef<{ controller: MorphController; path: string } | null>(null)
  // Controller the effect last subscribed to (destroyed once it is replaced)
  const activeRef = useRef<MorphController | null>(null)
  const isMountedRef = useRef(false)

  // Use ref to capture latest options without causing effect re-runs
  const optionsRef = useRef(options)
  optionsRef.current = options

  // Created lazily during render so `controller` is usable right away. It only
  // allocates a (idle) spring; subscriptions are made in the effect below.
  if (morphRef.current === null || morphRef.current.path !== initialPath) {
    morphRef.current = {
      path: initialPath,
      controller: createMorph(initialPath, {
        ...optionsRef.current,
        onProgress: (p) => {
          if (!isMountedRef.current) return
          setProgressState(p)
          // Read the latest callback (options captured at creation may be stale)
          optionsRef.current.onProgress?.(p)
        },
      }),
    }
  }
  const controller = morphRef.current.controller

  useIsomorphicLayoutEffect(() => {
    const morph = morphRef.current?.controller
    if (!morph) return
    // initialPath changed: the previous controller is no longer used
    if (activeRef.current !== null && activeRef.current !== morph) {
      activeRef.current.destroy()
    }
    activeRef.current = morph
    isMountedRef.current = true

    // Store unsubscribe function to prevent memory leak
    const unsubscribe = morph.subscribe((newPath) => {
      if (!isMountedRef.current) return
      setPath(newPath)
    })

    return () => {
      isMountedRef.current = false
      unsubscribe()
    }
  }, [initialPath])

  // Destroy on real unmount only (deferred so StrictMode's simulated remount
  // keeps the controller that was already handed out during render)
  useDestroyOnUnmount(() => {
    const current = morphRef.current?.controller ?? null
    current?.destroy()
    if (activeRef.current !== current) activeRef.current?.destroy()
    morphRef.current = null
    activeRef.current = null
  })

  const morphTo = useCallback((targetPath: string) => {
    morphRef.current?.controller.morphTo(targetPath)
  }, [])

  const setProgress = useCallback((p: number) => {
    morphRef.current?.controller.setProgress(p)
  }, [])

  return {
    path,
    progress,
    morphTo,
    setProgress,
    controller,
  }
}

// ============ useMorphSequence ============

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UseMorphSequenceOptions extends MorphConfig {}

export interface UseMorphSequenceReturn {
  /** Current morphed path string */
  path: string
  /** Current path index */
  currentIndex: number
  /** Morph to a specific index */
  morphToIndex: (index: number) => void
  /** Morph to the next path */
  morphToNext: () => void
  /** Morph to the previous path */
  morphToPrevious: () => void
}

/**
 * Create a morphing sequence between multiple paths
 *
 * @example
 * ```tsx
 * const paths = [circlePath, squarePath, trianglePath, starPath]
 *
 * function MorphSequence() {
 *   const { path, currentIndex, morphToNext } = useMorphSequence(paths, {
 *     spring: { stiffness: 100, damping: 12 },
 *   })
 *
 *   return (
 *     <svg onClick={morphToNext}>
 *       <path d={path} fill="purple" />
 *       <text>Shape {currentIndex + 1}</text>
 *     </svg>
 *   )
 * }
 * ```
 */
export function useMorphSequence(
  paths: string[],
  options: UseMorphSequenceOptions = {}
): UseMorphSequenceReturn {
  const [path, setPath] = useState(paths[0] ?? '')
  const [currentIndex, setCurrentIndex] = useState(0)
  const isMountedRef = useRef(false)

  const sequenceRef = useRef<ReturnType<typeof createMorphSequence> | null>(null)

  // Use ref to capture latest options without causing effect re-runs
  const optionsRef = useRef(options)
  optionsRef.current = options

  // Memoize paths to detect content changes, not just length
  const pathsKey = paths.join('|')

  useIsomorphicLayoutEffect(() => {
    if (paths.length === 0) return
    isMountedRef.current = true

    const sequence = createMorphSequence(paths, optionsRef.current)

    // Store unsubscribe function to prevent memory leak
    const unsubscribe = sequence.subscribe((newPath) => {
      if (!isMountedRef.current) return
      setPath(newPath)
      setCurrentIndex(sequence.getCurrentIndex())
    })

    sequenceRef.current = sequence

    return () => {
      isMountedRef.current = false
      unsubscribe()
      sequence.destroy()
    }
  }, [pathsKey])

  const morphToIndex = useCallback((index: number) => {
    sequenceRef.current?.morphToIndex(index)
  }, [])

  const morphToNext = useCallback(() => {
    sequenceRef.current?.morphToNext()
  }, [])

  const morphToPrevious = useCallback(() => {
    sequenceRef.current?.morphToPrevious()
  }, [])

  return {
    path,
    currentIndex,
    morphToIndex,
    morphToNext,
    morphToPrevious,
  }
}

// ============ useMorphRef ============

/**
 * Create a ref callback that automatically updates path on SVG elements
 *
 * @example
 * ```tsx
 * function AutoMorphPath() {
 *   const { pathRef, morphTo } = useMorphRef(circlePath)
 *
 *   return (
 *     <svg>
 *       <path ref={pathRef} fill="green" />
 *       <button onClick={() => morphTo(starPath)}>Morph</button>
 *     </svg>
 *   )
 * }
 * ```
 */
export function useMorphRef(
  initialPath: string,
  options: UseMorphOptions = {}
): {
  pathRef: React.RefCallback<SVGPathElement>
  morphTo: (path: string) => void
  setProgress: (progress: number) => void
  progress: number
} {
  const [progress, setProgressState] = useState(0)
  const morphRef = useRef<MorphController | null>(null)
  const elementRef = useRef<SVGPathElement | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)
  // Latest options, so callbacks are not stuck with the first render's closure
  const optionsRef = useRef(options)
  optionsRef.current = options

  const pathRef = useCallback(
    (element: SVGPathElement | null) => {
      // Cleanup previous subscription to prevent memory leak
      unsubscribeRef.current?.()
      unsubscribeRef.current = null

      if (!element) {
        morphRef.current?.destroy()
        morphRef.current = null
        elementRef.current = null
        return
      }

      elementRef.current = element

      const morph = createMorph(initialPath, {
        ...optionsRef.current,
        onProgress: (p) => {
          setProgressState(p)
          optionsRef.current.onProgress?.(p)
        },
      })

      // Store unsubscribe function to prevent memory leak
      unsubscribeRef.current = morph.subscribe((path) => {
        element.setAttribute('d', path)
      })

      morphRef.current = morph
    },
    [initialPath]
  )

  const morphTo = useCallback((targetPath: string) => {
    morphRef.current?.morphTo(targetPath)
  }, [])

  const setProgress = useCallback((p: number) => {
    morphRef.current?.setProgress(p)
  }, [])

  return {
    pathRef,
    morphTo,
    setProgress,
    progress,
  }
}
