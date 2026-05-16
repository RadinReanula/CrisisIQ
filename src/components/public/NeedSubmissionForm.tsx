import { useCallback, useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
<<<<<<< Updated upstream
import { AREA_OPTIONS, type AreaId } from '../../lib/areaOptions';
import type { NeedType } from '../../types';
=======
import type { NeedType, HelpRequestUrgency, NeedSubmissionPayload } from '../../types';
>>>>>>> Stashed changes
import { LoadingSpinner } from './LoadingSpinner';

export type { NeedSubmissionPayload };

const DESCRIPTION_MAX = 300;

const QUICK_TYPES: { label: string; value: NeedType; emphasis?: boolean }[] = [
  { label: 'Rescue', value: 'rescue', emphasis: true },
  { label: 'Medical', value: 'medical', emphasis: true },
  { label: 'Food', value: 'food' },
  { label: 'Shelter', value: 'shelter' },
  { label: 'Other', value: 'other' },
];

type UrgencyLevel = HelpRequestUrgency;

const URGENCY_OPTIONS: { label: string; value: UrgencyLevel }[] = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Critical', value: 'critical' },
];

const URGENCY_SELECTED: Record<UrgencyLevel, string> = {
  low: 'border-green-500 bg-green-600/30 text-green-400',
  medium: 'border-yellow-500 bg-yellow-600/30 text-yellow-400',
  high: 'border-orange-500 bg-orange-600/30 text-orange-400',
  critical:
    'border-red-500 bg-red-600/40 text-red-400 shadow-[0_0_16px_rgba(239,68,68,0.45)]',
};

<<<<<<< Updated upstream
type LocationMode = 'gps' | 'manual';

export interface NeedSubmissionPayload {
  name: string;
  contact: string;
  needType: NeedType;
  locationText: string;
  lat: number;
  lng: number;
  description: string;
  urgency: UrgencyLevel;
}

=======
>>>>>>> Stashed changes
export interface NeedSubmissionFormProps {
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: (payload: NeedSubmissionPayload) => void;
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

export function NeedSubmissionForm({
  isSubmitting,
  submitError,
  onSubmit,
}: NeedSubmissionFormProps) {
  const navigate = useNavigate();
  const baseId = useId();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [needType, setNeedType] = useState<NeedType>('rescue');
  const [locationText, setLocationText] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<UrgencyLevel>('high');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [locationMode, setLocationMode] = useState<LocationMode>('gps');
  const [manualCityId, setManualCityId] = useState<AreaId | ''>('');
  const [manualLandmark, setManualLandmark] = useState('');

  const descriptionLength = description.length;
  const counterNearLimit = descriptionLength > 280;

  const applyManualLocation = useCallback(() => {
    if (!manualCityId) return;
    const area = AREA_OPTIONS.find((a) => a.id === manualCityId);
    if (!area) return;
    setLat(area.lat);
    setLng(area.lng);
    const landmark = manualLandmark.trim();
    setLocationText(
      landmark ? `${landmark}, ${area.label}` : area.label,
    );
    setLocationMessage(`Location set to ${area.label}${landmark ? ` — ${landmark}` : ''}.`);
  }, [manualCityId, manualLandmark]);

  const handleUseLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationMessage('Geolocation is not supported. Use manual location instead.');
      return;
    }

    setLocationLoading(true);
    setLocationMessage(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setLocationLoading(false);
        setLocationMessage('GPS location captured.');
      },
      (err) => {
        setLocationLoading(false);
        const message =
          err.code === err.PERMISSION_DENIED
            ? 'Location denied. Switch to manual location or describe your area below.'
            : 'Could not get GPS. Try manual location.';
        setLocationMessage(message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }, []);

  const validateStep1 = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    if (!locationText.trim()) errors.locationText = 'Describe where you are.';
    if (lat === null || lng === null) {
      errors.location =
        locationMode === 'gps'
          ? 'Capture GPS or switch to manual city selection.'
          : 'Select your city and tap apply location.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [locationText, lat, lng, locationMode]);

  const validateStep2 = useCallback((): boolean => {
    setFieldErrors({});
    return true;
  }, []);

  const validateStep3 = useCallback((): NeedSubmissionPayload | null => {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'Name is required.';
    if (!contact.trim()) errors.contact = 'Contact number is required.';
    if (!description.trim()) errors.description = 'Description is required.';
    if (description.length > DESCRIPTION_MAX) {
      errors.description = `Max ${DESCRIPTION_MAX} characters.`;
    }
    if (lat === null || lng === null) {
      errors.location = 'Go back and set your location.';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return null;

    return {
      name: name.trim(),
      contact: contact.trim(),
      needType,
      locationText: locationText.trim(),
      lat: lat as number,
      lng: lng as number,
      description: description.trim(),
      urgency,
    };
  }, [name, contact, needType, locationText, lat, lng, description, urgency]);

  const inputClass =
    'w-full min-h-[48px] rounded-xl border border-slate-600 bg-slate-800/60 p-3 text-white transition-all duration-300 placeholder:text-slate-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/50 disabled:cursor-not-allowed disabled:opacity-60';
  const labelClass = 'mb-1 block text-sm text-white';
  const errorClass = 'mt-1 text-sm text-red-400';

  const stepLabels = ['Location', 'Type & urgency', 'Your details'];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-12 pt-2 sm:px-6 lg:px-8">
      <header className="relative mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex min-h-[44px] items-center gap-1 text-sm font-medium text-slate-400 hover:text-white"
          aria-label="Back to home"
        >
          <span aria-hidden>←</span>
          <span className="hidden sm:inline">Back</span>
        </button>
        <span className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-red-500">
          CrisisIQ
        </span>
        <span className="text-xs font-medium text-slate-500">
          Step {step} of 3
        </span>
      </header>

      <div className="mb-6 flex justify-center gap-2" aria-label="Form progress">
        {stepLabels.map((label, i) => {
          const n = (i + 1) as 1 | 2 | 3;
          const active = step === n;
          const done = step > n;
          return (
            <div key={label} className="flex flex-col items-center gap-1">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  done
                    ? 'bg-emerald-600/40 text-emerald-300'
                    : active
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-700 text-slate-400'
                }`}
              >
                {done ? '✓' : n}
              </span>
              <span className="hidden text-[10px] text-slate-500 sm:block">{label}</span>
            </div>
          );
        })}
      </div>

      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Request Emergency Help</h1>
        <p className="mt-2 text-sm text-slate-400">
          {step === 1 && 'Where are you? Accurate location helps responders find you.'}
          {step === 2 && 'What kind of help do you need?'}
          {step === 3 && 'How can coordinators reach you?'}
        </p>
      </div>

      <p className="mx-auto mb-4 max-w-[560px] rounded-lg border border-red-800/40 bg-red-950/30 px-3 py-2 text-center text-xs text-red-200/90">
        Immediate danger? Call{' '}
        <a href="tel:119" className="font-bold underline">
          119
        </a>{' '}
        first, then submit here.
      </p>

      {submitError && (
        <div
          className="mx-auto mb-4 max-w-[560px] rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-300"
          role="alert"
        >
          {submitError}
        </div>
      )}

      <div className="mx-auto max-w-[560px] rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-[20px] sm:p-8">
        {step === 1 && (
          <div className="space-y-5">
            <div className="flex gap-2 rounded-xl border border-slate-700/50 bg-slate-900/40 p-1">
              <button
                type="button"
                onClick={() => setLocationMode('gps')}
                className={`min-h-[44px] flex-1 rounded-lg text-sm font-medium transition-colors ${
                  locationMode === 'gps'
                    ? 'bg-red-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Use GPS
              </button>
              <button
                type="button"
                onClick={() => setLocationMode('manual')}
                className={`min-h-[44px] flex-1 rounded-lg text-sm font-medium transition-colors ${
                  locationMode === 'manual'
                    ? 'bg-red-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Enter manually
              </button>
            </div>

            {locationMode === 'gps' ? (
              <>
                <div>
                  <label htmlFor={`${baseId}-location`} className={labelClass}>
                    Area description <span className="text-red-400">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      id={`${baseId}-location`}
                      type="text"
                      value={locationText}
                      onChange={(e) => setLocationText(e.target.value)}
                      disabled={isSubmitting}
                      className={`${inputClass} min-w-0 flex-1`}
                      placeholder="e.g. Near Wellawatte junction"
                    />
                    <button
                      type="button"
                      onClick={handleUseLocation}
                      disabled={isSubmitting || locationLoading}
                      className="flex min-h-[48px] shrink-0 items-center justify-center rounded-xl border border-slate-600 bg-slate-700 px-3 text-cyan-400 hover:bg-slate-600 disabled:opacity-60"
                      aria-label="Use GPS"
                    >
                      <MapPinIcon />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label htmlFor={`${baseId}-city`} className={labelClass}>
                    Nearest city <span className="text-red-400">*</span>
                  </label>
                  <select
                    id={`${baseId}-city`}
                    value={manualCityId}
                    onChange={(e) => setManualCityId(e.target.value as AreaId | '')}
                    className={`${inputClass} appearance-none`}
                  >
                    <option value="">Select city…</option>
                    {AREA_OPTIONS.map((a) => (
                      <option key={a.id} value={a.id} className="bg-slate-900">
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor={`${baseId}-landmark`} className={labelClass}>
                    Landmark / street
                  </label>
                  <input
                    id={`${baseId}-landmark`}
                    type="text"
                    value={manualLandmark}
                    onChange={(e) => setManualLandmark(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Temple road, 2nd floor"
                  />
                </div>
                <button
                  type="button"
                  onClick={applyManualLocation}
                  disabled={!manualCityId || isSubmitting}
                  className="w-full min-h-[48px] rounded-xl border border-cyan-600/50 bg-cyan-950/40 text-sm font-medium text-cyan-300 hover:bg-cyan-900/40 disabled:opacity-50"
                >
                  Apply this location
                </button>
              </>
            )}

            {fieldErrors.locationText && (
              <p className={errorClass}>{fieldErrors.locationText}</p>
            )}
            {fieldErrors.location && <p className={errorClass}>{fieldErrors.location}</p>}
            {locationMessage && (
              <p className="text-xs text-slate-400">{locationMessage}</p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <fieldset>
              <legend className={labelClass}>Type of need</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {QUICK_TYPES.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setNeedType(opt.value)}
                    className={`min-h-[48px] rounded-xl border px-2 py-2 text-sm font-medium transition-all ${
                      needType === opt.value
                        ? opt.emphasis
                          ? 'border-red-500 bg-red-600/30 text-red-200'
                          : 'border-cyan-500 bg-cyan-600/20 text-cyan-200'
                        : 'border-slate-600 bg-slate-800/40 text-slate-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className={labelClass}>Urgency</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {URGENCY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setUrgency(opt.value)}
                    className={`min-h-[48px] rounded-xl border px-2 py-2 text-sm font-medium ${
                      urgency === opt.value
                        ? URGENCY_SELECTED[opt.value]
                        : 'border-slate-600 bg-slate-800/40 text-slate-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <label htmlFor={`${baseId}-name`} className={labelClass}>
                Your name <span className="text-red-400">*</span>
              </label>
              <input
                id={`${baseId}-name`}
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                className={inputClass}
              />
              {fieldErrors.name && <p className={errorClass}>{fieldErrors.name}</p>}
            </div>
            <div>
              <label htmlFor={`${baseId}-contact`} className={labelClass}>
                Phone <span className="text-red-400">*</span>
              </label>
              <input
                id={`${baseId}-contact`}
                type="tel"
                inputMode="tel"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                disabled={isSubmitting}
                className={inputClass}
                placeholder="+94 7X XXX XXXX"
              />
              {fieldErrors.contact && <p className={errorClass}>{fieldErrors.contact}</p>}
            </div>
            <div>
              <label htmlFor={`${baseId}-description`} className={labelClass}>
                What happened? <span className="text-red-400">*</span>
              </label>
              <textarea
                id={`${baseId}-description`}
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value.slice(0, DESCRIPTION_MAX))
                }
                rows={4}
                className={`${inputClass} resize-none`}
                placeholder="Who needs help? Any medical details?"
              />
              <p className="mt-1 text-right text-xs text-slate-500">
                {descriptionLength}/{DESCRIPTION_MAX}
                {counterNearLimit && ' — almost full'}
              </p>
              {fieldErrors.description && (
                <p className={errorClass}>{fieldErrors.description}</p>
              )}
            </div>
            {fieldErrors.location && (
              <p className={errorClass}>{fieldErrors.location}</p>
            )}
          </div>
        )}

        <div className="mt-8 flex gap-3">
          {step > 1 && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
              className="min-h-[48px] flex-1 rounded-xl border border-slate-600 py-3 text-slate-300 hover:text-white disabled:opacity-50"
            >
              Back
            </button>
          )}
          {step < 3 ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                if (step === 1 && validateStep1()) setStep(2);
                else if (step === 2 && validateStep2()) setStep(3);
              }}
              className="min-h-[48px] flex-[2] rounded-xl bg-red-600 py-3 font-semibold text-white hover:bg-red-500 disabled:opacity-60"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                const payload = validateStep3();
                if (payload) onSubmit(payload);
              }}
              className="flex min-h-[48px] flex-[2] items-center justify-center gap-2 rounded-xl bg-red-600 py-3 font-semibold text-white hover:bg-red-500 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner />
                  Submitting…
                </>
              ) : (
                'Submit request'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
