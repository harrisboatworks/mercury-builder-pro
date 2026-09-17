-- Local stub only. Production already has these columns from earlier
-- migrations. Applied solely to the empty staging-seed database so seed.sql
-- can run against the thinner PG harness schema. Not used by the original 55
-- checks.

ALTER TABLE public.saved_quotes
  ADD COLUMN IF NOT EXISTS is_soft_lead boolean NOT NULL DEFAULT false;

ALTER TABLE public.customer_quotes
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS deposit_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS base_price numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS final_price numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS loan_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_payment numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS term_months integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_cost numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS penalty_applied boolean NOT NULL DEFAULT false;
