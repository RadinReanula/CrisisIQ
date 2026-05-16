-- Coordinator panel: INSERT assignments + UPDATE needs after assign.
-- RLS already restricts these to coordinators; Postgres still needs table GRANTs.

GRANT INSERT ON TABLE public.assignments TO authenticated;

GRANT UPDATE ON TABLE public.needs TO authenticated;
