-- Create share_analytics table for tracking social share events
CREATE TABLE public.share_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_slug TEXT NOT NULL,
  platform TEXT NOT NULL,
  share_location TEXT NOT NULL,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.share_analytics ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public tracking)
CREATE POLICY "Anyone can insert share analytics"
ON public.share_analytics
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can read analytics
CREATE POLICY "Admins can view share analytics"
ON public.share_analytics
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for aggregation queries
CREATE INDEX idx_share_analytics_article ON public.share_analytics(article_slug);
CREATE INDEX idx_share_analytics_platform ON public.share_analytics(platform);
CREATE INDEX idx_share_analytics_created ON public.share_analytics(created_at DESC);

-- Add comment
COMMENT ON TABLE public.share_analytics IS 'Tracks social share button clicks for blog articles';