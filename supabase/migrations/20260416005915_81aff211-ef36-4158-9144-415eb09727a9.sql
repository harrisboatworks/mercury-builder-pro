-- 1. Fix quotes bucket: scope reads to owner or admin
DROP POLICY IF EXISTS "Authenticated users can read quotes PDFs"
  ON storage.objects;

CREATE POLICY "Users can read own quote PDFs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'quotes'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin'::app_role)
    )
  );

-- 2. Fix inventory-photos: admin-only delete
DROP POLICY IF EXISTS "Authenticated users can delete inventory photos"
  ON storage.objects;

CREATE POLICY "Admins can delete inventory photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'inventory-photos'
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );