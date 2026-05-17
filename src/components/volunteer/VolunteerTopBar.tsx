import { CrisisIqBrandMark } from '../brand/CrisisIqBrandMark';

interface VolunteerTopBarProps {
  authDisplayName: string | null;
  available: boolean;
  isTogglingAvailability: boolean;
  onToggleAvailability: () => void;
  onSignOut: () => void;
}

export function VolunteerTopBar({
  authDisplayName,
  available,
  isTogglingAvailability,
  onToggleAvailability,
  onSignOut,
}: VolunteerTopBarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <CrisisIqBrandMark variant="nav" />
          <span className="hidden text-sm text-slate-400 sm:inline">
            Volunteer Portal
          </span>
        </div>

        <p className="hidden max-w-[200px] truncate text-center text-sm font-medium text-white md:block lg:max-w-xs">
          {authDisplayName ?? 'Volunteer'}
        </p>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onToggleAvailability}
            disabled={isTogglingAvailability}
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0f1e] disabled:cursor-not-allowed disabled:opacity-60 ${
              available
                ? 'border-green-500 bg-green-600/20 text-green-400 focus:ring-green-500'
                : 'border-slate-600 bg-slate-700/50 text-slate-300 focus:ring-slate-500'
            }`}
            aria-pressed={available}
            aria-label={
              available
                ? 'Available for missions. Click to go on standby.'
                : 'On standby. Click to mark available.'
            }
          >
            <span
              className={`h-2 w-2 rounded-full ${
                available
                  ? 'animate-pulse bg-green-400'
                  : 'bg-slate-500'
              }`}
              aria-hidden
            />
            {isTogglingAvailability
              ? 'Updating…'
              : available
                ? 'Available'
                : 'Standby'}
          </button>

          <button
            type="button"
            onClick={onSignOut}
            className="text-sm text-slate-400 transition-all duration-300 hover:text-white focus:outline-none focus:underline"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
