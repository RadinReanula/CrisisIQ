export type NeedType = 'food' | 'medical' | 'rescue' | 'shelter' | 'other';
export type HelpRequestUrgency = 'low' | 'medium' | 'high' | 'critical';
export type NeedStatus = 'pending' | 'assigned' | 'in_progress' | 'resolved';
export type VolunteerSkill = 'medical' | 'driving' | 'cooking' | 'rescue' | 'translation' | 'logistics';
export type AssignmentStatus = 'assigned' | 'en_route' | 'arrived' | 'completed';

export interface Need {
  id: string;
  created_at: string;
  submitter_name: string;
  lat: number;
  lng: number;
  need_type: NeedType;
  description: string;
  urgency_self: number;
  urgency_ai?: number;
  ai_brief?: string;
  ai_matched_skills?: string[];
  status: NeedStatus;
  assigned_volunteer_id?: string;
  event_id?: string;
}

export interface Volunteer {
  id: string;
  user_id: string;
  name: string;
  lat: number;
  lng: number;
  skills: VolunteerSkill[];
  available: boolean;
  /** Persisted when `volunteers.availability` exists; mirrors registration UI. */
  availability?: 'available' | 'standby';
  active_mission_id?: string;
  phone?: string;
  created_at?: string;
}

export interface Assignment {
  id: string;
  need_id: string;
  volunteer_id: string;
  assigned_at: string;
  status: AssignmentStatus;
  completed_at?: string;
  coordinator_notes?: string;
}

export interface CrisisEvent {
  id: string;
  name: string;
  description?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
  active: boolean;
  created_at: string;
}

export interface TriageResult {
  urgency_ai: number;
  ai_brief: string;
  ai_matched_skills: string[];
}

export interface TriageRequest {
  needDescription: string;
  needType: NeedType;
  urgencySelf: number;
  availableVolunteers: Volunteer[];
}

export interface SitrepRequest {
  eventName: string;
  needs: Need[];
  assignments: Assignment[];
  volunteers: Volunteer[];
}

export interface SitrepResponse {
  sitrep: string;
  stats: {
    total: number;
    pending: number;
    assigned: number;
    resolved: number;
  };
  recommendations: string[];
}

export interface ApiError {
  error: string;
  details?: string;
}

/** Payload from the public /submit "Request help" form (maps to `help_requests`). */
export interface NeedSubmissionPayload {
  name: string;
  contact: string;
  needType: NeedType;
  locationText: string;
  lat: number;
  lng: number;
  description: string;
  urgency: HelpRequestUrgency;
}

/** Row shape for `public.help_requests`. */
export interface HelpRequest {
  id: string;
  created_at: string;
  submitter_name: string;
  contact: string;
  need_type: NeedType;
  location_text: string;
  lat: number;
  lng: number;
  description: string;
  urgency: HelpRequestUrgency;
  event_id?: string;
}

/* ------------------------------------------------------------------ */
/* AI News                                                             */
/* ------------------------------------------------------------------ */

export type NewsItemSource =
  | 'crisisiq'
  | 'gdacs'
  | 'usgs'
  | 'reliefweb'
  | 'web';

export type DisasterLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

/**
 * Unified news item rendered on /news. Produced by the `ai-news` Netlify
 * function from a mix of CrisisIQ submissions and live hazard feeds.
 */
export interface NewsItem {
  id: string;
  source: NewsItemSource;
  source_label: string;
  source_url?: string;
  title: string;
  summary: string;
  disaster_level: DisasterLevel;
  disaster_type?: string;
  region?: string;
  lat?: number;
  lng?: number;
  /** ISO timestamp when the event/submission happened. */
  occurred_at: string;
  affected_population?: number;
}

export interface AiNewsResponse {
  items: NewsItem[];
  generated_at: string;
  next_refresh_at: string;
}

/* ------------------------------------------------------------------ */
/* Threats (public `requests` table, optionally enriched by OpenAI)    */
/* ------------------------------------------------------------------ */

/**
 * 1:1 mirror of a row in `public.requests`. This is the canonical shape
 * the live threat map / awareness sidebar render from.
 */
export interface RequestRow {
  id: string;
  created_at: string;
  name: string;
  contact: string;
  need_type: NeedType;
  location_text: string;
  lat: number;
  lng: number;
  description: string;
  urgency: HelpRequestUrgency;
  status: NeedStatus;
  event_id?: string;
}

/**
 * Coarse incident category produced by OpenAI from the description field.
 * Lets coordinators see, at a glance, what kind of crisis each request
 * represents beyond the user-picked `need_type` checkbox.
 */
export type ThreatCategoryLabel =
  | 'natural-disaster'
  | 'medical'
  | 'rescue'
  | 'shelter'
  | 'food-water'
  | 'security'
  | 'infrastructure'
  | 'other';

/** Output of `ai-threats` for a single request. */
export interface ThreatAiAnalysis {
  /** AI-reassessed urgency from the free-text description. */
  ai_urgency: HelpRequestUrgency;
  /** High-level category derived from the description. */
  ai_category: ThreatCategoryLabel;
  /** 1-sentence neutral summary of what is happening. */
  ai_summary: string;
  /** Up to 3 short recommended next actions for coordinators. */
  ai_actions: string[];
  /** Model confidence in the analysis, 0..1. */
  ai_confidence: number;
}

/**
 * Live threat shown on /awareness. Always carries the raw request row;
 * `ai` is populated only when the OpenAI analysis call succeeded.
 */
export interface Threat extends RequestRow {
  ai?: ThreatAiAnalysis;
}

export interface AiThreatsResponse {
  threats: Threat[];
  /** True when at least one threat has an `ai` block. */
  ai_enabled: boolean;
  generated_at: string;
  next_refresh_at: string;
}

/* ------------------------------------------------------------------ */
/* AI Chat Assistant (CrisisIQ Assistant)                              */
/* ------------------------------------------------------------------ */

/** Roles the in-app assistant tracks per turn. */
export type ChatRole = 'user' | 'assistant';

/**
 * A single turn in the in-app assistant conversation. `id` is a client
 * generated stable key, `createdAt` is an ISO timestamp.
 */
export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}

/**
 * Optional hints the client sends to the server so the assistant can
 * tailor replies (current page, active event, signed-in role,
 * specific request the user is asking about).
 */
export interface ChatContextHint {
  page?: string;
  eventId?: string;
  eventName?: string;
  requestId?: string;
  role?: 'citizen' | 'volunteer' | 'coordinator';
}

/** Response shape from `/.netlify/functions/ai-chat`. */
export interface ChatReply {
  reply: string;
  used_live_data: boolean;
  suggestions?: string[];
}
