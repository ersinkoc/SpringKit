import { Link, useLocation } from 'react-router-dom'
import { Sparkles, Github, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useSpring } from '@oxog/springkit/react'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [logoHovered, setLogoHovered] = useState(false)
  const [logoPressed, setLogoPressed] = useState(false)
  const location = useLocation()

  const navLinks = [
    { href: '/docs/getting-started', label: 'Docs' },
    { href: '/docs/api/spring', label: 'API' },
    { href: '/docs/react/hooks', label: 'React' },
    { href: '/examples', label: 'Examples' },
  ]

  const isActive = (href: string) => location.pathname.startsWith(href.split('/').slice(0, 3).join('/'))

  // Logo spring animation
  const logoSpring = useSpring({
    scale: logoPressed ? 0.95 : logoHovered ? 1.05 : 1,
    rotate: logoHovered ? 5 : 0,
  }, { stiffness: 300, damping: 20 })

  // Mobile menu spring animation
  const menuSpring = useSpring({
    opacity: mobileMenuOpen ? 1 : 0,
    y: mobileMenuOpen ? 0 : -10,
  }, { stiffness: 200, damping: 20 })

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 glass-subtle">
      <div className="max-w-6xl mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20"
            style={{
              transform: `scale(${logoSpring.scale}) rotate(${logoSpring.rotate}deg)`,
            }}
            onMouseEnter={() => setLogoHovered(true)}
            onMouseLeave={() => { setLogoHovered(false); setLogoPressed(false) }}
            onMouseDown={() => setLogoPressed(true)}
            onMouseUp={() => setLogoPressed(false)}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-white group-hover:text-orange-300 transition-colors">
            SpringKit
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive(link.href)
                  ? 'text-orange-300 bg-orange-500/10'
                  : 'text-muted-foreground hover:text-white hover:bg-white/5'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/ersinkoc/springkit"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-white hover:bg-white/5 transition-all"
          >
            <Github className="w-4 h-4" />
            <span>GitHub</span>
          </a>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-white" />
            ) : (
              <Menu className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div
          className="md:hidden border-t border-white/5 glass"
          style={{
            opacity: menuSpring.opacity,
            transform: `translateY(${menuSpring.y}px)`,
          }}
        >
          <nav className="flex flex-col p-4 gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive(link.href)
                    ? 'text-orange-300 bg-orange-500/10'
                    : 'text-muted-foreground hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <a
              href="https://github.com/ersinkoc/springkit"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-white hover:bg-white/5 transition-all"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}
