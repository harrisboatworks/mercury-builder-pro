-- Add sale_price to motor_models and stackable to promotions, and create promotions_rules table with RLS

-- 1) Add columns if not exist
ALTER TABLE public.motor_models
  ADD COLUMN IF NOT EXISTS sale_price numeric;

ALTER TABLE public.promotions
  ADD COLUMN IF NOT EXISTS stackable boolean NOT NULL DEFAULT false;

-- 2) Create promotions_rules table
CREATE TABLE IF NOT EXISTS public.promotions_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id uuid NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  rule_type text NOT NULL, -- e.g., 'all' | 'model' | 'motor_type' | 'horsepower_range'
  model text,
  motor_type text,
  horsepower_min numeric,
  horsepower_max numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3) Enable RLS and policies for promotions_rules
ALTER TABLE public.promotions_rules ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  -- SELECT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'promotions_rules' AND policyname = 'Public read access for promotions_rules'
  ) THEN
    CREATE POLICY "Public read access for promotions_rules"
    ON public.promotions_rules
    FOR SELECT
    USING (true);
  END IF;

  -- INSERT policy (authenticated users)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'promotions_rules' AND policyname = 'Authenticated users can insert promotions_rules'
  ) THEN
    CREATE POLICY "Authenticated users can insert promotions_rules"
    ON public.promotions_rules
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
  END IF;

  -- UPDATE policy (authenticated users)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'promotions_rules' AND policyname = 'Authenticated users can update promotions_rules'
  ) THEN
    CREATE POLICY "Authenticated users can update promotions_rules"
    ON public.promotions_rules
    FOR UPDATE
    USING (auth.uid() IS NOT NULL);
  END IF;

  -- DELETE policy (authenticated users)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'promotions_rules' AND policyname = 'Authenticated users can delete promotions_rules'
  ) THEN
    CREATE POLICY "Authenticated users can delete promotions_rules"
    ON public.promotions_rules
    FOR DELETE
    USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 4) Trigger to auto-update updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_promotions_rules_updated_at'
  ) THEN
    CREATE TRIGGER update_promotions_rules_updated_at
    BEFORE UPDATE ON public.promotions_rules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;