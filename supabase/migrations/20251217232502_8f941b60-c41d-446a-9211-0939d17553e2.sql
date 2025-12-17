-- Fix the security definer view issue by dropping and recreating 
-- email_analytics_summary with SECURITY INVOKER (default, safer approach)
-- and adding explicit access control

DROP VIEW IF EXISTS public.email_analytics_summary;

CREATE OR REPLACE VIEW public.email_analytics_summary 
WITH (security_invoker = true)
AS
SELECT 
  sequence_type,
  COUNT(*) as total_sequences,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'active') as active,
  COUNT(*) FILTER (WHERE status = 'unsubscribed') as unsubscribed,
  COUNT(*) FILTER (WHERE status = 'paused') as paused,
  SUM(emails_sent) as total_emails_sent,
  SUM(COALESCE(email_opens, 0)) as total_opens,
  SUM(COALESCE(email_clicks, 0)) as total_clicks,
  COUNT(*) FILTER (WHERE COALESCE(email_opens, 0) > 0 OR COALESCE(email_clicks, 0) > 0) as engaged_leads,
  CASE 
    WHEN SUM(emails_sent) > 0 
    THEN ROUND((SUM(COALESCE(email_opens, 0))::numeric / SUM(emails_sent)::numeric) * 100, 2)
    ELSE 0 
  END as open_rate,
  CASE 
    WHEN SUM(emails_sent) > 0 
    THEN ROUND((SUM(COALESCE(email_clicks, 0))::numeric / SUM(emails_sent)::numeric) * 100, 2)
    ELSE 0 
  END as click_rate
FROM public.email_sequence_queue
GROUP BY sequence_type;

-- Grant access only to authenticated users (RLS on underlying table enforces admin-only)
GRANT SELECT ON public.email_analytics_summary TO authenticated;

COMMENT ON VIEW public.email_analytics_summary IS 'Analytics summary for email sequences. Access controlled by RLS on email_sequence_queue table (admin-only).';