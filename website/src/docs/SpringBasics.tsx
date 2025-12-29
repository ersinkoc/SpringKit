import { Routes, Route, Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'

export function SpringBasics() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-4">Spring Basics</h1>
        <p className="text-xl text-muted-foreground">
          Learn the fundamentals of spring animations in SpringKit.
        </p>
      </div>

      <Routes>
        <Route path="/" element={<SpringBasicsIndex />} />
        <Route path="/function" element={<SpringFunction />} />
        <Route path="/values" element={<SpringValues />} />
        <Route path="/groups" element={<SpringGroups />} />
        <Route path="/config" element={<SpringConfig />} />
      </Routes>
    </div>
  )
}

function SpringBasicsIndex() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Link to="/docs/spring/function">
        <Card className="hover:border-primary transition-colors cursor-pointer h-full">
          <CardContent className="pt-6">
            <h3 className="text-xl font-bold mb-2">Spring Function</h3>
            <p className="text-muted-foreground">
              The spring() function creates a one-time animation between two values.
            </p>
          </CardContent>
        </Card>
      </Link>

      <Link to="/docs/spring/values">
        <Card className="hover:border-primary transition-colors cursor-pointer h-full">
          <CardContent className="pt-6">
            <h3 className="text-xl font-bold mb-2">Spring Values</h3>
            <p className="text-muted-foreground">
              SpringValue allows you to animate values that can be updated over time.
            </p>
          </CardContent>
        </Card>
      </Link>

      <Link to="/docs/spring/groups">
        <Card className="hover:border-primary transition-colors cursor-pointer h-full">
          <CardContent className="pt-6">
            <h3 className="text-xl font-bold mb-2">Spring Groups</h3>
            <p className="text-muted-foreground">
              Animate multiple values together with SpringGroup.
            </p>
          </CardContent>
        </Card>
      </Link>

      <Link to="/docs/spring/config">
        <Card className="hover:border-primary transition-colors cursor-pointer h-full">
          <CardContent className="pt-6">
            <h3 className="text-xl font-bold mb-2">Configuration</h3>
            <p className="text-muted-foreground">
              Customize spring behavior with stiffness, damping, mass, and more.
            </p>
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}

function SpringFunction() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Spring Function</h2>
      <p className="text-muted-foreground">
        The <code>spring()</code> function creates a one-time animation from a starting value to a target value.
      </p>

      <Card>
        <CardContent className="pt-6">
          <pre className="bg-muted p-4 rounded-lg text-sm">
            <code>{`import { spring } from '@oxog/springkit'

const anim = spring(from, to, {
  onUpdate: (value) => {
    // Called on each frame
  },
  onComplete: () => {
    // Called when animation finishes
  }
})

anim.start()`}</code>
          </pre>
        </CardContent>
      </Card>

      <h3 className="text-xl font-bold">Parameters</h3>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground">
        <li><code>from</code> - Starting value (number)</li>
        <li><code>to</code> - Target value (number)</li>
        <li><code>config</code> - Optional configuration object</li>
      </ul>
    </div>
  )
}

function SpringValues() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Spring Values</h2>
      <p className="text-muted-foreground">
        SpringValue is useful for values that change over time, like user-driven animations.
      </p>

      <Card>
        <CardContent className="pt-6">
          <pre className="bg-muted p-4 rounded-lg text-sm">
            <code>{`import { createSpringValue } from '@oxog/springkit'

const x = createSpringValue(0, { stiffness: 100, damping: 10 })

x.subscribe((value) => {
  element.style.transform = \`translateX(\${value}px)\`
})

x.set(100)  // Animate to 100
x.jump(50)  // Jump immediately to 50`}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}

function SpringGroups() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Spring Groups</h2>
      <p className="text-muted-foreground">
        SpringGroup allows you to animate multiple values together with a single configuration.
      </p>

      <Card>
        <CardContent className="pt-6">
          <pre className="bg-muted p-4 rounded-lg text-sm">
            <code>{`import { createSpringGroup } from '@oxog/springkit'

const group = createSpringGroup({
  x: 0,
  y: 0,
  scale: 1,
}, { stiffness: 100, damping: 10 })

group.subscribe((values) => {
  element.style.transform = \`
    translate(\${values.x}px, \${values.y}px)
    scale(\${values.scale})
  \`
})

group.set({ x: 100, y: 50, scale: 1.2 })`}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}

function SpringConfig() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Configuration</h2>
      <p className="text-muted-foreground">
        Customize spring behavior with these configuration options.
      </p>

      <Card>
        <CardContent className="pt-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Property</th>
                <th className="text-left py-2">Default</th>
                <th className="text-left py-2">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 font-mono">stiffness</td>
                <td className="py-2">100</td>
                <td className="py-2">Spring stiffness constant</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 font-mono">damping</td>
                <td className="py-2">10</td>
                <td className="py-2">Damping coefficient</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 font-mono">mass</td>
                <td className="py-2">1</td>
                <td className="py-2">Spring mass</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 font-mono">velocity</td>
                <td className="py-2">0</td>
                <td className="py-2">Initial velocity</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 font-mono">restSpeed</td>
                <td className="py-2">0.01</td>
                <td className="py-2">Speed threshold for rest</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 font-mono">restDelta</td>
                <td className="py-2">0.01</td>
                <td className="py-2">Position threshold for rest</td>
              </tr>
              <tr>
                <td className="py-2 font-mono">clamp</td>
                <td className="py-2">false</td>
                <td className="py-2">Clamp value to range</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
