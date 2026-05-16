import type { Need, NeedType } from '../../types';

export type ThreatUrgencyLabel = 'critical' | 'high' | 'medium' | 'low';

/**
 * Classifies a need's urgency on a 4-tier scale using AI urgency when present,
 * otherwise the self-reported value (1-5 int from the `needs` table).
 */
export function classifyUrgency(need: Need): ThreatUrgencyLabel {
  const score = typeof need.urgency_ai === 'number' ? need.urgency_ai : need.urgency_self;
  if (score >= 5) return 'critical';
  if (score >= 4) return 'high';
  if (score === 3) return 'medium';
  return 'low';
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

export const STATUS_LABEL: Record<Need['status'], string> = {
  pending: 'Pending',
  assigned: 'Assigned',
  in_progress: 'In progress',
  resolved: 'Resolved',
};

export const STATUS_PILL_CLASS: Record<Need['status'], string> = {
  pending: 'bg-slate-700/60 text-slate-300',
  assigned: 'bg-cyan-700/40 text-cyan-200',
  in_progress: 'bg-blue-700/40 text-blue-200',
  resolved: 'bg-green-700/40 text-green-200',
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
