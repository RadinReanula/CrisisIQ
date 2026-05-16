import {
  formatLocation,
  formatNeedType,
  formatTimeSinceAssigned,
  getStatusChipLabel,
  getUrgencyScore,
  getUrgencyTier,
  NEED_TYPE_EMOJI,
  STATUS_CHIP_CLASS,
  URGENCY_BADGE_CLASS,
  URGENCY_LABEL,
  type AssignmentWithNeed,
} from './assignmentUtils';

interface AssignmentCardProps {
  assignment: AssignmentWithNeed;
  isUpdating: boolean;
  onMarkEnRoute: (assignmentId: string) => void;
  onMarkComplete: (assignmentId: string) => void;
}

function MapPinIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-slate-500"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-8 w-8 text-green-400"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9 13.5 13.5 8.25 19.5 15" />
    </svg>
  );
}

export function AssignmentCard({
  assignment,
  isUpdating,
  onMarkEnRoute,
  onMarkComplete,
}: AssignmentCardProps) {
  const need = assignment.needs;
  const urgencyScore = getUrgencyScore(need);
  const tier = getUrgencyTier(urgencyScore);
  const statusLabel = getStatusChipLabel(assignment.status);
  const statusClass =
    STATUS_CHIP_CLASS[assignment.status] ??
    'border-slate-600 bg-slate-700/50 text-slate-300';

  const showEnRoute = assignment.status === 'assigned';
  const showComplete =
    assignment.status === 'en_route' || assignment.status === 'arrived';
  const isCompleted = assignment.status === 'completed';

  const needType = need?.need_type;
  const emoji = needType ? NEED_TYPE_EMOJI[needType] : '📋';

  return (
    <article className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-600/80">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 gap-3">
          <span className="text-2xl leading-none" aria-hidden>
            {emoji}
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <h3 className="font-semibold text-white">
              {formatNeedType(need?.need_type)}
            </h3>
            <p className="flex items-start gap-1.5 text-sm text-slate-400">
              <MapPinIcon />
              <span className="min-w-0 break-words">{formatLocation(need)}</span>
            </p>
            <span
              className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${URGENCY_BADGE_CLASS[tier]}`}
            >
              {URGENCY_LABEL[tier]}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-3 sm:items-end">
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusClass}`}
          >
            {statusLabel}
          </span>

          {showEnRoute && (
            <button
              type="button"
              onClick={() => onMarkEnRoute(assignment.id)}
              disabled={isUpdating}
              className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUpdating ? 'Updating…' : 'Mark En Route'}
            </button>
          )}
          {showComplete && (
            <button
              type="button"
              onClick={() => onMarkComplete(assignment.id)}
              disabled={isUpdating}
              className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUpdating ? 'Updating…' : 'Mark Complete'}
            </button>
          )}
          {isCompleted && <CheckIcon />}
        </div>
      </div>

      <div className="mt-4 border-t border-slate-700/50 pt-3">
        <p className="text-xs text-slate-500">
          {formatTimeSinceAssigned(assignment.assigned_at)}
        </p>
      </div>
    </article>
  );
}
