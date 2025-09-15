-- Create admin_sources table for storing connector URLs and settings
CREATE TABLE public.admin_sources (
  key text PRIMARY KEY,
  value text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_sources ENABLE ROW LEVEL SECURITY;

-- Create policies - only admins can manage
CREATE POLICY "Admins can manage admin_sources" 
ON public.admin_sources 
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add updated_at trigger
CREATE TRIGGER update_admin_sources_updated_at
BEFORE UPDATE ON public.admin_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add model_number column to motor_models for Mercury official codes
ALTER TABLE public.motor_models 
ADD COLUMN IF NOT EXISTS model_number text;

-- Create index for model_number lookups
CREATE INDEX IF NOT EXISTS idx_motor_models_model_number ON public.motor_models(model_number);

-- Update the unique constraint to handle both model_number and model_key
-- First drop existing constraint if it exists
ALTER TABLE public.motor_models DROP CONSTRAINT IF EXISTS motor_models_model_key_key;

-- Create new unique constraint that allows either model_number or model_key to be the primary identifier
-- We'll handle this in application logic since SQL can't easily do "unique on either A or B"