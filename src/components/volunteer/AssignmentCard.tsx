import {
  formatLocation,
  formatNeedType,
  getStatusChipLabel,
  getUrgencyScore,
  getUrgencyTier,
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
    STATUS_CHIP_CLASS[assignment.status] ?? 'bg-slate-100 text-slate-700';

  const showEnRoute = assignment.status === 'assigned';
  const showComplete =
    assignment.status === 'en_route' || assignment.status === 'arrived';

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-900">
          {formatNeedType(need?.need_type)}
        </h3>
        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${URGENCY_BADGE_CLASS[tier]}`}
          >
            {URGENCY_LABEL[tier]}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass}`}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      <p className="mt-2 text-sm text-slate-600">
        <span className="font-medium text-slate-700">Location: </span>
        {formatLocation(need)}
      </p>

      {need?.ai_brief && (
        <p className="mt-2 line-clamp-2 text-sm text-slate-500">{need.ai_brief}</p>
      )}

      {assignment.status !== 'completed' && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          {showEnRoute && (
            <button
              type="button"
              onClick={() => onMarkEnRoute(assignment.id)}
              disabled={isUpdating}
              className="flex-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm font-medium text-blue-800 transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Mark En Route
            </button>
          )}
          {showComplete && (
            <button
              type="button"
              onClick={() => onMarkComplete(assignment.id)}
              disabled={isUpdating}
              className="flex-1 rounded-lg bg-slate-800 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Mark Complete
            </button>
          )}
        </div>
      )}
    </article>
  );
}
