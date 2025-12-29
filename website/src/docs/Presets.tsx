import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function Presets() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-4">Spring Presets</h1>
        <p className="text-xl text-muted-foreground">
          Ready-to-use spring configurations for common animation styles.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <PresetCard
          name="default"
          config="{{ stiffness: 100, damping: 10 }}"
          description="Standard spring animation"
        />
        <PresetCard
          name="gentle"
          config="{{ stiffness: 120, damping: 14 }}"
          description="Softer, more forgiving animation"
        />
        <PresetCard
          name="wobbly"
          config="{{ stiffness: 180, damping: 12 }}"
          description="Extra bounce and oscillation"
        />
        <PresetCard
          name="stiff"
          config="{{ stiffness: 210, damping: 20 }}"
          description="Quick, snappy animation"
        />
        <PresetCard
          name="slow"
          config="{{ stiffness: 280, damping: 60 }}"
          description="Slower, smooth animation"
        />
        <PresetCard
          name="molasses"
          config="{{ stiffness: 280, damping: 120 }}"
          description="Very slow, heavily damped"
        />
        <PresetCard
          name="bounce"
          config="{{ stiffness: 200, damping: 8 }}"
          description="Bouncy with overshoot"
        />
        <PresetCard
          name="noWobble"
          config="{{ stiffness: 170, damping: 26 }}"
          description="No oscillation, smooth decay"
        />
      </div>

      <section>
        <h2 className="text-2xl font-bold mb-4">Usage</h2>
        <Card>
          <CardHeader>
            <CardTitle>Using Presets</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg text-sm">
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
      </section>
    </div>
  )
}

function PresetCard({ name, config, description }: { name: string; config: string; description: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="capitalize">{name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <pre className="bg-muted p-2 rounded text-xs">
          <code>{config}</code>
        </pre>
      </CardContent>
    </Card>
  )
}
