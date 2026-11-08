// GitHub Pages serves files, not BrowserRouter's in-memory route table.
// Emit an entry for every app route and documentation navigation destination.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
const sidebar = readFileSync(new URL('../src/components/Sidebar.tsx', import.meta.url), 'utf8')
const appRoutes = [...app.matchAll(/<Route\s+path=(["'])(\/[^"']*)\1/g)].map(match => match[2])
if (!appRoutes.includes('/')) throw new Error('No root route found; review the static route extractor')
const routes = new Set(appRoutes.map(route => route.replace(/\/\*$/, '')))
for (const match of sidebar.matchAll(/href:\s*(["'])(\/[^"']*)\1/g)) {
  const route = match[2]
  if (!appRoutes.some(rule => rule.endsWith('/*') ? route.startsWith(rule.slice(0, -1)) : rule === route)) {
    throw new Error(`Documentation link has no app route: ${route}`)
  }
  routes.add(route)
}

const dist = resolve(fileURLToPath(new URL('../dist/', import.meta.url)))
const html = readFileSync(resolve(dist, 'index.html'))
for (const route of routes) {
  if (route === '/') continue
  if (!/^\/[a-z0-9/-]+$/.test(route) || route.includes('//')) throw new Error(`Invalid static route: ${route}`)
  const entry = resolve(dist, `.${route}`, 'index.html')
  if (!entry.startsWith(dist + sep)) throw new Error(`Route escapes the build directory: ${route}`)
  mkdirSync(dirname(entry), { recursive: true })
  writeFileSync(entry, html)
}
// Unknown paths still return HTTP 404, with the application's not-found screen.
writeFileSync(resolve(dist, '404.html'), html)
writeFileSync(resolve(dist, '.nojekyll'), '')
console.log(`Emitted ${routes.size} static route entries and the not-found shell`)
