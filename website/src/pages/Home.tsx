import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Play, Code, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SpringDemo } from '@/components/demos/SpringDemo'

export function Home() {
  return (
    <div className="container max-w-6xl py-12 px-4">
      {/* Hero */}
      <div className="text-center space-y-6 py-20">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 10 }}
          className="inline-block"
        >
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 mx-auto mb-6">
            <div className="w-12 h-12 rounded-full bg-primary animate-pulse" />
          </div>
        </motion.div>

        <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
          SpringKit
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
          Physics-based spring animations with gesture support. Zero dependencies. Under 3KB.
        </p>

        <div className="flex items-center justify-center gap-4 pt-4">
          <Link to="/docs/getting-started">
            <Button size="lg" className="gap-2">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/examples">
            <Button size="lg" variant="outline" className="gap-2">
              <Play className="h-4 w-4" />
              Examples
            </Button>
          </Link>
        </div>

        <div className="pt-8 font-mono text-sm bg-muted rounded-lg p-4 inline-block">
          <code>npm install @oxog/springkit</code>
        </div>
      </div>

      {/* Demo */}
      <div className="py-20">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">See it in action</h2>
          <p className="text-muted-foreground">Click the box to see the spring animation</p>
        </div>
        <SpringDemo />
      </div>

      {/* Features */}
      <div className="py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Real Physics</CardTitle>
              <CardDescription>
                Based on actual spring physics equations with configurable stiffness, damping, and mass.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Code className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Zero Dependencies</CardTitle>
              <CardDescription>
                No runtime dependencies. Everything implemented from scratch for maximum control.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Play className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Gesture Support</CardTitle>
              <CardDescription>
                Built-in drag and scroll springs with rubber band physics and momentum.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Quick Start */}
      <div className="py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Quick Start</h2>
        <Card>
          <CardHeader>
            <CardTitle>Basic Spring Animation</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`import { spring, springPresets } from '@oxog/springkit'

const anim = spring(0, 100, {
  ...springPresets.bounce,
  onUpdate: (value) => {
    element.style.transform = \`translateX(\${value}px)\`
  },
})

anim.start()`}</code>
            </pre>
          </CardContent>
        </Card>
      </div>

      {/* React */}
      <div className="py-20">
        <h2 className="text-3xl font-bold text-center mb-12">React Integration</h2>
        <Card>
          <CardHeader>
            <CardTitle>useSpring Hook</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`import { useSpring } from '@oxog/springkit/react'

function Box() {
  const [isOpen, setIsOpen] = useState(false)
  const style = useSpring({
    scale: isOpen ? 1.2 : 1,
    opacity: isOpen ? 1 : 0.5,
  })

  return (
    <Animated.div
      onClick={() => setIsOpen(!isOpen)}
      style={{ transform: \`scale(\${style.scale})\` }}
    />
  )
}`}</code>
            </pre>
          </CardContent>
        </Card>
      </div>

      {/* CTA */}
      <div className="py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
        <p className="text-muted-foreground mb-8">
          Explore the documentation to learn more about all the features.
        </p>
        <Link to="/docs/getting-started">
          <Button size="lg" className="gap-2">
            Read the Docs <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
