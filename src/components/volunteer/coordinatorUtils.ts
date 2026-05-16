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

export { formatNeedType };
