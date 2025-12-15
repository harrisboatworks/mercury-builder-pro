-- Create mercury_parts_cache table for storing scraped part information
CREATE TABLE public.mercury_parts_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  part_number TEXT NOT NULL UNIQUE,
  name TEXT,
  description TEXT,
  cad_price NUMERIC,
  image_url TEXT,
  source_url TEXT,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  lookup_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mercury_parts_cache ENABLE ROW LEVEL SECURITY;

-- Public read access (parts info is not sensitive)
CREATE POLICY "Public read access for mercury_parts_cache"
  ON public.mercury_parts_cache
  FOR SELECT
  USING (true);

-- Admin/system can manage
CREATE POLICY "Admins can manage mercury_parts_cache"
  ON public.mercury_parts_cache
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Service role can manage (for edge functions)
CREATE POLICY "Service role can manage mercury_parts_cache"
  ON public.mercury_parts_cache
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index for fast lookups
CREATE INDEX idx_mercury_parts_part_number ON public.mercury_parts_cache(part_number);

-- Add comment
COMMENT ON TABLE public.mercury_parts_cache IS 'Cache for Mercury Marine parts scraped from harrisboatworks.ca/mercuryparts';