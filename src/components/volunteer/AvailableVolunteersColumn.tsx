import type { Volunteer } from '../../types';
import { AvailableVolunteerRow } from './AvailableVolunteerRow';

interface AvailableVolunteersColumnProps {
  volunteers: Volunteer[];
  loading: boolean;
  error: string | null;
  selectedVolunteerId: string | null;
  onSelectVolunteer: (volunteerId: string) => void;
  onRetry: () => void;
}

export function AvailableVolunteersColumn({
  volunteers,
  loading,
  error,
  selectedVolunteerId,
  onSelectVolunteer,
  onRetry,
}: AvailableVolunteersColumnProps) {
  return (
    <section
      className="flex flex-col rounded-xl border border-slate-200 bg-slate-50/80"
      aria-labelledby="available-volunteers-heading"
    >
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <h2
          id="available-volunteers-heading"
          className="text-lg font-semibold text-slate-900"
        >
          Available Volunteers
        </h2>
        <p className="text-xs text-slate-500">Tap a volunteer to pair with selected need</p>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-4" style={{ maxHeight: '70vh' }}>
        {loading && (
          <div className="space-y-2" role="status">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-200" />
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
              className="mt-2 font-medium underline focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && volunteers.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">
            No available volunteers right now.
          </p>
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
    </section>
  );
}
