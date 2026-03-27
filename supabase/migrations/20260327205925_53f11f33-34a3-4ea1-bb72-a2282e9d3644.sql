-- ============================================================
-- Clean slate: drop ALL existing policies on promotions
-- ============================================================
DROP POLICY IF EXISTS "Allow authenticated users to manage promotions" ON public.promotions;
DROP POLICY IF EXISTS "Allow authenticated users to read promotions" ON public.promotions;
DROP POLICY IF EXISTS "Allow authenticated users to insert promotions" ON public.promotions;
DROP POLICY IF EXISTS "Allow authenticated users to update promotions" ON public.promotions;
DROP POLICY IF EXISTS "Allow authenticated users to delete promotions" ON public.promotions;
DROP POLICY IF EXISTS "Authenticated users can read promotions" ON public.promotions;
DROP POLICY IF EXISTS "Authenticated users can insert promotions" ON public.promotions;
DROP POLICY IF EXISTS "Authenticated users can update promotions" ON public.promotions;
DROP POLICY IF EXISTS "Authenticated users can delete promotions" ON public.promotions;
DROP POLICY IF EXISTS "Admins can insert promotions" ON public.promotions;
DROP POLICY IF EXISTS "Admins can update promotions" ON public.promotions;
DROP POLICY IF EXISTS "Admins can delete promotions" ON public.promotions;
DROP POLICY IF EXISTS "Admin users can manage promotions" ON public.promotions;
DROP POLICY IF EXISTS "Anyone can view active promotions" ON public.promotions;
DROP POLICY IF EXISTS "Public can view active promotions" ON public.promotions;

-- ============================================================
-- Clean slate: drop ALL existing policies on promotions_rules
-- ============================================================
DROP POLICY IF EXISTS "Allow authenticated users to manage promotion rules" ON public.promotions_rules;
DROP POLICY IF EXISTS "Allow authenticated users to read promotion rules" ON public.promotions_rules;
DROP POLICY IF EXISTS "Allow authenticated users to insert promotion rules" ON public.promotions_rules;
DROP POLICY IF EXISTS "Allow authenticated users to update promotion rules" ON public.promotions_rules;
DROP POLICY IF EXISTS "Allow authenticated users to delete promotion rules" ON public.promotions_rules;
DROP POLICY IF EXISTS "Authenticated users can read promotion rules" ON public.promotions_rules;
DROP POLICY IF EXISTS "Authenticated users can insert promotions_rules" ON public.promotions_rules;
DROP POLICY IF EXISTS "Authenticated users can update promotions_rules" ON public.promotions_rules;
DROP POLICY IF EXISTS "Authenticated users can delete promotions_rules" ON public.promotions_rules;
DROP POLICY IF EXISTS "Admins can insert promotion rules" ON public.promotions_rules;
DROP POLICY IF EXISTS "Admins can update promotion rules" ON public.promotions_rules;
DROP POLICY IF EXISTS "Admins can delete promotion rules" ON public.promotions_rules;
DROP POLICY IF EXISTS "Admin users can manage promotion rules" ON public.promotions_rules;

-- ============================================================
-- promotions: new clean policies
-- ============================================================
CREATE POLICY "Authenticated users can read promotions"
ON public.promotions FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can insert promotions"
ON public.promotions FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update promotions"
ON public.promotions FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete promotions"
ON public.promotions FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- promotions_rules: new clean policies
-- ============================================================
CREATE POLICY "Authenticated users can read promotion rules"
ON public.promotions_rules FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can insert promotion rules"
ON public.promotions_rules FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update promotion rules"
ON public.promotions_rules FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete promotion rules"
ON public.promotions_rules FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));