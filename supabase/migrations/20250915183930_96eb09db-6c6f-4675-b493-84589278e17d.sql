-- Add new columns for brochure catalog
ALTER TABLE motor_models ADD COLUMN IF NOT EXISTS is_brochure boolean DEFAULT false;
ALTER TABLE motor_models ADD COLUMN IF NOT EXISTS in_stock boolean DEFAULT false;
ALTER TABLE motor_models ADD COLUMN IF NOT EXISTS model_number text;
ALTER TABLE motor_models ADD COLUMN IF NOT EXISTS msrp numeric;

-- Add unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS uq_motor_models_model_number ON motor_models (lower(model_number)) WHERE model_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_motor_models_detail_url ON motor_models (lower(detail_url)) WHERE detail_url IS NOT NULL;