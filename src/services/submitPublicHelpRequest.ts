import type { NeedSubmissionPayload } from '../types';
import { supabase } from './supabase';

const URGENCY_TO_SCORE: Record<NeedSubmissionPayload['urgency'], number> = {
  low: 2,
  medium: 3,
  high: 4,
  critical: 5,
};

function buildLegacyNeedDescription(payload: NeedSubmissionPayload): string {
  return [
    `Contact: ${payload.contact}`,
    `Location note: ${payload.locationText}`,
    '',
    payload.description,
  ].join('\n');
}

export interface SubmitPublicHelpRequestResult {
  error: string | null;
  needId: string | null;
}

/**
 * Persists public "Request help" submissions:
 * - canonical row in `requests` (matches every form field 1:1)
 * - mirror row in `needs` so coordinator triage / dashboards keep working
 *
 * `event_id` is sent only when an active CrisisEvent is provided; passing
 * a non-existent UUID would violate the FK to `public.events`.
 */
export async function submitPublicHelpRequest(
  payload: NeedSubmissionPayload,
  eventId?: string | null,
): Promise<SubmitPublicHelpRequestResult> {
  const cleanEventId =
    typeof eventId === 'string' && eventId.length > 0 ? eventId : null;

  const requestRow = {
    name: payload.name,
    contact: payload.contact,
    need_type: payload.needType,
    location_text: payload.locationText,
    lat: payload.lat,
    lng: payload.lng,
    description: payload.description,
    urgency: payload.urgency,
    status: 'pending' as const,
    ...(cleanEventId ? { event_id: cleanEventId } : {}),
  };

  const requests = await supabase
    .from('requests')
    .insert(requestRow)
    .select('id')
    .single();

  if (requests.error || !requests.data?.id) {
    console.error('[submitPublicHelpRequest] requests insert failed', requests.error);
    return {
      error:
        requests.error?.message ??
        'Could not save your help request. Please try again.',
      needId: null,
    };
  }

  const legacyRow = {
    submitter_name: payload.name,
    lat: payload.lat,
    lng: payload.lng,
    need_type: payload.needType,
    description: buildLegacyNeedDescription(payload),
    urgency_self: URGENCY_TO_SCORE[payload.urgency],
    status: 'pending' as const,
    ...(cleanEventId ? { event_id: cleanEventId } : {}),
  };

  const legacy = await supabase
    .from('needs')
    .insert(legacyRow)
    .select('id')
    .single();

  if (legacy.error || !legacy.data?.id) {
    console.error('[submitPublicHelpRequest] needs mirror insert failed', legacy.error);
    return {
      error: null,
      needId: requests.data.id as string,
    };
  }

  return { error: null, needId: legacy.data.id as string };
}
