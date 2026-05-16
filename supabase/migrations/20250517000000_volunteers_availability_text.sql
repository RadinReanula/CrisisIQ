-- Keeps boolean `available` for queries; adds/normalizes text `availability` for UI labels
-- ('available' | 'standby'). Handles an existing boolean `availability` column (manual dashboard change).

DO $$
BEGIN
  -- User added boolean `availability` in Supabase UI: convert to text labels.
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'volunteers'
      AND column_name = 'availability'
      AND data_type = 'boolean'
  ) THEN
    ALTER TABLE public.volunteers RENAME COLUMN availability TO availability_bool_legacy;
    ALTER TABLE public.volunteers ADD COLUMN availability text;
    UPDATE public.volunteers
    SET availability = CASE
      WHEN availability_bool_legacy THEN 'available'
      ELSE 'standby'
    END;
    ALTER TABLE public.volunteers DROP COLUMN availability_bool_legacy;
  ELSIF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'volunteers'
      AND column_name = 'availability'
  ) THEN
    ALTER TABLE public.volunteers ADD COLUMN availability text;
    UPDATE public.volunteers
    SET availability = CASE
      WHEN coalesce(available, false) THEN 'available'
      ELSE 'standby'
    END;
  ELSE
    -- `availability` already text: normalize unknown labels, then backfill empties.
    UPDATE public.volunteers
    SET availability = CASE WHEN coalesce(available, false) THEN 'available' ELSE 'standby' END
    WHERE availability IS NULL
       OR trim(availability) = ''
       OR availability NOT IN ('available', 'standby');
  END IF;
END $$;

ALTER TABLE public.volunteers
  ALTER COLUMN availability SET DEFAULT 'standby';

ALTER TABLE public.volunteers
  DROP CONSTRAINT IF EXISTS volunteers_availability_text_check;

ALTER TABLE public.volunteers
  ADD CONSTRAINT volunteers_availability_text_check
  CHECK (availability IN ('available', 'standby'));

ALTER TABLE public.volunteers
  ALTER COLUMN availability SET NOT NULL;
