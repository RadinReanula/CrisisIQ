import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CrisisEventBanner } from '../components/public/CrisisEventBanner';
import { PublicPageShell } from '../components/public/PublicPageShell';
import { ThreatMap } from '../components/awareness/ThreatMap';
import { ThreatSidebar } from '../components/awareness/ThreatSidebar';
import { useAppContext } from '../context/useAppContext';
import { getActiveThreats, supabase } from '../services/supabase';
import type { Need } from '../types';
import '../index.css';

function GlobalAwareness() {
  const { currentEvent } = useAppContext();
  const [threats, setThreats] = useState<Need[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  const loadThreats = useCallback(async () => {
    setError(null);
    try {
      const rows = await getActiveThreats();
      if (!isMountedRef.current) return;
      setThreats(rows);
    } catch (err) {
      if (!isMountedRef.current) return;
      const message = err instanceof Error ? err.message : 'Failed to load active threats.';
      setError(message);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    queueMicrotask(() => {
      void loadThreats();
    });

    const channel = supabase
      .channel('awareness-needs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'needs' },
        () => {
          void loadThreats();
        },
      )
      .subscribe();

    return () => {
      isMountedRef.current = false;
      void supabase.removeChannel(channel);
    };
  }, [loadThreats]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? prev : id));
  }, []);

  const handleRetry = useCallback(() => {
    setLoading(true);
    void loadThreats();
  }, [loadThreats]);

  return (
    <main className="min-h-screen bg-[var(--color-bg-dark)] font-sans text-[var(--color-text-inverse)]">
      <PublicPageShell>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <Link to="/" className="text-sm text-slate-400 hover:text-white">
            ← Home
          </Link>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Global situation</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                Live map of GPS-tagged emergencies submitted to CrisisIQ. Pins update in real
                time as people request help.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
              <Link
                to="/news"
                className="text-sm font-medium text-cyan-400 hover:text-cyan-300"
              >
                AI News digest →
              </Link>
              {currentEvent && (
                <Link
                  to="/submit"
                  className="inline-flex min-h-[44px] items-center rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-500"
                >
                  Request help in this event
                </Link>
              )}
            </div>
          </div>

          <section className="mt-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
                CrisisIQ active response
              </h2>
              <div className="mt-3">
                <CrisisEventBanner event={currentEvent} compact />
              </div>
            </div>
          </section>

          <section className="mt-6">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
              <div className="h-[420px] sm:h-[520px] lg:h-[640px]">
                <ThreatMap
                  threats={threats}
                  selectedId={selectedId}
                  onSelect={handleSelect}
                />
              </div>
              <div className="h-[480px] lg:h-[640px]">
                <ThreatSidebar
                  threats={threats}
                  loading={loading}
                  error={error}
                  selectedId={selectedId}
                  onSelect={handleSelect}
                  onRetry={handleRetry}
                />
              </div>
            </div>
          </section>

          <p className="mt-8 rounded-lg border border-red-800/40 bg-red-950/20 px-4 py-3 text-center text-sm text-red-200/90">
            For immediate danger in Sri Lanka, call{' '}
            <a href="tel:119" className="font-bold text-red-300">
              119
            </a>
          </p>
        </div>
      </PublicPageShell>
    </main>
  );
}

export default GlobalAwareness;
