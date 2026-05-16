import { useEffect, useState } from 'react';
import { getPublicCrisisStats, type PublicCrisisStats } from '../../services/supabase';

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
  const [stats, setStats] = useState<PublicCrisisStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const data = await getPublicCrisisStats(eventId);
      if (!cancelled) {
        setStats(data);
        setLoading(false);
      }
    }

    void load();
    const interval = window.setInterval(() => {
      void load();
    }, 60_000);

    return () => {
      cancelled = true;
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

  if (!stats) {
    return (
      <p className={`text-center text-sm text-slate-500 ${className}`}>
        Live stats unavailable — you can still submit a request.
      </p>
    );
  }

  const items = [
    { label: 'Pending requests', value: stats.pending, dot: 'bg-red-500' },
    { label: 'In progress', value: stats.inProgress, dot: 'bg-amber-400' },
    { label: 'Resolved', value: stats.resolved, dot: 'bg-emerald-400' },
  ];

  return (
    <div className={className}>
      <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2.5 text-sm text-slate-300">
            <span className={`h-2 w-2 shrink-0 rounded-full ${item.dot}`} aria-hidden />
            <span>
              <span className="font-semibold text-white tabular-nums">{item.value}</span>{' '}
              <span className="font-light text-slate-400">{item.label}</span>
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-slate-500">
        Updated {formatUpdated(stats.lastUpdated)} · refreshes every minute
      </p>
    </div>
  );
}
