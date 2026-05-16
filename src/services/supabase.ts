import { createClient } from '@supabase/supabase-js';
import type {
  Assignment,
  AssignmentStatus,
  CrisisEvent,
  Need,
  NeedStatus,
  TriageResult,
  Volunteer,
  VolunteerSkill,
} from '../types';

const VOLUNTEER_SKILLS: readonly VolunteerSkill[] = [
  'medical',
  'driving',
  'cooking',
  'rescue',
  'translation',
  'logistics',
] as const;

const VOLUNTEER_SKILL_SET = new Set<VolunteerSkill>(VOLUNTEER_SKILLS);

const ACTIVE_ASSIGNMENT_STATUSES: AssignmentStatus[] = ['assigned', 'en_route', 'arrived'];

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/** Client-safe insert shapes (server-generated columns omitted). */
export type SubmitNeedInput = Omit<
  Need,
  | 'id'
  | 'created_at'
  | 'urgency_ai'
  | 'ai_brief'
  | 'ai_matched_skills'
  | 'status'
  | 'assigned_volunteer_id'
>;

export type RegisterVolunteerInput = Omit<Volunteer, 'id' | 'created_at'>;

/**
 * Deterministic UUIDs (valid for Postgres `uuid`) so `seedDemoData` is idempotent.
 * Note: RLS prevents inserting multiple volunteer profiles for different auth users from the browser.
 * This seed focuses on the 12 demo needs; run `supabase/seed.sql` in the dashboard for full volunteers + assignments.
 */
const DEMO_NEED_UPSERT_ROWS: Omit<Need, 'created_at'>[] = [
  {
    id: '33333333-3333-4333-8333-000000000001',
    submitter_name: 'Sunil Fernando',
    lat: 6.931,
    lng: 79.848,
    need_type: 'rescue',
    description:
      'Family of 4 stranded on second floor. Water level rising, ground floor fully submerged. Elderly grandmother cannot swim.',
    urgency_self: 5,
    urgency_ai: 5,
    ai_brief:
      'Critical rescue needed for trapped family with elderly member. Water rising — immediate boat/rescue team deployment required.',
    ai_matched_skills: ['rescue', 'driving'],
    status: 'pending',
    event_id: '', // patched at runtime from getActiveEvent()
  },
  {
    id: '33333333-3333-4333-8333-000000000002',
    submitter_name: 'Priya Gunasekara',
    lat: 6.915,
    lng: 79.859,
    need_type: 'medical',
    description:
      'Diabetic patient ran out of insulin 2 days ago. Feeling dizzy and weak. No pharmacy accessible due to flooding.',
    urgency_self: 4,
    urgency_ai: 5,
    ai_brief:
      'Urgent medical supply delivery for diabetic patient without insulin for 48hrs. Risk of diabetic emergency escalating.',
    ai_matched_skills: ['medical', 'driving'],
    status: 'pending',
    event_id: '',
  },
  {
    id: '33333333-3333-4333-8333-000000000003',
    submitter_name: 'Community Center Wellawatte',
    lat: 6.874,
    lng: 79.86,
    need_type: 'food',
    description:
      '45 displaced families sheltering at community center. Food supplies running low, expect to run out by tomorrow morning.',
    urgency_self: 3,
    urgency_ai: 3,
    ai_brief:
      'Medium-priority food resupply for 45 displaced families. Current supplies last until morning — plan logistics for bulk delivery.',
    ai_matched_skills: ['cooking', 'logistics', 'driving'],
    status: 'pending',
    event_id: '',
  },
  {
    id: '33333333-3333-4333-8333-000000000004',
    submitter_name: 'Anil Rathnayake',
    lat: 6.94,
    lng: 79.875,
    need_type: 'shelter',
    description:
      'Roof collapsed in our area. 3 families (12 people) need temporary shelter. Currently standing in rain.',
    urgency_self: 4,
    urgency_ai: 4,
    ai_brief:
      'Displaced families need immediate temporary shelter. Exposure risk in ongoing rain — prioritize nearby dry facilities.',
    ai_matched_skills: ['logistics', 'driving'],
    status: 'pending',
    event_id: '',
  },
  {
    id: '33333333-3333-4333-8333-000000000005',
    submitter_name: 'Mohamed Ali',
    lat: 6.928,
    lng: 79.84,
    need_type: 'other',
    description:
      'Lost contact with elderly neighbor (lives alone) since yesterday. Her phone is off. House is in low-lying area.',
    urgency_self: 3,
    urgency_ai: 4,
    ai_brief:
      'Welfare check needed for isolated elderly resident. No contact for 24hrs in flood-prone area — potential rescue situation.',
    ai_matched_skills: ['rescue', 'driving'],
    status: 'pending',
    event_id: '',
  },
  {
    id: '33333333-3333-4333-8333-000000000006',
    submitter_name: 'Kamini Peris',
    lat: 6.91,
    lng: 79.87,
    need_type: 'food',
    description:
      'Single mother with 3 young children. No food since yesterday, cannot leave house due to waist-high water outside.',
    urgency_self: 4,
    urgency_ai: 4,
    ai_brief:
      'Food delivery needed for isolated mother and children. Inaccessible by foot — requires boat or wading access.',
    ai_matched_skills: ['cooking', 'driving', 'rescue'],
    status: 'pending',
    event_id: '',
  },
  {
    id: '33333333-3333-4333-8333-000000000007',
    submitter_name: 'Ruwan Bandara',
    lat: 6.938,
    lng: 79.855,
    need_type: 'rescue',
    description:
      'Trapped in vehicle on flooded Baseline Road. Water entering car. Cannot open doors due to pressure.',
    urgency_self: 5,
    urgency_ai: 5,
    ai_brief:
      'Life-threatening vehicle entrapment in flood waters. Immediate rescue team with extraction tools needed.',
    ai_matched_skills: ['rescue', 'driving'],
    status: 'pending',
    event_id: '',
  },
  {
    id: '33333333-3333-4333-8333-000000000008',
    submitter_name: 'Galle Road Pharmacy',
    lat: 6.92,
    lng: 79.845,
    need_type: 'medical',
    description:
      'Clinic needs medical supplies restocked urgently. Running low on bandages, antiseptic, and basic medications for walk-in patients.',
    urgency_self: 3,
    urgency_ai: 3,
    ai_brief:
      'Medical resupply for active clinic serving flood-affected community. Not immediately critical but impacts ongoing care capacity.',
    ai_matched_skills: ['medical', 'driving', 'logistics'],
    status: 'pending',
    event_id: '',
  },
  {
    id: '33333333-3333-4333-8333-000000000009',
    submitter_name: 'Dehiwala Temple Committee',
    lat: 6.858,
    lng: 79.865,
    need_type: 'food',
    description:
      'Temple converted to emergency shelter. 80 people need evening meals. Kitchen operational but no raw ingredients.',
    urgency_self: 3,
    urgency_ai: 3,
    ai_brief:
      'Bulk food ingredient delivery for active shelter serving 80 displaced persons. Kitchen ready — raw materials needed.',
    ai_matched_skills: ['cooking', 'logistics', 'driving'],
    status: 'pending',
    event_id: '',
  },
  {
    id: '33333333-3333-4333-8333-000000000010',
    submitter_name: 'Thilini Samaraweera',
    lat: 6.932,
    lng: 79.862,
    need_type: 'rescue',
    description:
      'Elderly couple stranded on rooftop at Kirulapone junction. Both have mobility issues.',
    urgency_self: 5,
    urgency_ai: 5,
    ai_brief:
      'Completed: Elderly couple evacuated safely from rooftop by rescue team.',
    ai_matched_skills: ['rescue', 'driving'],
    status: 'resolved',
    event_id: '',
  },
  {
    id: '33333333-3333-4333-8333-000000000011',
    submitter_name: 'Colombo North School',
    lat: 6.955,
    lng: 79.85,
    need_type: 'shelter',
    description:
      'School building opened as emergency shelter. Needed cots, blankets and basic sanitation supplies for 60 evacuees.',
    urgency_self: 3,
    urgency_ai: 3,
    ai_brief:
      'Completed: Shelter supplies delivered. School now operational as evacuation center.',
    ai_matched_skills: ['logistics', 'driving'],
    status: 'resolved',
    event_id: '',
  },
  {
    id: '33333333-3333-4333-8333-000000000012',
    submitter_name: 'Muthulingam Family',
    lat: 6.918,
    lng: 79.838,
    need_type: 'other',
    description:
      'Tamil-speaking family cannot communicate with rescue teams. Need translator for medical instructions.',
    urgency_self: 2,
    urgency_ai: 3,
    ai_brief:
      'Completed: Translator assigned. Family received medical care with communication support.',
    ai_matched_skills: ['translation', 'medical'],
    status: 'resolved',
    event_id: '',
  },
];

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

export function parseNeedRecord(value: unknown): Need | null {
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

  const needTypes = new Set<Need['need_type']>([
    'food',
    'medical',
    'rescue',
    'shelter',
    'other',
  ]);
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
  const aiMatched = normSkills(value['ai_matched_skills']);
  const assignedVolunteerIdRaw = readString(value, 'assigned_volunteer_id');
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
    ai_matched_skills: aiMatched.length ? aiMatched : undefined,
    status: status as Need['status'],
    assigned_volunteer_id: assignedVolunteerIdRaw ?? undefined,
    event_id: eventId ?? undefined,
  };
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

  return {
    id,
    user_id: userId,
    name,
    lat,
    lng,
    skills: normSkills(value['skills']),
    available,
    active_mission_id: activeMissionId ?? undefined,
    phone: phone ?? undefined,
    created_at: createdAt ?? undefined,
  };
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

export function parseAssignmentRecord(value: unknown): Assignment | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = readString(value, 'id');
  const needId = readString(value, 'need_id');
  const volunteerId = readString(value, 'volunteer_id');
  const assignedAt = readString(value, 'assigned_at');
  const status = readString(value, 'status');

  if (!id || !needId || !volunteerId || !assignedAt || !status) {
    return null;
  }

  const statuses = new Set<Assignment['status']>([
    'assigned',
    'en_route',
    'arrived',
    'completed',
  ]);
  if (!statuses.has(status as Assignment['status'])) {
    return null;
  }

  const completedAt = readString(value, 'completed_at');
  const notes = readString(value, 'coordinator_notes');

  return {
    id,
    need_id: needId,
    volunteer_id: volunteerId,
    assigned_at: assignedAt,
    status: status as Assignment['status'],
    completed_at: completedAt ?? undefined,
    coordinator_notes: notes ?? undefined,
  };
}

function parseJoinedAssignmentNeedRow(raw: Record<string, unknown>): (Assignment & { need: Need }) | null {
  const nestedNeedUnknown = raw['need'];
  if (!isRecord(nestedNeedUnknown)) {
    return null;
  }

  const assignmentShape: Record<string, unknown> = { ...raw };
  delete assignmentShape['need'];

  const assignment = parseAssignmentRecord(assignmentShape);
  const need = parseNeedRecord(nestedNeedUnknown);

  if (!assignment || !need) {
    return null;
  }

  return { ...assignment, need };
}

function stripUndefined<T extends Record<string, unknown>>(payload: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(payload).filter(([, v]) => v !== undefined),
  );
}

async function rollbackAssignment(insertedId: string): Promise<void> {
  await supabase.from('assignments').delete().eq('id', insertedId);
}

export async function submitNeed(need: SubmitNeedInput): Promise<Need | null> {
  try {
    const payload = stripUndefined({
      submitter_name: need.submitter_name,
      lat: need.lat,
      lng: need.lng,
      need_type: need.need_type,
      description: need.description,
      urgency_self: need.urgency_self,
      event_id: need.event_id,
    });

    const { data, error } = await supabase
      .from('needs')
      .insert(payload)
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('[submitNeed]', error.message);
      return null;
    }

    return parseNeedRecord(data);
  } catch {
    return null;
  }
}

export async function updateNeedTriage(needId: string, triage: TriageResult): Promise<Need | null> {
  try {
    const { data, error } = await supabase
      .from('needs')
      .update({
        urgency_ai: triage.urgency_ai,
        ai_brief: triage.ai_brief,
        ai_matched_skills: triage.ai_matched_skills,
      })
      .eq('id', needId)
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('[updateNeedTriage]', error.message);
      return null;
    }

    return parseNeedRecord(data);
  } catch {
    return null;
  }
}

export async function updateNeedStatus(
  needId: string,
  status: NeedStatus,
  volunteerId?: string,
): Promise<Need | null> {
  try {
    const updatePayload =
      volunteerId === undefined ? { status } : { status, assigned_volunteer_id: volunteerId };

    const { data, error } = await supabase
      .from('needs')
      .update(updatePayload)
      .eq('id', needId)
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('[updateNeedStatus]', error.message);
      return null;
    }

    return parseNeedRecord(data);
  } catch {
    return null;
  }
}

export async function getAllNeeds(eventId?: string): Promise<Need[] | null> {
  try {
    const queryBuilder = supabase.from('needs').select('*');

    const scoped = eventId ? queryBuilder.eq('event_id', eventId) : queryBuilder;

    const { data, error } = await scoped.order('created_at', { ascending: false });

    if (error) {
      console.error('[getAllNeeds]', error.message);
      return null;
    }

    if (!Array.isArray(data)) {
      return [];
    }

    const needs: Need[] = [];
    for (const raw of data) {
      const need = parseNeedRecord(raw);
      if (need) {
        needs.push(need);
      }
    }

    return needs;
  } catch {
    return null;
  }
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

export async function updateVolunteerStatus(
  volunteerId: string,
  available: boolean,
  missionId?: string,
): Promise<Volunteer | null> {
  try {
    const patch: Record<string, unknown> = {
      available,
    };

    if (missionId !== undefined) {
      patch.active_mission_id = missionId;
    }

    const { data, error } = await supabase
      .from('volunteers')
      .update(patch)
      .eq('id', volunteerId)
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('[updateVolunteerStatus]', error.message);
      return null;
    }

    return parseVolunteerRecord(data);
  } catch {
    return null;
  }
}

export async function getAvailableVolunteers(): Promise<Volunteer[] | null> {
  try {
    const { data, error } = await supabase
      .from('volunteers')
      .select('*')
      .eq('available', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('[getAvailableVolunteers]', error.message);
      return null;
    }

    if (!Array.isArray(data)) {
      return [];
    }

    const volunteers: Volunteer[] = [];
    for (const raw of data) {
      const volunteer = parseVolunteerRecord(raw);
      if (volunteer) {
        volunteers.push(volunteer);
      }
    }

    return volunteers;
  } catch {
    return null;
  }
}

export async function createAssignment(
  needId: string,
  volunteerId: string,
  notes?: string,
): Promise<Assignment | null> {
  try {
    const insertPayload = {
      need_id: needId,
      volunteer_id: volunteerId,
      coordinator_notes: typeof notes === 'string' && notes.trim().length > 0 ? notes : null,
    };

    const { data, error } = await supabase
      .from('assignments')
      .insert(insertPayload)
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('[createAssignment]', error.message);
      return null;
    }

    const assignment = parseAssignmentRecord(data);
    if (!assignment?.id) {
      return null;
    }

    const needUpdate = await updateNeedStatus(needId, 'assigned', volunteerId);
    if (!needUpdate) {
      await rollbackAssignment(assignment.id);
      return null;
    }

    const volunteerUpdate = await updateVolunteerStatus(volunteerId, false, needId);
    if (!volunteerUpdate) {
      await rollbackAssignment(assignment.id);
      return null;
    }

    return assignment;
  } catch {
    return null;
  }
}

export async function updateAssignmentStatus(
  assignmentId: string,
  status: AssignmentStatus,
): Promise<Assignment | null> {
  try {
    const patch: Record<string, unknown> = { status };

    if (status === 'completed') {
      patch.completed_at = new Date().toISOString();
    } else if (status === 'assigned') {
      patch.completed_at = null;
    }

    const { data, error } = await supabase
      .from('assignments')
      .update(patch)
      .eq('id', assignmentId)
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('[updateAssignmentStatus]', error.message);
      return null;
    }

    return parseAssignmentRecord(data);
  } catch {
    return null;
  }
}

export async function getMyAssignments(
  volunteerId: string,
): Promise<(Assignment & { need: Need })[] | null> {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select(
        `
          id,
          need_id,
          volunteer_id,
          assigned_at,
          status,
          completed_at,
          coordinator_notes,
          need:needs (*)
        `,
      )
      .eq('volunteer_id', volunteerId);

    if (error) {
      console.error('[getMyAssignments]', error.message);
      return null;
    }

    if (!Array.isArray(data)) {
      return [];
    }

    const items: (Assignment & { need: Need })[] = [];
    for (const raw of data) {
      if (!isRecord(raw)) {
        continue;
      }

      const parsed = parseJoinedAssignmentNeedRow(raw);
      if (!parsed) {
        continue;
      }

      items.push(parsed);
    }

    return items;
  } catch {
    return null;
  }
}

export async function getActiveVolunteerMission(
  authUserId: string,
): Promise<(Assignment & { need: Need }) | null> {
  try {
    const volunteer = await getVolunteerProfileByAuthUser(authUserId);

    if (!volunteer) {
      return null;
    }

    const assignments = await getMyAssignments(volunteer.id);
    if (!assignments) {
      return null;
    }

    const active = assignments.filter((row) => ACTIVE_ASSIGNMENT_STATUSES.includes(row.status));
    active.sort(
      (a, b) => new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime(),
    );

    return active[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Idempotent client-side bootstrap for demo needs tied to {@link getActiveEvent}.
 * The six scripted volunteer identities still rely on Dashboard SQL (`supabase/seed.sql`) because each row must map to `auth.users`.
 */
export async function seedDemoData(): Promise<boolean | null> {
  try {
    const event = await getActiveEvent();

    if (!event) {
      console.error('[seedDemoData] No active event exists — seed the events table first.');
      return null;
    }

    const payloads = DEMO_NEED_UPSERT_ROWS.map((demoNeed) => ({
      ...demoNeed,
      event_id: event.id,
    }));

    const { error } = await supabase.from('needs').upsert(payloads, { onConflict: 'id' });

    if (error) {
      console.error('[seedDemoData]', error.message);
      return null;
    }

    console.warn(
      '[seedDemoData] Ensured demo needs rowset. Populate six volunteers separately via Dashboard SQL.',
    );

    return true;
  } catch {
    return null;
  }
}
