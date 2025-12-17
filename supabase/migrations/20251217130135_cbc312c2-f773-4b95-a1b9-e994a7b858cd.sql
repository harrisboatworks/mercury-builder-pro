-- Add tracking columns to email_sequence_queue
ALTER TABLE email_sequence_queue 
ADD COLUMN IF NOT EXISTS email_opens integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS email_clicks integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_opened_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS last_clicked_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS tracking_events jsonb DEFAULT '[]'::jsonb;

-- Create analytics view for admin dashboard
CREATE OR REPLACE VIEW email_analytics_summary AS
SELECT 
  sequence_type,
  COUNT(*) as total_sequences,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'active') as active,
  COUNT(*) FILTER (WHERE status = 'unsubscribed') as unsubscribed,
  COUNT(*) FILTER (WHERE status = 'paused') as paused,
  SUM(emails_sent) as total_emails_sent,
  SUM(email_opens) as total_opens,
  SUM(email_clicks) as total_clicks,
  ROUND(COALESCE(SUM(email_opens)::numeric / NULLIF(SUM(emails_sent), 0) * 100, 0), 1) as open_rate,
  ROUND(COALESCE(SUM(email_clicks)::numeric / NULLIF(SUM(emails_sent), 0) * 100, 0), 1) as click_rate,
  COUNT(*) FILTER (WHERE email_clicks > 0) as engaged_leads
FROM email_sequence_queue
GROUP BY sequence_type;