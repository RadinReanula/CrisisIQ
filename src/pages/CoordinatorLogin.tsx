import { useCallback, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/useAppContext';
import { supabase } from '../services/supabase';

/**
 * Coordinators use normal Supabase email/password; role must be `user_metadata.role === 'coordinator'`.
 * Volunteers use the home page sign-in (phone-derived password), not this screen.
 */
export default function CoordinatorLogin() {
  const navigate = useNavigate();
  const { user, isCoordinator } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (evt: React.FormEvent) => {
      evt.preventDefault();
      setError(null);

      const trimmed = email.trim();
      if (!trimmed || !password) {
        setError('Enter coordinator email and password.');
        return;
      }

      setLoading(true);
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmed,
        password,
      });
      setLoading(false);

      if (signInError) {
        setError(signInError.message);
        return;
      }

      const role = data.user?.user_metadata?.role;
      if (role !== 'coordinator') {
        await supabase.auth.signOut();
        setError(
          'This account is not a coordinator. Volunteers should use "Already a volunteer?" on the home page (email + phone).',
        );
        return;
      }

      navigate('/coordinator', { replace: true });
    },
    [email, password, navigate],
  );

  if (user && isCoordinator) {
    return <Navigate to="/coordinator" replace />;
  }

  if (user && !isCoordinator) {
    return (
      <main className="min-h-screen bg-[var(--color-bg-dark)] px-4 py-16 font-sans text-[var(--color-text-inverse)]">
        <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <h1 className="text-lg font-semibold">Signed in as a volunteer</h1>
          <p className="mt-2 text-sm text-slate-400">
            Sign out first if you need to open the coordinator console with a different account.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link
              to="/volunteer/dashboard"
              className="inline-flex justify-center rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500"
            >
              Volunteer dashboard
            </Link>
            <button
              type="button"
              className="inline-flex justify-center rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/5"
              onClick={() => {
                void supabase.auth.signOut();
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg-dark)] px-4 py-16 font-sans text-[var(--color-text-inverse)]">
      <div className="mx-auto max-w-md">
        <p className="mb-2 text-center text-xs uppercase tracking-widest text-cyan-400">
          CrisisIQ
        </p>
        <h1 className="text-center text-xl font-bold">Coordinator sign in</h1>
        <p className="mt-2 text-center text-sm text-slate-400">
          Use the coordinator account from your Supabase project (role metadata: coordinator).
        </p>

        <form
          className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
          onSubmit={(e) => {
            void handleSubmit(e);
          }}
        >
          <div>
            <label htmlFor="coord-email" className="mb-1 block text-xs text-slate-300">
              Email
            </label>
            <input
              id="coord-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full rounded-xl border border-slate-600 bg-slate-800/60 p-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
            />
          </div>
          <div>
            <label htmlFor="coord-password" className="mb-1 block text-xs text-slate-300">
              Password
            </label>
            <input
              id="coord-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full rounded-xl border border-slate-600 bg-slate-800/60 p-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
            />
          </div>
          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-cyan-600 py-3 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-slate-500">
          <Link to="/" className="text-cyan-400 hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
