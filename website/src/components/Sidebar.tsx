import { Link, useLocation } from 'react-router-dom'
import { useRef } from 'react'
import { ScrollArea } from './ui/scroll-area'
import { cn } from '@/lib/utils'

interface NavItem {
  title: string
  href?: string
  children?: NavItem[]
}

const navItems: NavItem[] = [
  {
    title: 'Getting Started',
    href: '/docs/getting-started',
  },
  {
    title: 'Migrating to 2.0',
    href: '/docs/migration',
  },
  {
    title: 'Spring Basics',
    children: [
      { title: 'Spring Function', href: '/docs/spring/function' },
      { title: 'Spring Values', href: '/docs/spring/values' },
      { title: 'Spring Groups', href: '/docs/spring/groups' },
      { title: 'Configuration', href: '/docs/spring/config' },
    ],
  },
  {
    title: 'Presets',
    href: '/docs/presets',
  },
  {
    title: 'Interpolation',
    href: '/docs/interpolation',
  },
  {
    title: 'Gestures',
    children: [
      { title: 'Drag Spring', href: '/docs/gestures/drag' },
      { title: 'Scroll Spring', href: '/docs/gestures/scroll' },
    ],
  },
  {
    title: 'Orchestration',
    children: [
      { title: 'Sequence & Parallel', href: '/docs/orchestration/sequence' },
      { title: 'Stagger', href: '/docs/orchestration/stagger' },
      { title: 'Trail', href: '/docs/orchestration/trail' },
      { title: 'Decay', href: '/docs/orchestration/decay' },
    ],
  },
  {
    title: 'Advanced Features',
    children: [
      { title: 'Native Springs', href: '/docs/advanced/native-springs' },
      { title: 'Testing Animations', href: '/docs/advanced/testing' },
      { title: 'Slow Motion', href: '/docs/advanced/time-scale' },
      { title: 'Variants System', href: '/docs/advanced/variants' },
      { title: 'Timeline API', href: '/docs/advanced/timeline' },
      { title: 'SVG Morphing', href: '/docs/advanced/morph' },
      { title: 'Scroll-Linked', href: '/docs/advanced/scroll-linked' },
      { title: 'FLIP Layout', href: '/docs/advanced/flip' },
      { title: 'Stagger Patterns', href: '/docs/advanced/stagger-patterns' },
    ],
  },
  {
    title: 'API Reference',
    children: [
      { title: 'spring()', href: '/docs/api/spring' },
      { title: 'createSpringValue()', href: '/docs/api/spring-value' },
      { title: 'createSpringGroup()', href: '/docs/api/spring-group' },
      { title: 'interpolate()', href: '/docs/api/interpolate' },
      { title: 'Types', href: '/docs/api/types' },
    ],
  },
  {
    title: 'React Guide',
    children: [
      { title: 'Hooks', href: '/docs/react/hooks' },
      { title: 'Components', href: '/docs/react/components' },
      { title: 'Animating Any Value', href: '/docs/react/values' },
      { title: 'Animated Drag', href: '/docs/react/drag' },
      { title: 'Presence & Variants', href: '/docs/react/presence-variants' },
      { title: 'Examples', href: '/docs/react/examples' },
    ],
  },
]

function DocNavigation({ onNavigate }: { onNavigate?: () => void }) {
  return <nav aria-label="Documentation topics" className="space-y-6 px-4" onClick={onNavigate}>
    {navItems.map(item => <div key={item.title}>
      {item.children ? <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-orange-400/80 mb-3 px-3">{item.title}</p>
        {item.children.filter(child => child.href).map(child => <NavLink key={child.href} href={child.href!}>{child.title}</NavLink>)}
      </div> : item.href ? <NavLink href={item.href}>{item.title}</NavLink> : null}
    </div>)}
  </nav>
}

export function Sidebar() {
  return <aside className="hidden lg:block fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r border-white/5 bg-background/50 backdrop-blur-xl">
    <ScrollArea className="h-full py-6"><DocNavigation /></ScrollArea>
  </aside>
}

export function MobileDocsNavigation() {
  const ref = useRef<HTMLDetailsElement>(null)
  return <details ref={ref} className="lg:hidden border-b border-white/10 p-4">
    <summary className="cursor-pointer font-medium text-orange-300">Documentation menu</summary>
    <div className="max-h-[65vh] overflow-y-auto py-4">
      <DocNavigation onNavigate={() => { if (ref.current) ref.current.open = false }} />
    </div>
  </details>
}

function NavLink({ href, children }: { href: string; children: string }) {
  const location = useLocation()
  const isActive = location.pathname === href || location.pathname.startsWith(href + '/')

  return (
    <Link
      to={href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all duration-200',
        isActive
          ? 'bg-orange-500/10 text-orange-300 font-medium border-l-2 border-orange-500 -ml-[2px] pl-[14px]'
          : 'text-muted-foreground hover:text-white hover:bg-white/5'
      )}
    >
      {children}
    </Link>
  )
}
