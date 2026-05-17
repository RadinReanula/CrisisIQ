import { CrisisIqBrandMark } from '../brand/CrisisIqBrandMark';

interface CoordinatorNavbarProps {
  coordinatorEmail: string | null;
  onSignOut: () => void;
}

export function CoordinatorNavbar({
  coordinatorEmail,
  onSignOut,
}: CoordinatorNavbarProps) {
  return (
    <header className="shrink-0 border-b border-red-900/30 bg-slate-900/90 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <CrisisIqBrandMark variant="nav" />
          <span className="hidden items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-400 sm:inline-flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" aria-hidden />
            LIVE
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden max-w-[180px] truncate text-sm text-slate-400 md:inline">
            {coordinatorEmail ?? 'Coordinator'}
          </span>
          <button
            type="button"
            onClick={onSignOut}
            className="rounded-xl border border-slate-700 px-3 py-1 text-sm text-slate-400 transition-all duration-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
