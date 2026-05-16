import type { NeedStatus } from '../types';

export type TrackerStepId =
  | 'received'
  | 'review'
  | 'assigned'
  | 'en_route'
  | 'resolved';

export interface TrackerStep {
  id: TrackerStepId;
  label: string;
  detail: string;
}

const STEPS: TrackerStep[] = [
  { id: 'received', label: 'Request received', detail: 'Your request is in the queue.' },
  { id: 'review', label: 'Under review', detail: 'Coordinators are prioritizing by urgency.' },
  { id: 'assigned', label: 'Volunteer assigned', detail: 'A responder has been matched to your request.' },
  { id: 'en_route', label: 'Help en route', detail: 'Your volunteer is heading to your location.' },
  { id: 'resolved', label: 'Resolved', detail: 'This request has been marked complete.' },
];

export function getActiveStepIndex(
  needStatus: NeedStatus,
  hasAssignment: boolean,
  assignmentStatus?: string | null,
): number {
  if (needStatus === 'resolved') return 4;

  if (assignmentStatus === 'en_route' || assignmentStatus === 'arrived') return 3;
  if (needStatus === 'in_progress') return 3;
  if (needStatus === 'assigned' || hasAssignment) return 2;
  if (needStatus === 'pending') return 1;

  return 0;
}

export function getTrackerSteps(
  needStatus: NeedStatus,
  hasAssignment: boolean,
  assignmentStatus?: string | null,
): { steps: TrackerStep[]; activeIndex: number } {
  const activeIndex = getActiveStepIndex(needStatus, hasAssignment, assignmentStatus);
  return { steps: STEPS, activeIndex };
}

export function formatTrackingCode(needId: string): string {
  return needId.replace(/-/g, '').slice(0, 8).toUpperCase();
}
