-- Make detail_url dedupe-safe without breaking existing NULLs
CREATE UNIQUE INDEX IF NOT EXISTS uq_motor_models_detail_url
  ON public.motor_models (lower(detail_url))
  WHERE detail_url IS NOT NULL;