function ShieldAlertIcon() {
  return (
    <svg
      className="h-7 w-7 shrink-0 text-red-500"
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
        d="M12 9v3.75m0 3.75h.007M10.29 3.86 1.82 8.25c-.78.43-1.28 1.22-1.28 2.1v4.52c0 4.48 3.84 8.7 9.46 10.13 5.62-1.43 9.46-5.65 9.46-10.13v-4.52c0-.88-.5-1.67-1.28-2.1L13.71 3.86a2.25 2.25 0 0 0-2.42 0Z"
      />
    </svg>
  );
}

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
          <ShieldAlertIcon />
          <span className="text-lg font-bold text-white">CrisisIQ</span>
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
