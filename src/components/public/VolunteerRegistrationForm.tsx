import { useCallback, useEffect, useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  buildVolunteerPasswordFromPhone,
  volunteerSignInPasswordCandidates,
} from '../../auth/volunteerPassword';
import { ensureAuthSessionForUser } from '../../auth/ensureAuthSession';
import { supabase } from '../../services/supabase';
import { LoadingSpinner } from './LoadingSpinner';
import {
  SKILL_OPTIONS,
  VOLUNTEER_AREA_OPTIONS,
  type VolunteerAvailability,
  type VolunteerAreaId,
  type VolunteerLocationMode,
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

/** Supabase Auth enforces email send limits; password sign-in does not send email. */
function isAuthRateLimitError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('rate limit') ||
    m.includes('too many requests') ||
    m.includes('over_email_send') ||
    m.includes('email rate') ||
    m.includes('429') ||
    m.includes('for security purposes')
  );
}

const RATE_LIMIT_SOFT_MESSAGE =
  'You’ve reached the short email-send limit from too many new sign-up attempts. Wait about one minute and tap Register again. If you already have an account, we’ll sign you in quietly—no new confirmation email.';

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
  const [submitBanner, setSubmitBanner] = useState<{
    message: string;
    tone: 'error' | 'pause';
  } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMode, setLocationMode] = useState<VolunteerLocationMode>('gps');
  const [manualCityId, setManualCityId] = useState<VolunteerAreaId | ''>('');
  const [manualLandmark, setManualLandmark] = useState('');

  useEffect(() => {
    if (!submitBanner || submitBanner.tone !== 'pause') return;
    const id = window.setTimeout(() => {
      setSubmitBanner(null);
    }, 14000);
    return () => window.clearTimeout(id);
  }, [submitBanner]);

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
    if (locationMode === 'manual') {
      if (!manualCityId) {
        errors.location = 'Select your city or nearest area.';
      } else if (!manualLandmark.trim()) {
        errors.location = 'Enter a street, landmark, or neighborhood.';
      } else if (formState.lat === null || formState.lng === null) {
        errors.location = 'Select your area to set map coordinates.';
      }
    } else if (formState.lat === null || formState.lng === null) {
      errors.location = 'Use GPS to capture your location, or switch to manual entry.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formState, locationMode, manualCityId, manualLandmark]);

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
        const freshLat = position.coords.latitude;
        const freshLng = position.coords.longitude;
        const accuracy = position.coords.accuracy;
        const accStr = accuracy < 100
          ? `±${Math.round(accuracy)}m`
          : `±${(accuracy / 1000).toFixed(1)}km`;

        setFormState((prev) => ({
          ...prev,
          lat: freshLat,
          lng: freshLng,
          locationText: `GPS ${freshLat.toFixed(5)}, ${freshLng.toFixed(5)} (${accStr})`,
        }));
        setLocationLoading(false);
      },
      (err) => {
        setLocationLoading(false);
        const message =
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied. Allow it in browser settings, or switch to manual entry.'
            : err.code === err.TIMEOUT
              ? 'GPS timed out. Move near a window for better signal, or try again.'
              : 'Could not get GPS location. Try again or switch to manual.';
        setFieldErrors((prev) => ({
          ...prev,
          location: message,
        }));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }, []);

  const applyManualLocation = useCallback(
    (cityId: VolunteerAreaId | '', landmark: string) => {
      if (!cityId) {
        setFormState((prev) => ({ ...prev, lat: null, lng: null, locationText: '' }));
        return;
      }
      const city = VOLUNTEER_AREA_OPTIONS.find((c) => c.id === cityId);
      if (!city) return;
      const trimmedLandmark = landmark.trim();
      const locationText = trimmedLandmark
        ? `${trimmedLandmark}, ${city.label}`
        : city.label;
      setFormState((prev) => ({
        ...prev,
        lat: city.lat,
        lng: city.lng,
        locationText,
      }));
    },
    []
  );

  const handleLocationModeChange = useCallback(
    (mode: VolunteerLocationMode) => {
      setLocationMode(mode);
      setFieldErrors((prev) => ({ ...prev, location: undefined }));
      if (mode === 'gps') {
        setManualCityId('');
        setManualLandmark('');
        setFormState((prev) => ({ ...prev, lat: null, lng: null, locationText: '' }));
      } else {
        setFormState((prev) => ({ ...prev, lat: null, lng: null, locationText: '' }));
      }
    },
    []
  );

  const handleManualCityChange = useCallback(
    (cityId: VolunteerAreaId | '') => {
      setManualCityId(cityId);
      applyManualLocation(cityId, manualLandmark);
      setFieldErrors((prev) => ({ ...prev, location: undefined }));
    },
    [applyManualLocation, manualLandmark]
  );

  const handleManualLandmarkChange = useCallback(
    (value: string) => {
      setManualLandmark(value);
      if (manualCityId) {
        applyManualLocation(manualCityId, value);
      }
      setFieldErrors((prev) => ({ ...prev, location: undefined }));
    },
    [applyManualLocation, manualCityId]
  );

  const handleRegisterClick = useCallback(async () => {
    setSubmitBanner(null);
    setSuccessMessage(null);

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const email = formState.email.trim();
      const phoneTrim = formState.phone.trim();
      const registrationPassword = buildVolunteerPasswordFromPhone(phoneTrim);

      async function trySignInExistingVolunteer(): Promise<string | undefined> {
        for (const pwd of volunteerSignInPasswordCandidates(phoneTrim)) {
          const res = await supabase.auth.signInWithPassword({
            email,
            password: pwd,
          });
          if (!res.error && res.data.user) {
            return res.data.user.id;
          }
        }
        return undefined;
      }

      let userId = (await supabase.auth.getUser()).data.user?.id;

      if (!userId) {
        userId = await trySignInExistingVolunteer();
      }

      if (!userId) {
        const signUpRes = await supabase.auth.signUp({
          email,
          password: registrationPassword,
          options: {
            data: {
              full_name: formState.name.trim(),
              phone: formState.phone.trim(),
            },
          },
        });

        if (signUpRes.error) {
          if (isAuthRateLimitError(signUpRes.error.message)) {
            setSubmitBanner({ message: RATE_LIMIT_SOFT_MESSAGE, tone: 'pause' });
            return;
          }

          if (
            /already (been )?registered|already exists|user already|duplicate|signup/i.test(
              signUpRes.error.message,
            )
          ) {
            const retryUserId = await trySignInExistingVolunteer();
            if (retryUserId) {
              userId = retryUserId;
            } else {
              setSubmitBanner({
                message:
                  'This email is already registered. Use the same phone number as before (your password is derived from it), or reset your password.',
                tone: 'error',
              });
              return;
            }
          } else {
            setSubmitBanner({
              message: signUpRes.error.message,
              tone: 'error',
            });
            return;
          }
        } else {
          userId = signUpRes.data.user?.id ?? undefined;
          if (!userId) {
            setSubmitBanner({
              message:
                'Check your email to confirm your account, then return here and tap Register again to finish your profile.',
              tone: 'pause',
            });
            return;
          }
        }
      }

      if (!userId) {
        setSubmitBanner({
          message: 'Could not verify your session. Try again in a moment.',
          tone: 'error',
        });
        return;
      }

      if (formState.lat === null || formState.lng === null) {
        setSubmitBanner({
          message: 'Location coordinates are required.',
          tone: 'error',
        });
        return;
      }

      const sessionGate = await ensureAuthSessionForUser(
        supabase,
        userId,
        email,
        phoneTrim,
      );

      if (sessionGate.status === 'need_email_confirm') {
        setSubmitBanner({
          message:
            'Open the confirmation link Supabase sent to your email, then come back and tap Register again. Your profile can only be saved after your account is confirmed and signed in.',
          tone: 'pause',
        });
        return;
      }

      if (sessionGate.status === 'auth_failed') {
        setSubmitBanner({
          message: sessionGate.message,
          tone: 'error',
        });
        return;
      }

      const profileRes = await supabase.from('profiles').upsert(
        {
          id: userId,
          role: 'volunteer',
          full_name: formState.name.trim(),
          phone: formState.phone.trim(),
          email,
          skills: formState.skills,
          availability: formState.availability,
          location_text: formState.locationText,
          lat: formState.lat,
          lng: formState.lng,
        },
        { onConflict: 'id' },
      );

      if (profileRes.error) {
        if (isAuthRateLimitError(profileRes.error.message)) {
          setSubmitBanner({ message: RATE_LIMIT_SOFT_MESSAGE, tone: 'pause' });
          return;
        }
        if (/permission denied for table|42501/i.test(profileRes.error.message)) {
          setSubmitBanner({
            message:
              'Your account must be signed in (confirmed email) before saving your profile. Confirm the Supabase email link if you have not, use “Already a volunteer?” on the home page to sign in, then complete registration again.',
            tone: 'pause',
          });
          return;
        }
        setSubmitBanner({ message: profileRes.error.message, tone: 'error' });
        return;
      }

      const { error } = await supabase.from('volunteers').upsert(
        {
          user_id: userId,
          name: formState.name.trim(),
          phone: formState.phone.trim(),
          skills: formState.skills,
          available: formState.availability === 'available',
          availability: formState.availability,
          lat: formState.lat,
          lng: formState.lng,
        },
        { onConflict: 'user_id' },
      );

      if (error) {
        if (isAuthRateLimitError(error.message)) {
          setSubmitBanner({ message: RATE_LIMIT_SOFT_MESSAGE, tone: 'pause' });
          return;
        }
        if (/permission denied for table|42501/i.test(error.message)) {
          setSubmitBanner({
            message:
              'Your account must be signed in (confirmed email) before saving your profile. Confirm the Supabase email link if you have not, use “Already a volunteer?” on the home page to sign in, then complete registration again.',
            tone: 'pause',
          });
          return;
        }
        setSubmitBanner({ message: error.message, tone: 'error' });
        return;
      }

      setSuccessMessage(
        "You're registered! Coordinators can now assign you to tasks."
      );

      window.setTimeout(() => {
        navigate('/volunteer/dashboard');
      }, 2000);
    } catch (caught) {
      setSubmitBanner({
        message:
          caught instanceof Error ? caught.message : 'Registration failed.',
        tone: 'error',
      });
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

      {submitBanner && (
        <div
          className={`mx-auto mb-4 flex max-w-[560px] gap-3 rounded-xl border px-4 py-3 text-sm backdrop-blur-sm ${
            submitBanner.tone === 'pause'
              ? 'border-amber-500/35 bg-amber-950/25 text-amber-100'
              : 'border-red-500/40 bg-red-950/40 text-red-300'
          }`}
          role={submitBanner.tone === 'pause' ? 'status' : 'alert'}
        >
          <p className="min-w-0 flex-1">{submitBanner.message}</p>
          <button
            type="button"
            className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-400 underline-offset-2 hover:underline"
            onClick={() => {
              setSubmitBanner(null);
            }}
          >
            Dismiss
          </button>
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
                <p className={labelClass}>
                  Location <span className="text-red-400">*</span>
                </p>
                <div
                  className="mb-3 grid grid-cols-2 gap-2"
                  role="tablist"
                  aria-label="Location entry method"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={locationMode === 'gps'}
                    onClick={() => handleLocationModeChange('gps')}
                    disabled={isSubmitting}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 ${
                      locationMode === 'gps'
                        ? 'border-cyan-400 bg-cyan-600/30 text-cyan-300'
                        : 'border-slate-600 bg-slate-800/40 text-slate-400 hover:border-slate-500'
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    Use GPS
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={locationMode === 'manual'}
                    onClick={() => handleLocationModeChange('manual')}
                    disabled={isSubmitting}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 ${
                      locationMode === 'manual'
                        ? 'border-cyan-400 bg-cyan-600/30 text-cyan-300'
                        : 'border-slate-600 bg-slate-800/40 text-slate-400 hover:border-slate-500'
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    Enter manually
                  </button>
                </div>

                {locationMode === 'gps' ? (
                  <div role="tabpanel" className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        id={`${baseId}-location`}
                        type="text"
                        readOnly
                        value={formState.locationText}
                        placeholder="Tap Use GPS to capture coordinates"
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
                    {formState.lat !== null && formState.lng !== null && (
                      <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-950/20 px-3 py-2 text-xs text-green-300">
                        <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-green-400" />
                        <span className="font-mono">
                          {formState.lat.toFixed(5)}, {formState.lng.toFixed(5)}
                        </span>
                        <button
                          type="button"
                          onClick={handleUseGps}
                          disabled={locationLoading}
                          className="ml-auto text-[11px] font-medium text-green-400 underline-offset-2 hover:underline disabled:opacity-50"
                        >
                          Refresh
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-slate-500">
                      Allow location access when prompted. Tap again to get a fresh GPS reading.
                    </p>
                  </div>
                ) : (
                  <div role="tabpanel" className="space-y-3">
                    <div>
                      <label htmlFor={`${baseId}-manual-city`} className="mb-1 block text-xs text-slate-300">
                        City / nearest area <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id={`${baseId}-manual-city`}
                          value={manualCityId}
                          onChange={(e) =>
                            handleManualCityChange(e.target.value as VolunteerAreaId | '')
                          }
                          disabled={isSubmitting}
                          className={`${inputClass} appearance-none pr-10`}
                          aria-invalid={Boolean(fieldErrors.location)}
                        >
                          <option value="" className="bg-slate-900">
                            Select your area
                          </option>
                          {VOLUNTEER_AREA_OPTIONS.map((area) => (
                            <option key={area.id} value={area.id} className="bg-slate-900">
                              {area.label}
                            </option>
                          ))}
                        </select>
                        <svg
                          className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          aria-hidden
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <label htmlFor={`${baseId}-manual-landmark`} className="mb-1 block text-xs text-slate-300">
                        Street, landmark, or neighborhood <span className="text-red-400">*</span>
                      </label>
                      <input
                        id={`${baseId}-manual-landmark`}
                        type="text"
                        value={manualLandmark}
                        onChange={(e) => handleManualLandmarkChange(e.target.value)}
                        disabled={isSubmitting}
                        placeholder="e.g. Near Wellawatte junction"
                        className={inputClass}
                        aria-invalid={Boolean(fieldErrors.location)}
                      />
                    </div>
                    {formState.locationText && formState.lat !== null && formState.lng !== null && (
                      <p className="text-xs text-cyan-400/90">
                        Map pin: {formState.locationText} ({formState.lat.toFixed(4)},{' '}
                        {formState.lng.toFixed(4)})
                      </p>
                    )}
                    <p className="text-xs text-slate-500">
                      No GPS needed — we use your area center for dispatch until coordinators
                      confirm exact placement.
                    </p>
                  </div>
                )}

                {fieldErrors.location && (
                  <p className={`${errorClass} mt-2`}>{fieldErrors.location}</p>
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
