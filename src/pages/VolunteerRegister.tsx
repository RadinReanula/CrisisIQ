<<<<<<< HEAD
<<<<<<< Updated upstream
=======
>>>>>>> a8e3a1b2155b2765503d2e073b0842895c8d039b
import { VolunteerRegistrationForm } from '../components/public/VolunteerRegistrationForm';
import { PageBackground } from '../components/public/PageBackground';
import '../index.css';

function VolunteerRegister() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0f1e] font-sans text-white">
      <PageBackground />
      <div className="relative z-10">
        <VolunteerRegistrationForm />
      </div>
    </main>
  );
}

<<<<<<< HEAD
=======
import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import {
  getVolunteerProfileByAuthUser,
  registerVolunteer,
  supabase,
} from '../services/supabase';
import type { VolunteerSkill } from '../types';
import styles from './VolunteerRegister.module.scss';

const VOLUNTEER_SKILL_OPTIONS: { value: VolunteerSkill; label: string }[] = [
  { value: 'medical', label: 'Medical' },
  { value: 'driving', label: 'Driving / transport' },
  { value: 'cooking', label: 'Cooking / meals' },
  { value: 'rescue', label: 'Search & rescue' },
  { value: 'translation', label: 'Translation' },
  { value: 'logistics', label: 'Logistics / supply' },
];

type AvailabilityChoice = 'standby' | 'now';

function availabilityChoiceToBoolean(choice: AvailabilityChoice): boolean {
  return choice === 'now';
}

type BootstrapState = 'loading' | 'ready' | 'error';

async function shouldStayOnRegisterPage(
  session: Session | null,
  navigate: ReturnType<typeof useNavigate>,
): Promise<boolean> {
  if (!session?.user) {
    return true;
  }

  if (session.user.user_metadata?.role === 'coordinator') {
    navigate('/coordinator', { replace: true });
    return false;
  }

  const profile = await getVolunteerProfileByAuthUser(session.user.id);

  if (profile) {
    navigate('/volunteer/dashboard', { replace: true });
    return false;
  }

  return true;
}

function parseCoordinate(raw: string, kind: 'lat' | 'lng'): number | null {
  const trimmed = raw.trim().replace(',', '.');
  if (!trimmed) return null;

  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;

  if (kind === 'lat' && (n < -90 || n > 90)) return null;
  if (kind === 'lng' && (n < -180 || n > 180)) return null;

  return n;
}

function VolunteerRegister() {
  const navigate = useNavigate();
  const { user, isCoordinator } = useAppContext();
  const [bootstrap, setBootstrap] = useState<BootstrapState>('loading');
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessHint, setAuthSuccessHint] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');
  const [phone, setPhone] = useState('');
  const [skillSet, setSkillSet] = useState<Partial<Record<VolunteerSkill, boolean>>>({});
  const [availability, setAvailability] = useState<AvailabilityChoice>('standby');
  const [registerBusy, setRegisterBusy] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [fieldHints, setFieldHints] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function hydrateFrom(session: Session | null) {
      if (!session?.user) {
        if (!cancelled) {
          setBootstrapError(null);
          setBootstrap('ready');
        }
        return;
      }

      try {
        const stay = await shouldStayOnRegisterPage(session, navigate);

        if (cancelled) return;

        if (stay) {
          setBootstrapError(null);
          setBootstrap('ready');
        }
      } catch {
        if (!cancelled) {
          setBootstrapError('Something went wrong while checking your account.');
          setBootstrap('error');
        }
      }
    }

    setBootstrap('loading');

    void supabase.auth.getSession().then(({ data }) => {
      void hydrateFrom(data.session ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_evt, session) => {
      void hydrateFrom(session);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [navigate, reloadKey]);

  const toggleSkill = useCallback((skill: VolunteerSkill, checked: boolean) => {
    setSkillSet((prev) => ({ ...prev, [skill]: checked }));
  }, []);

  const handleAuthSubmit = useCallback(async () => {
    setAuthError(null);
    setAuthSuccessHint(null);
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setAuthError('Enter email and password to continue.');
      return;
    }

    setAuthBusy(true);

    try {
      if (authMode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (error) {
          setAuthError(error.message || 'Sign-in failed.');
          return;
        }
      } else {
        const { error, data } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
        });

        if (error) {
          setAuthError(error.message || 'Account creation failed.');
          return;
        }

        if (!data.session && data.user) {
          setAuthSuccessHint(
            'Confirm your email if prompted — then sign in below to finish registration.',
          );
        }
      }
    } finally {
      setAuthBusy(false);
    }
  }, [authMode, email, password]);

  const validateRegistration = useCallback(() => {
    const hints: string[] = [];
    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      hints.push('Enter your full name.');
    }

    const lat = parseCoordinate(latInput, 'lat');
    const lng = parseCoordinate(lngInput, 'lng');

    if (lat === null) {
      hints.push('Latitude must be between -90 and 90.');
    }
    if (lng === null) {
      hints.push('Longitude must be between -180 and 180.');
    }

    const skills = (Object.entries(skillSet) as [VolunteerSkill, boolean][])
      .filter(([, on]) => on)
      .map(([skill]) => skill);

    if (skills.length === 0) {
      hints.push('Select at least one skill coordinators can rely on.');
    }

    setFieldHints(hints);

    return { ok: hints.length === 0, trimmedName, lat, lng, skills };
  }, [latInput, lngInput, name, skillSet]);

  const handleVolunteerSubmit = useCallback(async () => {
    setRegisterError(null);

    if (!user) {
      setRegisterError('You need to sign in before completing registration.');
      return;
    }

    const isVolunteerCoordinator = user.user_metadata?.role === 'coordinator';

    if (isVolunteerCoordinator) {
      navigate('/coordinator', { replace: true });
      return;
    }

    const result = validateRegistration();
    if (!result.ok || result.lat === null || result.lng === null) return;

    setRegisterBusy(true);

    try {
      const trimmedPhone = phone.trim();
      const inserted = await registerVolunteer({
        user_id: user.id,
        name: result.trimmedName,
        lat: result.lat,
        lng: result.lng,
        skills: result.skills,
        available: availabilityChoiceToBoolean(availability),
        phone: trimmedPhone.length > 0 ? trimmedPhone : undefined,
      });

      if (!inserted) {
        setRegisterError(
          'Unable to save your profile. Double-check coordinates and permissions, then try again.',
        );
        return;
      }

      navigate('/volunteer/dashboard', { replace: true });
    } finally {
      setRegisterBusy(false);
    }
  }, [availability, navigate, phone, user, validateRegistration]);

  const handleRetryBootstrap = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  if (bootstrap === 'error') {
    return (
      <main className={styles.page}>
        <div className={styles.inner}>
          <div className={styles.title}>Volunteer registration</div>
          <p className={styles.intro} id="bootstrap-error-intro">
            We could not verify your CrisisIQ volunteer session right now.
          </p>
            <div role="alert" aria-labelledby="bootstrap-error-intro" className={styles.errorBanner}>
              {bootstrapError ??
                'We could not verify your CrisisIQ volunteer session right now.'}
            </div>
          <div className={styles.retryRow}>
            <button type="button" className={styles.secondaryButton} onClick={handleRetryBootstrap}>
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (bootstrap === 'loading') {
    return (
      <main className={styles.page} aria-busy="true" aria-live="polite">
        <div className={styles.inner}>
          <div className={styles.title}>Volunteer registration</div>
          <p className={styles.intro}>Loading your CrisisIQ volunteer session.</p>
          <div className={styles.skeletonWrap}>
            <div className={styles.skeletonBar} />
            <div className={styles.skeletonBar} />
            <div className={`${styles.skeletonBar} ${styles.skeletonShort}`} />
          </div>
        </div>
      </main>
    );
  }

  if (user && isCoordinator) {
    return <Navigate to="/coordinator" replace />;
  }

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.title}>Volunteer registration</h1>
        <p className={styles.intro}>
          Create an account, then confirm how you appear on the responder map — including whether
          you are on standby or available for assignment right now.
        </p>

        {!user ? (
          <section aria-labelledby="volunteer-auth-heading">
            <h2 id="volunteer-auth-heading" className="sr-only">
              Sign in or create volunteer account
            </h2>
            <div className={styles.authModes} role="group" aria-label="Account action">
              <button
                type="button"
                className={styles.modeButton}
                data-active={authMode === 'signin'}
                onClick={() => {
                  setAuthMode('signin');
                  setAuthError(null);
                }}
              >
                Sign in
              </button>
              <button
                type="button"
                className={styles.modeButton}
                data-active={authMode === 'signup'}
                onClick={() => {
                  setAuthMode('signup');
                  setAuthError(null);
                }}
              >
                Create account
              </button>
            </div>

            {authError && (
              <div role="alert" className={styles.errorBanner}>
                {authError}
              </div>
            )}
            {authSuccessHint && <p className={styles.intro}>{authSuccessHint}</p>}

            <form
              onSubmit={(evt) => {
                evt.preventDefault();
                void handleAuthSubmit();
              }}
            >
              <div className={styles.fieldGroup}>
                <label htmlFor="volunteer-email" className={styles.sectionLabel}>
                  Email
                </label>
                <input
                  id="volunteer-email"
                  className={styles.textInput}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(evt) => {
                    setEmail(evt.target.value);
                  }}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="volunteer-password" className={styles.sectionLabel}>
                  Password
                </label>
                <input
                  id="volunteer-password"
                  className={styles.textInput}
                  type="password"
                  autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(evt) => {
                    setPassword(evt.target.value);
                  }}
                />
              </div>

              <button
                type="submit"
                className={`${styles.primaryButton} ${styles.submitSpacer}`}
                disabled={authBusy}
              >
                {authBusy ? 'Working…' : authMode === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            </form>
          </section>
        ) : (
          <section aria-labelledby="volunteer-details-heading">
            <h2 id="volunteer-details-heading" className="sr-only">
              Volunteer profile details
            </h2>

            {registerError && (
              <div role="alert" className={styles.errorBanner}>
                {registerError}
              </div>
            )}

            {fieldHints.length > 0 && (
              <div role="alert" className={styles.errorBanner}>
                <ul className={styles.hintList}>
                  {fieldHints.map((hint) => (
                    <li key={hint}>{hint}</li>
                  ))}
                </ul>
              </div>
            )}

            <form
              onSubmit={(evt) => {
                evt.preventDefault();
                void handleVolunteerSubmit();
              }}
            >
              <div className={styles.fieldGroup}>
                <label htmlFor="volunteer-display-name" className={styles.sectionLabel}>
                  Full name
                </label>
                <input
                  id="volunteer-display-name"
                  className={styles.textInput}
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(evt) => {
                    setName(evt.target.value);
                  }}
                />
              </div>

              <fieldset className={styles.fieldGroup}>
                <legend className={styles.sectionLabel}>Rough location coordinates</legend>
                <p className={styles.help}>
                  Used by coordinators nearby. Paste values from Maps or GPS (decimal degrees).
                </p>

                <div className={styles.fieldGroup}>
                  <label htmlFor="volunteer-lat" className={styles.sectionLabel}>
                    Latitude
                  </label>
                  <input
                    id="volunteer-lat"
                    inputMode="decimal"
                    autoComplete="off"
                    required
                    className={styles.textInput}
                    value={latInput}
                    onChange={(evt) => {
                      setLatInput(evt.target.value);
                    }}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="volunteer-lng" className={styles.sectionLabel}>
                    Longitude
                  </label>
                  <input
                    id="volunteer-lng"
                    inputMode="decimal"
                    autoComplete="off"
                    required
                    className={styles.textInput}
                    value={lngInput}
                    onChange={(evt) => {
                      setLngInput(evt.target.value);
                    }}
                  />
                </div>
              </fieldset>

              <div className={styles.fieldGroup}>
                <label htmlFor="volunteer-phone" className={styles.sectionLabel}>
                  Phone (optional)
                </label>
                <input
                  id="volunteer-phone"
                  className={styles.textInput}
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(evt) => {
                    setPhone(evt.target.value);
                  }}
                />
              </div>

              <fieldset className={styles.fieldGroup}>
                <legend className={styles.sectionLabel}>Skills</legend>
                <div className={styles.checkboxGrid}>
                  {VOLUNTEER_SKILL_OPTIONS.map(({ value, label }) => (
                    <div key={value} className={styles.checkboxRow}>
                      <input
                        id={`skill-${value}`}
                        type="checkbox"
                        checked={Boolean(skillSet[value])}
                        onChange={(evt) => {
                          toggleSkill(value, evt.target.checked);
                        }}
                      />
                      <label htmlFor={`skill-${value}`}>{label}</label>
                    </div>
                  ))}
                </div>
              </fieldset>

              <fieldset className={styles.fieldGroup}>
                <legend className={styles.sectionLabel}>Availability</legend>
                <div className={styles.radioGroup}>
                  <div className={styles.radioRow}>
                    <input
                      id="avail-standby"
                      type="radio"
                      name="availability"
                      value="standby"
                      checked={availability === 'standby'}
                      onChange={() => {
                        setAvailability('standby');
                      }}
                    />
                    <div className={styles.radioInner}>
                      <label htmlFor="avail-standby">On standby</label>
                      <span className={styles.radioHint}>
                        Coordinators cannot assign you missions until you mark yourself available later.
                      </span>
                    </div>
                  </div>

                  <div className={styles.radioRow}>
                    <input
                      id="avail-now"
                      type="radio"
                      name="availability"
                      value="now"
                      checked={availability === 'now'}
                      onChange={() => {
                        setAvailability('now');
                      }}
                    />
                    <div className={styles.radioInner}>
                      <label htmlFor="avail-now">Available now</label>
                      <span className={styles.radioHint}>
                        You appear in the available responders list immediately after registration.
                      </span>
                    </div>
                  </div>
                </div>
              </fieldset>

              <button
                type="submit"
                className={`${styles.primaryButton} ${styles.submitSpacer}`}
                disabled={registerBusy}
              >
                {registerBusy ? 'Saving…' : 'Save volunteer profile'}
              </button>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}

>>>>>>> Stashed changes
=======
>>>>>>> a8e3a1b2155b2765503d2e073b0842895c8d039b
export default VolunteerRegister;
