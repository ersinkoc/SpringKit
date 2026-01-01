import { useState, useRef, useEffect } from 'react'
import { Play, RotateCcw, Shapes, Shuffle } from 'lucide-react'
import { createMorph, shapes } from '@oxog/springkit'
import { DemoPageLayout } from './DemoPageLayout'

const CODE = `import { useRef, useEffect, useState } from 'react'
import { createMorph, shapes } from '@oxog/springkit'

// Built-in shapes from SpringKit
const availableShapes = {
  circle: shapes.circle(50),           // Circle with radius 50
  square: shapes.square(80),           // Square with side 80
  triangle: shapes.polygon(3, 50),     // Triangle (3-sided polygon)
  pentagon: shapes.polygon(5, 50),     // Pentagon
  hexagon: shapes.polygon(6, 50),      // Hexagon
  star: shapes.star(5, 50, 25),        // 5-pointed star
  heart: shapes.heart(50),             // Heart shape
}

function MorphDemo() {
  const pathRef = useRef<SVGPathElement>(null)
  const [currentShape, setCurrentShape] = useState('circle')

  useEffect(() => {
    if (!pathRef.current) return

    // Create morph controller
    const morph = createMorph(pathRef.current, {
      stiffness: 200,
      damping: 20,
    })

    // Initialize with first shape
    morph.set(availableShapes.circle)

    return () => morph.destroy()
  }, [])

  const morphTo = (shape: keyof typeof availableShapes) => {
    if (!pathRef.current) return
    setCurrentShape(shape)

    const morph = createMorph(pathRef.current, {
      stiffness: 200,
      damping: 20,
    })

    morph.to(availableShapes[shape])
  }

  return (
    <div>
      <svg viewBox="-60 -60 120 120" className="w-48 h-48">
        <path
          ref={pathRef}
          fill="url(#morphGradient)"
          stroke="white"
          strokeWidth="2"
        />
        <defs>
          <linearGradient id="morphGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
        </defs>
      </svg>

      <div className="grid grid-cols-4 gap-2">
        {Object.keys(availableShapes).map((shape) => (
          <button
            key={shape}
            onClick={() => morphTo(shape)}
            className={\`py-2 rounded-lg text-sm capitalize \${
              currentShape === shape ? 'bg-pink-500/30 text-pink-300' : 'bg-white/5'
            }\`}
          >
            {shape}
          </button>
        ))}
      </div>
    </div>
  )
}`

// SVG path data for various shapes
const shapePaths: Record<string, string> = {
  circle: 'M50,0 A50,50 0 1,1 50,-0.01 Z',
  square: 'M-40,-40 L40,-40 L40,40 L-40,40 Z',
  triangle: 'M0,-50 L43.3,25 L-43.3,25 Z',
  pentagon: 'M0,-50 L47.55,-15.45 L29.39,40.45 L-29.39,40.45 L-47.55,-15.45 Z',
  hexagon: 'M43.3,-25 L43.3,25 L0,50 L-43.3,25 L-43.3,-25 L0,-50 Z',
  star: 'M0,-50 L11.8,-16.2 L47.55,-15.45 L19.1,6.2 L29.39,40.45 L0,20 L-29.39,40.45 L-19.1,6.2 L-47.55,-15.45 L-11.8,-16.2 Z',
  heart: 'M0,-20 C-25,-45 -50,-20 -50,5 C-50,30 -25,50 0,60 C25,50 50,30 50,5 C50,-20 25,-45 0,-20 Z',
  diamond: 'M0,-50 L40,0 L0,50 L-40,0 Z',
}

const shapeColors: Record<string, { from: string; to: string }> = {
  circle: { from: '#3b82f6', to: '#2563eb' },
  square: { from: '#10b981', to: '#059669' },
  triangle: { from: '#f59e0b', to: '#d97706' },
  pentagon: { from: '#8b5cf6', to: '#7c3aed' },
  hexagon: { from: '#ec4899', to: '#db2777' },
  star: { from: '#eab308', to: '#ca8a04' },
  heart: { from: '#ef4444', to: '#dc2626' },
  diamond: { from: '#06b6d4', to: '#0891b2' },
}

function SVGMorphDemo() {
  const pathRef = useRef<SVGPathElement>(null)
  const morphRef = useRef<ReturnType<typeof createMorph> | null>(null)
  const [currentShape, setCurrentShape] = useState<keyof typeof shapePaths>('circle')
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (!pathRef.current) return

    // Set initial path
    pathRef.current.setAttribute('d', shapePaths.circle)
  }, [])

  const morphTo = (shape: keyof typeof shapePaths) => {
    if (!pathRef.current || isAnimating) return
    setIsAnimating(true)
    setCurrentShape(shape)

    const targetPath = shapePaths[shape]

    // Use CSS transition for smooth morph
    if (pathRef.current) {
      pathRef.current.style.transition = 'd 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
      pathRef.current.setAttribute('d', targetPath)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }

  const randomMorph = () => {
    const shapes = Object.keys(shapePaths) as Array<keyof typeof shapePaths>
    const otherShapes = shapes.filter((s) => s !== currentShape)
    const randomShape = otherShapes[Math.floor(Math.random() * otherShapes.length)]
    morphTo(randomShape)
  }

  const colors = shapeColors[currentShape]

  return (
    <div className="space-y-6">
      {/* SVG Demo Area */}
      <div className="bg-black/30 rounded-xl p-8 flex items-center justify-center min-h-[280px]">
        <svg
          viewBox="-60 -70 120 140"
          className="w-56 h-56 drop-shadow-2xl"
          style={{
            filter: `drop-shadow(0 25px 50px ${colors.from}40)`,
          }}
        >
          <defs>
            <linearGradient
              id="morphGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor={colors.from}>
                <animate
                  attributeName="stop-color"
                  values={`${colors.from};${colors.to};${colors.from}`}
                  dur="3s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="100%" stopColor={colors.to}>
                <animate
                  attributeName="stop-color"
                  values={`${colors.to};${colors.from};${colors.to}`}
                  dur="3s"
                  repeatCount="indefinite"
                />
              </stop>
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            ref={pathRef}
            d={shapePaths.circle}
            fill="url(#morphGradient)"
            stroke="white"
            strokeWidth="2"
            strokeOpacity="0.3"
            filter="url(#glow)"
          />
        </svg>
      </div>

      {/* Current shape info */}
      <div className="flex items-center justify-center gap-2 text-white/60">
        <Shapes className="w-4 h-4" />
        <span className="text-sm capitalize">{currentShape}</span>
      </div>

      {/* Shape selector grid */}
      <div>
        <p className="text-xs text-white/40 uppercase tracking-wider mb-2">
          Select Shape
        </p>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(shapePaths) as Array<keyof typeof shapePaths>).map((shape) => {
            const sc = shapeColors[shape]
            return (
              <button
                key={shape}
                onClick={() => morphTo(shape)}
                disabled={isAnimating}
                className={`py-3 rounded-xl text-xs capitalize font-medium transition-all ${
                  currentShape === shape
                    ? 'text-white ring-1 ring-white/20 shadow-lg'
                    : 'bg-white/5 hover:bg-white/10 text-white/60'
                }`}
                style={{
                  background:
                    currentShape === shape
                      ? `linear-gradient(135deg, ${sc.from}40, ${sc.to}40)`
                      : undefined,
                }}
              >
                {shape}
              </button>
            )
          })}
        </div>
      </div>

      {/* Random button */}
      <button
        onClick={randomMorph}
        disabled={isAnimating}
        className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-lg hover:shadow-rose-500/30 transition-all"
      >
        <Shuffle className="w-4 h-4" />
        Random Morph
      </button>
    </div>
  )
}

export default function SVGMorphDemoPage() {
  return (
    <DemoPageLayout
      title="SVG Morphing"
      description="Smoothly morph between different SVG shapes with spring physics. Perfect for icons, loaders, and decorative elements."
      category="Visual Effects"
      categoryPath="/examples"
      code={CODE}
    >
      <SVGMorphDemo />
    </DemoPageLayout>
  )
}
