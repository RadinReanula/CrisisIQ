import { AssignmentCard } from './AssignmentCard';
import { DashboardStatsRow } from './DashboardStatsRow';
import type { AssignmentWithNeed } from './assignmentUtils';
import { computeDashboardStats } from './assignmentUtils';

interface AssignmentListProps {
  assignments: AssignmentWithNeed[];
  loading: boolean;
  error: string | null;
  updatingId: string | null;
  onRetry: () => void;
  onMarkEnRoute: (assignmentId: string) => void;
  onMarkComplete: (assignmentId: string) => void;
}

function WaitingDots() {
  return (
    <span className="inline-flex gap-0.5" aria-hidden>
      <span className="animate-pulse">.</span>
      <span className="animate-pulse [animation-delay:200ms]">.</span>
      <span className="animate-pulse [animation-delay:400ms]">.</span>
    </span>
  );
}

function LiveIndicator() {
  return (
    <div
      className="fixed bottom-4 right-4 z-30 flex items-center gap-2 rounded-full border border-green-500/40 bg-slate-900/90 px-3 py-1.5 text-xs font-medium text-green-400 shadow-lg backdrop-blur-md"
      role="status"
      aria-label="Real-time connection active"
    >
      <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" aria-hidden />
      Live
    </div>
  );
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
  const stats = computeDashboardStats(assignments);
  const showLive = !loading && !error;

  return (
    <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {!loading && !error && <DashboardStatsRow stats={stats} />}

      <section className="mt-8" aria-labelledby="assignments-heading">
        <div className="mb-5 flex items-center gap-2">
          <h2 id="assignments-heading" className="text-xl font-semibold text-white">
            My Assignments
          </h2>
          {showLive && (
            <span
              className="h-2 w-2 animate-pulse rounded-full bg-green-400"
              aria-hidden
            />
          )}
        </div>

        {loading && (
          <div className="space-y-3" role="status" aria-label="Loading assignments">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-2xl border border-slate-700/50 bg-slate-800/40"
              />
            ))}
          </div>
        )}

        {error && !loading && (
          <div
            className="rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-300"
            role="alert"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 font-medium text-red-200 underline transition-all duration-300 hover:text-white focus:outline-none"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && assignments.length === 0 && (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-700/50 bg-slate-800/30 px-6 py-14 text-center">
            <svg
              className="mb-4 h-16 w-16 text-slate-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1}
              stroke="currentColor"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
              />
            </svg>
            <p className="text-xl font-semibold text-white">No assignments yet</p>
            <p className="mt-2 max-w-sm text-slate-400">
              Coordinators will assign tasks to you shortly.
              <WaitingDots />
            </p>
          </div>
        )}

        {!loading && !error && assignments.length > 0 && (
          <ul className="space-y-4">
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

      {showLive && <LiveIndicator />}
    </div>
  );
}
