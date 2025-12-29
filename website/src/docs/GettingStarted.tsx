import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function GettingStarted() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-4">Getting Started</h1>
        <p className="text-xl text-muted-foreground">
          Learn how to install and use SpringKit in your project.
        </p>
      </div>

      <section>
        <h2 className="text-2xl font-bold mb-4">Installation</h2>
        <Card>
          <CardHeader>
            <CardTitle>npm</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg text-sm">
              <code>npm install @oxog/springkit</code>
            </pre>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>yarn</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg text-sm">
              <code>yarn add @oxog/springkit</code>
            </pre>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>pnpm</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg text-sm">
              <code>pnpm add @oxog/springkit</code>
            </pre>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Basic Usage</h2>
        <p className="text-muted-foreground mb-4">
          Import the spring function and create your first animation:
        </p>
        <Card>
          <CardContent className="pt-6">
            <pre className="bg-muted p-4 rounded-lg text-sm">
              <code>{`import { spring } from '@oxog/springkit'

const anim = spring(0, 100, {
  onUpdate: (value) => {
    element.style.transform = \`translateX(\${value}px)\`
  },
})

anim.start()`}</code>
            </pre>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Using Presets</h2>
        <p className="text-muted-foreground mb-4">
          SpringKit comes with 8 built-in presets for common animation styles:
        </p>
        <Card>
          <CardContent className="pt-6">
            <pre className="bg-muted p-4 rounded-lg text-sm">
              <code>{`import { spring, springPresets } from '@oxog/springkit'

const anim = spring(0, 100, {
  ...springPresets.bounce,  // or gentle, wobbly, stiff, etc.
  onUpdate: (value) => {
    element.style.transform = \`translateX(\${value}px)\`
  },
})

anim.start()`}</code>
            </pre>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">With React</h2>
        <p className="text-muted-foreground mb-4">
          For React projects, import from the React adapter:
        </p>
        <Card>
          <CardContent className="pt-6">
            <pre className="bg-muted p-4 rounded-lg text-sm">
              <code>{`import { useSpring, Animated } from '@oxog/springkit/react'

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
}`}</code>
            </pre>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">What's Next?</h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>Learn about <a href="/docs/spring/function" className="text-primary hover:underline">spring configuration</a></li>
          <li>Explore <a href="/docs/presets" className="text-primary hover:underline">all available presets</a></li>
          <li>Check out <a href="/docs/gestures/drag" className="text-primary hover:underline">gesture support</a></li>
          <li>See <a href="/examples" className="text-primary hover:underline">live examples</a></li>
        </ul>
      </section>
    </div>
  )
}
