-- Add display_name column to motor_models for better naming consistency
ALTER TABLE public.motor_models 
ADD COLUMN IF NOT EXISTS display_name text;

-- Create index on model_number for better upsert performance
CREATE INDEX IF NOT EXISTS idx_motor_models_model_number_brochure 
ON public.motor_models (model_number) 
WHERE is_brochure = true;