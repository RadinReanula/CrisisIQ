import { AssignmentCard } from './AssignmentCard';
import type { AssignmentWithNeed } from './assignmentUtils';

interface AssignmentListProps {
  assignments: AssignmentWithNeed[];
  loading: boolean;
  error: string | null;
  updatingId: string | null;
  onRetry: () => void;
  onMarkEnRoute: (assignmentId: string) => void;
  onMarkComplete: (assignmentId: string) => void;
}

export function AssignmentList({
  assignments,
  loading,
  error,
  updatingId,
  onRetry,
  onMarkEnRoute,
  onMarkComplete,
}: AssignmentListProps) {
  return (
    <section className="mx-auto max-w-lg px-4 py-5" aria-labelledby="assignments-heading">
      <h2
        id="assignments-heading"
        className="mb-4 text-lg font-semibold text-slate-900"
      >
        My Assignments
      </h2>

      {loading && (
        <div className="space-y-3" role="status" aria-label="Loading assignments">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-xl bg-slate-200"
            />
          ))}
        </div>
      )}

      {error && !loading && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-800"
          role="alert"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 font-medium text-red-900 underline focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && assignments.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-600">
          No active assignments yet. Stay available — coordinators will assign
          missions here in real time.
        </p>
      )}

      {!loading && !error && assignments.length > 0 && (
        <ul className="space-y-3">
          {assignments.map((assignment) => (
            <li key={assignment.id}>
              <AssignmentCard
                assignment={assignment}
                isUpdating={updatingId === assignment.id}
                onMarkEnRoute={onMarkEnRoute}
                onMarkComplete={onMarkComplete}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
