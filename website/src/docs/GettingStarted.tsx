import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Highlight, themes } from 'prism-react-renderer'
import { Copy, Check, Terminal, Sparkles, Zap, BookOpen } from 'lucide-react'
import { useState } from 'react'

function CodeBlock({ code, language = 'typescript' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group">
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
        aria-label="Copy code"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-400" />
        ) : (
          <Copy className="w-4 h-4 text-white/60" />
        )}
      </button>
      <Highlight theme={themes.nightOwl} code={code.trim()} language={language}>
        {({ style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className="p-4 rounded-xl overflow-x-auto text-sm leading-relaxed"
            style={{ ...style, background: 'rgba(0,0,0,0.3)' }}
          >
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

export function GettingStarted() {
  return (
    <div className="min-h-screen py-12 px-4 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Getting Started</h1>
              <p className="text-muted-foreground">Get up and running with SpringKit in minutes</p>
            </div>
          </div>
        </div>

        {/* Installation */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Terminal className="w-5 h-5 text-orange-400" />
            <h2 className="text-2xl font-bold text-white">Installation</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-orange-300">npm</CardTitle>
              </CardHeader>
              <CardContent>
                <CodeBlock code="npm install @oxog/springkit" language="bash" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-orange-300">yarn</CardTitle>
              </CardHeader>
              <CardContent>
                <CodeBlock code="yarn add @oxog/springkit" language="bash" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-orange-300">pnpm</CardTitle>
              </CardHeader>
              <CardContent>
                <CodeBlock code="pnpm add @oxog/springkit" language="bash" />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Basic Usage */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-orange-400" />
            <h2 className="text-2xl font-bold text-white">Basic Usage</h2>
          </div>

          <p className="text-muted-foreground text-lg">
            Import the spring function and create your first physics-based animation:
          </p>

          <Card>
            <CardContent className="pt-6">
              <CodeBlock code={`import { spring } from '@oxog/springkit'

const anim = spring(0, 100, {
  onUpdate: (value) => {
    element.style.transform = \`translateX(\${value}px)\`
  },
})

anim.start()`} />
            </CardContent>
          </Card>
        </section>

        {/* Using Presets */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-orange-400" />
            <h2 className="text-2xl font-bold text-white">Using Presets</h2>
          </div>

          <p className="text-muted-foreground text-lg">
            SpringKit comes with 8 built-in presets for common animation styles:
          </p>

          <Card>
            <CardContent className="pt-6">
              <CodeBlock code={`import { spring, springPresets } from '@oxog/springkit'

const anim = spring(0, 100, {
  ...springPresets.bounce,  // or gentle, wobbly, stiff, etc.
  onUpdate: (value) => {
    element.style.transform = \`translateX(\${value}px)\`
  },
})

anim.start()`} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['default', 'gentle', 'wobbly', 'stiff', 'slow', 'molasses', 'bounce', 'noWobble'].map((preset) => (
              <div
                key={preset}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-center text-sm font-mono text-orange-300"
              >
                {preset}
              </div>
            ))}
          </div>
        </section>

        {/* With React */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-[#61dafb] flex items-center justify-center">
              <span className="text-xs font-bold text-black">⚛</span>
            </div>
            <h2 className="text-2xl font-bold text-white">With React</h2>
          </div>

          <p className="text-muted-foreground text-lg">
            For React projects, import from the React adapter:
          </p>

          <Card>
            <CardContent className="pt-6">
              <CodeBlock code={`import { useSpring, Animated } from '@oxog/springkit/react'

function Box() {
  const [isOpen, setIsOpen] = useState(false)
  const style = useSpring({
    scale: isOpen ? 1.2 : 1,
  })

  return (
    <Animated.div
      onClick={() => setIsOpen(!isOpen)}
      style={{ transform: \`scale(\${style.scale})\` }}
    />
  )
}`} />
            </CardContent>
          </Card>
        </section>

        {/* What's Next */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-white">What's Next?</h2>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              { title: 'Spring Configuration', href: '/docs/spring/function', desc: 'Learn about stiffness, damping, and mass' },
              { title: 'Available Presets', href: '/docs/presets', desc: 'Explore all 8 built-in animation presets' },
              { title: 'Gesture Support', href: '/docs/gestures/drag', desc: 'Add drag and scroll interactions' },
              { title: 'Live Examples', href: '/examples', desc: 'See SpringKit in action' },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="group p-6 rounded-xl border border-white/10 bg-white/[0.02] hover:border-orange-500/30 hover:bg-orange-500/5 transition-all duration-300"
              >
                <h3 className="font-semibold text-white group-hover:text-orange-300 transition-colors mb-2">
                  {link.title} →
                </h3>
                <p className="text-sm text-muted-foreground">{link.desc}</p>
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
