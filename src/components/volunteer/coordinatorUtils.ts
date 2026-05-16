import type { Need } from '../../types';
import {
  formatNeedType,
  getUrgencyScore,
  getUrgencyTier,
  URGENCY_BADGE_CLASS,
  URGENCY_LABEL,
} from './assignmentUtils';

/** DB status for needs not yet assigned (user spec: "unassigned") */
export const UNASSIGNED_NEED_STATUS = 'pending' as const;

export function formatSubmittedTime(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return createdAt;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function getNeedUrgencyBadge(need: Need) {
  const tier = getUrgencyTier(getUrgencyScore(need));
  return {
    label: URGENCY_LABEL[tier],
    className: URGENCY_BADGE_CLASS[tier],
  };
}

export function getUrgencyAccentBorder(need: Need): string {
  const tier = getUrgencyTier(getUrgencyScore(need));
  switch (tier) {
    case 'critical':
      return 'border-l-red-500 bg-red-500/5';
    case 'high':
      return 'border-l-orange-500 bg-orange-500/5';
    case 'medium':
      return 'border-l-yellow-500 bg-yellow-500/5';
    default:
      return 'border-l-green-500 bg-green-500/5';
  }
}

const NEED_TYPE_BADGE: Record<string, string> = {
  food: 'border-amber-500/40 bg-amber-500/20 text-amber-300',
  medical: 'border-rose-500/40 bg-rose-500/20 text-rose-300',
  shelter: 'border-blue-500/40 bg-blue-500/20 text-blue-300',
  rescue: 'border-red-500/40 bg-red-500/20 text-red-300',
  other: 'border-slate-500/40 bg-slate-500/20 text-slate-300',
};

export function getNeedTypeBadgeClass(needType: string): string {
  return NEED_TYPE_BADGE[needType] ?? NEED_TYPE_BADGE.other;
}

export function formatTimeAgo(createdAt: string): string {
  const ms = Date.now() - new Date(createdAt).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const AVATAR_PALETTE = [
  'bg-purple-900/50 text-purple-300',
  'bg-cyan-900/50 text-cyan-300',
  'bg-rose-900/50 text-rose-300',
  'bg-amber-900/50 text-amber-300',
  'bg-emerald-900/50 text-emerald-300',
  'bg-indigo-900/50 text-indigo-300',
];

export function getAvatarStyle(name: string): string {
  const code = name.charCodeAt(0) || 65;
  return AVATAR_PALETTE[code % AVATAR_PALETTE.length];
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export { formatNeedType };
