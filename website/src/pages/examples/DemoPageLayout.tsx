import { useState, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Code, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'

interface DemoPageLayoutProps {
  title: string
  description: string
  category: string
  categoryPath: string
  children: ReactNode
  code: string
}

export function DemoPageLayout({
  title,
  description,
  category,
  categoryPath,
  children,
  code,
}: DemoPageLayoutProps) {
  const [copied, setCopied] = useState(false)
  const [showFullCode, setShowFullCode] = useState(false)

  const copyCode = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Truncate code for preview
  const codeLines = code.split('\n')
  const previewCode = codeLines.slice(0, 30).join('\n')
  const hasMoreCode = codeLines.length > 30

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-white/40 mb-6">
          <Link to="/examples" className="hover:text-white transition-colors">
            Examples
          </Link>
          <span>/</span>
          <Link to={categoryPath} className="hover:text-white transition-colors">
            {category}
          </Link>
          <span>/</span>
          <span className="text-white/60">{title}</span>
        </div>

        {/* Back Link */}
        <Link
          to="/examples"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Examples
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
          <p className="text-white/50 text-lg">{description}</p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Demo Area */}
          <div className="order-1">
            <div className="sticky top-24">
              <h2 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-4">
                Live Demo
              </h2>
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
                {children}
              </div>
            </div>
          </div>

          {/* Code Area */}
          <div className="order-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-white/60 uppercase tracking-wider">
                Source Code
              </h2>
              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Code
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
              {/* Code Header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/50 border-b border-slate-700">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <span className="text-sm font-medium text-slate-300">{title}.tsx</span>
                <span className="px-2 py-0.5 text-xs font-mono text-slate-400 bg-slate-700/50 rounded">
                  tsx
                </span>
              </div>

              {/* Code Content */}
              <div className="overflow-auto max-h-[600px]">
                <pre className="p-4 text-sm leading-relaxed">
                  <code className="text-slate-300 font-mono whitespace-pre">
                    {showFullCode ? code : previewCode}
                    {hasMoreCode && !showFullCode && '\n\n// ... more code below'}
                  </code>
                </pre>
              </div>

              {/* Show More/Less Button */}
              {hasMoreCode && (
                <div className="border-t border-slate-700">
                  <button
                    onClick={() => setShowFullCode(!showFullCode)}
                    className="w-full py-3 text-sm text-slate-400 hover:text-white flex items-center justify-center gap-2 transition-colors"
                  >
                    {showFullCode ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        Show Full Code ({codeLines.length} lines)
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
