-- Add unique constraint on stock_number to fix inventory scraping
-- First, clean up any duplicate stock_numbers that might exist
DELETE FROM public.motor_models 
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM public.motor_models 
  GROUP BY stock_number
) AND stock_number IS NOT NULL;

-- Add unique constraint on stock_number for proper upsert operations
ALTER TABLE public.motor_models 
ADD CONSTRAINT motor_models_stock_number_unique 
UNIQUE (stock_number);