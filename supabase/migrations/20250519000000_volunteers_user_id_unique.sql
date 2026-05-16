-- One volunteer profile per Supabase auth user (required for upsert on registration).
CREATE UNIQUE INDEX IF NOT EXISTS volunteers_user_id_uidx ON public.volunteers (user_id);
