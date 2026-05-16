import { Link } from 'react-router-dom';
import { CrisisEventBanner } from '../components/public/CrisisEventBanner';
import { PublicPageShell } from '../components/public/PublicPageShell';
import { useAppContext } from '../context/useAppContext';
import { GLOBAL_ALERTS, SEVERITY_STYLES } from '../data/globalAlerts';
import '../index.css';

function GlobalAwareness() {
  const { currentEvent } = useAppContext();

  return (
    <main className="min-h-screen bg-[#0a0f1e] font-sans text-white">
      <PublicPageShell>
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <Link to="/" className="text-sm text-slate-400 hover:text-white">
            ← Home
          </Link>
          <h1 className="mt-6 text-3xl font-bold">Global situation</h1>
          <p className="mt-2 text-slate-400">
            Awareness of events beyond your local response. External alerts are informational —
            dispatch is handled only through CrisisIQ active operations below.
          </p>

          <section className="mt-8">
            <h2 className="text-lg font-semibold text-cyan-400">CrisisIQ active response</h2>
            <div className="mt-3">
              <CrisisEventBanner event={currentEvent} />
            </div>
            {currentEvent && (
              <Link
                to="/submit"
                className="mt-4 inline-flex min-h-[44px] items-center rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-500"
              >
                Request help in this event
              </Link>
            )}
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-semibold text-slate-200">Worldwide alerts</h2>
            <p className="mt-1 text-xs text-slate-500">
              Sample curated items — connect GDACS, USGS, or ReliefWeb APIs for production.
            </p>
            <ul className="mt-4 space-y-4">
              {GLOBAL_ALERTS.map((alert) => {
                const style = SEVERITY_STYLES[alert.severity];
                return (
                  <li
                    key={alert.id}
                    className={`rounded-xl border bg-slate-900/40 p-4 ${style.border}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium uppercase ${style.badge}`}
                      >
                        {alert.severity}
                      </span>
                      <span className="text-xs text-slate-500">{alert.region}</span>
                    </div>
                    <h3 className="mt-2 font-semibold text-white">{alert.title}</h3>
                    <p className="mt-1 text-sm text-slate-400">{alert.summary}</p>
                    <p className="mt-3 text-xs text-slate-500">
                      Source:{' '}
                      {alert.sourceUrl ? (
                        <a
                          href={alert.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:underline"
                        >
                          {alert.source}
                        </a>
                      ) : (
                        alert.source
                      )}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>

          <p className="mt-10 rounded-lg border border-red-800/40 bg-red-950/20 px-4 py-3 text-center text-sm text-red-200/90">
            For immediate danger in Sri Lanka, call{' '}
            <a href="tel:119" className="font-bold text-red-300">
              119
            </a>
          </p>
        </div>
      </PublicPageShell>
    </main>
  );
}

export default GlobalAwareness;
