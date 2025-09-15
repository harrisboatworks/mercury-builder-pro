-- Add flags if missing
ALTER TABLE motor_models ADD COLUMN IF NOT EXISTS is_brochure boolean DEFAULT false;
ALTER TABLE motor_models ADD COLUMN IF NOT EXISTS in_stock boolean DEFAULT true;

-- Helpful partial index for quick lookups
CREATE INDEX IF NOT EXISTS idx_motor_models_instock ON motor_models(in_stock) WHERE is_brochure = false;

-- Ensure brochure rows don't collide with inventory rows when detail_url is NULL
-- (keep existing unique index on detail_url; add a soft uniqueness for brochure models)
CREATE UNIQUE INDEX IF NOT EXISTS uq_brochure_identity
ON motor_models (LOWER(make), LOWER(model), COALESCE(year, 0), is_brochure)
WHERE is_brochure = true;