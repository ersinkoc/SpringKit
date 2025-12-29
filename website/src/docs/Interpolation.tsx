import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function Interpolation() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-4">Interpolation</h1>
        <p className="text-xl text-muted-foreground">
          Map values to different ranges and interpolate between colors.
        </p>
      </div>

      <section>
        <h2 className="text-2xl font-bold mb-4">Value Interpolation</h2>
        <p className="text-muted-foreground mb-4">
          Map a spring value from one range to another:
        </p>
        <Card>
          <CardHeader>
            <CardTitle>Basic Interpolation</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg text-sm">
              <code>{`import { createSpringValue, interpolate } from '@oxog/springkit'

const x = createSpringValue(0)

// Map 0-100 to 0-1
const opacity = interpolate(x, [0, 100], [0, 1])

x.subscribe(() => {
  element.style.opacity = String(opacity.get())
})

x.set(100)  // opacity animates to 1`}</code>
            </pre>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Multi-Point Interpolation</h2>
        <p className="text-muted-foreground mb-4">
          Interpolate through multiple points:
        </p>
        <Card>
          <CardContent className="pt-6">
            <pre className="bg-muted p-4 rounded-lg text-sm">
              <code>{`const progress = createSpringValue(0)

// Scale: starts at 1, peaks at 1.5, returns to 1
const scale = interpolate(progress, [0, 50, 100], [1, 1.5, 1])

progress.subscribe(() => {
  element.style.transform = \`scale(\${scale.get()})\`
})`}</code>
            </pre>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Color Interpolation</h2>
        <p className="text-muted-foreground mb-4">
          Interpolate between colors:
        </p>
        <Card>
          <CardHeader>
            <CardTitle>Color Gradient</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg text-sm">
              <code>{`import { createSpringValue, interpolateColor } from '@oxog/springkit'

const progress = createSpringValue(0)

const color = interpolateColor(
  progress,
  [0, 50, 100],
  ['#ff0000', '#00ff00', '#0000ff']
)

progress.subscribe(() => {
  element.style.backgroundColor = color.get()
})

progress.set(50)  // color is '#00ff00'`}</code>
            </pre>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Extrapolation</h2>
        <p className="text-muted-foreground mb-4">
          Control how values behave outside the input range:
        </p>
        <Card>
          <CardContent className="pt-6">
            <pre className="bg-muted p-4 rounded-lg text-sm">
              <code>{`const value = createSpringValue(0)

const clamped = interpolate(
  value,
  [0, 100],
  [0, 200],
  { extrapolate: 'clamp' }  // Won't go outside output range
)

const identity = interpolate(
  value,
  [0, 100],
  [0, 200],
  { extrapolate: 'identity' }  // Returns input value outside range
)`}</code>
            </pre>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
