-- Drop existing overly-permissive policies on promotions_rules
DROP POLICY IF EXISTS "Allow authenticated users to manage promotion rules" ON public.promotions_rules;
DROP POLICY IF EXISTS "Allow authenticated users to read promotion rules" ON public.promotions_rules;
DROP POLICY IF EXISTS "Allow authenticated users to insert promotion rules" ON public.promotions_rules;
DROP POLICY IF EXISTS "Allow authenticated users to update promotion rules" ON public.promotions_rules;
DROP POLICY IF EXISTS "Allow authenticated users to delete promotion rules" ON public.promotions_rules;

-- SELECT: any authenticated user (quote builder needs to read rules)
CREATE POLICY "Authenticated users can read promotion rules"
ON public.promotions_rules FOR SELECT TO authenticated
USING (true);

-- INSERT: admin only
CREATE POLICY "Admins can insert promotion rules"
ON public.promotions_rules FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- UPDATE: admin only
CREATE POLICY "Admins can update promotion rules"
ON public.promotions_rules FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- DELETE: admin only
CREATE POLICY "Admins can delete promotion rules"
ON public.promotions_rules FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));