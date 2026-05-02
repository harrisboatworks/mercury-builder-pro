-- Storage admin write policies (idempotent)
DROP POLICY IF EXISTS "Authenticated users can upload hero images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload inventory images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update motor images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete motor images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload inventory photos" ON storage.objects;

DROP POLICY IF EXISTS "Admins can upload hero images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload inventory images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update motor images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete motor images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload inventory photos" ON storage.objects;

CREATE POLICY "Admins can upload hero images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'motor-images' AND name LIKE 'mercury/heroes/%'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can upload inventory images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'motor-images' AND name LIKE 'mercury/inventory/%'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can update motor images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'motor-images'
  AND (name LIKE 'mercury/heroes/%' OR name LIKE 'mercury/inventory/%')
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can delete motor images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'motor-images'
  AND (name LIKE 'mercury/heroes/%' OR name LIKE 'mercury/inventory/%')
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can upload inventory photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'inventory-photos'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Function search_path
ALTER FUNCTION public.bulk_upsert_deals(jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION public.bulk_upsert_open_ros(jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION public.bulk_upsert_parts_invoices(jsonb) SET search_path = public, pg_temp;

-- Revoke EXECUTE on sensitive helpers
REVOKE EXECUTE ON FUNCTION public.bulk_upsert_deals(jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bulk_upsert_open_ros(jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bulk_upsert_parts_invoices(jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_sessions() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_data() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_motor_duplicates_by_display() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_orphaned_customer_data() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.encrypt_sin(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrypt_sin(text) FROM PUBLIC, anon, authenticated;