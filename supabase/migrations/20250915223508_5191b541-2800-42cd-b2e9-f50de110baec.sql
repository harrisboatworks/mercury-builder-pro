-- Add missing columns for brochure catalog management
ALTER TABLE motor_models 
ADD COLUMN IF NOT EXISTS mercury_model_no TEXT,
ADD COLUMN IF NOT EXISTS price_source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS msrp_calc_source TEXT,
ADD COLUMN IF NOT EXISTS catalog_source_url TEXT,
ADD COLUMN IF NOT EXISTS catalog_snapshot_url TEXT;

-- Update existing model_key constraint to be more robust
-- model_key should remain the primary unique identifier
CREATE INDEX IF NOT EXISTS idx_motor_models_mercury_model_no ON motor_models(mercury_model_no) WHERE mercury_model_no IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_motor_models_brochure ON motor_models(is_brochure) WHERE is_brochure = true;