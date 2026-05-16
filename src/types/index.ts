export type NeedType = 'food' | 'medical' | 'rescue' | 'shelter' | 'other';
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
