interface CoordinatorToastProps {
  message: string;
  variant?: 'success' | 'error';
  onDismiss: () => void;
}

export function CoordinatorToast({
  message,
  variant = 'success',
  onDismiss,
}: CoordinatorToastProps) {
  const styles =
    variant === 'success'
      ? 'border-green-200 bg-green-50 text-green-900'
      : 'border-red-200 bg-red-50 text-red-900';

  return (
    <div
      className={`fixed bottom-20 left-1/2 z-50 flex max-w-sm -translate-x-1/2 items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${styles}`}
      role="status"
      aria-live="polite"
    >
      <p className="flex-1 font-medium">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded p-1 opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-1"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
