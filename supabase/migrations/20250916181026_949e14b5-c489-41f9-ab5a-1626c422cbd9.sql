-- Add dealer_price_live field for real-time inventory pricing
ALTER TABLE public.motor_models 
ADD COLUMN dealer_price_live numeric DEFAULT NULL;

-- Add index for stock-related queries optimization
CREATE INDEX IF NOT EXISTS idx_motor_models_stock_status 
ON public.motor_models (in_stock, is_brochure, last_stock_check);

-- Add index for model matching optimization
CREATE INDEX IF NOT EXISTS idx_motor_models_model_display 
ON public.motor_models USING gin(model_display gin_trgm_ops);

-- Enable trigram extension for fuzzy matching if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;