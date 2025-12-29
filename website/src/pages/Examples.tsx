import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SpringDemo } from '@/components/demos/SpringDemo'

export function Examples() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-4">Examples</h1>
        <p className="text-xl text-muted-foreground">
          Interactive examples demonstrating SpringKit features.
        </p>
      </div>

      <section>
        <h2 className="text-2xl font-bold mb-4">Basic Spring</h2>
        <Card>
          <CardHeader>
            <CardTitle>Click to Animate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
              <SpringDemo />
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">More Examples</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Card Animations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Hover and click interactions on cards with spring physics.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Drag & Drop</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Draggable elements with rubber band physics.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Page Transitions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Smooth page transitions with coordinated animations.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>List Animations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Animate list items with stagger and trail effects.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Code Examples</h2>
        <Card>
          <CardHeader>
            <CardTitle>Simple Card Hover</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg text-sm">
              <code>{`function Card() {
  const [isHovered, setIsHovered] = useState(false)
  const style = useSpring({
    scale: isHovered ? 1.05 : 1,
    shadow: isHovered ? 20 : 0,
  })

  return (
    <Animated.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: \`scale(\${style.scale})\`,
        boxShadow: style.shadow > 0 ? '0 10px 40px rgba(0,0,0,0.2)' : 'none',
      }}
      className="rounded-xl p-6 bg-white"
    >
      Card content
    </Animated.div>
  )
}`}</code>
            </pre>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
