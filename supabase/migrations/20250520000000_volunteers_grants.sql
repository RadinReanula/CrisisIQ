-- Table privileges (in addition to RLS). Some projects miss GRANTs after manual DDL.
-- RLS still applies; authenticated clients need INSERT/UPDATE for volunteer self-service.

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE ON TABLE public.volunteers TO authenticated;
GRANT SELECT ON TABLE public.volunteers TO anon;
