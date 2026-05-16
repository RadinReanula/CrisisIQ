interface DashboardStats {
  assigned: number;
  enRoute: number;
  completedToday: number;
  responseRate: string;
}

interface DashboardStatsRowProps {
  stats: DashboardStats;
}

const STAT_ITEMS = [
  { key: 'assigned' as const, label: 'Assigned tasks', accent: 'border-l-cyan-500' },
  { key: 'enRoute' as const, label: 'En route', accent: 'border-l-orange-500' },
  { key: 'completedToday' as const, label: 'Completed today', accent: 'border-l-green-500' },
  { key: 'responseRate' as const, label: 'Response rate', accent: 'border-l-purple-500' },
];

export function DashboardStatsRow({ stats }: DashboardStatsRowProps) {
  const values: Record<(typeof STAT_ITEMS)[number]['key'], string | number> = {
    assigned: stats.assigned,
    enRoute: stats.enRoute,
    completedToday: stats.completedToday,
    responseRate: stats.responseRate,
  };

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {STAT_ITEMS.map((item) => (
        <div
          key={item.key}
          className={`rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-[16px] border-l-4 ${item.accent}`}
        >
          <p className="text-3xl font-semibold text-white">{values[item.key]}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}
