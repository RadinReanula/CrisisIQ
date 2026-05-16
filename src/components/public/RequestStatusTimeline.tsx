import { getTrackerSteps } from '../../lib/needStatus';
import type { NeedStatus } from '../../types';

interface RequestStatusTimelineProps {
  needStatus: NeedStatus;
  hasAssignment: boolean;
  assignmentStatus?: string | null;
}

export function RequestStatusTimeline({
  needStatus,
  hasAssignment,
  assignmentStatus,
}: RequestStatusTimelineProps) {
  const { steps, activeIndex } = getTrackerSteps(
    needStatus,
    hasAssignment,
    assignmentStatus,
  );

  return (
    <ol className="space-y-0" aria-label="Request status">
      {steps.map((step, index) => {
        const done = index < activeIndex;
        const active = index === activeIndex;
        const upcoming = index > activeIndex;

        return (
          <li key={step.id} className="relative flex gap-4 pb-8 last:pb-0">
            {index < steps.length - 1 && (
              <span
                className={`absolute left-[11px] top-6 h-[calc(100%-8px)] w-0.5 ${
                  done ? 'bg-emerald-500/60' : 'bg-slate-700'
                }`}
                aria-hidden
              />
            )}
            <span
              className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                done
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                  : active
                    ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                    : 'border-slate-600 bg-slate-800 text-slate-500'
              }`}
              aria-current={active ? 'step' : undefined}
            >
              {done ? '✓' : index + 1}
            </span>
            <div className={upcoming ? 'opacity-50' : ''}>
              <p
                className={`text-sm font-semibold ${
                  active ? 'text-cyan-300' : done ? 'text-white' : 'text-slate-400'
                }`}
              >
                {step.label}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">{step.detail}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
