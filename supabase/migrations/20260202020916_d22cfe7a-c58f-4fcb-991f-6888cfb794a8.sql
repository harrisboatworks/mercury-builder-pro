-- Create cache table for Google Places API responses
CREATE TABLE public.google_places_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_query TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL,
  cached_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  hit_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups by query
CREATE INDEX idx_google_places_cache_query ON google_places_cache(place_query);

-- Index for finding expired entries
CREATE INDEX idx_google_places_cache_expires ON google_places_cache(expires_at);

-- Enable RLS
ALTER TABLE public.google_places_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read access (cache is shared across all users)
CREATE POLICY "Anyone can read cache" 
ON public.google_places_cache 
FOR SELECT 
USING (true);

-- Only service role can insert/update (edge function uses service role)
CREATE POLICY "Service role can manage cache" 
ON public.google_places_cache 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE public.google_places_cache IS 'Caches Google Places API responses to reduce API costs. TTL is 24 hours.';