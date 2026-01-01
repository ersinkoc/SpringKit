import { useState } from 'react'
import { Check, Copy, Code, X } from 'lucide-react'

interface CodeViewerProps {
  code: string
  title?: string
  language?: string
}

export function CodeViewer({ code, title, language = 'tsx' }: CodeViewerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors"
      >
        <Code className="w-3.5 h-3.5" />
        View Code
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl max-h-[80vh] bg-slate-900 rounded-xl border border-slate-700 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <span className="text-sm font-medium text-slate-300">
                  {title || 'Example Code'}
                </span>
                <span className="px-2 py-0.5 text-xs font-mono text-slate-400 bg-slate-700/50 rounded">
                  {language}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </>
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Code */}
            <div className="overflow-auto max-h-[calc(80vh-60px)]">
              <pre className="p-4 text-sm leading-relaxed">
                <code className="text-slate-300 font-mono whitespace-pre">
                  {code}
                </code>
              </pre>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

interface DemoCardProps {
  title: string
  description: string
  icon?: React.ReactNode
  code: string
  children: React.ReactNode
}

export function DemoCard({ title, description, icon, code, children }: DemoCardProps) {
  return (
    <div className="group relative bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden hover:border-slate-600/50 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg text-blue-400">
              {icon}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-white">{title}</h3>
            <p className="text-sm text-slate-400">{description}</p>
          </div>
        </div>
        <CodeViewer code={code} title={title} />
      </div>

      {/* Demo Area */}
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}
