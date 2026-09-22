
-- Helper: test / placeholder email detection
CREATE OR REPLACE FUNCTION public.weekly_report_is_test_email(p_email text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT p_email IS NULL
     OR btrim(p_email) = ''
     OR p_email ~* '(@example\.(com|ca)|^test@|placeholder|soft-lead\.local|@test\.)';
$$;

-- Helper: sessions that look like automated tests / bots
CREATE OR REPLACE FUNCTION public.weekly_report_test_sessions(p_start timestamptz, p_end timestamptz)
RETURNS TABLE(session_id text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH s AS (
    SELECT e.session_id,
           min(e.created_at) FILTER (WHERE e.event_type = 'motor_selected') AS motor_at,
           min(e.created_at) FILTER (WHERE e.event_type = 'summary_viewed') AS summary_at,
           bool_or(e.referrer ~* '(localhost|127\.0\.0\.1|\[::1\])') AS local_ref,
           bool_or(e.session_id ~* '^(qa|test|e2e|playwright|bot)[-_]') AS qa_sid
    FROM public.quote_activity_events e
    WHERE e.created_at >= p_start AND e.created_at < p_end
    GROUP BY 1
  )
  SELECT s.session_id
  FROM s
  WHERE s.local_ref
     OR s.qa_sid
     OR (s.motor_at IS NOT NULL AND s.summary_at IS NOT NULL
         AND s.summary_at - s.motor_at < interval '3 seconds');
$$;

-- Helper: the three headline numbers for any week (used by the 4-week trend)
CREATE OR REPLACE FUNCTION public.weekly_report_week_core(p_start timestamptz, p_end timestamptz)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH t AS (SELECT session_id FROM public.weekly_report_test_sessions(p_start, p_end)),
  ev AS (
    SELECT e.session_id, e.event_type
    FROM public.quote_activity_events e
    WHERE e.created_at >= p_start AND e.created_at < p_end
      AND NOT EXISTS (SELECT 1 FROM t WHERE t.session_id = e.session_id)
  )
  SELECT jsonb_build_object(
    'start', p_start,
    'end', p_end,
    'real_sessions', (SELECT count(DISTINCT session_id) FROM ev),
    'real_quote_starts', (SELECT count(DISTINCT session_id) FROM ev WHERE event_type = 'motor_selected'),
    'real_leads',
      (SELECT count(*) FROM public.customer_quotes q
         WHERE q.created_at >= p_start AND q.created_at < p_end
           AND coalesce(q.lead_source, '') <> 'public-quote-api'
           AND NOT public.weekly_report_is_test_email(q.customer_email))
    + (SELECT count(*) FROM public.trade_valuation_leads l
         WHERE l.created_at >= p_start AND l.created_at < p_end AND l.status = 'new')
    + (SELECT count(*) FROM public.saved_quotes s
         WHERE s.created_at >= p_start AND s.created_at < p_end
           AND NOT public.weekly_report_is_test_email(s.email))
    + (SELECT count(*) FROM public.financing_applications f
         WHERE f.created_at >= p_start AND f.created_at < p_end)
    + (SELECT count(*) FROM public.contact_inquiries c
         WHERE c.created_at >= p_start AND c.created_at < p_end)
    + (SELECT count(*) FROM public.chat_conversations ch
         WHERE ch.created_at >= p_start AND ch.created_at < p_end
           AND (ch.customer_phone IS NOT NULL OR ch.customer_name IS NOT NULL))
    + (SELECT count(*) FROM public.voice_callbacks v
         WHERE v.created_at >= p_start AND v.created_at < p_end)
    + (SELECT count(*) FROM public.payments p
         WHERE p.created_at >= p_start AND p.created_at < p_end
           AND p.status IN ('paid', 'succeeded', 'completed'))
  );
$$;

-- Main: every number the weekly report needs, aggregated in SQL
CREATE OR REPLACE FUNCTION public.weekly_report_metrics(p_start timestamptz, p_end timestamptz)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH t AS (SELECT session_id FROM public.weekly_report_test_sessions(p_start, p_end)),
  ev AS (
    SELECT e.*
    FROM public.quote_activity_events e
    WHERE e.created_at >= p_start AND e.created_at < p_end
      AND NOT EXISTS (SELECT 1 FROM t WHERE t.session_id = e.session_id)
  ),
  sess AS (
    SELECT session_id,
           max(device_type) AS device_type,
           min(created_at) AS first_seen,
           (array_agg(utm_source ORDER BY created_at) FILTER (WHERE utm_source IS NOT NULL))[1] AS utm_source,
           (array_agg(utm_campaign ORDER BY created_at) FILTER (WHERE utm_campaign IS NOT NULL))[1] AS utm_campaign,
           (array_agg(referrer ORDER BY created_at) FILTER (WHERE referrer IS NOT NULL))[1] AS referrer,
           min(created_at) FILTER (WHERE event_type = 'motor_selected') AS motor_at,
           min(created_at) FILTER (WHERE event_type = 'summary_viewed') AS summary_at,
           min(created_at) FILTER (WHERE event_type = 'quote_submitted') AS submitted_at,
           min(created_at) FILTER (WHERE event_type = 'purchase_path_chosen') AS path_at,
           min(created_at) FILTER (WHERE event_type = 'options_configured') AS options_at,
           min(created_at) FILTER (WHERE event_type = 'trade_in_entered') AS trade_at,
           min(created_at) FILTER (WHERE event_type = 'installation_configured') AS install_at,
           min(created_at) FILTER (WHERE event_type = 'package_selected') AS package_at,
           min(created_at) FILTER (WHERE event_type = 'boat_info_completed') AS boat_at,
           min(created_at) FILTER (WHERE event_type = 'promo_selected') AS promo_at,
           min(created_at) FILTER (WHERE event_type = 'page_view' AND page_path LIKE '/blog/%') AS first_blog_at,
           (array_agg(page_path ORDER BY created_at) FILTER (WHERE event_type = 'page_view' AND page_path LIKE '/blog/%'))[1] AS first_blog_path,
           (array_agg(motor_model ORDER BY created_at) FILTER (WHERE event_type = 'motor_selected' AND motor_model IS NOT NULL))[1] AS motor_model
    FROM ev
    GROUP BY session_id
  ),
  q_all AS (
    SELECT * FROM public.customer_quotes
    WHERE created_at >= p_start AND created_at < p_end
  ),
  q_agent AS (SELECT * FROM q_all WHERE coalesce(lead_source, '') = 'public-quote-api'),
  q_real AS (
    SELECT * FROM q_all
    WHERE coalesce(lead_source, '') <> 'public-quote-api'
      AND NOT public.weekly_report_is_test_email(customer_email)
  ),
  q_real_models AS (
    SELECT coalesce(
             quote_data #>> '{items,0,name}',
             quote_data ->> 'motorModel',
             quote_data ->> 'motor_model',
             quote_data ->> 'model',
             'Unknown') AS model
    FROM q_real
  ),
  prev AS (
    SELECT count(*) AS n, coalesce(sum(final_price), 0) AS v
    FROM public.customer_quotes
    WHERE created_at >= p_start - (p_end - p_start) AND created_at < p_start
      AND coalesce(lead_source, '') <> 'public-quote-api'
      AND NOT public.weekly_report_is_test_email(customer_email)
  )
  SELECT jsonb_build_object(
    'period', jsonb_build_object('start', p_start, 'end', p_end),
    'test_sessions_excluded', (SELECT count(*) FROM t),
    'sessions', (SELECT count(*) FROM sess),
    'page_views', (SELECT count(*) FROM ev WHERE event_type = 'page_view'),
    'site_exits', (SELECT count(*) FROM ev WHERE event_type = 'site_exit'),
    'devices', (
      SELECT coalesce(jsonb_object_agg(coalesce(device_type, 'unknown'), c), '{}'::jsonb)
      FROM (SELECT device_type, count(*) c FROM sess GROUP BY 1) d
    ),
    'top_pages', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('page', page, 'views', views, 'avg_seconds', avg_seconds)), '[]'::jsonb)
      FROM (
        SELECT coalesce(page_title, page_path, 'Unknown') AS page,
               count(*) FILTER (WHERE event_type = 'page_view') AS views,
               round(avg(time_on_page_seconds) FILTER (WHERE time_on_page_seconds > 0))::int AS avg_seconds
        FROM ev
        WHERE event_type IN ('page_view', 'page_exit', 'site_exit')
        GROUP BY 1
        HAVING count(*) FILTER (WHERE event_type = 'page_view') > 0
        ORDER BY 2 DESC
        LIMIT 10
      ) p
    ),
    'top_exit_pages', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('page', page, 'exits', exits)), '[]'::jsonb)
      FROM (
        SELECT coalesce(page_title, page_path, 'Unknown') AS page, count(*) AS exits
        FROM ev WHERE event_type = 'site_exit' GROUP BY 1 ORDER BY 2 DESC LIMIT 5
      ) x
    ),
    'traffic_sources', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('source', source, 'sessions', sessions)), '[]'::jsonb)
      FROM (
        SELECT coalesce(
                 utm_source,
                 nullif(regexp_replace(coalesce(referrer, ''), '^[a-z]+://(www\.)?([^/]+).*$', '\2'), ''),
                 'direct') AS source,
               count(*) AS sessions
        FROM sess GROUP BY 1 ORDER BY 2 DESC LIMIT 10
      ) s
    ),
    'top_viewed_motors', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('model', model, 'hp', hp, 'views', views)), '[]'::jsonb)
      FROM (
        SELECT coalesce(motor_model, 'Unknown') AS model, max(motor_hp) AS hp, count(DISTINCT session_id) AS views
        FROM ev WHERE event_type = 'motor_selected' GROUP BY 1 ORDER BY 3 DESC LIMIT 10
      ) m
    ),
    'top_abandoned_motors', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('model', model, 'count', c, 'avg_value', avg_value)), '[]'::jsonb)
      FROM (
        SELECT coalesce(motor_model, 'Unknown') AS model, count(*) AS c,
               coalesce(round(avg(quote_value) FILTER (WHERE quote_value > 0)), 0) AS avg_value
        FROM ev WHERE event_type = 'quote_abandoned' GROUP BY 1 ORDER BY 2 DESC LIMIT 5
      ) a
    ),
    'funnel', jsonb_build_object(
      'sessions', (SELECT count(*) FROM sess),
      'selected_motor', (SELECT count(*) FROM sess WHERE motor_at IS NOT NULL),
      'chose_path', (SELECT count(*) FROM sess WHERE path_at IS NOT NULL),
      'viewed_summary', (SELECT count(*) FROM sess WHERE summary_at IS NOT NULL),
      'gave_contact', (SELECT count(*) FROM sess WHERE submitted_at IS NOT NULL),
      'deposit_paid', (SELECT count(*) FROM public.payments p
                        WHERE p.created_at >= p_start AND p.created_at < p_end
                          AND p.status IN ('paid', 'succeeded', 'completed'))
    ),
    'optional_steps', jsonb_build_object(
      'options_configured', (SELECT count(*) FROM sess WHERE options_at IS NOT NULL),
      'trade_in_entered', (SELECT count(*) FROM sess WHERE trade_at IS NOT NULL),
      'installation_configured', (SELECT count(*) FROM sess WHERE install_at IS NOT NULL),
      'package_selected', (SELECT count(*) FROM sess WHERE package_at IS NOT NULL),
      'boat_info_completed', (SELECT count(*) FROM sess WHERE boat_at IS NOT NULL),
      'promo_selected', (SELECT count(*) FROM sess WHERE promo_at IS NOT NULL)
    ),
    'saw_price_walked', jsonb_build_object(
      'count', (SELECT count(*) FROM sess WHERE summary_at IS NOT NULL AND submitted_at IS NULL),
      'motors', (
        SELECT coalesce(jsonb_agg(jsonb_build_object('model', model, 'count', c)), '[]'::jsonb)
        FROM (
          SELECT coalesce(motor_model, 'Unknown') AS model, count(*) AS c
          FROM sess WHERE summary_at IS NOT NULL AND submitted_at IS NULL
          GROUP BY 1 ORDER BY 2 DESC LIMIT 5
        ) w
      ),
      'anonymous_pdf_downloads', (
        SELECT count(*) FROM public.saved_quotes s
        WHERE s.created_at >= p_start AND s.created_at < p_end
          AND s.email = 'pdf-download@placeholder.com'
      )
    ),
    'blog_to_builder', jsonb_build_object(
      'blog_sessions', (SELECT count(*) FROM sess WHERE first_blog_at IS NOT NULL),
      'blog_sessions_started_quote', (SELECT count(*) FROM sess WHERE first_blog_at IS NOT NULL AND motor_at IS NOT NULL AND motor_at > first_blog_at),
      'top_posts', (
        SELECT coalesce(jsonb_agg(jsonb_build_object('path', path, 'sessions', c)), '[]'::jsonb)
        FROM (
          SELECT first_blog_path AS path, count(*) AS c
          FROM sess
          WHERE first_blog_at IS NOT NULL AND motor_at IS NOT NULL AND motor_at > first_blog_at
          GROUP BY 1 ORDER BY 2 DESC LIMIT 5
        ) b
      )
    ),
    'quotes', jsonb_build_object(
      'real_count', (SELECT count(*) FROM q_real),
      'real_value', (SELECT coalesce(sum(final_price), 0) FROM q_real),
      'real_avg', (SELECT coalesce(round(avg(final_price)), 0) FROM q_real),
      'hot_leads', (
        SELECT coalesce(jsonb_agg(jsonb_build_object('name', customer_name, 'email', customer_email, 'value', final_price, 'score', lead_score)), '[]'::jsonb)
        FROM (SELECT * FROM q_real WHERE coalesce(lead_score, 0) >= 70 ORDER BY lead_score DESC LIMIT 10) h
      ),
      'agent_count', (SELECT count(*) FROM q_agent),
      'agent_value', (SELECT coalesce(sum(final_price), 0) FROM q_agent),
      'prev_count', (SELECT n FROM prev),
      'prev_value', (SELECT v FROM prev),
      'top_models', (
        SELECT coalesce(jsonb_agg(jsonb_build_object('model', model, 'count', c)), '[]'::jsonb)
        FROM (SELECT model, count(*) AS c FROM q_real_models GROUP BY 1 ORDER BY 2 DESC LIMIT 5) tm
      )
    ),
    'leads', jsonb_build_object(
      'quotes', (
        SELECT coalesce(jsonb_agg(jsonb_build_object('name', customer_name, 'email', customer_email, 'motor', coalesce(quote_data #>> '{items,0,name}', 'n/a'), 'value', final_price, 'at', created_at)), '[]'::jsonb)
        FROM (SELECT * FROM q_real ORDER BY created_at DESC LIMIT 25) r
      ),
      'trade_valuations', (
        SELECT coalesce(jsonb_agg(jsonb_build_object('name', customer_name, 'email', customer_email, 'motor', concat_ws(' ', motor_year::text, motor_brand, motor_model), 'value', private_sale_value, 'at', created_at)), '[]'::jsonb)
        FROM (SELECT * FROM public.trade_valuation_leads WHERE created_at >= p_start AND created_at < p_end AND status = 'new' ORDER BY created_at DESC LIMIT 25) l
      ),
      'saved_quotes', (
        SELECT coalesce(jsonb_agg(jsonb_build_object('name', '', 'email', email, 'motor', '', 'value', deposit_amount, 'at', created_at)), '[]'::jsonb)
        FROM (SELECT * FROM public.saved_quotes WHERE created_at >= p_start AND created_at < p_end AND NOT public.weekly_report_is_test_email(email) ORDER BY created_at DESC LIMIT 25) s
      ),
      'financing_applications', (
        SELECT coalesce(jsonb_agg(jsonb_build_object('name', concat_ws(' ', applicant_data ->> 'firstName', applicant_data ->> 'lastName'), 'email', applicant_data ->> 'email', 'motor', purchase_data ->> 'motorModel', 'value', (purchase_data ->> 'amountToFinance'), 'at', created_at)), '[]'::jsonb)
        FROM (SELECT * FROM public.financing_applications WHERE created_at >= p_start AND created_at < p_end ORDER BY created_at DESC LIMIT 25) f
      ),
      'contact_inquiries', (
        SELECT coalesce(jsonb_agg(jsonb_build_object('name', name, 'email', email, 'motor', inquiry_type, 'value', NULL, 'at', created_at)), '[]'::jsonb)
        FROM (SELECT * FROM public.contact_inquiries WHERE created_at >= p_start AND created_at < p_end ORDER BY created_at DESC LIMIT 25) c
      ),
      'chats', (
        SELECT coalesce(jsonb_agg(jsonb_build_object('name', customer_name, 'email', customer_phone, 'motor', channel, 'value', NULL, 'at', created_at)), '[]'::jsonb)
        FROM (SELECT * FROM public.chat_conversations WHERE created_at >= p_start AND created_at < p_end AND (customer_phone IS NOT NULL OR customer_name IS NOT NULL) ORDER BY created_at DESC LIMIT 25) ch
      ),
      'voice_callbacks', (
        SELECT coalesce(jsonb_agg(jsonb_build_object('name', customer_name, 'email', customer_phone, 'motor', motor_interest, 'value', NULL, 'at', created_at)), '[]'::jsonb)
        FROM (SELECT * FROM public.voice_callbacks WHERE created_at >= p_start AND created_at < p_end ORDER BY created_at DESC LIMIT 25) v
      ),
      'deposits', (
        SELECT coalesce(jsonb_agg(jsonb_build_object('name', customer_name, 'email', customer_email, 'motor', description, 'value', round(amount_cents / 100.0), 'at', created_at)), '[]'::jsonb)
        FROM (SELECT * FROM public.payments WHERE created_at >= p_start AND created_at < p_end AND status IN ('paid', 'succeeded', 'completed') ORDER BY created_at DESC LIMIT 25) p
      )
    ),
    'trend', (
      SELECT jsonb_agg(public.weekly_report_week_core(p_start - (i * (p_end - p_start)), p_end - (i * (p_end - p_start))) ORDER BY i DESC)
      FROM generate_series(0, 3) AS i
    )
  );
$$;

REVOKE ALL ON FUNCTION public.weekly_report_metrics(timestamptz, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.weekly_report_week_core(timestamptz, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.weekly_report_test_sessions(timestamptz, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.weekly_report_metrics(timestamptz, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.weekly_report_week_core(timestamptz, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.weekly_report_test_sessions(timestamptz, timestamptz) TO service_role;
