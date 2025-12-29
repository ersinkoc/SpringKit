import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Zap, Feather, Layers, MousePointer2, Sparkles, Copy, Check, Github, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { Highlight, themes } from 'prism-react-renderer'

// Spring-inspired animated background orbs
function BackgroundOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Main glow */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-orange-500/20 via-amber-500/10 to-transparent blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-tl from-rose-500/15 via-orange-500/10 to-transparent blur-3xl animate-pulse-glow delay-300" />

      {/* Orbiting particles */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="animate-orbit">
          <div className="w-2 h-2 rounded-full bg-orange-400/60" />
        </div>
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="animate-orbit" style={{ animationDuration: '25s', animationDirection: 'reverse' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-amber-300/40" />
        </div>
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 grid-pattern opacity-30" />
    </div>
  )
}

// Interactive spring demo visualization
function SpringVisualization() {
  const [isActive, setIsActive] = useState(false)

  return (
    <div className="relative w-80 h-80 mx-auto">
      {/* Decorative rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-64 h-64 rounded-full border border-orange-500/20 animate-spin-slow" />
        <div className="absolute w-48 h-48 rounded-full border border-amber-500/15 animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '25s' }} />
        <div className="absolute w-32 h-32 rounded-full border border-orange-500/10" />
      </div>

      {/* Main spring ball */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
        onClick={() => setIsActive(!isActive)}
        animate={{
          scale: isActive ? 1.2 : 1,
          y: isActive ? -20 : 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 15,
        }}
      >
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 blur-xl opacity-60 animate-pulse-glow" />

          {/* Ball */}
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 via-orange-500 to-amber-600 shadow-2xl flex items-center justify-center glow-orange">
            <Sparkles className="w-8 h-8 text-white/90" />
          </div>
        </div>
      </motion.div>

      {/* Click hint */}
      <p className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm text-muted-foreground">
        Click to animate
      </p>
    </div>
  )
}

// Copy button with feedback
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="p-2 rounded-lg hover:bg-white/5 transition-colors"
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-400" />
      ) : (
        <Copy className="w-4 h-4 text-muted-foreground" />
      )}
    </button>
  )
}

// Feature card component
function FeatureCard({ icon: Icon, title, description, delay }: {
  icon: React.ElementType
  title: string
  description: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="interactive-card glass rounded-2xl p-6 group"
    >
      <div className="feature-icon mb-4">
        <Icon className="w-6 h-6 text-orange-400" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-orange-300 transition-colors">
        {title}
      </h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>
    </motion.div>
  )
}

// Code block with syntax highlighting using prism-react-renderer
function CodeBlock({ code }: { code: string }) {
  return (
    <div className="code-block relative group">
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <CopyButton text={code} />
      </div>
      <div className="absolute top-3 left-4 flex items-center gap-1.5 z-10">
        <div className="w-3 h-3 rounded-full bg-red-500/80" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <div className="w-3 h-3 rounded-full bg-green-500/80" />
      </div>
      <Highlight theme={themes.nightOwl} code={code.trim()} language="tsx">
        {({ style, tokens, getLineProps, getTokenProps }) => (
          <pre className="pt-10 p-6 overflow-x-auto text-sm leading-relaxed" style={{ ...style, background: 'transparent' }}>
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  )
}

// Stats component
function Stats() {
  const stats = [
    { value: '<3KB', label: 'Gzipped' },
    { value: '0', label: 'Dependencies' },
    { value: '100%', label: 'TypeScript' },
    { value: '60fps', label: 'Performance' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: i * 0.1 }}
          className="text-center p-4"
        >
          <div className="text-3xl md:text-4xl font-bold text-gradient mb-1">
            {stat.value}
          </div>
          <div className="text-sm text-muted-foreground">
            {stat.label}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export function Home() {
  const installCode = 'npm install @oxog/springkit'

  const basicExample = `import { spring, springPresets } from '@oxog/springkit'

const anim = spring(0, 100, {
  ...springPresets.bounce,
  onUpdate: (value) => {
    element.style.transform = \`translateX(\${value}px)\`
  },
})

anim.start()`

  const reactExample = `import { useSpring, Animated } from '@oxog/springkit/react'

function AnimatedBox() {
  const [isOpen, setIsOpen] = useState(false)

  const style = useSpring({
    scale: isOpen ? 1.2 : 1,
    opacity: isOpen ? 1 : 0.5,
  })

  return (
    <Animated.div
      onClick={() => setIsOpen(!isOpen)}
      style={{
        transform: \`scale(\${style.scale})\`,
        opacity: style.opacity
      }}
    />
  )
}`

  return (
    <div className="relative min-h-screen mesh-gradient noise">
      <BackgroundOrbs />

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Content */}
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-subtle text-sm mb-6">
                  <Package className="w-4 h-4 text-orange-400" />
                  <span className="text-muted-foreground">v1.0.0 Now Available</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                  <span className="text-gradient">Physics-based</span>
                  <br />
                  <span className="text-white">Spring Animations</span>
                </h1>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed"
              >
                A zero-dependency animation library that brings natural,
                fluid motion to your UI with real spring physics and gesture support.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex flex-wrap gap-4"
              >
                <Link to="/docs/getting-started">
                  <Button size="lg" className="gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0 shadow-lg shadow-orange-500/25">
                    Get Started
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <a href="https://github.com/ersinkoc/springkit" target="_blank" rel="noreferrer">
                  <Button size="lg" variant="outline" className="gap-2 border-white/10 hover:bg-white/5">
                    <Github className="w-4 h-4" />
                    GitHub
                  </Button>
                </a>
              </motion.div>

              {/* Install command */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex items-center gap-3 glass-subtle rounded-xl px-4 py-3 w-fit"
              >
                <code className="text-sm text-orange-300 font-mono">{installCode}</code>
                <CopyButton text={installCode} />
              </motion.div>
            </div>

            {/* Right: Visualization */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden lg:block"
            >
              <SpringVisualization />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-16 px-4 border-y border-white/5">
        <div className="max-w-4xl mx-auto">
          <Stats />
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A complete animation toolkit with physics-based springs, gesture support,
              and React integration.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={Zap}
              title="Real Spring Physics"
              description="Based on actual spring equations with configurable stiffness, damping, and mass for natural motion."
              delay={0}
            />
            <FeatureCard
              icon={Feather}
              title="Zero Dependencies"
              description="No runtime dependencies. Everything implemented from scratch for maximum control and minimal bundle size."
              delay={0.1}
            />
            <FeatureCard
              icon={MousePointer2}
              title="Gesture Support"
              description="Built-in drag and scroll springs with rubber band physics, momentum, and boundary constraints."
              delay={0.2}
            />
            <FeatureCard
              icon={Layers}
              title="Orchestration"
              description="Sequence, parallel, stagger, and trail animations for complex choreographed motion."
              delay={0.3}
            />
            <FeatureCard
              icon={Sparkles}
              title="Interpolation"
              description="Interpolate between any values including colors, with support for custom output ranges."
              delay={0.4}
            />
            <FeatureCard
              icon={Package}
              title="React Hooks"
              description="useSpring, useSpringValue, useTrail, and more. Plus ready-to-use Animated components."
              delay={0.5}
            />
          </div>
        </div>
      </section>

      {/* Code Examples Section */}
      <section className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Simple API, Powerful Results
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Get started in seconds with an intuitive API that feels natural and familiar.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-orange-400" />
                <span className="text-sm font-medium text-white">Vanilla JavaScript</span>
              </div>
              <CodeBlock code={basicExample} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-sm font-medium text-white">React Hooks</span>
              </div>
              <CodeBlock code={reactExample} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass rounded-3xl p-12 text-center relative overflow-hidden"
          >
            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-b from-orange-500/20 to-transparent blur-3xl" />

            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Add Spring to Your UI?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                Start building beautiful, physics-based animations today.
                Check out the documentation to learn more.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/docs/getting-started">
                  <Button size="lg" className="gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0">
                    Read the Docs
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/examples">
                  <Button size="lg" variant="outline" className="gap-2 border-white/10 hover:bg-white/5">
                    View Examples
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white">SpringKit</span>
          </div>
          <p className="text-sm text-muted-foreground">
            MIT License &bull; Created by Ersin KOC
          </p>
          <div className="flex items-center gap-4">
            <a href="https://github.com/ersinkoc/springkit" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-white transition-colors">
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
