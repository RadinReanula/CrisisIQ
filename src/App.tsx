import { lazy, Suspense, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import PublicSubmit from './pages/PublicSubmit';
import RequestStatus from './pages/RequestStatus';
import GlobalAwareness from './pages/GlobalAwareness';
import VolunteerRegister from './pages/VolunteerRegister';
import VolunteerDashboard from './pages/VolunteerDashboard';
import CoordinatorPanel from './pages/CoordinatorPanel';
import CoordinatorLogin from './pages/CoordinatorLogin';
import { AppProvider } from './context/AppContext';
import { SupabaseProvider } from './context/SupabaseContext';
import { useTriage } from './hooks/useTriage';
import { supabase, supabaseConfigError } from './services/supabase';

const OpsMap = lazy(() => import('./pages/OpsMap'));
const AdminOverview = lazy(() => import('./pages/AdminOverview'));
const AiNews = lazy(() => import('./pages/AiNews'));

function BackgroundTriage() {
  useTriage();

  return null;
}

function MissingSupabaseConfig() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg-dark)] px-4 font-sans text-[var(--color-text-inverse)]">
      <section className="w-full max-w-xl rounded-2xl border border-[var(--color-border-inverse)] bg-[var(--color-surface-inverse)] p-6 shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-[var(--color-primary-accent)]">
          Setup required
        </p>
        <h1 className="mt-3 text-2xl font-bold">CrisisIQ needs Supabase credentials</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--color-text-inverse-muted)]">
          {supabaseConfigError}. Create a <code className="rounded bg-[var(--color-code-bg)] px-1.5 py-0.5">.env.local</code>{' '}
          file in the project root, then restart <code className="rounded bg-[var(--color-code-bg)] px-1.5 py-0.5">npm run dev</code>.
        </p>
        <pre className="mt-5 overflow-x-auto rounded-xl border border-[var(--color-border-inverse)] bg-[var(--color-code-bg)] p-4 text-xs text-[var(--color-text-inverse)]">
          VITE_SUPABASE_URL=https://your-project.supabase.co{'\n'}
          VITE_SUPABASE_ANON_KEY=your-anon-key
        </pre>
      </section>
    </main>
  );
}

function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-dark)] font-sans text-slate-400">
      Checking session…
    </div>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return <AuthLoading />;
  }

  if (!session) {
    return <Navigate to="/volunteer" replace />;
  }

  return <>{children}</>;
}

function RequireCoordinator({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    function applySession(next: Session | null) {
      const role = next?.user?.user_metadata?.role;
      setAllowed(role === 'coordinator');
      setReady(true);
    }

    void supabase.auth.getSession().then(({ data }) => {
      applySession(data.session ?? null);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!ready) {
    return <AuthLoading />;
  }

  if (!allowed) {
    return <Navigate to="/coordinator/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  if (supabaseConfigError) {
    return <MissingSupabaseConfig />;
  }

  return (
    <SupabaseProvider>
      <AppProvider>
        <BrowserRouter>
          <BackgroundTriage />
          <Suspense
            fallback={
              <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-dark)] font-sans text-slate-400">
                Loading…
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/submit" element={<PublicSubmit />} />
              <Route path="/status/:id" element={<RequestStatus />} />
              <Route path="/awareness" element={<GlobalAwareness />} />
              <Route path="/news" element={<AiNews />} />
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
              <Route path="/coordinator/login" element={<CoordinatorLogin />} />
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
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AppProvider>
    </SupabaseProvider>
  );
}

export default App;
