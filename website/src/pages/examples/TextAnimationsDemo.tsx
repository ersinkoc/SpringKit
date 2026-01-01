import { useState } from 'react'
import { Play, RotateCcw, Type, Hash } from 'lucide-react'
import { SpringText, SpringNumber, TypeWriter } from '@oxog/springkit/react'
import { DemoPageLayout } from './DemoPageLayout'

const CODE = `import { useState } from 'react'
import { SpringText, SpringNumber, TypeWriter } from '@oxog/springkit/react'

// SpringText - Animated text with stagger
function SpringTextDemo() {
  const [key, setKey] = useState(0)

  return (
    <div>
      <SpringText
        key={key}
        mode="characters"      // 'characters' | 'words' | 'lines'
        stagger={30}           // Delay between elements (ms)
        from="bottom"          // 'left' | 'right' | 'top' | 'bottom' | 'center'
        config={{ stiffness: 200, damping: 20 }}
      >
        Hello SpringKit!
      </SpringText>

      <button onClick={() => setKey(k => k + 1)}>
        Replay
      </button>
    </div>
  )
}

// SpringNumber - Animated number counter
function SpringNumberDemo() {
  const [value, setValue] = useState(0)

  return (
    <div>
      <SpringNumber
        value={value}
        decimals={0}
        config={{ stiffness: 100, damping: 20 }}
        prefix="$"
        suffix=" USD"
      />

      <button onClick={() => setValue(v => v + 1000)}>
        Add $1000
      </button>
    </div>
  )
}

// TypeWriter - Classic typewriter effect
function TypeWriterDemo() {
  return (
    <TypeWriter
      speed={50}              // ms per character
      delay={500}             // Initial delay
      cursor                  // Show blinking cursor
      cursorChar="|"          // Cursor character
      loop                    // Loop the animation
      pauseAtEnd={2000}       // Pause before delete (ms)
    >
      Welcome to SpringKit!
    </TypeWriter>
  )
}`

function SpringTextSection() {
  const [key, setKey] = useState(0)
  const [mode, setMode] = useState<'characters' | 'words'>('characters')
  const [from, setFrom] = useState<'bottom' | 'top' | 'left' | 'right' | 'center'>('bottom')

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-rose-500/20 rounded-lg">
          <Type className="w-5 h-5 text-rose-400" />
        </div>
        <div>
          <h3 className="font-medium text-white">SpringText</h3>
          <p className="text-xs text-white/40">Staggered character/word animations</p>
        </div>
      </div>

      <div className="bg-black/30 rounded-xl p-8 min-h-[100px] flex items-center justify-center">
        <SpringText
          key={key}
          mode={mode}
          stagger={mode === 'characters' ? 30 : 80}
          from={from}
          config={{ stiffness: 200, damping: 18 }}
          className="text-2xl font-bold text-white"
        >
          Hello SpringKit!
        </SpringText>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-white/40 mb-1.5">Mode</p>
          <div className="flex gap-1">
            {(['characters', 'words'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-1.5 rounded-lg text-xs capitalize ${
                  mode === m
                    ? 'bg-rose-500/30 text-rose-300'
                    : 'bg-white/5 text-white/60'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-white/40 mb-1.5">Direction</p>
          <div className="flex gap-1">
            {(['bottom', 'top', 'left', 'center'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setFrom(d)}
                className={`flex-1 py-1.5 rounded-lg text-xs capitalize ${
                  from === d
                    ? 'bg-rose-500/30 text-rose-300'
                    : 'bg-white/5 text-white/60'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={() => setKey((k) => k + 1)}
        className="w-full py-2 bg-rose-500/20 text-rose-400 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
      >
        <RotateCcw className="w-4 h-4" />
        Replay Animation
      </button>
    </div>
  )
}

function SpringNumberSection() {
  const [value, setValue] = useState(1234)

  const presets = [
    { label: '+100', action: () => setValue((v) => v + 100) },
    { label: '+1000', action: () => setValue((v) => v + 1000) },
    { label: '-500', action: () => setValue((v) => Math.max(0, v - 500)) },
    { label: 'Random', action: () => setValue(Math.floor(Math.random() * 10000)) },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-500/20 rounded-lg">
          <Hash className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h3 className="font-medium text-white">SpringNumber</h3>
          <p className="text-xs text-white/40">Animated number counter</p>
        </div>
      </div>

      <div className="bg-black/30 rounded-xl p-8 flex flex-col items-center justify-center gap-4">
        <SpringNumber
          value={value}
          className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500"
          config={{ stiffness: 80, damping: 15 }}
        />

        <div className="flex gap-2">
          <span className="text-white/40 text-sm">With prefix:</span>
          <SpringNumber
            value={value}
            prefix="$"
            suffix=" USD"
            decimals={2}
            format={(v) => v.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            className="text-lg font-medium text-amber-400"
            config={{ stiffness: 80, damping: 15 }}
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {presets.map((preset) => (
          <button
            key={preset.label}
            onClick={preset.action}
            className="py-2 bg-amber-500/20 text-amber-400 rounded-lg text-sm font-medium hover:bg-amber-500/30 transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function TypeWriterSection() {
  const [key, setKey] = useState(0)
  const [showCursor, setShowCursor] = useState(true)

  const messages = [
    'Welcome to SpringKit!',
    'Build amazing animations.',
    'Physics-based motion.',
    'Simple and powerful.',
  ]

  const [messageIndex, setMessageIndex] = useState(0)

  const nextMessage = () => {
    setMessageIndex((i) => (i + 1) % messages.length)
    setKey((k) => k + 1)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-cyan-500/20 rounded-lg">
          <Type className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h3 className="font-medium text-white">TypeWriter</h3>
          <p className="text-xs text-white/40">Classic typewriter effect</p>
        </div>
      </div>

      <div className="bg-black/30 rounded-xl p-8 min-h-[80px] flex items-center justify-center">
        <TypeWriter
          key={key}
          speed={60}
          cursor={showCursor}
          cursorChar="|"
          className="text-xl font-mono text-cyan-400"
        >
          {messages[messageIndex]}
        </TypeWriter>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setShowCursor(!showCursor)}
          className={`flex-1 py-2 rounded-lg text-sm ${
            showCursor
              ? 'bg-cyan-500/30 text-cyan-300'
              : 'bg-white/5 text-white/60'
          }`}
        >
          {showCursor ? 'Cursor On' : 'Cursor Off'}
        </button>
        <button
          onClick={nextMessage}
          className="flex-1 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4" />
          Next Message
        </button>
      </div>
    </div>
  )
}

function TextAnimationsDemo() {
  return (
    <div className="space-y-8">
      <SpringTextSection />
      <div className="h-px bg-white/10" />
      <SpringNumberSection />
      <div className="h-px bg-white/10" />
      <TypeWriterSection />
    </div>
  )
}

export default function TextAnimationsDemoPage() {
  return (
    <DemoPageLayout
      title="Text Animations"
      description="Specialized components for text animations: staggered reveals, animated counters, and typewriter effects."
      category="Components"
      categoryPath="/examples"
      code={CODE}
    >
      <TextAnimationsDemo />
    </DemoPageLayout>
  )
}
