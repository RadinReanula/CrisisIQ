import type { NewsItem } from '../../types';
import {
  DISASTER_LEVEL_BADGE_CLASS,
  DISASTER_LEVEL_LABEL,
  formatRelativeTime,
  SOURCE_LABEL_SHORT,
  SOURCE_PILL_CLASS,
} from './newsUtils';

interface NewsCardProps {
  item: NewsItem;
}

function ExternalLinkIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 6H18v4.5M18 6l-7.5 7.5M9 5h-3a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3"
      />
    </svg>
  );
}

export function NewsCard({ item }: NewsCardProps) {
  return (
    <article className="flex h-full flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md transition-colors hover:border-white/20">
      <header className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${DISASTER_LEVEL_BADGE_CLASS[item.disaster_level]}`}
        >
          {DISASTER_LEVEL_LABEL[item.disaster_level]}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${SOURCE_PILL_CLASS[item.source]}`}
          title={item.source_label}
        >
          {SOURCE_LABEL_SHORT[item.source]}
        </span>
        {item.disaster_type && (
          <span className="text-[10px] uppercase tracking-wide text-slate-500">
            {item.disaster_type}
          </span>
        )}
        <span className="ml-auto text-[10px] text-slate-500">
          {formatRelativeTime(item.occurred_at)}
        </span>
      </header>

      <h3 className="text-base font-semibold leading-snug text-white">
        {item.title}
      </h3>

      <p className="text-sm leading-relaxed text-slate-300">{item.summary}</p>

      <footer className="mt-auto flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {item.region && (
            <span className="inline-flex items-center gap-1">
              <span aria-hidden>·</span>
              {item.region}
            </span>
          )}
          {typeof item.lat === 'number' && typeof item.lng === 'number' && (
            <span className="font-mono text-[10px] text-slate-500">
              {item.lat.toFixed(3)}, {item.lng.toFixed(3)}
            </span>
          )}
          {typeof item.affected_population === 'number' && (
            <span className="text-[10px] text-slate-500">
              ~{item.affected_population.toLocaleString()} affected
            </span>
          )}
        </div>
        {item.source_url && (
          <a
            href={item.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-medium text-cyan-200 transition-colors hover:border-cyan-400/50 hover:text-cyan-100"
          >
            <span>Source</span>
            <ExternalLinkIcon />
          </a>
        )}
      </footer>
    </article>
  );
}
