import type { Need } from '../../types';
import { formatLocation } from './assignmentUtils';
import {
  formatNeedType,
  formatTimeAgo,
  getNeedTypeBadgeClass,
  getNeedUrgencyBadge,
  getUrgencyAccentBorder,
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
  const descriptionPreview =
    need.description?.split('\n').find((line) => line.trim() && !line.startsWith('Contact:') && !line.startsWith('Location note:')) ??
    need.description;

  return (
    <button
      type="button"
      onClick={() => onSelect(need.id)}
      className={`mb-3 w-full rounded-2xl border border-l-4 border-slate-700/50 p-4 text-left transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${
        getUrgencyAccentBorder(need)
      } ${
        isSelected
          ? 'scale-[1.01] border-cyan-500/70 bg-cyan-500/10 shadow-lg shadow-cyan-500/10'
          : 'bg-slate-800/50 hover:border-slate-600 hover:bg-slate-700/50'
      }`}
      aria-pressed={isSelected}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${getNeedTypeBadgeClass(need.need_type)}`}
        >
          {formatNeedType(need.need_type)}
        </span>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${urgency.className}`}
          >
            {urgency.label}
          </span>
          <span className="text-xs text-slate-500">{formatTimeAgo(need.created_at)}</span>
        </div>
      </div>

      <p className="mt-3 font-medium text-white">{need.submitter_name}</p>
      <p className="mt-1 flex items-start gap-1 text-sm text-slate-400">
        <svg
          className="mt-0.5 h-4 w-4 shrink-0"
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
            d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
          />
        </svg>
        <span className="line-clamp-1">{formatLocation(need)}</span>
      </p>
      <p className="mt-2 line-clamp-2 text-sm text-slate-400">{descriptionPreview}</p>
    </button>
  );
}
