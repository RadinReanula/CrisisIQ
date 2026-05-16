-- ============================================================
-- profiles — Volunteers + Coordinators, linked to auth.users
-- requests — Victim "Request help" form
-- ============================================================
-- Safe to run in the Supabase SQL Editor on an existing project.
-- Idempotent: re-running will not error if tables/policies already exist.

-- ------------------------------------------------------------
-- 0. Coordinator helper (no-op if 20250516000001_initial_schema
--    has already created it).
-- ------------------------------------------------------------
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
-- 1. PROFILES (one row per auth.users)
--    Stores every personal detail collected at sign-up.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role          text NOT NULL DEFAULT 'volunteer'
                CHECK (role IN ('volunteer', 'coordinator')),
  full_name     text NOT NULL DEFAULT '',
  phone         text NOT NULL DEFAULT '',
  email         text,
  skills        text[] NOT NULL DEFAULT '{}',
  availability  text NOT NULL DEFAULT 'available'
                CHECK (availability IN ('available', 'standby')),
  location_text text,
  lat           float8,
  lng           float8,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
CREATE POLICY "profiles_insert_self"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
CREATE POLICY "profiles_update_self"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_coordinator" ON public.profiles;
CREATE POLICY "profiles_update_coordinator"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_coordinator())
  WITH CHECK (public.is_coordinator());

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;

-- ------------------------------------------------------------
-- 1a. updated_at trigger
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_set_updated_at();

-- ------------------------------------------------------------
-- 1b. Auto-create a profile row when an auth user is created.
--     Pulls fields from auth.users.raw_user_meta_data
--     (the volunteer form already sets full_name + phone there).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, phone, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'volunteer'),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. REQUESTS (victim "Request help" form)
--    Every input on /submit maps to a column here.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  name          text NOT NULL,
  contact       text NOT NULL,
  need_type     text NOT NULL
                CHECK (need_type IN ('food', 'medical', 'rescue', 'shelter', 'other')),
  location_text text NOT NULL,
  lat           float8 NOT NULL,
  lng           float8 NOT NULL,
  description   text NOT NULL
                CHECK (char_length(description) BETWEEN 1 AND 300),
  urgency       text NOT NULL
                CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'assigned', 'in_progress', 'resolved')),
  event_id      uuid REFERENCES public.events(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_requests_created_at ON public.requests (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_status     ON public.requests (status);

ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "requests_insert_anon" ON public.requests;
CREATE POLICY "requests_insert_anon"
  ON public.requests FOR INSERT TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "requests_insert_authenticated" ON public.requests;
CREATE POLICY "requests_insert_authenticated"
  ON public.requests FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "requests_select_authenticated" ON public.requests;
CREATE POLICY "requests_select_authenticated"
  ON public.requests FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "requests_select_anon" ON public.requests;
CREATE POLICY "requests_select_anon"
  ON public.requests FOR SELECT TO anon
  USING (true);

DROP POLICY IF EXISTS "requests_update_coordinator" ON public.requests;
CREATE POLICY "requests_update_coordinator"
  ON public.requests FOR UPDATE TO authenticated
  USING (public.is_coordinator())
  WITH CHECK (public.is_coordinator());

GRANT SELECT, INSERT          ON TABLE public.requests TO anon;
GRANT SELECT, INSERT, UPDATE  ON TABLE public.requests TO authenticated;

-- ============================================================
-- 3. Realtime (idempotent: skip if already published)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename  = 'profiles'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename  = 'requests'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.requests';
  END IF;
END $$;
