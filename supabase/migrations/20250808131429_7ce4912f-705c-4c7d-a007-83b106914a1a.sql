-- Add fixed dollar discount support to promotions
ALTER TABLE public.promotions
ADD COLUMN IF NOT EXISTS discount_fixed_amount numeric NOT NULL DEFAULT 0;

-- Optional: ensure existing rows have default set (already handled by default)
