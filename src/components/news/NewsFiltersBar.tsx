import type { DisasterLevel } from '../../types';
import type { NewsCategory, NewsFilters } from './newsUtils';

interface NewsFiltersBarProps {
  filters: NewsFilters;
  onChange: (next: NewsFilters) => void;
  counts: {
    all: number;
    local: number;
    global: number;
  };
}

const CATEGORY_OPTIONS: { id: NewsCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'local', label: 'Local (CrisisIQ)' },
  { id: 'global', label: 'Global feeds' },
];

const LEVEL_OPTIONS: { id: DisasterLevel | null; label: string }[] = [
  { id: null, label: 'Any severity' },
  { id: 'medium', label: 'Medium +' },
  { id: 'high', label: 'High +' },
  { id: 'critical', label: 'Critical only' },
];

function ChipButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[36px] rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? 'border border-cyan-400/60 bg-cyan-500/20 text-cyan-100'
          : 'border border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

export function NewsFiltersBar({ filters, onChange, counts }: NewsFiltersBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Source filter">
        {CATEGORY_OPTIONS.map((opt) => {
          const count =
            opt.id === 'all'
              ? counts.all
              : opt.id === 'local'
                ? counts.local
                : counts.global;
          return (
            <ChipButton
              key={opt.id}
              active={filters.category === opt.id}
              onClick={() => onChange({ ...filters, category: opt.id })}
            >
              {opt.label}
              <span className="ml-1.5 text-[10px] opacity-70">({count})</span>
            </ChipButton>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Severity filter">
        {LEVEL_OPTIONS.map((opt) => (
          <ChipButton
            key={opt.label}
            active={filters.minLevel === opt.id}
            onClick={() => onChange({ ...filters, minLevel: opt.id })}
          >
            {opt.label}
          </ChipButton>
        ))}
      </div>
    </div>
  );
}
