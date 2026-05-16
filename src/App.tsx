import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

const PublicSubmit = lazy(() => import('./pages/PublicSubmit'))
const VolunteerRegister = lazy(() => import('./pages/VolunteerRegister'))
const VolunteerDashboard = lazy(() => import('./pages/VolunteerDashboard'))
const OpsMap = lazy(() => import('./pages/OpsMap'))
const AdminOverview = lazy(() => import('./pages/AdminOverview'))

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="loading-skeleton">Loading...</div>}>
        <Routes>
          <Route path="/" element={<PublicSubmit />} />
          <Route path="/volunteer/register" element={<VolunteerRegister />} />
          <Route path="/volunteer/dashboard" element={<VolunteerDashboard />} />
          <Route path="/ops" element={<OpsMap />} />
          <Route path="/admin" element={<AdminOverview />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
