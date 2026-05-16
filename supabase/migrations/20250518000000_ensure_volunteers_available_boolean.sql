-- Remote projects that evolved in the dashboard can end up with `availability` (text) but no boolean
-- `available`, which the API + coordinator queries expect. PostgREST then errors:
-- "Could not find the 'available' column of 'volunteers' in the schema cache"

ALTER TABLE public.volunteers
  ADD COLUMN IF NOT EXISTS available boolean DEFAULT true;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'volunteers'
      AND column_name = 'availability'
  ) THEN
    UPDATE public.volunteers
    SET available = CASE
      WHEN availability IS NULL THEN true
      ELSE trim(availability) = 'available'
    END;
  END IF;
END $$;

-- Partial index for coordinator "who is online" queries (safe if already present)
CREATE INDEX IF NOT EXISTS idx_volunteers_available
  ON public.volunteers (available)
  WHERE available = true;
