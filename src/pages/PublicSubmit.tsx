import { useCallback, useEffect, useState } from 'react';
import {
  NeedSubmissionForm,
  type NeedSubmissionPayload,
} from '../components/public/NeedSubmissionForm';
import { SubmitSuccess } from '../components/public/SubmitSuccess';
import { supabase } from '../components/public/supabase';

const TAILWIND_SCRIPT_ID = 'crisisiq-tailwind-cdn';
const DEMO_EVENT_ID = 'e1000000-0000-0000-0000-000000000001';

type UrgencyLevel = NeedSubmissionPayload['urgency'];

const URGENCY_TO_SCORE: Record<UrgencyLevel, number> = {
  low: 2,
  medium: 3,
  high: 4,
  critical: 5,
};

function buildDescription(payload: NeedSubmissionPayload): string {
  return [
    `Contact: ${payload.contact}`,
    `Location note: ${payload.locationText}`,
    '',
    payload.description,
  ].join('\n');
}

function PublicSubmit() {
  const [view, setView] = useState<'form' | 'success'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (document.getElementById(TAILWIND_SCRIPT_ID)) return;

    const script = document.createElement('script');
    script.id = TAILWIND_SCRIPT_ID;
    script.src = 'https://cdn.tailwindcss.com';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  const handleSubmit = useCallback(async (payload: NeedSubmissionPayload) => {
    setIsSubmitting(true);
    setSubmitError(null);

    const { error } = await supabase.from('needs').insert({
      submitter_name: payload.name,
      lat: payload.lat,
      lng: payload.lng,
      need_type: payload.needType,
      description: buildDescription(payload),
      urgency_self: URGENCY_TO_SCORE[payload.urgency],
      status: 'pending',
      event_id: DEMO_EVENT_ID,
    });

    setIsSubmitting(false);

    if (error) {
      setSubmitError(
        error.message ||
          'Something went wrong while submitting your request. Please try again.'
      );
      return;
    }

    setView('success');
  }, []);

  const handleSubmitAnother = useCallback(() => {
    setView('form');
    setSubmitError(null);
    setFormKey((k) => k + 1);
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {view === 'success' ? (
        <SubmitSuccess onSubmitAnother={handleSubmitAnother} />
      ) : (
        <NeedSubmissionForm
          key={formKey}
          isSubmitting={isSubmitting}
          submitError={submitError}
          onSubmit={(payload) => {
            void handleSubmit(payload);
          }}
        />
      )}
    </main>
  );
}

export default PublicSubmit;
