import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { buildVolunteerPasswordFromPhone } from '../auth/volunteerPassword';
import { LiveCrisisStats } from '../components/public/LiveCrisisStats';
import { PublicPageShell } from '../components/public/PublicPageShell';
import { useAppContext } from '../context/useAppContext';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { supabase } from '../services/supabase';
import '../index.css';

const VOLUNTEER_INPUT_CLASS =
  'w-full rounded-xl border border-slate-600 bg-slate-800/60 p-3 text-sm text-white transition-all duration-300 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 disabled:cursor-not-allowed disabled:opacity-60';

const BG_IMAGES = [
  'https://images.unsplash.com/photo-1587745416684-47953f16f02f?w=1920&q=80',
  'https://images.unsplash.com/photo-1599059813005-11265ba4b4ce?w=1920&q=80',
  'https://images.unsplash.com/photo-1578496781379-7dcfb995293d?w=1920&q=80',
  'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=1920&q=80',
  'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1920&q=80',
];

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

function VolunteerAccess() {
  const navigate = useNavigate();
  const { user } = useAppContext();
  const [expanded, setExpanded] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = useCallback(async () => {
    setError(null);
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedEmail || !trimmedPhone) {
      setError('Enter the same email and phone number you used when registering.');
      return;
    }

    setLoading(true);
    const password = buildVolunteerPasswordFromPhone(trimmedPhone);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });
    setLoading(false);

    if (signInError) {
      setError(
        signInError.message.includes('Invalid login') || signInError.message.includes('Invalid')
          ? 'Check your email and phone number match registration. The password is generated from your phone digits.'
          : signInError.message,
      );
      return;
    }

    if (!data.session) {
      setError('Confirm your email in the message from Supabase, then try again.');
      return;
    }

    navigate('/volunteer/dashboard', { replace: true });
  }, [email, phone, navigate]);

  if (user) {
    return (
      <div className="mx-auto mt-6 flex max-w-md flex-col items-center gap-3 px-4">
        <button
          type="button"
          onClick={() => navigate('/volunteer/dashboard')}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-cyan-500"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6A2.25 2.25 0 0 1 6 3.75h12A2.25 2.25 0 0 1 20.25 6v12A2.25 2.25 0 0 1 18 20.25H6A2.25 2.25 0 0 1 3.75 18V6ZM7.5 9.75h9M7.5 12.75h6"
            />
          </svg>
          View My Dashboard & Status
        </button>
        <p className="text-center text-xs text-slate-400">
          Signed in as <span className="text-cyan-300">{user.email}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-6 w-full max-w-md px-4">
      {!expanded ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="group flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-5 py-2.5 text-sm font-medium text-cyan-300 transition-all duration-300 hover:border-cyan-400/60 hover:bg-cyan-500/20"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Already a volunteer? Sign in to your dashboard
            <svg
              className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-y-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="animate-fade-in rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.04)] p-5 backdrop-blur-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-white">Volunteer sign in</h2>
            <button
              type="button"
              onClick={() => {
                setExpanded(false);
                setError(null);
              }}
              className="text-xs text-slate-400 transition-all duration-300 hover:text-white"
            >
              Close
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <label htmlFor="home-volunteer-email" className="mb-1 block text-xs text-slate-300">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                id="home-volunteer-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                placeholder="your@email.com"
                className={VOLUNTEER_INPUT_CLASS}
              />
            </div>
            <div>
              <label htmlFor="home-volunteer-phone" className="mb-1 block text-xs text-slate-300">
                Phone <span className="text-red-400">*</span>
              </label>
              <input
                id="home-volunteer-phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                placeholder="Same number as registration"
                className={VOLUNTEER_INPUT_CLASS}
              />
              <p className="mt-1.5 text-[11px] leading-snug text-slate-500">
                Your account password is generated from this phone number — it must match what you
                entered when you registered as a volunteer.
              </p>
            </div>
            {error && (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            )}
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                void handleSignIn();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span
                    className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                    aria-hidden
                  />
                  Signing in…
                </>
              ) : (
                'Sign in & view dashboard'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BackgroundSlideshow() {
  const reducedMotion = useReducedMotion();
  const [current, setCurrent] = useState(0);
  const [previous, setPrevious] = useState<number | null>(null);

  useEffect(() => {
    if (reducedMotion) return;
    const interval = window.setInterval(() => {
      setCurrent((idx) => {
        setPrevious(idx);
        return (idx + 1) % BG_IMAGES.length;
      });
    }, 6000);
    return () => window.clearInterval(interval);
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion || previous === null) return;
    const timeout = window.setTimeout(() => setPrevious(null), 2200);
    return () => window.clearTimeout(timeout);
  }, [previous, current, reducedMotion]);

  const imageIndex = reducedMotion ? 0 : current;

  return (
    <div className="home-bg-root" aria-hidden>
      {!reducedMotion && previous !== null && (
        <img
          src={BG_IMAGES[previous]}
          alt=""
          className="home-bg-img home-bg-img--fade-out"
        />
      )}
      <img
        src={BG_IMAGES[imageIndex]}
        alt=""
        className={`home-bg-img ${
          reducedMotion
            ? 'home-bg-img--visible'
            : previous !== null
              ? 'home-bg-img--fade-in'
              : 'home-bg-img--visible'
        }`}
      />
      <div className="home-bg-overlay" />
    </div>
  );
}


function AboutSection() {
  const tiles = [
    {
      iconClass: 'text-cyan-400',
      title: 'Real-time Updates',
      desc: 'Track your request live and get volunteer status without refreshing',
      path: 'M3.75 13.5l10.5-6.75M3.75 13.5v6.75h6.75M3.75 13.5L9 9.75m0 0 3-1.5M9 9.75V3.75m0 5.25L12 7.5m0 0 3-1.5M12 7.5V3.75m0 3.75L15 9.75m0 0 3 1.5M15 9.75V3.75',
    },
    {
      iconClass: 'text-green-400',
      title: 'Verified Coordinators',
      desc: 'All coordinators are verified before system access',
      path: 'M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.62-1.43 9.46-5.65 9.46-10.13v-4.52c0-.88-.5-1.67-1.28-2.1L13.71 3.86a2.25 2.25 0 0 0-2.42 0Z',
    },
    {
      iconClass: 'text-red-400',
      title: 'Location-aware',
      desc: 'GPS-based matching of needs to nearest volunteers',
      path: 'M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z',
    },
    {
      iconClass: 'text-purple-400',
      title: 'Community Driven',
      desc: 'Powered by volunteers who show up when it matters',
      path: 'M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a5.971 5.971 0 0 0-.941 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z',
    },
  ];

  return (
    <section className="animate-fade-in border-t border-slate-700/50 py-16">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
            About CrisisIQ
          </p>
          <h2 className="mt-3 text-3xl font-bold text-white">
            Coordinating hope
            <br />
            in moments of crisis
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            CrisisIQ is a real-time emergency coordination platform built to bridge the gap
            between people in need and volunteers ready to help. During a crisis, every second
            counts. Our system ensures that no request goes unnoticed and no volunteer goes
            unguided.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            Built by a team of students at NSBM Green University for the NSBM Buildathon 2025 Ã¢â‚¬â€
            because technology should serve humanity when it matters most.
          </p>
        </div>
        <div className="space-y-3">
          {tiles.map((tile) => (
            <div
              key={tile.title}
              className="mb-3 flex gap-3 rounded-xl border border-slate-700/30 bg-slate-800/40 p-3 transition-all duration-300 hover:border-slate-600/50"
            >
              <svg
                className={`h-6 w-6 shrink-0 ${tile.iconClass}`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={tile.path} />
              </svg>
              <div>
                <p className="text-sm font-medium text-white">{tile.title}</p>
                <p className="text-xs text-slate-400">{tile.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GuidelinesContactSection() {
  const steps = [
    {
      num: '1',
      circle: 'bg-red-600/30 border-red-500/50 text-red-400',
      title: 'Submit your need',
      desc: 'Fill in the emergency form with your location and type of help needed. No account required.',
    },
    {
      num: '2',
      circle: 'bg-cyan-600/30 border-cyan-500/50 text-cyan-400',
      title: 'Coordinators review',
      desc: 'Our coordinators triage all incoming requests by urgency and assign the nearest available volunteer.',
    },
    {
      num: '3',
      circle: 'bg-green-600/30 border-green-500/50 text-green-400',
      title: 'Help arrives',
      desc: 'Your assigned volunteer is notified in real time and dispatched to your location immediately.',
    },
  ];

  return (
    <section className="animate-fade-in border-t border-slate-700/50 py-16">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
        <div>
          <h2 className="mb-4 text-xl font-semibold text-white">How it works</h2>
          <div className="space-y-4">
            {steps.map((step) => (
              <div key={step.num} className="flex gap-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${step.circle}`}
                >
                  {step.num}
                </span>
                <div>
                  <p className="text-sm font-medium text-white">{step.title}</p>
                  <p className="text-xs text-slate-400">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-xl border border-yellow-600/30 bg-yellow-900/20 p-3">
            <div className="flex gap-2">
              <svg className="h-5 w-5 shrink-0 text-yellow-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-yellow-400">Important</p>
                <p className="text-xs text-yellow-200/70">
                  CrisisIQ is for genuine emergencies only. Misuse of this platform may delay
                  help reaching those who truly need it. Please be accurate and honest in your
                  submissions.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-xl font-semibold text-white">Get in touch</h2>
          <div className="mb-3 rounded-xl border border-red-700/30 bg-red-900/20 p-3 transition-all duration-300 hover:border-red-600/40">
            <div className="flex gap-3">
              <svg className="h-5 w-5 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.352.47-.89.72-1.465.586a12.036 12.036 0 0 1-7.143-7.143c-.134-.575.116-1.113.586-1.465l1.293-.97c.363-.271.527-.733.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
              </svg>
              <div>
                <p className="text-xs uppercase tracking-wide text-red-400">Emergency Hotline</p>
                <p className="text-lg font-bold text-white">119 / 1990</p>
                <p className="text-xs text-slate-400">Sri Lanka Disaster Management Center</p>
              </div>
            </div>
          </div>
          <div className="mb-3 rounded-xl border border-slate-700/30 bg-slate-800/40 p-3 transition-all duration-300 hover:border-slate-600/50">
            <div className="flex gap-3">
              <svg className="h-5 w-5 shrink-0 text-cyan-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
              <div>
                <p className="text-xs uppercase tracking-wide text-cyan-400">Platform Support</p>
                <p className="text-sm text-white">support@crisisiq.lk</p>
                <p className="text-xs text-slate-400">Response within 24 hours</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-700/30 bg-slate-800/40 p-3 transition-all duration-300 hover:border-slate-600/50">
            <div className="flex gap-3">
              <svg className="h-5 w-5 shrink-0 text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 4.5" />
              </svg>
              <div>
                <p className="text-xs uppercase tracking-wide text-purple-400">Built at</p>
                <p className="text-sm text-white">Cursor Buildathon 2025</p>
                <p className="text-xs text-slate-400"> Sri Lanka</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Home() {
  const navigate = useNavigate();
  const { currentEvent } = useAppContext();
  const reducedMotion = useReducedMotion();

  return (
    <main className="relative isolate min-h-screen overflow-x-hidden bg-[#0a0f1e] font-sans text-white">
      <BackgroundSlideshow />

      {!reducedMotion && (
        <div
          className="pointer-events-none fixed inset-0 z-[1] overflow-hidden"
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
      )}

      <PublicPageShell>
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="pb-4 pt-2 text-center sm:pt-4">
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

        <section className="mx-auto grid w-full max-w-5xl gap-6 md:grid-cols-2 md:gap-8">
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
              Submit an emergency request. Coordinators will dispatch help to your location
              immediately.
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
              Register as a volunteer. Receive assignments and coordinate rescue efforts on the
              ground.
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

        <LiveCrisisStats eventId={currentEvent?.id} className="mx-auto mt-10 max-w-5xl" />

        <div className="mx-auto mt-6 flex max-w-md flex-col items-center gap-1.5">
          <Link
            to="/awareness"
            className="block text-center text-sm text-cyan-400/90 transition-colors hover:text-cyan-300"
          >
            View the live threat map →
          </Link>
          <Link
            to="/news"
            className="block text-center text-sm text-cyan-400/90 transition-colors hover:text-cyan-300"
          >
            Read the AI hazard digest →
          </Link>
        </div>

        <VolunteerAccess />

        <button
          type="button"
          className="mx-auto mt-6 block text-center text-sm font-light text-slate-400 transition-all duration-300 hover:text-white"
          onClick={() => navigate('/coordinator/login')}
        >
          Coordinator? Sign in here →
        </button>

        <AboutSection />
        <GuidelinesContactSection />

        <footer className="mt-12 border-t border-slate-700/30 py-6 text-center">
          <p className="text-sm text-slate-500">
            © 2025 CrisisIQ 
          </p>
          <p className="mt-2 text-xs text-red-400/70 animate-pulse">
            In an emergency always call 119 first
          </p>
        </footer>
      </div>
      </PublicPageShell>
    </main>
  );
}

export default Home;
