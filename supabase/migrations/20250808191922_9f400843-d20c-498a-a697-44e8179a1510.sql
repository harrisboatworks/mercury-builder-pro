-- Enhance motor_models to store detailed specs
ALTER TABLE public.motor_models
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS features JSONB,
  ADD COLUMN IF NOT EXISTS specifications JSONB,
  ADD COLUMN IF NOT EXISTS detail_url TEXT;

-- Optional: set defaults to avoid null JSON handling issues
ALTER TABLE public.motor_models
  ALTER COLUMN features SET DEFAULT '[]'::jsonb,
  ALTER COLUMN specifications SET DEFAULT '{}'::jsonb;

-- Update updated_at on change if trigger exists; create trigger if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_motor_models_updated_at'
  ) THEN
    CREATE TRIGGER trg_update_motor_models_updated_at
    BEFORE UPDATE ON public.motor_models
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;