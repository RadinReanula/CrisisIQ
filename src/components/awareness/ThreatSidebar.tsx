import { useEffect, useMemo, useRef } from 'react';
import type { Need } from '../../types';
import {
  classifyUrgency,
  formatRelativeTime,
  NEED_TYPE_EMOJI,
  NEED_TYPE_LABEL,
  STATUS_LABEL,
  STATUS_PILL_CLASS,
  URGENCY_BADGE_CLASS,
  URGENCY_RANK,
} from './threatUtils';

interface ThreatSidebarProps {
  threats: Need[];
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRetry: () => void;
}

function StatChip({ label, value, accentClass }: { label: string; value: number; accentClass: string }) {
  return (
    <div className={`flex flex-col rounded-xl border px-3 py-2 ${accentClass}`}>
      <span className="text-[10px] uppercase tracking-wider opacity-80">{label}</span>
      <span className="text-lg font-bold leading-tight">{value}</span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <li className="animate-pulse rounded-xl border border-white/5 bg-white/5 p-4">
      <div className="flex items-center gap-2">
        <div className="h-4 w-16 rounded-full bg-slate-700/60" />
        <div className="h-4 w-12 rounded-full bg-slate-700/40" />
      </div>
      <div className="mt-3 h-4 w-3/4 rounded bg-slate-700/50" />
      <div className="mt-2 h-3 w-full rounded bg-slate-700/30" />
      <div className="mt-1 h-3 w-2/3 rounded bg-slate-700/30" />
    </li>
  );
}

export function ThreatSidebar({
  threats,
  loading,
  error,
  selectedId,
  onSelect,
  onRetry,
}: ThreatSidebarProps) {
  const itemRefs = useRef<Map<string, HTMLLIElement>>(new Map());

  const sorted = useMemo(() => {
    return [...threats].sort((a, b) => {
      const ua = URGENCY_RANK[classifyUrgency(a)];
      const ub = URGENCY_RANK[classifyUrgency(b)];
      if (ua !== ub) return ub - ua;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [threats]);

  const stats = useMemo(() => {
    let critical = 0;
    let high = 0;
    let pending = 0;
    for (const t of threats) {
      const u = classifyUrgency(t);
      if (u === 'critical') critical += 1;
      else if (u === 'high') high += 1;
      if (t.status === 'pending') pending += 1;
    }
    return { total: threats.length, critical, high, pending };
  }, [threats]);

  useEffect(() => {
    if (!selectedId) return;
    const el = itemRefs.current.get(selectedId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedId]);

  return (
    <aside
      className="flex h-full min-h-0 flex-col rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md"
      aria-label="Active threats list"
    >
      <header className="border-b border-white/10 px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-white">Active threats</h2>
          {loading ? (
            <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
              Updating…
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
              Live
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-400">
          GPS-tagged emergencies. Click a card to focus on the map.
        </p>

        <div className="mt-3 grid grid-cols-4 gap-2">
          <StatChip
            label="Total"
            value={stats.total}
            accentClass="border-slate-600/40 bg-slate-800/40 text-slate-200"
          />
          <StatChip
            label="Critical"
            value={stats.critical}
            accentClass="border-red-500/40 bg-red-950/30 text-red-200"
          />
          <StatChip
            label="High"
            value={stats.high}
            accentClass="border-orange-500/40 bg-orange-950/30 text-orange-200"
          />
          <StatChip
            label="Pending"
            value={stats.pending}
            accentClass="border-cyan-500/40 bg-cyan-950/30 text-cyan-200"
          />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {error ? (
          <div className="rounded-xl border border-red-500/40 bg-red-950/40 p-4 text-sm text-red-200">
            <p className="font-semibold">Could not load threats</p>
            <p className="mt-1 text-xs text-red-300/80">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex min-h-[36px] items-center rounded-lg border border-red-400/40 bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-100 hover:bg-red-500/30"
            >
              Retry
            </button>
          </div>
        ) : loading && threats.length === 0 ? (
          <ul className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </ul>
        ) : sorted.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4 py-10 text-center">
            <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full border border-green-500/30 bg-green-950/30 text-2xl">
              ✓
            </span>
            <p className="text-sm font-semibold text-white">No active threats</p>
            <p className="mt-1 text-xs text-slate-400">
              All recent requests have been resolved. New submissions appear here in real time.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {sorted.map((threat) => {
              const urgency = classifyUrgency(threat);
              const isSelected = threat.id === selectedId;
              return (
                <li
                  key={threat.id}
                  ref={(el) => {
                    if (el) itemRefs.current.set(threat.id, el);
                    else itemRefs.current.delete(threat.id);
                  }}
                  className={`rounded-xl border bg-slate-900/40 transition-all ${
                    isSelected
                      ? 'border-cyan-400/60 bg-cyan-950/25 shadow-[0_0_0_1px_rgba(103,232,249,0.35)]'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(threat.id)}
                    className="block w-full rounded-xl px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    aria-pressed={isSelected}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${URGENCY_BADGE_CLASS[urgency]}`}
                        >
                          {urgency}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_PILL_CLASS[threat.status]}`}
                        >
                          {STATUS_LABEL[threat.status]}
                        </span>
                      </div>
                      <span className="shrink-0 text-[10px] text-slate-500">
                        {formatRelativeTime(threat.created_at)}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <span aria-hidden className="text-base leading-none">
                        {NEED_TYPE_EMOJI[threat.need_type]}
                      </span>
                      <p className="text-sm font-semibold text-white">
                        {threat.submitter_name}
                      </p>
                      <span className="text-[11px] text-slate-400">
                        · {NEED_TYPE_LABEL[threat.need_type]}
                      </span>
                    </div>

                    <p className="mt-1.5 text-xs text-slate-400 line-clamp-2">
                      {threat.description}
                    </p>

                    <p className="mt-2 font-mono text-[10px] text-slate-500">
                      {threat.lat.toFixed(4)}, {threat.lng.toFixed(4)}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
