import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Spring } from 'lucide-react'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center space-x-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Spring className="h-6 w-6 text-primary" />
          </motion.div>
          <span className="font-bold text-lg">SpringKit</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6 text-sm">
          <Link to="/docs/getting-started" className="transition-colors hover:text-primary">
            Docs
          </Link>
          <Link to="/docs/api" className="transition-colors hover:text-primary">
            API
          </Link>
          <Link to="/docs/react" className="transition-colors hover:text-primary">
            React
          </Link>
          <Link to="/examples" className="transition-colors hover:text-primary">
            Examples
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <a
            href="https://github.com/ersinkoc/springkit"
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            GitHub
          </a>
        </div>
      </div>
    </header>
  )
}
