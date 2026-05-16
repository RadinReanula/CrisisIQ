import { lazy, Suspense } from 'react'
import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import PublicSubmit from './pages/PublicSubmit'
import VolunteerRegister from './pages/VolunteerRegister'
import VolunteerDashboard from './pages/VolunteerDashboard'
import CoordinatorPanel from './pages/CoordinatorPanel'
import { AppProvider, useAppContext } from './context/AppContext'
import { SupabaseProvider } from './context/SupabaseContext'
import { useTriage } from './hooks/useTriage'

const OpsMap = lazy(() => import('./pages/OpsMap'))
const AdminOverview = lazy(() => import('./pages/AdminOverview'))

function BackgroundTriage() {
  useTriage()

  return null
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAppContext()

  if (!user) {
    return <Navigate to="/volunteer" replace />
  }

  return children
}

function RequireCoordinator({ children }: { children: ReactNode }) {
  const { isCoordinator } = useAppContext()

  if (!isCoordinator) {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  return (
    <SupabaseProvider>
      <AppProvider>
        <BrowserRouter>
          <BackgroundTriage />
          <Suspense fallback={<div className="loading-skeleton">Loading...</div>}>
            <Routes>
              <Route path="/" element={<PublicSubmit />} />
              <Route path="/submit" element={<PublicSubmit />} />
              <Route path="/volunteer" element={<VolunteerRegister />} />
              <Route path="/volunteer/register" element={<VolunteerRegister />} />
              <Route
                path="/volunteer/dashboard"
                element={
                  <RequireAuth>
                    <VolunteerDashboard />
                  </RequireAuth>
                }
              />
              <Route
                path="/coordinator"
                element={
                  <RequireCoordinator>
                    <CoordinatorPanel />
                  </RequireCoordinator>
                }
              />
              <Route
                path="/ops"
                element={
                  <RequireCoordinator>
                    <OpsMap />
                  </RequireCoordinator>
                }
              />
              <Route
                path="/ops/admin"
                element={
                  <RequireCoordinator>
                    <AdminOverview />
                  </RequireCoordinator>
                }
              />
              <Route path="/admin" element={<Navigate to="/ops/admin" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AppProvider>
    </SupabaseProvider>
  )
}

export default App
