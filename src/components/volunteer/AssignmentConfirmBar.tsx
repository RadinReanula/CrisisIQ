import type { NeedType } from '../../types';
import { formatNeedType } from './coordinatorUtils';

interface AssignmentConfirmBarProps {
  volunteerName: string;
  needType: NeedType;
  isAssigning: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AssignmentConfirmBar({
  volunteerName,
  needType,
  isAssigning,
  onConfirm,
  onCancel,
}: AssignmentConfirmBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white px-4 py-4 shadow-lg">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-slate-800">
          Assign {volunteerName} to {formatNeedType(needType)}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isAssigning}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-60 sm:flex-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isAssigning}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-blue-400 sm:flex-none"
          >
            {isAssigning ? 'Assigning…' : `Assign ${volunteerName} to ${formatNeedType(needType)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
