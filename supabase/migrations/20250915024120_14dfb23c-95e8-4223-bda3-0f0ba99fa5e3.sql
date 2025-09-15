-- Add unique constraint on stock_number to fix inventory scraping
-- First, clean up any duplicate stock_numbers that might exist
WITH duplicates AS (
  SELECT stock_number, array_agg(id ORDER BY created_at DESC) as ids
  FROM public.motor_models 
  WHERE stock_number IS NOT NULL
  GROUP BY stock_number
  HAVING COUNT(*) > 1
)
DELETE FROM public.motor_models 
WHERE id IN (
  SELECT unnest(ids[2:]) FROM duplicates
);

-- Create a unique index on stock_number (excluding NULL values)
CREATE UNIQUE INDEX CONCURRENTLY motor_models_stock_number_unique_idx 
ON public.motor_models (stock_number) 
WHERE stock_number IS NOT NULL;