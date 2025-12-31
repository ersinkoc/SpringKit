import { Routes, Route, useLocation } from 'react-router-dom'
import { Home } from './pages/Home'
import { GettingStarted } from './docs/GettingStarted'
import { SpringBasics } from './docs/SpringBasics'
import { Presets } from './docs/Presets'
import { Interpolation } from './docs/Interpolation'
import { Gestures } from './docs/Gestures'
import { Orchestration } from './docs/Orchestration'
import { AdvancedFeatures } from './docs/AdvancedFeatures'
import { ApiReference } from './docs/ApiReference'
import { ReactGuide } from './docs/ReactGuide'
import { Examples } from './pages/Examples'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'

function App() {
  const location = useLocation()
  const isHomePage = location.pathname === '/'
  const isExamplesPage = location.pathname === '/examples'
  const showSidebar = !isHomePage && !isExamplesPage

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        {showSidebar && <Sidebar />}
        <main className={`flex-1 ${showSidebar ? 'lg:pl-64' : ''}`}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/docs/getting-started" element={<GettingStarted />} />
            <Route path="/docs/spring/*" element={<SpringBasics />} />
            <Route path="/docs/presets" element={<Presets />} />
            <Route path="/docs/interpolation" element={<Interpolation />} />
            <Route path="/docs/gestures/*" element={<Gestures />} />
            <Route path="/docs/orchestration/*" element={<Orchestration />} />
            <Route path="/docs/advanced/*" element={<AdvancedFeatures />} />
            <Route path="/docs/api/*" element={<ApiReference />} />
            <Route path="/docs/react/*" element={<ReactGuide />} />
            <Route path="/examples" element={<Examples />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App
