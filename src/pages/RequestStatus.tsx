import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CrisisEventBanner } from '../components/public/CrisisEventBanner';
import { PublicPageShell } from '../components/public/PublicPageShell';
import { RequestStatusTimeline } from '../components/public/RequestStatusTimeline';
import { useAppContext } from '../context/AppContext';
import { formatTrackingCode } from '../lib/needStatus';
import { getNeedForTracking, supabase } from '../services/supabase';
import type { Need } from '../types';
import '../index.css';

function RequestStatus() {
  const { id } = useParams<{ id: string }>();
  const { currentEvent } = useAppContext();
  const [need, setNeed] = useState<Need | null>(null);
  const [assignmentStatus, setAssignmentStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setError('Invalid tracking link.');
      setLoading(false);
      return;
    }

    const info = await getNeedForTracking(id);
    if (!info) {
      setError('We could not find this request. Check your link or submit a new request.');
      setNeed(null);
    } else {
      setNeed(info.need);
      setAssignmentStatus(info.assignmentStatus);
      setError(null);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`need-track-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'needs', filter: `id=eq.${id}` },
        () => {
          void load();
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'requests', filter: `id=eq.${id}` },
        () => {
          void load();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [id, load]);

  const trackingCode = id ? formatTrackingCode(id) : '';

  return (
    <main className="min-h-screen bg-[#0a0f1e] font-sans text-white">
      <PublicPageShell>
        <div className="mx-auto max-w-lg px-4 py-8 sm:px-6">
          <Link
            to="/"
            className="text-sm text-slate-400 transition-colors hover:text-white"
          >
            ← Back to home
          </Link>

          <h1 className="mt-6 text-2xl font-bold text-white">Track your request</h1>
          {trackingCode && (
            <p className="mt-2 font-mono text-sm text-cyan-400">
              Tracking code: <span className="font-bold">{trackingCode}</span>
            </p>
          )}

          <div className="mt-4">
            <CrisisEventBanner event={currentEvent} compact />
          </div>

          <p className="mt-4 rounded-lg border border-yellow-700/40 bg-yellow-950/30 px-3 py-2 text-xs text-yellow-200/90">
            Life-threatening emergency? Call{' '}
            <a href="tel:119" className="font-semibold text-yellow-300 underline">
              119
            </a>{' '}
            first.
          </p>

          {loading && (
            <p className="mt-8 text-center text-slate-400" aria-live="polite">
              Loading status…
            </p>
          )}

          {error && !loading && (
            <p className="mt-8 text-center text-red-400" role="alert">
              {error}
            </p>
          )}

          {need && !loading && (
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <p className="text-sm text-slate-400">
                Submitted for <span className="capitalize text-white">{need.need_type}</span>
              </p>
              <RequestStatusTimeline
                needStatus={need.status}
                hasAssignment={Boolean(need.assigned_volunteer_id)}
                assignmentStatus={assignmentStatus}
              />
              <button
                type="button"
                onClick={() => {
                  void load();
                }}
                className="mt-6 w-full rounded-xl border border-slate-600 py-2.5 text-sm text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
              >
                Refresh status
              </button>
            </div>
          )}

          <p className="mt-8 text-center text-xs text-slate-500">
            Share this page with family — updates appear automatically.
          </p>
        </div>
      </PublicPageShell>
    </main>
  );
}

export default RequestStatus;
