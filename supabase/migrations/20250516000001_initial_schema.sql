-- CrisisIQ — full schema, RLS, realtime, indexes
-- Coordinators are identified via auth JWT user_metadata.role = 'coordinator'
-- Safe to paste into a blank Supabase project SQL editor (omit if migrations already ran).

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Helper: coordinator check (SECURITY DEFINER + locked search_path)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_coordinator()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT coalesce(
    auth.jwt() -> 'user_metadata' ->> 'role' = 'coordinator'
    OR auth.jwt() -> 'app_metadata' ->> 'role' = 'coordinator',
    false
  );
$$;

REVOKE ALL ON FUNCTION public.is_coordinator() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_coordinator() TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- EVENTS
-- ---------------------------------------------------------------------------

CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  lat float8,
  lng float8,
  radius_km float4 DEFAULT 50,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_select_public" ON public.events
  FOR SELECT USING (true);

CREATE POLICY "events_insert_coordinator" ON public.events
  FOR INSERT TO authenticated
  WITH CHECK (public.is_coordinator());

CREATE POLICY "events_update_coordinator" ON public.events
  FOR UPDATE TO authenticated
  USING (public.is_coordinator())
  WITH CHECK (public.is_coordinator());

CREATE POLICY "events_delete_coordinator" ON public.events
  FOR DELETE TO authenticated
  USING (public.is_coordinator());

-- ---------------------------------------------------------------------------
-- VOLUNTEERS (created before needs for FK ordering)
-- ---------------------------------------------------------------------------

CREATE TABLE public.volunteers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name text NOT NULL,
  lat float8 NOT NULL,
  lng float8 NOT NULL,
  skills text[] DEFAULT '{}'::text[],
  available boolean DEFAULT true,
  active_mission_id uuid,
  phone text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "volunteers_select_public" ON public.volunteers
  FOR SELECT USING (true);

CREATE POLICY "volunteers_insert_self" ON public.volunteers
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "volunteers_update_self" ON public.volunteers
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "volunteers_update_coordinator" ON public.volunteers
  FOR UPDATE TO authenticated
  USING (public.is_coordinator())
  WITH CHECK (public.is_coordinator());

-- ---------------------------------------------------------------------------
-- NEEDS
-- ---------------------------------------------------------------------------

CREATE TABLE public.needs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  submitter_name text NOT NULL,
  lat float8 NOT NULL,
  lng float8 NOT NULL,
  need_type text NOT NULL CHECK (need_type IN ('food','medical','rescue','shelter','other')),
  description text NOT NULL,
  urgency_self smallint DEFAULT 3 CHECK (urgency_self BETWEEN 1 AND 5),
  urgency_ai smallint CHECK (urgency_ai BETWEEN 1 AND 5),
  ai_brief text,
  ai_matched_skills text[] DEFAULT '{}'::text[],
  status text DEFAULT 'pending' CHECK (status IN ('pending','assigned','in_progress','resolved')),
  assigned_volunteer_id uuid REFERENCES public.volunteers (id) ON DELETE SET NULL,
  event_id uuid REFERENCES public.events (id) ON DELETE SET NULL
);

ALTER TABLE public.needs ENABLE ROW LEVEL SECURITY;

-- Public need submission (anonymous + signed-in callers)
CREATE POLICY "needs_insert_public" ON public.needs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "needs_select_public" ON public.needs
  FOR SELECT USING (true);

CREATE POLICY "needs_update_coordinator" ON public.needs
  FOR UPDATE TO authenticated
  USING (public.is_coordinator())
  WITH CHECK (public.is_coordinator());

-- ---------------------------------------------------------------------------
-- ASSIGNMENTS
-- ---------------------------------------------------------------------------

CREATE TABLE public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  need_id uuid NOT NULL REFERENCES public.needs (id) ON DELETE CASCADE,
  volunteer_id uuid NOT NULL REFERENCES public.volunteers (id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  status text DEFAULT 'assigned' CHECK (status IN ('assigned','en_route','arrived','completed')),
  completed_at timestamptz,
  coordinator_notes text
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assignments_select_public" ON public.assignments
  FOR SELECT USING (true);

CREATE POLICY "assignments_insert_coordinator" ON public.assignments
  FOR INSERT TO authenticated
  WITH CHECK (public.is_coordinator());

CREATE POLICY "assignments_update_coordinator" ON public.assignments
  FOR UPDATE TO authenticated
  USING (public.is_coordinator())
  WITH CHECK (public.is_coordinator());

CREATE POLICY "assignments_update_own_volunteer" ON public.assignments
  FOR UPDATE TO authenticated
  USING (
    volunteer_id IN (
      SELECT v.id FROM public.volunteers v WHERE v.user_id = auth.uid()
    )
  )
  WITH CHECK (
    volunteer_id IN (
      SELECT v.id FROM public.volunteers v WHERE v.user_id = auth.uid()
    )
  );

CREATE POLICY "assignments_delete_coordinator" ON public.assignments
  FOR DELETE TO authenticated
  USING (public.is_coordinator());

-- ---------------------------------------------------------------------------
-- volunteers.active_mission_id → active need (coordinates volunteer dashboard / map)
-- ---------------------------------------------------------------------------

ALTER TABLE public.volunteers
  ADD CONSTRAINT volunteers_active_mission_need_fk
  FOREIGN KEY (active_mission_id)
  REFERENCES public.needs (id)
  ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX idx_needs_status ON public.needs (status);
CREATE INDEX idx_needs_event_id ON public.needs (event_id);
CREATE INDEX idx_needs_created_at ON public.needs (created_at DESC);
CREATE INDEX idx_needs_urgency_ai ON public.needs (urgency_ai DESC NULLS LAST);

CREATE INDEX idx_volunteers_user_id ON public.volunteers (user_id);
CREATE INDEX idx_volunteers_available ON public.volunteers (available) WHERE available = true;

CREATE INDEX idx_assignments_need_id ON public.assignments (need_id);
CREATE INDEX idx_assignments_status ON public.assignments (status);
CREATE INDEX idx_assignments_volunteer_id ON public.assignments (volunteer_id);

-- ---------------------------------------------------------------------------
-- Realtime publication (+ replica identity for reliable change payloads)
-- ---------------------------------------------------------------------------

ALTER TABLE public.needs REPLICA IDENTITY FULL;
ALTER TABLE public.volunteers REPLICA IDENTITY FULL;
ALTER TABLE public.assignments REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.needs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.volunteers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.assignments;
