import type { NeedType } from '../../types';
import type { Volunteer } from '../../types';
import { AssignmentConfirmBar } from './AssignmentConfirmBar';
import { AvailableVolunteerRow } from './AvailableVolunteerRow';

interface AvailableVolunteersColumnProps {
  volunteers: Volunteer[];
  loading: boolean;
  error: string | null;
  selectedVolunteerId: string | null;
  onSelectVolunteer: (volunteerId: string) => void;
  onRetry: () => void;
  showConfirmBar: boolean;
  confirmVolunteerName: string;
  confirmNeedType: NeedType;
  confirmNeedLocation: string;
  isAssigning: boolean;
  onConfirmAssign: () => void;
  onCancelAssign: () => void;
}

export function AvailableVolunteersColumn({
  volunteers,
  loading,
  error,
  selectedVolunteerId,
  onSelectVolunteer,
  onRetry,
  showConfirmBar,
  confirmVolunteerName,
  confirmNeedType,
  confirmNeedLocation,
  isAssigning,
  onConfirmAssign,
  onCancelAssign,
}: AvailableVolunteersColumnProps) {
  return (
    <section
      className="relative flex min-h-0 flex-col"
      aria-labelledby="available-volunteers-heading"
    >
      <div className="shrink-0 border-b border-slate-800/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <h2
            id="available-volunteers-heading"
            className="font-semibold text-white"
          >
            Available Volunteers
          </h2>
          <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-semibold text-green-400">
            {volunteers.length}
          </span>
        </div>
      </div>

      <div
        className={`min-h-0 flex-1 overflow-y-auto px-4 py-3 ${
          showConfirmBar ? 'pb-44' : ''
        }`}
      >
        {loading && (
          <div className="space-y-2" role="status">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-800/40" />
            ))}
          </div>
        )}

        {error && !loading && (
          <div
            className="rounded-xl border border-red-500/40 bg-red-950/40 px-3 py-3 text-sm text-red-300"
            role="alert"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 font-medium text-red-200 underline hover:text-white"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && volunteers.length === 0 && (
          <div className="flex flex-col items-center py-12 text-center">
            <svg
              className="mb-4 h-14 w-14 text-slate-500"
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
                d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
            <p className="text-xl font-semibold text-white">No volunteers available</p>
            <p className="mt-2 text-slate-400">
              Waiting for volunteers to go online.
            </p>
          </div>
        )}

        {!loading &&
          !error &&
          volunteers.map((volunteer) => (
            <AvailableVolunteerRow
              key={volunteer.id}
              volunteer={volunteer}
              isSelected={selectedVolunteerId === volunteer.id}
              onSelect={onSelectVolunteer}
            />
          ))}
      </div>

      <AssignmentConfirmBar
        volunteerName={confirmVolunteerName}
        needType={confirmNeedType}
        needLocation={confirmNeedLocation}
        isAssigning={isAssigning}
        visible={showConfirmBar}
        onConfirm={onConfirmAssign}
        onCancel={onCancelAssign}
      />
    </section>
  );
}
