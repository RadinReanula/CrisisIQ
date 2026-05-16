import type { DisasterLevel, NewsItem, NewsItemSource } from '../../types';

export const DISASTER_LEVEL_RANK: Record<DisasterLevel, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
};

export const DISASTER_LEVEL_LABEL: Record<DisasterLevel, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  info: 'Info',
};

/** Tailwind utility classes; mirrors URGENCY_BADGE_CLASS in awareness. */
export const DISASTER_LEVEL_BADGE_CLASS: Record<DisasterLevel, string> = {
  critical: 'bg-red-500/20 text-red-300 border border-red-500/40',
  high: 'bg-orange-500/20 text-orange-300 border border-orange-500/40',
  medium: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40',
  low: 'bg-green-500/20 text-green-300 border border-green-500/40',
  info: 'bg-slate-500/20 text-slate-300 border border-slate-500/40',
};

export const SOURCE_LABEL_SHORT: Record<NewsItemSource, string> = {
  crisisiq: 'CrisisIQ',
  gdacs: 'GDACS',
  usgs: 'USGS',
  reliefweb: 'ReliefWeb',
  web: 'Web',
};

export const SOURCE_PILL_CLASS: Record<NewsItemSource, string> = {
  crisisiq: 'bg-cyan-500/15 text-cyan-200 border border-cyan-500/30',
  gdacs: 'bg-purple-500/15 text-purple-200 border border-purple-500/30',
  usgs: 'bg-blue-500/15 text-blue-200 border border-blue-500/30',
  reliefweb: 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/30',
  web: 'bg-slate-500/15 text-slate-200 border border-slate-500/30',
};

/** Two top-level categories used by the filter bar. */
export type NewsCategory = 'all' | 'local' | 'global';

export function categoryOf(item: NewsItem): NewsCategory {
  return item.source === 'crisisiq' ? 'local' : 'global';
}

/** Formats a timestamp as a short relative string (e.g. "5m ago"). */
export function formatRelativeTime(iso: string): string {
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return '';
  const diffSec = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay}d ago`;
}

export interface NewsFilters {
  category: NewsCategory;
  /** When non-null, only show items at this severity or higher. */
  minLevel: DisasterLevel | null;
}

export function applyFilters(items: NewsItem[], filters: NewsFilters): NewsItem[] {
  return items.filter((item) => {
    if (filters.category !== 'all' && categoryOf(item) !== filters.category) {
      return false;
    }
    if (filters.minLevel) {
      const needed = DISASTER_LEVEL_RANK[filters.minLevel];
      const got = DISASTER_LEVEL_RANK[item.disaster_level] ?? 0;
      if (got < needed) return false;
    }
    return true;
  });
}
