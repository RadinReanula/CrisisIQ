import type {
  TriageRequest,
  TriageResult,
  SitrepRequest,
  SitrepResponse,
  ApiError,
} from '../types';

const FUNCTIONS_BASE = '/.netlify/functions';

class ClaudeServiceError extends Error {
  status: number;
  details?: string;

  constructor(message: string, status: number, details?: string) {
    super(message);
    this.name = 'ClaudeServiceError';
    this.status = status;
    this.details = details;
  }
}

async function callFunction<T>(endpoint: string, body: unknown): Promise<T> {
  const url = `${FUNCTIONS_BASE}/${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ClaudeServiceError(
      'Network error: unable to reach AI service',
      0
    );
  }

  const data: T | ApiError = await response.json();

  if (!response.ok) {
    const err = data as ApiError;
    throw new ClaudeServiceError(
      err.error || `Request failed with status ${response.status}`,
      response.status,
      err.details
    );
  }

  return data as T;
}

export async function triageNeed(params: TriageRequest): Promise<TriageResult> {
  return callFunction<TriageResult>('claude-triage', params);
}

export async function getSitrep(params: SitrepRequest): Promise<SitrepResponse> {
  return callFunction<SitrepResponse>('claude-sitrep', params);
}

export { ClaudeServiceError };
