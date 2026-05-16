import { useNavigate } from 'react-router-dom';
import '../index.css';

const PARTICLES: { id: number; positionClass: string; animClass: string }[] = [
  { id: 1, positionClass: 'left-[8%] top-[12%]', animClass: 'crisis-particle-1' },
  { id: 2, positionClass: 'left-[22%] top-[28%]', animClass: 'crisis-particle-2' },
  { id: 3, positionClass: 'left-[45%] top-[8%]', animClass: 'crisis-particle-3' },
  { id: 4, positionClass: 'left-[68%] top-[18%]', animClass: 'crisis-particle-4' },
  { id: 5, positionClass: 'left-[88%] top-[32%]', animClass: 'crisis-particle-5' },
  { id: 6, positionClass: 'left-[15%] top-[55%]', animClass: 'crisis-particle-6' },
  { id: 7, positionClass: 'left-[35%] top-[72%]', animClass: 'crisis-particle-7' },
  { id: 8, positionClass: 'left-[58%] top-[48%]', animClass: 'crisis-particle-8' },
  { id: 9, positionClass: 'left-[78%] top-[62%]', animClass: 'crisis-particle-9' },
  { id: 10, positionClass: 'left-[92%] top-[78%]', animClass: 'crisis-particle-10' },
  { id: 11, positionClass: 'left-[5%] top-[85%]', animClass: 'crisis-particle-11' },
  { id: 12, positionClass: 'left-[28%] top-[42%]', animClass: 'crisis-particle-12' },
  { id: 13, positionClass: 'left-[52%] top-[88%]', animClass: 'crisis-particle-13' },
  { id: 14, positionClass: 'left-[72%] top-[38%]', animClass: 'crisis-particle-14' },
  { id: 15, positionClass: 'left-[38%] top-[15%]', animClass: 'crisis-particle-15' },
  { id: 16, positionClass: 'left-[62%] top-[82%]', animClass: 'crisis-particle-16' },
  { id: 17, positionClass: 'left-[82%] top-[52%]', animClass: 'crisis-particle-17' },
  { id: 18, positionClass: 'left-[12%] top-[68%]', animClass: 'crisis-particle-18' },
  { id: 19, positionClass: 'left-[48%] top-[58%]', animClass: 'crisis-particle-19' },
  { id: 20, positionClass: 'left-[95%] top-[12%]', animClass: 'crisis-particle-20' },
];

const STATS = [
  { label: '2,847 Needs Resolved', dotClass: 'bg-red-500' },
  { label: '1,204 Volunteers Active', dotClass: 'bg-cyan-500' },
  { label: '98.2% Response Rate', dotClass: 'bg-emerald-400' },
] as const;

function ShieldAlertIcon() {
  return (
    <svg
      className="mx-auto h-16 w-16 text-red-500 transition-all duration-300"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m0 3.75h.007M10.29 3.86 1.82 8.25c-.78.43-1.28 1.22-1.28 2.1v4.52c0 4.48 3.84 8.7 9.46 10.13 5.62-1.43 9.46-5.65 9.46-10.13v-4.52c0-.88-.5-1.67-1.28-2.1L13.71 3.86a2.25 2.25 0 0 0-2.42 0Z"
      />
    </svg>
  );
}

function HandRaisedIcon() {
  return (
    <svg
      className="h-14 w-14 text-red-500"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 7.5V5.625a2.625 2.625 0 1 1 5.25 0v8.25m-5.25 0h5.25m0 0h-5.376a1.125 1.125 0 0 0-1.124 1.229l1.066 8.652a3.75 3.75 0 0 0 3.672 3.282h.648M12 20.25v-3m0 0V9.75m0 3.75h3.375"
      />
    </svg>
  );
}

function HeartHandsIcon() {
  return (
    <svg
      className="h-14 w-14 text-cyan-400"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
      />
    </svg>
  );
}

function Home() {
  const navigate = useNavigate();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0f1e] font-sans text-white">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="crisis-aurora-orb-red absolute -left-32 top-1/4 h-[28rem] w-[28rem] rounded-full bg-red-600 opacity-20 blur-3xl" />
        <div className="crisis-aurora-orb-cyan absolute -right-24 bottom-1/4 h-[32rem] w-[32rem] rounded-full bg-cyan-500 opacity-20 blur-3xl" />
        {PARTICLES.map((p) => (
          <span
            key={p.id}
            className={`crisis-particle absolute h-1 w-1 rounded-full bg-white opacity-30 ${p.positionClass} ${p.animClass}`}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-12 text-center">
          <ShieldAlertIcon />
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            CrisisIQ
          </h1>
          <div
            className="crisis-title-underline mx-auto mt-3 h-1 w-32 rounded-full bg-red-500"
            aria-hidden
          />
          <p className="mt-5 text-lg font-light text-slate-400">
            Real-time Crisis Response Coordination
          </p>
        </header>

        <section className="mx-auto grid w-full max-w-5xl flex-1 gap-6 md:grid-cols-2 md:gap-8">
          <article
            className="group flex cursor-pointer flex-col rounded-2xl border border-red-500/30 bg-[rgba(239,68,68,0.1)] p-8 backdrop-blur-[16px] transition-all duration-300 hover:-translate-y-2 hover:border-red-400/60 hover:shadow-[0_0_40px_rgba(239,68,68,0.25)]"
            onClick={() => navigate('/submit')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/submit');
              }
            }}
            role="button"
            tabIndex={0}
          >
            <HandRaisedIcon />
            <h2 className="mt-6 text-2xl font-semibold text-white">I Need Help</h2>
            <p className="mt-3 flex-1 font-light leading-relaxed text-slate-300">
              Submit an emergency request. Coordinators will dispatch help to your
              location immediately.
            </p>
            <button
              type="button"
              className="mt-8 w-full rounded-xl bg-red-600 px-6 py-3.5 text-center font-semibold text-white transition-all duration-300 hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-[#0a0f1e]"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/submit');
              }}
            >
              Request Help Now
            </button>
          </article>

          <article
            className="group flex cursor-pointer flex-col rounded-2xl border border-cyan-500/30 bg-[rgba(6,182,212,0.1)] p-8 backdrop-blur-[16px] transition-all duration-300 hover:-translate-y-2 hover:border-cyan-400/60 hover:shadow-[0_0_40px_rgba(6,182,212,0.25)]"
            onClick={() => navigate('/volunteer')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/volunteer');
              }
            }}
            role="button"
            tabIndex={0}
          >
            <HeartHandsIcon />
            <h2 className="mt-6 text-2xl font-semibold text-white">I Want to Help</h2>
            <p className="mt-3 flex-1 font-light leading-relaxed text-slate-300">
              Register as a volunteer. Receive assignments and coordinate rescue
              efforts on the ground.
            </p>
            <button
              type="button"
              className="mt-8 w-full rounded-xl bg-cyan-600 px-6 py-3.5 text-center font-semibold text-white transition-all duration-300 hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-[#0a0f1e]"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/volunteer');
              }}
            >
              Become a Volunteer
            </button>
          </article>
        </section>

        <button
          type="button"
          className="mt-10 text-center text-sm font-light text-slate-400 transition-all duration-300 hover:text-white"
          onClick={() => navigate('/coordinator')}
        >
          Coordinator? Sign in here →
        </button>

        <footer className="mt-auto pt-12">
          <div className="flex flex-col items-center justify-center gap-6 border-t border-white/10 pt-8 sm:flex-row sm:gap-10">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-2.5 text-sm font-light text-slate-400"
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${stat.dotClass} animate-pulse`}
                  aria-hidden
                />
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </footer>
      </div>
    </main>
  );
}

export default Home;
