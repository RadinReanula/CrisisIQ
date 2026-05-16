import { useCallback, useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { NeedType } from '../../types';
import { LoadingSpinner } from './LoadingSpinner';

const DESCRIPTION_MAX = 300;

const NEED_TYPE_OPTIONS: { label: string; value: NeedType }[] = [
  { label: 'Food', value: 'food' },
  { label: 'Medical', value: 'medical' },
  { label: 'Shelter', value: 'shelter' },
  { label: 'Rescue', value: 'rescue' },
  { label: 'Other', value: 'other' },
];

type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

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
    'animate-pulse border-red-500 bg-red-600/40 text-red-400 shadow-[0_0_16px_rgba(239,68,68,0.45)]',
};

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

export interface NeedSubmissionFormProps {
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: (payload: NeedSubmissionPayload) => void;
}

function ChevronDownIcon() {
  return (
    <svg
      className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  );
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

  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [needType, setNeedType] = useState<NeedType>('other');
  const [locationText, setLocationText] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<UrgencyLevel>('medium');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  const descriptionLength = description.length;
  const counterNearLimit = descriptionLength > 280;

  const handleUseLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationMessage('Geolocation is not supported on this device.');
      return;
    }

    setLocationLoading(true);
    setLocationMessage(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setLocationLoading(false);
        setLocationMessage(
          `Location captured (${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)})`
        );
      },
      (err) => {
        setLocationLoading(false);
        const message =
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied. Allow access or enter your area in the location field.'
            : 'Could not get your location. Try again or describe your location below.';
        setLocationMessage(message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }, []);

  const validate = useCallback((): NeedSubmissionPayload | null => {
    const errors: Record<string, string> = {};

    if (!name.trim()) errors.name = 'Name is required.';
    if (!contact.trim()) errors.contact = 'Contact number is required.';
    if (!locationText.trim()) errors.locationText = 'Location is required.';
    if (lat === null || lng === null) {
      errors.location =
        'Tap "Use my location" so responders can find you on the map.';
    }
    if (!description.trim()) errors.description = 'Description is required.';
    if (description.length > DESCRIPTION_MAX) {
      errors.description = `Description must be ${DESCRIPTION_MAX} characters or fewer.`;
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

  const handleSubmitClick = useCallback(() => {
    const payload = validate();
    if (payload) onSubmit(payload);
  }, [validate, onSubmit]);

  const inputClass =
    'w-full rounded-xl border border-slate-600 bg-slate-800/60 p-3 text-white transition-all duration-300 placeholder:text-slate-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/50 disabled:cursor-not-allowed disabled:opacity-60';
  const labelClass = 'mb-1 block text-sm text-white';
  const errorClass = 'mt-1 text-sm text-red-400';

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <header className="relative mb-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-sm font-medium text-slate-400 transition-all duration-300 hover:text-white"
          aria-label="Back to home"
        >
          <span aria-hidden>←</span>
          <span className="hidden sm:inline">Back</span>
        </button>
        <span className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-red-500">
          CrisisIQ
        </span>
        <span className="text-xs font-medium text-slate-500">Step 1 of 1</span>
      </header>

      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white">Request Emergency Help</h1>
        <p className="mt-2 text-slate-400">
          Fill in the details below. Your request goes live instantly.
        </p>
      </div>

      {submitError && (
        <div
          className="mx-auto mb-4 max-w-[560px] rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-300 backdrop-blur-sm"
          role="alert"
        >
          {submitError}
        </div>
      )}

      <div
        className="mx-auto max-w-[560px] rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-[20px]"
      >
        <div className="space-y-5">
          <div>
            <label htmlFor={`${baseId}-name`} className={labelClass}>
              Your Name <span className="text-red-400">*</span>
            </label>
            <input
              id={`${baseId}-name`}
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              className={inputClass}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={
                fieldErrors.name ? `${baseId}-name-err` : undefined
              }
            />
            {fieldErrors.name && (
              <p id={`${baseId}-name-err`} className={errorClass}>
                {fieldErrors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor={`${baseId}-contact`} className={labelClass}>
              Contact Number <span className="text-red-400">*</span>
            </label>
            <input
              id={`${baseId}-contact`}
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              disabled={isSubmitting}
              className={inputClass}
              placeholder="+94 7X XXX XXXX"
              aria-invalid={Boolean(fieldErrors.contact)}
              aria-describedby={
                fieldErrors.contact ? `${baseId}-contact-err` : undefined
              }
            />
            {fieldErrors.contact && (
              <p id={`${baseId}-contact-err`} className={errorClass}>
                {fieldErrors.contact}
              </p>
            )}
          </div>

          <div>
            <label htmlFor={`${baseId}-type`} className={labelClass}>
              Type of Need <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <select
                id={`${baseId}-type`}
                value={needType}
                onChange={(e) => setNeedType(e.target.value as NeedType)}
                disabled={isSubmitting}
                className={`${inputClass} appearance-none pr-10`}
              >
                {NEED_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-slate-900">
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon />
            </div>
          </div>

          <div>
            <label htmlFor={`${baseId}-location`} className={labelClass}>
              Location <span className="text-red-400">*</span>
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
                aria-invalid={Boolean(
                  fieldErrors.locationText || fieldErrors.location
                )}
              />
              <button
                type="button"
                onClick={handleUseLocation}
                disabled={isSubmitting || locationLoading}
                className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-600 bg-slate-700 px-3 py-3 text-cyan-400 transition-all duration-300 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Use my GPS location"
              >
                <MapPinIcon />
              </button>
            </div>
            {fieldErrors.locationText && (
              <p className={errorClass}>{fieldErrors.locationText}</p>
            )}
            {fieldErrors.location && (
              <p className={errorClass}>{fieldErrors.location}</p>
            )}
            {locationMessage && (
              <p className="mt-1 text-xs text-slate-400">{locationMessage}</p>
            )}
            <input type="hidden" value={lat ?? ''} readOnly aria-hidden />
            <input type="hidden" value={lng ?? ''} readOnly aria-hidden />
          </div>

          <div>
            <label htmlFor={`${baseId}-description`} className={labelClass}>
              Description <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <textarea
                id={`${baseId}-description`}
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value.slice(0, DESCRIPTION_MAX))
                }
                disabled={isSubmitting}
                rows={3}
                maxLength={DESCRIPTION_MAX}
                className={`${inputClass} resize-none pb-8`}
                placeholder="What happened? Who needs help?"
                aria-invalid={Boolean(fieldErrors.description)}
              />
              <span
                className={`pointer-events-none absolute bottom-3 right-3 text-xs ${
                  counterNearLimit ? 'font-medium text-red-400' : 'text-slate-400'
                }`}
                aria-live="polite"
              >
                {descriptionLength} / {DESCRIPTION_MAX}
              </span>
            </div>
            {fieldErrors.description && (
              <p className={errorClass}>{fieldErrors.description}</p>
            )}
          </div>

          <fieldset className="space-y-2">
            <legend className={labelClass}>
              Urgency Level <span className="text-red-400">*</span>
            </legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {URGENCY_OPTIONS.map((opt) => {
                const isSelected = urgency === opt.value;
                const basePill =
                  'rounded-xl border px-2 py-2.5 text-center text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0f1e]';
                const unselected =
                  'border-slate-600 bg-slate-800/40 text-slate-400 hover:border-slate-500';
                const selected = URGENCY_SELECTED[opt.value];

                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setUrgency(opt.value)}
                    disabled={isSubmitting}
                    className={`${basePill} ${
                      isSelected ? selected : unselected
                    } ${isSubmitting ? 'cursor-not-allowed opacity-60' : ''}`}
                    aria-pressed={isSelected}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <button
            type="button"
            onClick={handleSubmitClick}
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 p-4 text-lg font-semibold text-white transition-all duration-300 hover:scale-105 hover:bg-red-500 hover:shadow-[0_0_28px_rgba(239,68,68,0.45)] focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:cursor-not-allowed disabled:scale-100 disabled:bg-red-600/60 disabled:shadow-none"
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner />
                Submitting...
              </>
            ) : (
              'Submit request'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
