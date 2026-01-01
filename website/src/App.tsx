import { Routes, Route, useLocation } from 'react-router-dom'
import { lazy, Suspense } from 'react'
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
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'

// Examples pages - lazy loaded
const ExamplesIndex = lazy(() => import('./pages/examples/index'))
const ExamplesAll = lazy(() => import('./pages/Examples'))
const PhysicsPresetsDemo = lazy(() => import('./pages/examples/PhysicsPresetsDemo'))
const StaggerPatternsDemo = lazy(() => import('./pages/examples/StaggerPatternsDemo'))
const TimelineDemo = lazy(() => import('./pages/examples/TimelineDemo'))
const BounceElasticDemo = lazy(() => import('./pages/examples/BounceElasticDemo'))
const SVGMorphDemo = lazy(() => import('./pages/examples/SVGMorphDemo'))
const GesturesDemo = lazy(() => import('./pages/examples/GesturesDemo'))
const VariantsDemo = lazy(() => import('./pages/examples/VariantsDemo'))
const TextAnimationsDemo = lazy(() => import('./pages/examples/TextAnimationsDemo'))

// Loading component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
    </div>
  )
}

function App() {
  const location = useLocation()
  const isHomePage = location.pathname === '/'
  const isExamplesPage = location.pathname.startsWith('/examples')
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
            {/* Examples routes */}
            <Route path="/examples" element={
              <Suspense fallback={<PageLoader />}>
                <ExamplesIndex />
              </Suspense>
            } />
            <Route path="/examples/physics-presets" element={
              <Suspense fallback={<PageLoader />}>
                <PhysicsPresetsDemo />
              </Suspense>
            } />
            <Route path="/examples/stagger-patterns" element={
              <Suspense fallback={<PageLoader />}>
                <StaggerPatternsDemo />
              </Suspense>
            } />
            <Route path="/examples/timeline" element={
              <Suspense fallback={<PageLoader />}>
                <TimelineDemo />
              </Suspense>
            } />
            <Route path="/examples/physics-hooks" element={
              <Suspense fallback={<PageLoader />}>
                <BounceElasticDemo />
              </Suspense>
            } />
            <Route path="/examples/svg-morph" element={
              <Suspense fallback={<PageLoader />}>
                <SVGMorphDemo />
              </Suspense>
            } />
            <Route path="/examples/gestures" element={
              <Suspense fallback={<PageLoader />}>
                <GesturesDemo />
              </Suspense>
            } />
            <Route path="/examples/variants" element={
              <Suspense fallback={<PageLoader />}>
                <VariantsDemo />
              </Suspense>
            } />
            <Route path="/examples/text-animations" element={
              <Suspense fallback={<PageLoader />}>
                <TextAnimationsDemo />
              </Suspense>
            } />
            <Route path="/examples/all" element={
              <Suspense fallback={<PageLoader />}>
                <ExamplesAll />
              </Suspense>
            } />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App
