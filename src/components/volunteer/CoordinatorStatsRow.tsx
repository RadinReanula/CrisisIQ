export interface CoordinatorStats {
  unassigned: number;
  assigned: number;
  enRoute: number;
  volunteersAvailable: number;
}

interface CoordinatorStatsRowProps {
  stats: CoordinatorStats;
}

const STAT_CONFIG = [
  {
    key: 'unassigned' as const,
    label: 'Unassigned',
    card: 'border-red-500/30 bg-red-500/10',
    accent: 'text-red-400',
  },
  {
    key: 'assigned' as const,
    label: 'Assigned',
    card: 'border-blue-500/30 bg-blue-500/10',
    accent: 'text-blue-400',
  },
  {
    key: 'enRoute' as const,
    label: 'En route',
    card: 'border-orange-500/30 bg-orange-500/10',
    accent: 'text-orange-400',
  },
  {
    key: 'volunteersAvailable' as const,
    label: 'Volunteers available',
    card: 'border-green-500/30 bg-green-500/10',
    accent: 'text-green-400',
  },
];

export function CoordinatorStatsRow({ stats }: CoordinatorStatsRowProps) {
  return (
    <div className="shrink-0 overflow-x-auto border-b border-slate-800/80 px-4 py-3 sm:px-6">
      <div className="flex min-w-max gap-3 sm:grid sm:min-w-0 sm:grid-cols-4">
        {STAT_CONFIG.map((item) => (
          <div
            key={item.key}
            className={`min-w-[140px] flex-1 rounded-xl border px-4 py-3 sm:min-w-0 ${item.card}`}
          >
            <p className={`text-3xl font-semibold text-white ${item.accent}`}>
              {stats[item.key]}
            </p>
            <p className="mt-0.5 text-xs uppercase tracking-wide text-slate-400">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
