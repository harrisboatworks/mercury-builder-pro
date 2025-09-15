-- Create the sources storage bucket for pricelist artifacts
INSERT INTO storage.buckets (id, name, public) VALUES ('sources', 'sources', false);

-- Create storage policies for the sources bucket
CREATE POLICY "Admin can manage sources bucket"
ON storage.objects FOR ALL 
TO authenticated
USING (bucket_id = 'sources' AND EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
))
WITH CHECK (bucket_id = 'sources' AND EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

CREATE POLICY "Service role can manage sources bucket"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'sources')
WITH CHECK (bucket_id = 'sources');

-- Check and add any missing columns to motor_models
ALTER TABLE motor_models
  ADD COLUMN IF NOT EXISTS model_key text,
  ADD COLUMN IF NOT EXISTS dealer_price numeric,
  ADD COLUMN IF NOT EXISTS msrp numeric,
  ADD COLUMN IF NOT EXISTS price_source text,
  ADD COLUMN IF NOT EXISTS year int DEFAULT 2025,
  ADD COLUMN IF NOT EXISTS is_brochure boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS in_stock boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS hero_image_url text;

-- Create unique index for model_key to enable upserts
CREATE UNIQUE INDEX IF NOT EXISTS motor_models_model_key_uidx ON motor_models (model_key);

-- Set default year for existing records
UPDATE motor_models SET year = 2025 WHERE year IS NULL;

-- Create service role policy for motor_models if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'motor_models' 
    AND policyname = 'service role full access'
  ) THEN
    EXECUTE 'CREATE POLICY "service role full access" ON motor_models FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
END $$;