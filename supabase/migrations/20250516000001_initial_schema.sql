-- CrisisIQ Initial Schema
-- Tables: events, volunteers, needs, assignments
-- RLS policies for anon, authenticated, and coordinator roles

-- Helper function to check coordinator role
CREATE OR REPLACE FUNCTION public.is_coordinator()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT coalesce(
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'coordinator',
    false
  );
$$;

-- ============================================================
-- EVENTS TABLE
-- ============================================================
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

CREATE POLICY "events_select_all" ON public.events
  FOR SELECT USING (true);

CREATE POLICY "events_insert_coordinator" ON public.events
  FOR INSERT WITH CHECK (public.is_coordinator());

CREATE POLICY "events_update_coordinator" ON public.events
  FOR UPDATE USING (public.is_coordinator());

-- ============================================================
-- VOLUNTEERS TABLE
-- ============================================================
CREATE TABLE public.volunteers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  lat float8 NOT NULL,
  lng float8 NOT NULL,
  skills text[] DEFAULT '{}',
  available boolean DEFAULT true,
  active_mission_id uuid,
  phone text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "volunteers_select_authenticated" ON public.volunteers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "volunteers_insert_authenticated" ON public.volunteers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "volunteers_update_own" ON public.volunteers
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Coordinators can update any volunteer (for assignments)
CREATE POLICY "volunteers_update_coordinator" ON public.volunteers
  FOR UPDATE TO authenticated
  USING (public.is_coordinator());

-- ============================================================
-- NEEDS TABLE
-- ============================================================
CREATE TABLE public.needs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  submitter_name text NOT NULL,
  lat float8 NOT NULL,
  lng float8 NOT NULL,
  need_type text NOT NULL CHECK (need_type IN ('food', 'medical', 'rescue', 'shelter', 'other')),
  description text NOT NULL,
  urgency_self int2 DEFAULT 3 CHECK (urgency_self BETWEEN 1 AND 5),
  urgency_ai int2 CHECK (urgency_ai BETWEEN 1 AND 5),
  ai_brief text,
  ai_matched_skills text[],
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'resolved')),
  assigned_volunteer_id uuid REFERENCES public.volunteers(id),
  event_id uuid REFERENCES public.events(id)
);

ALTER TABLE public.needs ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can submit a need
CREATE POLICY "needs_insert_anon" ON public.needs
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "needs_insert_authenticated" ON public.needs
  FOR INSERT TO authenticated WITH CHECK (true);

-- Authenticated users can view all needs
CREATE POLICY "needs_select_authenticated" ON public.needs
  FOR SELECT TO authenticated USING (true);

-- Anon can also view needs (for public status page)
CREATE POLICY "needs_select_anon" ON public.needs
  FOR SELECT TO anon USING (true);

-- Only coordinators can update needs
CREATE POLICY "needs_update_coordinator" ON public.needs
  FOR UPDATE TO authenticated
  USING (public.is_coordinator());

-- ============================================================
-- ASSIGNMENTS TABLE
-- ============================================================
CREATE TABLE public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  need_id uuid REFERENCES public.needs(id),
  volunteer_id uuid REFERENCES public.volunteers(id),
  assigned_at timestamptz DEFAULT now(),
  status text DEFAULT 'assigned' CHECK (status IN ('assigned', 'en_route', 'arrived', 'completed')),
  completed_at timestamptz,
  coordinator_notes text
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assignments_select_authenticated" ON public.assignments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "assignments_insert_coordinator" ON public.assignments
  FOR INSERT TO authenticated WITH CHECK (public.is_coordinator());

CREATE POLICY "assignments_update_coordinator" ON public.assignments
  FOR UPDATE TO authenticated
  USING (public.is_coordinator());

-- Volunteers can update their own assignment status (en_route, arrived)
CREATE POLICY "assignments_update_own_volunteer" ON public.assignments
  FOR UPDATE TO authenticated
  USING (
    volunteer_id IN (
      SELECT id FROM public.volunteers WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- Add foreign key for volunteers.active_mission_id now that needs exists
-- ============================================================
ALTER TABLE public.volunteers
  ADD CONSTRAINT volunteers_active_mission_fk
  FOREIGN KEY (active_mission_id) REFERENCES public.needs(id);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_needs_status ON public.needs(status);
CREATE INDEX idx_needs_event_id ON public.needs(event_id);
CREATE INDEX idx_needs_urgency_ai ON public.needs(urgency_ai DESC NULLS LAST);
CREATE INDEX idx_volunteers_available ON public.volunteers(available) WHERE available = true;
CREATE INDEX idx_assignments_status ON public.assignments(status);
CREATE INDEX idx_assignments_volunteer ON public.assignments(volunteer_id);

-- ============================================================
-- Enable Realtime for live updates
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.needs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.volunteers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.assignments;
