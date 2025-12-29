import { Routes, Route, Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { DocLayout, DocSection, CodeBlock, InlineCode } from '@/components/docs'
import { Atom, Zap, Layers, Settings } from 'lucide-react'

export function SpringBasics() {
  return (
    <Routes>
      <Route path="/" element={<SpringBasicsIndex />} />
      <Route path="/function" element={<SpringFunction />} />
      <Route path="/values" element={<SpringValues />} />
      <Route path="/groups" element={<SpringGroups />} />
      <Route path="/config" element={<SpringConfig />} />
    </Routes>
  )
}

function SpringBasicsIndex() {
  const topics = [
    {
      title: 'Spring Function',
      href: '/docs/spring/function',
      desc: 'The spring() function creates a one-time animation between two values.',
      icon: Zap,
    },
    {
      title: 'Spring Values',
      href: '/docs/spring/values',
      desc: 'SpringValue allows you to animate values that can be updated over time.',
      icon: Atom,
    },
    {
      title: 'Spring Groups',
      href: '/docs/spring/groups',
      desc: 'Animate multiple values together with SpringGroup.',
      icon: Layers,
    },
    {
      title: 'Configuration',
      href: '/docs/spring/config',
      desc: 'Customize spring behavior with stiffness, damping, mass, and more.',
      icon: Settings,
    },
  ]

  return (
    <DocLayout
      title="Spring Basics"
      description="Learn the fundamentals of spring animations in SpringKit"
      icon={Atom}
    >
      <div className="grid md:grid-cols-2 gap-6">
        {topics.map((topic) => (
          <Link key={topic.href} to={topic.href}>
            <Card className="h-full group cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                    <topic.icon className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-white group-hover:text-orange-300 transition-colors">
                      {topic.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">{topic.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </DocLayout>
  )
}

function SpringFunction() {
  return (
    <DocLayout
      title="Spring Function"
      description="Create one-time animations from a starting value to a target value"
      icon={Zap}
    >
      <DocSection title="Basic Usage">
        <p className="text-muted-foreground text-lg mb-4">
          The <InlineCode>spring()</InlineCode> function creates a one-time animation from a starting value to a target value.
        </p>

        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { spring } from '@oxog/springkit'

const anim = spring(from, to, {
  onUpdate: (value) => {
    // Called on each frame
  },
  onComplete: () => {
    // Called when animation finishes
  }
})

anim.start()`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Parameters">
        <div className="space-y-3">
          {[
            { name: 'from', type: 'number', desc: 'Starting value' },
            { name: 'to', type: 'number', desc: 'Target value' },
            { name: 'config', type: 'SpringConfig', desc: 'Optional configuration object' },
          ].map((param) => (
            <div key={param.name} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <code className="text-orange-300 font-mono">{param.name}</code>
              <span className="text-white/40">:</span>
              <code className="text-purple-300 font-mono">{param.type}</code>
              <span className="text-muted-foreground ml-auto">{param.desc}</span>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="Example">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`// Animate element from 0 to 100px
const anim = spring(0, 100, {
  stiffness: 200,
  damping: 20,
  onUpdate: (value) => {
    element.style.transform = \`translateX(\${value}px)\`
  },
  onComplete: () => {
    console.log('Animation complete!')
  }
})

anim.start()`} />
          </CardContent>
        </Card>
      </DocSection>
    </DocLayout>
  )
}

function SpringValues() {
  return (
    <DocLayout
      title="Spring Values"
      description="Animate values that can be updated over time"
      icon={Atom}
    >
      <DocSection title="Overview">
        <p className="text-muted-foreground text-lg mb-4">
          SpringValue is useful for values that change over time, like user-driven animations.
        </p>

        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { createSpringValue } from '@oxog/springkit'

const x = createSpringValue(0, { stiffness: 100, damping: 10 })

x.subscribe((value) => {
  element.style.transform = \`translateX(\${value}px)\`
})

x.set(100)  // Animate to 100
x.jump(50)  // Jump immediately to 50`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Methods">
        <div className="grid gap-3">
          {[
            { method: 'get()', desc: 'Get current value' },
            { method: 'getVelocity()', desc: 'Get current velocity' },
            { method: 'set(to, config?)', desc: 'Animate to value' },
            { method: 'jump(to)', desc: 'Set value immediately without animation' },
            { method: 'subscribe(callback)', desc: 'Listen to value changes' },
            { method: 'isAnimating()', desc: 'Check if currently animating' },
            { method: 'finished', desc: 'Promise that resolves on completion' },
            { method: 'destroy()', desc: 'Clean up resources' },
          ].map((item) => (
            <div key={item.method} className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10">
              <code className="text-orange-300 font-mono text-sm">{item.method}</code>
              <span className="text-muted-foreground text-sm">{item.desc}</span>
            </div>
          ))}
        </div>
      </DocSection>
    </DocLayout>
  )
}

function SpringGroups() {
  return (
    <DocLayout
      title="Spring Groups"
      description="Animate multiple values together with a single configuration"
      icon={Layers}
    >
      <DocSection title="Overview">
        <p className="text-muted-foreground text-lg mb-4">
          SpringGroup allows you to animate multiple values together with a single configuration.
        </p>

        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { createSpringGroup } from '@oxog/springkit'

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

group.set({ x: 100, y: 50, scale: 1.2 })`} />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Methods">
        <div className="grid gap-3">
          {[
            { method: 'get()', desc: 'Get all current values' },
            { method: 'getValue(key)', desc: 'Get a single value by key' },
            { method: 'set(values, config?)', desc: 'Animate to new values' },
            { method: 'jump(values)', desc: 'Set values immediately' },
            { method: 'subscribe(callback)', desc: 'Listen to all value changes' },
            { method: 'isAnimating()', desc: 'Check if any value is animating' },
            { method: 'finished', desc: 'Promise that resolves when all complete' },
            { method: 'destroy()', desc: 'Clean up all resources' },
          ].map((item) => (
            <div key={item.method} className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10">
              <code className="text-orange-300 font-mono text-sm">{item.method}</code>
              <span className="text-muted-foreground text-sm">{item.desc}</span>
            </div>
          ))}
        </div>
      </DocSection>
    </DocLayout>
  )
}

function SpringConfig() {
  return (
    <DocLayout
      title="Configuration"
      description="Customize spring behavior with these configuration options"
      icon={Settings}
    >
      <DocSection title="Configuration Options">
        <Card>
          <CardContent className="pt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 text-orange-300 font-mono">Property</th>
                  <th className="text-left py-3 text-white/60">Default</th>
                  <th className="text-left py-3 text-white/60">Description</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                {[
                  { prop: 'stiffness', default: '100', desc: 'Spring stiffness constant' },
                  { prop: 'damping', default: '10', desc: 'Damping coefficient' },
                  { prop: 'mass', default: '1', desc: 'Spring mass' },
                  { prop: 'velocity', default: '0', desc: 'Initial velocity' },
                  { prop: 'restSpeed', default: '0.01', desc: 'Speed threshold for rest' },
                  { prop: 'restDelta', default: '0.01', desc: 'Position threshold for rest' },
                  { prop: 'clamp', default: 'false', desc: 'Clamp value to range' },
                ].map((row) => (
                  <tr key={row.prop} className="border-b border-white/5">
                    <td className="py-3 font-mono text-white">{row.prop}</td>
                    <td className="py-3 text-purple-300">{row.default}</td>
                    <td className="py-3">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </DocSection>

      <DocSection title="Example">
        <Card>
          <CardContent className="pt-6">
            <CodeBlock code={`import { spring } from '@oxog/springkit'

const anim = spring(0, 100, {
  stiffness: 200,   // Higher = faster
  damping: 15,      // Higher = less bounce
  mass: 1,          // Higher = more inertia
  velocity: 0,      // Starting velocity
  restSpeed: 0.01,  // When to stop
  restDelta: 0.01,  // Position tolerance
  clamp: false,     // Allow overshoot

  onUpdate: (value) => {
    console.log('Current:', value)
  },
  onComplete: () => {
    console.log('Done!')
  }
})`} />
          </CardContent>
        </Card>
      </DocSection>
    </DocLayout>
  )
}
