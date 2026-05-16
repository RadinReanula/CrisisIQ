import type { CrisisEvent } from '../../types';

interface CrisisEventBannerProps {
  event: CrisisEvent | null;
  compact?: boolean;
}

export function CrisisEventBanner({ event, compact }: CrisisEventBannerProps) {
  if (!event) {
    return (
      <div
        className={`rounded-xl border border-slate-600/40 bg-slate-800/40 ${
          compact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm'
        }`}
        role="status"
      >
        <p className="text-slate-400">No active crisis event configured.</p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-cyan-500/30 bg-cyan-950/30 ${
        compact ? 'px-3 py-2' : 'px-4 py-3'
      }`}
      role="status"
    >
      <p className={`font-semibold text-cyan-300 ${compact ? 'text-xs' : 'text-sm'}`}>
        Active response: {event.name}
      </p>
      {event.description && (
        <p className={`mt-1 text-slate-300 ${compact ? 'text-xs line-clamp-2' : 'text-sm'}`}>
          {event.description}
        </p>
      )}
    </div>
  );
}
