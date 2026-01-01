import { useState, Suspense, lazy, ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Sparkles, Zap, Layers, MousePointer2, Activity, Box, Timer, Shapes, Grid3X3,
  ChevronRight, Loader2
} from 'lucide-react'

// Category definitions
export const CATEGORIES = [
  {
    id: 'latest',
    label: 'Latest (v1.3)',
    icon: Sparkles,
    color: 'from-indigo-500 to-purple-500',
    description: 'Variants, Timeline, SVG Morphing, Scroll-Linked, Stagger Patterns'
  },
  {
    id: 'core',
    label: 'Core Features',
    icon: Zap,
    color: 'from-orange-500 to-amber-500',
    description: 'Spring presets, physics visualizer, orchestration'
  },
  {
    id: 'hooks',
    label: 'React Hooks',
    icon: Activity,
    color: 'from-blue-500 to-cyan-500',
    description: 'useSpring, useMotionValue, useScroll, useInView, and more'
  },
  {
    id: 'gestures',
    label: 'Gestures & Drag',
    icon: MousePointer2,
    color: 'from-emerald-500 to-teal-500',
    description: 'Drag, hover, tap, focus interactions'
  },
  {
    id: 'components',
    label: 'UI Components',
    icon: Layers,
    color: 'from-pink-500 to-rose-500',
    description: 'Cards, notifications, menus, toggles'
  },
  {
    id: 'effects',
    label: 'Visual Effects',
    icon: Shapes,
    color: 'from-violet-500 to-purple-500',
    description: 'Particles, waves, morphing shapes'
  },
  {
    id: 'animation',
    label: 'Animation Types',
    icon: Timer,
    color: 'from-amber-500 to-yellow-500',
    description: 'Keyframes, trail, decay, sequences'
  },
  {
    id: 'layout',
    label: 'Layout Animation',
    icon: Grid3X3,
    color: 'from-cyan-500 to-blue-500',
    description: 'FLIP, reorder, AnimatePresence'
  },
] as const

export type CategoryId = typeof CATEGORIES[number]['id']

interface ExamplesLayoutProps {
  children: ReactNode
  activeCategory: CategoryId
}

export function ExamplesLayout({ children, activeCategory }: ExamplesLayoutProps) {
  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Interactive Examples</h1>
          <p className="text-white/50">
            Explore SpringKit's features with live demos and code
          </p>
        </div>

        {/* Category Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon
              const isActive = activeCategory === cat.id
              return (
                <Link
                  key={cat.id}
                  to={`/examples/${cat.id}`}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                    isActive
                      ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{cat.label}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Category Description */}
        {CATEGORIES.find(c => c.id === activeCategory) && (
          <div className="text-center mb-8">
            <p className="text-white/40 text-sm">
              {CATEGORIES.find(c => c.id === activeCategory)?.description}
            </p>
          </div>
        )}

        {/* Content */}
        <Suspense fallback={
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
          </div>
        }>
          {children}
        </Suspense>
      </div>
    </div>
  )
}

// Loading component for lazy-loaded demos
export function DemoLoading() {
  return (
    <div className="flex items-center justify-center h-40">
      <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
    </div>
  )
}
