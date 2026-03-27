-- Drop stale policies on promotions_rules (underscore variants from 20250811)
DROP POLICY IF EXISTS "Admins can insert promotions_rules" ON public.promotions_rules;
DROP POLICY IF EXISTS "Admins can update promotions_rules" ON public.promotions_rules;
DROP POLICY IF EXISTS "Admins can delete promotions_rules" ON public.promotions_rules;
DROP POLICY IF EXISTS "Public read access for promotions_rules" ON public.promotions_rules;

-- Belt-and-suspenders: drop any stale is_admin() variants on promotions
DROP POLICY IF EXISTS "Admins can insert promotions" ON public.promotions;
DROP POLICY IF EXISTS "Admins can update promotions" ON public.promotions;
DROP POLICY IF EXISTS "Admins can delete promotions" ON public.promotions;

-- Re-create clean has_role() policies (only if not already present)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'promotions' AND policyname = 'Admins can insert promotions') THEN
    CREATE POLICY "Admins can insert promotions" ON public.promotions FOR INSERT TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'promotions' AND policyname = 'Admins can update promotions') THEN
    CREATE POLICY "Admins can update promotions" ON public.promotions FOR UPDATE TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'promotions' AND policyname = 'Admins can delete promotions') THEN
    CREATE POLICY "Admins can delete promotions" ON public.promotions FOR DELETE TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'promotions_rules' AND policyname = 'Admins can insert promotion rules') THEN
    CREATE POLICY "Admins can insert promotion rules" ON public.promotions_rules FOR INSERT TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'promotions_rules' AND policyname = 'Admins can update promotion rules') THEN
    CREATE POLICY "Admins can update promotion rules" ON public.promotions_rules FOR UPDATE TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'promotions_rules' AND policyname = 'Admins can delete promotion rules') THEN
    CREATE POLICY "Admins can delete promotion rules" ON public.promotions_rules FOR DELETE TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;