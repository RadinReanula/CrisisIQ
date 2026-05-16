import { useCallback, useState } from 'react';
<<<<<<< Updated upstream
import {
  NeedSubmissionForm,
  type NeedSubmissionPayload,
} from '../components/public/NeedSubmissionForm';
import { CrisisEventBanner } from '../components/public/CrisisEventBanner';
=======
import { NeedSubmissionForm } from '../components/public/NeedSubmissionForm';
>>>>>>> Stashed changes
import { PageBackground } from '../components/public/PageBackground';
import { PublicPageShell } from '../components/public/PublicPageShell';
import { SubmitSuccess } from '../components/public/SubmitSuccess';
<<<<<<< Updated upstream
import { useAppContext } from '../context/AppContext';
import { supabase } from '../components/public/supabase';
import '../index.css';

const FALLBACK_EVENT_ID = 'e1000000-0000-0000-0000-000000000001';

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

=======
import type { NeedSubmissionPayload } from '../types';
import { submitPublicHelpRequest } from '../services/submitPublicHelpRequest';
import '../index.css';

>>>>>>> Stashed changes
function PublicSubmit() {
  const { currentEvent } = useAppContext();
  const [view, setView] = useState<'form' | 'success'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [submittedNeedId, setSubmittedNeedId] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (payload: NeedSubmissionPayload) => {
      setIsSubmitting(true);
      setSubmitError(null);

<<<<<<< Updated upstream
      const eventId = currentEvent?.id ?? FALLBACK_EVENT_ID;
=======
    const { error } = await submitPublicHelpRequest(payload);
>>>>>>> Stashed changes

      const { data, error } = await supabase
        .from('needs')
        .insert({
          submitter_name: payload.name,
          lat: payload.lat,
          lng: payload.lng,
          need_type: payload.needType,
          description: buildDescription(payload),
          urgency_self: URGENCY_TO_SCORE[payload.urgency],
          status: 'pending',
          event_id: eventId,
        })
        .select('id')
        .single();

<<<<<<< Updated upstream
      setIsSubmitting(false);
=======
    if (error) {
      setSubmitError(
        error ||
          'Something went wrong while submitting your request. Please try again.'
      );
      return;
    }
>>>>>>> Stashed changes

      if (error || !data?.id) {
        setSubmitError(
          error?.message ||
            'Something went wrong while submitting your request. Please try again.',
        );
        return;
      }

      setSubmittedNeedId(data.id as string);
      setView('success');
    },
    [currentEvent?.id],
  );

  const handleSubmitAnother = useCallback(() => {
    setView('form');
    setSubmitError(null);
    setSubmittedNeedId(null);
    setFormKey((k) => k + 1);
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0f1e] font-sans text-white">
      <PageBackground />
      <PublicPageShell className="relative z-10">
        {view === 'success' && submittedNeedId ? (
          <SubmitSuccess needId={submittedNeedId} onSubmitAnother={handleSubmitAnother} />
        ) : (
          <>
            <div className="mx-auto max-w-[560px] px-4 pt-4">
              <CrisisEventBanner event={currentEvent} compact />
            </div>
            <NeedSubmissionForm
              key={formKey}
              isSubmitting={isSubmitting}
              submitError={submitError}
              onSubmit={(payload) => {
                void handleSubmit(payload);
              }}
            />
          </>
        )}
      </PublicPageShell>
    </main>
  );
}

export default PublicSubmit;
