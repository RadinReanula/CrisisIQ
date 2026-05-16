import type { Need } from '../../types';
import { formatLocation } from './assignmentUtils';
import {
  formatSubmittedTime,
  getNeedUrgencyBadge,
  formatNeedType,
} from './coordinatorUtils';

interface UnassignedNeedCardProps {
  need: Need;
  isSelected: boolean;
  onSelect: (needId: string) => void;
}

export function UnassignedNeedCard({
  need,
  isSelected,
  onSelect,
}: UnassignedNeedCardProps) {
  const urgency = getNeedUrgencyBadge(need);

  return (
    <button
      type="button"
      onClick={() => onSelect(need.id)}
      className={`w-full rounded-xl border bg-white p-4 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        isSelected
          ? 'border-blue-600 ring-2 ring-blue-500'
          : 'border-slate-200 hover:border-slate-300'
      }`}
      aria-pressed={isSelected}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-900">{need.submitter_name}</p>
          <p className="text-sm text-slate-600">{formatNeedType(need.need_type)}</p>
        </div>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${urgency.className}`}
        >
          {urgency.label}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        {formatLocation(need)}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Submitted {formatSubmittedTime(need.created_at)}
      </p>
    </button>
  );
}
