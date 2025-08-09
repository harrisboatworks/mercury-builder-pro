-- Add trade-in penalty audit fields to customer_quotes
ALTER TABLE public.customer_quotes
  ADD COLUMN IF NOT EXISTS tradein_value_pre_penalty numeric NULL,
  ADD COLUMN IF NOT EXISTS tradein_value_final numeric NULL,
  ADD COLUMN IF NOT EXISTS penalty_applied boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS penalty_factor numeric NULL,
  ADD COLUMN IF NOT EXISTS penalty_reason text NULL;

-- Optional: index for reporting on penalty_applied
CREATE INDEX IF NOT EXISTS idx_customer_quotes_penalty_applied ON public.customer_quotes (penalty_applied);
