/**
 * React hooks for SVG morphing
 */
import { useState, useRef, useCallback } from 'react'
import {
  createMorph,
  createMorphSequence,
  type MorphConfig,
  type MorphController,
} from '../../../index.js'
import { useIsomorphicLayoutEffect } from '../utils/ssr.js'

// ============ useMorph ============

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
  /** The morph controller instance */
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
  const morphRef = useRef<MorphController | null>(null)

  useIsomorphicLayoutEffect(() => {
    const morph = createMorph(initialPath, {
      ...options,
      onProgress: (p) => {
        setProgressState(p)
        options.onProgress?.(p)
      },
    })

    morph.subscribe((newPath) => {
      setPath(newPath)
    })

    morphRef.current = morph

    return () => {
      morph.destroy()
    }
  }, [initialPath])

  const morphTo = useCallback((targetPath: string) => {
    morphRef.current?.morphTo(targetPath)
  }, [])

  const setProgress = useCallback((p: number) => {
    morphRef.current?.setProgress(p)
  }, [])

  return {
    path,
    progress,
    morphTo,
    setProgress,
    controller: morphRef.current,
  }
}

// ============ useMorphSequence ============

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

  const sequenceRef = useRef<ReturnType<typeof createMorphSequence> | null>(null)

  useIsomorphicLayoutEffect(() => {
    if (paths.length === 0) return

    const sequence = createMorphSequence(paths, options)

    sequence.subscribe((newPath) => {
      setPath(newPath)
      setCurrentIndex(sequence.getCurrentIndex())
    })

    sequenceRef.current = sequence

    return () => {
      sequence.destroy()
    }
  }, [paths.length])

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

  const pathRef = useCallback(
    (element: SVGPathElement | null) => {
      if (!element) {
        morphRef.current?.destroy()
        morphRef.current = null
        elementRef.current = null
        return
      }

      elementRef.current = element

      const morph = createMorph(initialPath, {
        ...options,
        onProgress: (p) => {
          setProgressState(p)
          options.onProgress?.(p)
        },
      })

      morph.subscribe((path) => {
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
