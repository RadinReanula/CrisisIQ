interface SubmitSuccessProps {
  onSubmitAnother: () => void;
}

export function SubmitSuccess({ onSubmitAnother }: SubmitSuccessProps) {
  return (
    <section
      className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-12 text-center"
      role="status"
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600"
        aria-hidden
      >
        ✓
      </div>
      <h1 className="text-xl font-semibold text-slate-900">
        Your request has been received. Help is on the way.
      </h1>
      <p className="text-sm text-slate-600">
        A coordinator will review your need and assign help as soon as possible.
      </p>
      <button
        type="button"
        onClick={onSubmitAnother}
        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Submit another request
      </button>
    </section>
  );
}
