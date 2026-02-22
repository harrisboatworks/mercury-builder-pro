-- Add UTM tracking columns to quote_activity_events
ALTER TABLE public.quote_activity_events 
ADD COLUMN IF NOT EXISTS utm_source text,
ADD COLUMN IF NOT EXISTS utm_medium text,
ADD COLUMN IF NOT EXISTS utm_campaign text,
ADD COLUMN IF NOT EXISTS utm_term text,
ADD COLUMN IF NOT EXISTS utm_content text,
ADD COLUMN IF NOT EXISTS referrer text;

-- Add a page_visit event type support and index for traffic analysis
CREATE INDEX IF NOT EXISTS idx_qae_utm_source ON public.quote_activity_events (utm_source) WHERE utm_source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_qae_created_at ON public.quote_activity_events (created_at);