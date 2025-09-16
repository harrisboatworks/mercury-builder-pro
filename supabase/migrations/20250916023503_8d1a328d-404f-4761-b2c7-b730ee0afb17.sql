-- First, fix existing brochure models that have NULL model_number
-- Set model_number to model_key if NULL for brochure models
UPDATE motor_models 
SET model_number = model_key 
WHERE is_brochure = TRUE 
  AND model_number IS NULL 
  AND model_key IS NOT NULL;

-- Delete brochure models that have no usable identifier
DELETE FROM motor_models 
WHERE is_brochure = TRUE 
  AND model_number IS NULL 
  AND model_key IS NULL;

-- Ensure motor_models table has all required columns for brochure models
DO $$ BEGIN
    -- Add model_display column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'motor_models' AND column_name = 'model_display') THEN
        ALTER TABLE motor_models ADD COLUMN model_display TEXT;
    END IF;
    
    -- Add mercury_model_no column if it doesn't exist  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'motor_models' AND column_name = 'mercury_model_no') THEN
        ALTER TABLE motor_models ADD COLUMN mercury_model_no TEXT;
    END IF;
    
    -- Add msrp_calc_source column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'motor_models' AND column_name = 'msrp_calc_source') THEN
        ALTER TABLE motor_models ADD COLUMN msrp_calc_source TEXT;
    END IF;
END $$;

-- Create unique constraint on model_number for brochure models
-- Drop existing constraint if it exists and recreate it properly
DROP INDEX IF EXISTS motor_models_model_number_brochure_uniq;

-- Create unique partial index on model_number where is_brochure is true
CREATE UNIQUE INDEX motor_models_model_number_brochure_uniq 
ON motor_models (model_number) 
WHERE is_brochure IS TRUE AND model_number IS NOT NULL;

-- Ensure motor_models has proper defaults for brochure data
ALTER TABLE motor_models ALTER COLUMN is_brochure SET DEFAULT false;
ALTER TABLE motor_models ALTER COLUMN in_stock SET DEFAULT false;
ALTER TABLE motor_models ALTER COLUMN availability SET DEFAULT 'Brochure';

-- Create index for better query performance on brochure models
CREATE INDEX IF NOT EXISTS idx_motor_models_brochure ON motor_models (is_brochure, created_at DESC) WHERE is_brochure IS TRUE;