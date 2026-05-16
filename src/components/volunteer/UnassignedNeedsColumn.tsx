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
  return (
    <section
      className="flex flex-col rounded-xl border border-slate-200 bg-slate-50/80"
      aria-labelledby="unassigned-needs-heading"
    >
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <h2
          id="unassigned-needs-heading"
          className="text-lg font-semibold text-slate-900"
        >
          Unassigned Needs
        </h2>
        <p className="text-xs text-slate-500">Select a need to assign help</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: '70vh' }}>
        {loading && (
          <div className="space-y-3" role="status">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-xl bg-slate-200"
              />
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-800" role="alert">
            <p>{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 font-medium underline focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && needs.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">
            No unassigned needs right now.
          </p>
        )}

        {!loading &&
          !error &&
          needs.map((need) => (
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
