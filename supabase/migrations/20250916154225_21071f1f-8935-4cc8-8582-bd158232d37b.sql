-- Remove the conflicting uq_brochure_identity constraint that prevents multiple motor variations
-- This constraint was causing duplicate key violations during brochure ingestion
-- We'll rely on the model_number uniqueness constraint instead

-- Drop the conflicting constraint
ALTER TABLE motor_models DROP CONSTRAINT IF EXISTS uq_brochure_identity;

-- Ensure we have the proper unique constraint for brochure model numbers
-- This constraint should already exist, but let's make sure it's properly defined
DROP INDEX IF EXISTS idx_motor_models_brochure_model_number_unique;

-- Create the proper unique constraint for brochure model numbers
CREATE UNIQUE INDEX idx_motor_models_brochure_model_number_unique 
ON motor_models (model_number) 
WHERE is_brochure = true AND model_number IS NOT NULL AND model_number != '';

-- Verify we can handle multiple variations of the same motor model with different model numbers
-- This allows for different configurations (shaft lengths, rigging codes, etc.) of the same base motor