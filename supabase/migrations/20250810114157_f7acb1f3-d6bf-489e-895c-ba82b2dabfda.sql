-- Create storage policy for deleting own promo images (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Users can delete their own promo images'
  ) THEN
    CREATE POLICY "Users can delete their own promo images"
    ON storage.objects
    FOR DELETE
    USING (
      bucket_id = 'promo-images'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;