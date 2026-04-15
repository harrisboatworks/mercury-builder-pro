-- 1. Fix quotes bucket: drop anon upload, add service_role only
DROP POLICY IF EXISTS "Anon can upload quotes PDFs" ON storage.objects;
CREATE POLICY "Service role can upload quotes PDFs"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'quotes');

-- 2. Fix motor-images: replace broad auth upload with admin-only
DROP POLICY IF EXISTS "Authenticated users can upload motor images" ON storage.objects;
CREATE POLICY "Admins can upload motor images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'motor-images'
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

-- 3. Fix function search paths
ALTER FUNCTION public.update_payments_updated_at() SET search_path = 'public';
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public';
ALTER FUNCTION public.normalize_phone(text) SET search_path = 'public';
ALTER FUNCTION public.is_admin() SET search_path = 'public';