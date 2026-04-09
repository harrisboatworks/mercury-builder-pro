-- 1. Fix quotes bucket: replace permissive public read with authenticated-only read
DROP POLICY IF EXISTS "Public can read quotes PDFs" ON storage.objects;

CREATE POLICY "Authenticated users can read quotes PDFs"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'quotes');

-- 2. Fix inventory_updates: replace weak metadata-based admin check with has_role()
DROP POLICY IF EXISTS "Allow admin to view inventory updates" ON public.inventory_updates;

CREATE POLICY "Allow admin to view inventory updates"
ON public.inventory_updates
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Fix security definer views: set security_invoker = true
ALTER VIEW public.customer_summary SET (security_invoker = true);
ALTER VIEW public.email_analytics_summary SET (security_invoker = true);
ALTER VIEW public.mercury_motor_inventory SET (security_invoker = true);
ALTER VIEW public.parts_inventory SET (security_invoker = true);
ALTER VIEW public.service_history SET (security_invoker = true);
ALTER VIEW public.service_parts SET (security_invoker = true);
ALTER VIEW public.unit_inventory SET (security_invoker = true);