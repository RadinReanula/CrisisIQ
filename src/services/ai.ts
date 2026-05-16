import type {
  AiNewsResponse,
  Assignment,
  Need,
  SitrepResponse,
  TriageResult,
  Volunteer,
} from '../types';

const FUNCTIONS_BASE = '/.netlify/functions';
const TRIAGE_FALLBACK_BRIEF = 'AI triage unavailable. Coordinator review required.';
const SITREP_FALLBACK = 'Situation report unavailable. Check network connection.';

type TriageNeedInput = Pick<Need, 'description' | 'need_type' | 'urgency_self'>;

function fallbackTriageResult(need: TriageNeedInput): TriageResult {
  return {
    urgency_ai: need.urgency_self,
    ai_brief: TRIAGE_FALLBACK_BRIEF,
    ai_matched_skills: [],
  };
}

/**
 * POSTs a need to the AI triage Netlify function. Returns a safe fallback
 * when the call fails so background triage never throws.
 */
export async function triageNeed(
  need: TriageNeedInput,
  availableVolunteers: Volunteer[],
): Promise<TriageResult> {
  try {
    const response = await fetch(`${FUNCTIONS_BASE}/ai-triage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        needDescription: need.description,
        needType: need.need_type,
        urgencySelf: need.urgency_self,
        availableVolunteers,
      }),
    });

    if (!response.ok) {
      return fallbackTriageResult(need);
    }

    return (await response.json()) as TriageResult;
  } catch {
    return fallbackTriageResult(need);
  }
}

/**
 * POSTs current operations to the AI sitrep function and returns the plain
 * text report. Returns a fallback string on any failure.
 */
export async function generateSitrep(
  needs: Need[],
  assignments: Assignment[],
  volunteers: Volunteer[],
  eventName: string,
): Promise<string> {
  try {
    const response = await fetch(`${FUNCTIONS_BASE}/ai-sitrep`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        needs,
        assignments,
        volunteers,
        eventName,
      }),
    });

    if (!response.ok) {
      return SITREP_FALLBACK;
    }

    const data = (await response.json()) as SitrepResponse;
    return data.sitrep;
  } catch {
    return SITREP_FALLBACK;
  }
}

/**
 * Fetches the unified AI news digest (CrisisIQ submissions + GDACS / USGS /
 * ReliefWeb feeds + OpenAI web-search enrichment). The Netlify function
 * caches results for ~10 minutes; pass `force=true` to bypass that cache.
 */
export async function getAiNews(force = false): Promise<AiNewsResponse> {
  const url = `${FUNCTIONS_BASE}/ai-news${force ? '?force=1' : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      detail ? `AI news request failed (${response.status}): ${detail}` : `AI news request failed (${response.status})`,
    );
  }

  return (await response.json()) as AiNewsResponse;
}
