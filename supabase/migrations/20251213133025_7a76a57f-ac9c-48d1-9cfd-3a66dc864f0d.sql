-- Nudge experiments tracking table
CREATE TABLE public.nudge_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID,
  page_path TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  message_text TEXT NOT NULL,
  
  -- Engagement metrics
  impression_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  auto_dismissed_at TIMESTAMPTZ,
  
  -- Context
  time_on_page_seconds INTEGER,
  scroll_depth_percent INTEGER,
  device_type TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Aggregate stats per variant for fast bandit calculations
CREATE TABLE public.nudge_variant_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  
  impressions INTEGER DEFAULT 0,
  accepts INTEGER DEFAULT 0,
  dismissals INTEGER DEFAULT 0,
  auto_dismissals INTEGER DEFAULT 0,
  
  is_winner BOOLEAN DEFAULT false,
  graduated_at TIMESTAMPTZ,
  confidence_level NUMERIC(5,4),
  
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(page_path, trigger_type, variant_id)
);

-- Indexes for analytics queries
CREATE INDEX idx_nudge_experiments_variant ON public.nudge_experiments(variant_id);
CREATE INDEX idx_nudge_experiments_page ON public.nudge_experiments(page_path);
CREATE INDEX idx_nudge_experiments_created ON public.nudge_experiments(created_at);
CREATE INDEX idx_nudge_variant_stats_lookup ON public.nudge_variant_stats(page_path, trigger_type);

-- Enable RLS
ALTER TABLE public.nudge_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nudge_variant_stats ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for experiments
CREATE POLICY "Allow anonymous experiment inserts"
ON public.nudge_experiments FOR INSERT
WITH CHECK (true);

-- Allow anonymous updates for tracking outcomes
CREATE POLICY "Allow anonymous experiment updates"
ON public.nudge_experiments FOR UPDATE
USING (true);

-- Allow public read for variant stats (needed for bandit selection)
CREATE POLICY "Public read for variant stats"
ON public.nudge_variant_stats FOR SELECT
USING (true);

-- Admin full access to both tables
CREATE POLICY "Admins manage nudge_experiments"
ON public.nudge_experiments FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage nudge_variant_stats"
ON public.nudge_variant_stats FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to update variant stats after experiment outcome
CREATE OR REPLACE FUNCTION public.update_nudge_variant_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update stats when an outcome is recorded
  IF (NEW.accepted_at IS NOT NULL OR NEW.dismissed_at IS NOT NULL OR NEW.auto_dismissed_at IS NOT NULL) THEN
    INSERT INTO public.nudge_variant_stats (page_path, trigger_type, variant_id, impressions, accepts, dismissals, auto_dismissals)
    VALUES (
      NEW.page_path, 
      NEW.trigger_type, 
      NEW.variant_id, 
      1,
      CASE WHEN NEW.accepted_at IS NOT NULL THEN 1 ELSE 0 END,
      CASE WHEN NEW.dismissed_at IS NOT NULL THEN 1 ELSE 0 END,
      CASE WHEN NEW.auto_dismissed_at IS NOT NULL THEN 1 ELSE 0 END
    )
    ON CONFLICT (page_path, trigger_type, variant_id) DO UPDATE SET
      impressions = nudge_variant_stats.impressions + 1,
      accepts = nudge_variant_stats.accepts + 
        CASE WHEN NEW.accepted_at IS NOT NULL THEN 1 ELSE 0 END,
      dismissals = nudge_variant_stats.dismissals + 
        CASE WHEN NEW.dismissed_at IS NOT NULL THEN 1 ELSE 0 END,
      auto_dismissals = nudge_variant_stats.auto_dismissals + 
        CASE WHEN NEW.auto_dismissed_at IS NOT NULL THEN 1 ELSE 0 END,
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update stats on experiment updates
CREATE TRIGGER trigger_update_nudge_variant_stats
AFTER UPDATE ON public.nudge_experiments
FOR EACH ROW
EXECUTE FUNCTION public.update_nudge_variant_stats();