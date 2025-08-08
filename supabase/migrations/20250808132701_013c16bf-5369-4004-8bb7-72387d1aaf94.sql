
-- Add rule-level discount overrides to promotions_rules
ALTER TABLE public.promotions_rules
  ADD COLUMN IF NOT EXISTS discount_percentage numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_fixed_amount numeric NOT NULL DEFAULT 0;
