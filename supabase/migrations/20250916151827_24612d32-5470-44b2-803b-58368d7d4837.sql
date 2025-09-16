-- Clean up redundant unique constraints on model_number for brochure records
-- Keep only one clean constraint to prevent true duplicates

-- Drop all redundant unique indexes/constraints on model_number
DROP INDEX IF EXISTS idx_motor_models_brochure_model_number;
DROP INDEX IF EXISTS idx_motor_models_model_number_brochure;
DROP INDEX IF EXISTS motor_models_model_number_brochure_uniq;
DROP INDEX IF EXISTS uq_motor_models_model_number;

-- Create one clean unique constraint on model_number for brochure records
-- This allows NULL model_number values but prevents duplicates when not null
CREATE UNIQUE INDEX idx_motor_models_brochure_model_number_unique
ON motor_models (model_number) 
WHERE is_brochure = true AND model_number IS NOT NULL AND model_number != '';