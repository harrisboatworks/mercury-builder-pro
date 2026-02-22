-- Add new event types for page-level tracking
-- Add page_title column for better reporting
ALTER TABLE public.quote_activity_events 
  ADD COLUMN IF NOT EXISTS page_title text,
  ADD COLUMN IF NOT EXISTS time_on_page_seconds integer,
  ADD COLUMN IF NOT EXISTS device_type text,
  ADD COLUMN IF NOT EXISTS screen_width integer;

-- Add index for page-level analytics queries
CREATE INDEX IF NOT EXISTS idx_qae_event_type_created ON public.quote_activity_events (event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_qae_page_path_created ON public.quote_activity_events (page_path, created_at);