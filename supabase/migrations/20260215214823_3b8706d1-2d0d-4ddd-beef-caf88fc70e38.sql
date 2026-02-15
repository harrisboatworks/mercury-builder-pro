
-- Create table for tracking anonymous quote-building activity
CREATE TABLE public.quote_activity_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID,
  event_type TEXT NOT NULL,
  motor_model TEXT,
  motor_hp INTEGER,
  quote_value NUMERIC,
  event_data JSONB DEFAULT '{}'::jsonb,
  page_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for weekly report queries
CREATE INDEX idx_quote_activity_created ON public.quote_activity_events (created_at DESC);
CREATE INDEX idx_quote_activity_session ON public.quote_activity_events (session_id);
CREATE INDEX idx_quote_activity_event_type ON public.quote_activity_events (event_type);

-- Enable RLS
ALTER TABLE public.quote_activity_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (anonymous tracking)
CREATE POLICY "Anyone can insert activity events"
  ON public.quote_activity_events
  FOR INSERT
  WITH CHECK (true);

-- Only admins can read
CREATE POLICY "Admins can read activity events"
  ON public.quote_activity_events
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- No update or delete for anyone (append-only log)
