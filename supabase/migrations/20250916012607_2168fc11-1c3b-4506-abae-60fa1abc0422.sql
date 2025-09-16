-- Add missing columns for Mercury model parsing
ALTER TABLE public.motor_models 
ADD COLUMN IF NOT EXISTS accessories_included jsonb DEFAULT '[]'::jsonb;

-- Add unique index for model_number where is_brochure = true
CREATE UNIQUE INDEX IF NOT EXISTS idx_motor_models_brochure_model_number 
ON public.motor_models (model_number) 
WHERE is_brochure = true AND model_number IS NOT NULL;

-- Update model_number column to be more explicit (already exists but ensure it's properly set up)
ALTER TABLE public.motor_models 
ALTER COLUMN model_number TYPE text;

-- Add index on model_key for performance
CREATE INDEX IF NOT EXISTS idx_motor_models_model_key 
ON public.motor_models (model_key) 
WHERE model_key IS NOT NULL;