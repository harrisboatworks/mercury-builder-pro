
-- Restrict promo-images bucket writes to admins only
CREATE POLICY "Admins can upload promo images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'promo-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update promo images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'promo-images' AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'promo-images' AND has_role(auth.uid(), 'admin'::app_role));

-- Allow owners and admins to delete their own quote PDFs
CREATE POLICY "Users and admins can delete quote PDFs"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'quotes'
  AND (
    (storage.foldername(name))[1] = (auth.uid())::text
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);
