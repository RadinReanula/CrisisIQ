-- Public "Request help" form: one row per submission with explicit fields (not mashed into `needs.description`).
CREATE TABLE public.help_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  submitter_name text NOT NULL,
  contact text NOT NULL,
  need_type text NOT NULL CHECK (need_type IN ('food', 'medical', 'rescue', 'shelter', 'other')),
  location_text text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  description text NOT NULL CHECK (char_length(description) <= 300 AND char_length(description) >= 1),
  urgency text NOT NULL CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  event_id uuid REFERENCES public.events (id)
);

CREATE INDEX idx_help_requests_created_at ON public.help_requests (created_at DESC);

ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "help_requests_insert_anon"
  ON public.help_requests FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "help_requests_insert_authenticated"
  ON public.help_requests FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "help_requests_select_authenticated"
  ON public.help_requests FOR SELECT TO authenticated USING (true);

CREATE POLICY "help_requests_select_anon"
  ON public.help_requests FOR SELECT TO anon USING (true);

CREATE POLICY "help_requests_update_coordinator"
  ON public.help_requests FOR UPDATE TO authenticated
  USING (public.is_coordinator())
  WITH CHECK (public.is_coordinator());

GRANT SELECT, INSERT ON TABLE public.help_requests TO anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.help_requests TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.help_requests;
