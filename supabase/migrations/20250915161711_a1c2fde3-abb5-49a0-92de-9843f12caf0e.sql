-- Make detail_url dedupe-safe without breaking existing NULLs
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_motor_models_detail_url
  ON public.motor_models (lower(detail_url))
  WHERE detail_url IS NOT NULL;

-- Horsepower can be missing on some pages → allow NULL
ALTER TABLE public.motor_models
  ALTER COLUMN horsepower DROP NOT NULL;

-- Nice-to-have speedups for daily runs
CREATE INDEX IF NOT EXISTS idx_motor_models_last_scraped ON public.motor_models (last_scraped DESC);
CREATE INDEX IF NOT EXISTS idx_motor_models_stock_number ON public.motor_models (stock_number);