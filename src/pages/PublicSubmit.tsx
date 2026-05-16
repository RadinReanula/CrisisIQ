import { useCallback, useState } from 'react';
import { CrisisEventBanner } from '../components/public/CrisisEventBanner';
import { NeedSubmissionForm } from '../components/public/NeedSubmissionForm';
import { PageBackground } from '../components/public/PageBackground';
import { PublicPageShell } from '../components/public/PublicPageShell';
import { SubmitSuccess } from '../components/public/SubmitSuccess';
import { useAppContext } from '../context/useAppContext';
import { submitPublicHelpRequest } from '../services/submitPublicHelpRequest';
import type { NeedSubmissionPayload } from '../types';
import '../index.css';

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

      const { error, needId } = await submitPublicHelpRequest(
        payload,
        currentEvent?.id ?? null,
      );

      setIsSubmitting(false);

      if (error || !needId) {
        setSubmitError(
          error ??
            'Something went wrong while submitting your request. Please try again.',
        );
        return;
      }

      setSubmittedNeedId(needId);
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
    <main className="relative min-h-screen overflow-hidden bg-[var(--color-bg-dark)] font-sans text-white">
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
