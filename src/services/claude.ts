import type {
  Assignment,
  Need,
  TriageResult,
  SitrepResponse,
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

export async function triageNeed(
  need: TriageNeedInput,
  availableVolunteers: Volunteer[],
): Promise<TriageResult> {
  try {
    const response = await fetch(`${FUNCTIONS_BASE}/claude-triage`, {
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

export async function generateSitrep(
  needs: Need[],
  assignments: Assignment[],
  volunteers: Volunteer[],
  eventName: string,
): Promise<string> {
  try {
    const response = await fetch(`${FUNCTIONS_BASE}/claude-sitrep`, {
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
