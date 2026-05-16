import { useEffect, useState } from 'react';

interface SubmitSuccessProps {
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
      <svg
        className="h-28 w-28"
        viewBox="0 0 52 52"
        aria-hidden
      >
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

export function SubmitSuccess({ onSubmitAnother }: SubmitSuccessProps) {
  return (
    <section
      className="mx-auto flex max-w-[560px] flex-col items-center gap-5 px-4 py-16 text-center sm:py-20"
      role="status"
    >
      <AnimatedCheckmark />
      <h1 className="text-3xl font-bold text-white">Help is on the way!</h1>
      <p className="max-w-md text-slate-400">
        Your request has been received and is being reviewed by coordinators.
      </p>
      <button
        type="button"
        onClick={onSubmitAnother}
        className="mt-4 text-base font-medium text-cyan-400 transition-all duration-300 hover:text-cyan-300 focus:outline-none focus:underline"
      >
        Submit another request
      </button>
    </section>
  );
}
