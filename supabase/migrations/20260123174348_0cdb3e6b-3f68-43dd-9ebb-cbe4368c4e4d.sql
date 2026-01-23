-- Check if policy exists and create if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'email_sequence_queue' 
    AND policyname = 'Service role can manage email sequences'
  ) THEN
    CREATE POLICY "Service role can manage email sequences"
    ON public.email_sequence_queue 
    FOR ALL
    TO service_role
    USING (true);
  END IF;
END $$;