import { useCallback, useEffect, useState } from 'react';
import type { PublicRequestStats } from '../../services/supabase';
import { getPublicRequestStats, subscribeToPublicRequestsChanges } from '../../services/supabase';

interface LiveCrisisStatsProps {
  eventId?: string;
  className?: string;
}

function formatUpdated(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return 'just now';
  }
}

export function LiveCrisisStats({ eventId, className = '' }: LiveCrisisStatsProps) {
  const [stats, setStats] = useState<PublicRequestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleRetry = useCallback(() => {
    void (async () => {
      setLoading(true);
      setError(false);
      const data = await getPublicRequestStats(eventId);
      if (data) {
        setStats(data);
        setError(false);
      } else {
        setStats(null);
        setError(true);
      }
      setLoading(false);
    })();
  }, [eventId]);

  useEffect(() => {
    let cancelled = false;

    async function load(silent: boolean) {
      if (!silent) {
        setLoading(true);
        setError(false);
      }
      const data = await getPublicRequestStats(eventId);
      if (cancelled) return;
      if (data) {
        setStats(data);
        setError(false);
      } else if (!silent) {
        setStats(null);
        setError(true);
      }
      if (!silent) {
        setLoading(false);
      }
    }

    void load(false);

    const unsubscribe = subscribeToPublicRequestsChanges(() => {
      void load(true);
    }, eventId ?? 'all');

    const interval = window.setInterval(() => {
      void load(true);
    }, 60_000);

    return () => {
      cancelled = true;
      unsubscribe();
      window.clearInterval(interval);
    };
  }, [eventId]);

  if (loading) {
    return (
      <p className={`text-center text-sm text-slate-500 ${className}`} aria-live="polite">
        Loading live stats…
      </p>
    );
  }

  if (error || !stats) {
    return (
      <div className={`text-center text-sm text-slate-500 ${className}`}>
        <p>Live stats unavailable — you can still submit a request.</p>
        <button
          type="button"
          onClick={handleRetry}
          className="mt-2 text-cyan-400 underline decoration-cyan-400/40 underline-offset-2 hover:text-cyan-300"
        >
          Retry
        </button>
      </div>
    );
  }

  const items = [
    { label: 'Active requests', value: stats.total, dot: 'bg-cyan-400' },
    { label: 'Critical', value: stats.critical, dot: 'bg-red-500' },
    { label: 'High', value: stats.high, dot: 'bg-amber-400' },
    { label: 'Pending', value: stats.pending, dot: 'bg-slate-400' },
  ];

  return (
    <div className={className}>
      <div
        className="flex w-full min-w-0 flex-row flex-nowrap items-center justify-center gap-0 overflow-x-auto overscroll-x-contain py-0.5 [scrollbar-width:thin]"
        role="list"
      >
        {items.map((item, index) => (
          <div
            key={item.label}
            role="listitem"
            className={`flex shrink-0 items-center gap-2 whitespace-nowrap px-2.5 text-xs text-slate-300 first:pl-0 last:pr-0 sm:gap-2.5 sm:px-4 sm:text-sm md:px-5 ${
              index > 0 ? 'border-l border-white/10' : ''
            }`}
          >
            <span className={`h-2 w-2 shrink-0 rounded-full ${item.dot}`} aria-hidden />
            <span>
              <span className="font-semibold text-white tabular-nums">{item.value}</span>{' '}
              <span className="font-light text-slate-400">{item.label}</span>
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-slate-500">
        Updated {formatUpdated(stats.lastUpdated)} · live from emergency requests · refreshes every minute
      </p>
    </div>
  );
}

export default LiveCrisisStats;
