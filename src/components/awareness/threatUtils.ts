import type {
  HelpRequestUrgency,
  NeedStatus,
  NeedType,
  Threat,
  ThreatCategoryLabel,
} from '../../types';

/** Renamed alias; the threat severity buckets match the request urgency labels. */
export type ThreatUrgencyLabel = HelpRequestUrgency;

/**
 * Returns the effective urgency for a threat — AI-assessed if present,
 * otherwise the user-supplied value. Both come in as text labels from
 * the `requests` table / `ai-threats` function, so no number coercion
 * is required.
 */
export function classifyUrgency(threat: Threat): ThreatUrgencyLabel {
  return threat.ai?.ai_urgency ?? threat.urgency;
}

export const URGENCY_RANK: Record<ThreatUrgencyLabel, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export const URGENCY_HEX: Record<ThreatUrgencyLabel, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

export const URGENCY_BADGE_CLASS: Record<ThreatUrgencyLabel, string> = {
  critical: 'bg-red-500/20 text-red-300 border border-red-500/40',
  high: 'bg-orange-500/20 text-orange-300 border border-orange-500/40',
  medium: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40',
  low: 'bg-green-500/20 text-green-300 border border-green-500/40',
};

export const NEED_TYPE_LABEL: Record<NeedType, string> = {
  food: 'Food',
  medical: 'Medical',
  rescue: 'Rescue',
  shelter: 'Shelter',
  other: 'Other',
};

export const NEED_TYPE_EMOJI: Record<NeedType, string> = {
  food: '🍽',
  medical: '⚕',
  rescue: '🆘',
  shelter: '🏠',
  other: '❓',
};

export const STATUS_LABEL: Record<NeedStatus, string> = {
  pending: 'Pending',
  assigned: 'Assigned',
  in_progress: 'In progress',
  resolved: 'Resolved',
};

export const STATUS_PILL_CLASS: Record<NeedStatus, string> = {
  pending: 'bg-slate-700/60 text-slate-300',
  assigned: 'bg-cyan-700/40 text-cyan-200',
  in_progress: 'bg-blue-700/40 text-blue-200',
  resolved: 'bg-green-700/40 text-green-200',
};

export const CATEGORY_LABEL: Record<ThreatCategoryLabel, string> = {
  'natural-disaster': 'Natural disaster',
  medical: 'Medical',
  rescue: 'Rescue',
  shelter: 'Shelter',
  'food-water': 'Food / water',
  security: 'Security',
  infrastructure: 'Infrastructure',
  other: 'Other',
};

export const CATEGORY_PILL_CLASS: Record<ThreatCategoryLabel, string> = {
  'natural-disaster': 'bg-purple-500/15 text-purple-200 border border-purple-500/30',
  medical: 'bg-rose-500/15 text-rose-200 border border-rose-500/30',
  rescue: 'bg-red-500/15 text-red-200 border border-red-500/30',
  shelter: 'bg-amber-500/15 text-amber-200 border border-amber-500/30',
  'food-water': 'bg-sky-500/15 text-sky-200 border border-sky-500/30',
  security: 'bg-fuchsia-500/15 text-fuchsia-200 border border-fuchsia-500/30',
  infrastructure: 'bg-teal-500/15 text-teal-200 border border-teal-500/30',
  other: 'bg-slate-500/15 text-slate-200 border border-slate-500/30',
};

/** Formats a timestamp as a short relative string (e.g. "5m ago", "2h ago"). */
export function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const ts = new Date(iso).getTime();
  if (!Number.isFinite(ts)) return '';
  const diffSec = Math.max(0, Math.round((now - ts) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay}d ago`;
}

/** Default map center: Sri Lanka. */
export const SRI_LANKA_CENTER: [number, number] = [7.8731, 80.7718];
export const SRI_LANKA_DEFAULT_ZOOM = 8;
