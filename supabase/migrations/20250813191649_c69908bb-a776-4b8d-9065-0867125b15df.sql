-- Add image fields to promotions table
ALTER TABLE public.promotions 
ADD COLUMN image_url TEXT,
ADD COLUMN image_alt_text TEXT;