interface VolunteerTopBarProps {
  name: string;
  available: boolean;
  isTogglingAvailability: boolean;
  onToggleAvailability: () => void;
}

export function VolunteerTopBar({
  name,
  available,
  isTogglingAvailability,
  onToggleAvailability,
}: VolunteerTopBarProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Volunteer
          </p>
          <h1 className="truncate text-lg font-semibold text-slate-900">{name}</h1>
        </div>
        <button
          type="button"
          onClick={onToggleAvailability}
          disabled={isTogglingAvailability}
          className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
            available
              ? 'bg-green-100 text-green-800 ring-green-500 hover:bg-green-200 focus:ring-green-500'
              : 'bg-slate-200 text-slate-600 ring-slate-400 hover:bg-slate-300 focus:ring-slate-400'
          }`}
          aria-pressed={available}
          aria-label={
            available
              ? 'Available for missions. Click to go on standby.'
              : 'On standby. Click to mark available.'
          }
        >
          {isTogglingAvailability
            ? 'Updating…'
            : available
              ? 'Available'
              : 'Standby'}
        </button>
      </div>
    </header>
  );
}
