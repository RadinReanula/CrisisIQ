import { createClient } from '@supabase/supabase-js';
import type { CrisisEvent, Need, Volunteer, VolunteerSkill } from '../types';

const VOLUNTEER_SKILLS: readonly VolunteerSkill[] = [
  'medical',
  'driving',
  'cooking',
  'rescue',
  'translation',
  'logistics',
] as const;

const VOLUNTEER_SKILL_SET = new Set<VolunteerSkill>(VOLUNTEER_SKILLS);

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigError =
  !supabaseUrl || !supabaseAnonKey
    ? 'Missing Supabase environment variables. Check .env.local'
    : null;

export const supabase = createClient(
  supabaseUrl ?? 'http://localhost:54321',
  supabaseAnonKey ?? 'missing-supabase-anon-key',
);

export type RegisterVolunteerInput = Omit<Volunteer, 'id' | 'created_at'>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === 'string' ? value : null;
}

function readNumber(record: Record<string, unknown>, key: string): number | null {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readBoolean(record: Record<string, unknown>, key: string): boolean | null {
  const value = record[key];
  return typeof value === 'boolean' ? value : null;
}

function normSkills(value: unknown): VolunteerSkill[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const out: VolunteerSkill[] = [];
  for (const raw of value) {
    if (typeof raw !== 'string') {
      continue;
    }

    const skill = raw as VolunteerSkill;
    if (VOLUNTEER_SKILL_SET.has(skill)) {
      out.push(skill);
    }
  }

  return out;
}

export function parseVolunteerRecord(value: unknown): Volunteer | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = readString(value, 'id');
  const userId = readString(value, 'user_id');
  const name = readString(value, 'name');
  const lat = readNumber(value, 'lat');
  const lng = readNumber(value, 'lng');
  const available = readBoolean(value, 'available');
  const createdAt = readString(value, 'created_at');

  if (!id || !userId || !name || lat === null || lng === null || available === null) {
    return null;
  }

  const phone = readString(value, 'phone');
  const activeMissionId = readString(value, 'active_mission_id');
  const availabilityRaw = readString(value, 'availability');
  const availability =
    availabilityRaw === 'available' || availabilityRaw === 'standby'
      ? availabilityRaw
      : undefined;

  return {
    id,
    user_id: userId,
    name,
    lat,
    lng,
    skills: normSkills(value['skills']),
    available,
    availability,
    active_mission_id: activeMissionId ?? undefined,
    phone: phone ?? undefined,
    created_at: createdAt ?? undefined,
  };
}

export async function registerVolunteer(vol: RegisterVolunteerInput): Promise<Volunteer | null> {
  try {
    const { data, error } = await supabase
      .from('volunteers')
      .insert({
        user_id: vol.user_id,
        name: vol.name,
        lat: vol.lat,
        lng: vol.lng,
        skills: vol.skills,
        available: vol.available,
        active_mission_id: vol.active_mission_id ?? null,
        phone: vol.phone ?? null,
      })
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('[registerVolunteer]', error.message);
      return null;
    }

    return parseVolunteerRecord(data);
  } catch {
    return null;
  }
}

export async function getVolunteerProfileByAuthUser(authUserId: string): Promise<Volunteer | null> {
  try {
    const { data, error } = await supabase
      .from('volunteers')
      .select('*')
      .eq('user_id', authUserId)
      .maybeSingle();

    if (error) {
      console.error('[getVolunteerProfileByAuthUser]', error.message);
      return null;
    }

    return parseVolunteerRecord(data);
  } catch {
    return null;
  }
}

function parseCrisisEventRecord(value: unknown): CrisisEvent | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = readString(value, 'id');
  const name = readString(value, 'name');
  const active = readBoolean(value, 'active');
  const createdAt = readString(value, 'created_at');

  if (!id || !name || active === null || !createdAt) {
    return null;
  }

  const description = readString(value, 'description');
  const lat = readNumber(value, 'lat');
  const lng = readNumber(value, 'lng');
  const radius = readNumber(value, 'radius_km');

  return {
    id,
    name,
    description: description ?? undefined,
    lat: lat === null ? undefined : lat,
    lng: lng === null ? undefined : lng,
    radius_km: radius === null ? undefined : radius,
    active,
    created_at: createdAt,
  };
}

function parseNeedRecord(value: unknown): Need | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = readString(value, 'id');
  const createdAt = readString(value, 'created_at');
  const submitterName = readString(value, 'submitter_name');
  const needType = readString(value, 'need_type');
  const description = readString(value, 'description');
  const status = readString(value, 'status');
  const lat = readNumber(value, 'lat');
  const lng = readNumber(value, 'lng');
  const urgencySelf = readNumber(value, 'urgency_self');

  if (
    !id ||
    !createdAt ||
    !submitterName ||
    lat === null ||
    lng === null ||
    !description ||
    !needType ||
    urgencySelf === null ||
    !status
  ) {
    return null;
  }

  const needTypes = new Set<Need['need_type']>(['food', 'medical', 'rescue', 'shelter', 'other']);
  if (!needTypes.has(needType as Need['need_type'])) {
    return null;
  }

  const needStatuses = new Set<Need['status']>([
    'pending',
    'assigned',
    'in_progress',
    'resolved',
  ]);
  if (!needStatuses.has(status as Need['status'])) {
    return null;
  }

  const urgencyAi = readNumber(value, 'urgency_ai');
  const aiBrief = readString(value, 'ai_brief');
  const assignedVolunteerId = readString(value, 'assigned_volunteer_id');
  const eventId = readString(value, 'event_id');

  return {
    id,
    created_at: createdAt,
    submitter_name: submitterName,
    lat,
    lng,
    need_type: needType as Need['need_type'],
    description,
    urgency_self: urgencySelf,
    urgency_ai: urgencyAi === null ? undefined : urgencyAi,
    ai_brief: aiBrief ?? undefined,
    status: status as Need['status'],
    assigned_volunteer_id: assignedVolunteerId ?? undefined,
    event_id: eventId ?? undefined,
  };
}

export interface PublicCrisisStats {
  pending: number;
  inProgress: number;
  resolved: number;
  lastUpdated: string;
}

export async function getActiveEvent(): Promise<CrisisEvent | null> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[getActiveEvent]', error.message);
      return null;
    }

    return parseCrisisEventRecord(data);
  } catch {
    return null;
  }
}

export async function getPublicCrisisStats(eventId?: string): Promise<PublicCrisisStats | null> {
  try {
    const base = () => {
      let q = supabase.from('needs').select('*', { count: 'exact', head: true });
      if (eventId) q = q.eq('event_id', eventId);
      return q;
    };

    const [pendingRes, inProgressRes, resolvedRes] = await Promise.all([
      base().eq('status', 'pending'),
      base().in('status', ['assigned', 'in_progress']),
      base().eq('status', 'resolved'),
    ]);

    if (pendingRes.error || inProgressRes.error || resolvedRes.error) {
      console.error('[getPublicCrisisStats] count failed');
      return null;
    }

    return {
      pending: pendingRes.count ?? 0,
      inProgress: inProgressRes.count ?? 0,
      resolved: resolvedRes.count ?? 0,
      lastUpdated: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export interface NeedTrackingInfo {
  need: Need;
  assignmentStatus: string | null;
}

export async function getNeedForTracking(needId: string): Promise<NeedTrackingInfo | null> {
  try {
    const { data: needData, error: needError } = await supabase
      .from('needs')
      .select('*')
      .eq('id', needId)
      .maybeSingle();

    if (needError || !needData) {
      return null;
    }

    const need = parseNeedRecord(needData);
    if (!need) return null;

    let assignmentStatus: string | null = null;
    const { data: assignmentData } = await supabase
      .from('assignments')
      .select('status')
      .eq('need_id', needId)
      .order('assigned_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (assignmentData && typeof assignmentData === 'object' && 'status' in assignmentData) {
      const status = (assignmentData as { status: unknown }).status;
      assignmentStatus = typeof status === 'string' ? status : null;
    }

    return { need, assignmentStatus };
  } catch {
    return null;
  }
}
