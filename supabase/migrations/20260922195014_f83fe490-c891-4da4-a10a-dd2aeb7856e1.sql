
CREATE OR REPLACE FUNCTION public.weekly_report_test_sessions(p_start timestamptz, p_end timestamptz)
RETURNS TABLE(session_id text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH s AS (
    SELECT e.session_id,
           min(e.created_at) FILTER (WHERE e.event_type = 'motor_selected') AS motor_at,
           min(e.created_at) FILTER (WHERE e.event_type = 'summary_viewed') AS summary_at,
           bool_or(e.referrer ~* '(localhost|127\.0\.0\.1|\[::1\])') AS local_ref,
           bool_or(e.session_id ~* '^(test|e2e|playwright|bot|smoke|synthetic)[-_]') AS qa_sid
    FROM public.quote_activity_events e
    WHERE e.created_at >= p_start AND e.created_at < p_end
    GROUP BY 1
  )
  SELECT s.session_id
  FROM s
  WHERE coalesce(s.local_ref, false)
     OR coalesce(s.qa_sid, false)
     OR (s.motor_at IS NOT NULL AND s.summary_at IS NOT NULL
         AND s.summary_at - s.motor_at < interval '3 seconds');
$$;
