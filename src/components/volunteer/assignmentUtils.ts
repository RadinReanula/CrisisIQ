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
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200',
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
  assigned: 'bg-blue-100 text-blue-800',
  en_route: 'bg-violet-100 text-violet-800',
  arrived: 'bg-violet-100 text-violet-800',
  completed: 'bg-slate-200 text-slate-700',
};
