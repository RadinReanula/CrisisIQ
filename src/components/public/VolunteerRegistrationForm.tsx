import { useCallback, useEffect, useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { LoadingSpinner } from './LoadingSpinner';
import {
  SKILL_OPTIONS,
  type VolunteerAvailability,
  type VolunteerSkillOption,
} from './volunteerRegisterConstants';

interface FormState {
  name: string;
  phone: string;
  email: string;
  skills: string[];
  availability: VolunteerAvailability;
  locationText: string;
  lat: number | null;
  lng: number | null;
}

interface FieldErrors {
  name?: string;
  phone?: string;
  email?: string;
  skills?: string;
  location?: string;
}

const inputClass =
  'w-full rounded-xl border border-slate-600 bg-slate-800/60 p-3 text-white transition-all duration-300 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 disabled:cursor-not-allowed disabled:opacity-60';
const labelClass = 'mb-1 block text-sm text-white';
const errorClass = 'mt-1 text-sm text-red-400';

function buildSignupPassword(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const base = digits.length >= 6 ? digits : `${digits}crisisiq`;
  return `${base}Aa1`;
}

function MapPinIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0"
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
        d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
      />
    </svg>
  );
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
        className={`absolute inset-0 rounded-full bg-cyan-500/20 transition-opacity duration-500 ${
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
          className={`text-cyan-400 transition-all duration-700 ease-out ${
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
          className={`text-cyan-400 transition-all delay-300 duration-500 ease-out ${
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

function RegistrationSuccess() {
  return (
    <section
      className="mx-auto flex max-w-[560px] flex-col items-center gap-5 px-4 py-16 text-center sm:py-20"
      role="status"
    >
      <AnimatedCheckmark />
      <h1 className="text-3xl font-bold text-white">Welcome to the team!</h1>
      <p className="max-w-md text-slate-400">
        You&apos;re now active. Watch for assignment notifications.
      </p>
      <p className="text-sm text-slate-500">Redirecting to your dashboard…</p>
    </section>
  );
}

function ProgressIndicator({ step }: { step: 1 | 2 }) {
  return (
    <div className="mb-8">
      <div className="flex items-center">
        <div className="flex flex-col items-center gap-1.5">
          <span
            className={`flex h-3 w-3 rounded-full transition-all duration-300 ${
              step >= 1 ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.6)]' : 'bg-slate-600'
            }`}
            aria-hidden
          />
          <span
            className={`text-xs font-medium ${
              step >= 1 ? 'text-cyan-400' : 'text-slate-500'
            }`}
          >
            Your Details
          </span>
        </div>
        <div
          className={`mx-2 h-0.5 flex-1 rounded-full transition-all duration-500 ${
            step >= 2 ? 'bg-cyan-500' : 'bg-slate-700'
          }`}
          aria-hidden
        />
        <div className="flex flex-col items-center gap-1.5">
          <span
            className={`flex h-3 w-3 rounded-full transition-all duration-300 ${
              step >= 2 ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.6)]' : 'bg-slate-600'
            }`}
            aria-hidden
          />
          <span
            className={`text-xs font-medium ${
              step >= 2 ? 'text-cyan-400' : 'text-slate-500'
            }`}
          >
            Skills &amp; Availability
          </span>
        </div>
      </div>
    </div>
  );
}

export function VolunteerRegistrationForm() {
  const baseId = useId();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [formState, setFormState] = useState<FormState>({
    name: '',
    phone: '',
    email: '',
    skills: [],
    availability: 'available',
    locationText: '',
    lat: null,
    lng: null,
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const toggleSkill = useCallback((skill: VolunteerSkillOption) => {
    setFormState((prev) => {
      const selected = prev.skills.includes(skill);
      return {
        ...prev,
        skills: selected
          ? prev.skills.filter((s) => s !== skill)
          : [...prev.skills, skill],
      };
    });
    setFieldErrors((prev) => ({ ...prev, skills: undefined }));
  }, []);

  const validateStep1 = useCallback((): boolean => {
    const errors: FieldErrors = {};

    if (!formState.name.trim()) errors.name = 'Full name is required.';
    if (!formState.phone.trim()) errors.phone = 'Phone number is required.';
    if (!formState.email.trim()) {
      errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email.trim())) {
      errors.email = 'Enter a valid email address.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formState.name, formState.phone, formState.email]);

  const validate = useCallback((): boolean => {
    const errors: FieldErrors = {};

    if (!formState.name.trim()) errors.name = 'Full name is required.';
    if (!formState.phone.trim()) errors.phone = 'Phone number is required.';
    if (!formState.email.trim()) {
      errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email.trim())) {
      errors.email = 'Enter a valid email address.';
    }
    if (formState.skills.length === 0) {
      errors.skills = 'Select at least one skill.';
    }
    if (formState.lat === null || formState.lng === null) {
      errors.location = 'Use GPS or ensure location coordinates are set.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formState]);

  const handleNext = useCallback(() => {
    if (validateStep1()) setStep(2);
  }, [validateStep1]);

  const handleUseGps = useCallback(() => {
    if (!navigator.geolocation) {
      setFieldErrors((prev) => ({
        ...prev,
        location: 'GPS is not supported on this device.',
      }));
      return;
    }

    setLocationLoading(true);
    setFieldErrors((prev) => ({ ...prev, location: undefined }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setFormState((prev) => ({
          ...prev,
          lat,
          lng,
          locationText: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        }));
        setLocationLoading(false);
      },
      () => {
        setLocationLoading(false);
        setFieldErrors((prev) => ({
          ...prev,
          location: 'Could not get GPS location. Try again.',
        }));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }, []);

  const handleRegisterClick = useCallback(async () => {
    setSubmitError(null);
    setSuccessMessage(null);

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      let userId: string | undefined;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      userId = user?.id;

      if (!userId) {
        const { data: signUpData, error: signUpError } =
          await supabase.auth.signUp({
            email: formState.email.trim(),
            password: buildSignupPassword(formState.phone.trim()),
            options: {
              data: {
                role: 'volunteer',
                full_name: formState.name.trim(),
              },
            },
          });

        if (signUpError) {
          setSubmitError(signUpError.message);
          return;
        }

        userId = signUpData.user?.id;

        if (!userId) {
          setSubmitError(
            'Account created. Check your email to confirm, then open this page again to finish registration.'
          );
          return;
        }
      }

      const { error } = await supabase.from('volunteers').insert({
        user_id: userId,
        name: formState.name.trim(),
        phone: formState.phone.trim(),
        email: formState.email.trim(),
        skills: formState.skills,
        availability: formState.availability,
        lat: formState.lat ?? null,
        lng: formState.lng ?? null,
        status: 'active',
      });

      if (error) {
        setSubmitError(error.message);
        return;
      }

      setSuccessMessage(
        "You're registered! Coordinators can now assign you to tasks."
      );

      window.setTimeout(() => {
        navigate('/volunteer/dashboard');
      }, 2000);
    } catch (caught) {
      setSubmitError(
        caught instanceof Error ? caught.message : 'Registration failed.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [formState, navigate, validate]);

  if (successMessage) {
    return <RegistrationSuccess />;
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <header className="relative mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-sm font-medium text-slate-400 transition-all duration-300 hover:text-white"
          aria-label="Back to home"
        >
          <span aria-hidden>←</span>
          <span className="hidden sm:inline">Back</span>
        </button>
        <span className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-cyan-400">
          CrisisIQ
        </span>
        <span className="w-12" aria-hidden />
      </header>

      <p className="mb-8 text-center text-lg font-light text-slate-400">
        Join the Response Network
      </p>

      {submitError && (
        <div
          className="mx-auto mb-4 max-w-[560px] rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-300 backdrop-blur-sm"
          role="alert"
        >
          {submitError}
        </div>
      )}

      <div className="mx-auto max-w-[560px] rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-[20px]">
        <ProgressIndicator step={step} />

        <div className="space-y-5">
          {step === 1 && (
            <>
              <div>
                <label htmlFor={`${baseId}-name`} className={labelClass}>
                  Full name <span className="text-red-400">*</span>
                </label>
                <input
                  id={`${baseId}-name`}
                  type="text"
                  autoComplete="name"
                  value={formState.name}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, name: e.target.value }))
                  }
                  disabled={isSubmitting}
                  className={inputClass}
                  aria-invalid={Boolean(fieldErrors.name)}
                />
                {fieldErrors.name && (
                  <p className={errorClass}>{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor={`${baseId}-phone`} className={labelClass}>
                  Phone number <span className="text-red-400">*</span>
                </label>
                <input
                  id={`${baseId}-phone`}
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  value={formState.phone}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  disabled={isSubmitting}
                  className={inputClass}
                  aria-invalid={Boolean(fieldErrors.phone)}
                />
                {fieldErrors.phone && (
                  <p className={errorClass}>{fieldErrors.phone}</p>
                )}
              </div>

              <div>
                <label htmlFor={`${baseId}-email`} className={labelClass}>
                  Email address <span className="text-red-400">*</span>
                </label>
                <input
                  id={`${baseId}-email`}
                  type="email"
                  autoComplete="email"
                  value={formState.email}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, email: e.target.value }))
                  }
                  disabled={isSubmitting}
                  className={inputClass}
                  aria-invalid={Boolean(fieldErrors.email)}
                />
                {fieldErrors.email && (
                  <p className={errorClass}>{fieldErrors.email}</p>
                )}
              </div>

              <button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 p-4 text-lg font-semibold text-white transition-all duration-300 hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Next →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={isSubmitting}
                className="text-sm text-slate-400 transition-all duration-300 hover:text-cyan-400"
              >
                ← Back to details
              </button>

              <fieldset className="space-y-3">
                <legend className={labelClass}>
                  Skills <span className="text-red-400">*</span>
                </legend>
                <div className="grid grid-cols-3 gap-2">
                  {SKILL_OPTIONS.map((skill) => {
                    const selected = formState.skills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        disabled={isSubmitting}
                        className={`rounded-xl border px-2 py-2.5 text-center text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 sm:text-sm ${
                          selected
                            ? 'border-cyan-400 bg-cyan-600/30 text-cyan-300'
                            : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500'
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                        aria-pressed={selected}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
                {fieldErrors.skills && (
                  <p className={errorClass}>{fieldErrors.skills}</p>
                )}
              </fieldset>

              <fieldset className="space-y-2">
                <legend className={labelClass}>Availability</legend>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFormState((prev) => ({
                        ...prev,
                        availability: 'available',
                      }))
                    }
                    disabled={isSubmitting}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3.5 text-sm font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0f1e] ${
                      formState.availability === 'available'
                        ? 'border-green-500 bg-green-600/30 text-green-400'
                        : 'border-slate-600 bg-slate-800/40 text-slate-400 hover:border-slate-500'
                    }`}
                    aria-pressed={formState.availability === 'available'}
                  >
                    {formState.availability === 'available' && (
                      <span
                        className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-green-400"
                        aria-hidden
                      />
                    )}
                    Available Now
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormState((prev) => ({ ...prev, availability: 'standby' }))
                    }
                    disabled={isSubmitting}
                    className={`rounded-xl border px-3 py-3.5 text-sm font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0f1e] ${
                      formState.availability === 'standby'
                        ? 'border-slate-400 bg-slate-600/30 text-slate-300'
                        : 'border-slate-600 bg-slate-800/40 text-slate-400 hover:border-slate-500'
                    }`}
                    aria-pressed={formState.availability === 'standby'}
                  >
                    On Standby
                  </button>
                </div>
              </fieldset>

              <div>
                <label htmlFor={`${baseId}-location`} className={labelClass}>
                  Location <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    id={`${baseId}-location`}
                    type="text"
                    readOnly
                    value={formState.locationText}
                    placeholder="Use GPS to capture coordinates"
                    className={`${inputClass} min-w-0 flex-1`}
                    aria-invalid={Boolean(fieldErrors.location)}
                  />
                  <button
                    type="button"
                    onClick={handleUseGps}
                    disabled={isSubmitting || locationLoading}
                    className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-600 bg-slate-700 px-3 py-3 text-sm font-medium text-cyan-400 transition-all duration-300 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <MapPinIcon />
                    <span className="hidden sm:inline">
                      {locationLoading ? 'GPS…' : 'Use GPS'}
                    </span>
                  </button>
                </div>
                {fieldErrors.location && (
                  <p className={errorClass}>{fieldErrors.location}</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  void handleRegisterClick();
                }}
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 p-4 text-lg font-semibold text-white transition-all duration-300 hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner />
                    Registering...
                  </>
                ) : (
                  'Register as Volunteer'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
