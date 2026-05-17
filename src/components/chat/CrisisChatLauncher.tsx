import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import './CrisisChat.css';

const CrisisChatWindow = lazy(() =>
  import('./CrisisChatWindow').then((m) => ({ default: m.CrisisChatWindow })),
);

/**
 * Floating action button (FAB) mounted globally inside `PublicPageShell`.
 * Toggles the lazy-loaded `CrisisChatWindow`. Uses a pulse ring + brand
 * glow that we disable for users that prefer reduced motion.
 */
export function CrisisChatLauncher() {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);

  const handleToggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  // When the window opens on mobile, lock background scroll so the
  // full-screen modal feels native and the page underneath does not jitter.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!open) return;
    const previous = document.body.style.overflow;
    if (window.matchMedia('(max-width: 639px)').matches) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      {open && (
        <Suspense fallback={null}>
          <CrisisChatWindow onClose={handleClose} />
        </Suspense>
      )}

      <button
        type="button"
        onClick={handleToggle}
        aria-label={open ? 'Close CrisisIQ Assistant' : 'Open CrisisIQ Assistant'}
        aria-expanded={open}
        className="group fixed bottom-4 right-4 z-[55] flex h-14 w-14 items-center justify-center rounded-full border border-cyan-400/40 bg-gradient-to-br from-cyan-500 via-cyan-400 to-red-500 text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.4)] transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-300/70 focus:ring-offset-2 focus:ring-offset-slate-950 sm:bottom-6 sm:right-6 sm:h-16 sm:w-16"
      >
        {!reduced && !open && (
          <span
            aria-hidden
            className="ciq-chat-pulse absolute inset-0 rounded-full border border-cyan-300/60"
          />
        )}
        {!reduced && !open && (
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-2 rounded-full bg-cyan-400/20 blur-2xl"
          />
        )}
        {open ? (
          <svg
            className="relative h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.4}
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg
            className="relative h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8-1.36 0-2.65-.27-3.81-.76L3 21l1.86-4.65A7.96 7.96 0 0 1 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        )}
      </button>
    </>
  );
}
