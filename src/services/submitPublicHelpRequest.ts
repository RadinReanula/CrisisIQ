import type { NeedSubmissionPayload } from '../types';
import { supabase } from './supabase';

const DEMO_EVENT_ID = 'e1000000-0000-0000-0000-000000000001';

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

/**
 * Persists public "Request help" submissions: detailed row in `help_requests`,
 * and a summary row in `needs` for coordinator / triage workflows.
 */
export async function submitPublicHelpRequest(
  payload: NeedSubmissionPayload,
): Promise<{ error: string | null }> {
  const hr = await supabase.from('help_requests').insert({
    submitter_name: payload.name,
    contact: payload.contact,
    need_type: payload.needType,
    location_text: payload.locationText,
    lat: payload.lat,
    lng: payload.lng,
    description: payload.description,
    urgency: payload.urgency,
    event_id: DEMO_EVENT_ID,
  });

  if (hr.error) {
    return { error: hr.error.message };
  }

  const legacy = await supabase.from('needs').insert({
    submitter_name: payload.name,
    lat: payload.lat,
    lng: payload.lng,
    need_type: payload.needType,
    description: buildLegacyNeedDescription(payload),
    urgency_self: URGENCY_TO_SCORE[payload.urgency],
    status: 'pending',
    event_id: DEMO_EVENT_ID,
  });

  if (legacy.error) {
    return {
      error: `${legacy.error.message} (Your request was saved in help_requests, but the coordinator queue could not be updated.)`,
    };
  }

  return { error: null };
}
