import { useCallback, useId, useState } from 'react';
import type { NeedType } from '../../types';

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

export function NeedSubmissionForm({
  isSubmitting,
  submitError,
  onSubmit,
}: NeedSubmissionFormProps) {
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

  const descriptionRemaining = DESCRIPTION_MAX - description.length;

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
    'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30';
  const labelClass = 'block text-sm font-medium text-slate-800';
  const errorClass = 'mt-1 text-sm text-red-600';

  return (
    <div className="mx-auto w-full max-w-md space-y-5 px-4 py-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Request help
        </h1>
        <p className="text-sm text-slate-600">
          No account needed. Tell us what you need and we will coordinate
          responders.
        </p>
      </header>

      {submitError && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800"
          role="alert"
        >
          {submitError}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor={`${baseId}-name`} className={labelClass}>
            Name <span className="text-red-600">*</span>
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
            Contact number <span className="text-red-600">*</span>
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
            Type of need <span className="text-red-600">*</span>
          </label>
          <select
            id={`${baseId}-type`}
            value={needType}
            onChange={(e) => setNeedType(e.target.value as NeedType)}
            disabled={isSubmitting}
            className={inputClass}
          >
            {NEED_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`${baseId}-location`} className={labelClass}>
            Location <span className="text-red-600">*</span>
          </label>
          <input
            id={`${baseId}-location`}
            type="text"
            value={locationText}
            onChange={(e) => setLocationText(e.target.value)}
            disabled={isSubmitting}
            className={inputClass}
            placeholder="e.g. Near Wellawatte junction"
            aria-invalid={Boolean(
              fieldErrors.locationText || fieldErrors.location
            )}
          />
          {fieldErrors.locationText && (
            <p className={errorClass}>{fieldErrors.locationText}</p>
          )}
          {fieldErrors.location && (
            <p className={errorClass}>{fieldErrors.location}</p>
          )}

          <button
            type="button"
            onClick={handleUseLocation}
            disabled={isSubmitting || locationLoading}
            className="mt-2 w-full rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm font-medium text-blue-800 transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {locationLoading ? 'Getting location…' : 'Use my location'}
          </button>
          {locationMessage && (
            <p className="mt-1 text-xs text-slate-600">{locationMessage}</p>
          )}
          <input type="hidden" value={lat ?? ''} readOnly aria-hidden />
          <input type="hidden" value={lng ?? ''} readOnly aria-hidden />
        </div>

        <div>
          <label htmlFor={`${baseId}-description`} className={labelClass}>
            Description <span className="text-red-600">*</span>
          </label>
          <textarea
            id={`${baseId}-description`}
            value={description}
            onChange={(e) =>
              setDescription(e.target.value.slice(0, DESCRIPTION_MAX))
            }
            disabled={isSubmitting}
            rows={4}
            maxLength={DESCRIPTION_MAX}
            className={inputClass}
            placeholder="What happened? Who needs help?"
            aria-invalid={Boolean(fieldErrors.description)}
          />
          <div className="mt-1 flex justify-between text-xs text-slate-500">
            <span>
              {fieldErrors.description && (
                <span className="text-red-600">{fieldErrors.description}</span>
              )}
            </span>
            <span
              className={
                descriptionRemaining < 30 ? 'font-medium text-amber-600' : ''
              }
            >
              {descriptionRemaining} characters left
            </span>
          </div>
        </div>

        <fieldset className="space-y-2">
          <legend className={labelClass}>
            Urgency level <span className="text-red-600">*</span>
          </legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {URGENCY_OPTIONS.map((opt) => {
              const isCritical = opt.value === 'critical';
              const isSelected = urgency === opt.value;
              const ringClass = isSelected
                ? isCritical
                  ? 'border-red-600 bg-red-50 ring-2 ring-red-500'
                  : 'border-blue-600 bg-blue-50 ring-2 ring-blue-500'
                : 'border-slate-300 bg-white hover:border-slate-400';

              return (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-center justify-center rounded-lg border px-2 py-2.5 text-center text-sm font-medium transition focus-within:ring-2 focus-within:ring-offset-2 ${
                    isCritical
                      ? `text-red-800 focus-within:ring-red-500 ${ringClass}`
                      : `text-slate-800 focus-within:ring-blue-500 ${ringClass}`
                  } ${isSubmitting ? 'pointer-events-none opacity-60' : ''}`}
                >
                  <input
                    type="radio"
                    name={`${baseId}-urgency`}
                    value={opt.value}
                    checked={isSelected}
                    onChange={() => setUrgency(opt.value)}
                    disabled={isSubmitting}
                    className="sr-only"
                  />
                  {opt.label}
                </label>
              );
            })}
          </div>
        </fieldset>

        <button
          type="button"
          onClick={handleSubmitClick}
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {isSubmitting ? (
            <>
              <LoadingSpinnerInline />
              Submitting…
            </>
          ) : (
            'Submit request'
          )}
        </button>
      </div>
    </div>
  );
}

function LoadingSpinnerInline() {
  return (
    <span
      className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"
      aria-hidden
    />
  );
}
