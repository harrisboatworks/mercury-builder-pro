-- Create agent_events table for tracking AI agent funnel
CREATE TABLE public.agent_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  session_id TEXT,
  user_id UUID,
  page_path TEXT,
  source TEXT,
  motor_id UUID,
  motor_hp NUMERIC,
  motor_model TEXT,
  quote_value NUMERIC,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for funnel queries
CREATE INDEX idx_agent_events_event_type ON public.agent_events(event_type);
CREATE INDEX idx_agent_events_created_at ON public.agent_events(created_at DESC);
CREATE INDEX idx_agent_events_session ON public.agent_events(session_id);

-- Enable RLS
ALTER TABLE public.agent_events ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can insert events (analytics)
CREATE POLICY "Anyone can insert agent events"
ON public.agent_events
FOR INSERT
TO public
WITH CHECK (
  event_type IS NOT NULL
  AND length(event_type) <= 100
  AND (metadata IS NULL OR pg_column_size(metadata) < 10000)
);

-- Only admins can read
CREATE POLICY "Admins can read agent events"
ON public.agent_events
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete (cleanup)
CREATE POLICY "Admins can delete agent events"
ON public.agent_events
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Block anon read
CREATE POLICY "Block anon read agent events"
ON public.agent_events
FOR SELECT
TO anon
USING (false);