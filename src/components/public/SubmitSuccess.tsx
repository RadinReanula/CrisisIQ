import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatTrackingCode } from '../../lib/needStatus';

interface SubmitSuccessProps {
  needId: string;
  onSubmitAnother: () => void;
}

function AnimatedCheckmark() {
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      <span
        className={`absolute inset-0 rounded-full bg-green-500/20 transition-opacity duration-500 ${
          drawn ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden
      />
      <svg className="h-28 w-28" viewBox="0 0 52 52" aria-hidden>
        <circle
          cx="26"
          cy="26"
          r="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-green-400 transition-all duration-700 ease-out ${
            drawn
              ? '[stroke-dashoffset:0] opacity-100'
              : '[stroke-dashoffset:150] opacity-0'
          }`}
          style={{ strokeDasharray: 150 }}
        />
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14 27l8 8 16-17"
          className={`text-green-400 transition-all delay-300 duration-500 ease-out ${
            drawn
              ? '[stroke-dashoffset:0] opacity-100'
              : '[stroke-dashoffset:48] opacity-0'
          }`}
          style={{ strokeDasharray: 48 }}
        />
      </svg>
    </div>
  );
}

export function SubmitSuccess({ needId, onSubmitAnother }: SubmitSuccessProps) {
  const trackingCode = formatTrackingCode(needId);
  const trackUrl = `/status/${needId}`;

  const handleCopy = async () => {
    const full = `${window.location.origin}${trackUrl}`;
    try {
      await navigator.clipboard.writeText(full);
    } catch {
      /* ignore */
    }
  };

  return (
    <section
      className="mx-auto flex max-w-[560px] flex-col items-center gap-5 px-4 py-16 text-center sm:py-20"
      role="status"
    >
      <AnimatedCheckmark />
      <h1 className="text-3xl font-bold text-white">Request received</h1>
      <p className="max-w-md text-slate-400">
        Coordinators are reviewing your request. Save your tracking code to check status anytime.
      </p>

      <div className="w-full rounded-2xl border border-cyan-500/30 bg-cyan-950/20 px-4 py-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">Tracking code</p>
        <p className="mt-1 font-mono text-2xl font-bold text-cyan-300">{trackingCode}</p>
        <Link
          to={trackUrl}
          className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-cyan-600 text-sm font-semibold text-white hover:bg-cyan-500"
        >
          View live status
        </Link>
        <button
          type="button"
          onClick={() => {
            void handleCopy();
          }}
          className="mt-2 w-full text-sm text-cyan-400 hover:text-cyan-300"
        >
          Copy tracking link
        </button>
      </div>

      <p className="text-xs text-yellow-200/80">
        Life-threatening? Call <a href="tel:119" className="font-semibold underline">119</a> now.
      </p>

      <button
        type="button"
        onClick={onSubmitAnother}
        className="mt-2 text-base font-medium text-slate-400 transition-colors hover:text-white"
      >
        Submit another request
      </button>
    </section>
  );
}
