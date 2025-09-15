-- Add any missing columns used by the pipeline
ALTER TABLE motor_models
  ADD COLUMN IF NOT EXISTS rigging_code text,
  ADD COLUMN IF NOT EXISTS model_key text,
  ADD COLUMN IF NOT EXISTS dealer_price numeric,
  ADD COLUMN IF NOT EXISTS msrp numeric,
  ADD COLUMN IF NOT EXISTS price_source text,
  ADD COLUMN IF NOT EXISTS is_brochure boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS in_stock boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS hero_image_url text;

-- Ensure unique key used by upserts
CREATE UNIQUE INDEX IF NOT EXISTS motor_models_model_key_uidx
  ON motor_models (model_key);

-- Ask PostgREST to refresh schema cache after migration
NOTIFY pgrst, 'reload schema';