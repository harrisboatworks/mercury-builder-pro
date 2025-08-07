
-- Extend promotions to support non-price "Bonus Offer" promotions
ALTER TABLE public.promotions
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'discount',
  ADD COLUMN IF NOT EXISTS bonus_title text,
  ADD COLUMN IF NOT EXISTS bonus_short_badge text,
  ADD COLUMN IF NOT EXISTS bonus_description text,
  ADD COLUMN IF NOT EXISTS warranty_extra_years integer,
  ADD COLUMN IF NOT EXISTS terms_url text,
  ADD COLUMN IF NOT EXISTS highlight boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS priority integer NOT NULL DEFAULT 0;

-- Ensure bonus-only promotions don't require a discount value
ALTER TABLE public.promotions
  ALTER COLUMN discount_percentage SET DEFAULT 0;
