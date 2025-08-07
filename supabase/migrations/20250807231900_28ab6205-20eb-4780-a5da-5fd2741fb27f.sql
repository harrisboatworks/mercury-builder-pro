-- Allow authenticated users to manage promotions
DO $$ BEGIN
  -- INSERT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'promotions' AND policyname = 'Authenticated users can insert promotions'
  ) THEN
    CREATE POLICY "Authenticated users can insert promotions"
    ON public.promotions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);
  END IF;

  -- UPDATE policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'promotions' AND policyname = 'Authenticated users can update promotions'
  ) THEN
    CREATE POLICY "Authenticated users can update promotions"
    ON public.promotions
    FOR UPDATE
    TO authenticated
    USING (auth.uid() IS NOT NULL);
  END IF;

  -- DELETE policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'promotions' AND policyname = 'Authenticated users can delete promotions'
  ) THEN
    CREATE POLICY "Authenticated users can delete promotions"
    ON public.promotions
    FOR DELETE
    TO authenticated
    USING (auth.uid() IS NOT NULL);
  END IF;
END $$;