import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PublicPageShell } from '../components/public/PublicPageShell';
import { ThreatMap } from '../components/awareness/ThreatMap';
import { ThreatSidebar } from '../components/awareness/ThreatSidebar';
import { useAppContext } from '../context/useAppContext';
import { getAiThreats } from '../services/ai';
import { getActiveRequests, supabase } from '../services/supabase';
import type { Threat } from '../types';
import '../index.css';

function GlobalAwareness() {
  const { currentEvent } = useAppContext();
  const [threats, setThreats] = useState<Threat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  // Cache the AI analyses by row id so live realtime patches keep the AI
  // summary attached when a row's status changes (avoids losing the AI
  // enrichment on every postgres_changes event).
  const aiCacheRef = useRef<
    Map<string, NonNullable<Threat['ai']>>
  >(new Map());

  /**
   * Reads non-resolved rows straight from `requests` (no AI). Used by
   * realtime subscription patches and as the initial render before the
   * AI batch returns. Re-applies cached AI analyses by id.
   */
  const refreshFromSupabase = useCallback(async () => {
    const rows = await getActiveRequests();
    if (!isMountedRef.current) return;
    const cache = aiCacheRef.current;
    const enriched = rows.map((row) =>
      cache.has(row.id) ? { ...row, ai: cache.get(row.id) } : row,
    );
    setThreats(enriched);
  }, []);

  /**
   * Calls `ai-threats` (cached server-side for ~5min). Pass `force` to
   * skip the cache and trigger a fresh OpenAI categorization run.
   */
  const loadAiThreats = useCallback(
    async ({ force }: { force: boolean }) => {
      setError(null);
      if (force) setRefreshing(true);

      try {
        const payload = await getAiThreats({ force });
        if (!isMountedRef.current) return;

        const cache = aiCacheRef.current;
        for (const t of payload.threats) {
          if (t.ai) cache.set(t.id, t.ai);
        }

        setThreats(payload.threats);
        setAiEnabled(payload.ai_enabled);
      } catch (err) {
        if (!isMountedRef.current) return;
        const message =
          err instanceof Error ? err.message : 'Failed to analyse threats.';
        setError(message);
        // Don't leave the user with a blank map — fall back to raw rows.
        await refreshFromSupabase();
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [refreshFromSupabase],
  );

  useEffect(() => {
    isMountedRef.current = true;

    // Show raw pins ASAP, then layer AI on top once the function returns.
    queueMicrotask(() => {
      void refreshFromSupabase().then(() => loadAiThreats({ force: false }));
    });

    const channel = supabase
      .channel('awareness-requests')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'requests' },
        () => {
          void refreshFromSupabase();
        },
      )
      .subscribe();

    return () => {
      isMountedRef.current = false;
      void supabase.removeChannel(channel);
    };
  }, [loadAiThreats, refreshFromSupabase]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? prev : id));
  }, []);

  const handleRetry = useCallback(() => {
    setLoading(true);
    void loadAiThreats({ force: false });
  }, [loadAiThreats]);

  const handleRunAiAnalysis = useCallback(() => {
    void loadAiThreats({ force: true });
  }, [loadAiThreats]);

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
                Live map of GPS-tagged emergencies from the public{' '}
                <code className="rounded bg-white/10 px-1 py-0.5 text-[11px] text-slate-200">
                  requests
                </code>{' '}
                table. Pins refresh in real time as people submit, and OpenAI
                analyses each description to assign category, severity, and
                recommended actions.
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
                  refreshing={refreshing}
                  aiEnabled={aiEnabled}
                  error={error}
                  selectedId={selectedId}
                  onSelect={handleSelect}
                  onRetry={handleRetry}
                  onRunAiAnalysis={handleRunAiAnalysis}
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
