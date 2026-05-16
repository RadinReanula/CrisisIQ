import type { AssignmentStatus, Need, NeedType } from '../../types';

export interface AssignmentWithNeed {
  id: string;
  need_id: string;
  volunteer_id: string;
  assigned_at: string;
  status: AssignmentStatus;
  completed_at?: string | null;
  coordinator_notes?: string | null;
  needs: Need | null;
}

export function getUrgencyScore(need: Need | null): number {
  if (!need) return 3;
  return need.urgency_ai ?? need.urgency_self ?? 3;
}

export type UrgencyTier = 'critical' | 'high' | 'medium' | 'low';

export function getUrgencyTier(score: number): UrgencyTier {
  if (score >= 5) return 'critical';
  if (score >= 4) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}

export const URGENCY_BADGE_CLASS: Record<UrgencyTier, string> = {
  critical: 'border-red-500 bg-red-600/30 text-red-400',
  high: 'border-orange-500 bg-orange-600/30 text-orange-400',
  medium: 'border-yellow-500 bg-yellow-600/30 text-yellow-400',
  low: 'border-green-500 bg-green-600/30 text-green-400',
};

export const URGENCY_LABEL: Record<UrgencyTier, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export function formatNeedType(type: NeedType | undefined): string {
  if (!type) return 'Need';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function formatLocation(need: Need | null): string {
  if (!need) return 'Location unavailable';
  const note = extractLocationNote(need.description);
  if (note) return note;
  return `${need.lat.toFixed(4)}, ${need.lng.toFixed(4)}`;
}

function extractLocationNote(description: string): string | null {
  const match = description.match(/^Location note:\s*(.+)$/m);
  return match?.[1]?.trim() ?? null;
}

export function getStatusChipLabel(status: AssignmentStatus): string {
  switch (status) {
    case 'assigned':
      return 'Assigned';
    case 'en_route':
    case 'arrived':
      return 'En Route';
    case 'completed':
      return 'Completed';
    default:
      return status;
  }
}

export const STATUS_CHIP_CLASS: Record<string, string> = {
  assigned: 'border-blue-500 bg-blue-600/30 text-blue-300',
  en_route: 'border-orange-500 bg-orange-600/30 text-orange-300 animate-pulse',
  arrived: 'border-orange-500 bg-orange-600/30 text-orange-300 animate-pulse',
  completed: 'border-green-500 bg-green-600/30 text-green-300',
};

export function formatTimeSinceAssigned(assignedAt: string): string {
  const ms = Date.now() - new Date(assignedAt).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return 'Assigned just now';
  if (minutes < 60) return `Assigned ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Assigned ${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `Assigned ${days}d ago`;
}

export function computeDashboardStats(assignments: AssignmentWithNeed[]) {
  const assigned = assignments.filter((a) => a.status === 'assigned').length;
  const enRoute = assignments.filter(
    (a) => a.status === 'en_route' || a.status === 'arrived'
  ).length;
  const today = new Date().toDateString();
  const completedToday = assignments.filter((a) => {
    if (a.status !== 'completed' || !a.completed_at) return false;
    return new Date(a.completed_at).toDateString() === today;
  }).length;

  return {
    assigned,
    enRoute,
    completedToday,
    responseRate: '98%',
  };
}

export const NEED_TYPE_EMOJI: Record<NeedType, string> = {
  food: '🍽',
  medical: '🏥',
  shelter: '🏠',
  rescue: '🚨',
  other: '📋',
};
