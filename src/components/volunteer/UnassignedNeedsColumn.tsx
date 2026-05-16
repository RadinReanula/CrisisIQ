import { useMemo, useState } from 'react';
import type { Need } from '../../types';
import { UnassignedNeedCard } from './UnassignedNeedCard';

interface UnassignedNeedsColumnProps {
  needs: Need[];
  loading: boolean;
  error: string | null;
  selectedNeedId: string | null;
  onSelectNeed: (needId: string) => void;
  onRetry: () => void;
}

export function UnassignedNeedsColumn({
  needs,
  loading,
  error,
  selectedNeedId,
  onSelectNeed,
  onRetry,
}: UnassignedNeedsColumnProps) {
  const [filter, setFilter] = useState('');

  const filteredNeeds = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return needs;
    return needs.filter((need) => {
      const type = need.need_type.toLowerCase();
      const location = need.description.toLowerCase();
      const name = need.submitter_name.toLowerCase();
      return type.includes(q) || location.includes(q) || name.includes(q);
    });
  }, [needs, filter]);

  return (
    <section
      className="flex min-h-0 flex-col border-r border-slate-800/80"
      aria-labelledby="unassigned-needs-heading"
    >
      <div className="shrink-0 border-b border-slate-800/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <h2
            id="unassigned-needs-heading"
            className="font-semibold text-white"
          >
            Unassigned Needs
          </h2>
          <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-semibold text-red-400">
            {needs.length}
          </span>
        </div>
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by type or location…"
          className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-white placeholder-slate-500 transition-all duration-300 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {loading && (
          <div className="space-y-3" role="status">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-2xl bg-slate-800/40"
              />
            ))}
          </div>
        )}

        {error && !loading && (
          <div
            className="rounded-xl border border-red-500/40 bg-red-950/40 px-3 py-3 text-sm text-red-300"
            role="alert"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 font-medium text-red-200 underline hover:text-white"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && needs.length === 0 && (
          <div className="flex flex-col items-center py-12 text-center">
            <svg
              className="mb-4 h-14 w-14 text-green-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m4.5 12.75 6 6 9 13.5 13.5 8.25 19.5 15"
              />
            </svg>
            <p className="text-xl font-semibold text-white">All needs assigned!</p>
            <p className="mt-2 text-slate-400">
              Great work — the queue is clear.
            </p>
          </div>
        )}

        {!loading &&
          !error &&
          needs.length > 0 &&
          filteredNeeds.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">
              No needs match your filter.
            </p>
          )}

        {!loading &&
          !error &&
          filteredNeeds.map((need) => (
            <UnassignedNeedCard
              key={need.id}
              need={need}
              isSelected={selectedNeedId === need.id}
              onSelect={onSelectNeed}
            />
          ))}
      </div>
    </section>
  );
}
