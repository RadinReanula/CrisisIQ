import { Link } from 'react-router-dom';
import { CrisisIqBrandMark } from '../brand/CrisisIqBrandMark';

export function EmergencyBar() {
  return (
    <nav
      className="fixed left-0 right-0 top-0 z-50 border-b border-red-900/50 bg-[#1a0a0a]/95 backdrop-blur-md"
      aria-label="Emergency actions"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2 sm:px-6">
        <Link
          to="/"
          className="shrink-0 transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-red-500/60 focus:ring-offset-2 focus:ring-offset-[#1a0a0a] rounded"
          aria-label="CrisisIQ home"
        >
          <CrisisIqBrandMark variant="nav" />
        </Link>
        <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
          <Link
            to="/awareness"
            className="hidden rounded-lg border border-slate-600/60 px-2.5 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-white sm:inline-block sm:text-sm"
          >
            Global alerts
          </Link>
          <a
            href="tel:119"
            className="flex min-h-[44px] items-center justify-center rounded-lg border border-red-600/60 bg-red-950/80 px-3 py-2 text-xs font-semibold text-red-200 transition-colors hover:bg-red-900/80 sm:px-4 sm:text-sm"
          >
            <span className="hidden sm:inline">Call 119</span>
            <span className="sm:hidden">119</span>
          </a>
          <Link
            to="/submit"
            className="flex min-h-[44px] items-center justify-center rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-500 sm:px-4 sm:text-sm"
          >
            Request help
          </Link>
        </div>
      </div>
    </nav>
  );
}
