-- Add brochure columns if missing
ALTER TABLE motor_models ADD COLUMN IF NOT EXISTS is_brochure boolean DEFAULT true;
ALTER TABLE motor_models ADD COLUMN IF NOT EXISTS in_stock boolean DEFAULT false;
ALTER TABLE motor_models ADD COLUMN IF NOT EXISTS dealer_price numeric;
ALTER TABLE motor_models ADD COLUMN IF NOT EXISTS msrp numeric;
ALTER TABLE motor_models ADD COLUMN IF NOT EXISTS msrp_source text;
ALTER TABLE motor_models ADD COLUMN IF NOT EXISTS family text;
ALTER TABLE motor_models ADD COLUMN IF NOT EXISTS shaft text;
ALTER TABLE motor_models ADD COLUMN IF NOT EXISTS control text;
ALTER TABLE motor_models ADD COLUMN IF NOT EXISTS spec_json jsonb;
ALTER TABLE motor_models ADD COLUMN IF NOT EXISTS model_code text;

-- Add indexes for fast merges
CREATE UNIQUE INDEX IF NOT EXISTS uq_motor_models_model_code ON motor_models (lower(model_code)) WHERE model_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_motor_models_brochure ON motor_models (is_brochure, in_stock);