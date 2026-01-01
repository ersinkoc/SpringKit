import { Link } from 'react-router-dom'
import {
  Gauge, Grid3X3, Timer, Zap, Shapes, MousePointer2, Layers, Type,
  ArrowRight, Sparkles, Play, LayoutGrid
} from 'lucide-react'

interface DemoCardProps {
  title: string
  description: string
  icon: React.ReactNode
  path: string
  gradient: string
  tags?: string[]
}

function DemoCard({ title, description, icon, path, gradient, tags }: DemoCardProps) {
  return (
    <Link
      to={path}
      className="group relative bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden hover:border-slate-600/50 transition-all hover:shadow-xl"
    >
      {/* Gradient overlay on hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity`}
      />

      <div className="p-6">
        {/* Icon */}
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-lg`}
        >
          {icon}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-white/90 transition-colors">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-white/50 mb-4 line-clamp-2">
          {description}
        </p>

        {/* Tags */}
        {tags && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs bg-white/5 text-white/40 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Link indicator */}
        <div className="flex items-center gap-2 text-sm text-white/40 group-hover:text-white/60 transition-colors">
          <Play className="w-4 h-4" />
          <span>View Demo</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  )
}

const demos: DemoCardProps[] = [
  {
    title: 'Physics Presets',
    description: 'Pre-configured spring physics for common animation needs. Bouncy, snappy, smooth, and more.',
    icon: <Gauge className="w-6 h-6 text-white" />,
    path: '/examples/physics-presets',
    gradient: 'from-amber-500 to-orange-500',
    tags: ['Core', 'Spring Config'],
  },
  {
    title: 'Stagger Patterns',
    description: 'Orchestrate animations with linear, center, wave, grid, and spiral stagger patterns.',
    icon: <Grid3X3 className="w-6 h-6 text-white" />,
    path: '/examples/stagger-patterns',
    gradient: 'from-violet-500 to-purple-500',
    tags: ['Animation', 'Orchestration'],
  },
  {
    title: 'Timeline API',
    description: 'Create complex, coordinated animation sequences with precise timing control.',
    icon: <Timer className="w-6 h-6 text-white" />,
    path: '/examples/timeline',
    gradient: 'from-cyan-500 to-blue-500',
    tags: ['Animation', 'Sequence'],
  },
  {
    title: 'Physics Hooks',
    description: 'useBounce, useElastic, and useGravity hooks for physics-based animations.',
    icon: <Zap className="w-6 h-6 text-white" />,
    path: '/examples/physics-hooks',
    gradient: 'from-orange-500 to-rose-500',
    tags: ['React', 'Hooks'],
  },
  {
    title: 'SVG Morphing',
    description: 'Smoothly morph between different SVG shapes with spring physics.',
    icon: <Shapes className="w-6 h-6 text-white" />,
    path: '/examples/svg-morph',
    gradient: 'from-pink-500 to-rose-500',
    tags: ['SVG', 'Visual'],
  },
  {
    title: 'Gesture Hooks',
    description: 'useDrag, useHover, and useTap hooks for interactive animations.',
    icon: <MousePointer2 className="w-6 h-6 text-white" />,
    path: '/examples/gestures',
    gradient: 'from-emerald-500 to-teal-500',
    tags: ['React', 'Interaction'],
  },
  {
    title: 'Variants System',
    description: 'Define declarative animation states and smoothly transition between them.',
    icon: <Layers className="w-6 h-6 text-white" />,
    path: '/examples/variants',
    gradient: 'from-emerald-500 to-cyan-500',
    tags: ['Core', 'State'],
  },
  {
    title: 'Text Animations',
    description: 'SpringText, SpringNumber, and TypeWriter components for text animations.',
    icon: <Type className="w-6 h-6 text-white" />,
    path: '/examples/text-animations',
    gradient: 'from-rose-500 to-pink-500',
    tags: ['Components', 'Text'],
  },
  {
    title: 'All Examples',
    description: 'Full showcase with all demos in one page. Original collection with 20+ interactive examples.',
    icon: <LayoutGrid className="w-6 h-6 text-white" />,
    path: '/examples/all',
    gradient: 'from-slate-500 to-zinc-600',
    tags: ['Complete', 'Showcase'],
  },
]

export default function ExamplesIndex() {
  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-full border border-violet-500/30 mb-6">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-sm text-violet-300">Interactive Examples</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Explore SpringKit
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Each example includes a live demo and full source code.
            Click any card to explore the feature in detail.
          </p>
        </div>

        {/* Demo Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {demos.map((demo) => (
            <DemoCard key={demo.path} {...demo} />
          ))}
        </div>

        {/* More coming soon */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full text-white/40 text-sm">
            <Sparkles className="w-4 h-4" />
            More examples coming soon
          </div>
        </div>
      </div>
    </div>
  )
}
