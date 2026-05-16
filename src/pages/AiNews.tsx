import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PublicPageShell } from '../components/public/PublicPageShell';
import { NewsCard } from '../components/news/NewsCard';
import { NewsFiltersBar } from '../components/news/NewsFiltersBar';
import {
  applyFilters,
  categoryOf,
  type NewsFilters,
} from '../components/news/newsUtils';
import { getAiNews } from '../services/ai';
import type { AiNewsResponse } from '../types';
import '../index.css';

const DEFAULT_FILTERS: NewsFilters = { category: 'all', minLevel: null };

function SkeletonCard() {
  return (
    <article className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex gap-2">
        <div className="h-4 w-16 rounded-full bg-slate-700/60" />
        <div className="h-4 w-14 rounded-full bg-slate-700/40" />
      </div>
      <div className="mt-3 h-5 w-3/4 rounded bg-slate-700/50" />
      <div className="mt-2 h-3 w-full rounded bg-slate-700/30" />
      <div className="mt-1 h-3 w-5/6 rounded bg-slate-700/30" />
      <div className="mt-1 h-3 w-2/3 rounded bg-slate-700/30" />
    </article>
  );
}

function AiNews() {
  const [data, setData] = useState<AiNewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<NewsFilters>(DEFAULT_FILTERS);

  const isMountedRef = useRef(true);

  const load = useCallback(async (force: boolean) => {
    if (force) setRefreshing(true);
    setError(null);
    try {
      const response = await getAiNews(force);
      if (!isMountedRef.current) return;
      setData(response);
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load AI news.');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    queueMicrotask(() => {
      void load(false);
    });
    return () => {
      isMountedRef.current = false;
    };
  }, [load]);

  const items = useMemo(() => data?.items ?? [], [data]);
  const counts = useMemo(() => {
    let local = 0;
    let global = 0;
    for (const item of items) {
      if (categoryOf(item) === 'local') local += 1;
      else global += 1;
    }
    return { all: items.length, local, global };
  }, [items]);

  const filtered = useMemo(() => applyFilters(items, filters), [items, filters]);

  const handleRefresh = useCallback(() => {
    void load(true);
  }, [load]);

  return (
    <main className="min-h-screen bg-[var(--color-bg-dark)] font-sans text-[var(--color-text-inverse)]">
      <PublicPageShell>
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <Link to="/" className="text-sm text-slate-400 hover:text-white">
            ← Home
          </Link>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
                AI News
              </p>
              <h1 className="mt-1 text-3xl font-bold">Hazard digest</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                Curated by OpenAI from local CrisisIQ submissions and live world
                hazard feeds (GDACS, USGS, ReliefWeb), enriched with web search
                for current headlines. Cached for ten minutes; tap refresh for a
                fresh digest.
              </p>
            </div>
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <Link
                to="/awareness"
                className="text-sm text-cyan-400 hover:text-cyan-300"
              >
                Open the live map →
              </Link>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-4 py-2 text-sm font-semibold text-cyan-100 transition-colors hover:border-cyan-300/60 hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {refreshing ? (
                  <>
                    <span
                      className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-cyan-200/40 border-t-cyan-200"
                      aria-hidden
                    />
                    Refreshing
                  </>
                ) : (
                  'Refresh'
                )}
              </button>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2 text-[11px] text-slate-400">
            {refreshing ? (
              <>
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                Generating a fresh digest…
              </>
            ) : data ? (
              <>
                <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
                Updated {new Date(data.generated_at).toLocaleTimeString()} · next
                auto-refresh after{' '}
                {new Date(data.next_refresh_at).toLocaleTimeString()}
              </>
            ) : (
              <>
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
                Loading first digest…
              </>
            )}
          </div>

          <div className="mt-4">
            <NewsFiltersBar
              filters={filters}
              onChange={setFilters}
              counts={counts}
            />
          </div>

          <section className="mt-6">
            {error ? (
              <div className="rounded-2xl border border-red-500/40 bg-red-950/40 p-5 text-sm text-red-200">
                <p className="font-semibold">Could not load AI news</p>
                <p className="mt-1 text-xs text-red-300/80">{error}</p>
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="mt-3 inline-flex min-h-[36px] items-center rounded-lg border border-red-400/40 bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-100 hover:bg-red-500/30"
                >
                  Retry
                </button>
              </div>
            ) : loading && items.length === 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-12 text-center">
                <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-950/30 text-2xl">
                  ✓
                </span>
                <p className="text-sm font-semibold text-white">
                  No items match your filters
                </p>
                <p className="mt-1 max-w-md text-xs text-slate-400">
                  Try widening the severity or switching to “All”. If the digest
                  is genuinely empty, no recent CrisisIQ submissions or feed
                  alerts qualify right now.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filtered.map((item) => (
                  <NewsCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </section>

          <p className="mt-10 rounded-lg border border-red-800/40 bg-red-950/20 px-4 py-3 text-center text-sm text-red-200/90">
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

export default AiNews;
