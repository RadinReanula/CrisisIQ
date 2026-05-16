-- Volunteer dashboard: .from('assignments').select('*, needs(*)')
-- RLS policies exist from initial_schema, but PostgreSQL still requires explicit GRANTs.
-- Projects bootstrapped without these privileges surface:
--   "permission denied for table assignments"

GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT, UPDATE ON TABLE public.assignments TO authenticated;

-- Nested expansion loads related rows from `needs`; grant SELECT for authenticated JWTs.
GRANT SELECT ON TABLE public.needs TO authenticated;
