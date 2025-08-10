-- Add details column to promotions table for structured promo info
ALTER TABLE public.promotions
ADD COLUMN IF NOT EXISTS details JSONB NOT NULL DEFAULT '{}';

-- Optional: comment to document structure
COMMENT ON COLUMN public.promotions.details IS 'Structured promo details: { eligibility: string[], terms: string[], processingTime?: string, expiryNote?: string, amount?: string, finePrint?: string }';