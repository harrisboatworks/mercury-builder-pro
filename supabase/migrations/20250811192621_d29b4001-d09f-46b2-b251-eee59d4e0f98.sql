-- Create financing_options table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS public.financing_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  rate numeric NOT NULL,
  term_months integer NOT NULL,
  min_amount numeric NOT NULL DEFAULT 0,
  is_promo boolean NOT NULL DEFAULT false,
  promo_text text,
  promo_end_date date,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  image_url text,
  image_alt_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure RLS is enabled
ALTER TABLE public.financing_options ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Public read access for financing_options'
  ) THEN
    CREATE POLICY "Public read access for financing_options"
    ON public.financing_options FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Authenticated users can insert financing_options'
  ) THEN
    CREATE POLICY "Authenticated users can insert financing_options"
    ON public.financing_options FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Authenticated users can update financing_options'
  ) THEN
    CREATE POLICY "Authenticated users can update financing_options"
    ON public.financing_options FOR UPDATE
    USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Authenticated users can delete financing_options'
  ) THEN
    CREATE POLICY "Authenticated users can delete financing_options"
    ON public.financing_options FOR DELETE
    USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Trigger for updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'financing_options_updated_at'
  ) THEN
    CREATE TRIGGER financing_options_updated_at
    BEFORE UPDATE ON public.financing_options
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Safety: add columns if table pre-existed without them
ALTER TABLE public.financing_options 
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS image_alt_text TEXT;

-- Update the Mercury promo with a placeholder image and alt text (no-op if row absent)
UPDATE public.financing_options 
SET image_url = 'https://example.com/mercury-finance-banner.jpg',
    image_alt_text = 'Mercury Finance - 4.9% APR Summer Special'
WHERE name = 'Mercury Summer Promo';

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_financing_options_display_order ON public.financing_options (display_order);
CREATE INDEX IF NOT EXISTS idx_financing_options_is_active ON public.financing_options (is_active);
CREATE INDEX IF NOT EXISTS idx_financing_options_min_amount ON public.financing_options (min_amount);