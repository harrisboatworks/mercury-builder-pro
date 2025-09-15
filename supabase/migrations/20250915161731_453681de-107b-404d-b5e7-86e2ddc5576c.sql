-- Horsepower can be missing on some pages → allow NULL
ALTER TABLE public.motor_models
  ALTER COLUMN horsepower DROP NOT NULL;

-- Nice-to-have speedups for daily runs
CREATE INDEX IF NOT EXISTS idx_motor_models_last_scraped ON public.motor_models (last_scraped DESC);
CREATE INDEX IF NOT EXISTS idx_motor_models_stock_number ON public.motor_models (stock_number);