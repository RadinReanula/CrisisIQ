import type { NeedType } from '../../types';
import { formatNeedType } from './coordinatorUtils';

interface AssignmentConfirmBarProps {
  volunteerName: string;
  needType: NeedType;
  needLocation: string;
  isAssigning: boolean;
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AssignmentConfirmBar({
  volunteerName,
  needType,
  needLocation,
  isAssigning,
  visible,
  onConfirm,
  onCancel,
}: AssignmentConfirmBarProps) {
  return (
    <div
      className={`absolute inset-x-0 bottom-0 z-10 border-t border-cyan-500/20 p-4 transition-transform duration-300 ease-out ${
        visible ? 'translate-y-0' : 'translate-y-full pointer-events-none'
      }`}
      role="region"
      aria-label="Confirm assignment"
      aria-hidden={!visible}
    >
      <div className="rounded-2xl border border-cyan-500/40 bg-slate-900/95 p-4 backdrop-blur-md">
        <p className="text-sm text-slate-400">
          Assign:{' '}
          <span className="font-semibold text-cyan-400">{volunteerName}</span>
          <span className="mx-2 text-slate-500">→ to →</span>
          <span className="font-semibold text-white">{formatNeedType(needType)}</span>
        </p>
        <p className="mt-1 truncate text-sm text-slate-400">{needLocation}</p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isAssigning}
            className="flex-1 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAssigning ? 'Assigning…' : 'Confirm Assignment'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isAssigning}
            className="rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-400 transition-all duration-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
