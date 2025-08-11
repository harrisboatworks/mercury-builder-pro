-- Add optional promo image fields to financing_options
ALTER TABLE public.financing_options 
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS image_alt_text TEXT;

-- Update the Mercury promo with a placeholder image and alt text
UPDATE public.financing_options 
SET image_url = 'https://example.com/mercury-finance-banner.jpg',
    image_alt_text = 'Mercury Finance - 4.9% APR Summer Special'
WHERE name = 'Mercury Summer Promo';