import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { ExperimentPage } from './pages/ExperimentPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { getAssignedVariant } from './utils/variantGenerator'
import { useStore } from './store/useStore'

/**
 * Root redirect component - assigns user to variant and redirects
 */
function Root() {
  const navigate = useNavigate()
  const setVariant = useStore((s) => s.setVariant)

  useEffect(() => {
    // Get or assign variant
    const variant = getAssignedVariant()
    setVariant(variant)
    
    // Redirect to variant page
    navigate(`/variant/${variant.page}`, { replace: true })
  }, [])

  return (
    <div className="w-full h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-slate-400">Loading...</div>
    </div>
  )
}

/**
 * Main App with routing
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root - redirect to variant */}
        <Route path="/" element={<Root />} />
        
        {/* Experiment pages */}
        <Route path="/variant/:id" element={<ExperimentPage />} />
        
        {/* Placeholder page */}
        <Route path="/placeholder" element={<PlaceholderPage />} />
        
        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App