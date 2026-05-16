/** Curated external awareness items — not dispatched by CrisisIQ. */
export type GlobalAlertSeverity = 'info' | 'watch' | 'warning' | 'critical';

export interface GlobalAlertItem {
  id: string;
  region: string;
  title: string;
  summary: string;
  severity: GlobalAlertSeverity;
  source: string;
  sourceUrl?: string;
  updatedAt: string;
}

export const GLOBAL_ALERTS: GlobalAlertItem[] = [
  {
    id: 'gdacs-sample-1',
    region: 'South Asia',
    title: 'Monsoon flooding — elevated risk',
    summary:
      'Heavy rainfall may affect low-lying coastal and river areas. Monitor local warnings and avoid flood waters.',
    severity: 'warning',
    source: 'GDACS (sample)',
    sourceUrl: 'https://www.gdacs.org/',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'usgs-sample-1',
    region: 'Indian Ocean',
    title: 'Seismic activity — no tsunami threat to Sri Lanka',
    summary:
      'Recent earthquake activity in the region is being monitored. Follow official DMC guidance if advisories change.',
    severity: 'info',
    source: 'USGS (sample)',
    sourceUrl: 'https://earthquake.usgs.gov/',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'who-sample-1',
    region: 'Global',
    title: 'Health cluster — disease outbreak preparedness',
    summary:
      'International health agencies recommend hygiene kits and safe water in crowded shelters during disasters.',
    severity: 'watch',
    source: 'WHO (sample)',
    sourceUrl: 'https://www.who.int/emergencies',
    updatedAt: new Date().toISOString(),
  },
];

export const SEVERITY_STYLES: Record<
  GlobalAlertSeverity,
  { border: string; badge: string; dot: string }
> = {
  info: {
    border: 'border-slate-600/40',
    badge: 'bg-slate-700/60 text-slate-300',
    dot: 'bg-slate-400',
  },
  watch: {
    border: 'border-yellow-600/40',
    badge: 'bg-yellow-900/40 text-yellow-300',
    dot: 'bg-yellow-400',
  },
  warning: {
    border: 'border-orange-600/40',
    badge: 'bg-orange-900/40 text-orange-300',
    dot: 'bg-orange-400',
  },
  critical: {
    border: 'border-red-600/50',
    badge: 'bg-red-900/50 text-red-300',
    dot: 'bg-red-500',
  },
};
