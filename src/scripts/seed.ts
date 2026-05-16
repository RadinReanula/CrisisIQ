/// <reference types="node" />

/**
 * M2 demo database seed — run once locally with the **service role** key.
 *
 * ## Run
 * ```
 * npm run seed:demo
 * ```
 *
 * ## Env (e.g. `.env.local`; never commit the service role)
 * - `VITE_SUPABASE_URL` **or** `SUPABASE_URL` — project URL
 * - `SUPABASE_SERVICE_ROLE_KEY` — **service role** (required for inserts + Auth Admin API)
 * - Optional: `SEED_VOLUNTEER_PASSWORD` — password for scripted volunteer Auth users (default below)
 *
 * ## Coordinator (**manual dashboard step — M1 demo login**)
 * Supabase Dashboard → Authentication → Users → Add user:
 * - Email: `coordinator@crisisiq.demo`
 * - Password: `Crisis2025!`
 * - Confirm email (or toggle “auto confirm” in dev)
 * - User metadata JSON: `{ "role": "coordinator", "name": "Ops Commander" }`
 */

import { config } from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { NeedStatus, NeedType, VolunteerSkill } from '../types';

config({ path: '.env.local' });
config({ path: '.env' });

const VOLUNTEER_AUTH_PASSWORD =
  typeof process.env.SEED_VOLUNTEER_PASSWORD === 'string' && process.env.SEED_VOLUNTEER_PASSWORD
    ? process.env.SEED_VOLUNTEER_PASSWORD
    : 'Crisis2025!Volunteer';

interface VolunteerSeedEntry {
  email: string;
  name: string;
  skills: VolunteerSkill[];
  lat: number;
  lng: number;
}

interface NeedSeedDraft {
  submitter_name: string;
  delta: readonly [dLat: number, dLng: number];
  need_type: NeedType;
  description: string;
  urgency_self: number;
  status: Exclude<NeedStatus, 'in_progress'>;
}

const VOLUNTEER_PROFILES: readonly VolunteerSeedEntry[] = [
  {
    email: 'seed-kamal-perera@crisisiq.demo',
    name: 'Kamal Perera',
    skills: ['rescue', 'driving'],
    lat: 6.92,
    lng: 79.85,
  },
  {
    email: 'seed-nirmala-silva@crisisiq.demo',
    name: 'Nirmala Silva',
    skills: ['medical', 'translation'],
    lat: 6.94,
    lng: 79.88,
  },
  {
    email: 'seed-ashan-fernando@crisisiq.demo',
    name: 'Ashan Fernando',
    skills: ['driving', 'logistics'],
    lat: 6.9,
    lng: 79.84,
  },
  {
    email: 'seed-priya-wickrama@crisisiq.demo',
    name: 'Priya Wickrama',
    skills: ['cooking', 'medical'],
    lat: 6.93,
    lng: 79.87,
  },
  {
    email: 'seed-nuwan-jayasinghe@crisisiq.demo',
    name: 'Nuwan Jayasinghe',
    skills: ['rescue', 'driving', 'logistics'],
    lat: 6.91,
    lng: 79.86,
  },
  {
    email: 'seed-dilini-rathnayake@crisisiq.demo',
    name: 'Dilini Rathnayake',
    skills: ['translation', 'cooking'],
    lat: 6.95,
    lng: 79.89,
  },
];

const NEED_DEFINITIONS = [
  {
    submitter_name: 'Rohana Weerasinghe',
    delta: [0.012, -0.004] as const,
    need_type: 'rescue',
    description:
      'Elderly woman, 78, trapped on second floor. Water rising above knee height on staircase; cannot descend.',
    urgency_self: 5,
    status: 'pending',
  },
  {
    submitter_name: 'Ishani Dias',
    delta: [-0.006, 0.011] as const,
    need_type: 'medical',
    description:
      'Child with worsening asthma; inhaler submerged. Breath sounds tight, requests oxygen-ready responder.',
    urgency_self: 5,
    status: 'pending',
  },
  {
    submitter_name: 'Kelum Bandara',
    delta: [0.045, -0.02] as const,
    need_type: 'shelter',
    description:
      'Three families under roadside tarp overnight — need dry hardened shelter footprint away from runoff.',
    urgency_self: 5,
    status: 'pending',
  },
  {
    submitter_name: 'Manel Wijewardene',
    delta: [0.024, -0.018] as const,
    need_type: 'food',
    description:
      'Community kitchen serving 180 people; staples will run dry by midday unless inbound convoy diverts.',
    urgency_self: 3,
    status: 'pending',
  },
  {
    submitter_name: 'Sajith Fonseka',
    delta: [-0.02, -0.03] as const,
    need_type: 'shelter',
    description:
      'Hall shelter leaking sideways rain through broken louvres; needs sheeting + fasteners before night.',
    urgency_self: 3,
    status: 'pending',
  },
  {
    submitter_name: 'Chathuri Abeysinghe',
    delta: [-0.012, -0.02] as const,
    need_type: 'medical',
    description:
      'Postpartum incision showing infection signs — sterile gauze scarce; mobilise clinician with sterile kit.',
    urgency_self: 3,
    status: 'pending',
  },
  {
    submitter_name: 'Gamini Herath',
    delta: [0.065, -0.002] as const,
    need_type: 'food',
    description:
      'Meals-On-Wheels round cancelled due to inundated alley; diabetic seniors skipped lunch altogether.',
    urgency_self: 3,
    status: 'pending',
  },
  {
    submitter_name: 'Fathima Rizvi',
    delta: [0.036, -0.014] as const,
    need_type: 'other',
    description:
      'Tamil-first household misunderstood English dispatch — translator needed at pickup point ASAP.',
    urgency_self: 2,
    status: 'pending',
  },
  {
    submitter_name: 'Dinesh Aloysius',
    delta: [-0.04, -0.01] as const,
    need_type: 'rescue',
    description:
      'Family has boat but inexperienced crew — needs rescue-qualified pair for three non-swimmer evacuees.',
    urgency_self: 2,
    status: 'pending',
  },
  {
    submitter_name: 'Udeni Rathnaweera',
    delta: [0.04, -0.012] as const,
    need_type: 'medical',
    description:
      'Courier cannot reach insulin pharmacy — requires cold-chain handoff volunteer with dry bag.',
    urgency_self: 1,
    status: 'pending',
  },
  {
    submitter_name: 'Kosala Tennakoon',
    delta: [-0.02, -0.04] as const,
    need_type: 'rescue',
    description:
      'Completed evacuation: bungalow roof survivors now at hall B — tagging resolved for coordinators.',
    urgency_self: 4,
    status: 'resolved',
  },
  {
    submitter_name: 'Hiranthi Amarasinghe',
    delta: [0.02, -0.06] as const,
    need_type: 'food',
    description:
      'Completed: bulk rice/flour pallets delivered — temple organisers reopening stoves within the hour.',
    urgency_self: 4,
    status: 'resolved',
  },
] as const satisfies readonly NeedSeedDraft[];

function jitterFromEvent(lat: number, lng: number, deltas: readonly [number, number]): readonly [number, number] {
  return [round(lat + deltas[0]), round(lng + deltas[1])];
}

function round(value: number): number {
  return Math.round(value * 100_000) / 100_000;
}

async function locateAuthUserId(supabase: SupabaseClient, email: string): Promise<string | null> {
  let page = 1;
  const perPage = 200;

  while (page <= 80) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      console.warn('[seed] listUsers stalled:', error.message);
      return null;
    }

    const batch = data?.users ?? [];
    const matched = batch.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (matched?.id) {
      return matched.id;
    }

    if (batch.length < perPage) {
      break;
    }

    page += 1;
  }

  return null;
}

async function ensureVolunteerRow(
  supabase: SupabaseClient,
  entry: VolunteerSeedEntry,
): Promise<string> {
  const createOutcome = await supabase.auth.admin.createUser({
    email: entry.email,
    password: VOLUNTEER_AUTH_PASSWORD,
    email_confirm: true,
    user_metadata: {
      demo_seed_volunteer: true,
      name: entry.name,
    },
  });

  let userId = createOutcome.data?.user?.id ?? null;

  if (createOutcome.error) {
    const message = createOutcome.error.message?.toLowerCase() ?? '';

    const duplicate = message.includes('registered') || message.includes('duplicate');

    if (!duplicate) {
      throw createOutcome.error;
    }

    userId = await locateAuthUserId(supabase, entry.email);
    if (!userId) {
      throw createOutcome.error;
    }
  }

  if (!userId) {
    throw new Error(`Missing auth UID for volunteer ${entry.email}`);
  }

  await supabase.from('volunteers').delete().eq('user_id', userId);

  const { data, error } = await supabase
    .from('volunteers')
    .insert({
      user_id: userId,
      name: entry.name,
      lat: entry.lat,
      lng: entry.lng,
      skills: entry.skills,
      available: true,
      active_mission_id: null,
      phone: null,
    })
    .select('id')
    .single();

  if (error || !data?.id) {
    throw error ?? new Error('Volunteer insert failed');
  }

  return data.id;
}

async function patchNeedTriage(
  supabase: SupabaseClient,
  needId: string,
  triage: Readonly<{ urgency_ai: number; ai_brief: string; ai_matched_skills: VolunteerSkill[] }>,
): Promise<void> {
  const { error } = await supabase
    .from('needs')
    .update({
      urgency_ai: triage.urgency_ai,
      ai_brief: triage.ai_brief,
      ai_matched_skills: triage.ai_matched_skills,
    })
    .eq('id', needId);

  if (error) {
    throw error;
  }
}

async function attachAssignmentBundle(
  supabase: SupabaseClient,
  needId: string,
  volunteerPk: string,
  notes: string,
): Promise<void> {
  const { error: assignmentError } = await supabase.from('assignments').insert({
    need_id: needId,
    volunteer_id: volunteerPk,
    coordinator_notes: notes,
    status: 'assigned',
    completed_at: null,
  });

  if (assignmentError) {
    throw assignmentError;
  }

  const { error: needError } = await supabase
    .from('needs')
    .update({
      status: 'assigned',
      assigned_volunteer_id: volunteerPk,
    })
    .eq('id', needId);

  if (needError) {
    throw needError;
  }

  const { error: volunteerError } = await supabase
    .from('volunteers')
    .update({
      available: false,
      active_mission_id: needId,
    })
    .eq('id', volunteerPk);

  if (volunteerError) {
    throw volunteerError;
  }
}

function synthesisedTriage(): Readonly<
  readonly [number, string, VolunteerSkill[]]
>[] {

  return [

    [5, 'Roof-bound elder needs immediate hoist-capable responders before stairwell inundates.', ['rescue', 'driving']],

    [
      5,
      'Paediatric respiratory compromise — advance medic with spacer + salbutamol supply line.',
      ['medical', 'driving'],
    ],

    [5, 'Large-party shelter saturation risk tonight — logistics cell to tarp + berth families.', ['logistics', 'driving']],

    [
      3,
      'Food lines stable if convoy hugs Ring Road spur; optimise unload chute for elders first.',
      ['cooking', 'logistics'],
    ],

    [
      3,
      'Light civil seal needed on louvres; materials-only deployment acceptable if rains ease.',
      ['logistics'],
    ],

    [
      3,
      'Obstetrics-adjacent infection control — escalate dressing refresh before shift change.',
      ['medical', 'driving'],
    ],

    [3, 'Special-diets cluster — cold boxes recommended for insulin-dependent seniors awaiting meals.', ['cooking', 'logistics', 'driving']],

    [3, 'Multilingual dispatch desk gap — bilingual coordinator prevents mis-route on manifests.', ['translation', 'logistics']],
  ];

}

async function bootstrapEvent(supabase: SupabaseClient): Promise<{ id: string; lat: number; lng: number }> {
  const { data: row, error: activeLookupErr } = await supabase

    .from('events')


    .select('id,lat,lng')


    .eq('active', true)


    .order('created_at', { ascending: false })

    .limit(1)

    .maybeSingle();

  if (activeLookupErr) {
    console.error('[seed] Active event lookup failed:', activeLookupErr.message);
    throw activeLookupErr;
  }

  const latKnown = typeof row?.lat === 'number' && Number.isFinite(row.lat);

  const lngKnown = typeof row?.lng === 'number' && Number.isFinite(row.lng);

  if (row?.id && latKnown && lngKnown && row.lat !== undefined && row.lng !== undefined) {
    console.info('[seed] Using existing active event', row.id);
    return { id: row.id, lat: row.lat, lng: row.lng };
  }

  console.warn('[seed] No usable active event geometry — provisioning synthetic event row.');

  const { data, error } = await supabase
    .from('events')
    .insert({
      name: 'Colombo Flood Response — Script Seeded Demo',
      description: 'Automatically provisioned CrisisIQ geography anchor for scripted volunteers/needs.',
      lat: 6.927_1,
      lng: 79.861_2,
      radius_km: 72,
      active: true,
    })
    .select('id, lat, lng')
    .maybeSingle();

  if (error || !data?.id || typeof data.lat !== 'number' || typeof data.lng !== 'number') {

    console.error('[seed]', error ?? 'Synthetic event provisioning failed');


    throw error ?? new Error('Synthetic geometry bootstrap failed');


  }

  console.info('[seed] Synthetic event:', data.id);
  return { id: data.id, lat: data.lat, lng: data.lng };
}

function composeServiceClient(): SupabaseClient {


  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';


  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';


  if (!supabaseUrl.trim() || !serviceKey.trim()) {


    console.error('[seed] Require SUPABASE_SERVICE_ROLE_KEY and SUPABASE/VITE SUPABASE_URL.');

    process.exit(1);


  }



  return createClient(supabaseUrl, serviceKey, {

    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },


  });

}

async function run(): Promise<void> {

  console.info('[seed] CrisisIQ demo seed starting');


  const supabase = composeServiceClient();


  const venue = await bootstrapEvent(supabase);


  const volunteerIds = await Promise.all(

    VOLUNTEER_PROFILES.map(async (entry) => {


      console.info('[seed] Ensuring volunteer', entry.email);


      return ensureVolunteerRow(supabase, entry);


    }),

  );


  const needDraftRows = NEED_DEFINITIONS.map((def) => {


    const [plat, plng] = jitterFromEvent(venue.lat, venue.lng, def.delta);


    const statusForInsert =
      def.status === 'resolved' ? 'resolved' : 'pending';


    return {


      submitter_name: def.submitter_name,

      lat: plat,

      lng: plng,

      need_type: def.need_type,

      description: def.description,

      urgency_self: def.urgency_self,

      status: statusForInsert,

      urgency_ai:
        statusForInsert === 'resolved'


          ? Math.min(Math.max(def.urgency_self, 4), 5)


          : null,

      ai_brief: statusForInsert === 'resolved' ? 'Historical closure entry — dashboard analytics only.' : null,

      ai_matched_skills: [],

      assigned_volunteer_id: null,

      event_id: venue.id,

    };

  });


  const { data: insertedNeeds, error: needInsertErr } = await supabase.from('needs').insert(needDraftRows).select('id');


  if (needInsertErr || !insertedNeeds) {


    console.error('[seed]', needInsertErr);


    throw needInsertErr ?? new Error('Need batch insert crashed');


  }

  const injectedIds = insertedNeeds.map((row) => row.id);


  const triages = synthesisedTriage();


  await Promise.all(


    injectedIds.slice(0, Math.min(8, triages.length)).map((id, ordinal) => {


      const trio = triages[ordinal];

      if (!id || !trio) {
        return Promise.resolve();


      }



      const [urgency_ai, ai_brief, ai_skills] = trio;


      return patchNeedTriage(supabase, id, {


        urgency_ai,

        ai_brief,

        ai_matched_skills: ai_skills,


      });

    }),

  );


  const assignmentPlans = [


    {


      draftIndex: 0,

      volunteerIndex: 0,

      coordinator_notes:

        'Rope-assisted extraction — hoist team converging southwest landing; ETA 07 minutes humid conditions.',


    },


    {

      draftIndex: 1,

      volunteerIndex: 1,

      coordinator_notes:


        'Paeds medic double-check spacer inventory before rendezvous.',


    },

    {

      draftIndex: 6,

      volunteerIndex: 3,

      coordinator_notes:


        'Insulin bag chain-of-custody: photograph box seal before departing pharmacy.',


    },

    {


      draftIndex: 5,

      volunteerIndex: 4,

      coordinator_notes: 'Swap sterile gauze pallets with midwife liaison on Scene C.',


    },

  ];

  await Promise.all(

    assignmentPlans.map(async ({ draftIndex, volunteerIndex, coordinator_notes }) => {


      const needIdCandidate = injectedIds[draftIndex];


      const volunteerPkCandidate = volunteerIds[volunteerIndex];



      if (!needIdCandidate || !volunteerPkCandidate) {

        throw new Error('Assignment wiring missing PK');

      }


      return attachAssignmentBundle(

        supabase,

        needIdCandidate,

        volunteerPkCandidate,

        coordinator_notes,

      );


    }),

  );


  console.info('[seed] Completed ✅');
  console.info('[seed] Scripted volunteer Auth password:', VOLUNTEER_AUTH_PASSWORD);
}

run().catch((err) => {
  console.error('[seed] Fatal error', err);
  process.exit(1);
});
