import { useEffect, useState } from 'react';

interface CoordinatorToastProps {
  message: string;
  variant?: 'success' | 'error';
  onDismiss: () => void;
}

function CheckIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-green-400"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9 13.5 13.5 8.25 19.5 15" />
    </svg>
  );
}

export function CoordinatorToast({
  message,
  variant = 'success',
  onDismiss,
}: CoordinatorToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const enter = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(enter);
  }, []);

  const styles =
    variant === 'success'
      ? 'border-green-500/50 bg-green-900/90 text-green-300'
      : 'border-red-500/50 bg-red-900/90 text-red-300';

  return (
    <div
      className={`fixed right-4 top-4 z-50 flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl backdrop-blur-md transition-all duration-300 ${styles} ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
      }`}
      role="status"
      aria-live="polite"
    >
      {variant === 'success' && <CheckIcon />}
      <p className="flex-1 font-medium">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded p-0.5 text-current opacity-70 transition hover:opacity-100 focus:outline-none"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
