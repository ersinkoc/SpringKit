import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

interface DocLayoutProps {
  title: string
  description: string
  icon?: LucideIcon
  children: ReactNode
}

export function DocLayout({ title, description, icon: Icon, children }: DocLayoutProps) {
  return (
    <div className="min-h-screen py-12 px-4 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-6">
            {Icon && (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                <Icon className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-4xl font-bold text-white">{title}</h1>
              <p className="text-muted-foreground">{description}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  )
}

interface DocSectionProps {
  title: string
  icon?: LucideIcon
  children: ReactNode
}

export function DocSection({ title, icon: Icon, children }: DocSectionProps) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        {Icon && <Icon className="w-5 h-5 text-orange-400" />}
        <h2 className="text-2xl font-bold text-white">{title}</h2>
      </div>
      {children}
    </section>
  )
}
